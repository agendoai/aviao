// Teste da geração de slots de tempo
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTimeSlots() {
  console.log('🧪 Testando geração de slots de tempo\n');

  try {
    // Buscar missões existentes
    const bookings = await prisma.booking.findMany({
      where: {
        aircraftId: 2, // PR-FOM
        status: {
          in: ['pendente', 'confirmada', 'paga', 'blocked']
        }
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    console.log('📋 Missões encontradas:', bookings.length);
    
    for (const booking of bookings) {
      console.log(`\n📅 Missão ${booking.id}:`);
      console.log(`   ${booking.origin} → ${booking.destination}`);
      console.log(`   Partida: ${new Date(booking.departure_date).toLocaleString('pt-BR')}`);
      console.log(`   Retorno: ${new Date(booking.return_date).toLocaleString('pt-BR')}`);
      console.log(`   Flight hours: ${booking.flight_hours}h`);
      console.log(`   Blocked until: ${booking.blocked_until ? new Date(booking.blocked_until).toLocaleString('pt-BR') : 'N/A'}`);
    }

    // Simular geração de slots para o dia 21/08
    const weekStart = new Date(2025, 7, 18); // Segunda-feira 18/08
    console.log(`\n📅 Gerando slots para semana começando em: ${weekStart.toLocaleDateString('pt-BR')}`);

    // Simular slots de 30 em 30 minutos para o dia 21/08
    const testDate = new Date(2025, 7, 21); // 21/08
    console.log(`\n🔍 Slots para ${testDate.toLocaleDateString('pt-BR')}:`);
    
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(testDate);
        slotStart.setHours(hour, minute, 0, 0);
        
        const slotEnd = new Date(testDate);
        slotEnd.setHours(hour, minute + 30, 0, 0);

        // Verificar se o slot está em conflito com alguma missão
        let status = 'available';
        let reason = '';
        
        for (const booking of bookings) {
          const departureTime = new Date(booking.departure_date);
          const returnTime = new Date(booking.return_date);
          const blockedUntil = booking.blocked_until ? new Date(booking.blocked_until) : null;
          
          // Verificar se o slot está dentro da janela de bloqueio
          if (slotStart < blockedUntil && slotEnd > departureTime) {
            if (slotStart < departureTime) {
              status = 'blocked';
              reason = 'Pré-voo (-3h)';
            } else if (slotStart < returnTime) {
              status = 'booked';
              reason = 'Missão em andamento';
            } else if (slotStart < blockedUntil) {
              status = 'blocked';
              reason = 'Pós-voo (+3h)';
            }
            break;
          }
        }
        
        const timeStr = slotStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const statusIcon = status === 'available' ? '🟢' : status === 'booked' ? '⚫' : '🟠';
        console.log(`   ${timeStr}: ${statusIcon} ${status} - ${reason}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimeSlots().catch(console.error);
