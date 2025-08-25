// Teste do calendário corrigido
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFixedCalendar() {
  console.log('🧪 Testando calendário corrigido\n');

  try {
    // Buscar missões existentes
    const bookings = await prisma.booking.findMany({
      where: {
        aircraftId: 2, // PR-FOM
        status: {
          in: ['pendente', 'confirmada', 'paga']
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
      
      // Calcular janelas esperadas
      const departureTime = new Date(booking.departure_date);
      const returnTime = new Date(booking.return_date);
      const flightHours = booking.flight_hours;
      const returnFlightTime = flightHours / 2; // 30 min para 1h total
      
      const pousoVolta = new Date(returnTime.getTime() + (returnFlightTime * 60 * 60 * 1000));
      const blockedUntil = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // +3h
      
      console.log(`   📐 Cálculo esperado:`);
      console.log(`      Pouso volta: ${pousoVolta.toLocaleString('pt-BR')}`);
      console.log(`      Blocked until: ${blockedUntil.toLocaleString('pt-BR')}`);
      console.log(`      Próxima decolagem: ${new Date(blockedUntil.getTime() + (3 * 60 * 60 * 1000)).toLocaleString('pt-BR')}`);
    }

    // Simular slots para o dia 21/08 (onde há missão)
    const testDate = new Date(2025, 7, 21); // 21/08
    console.log(`\n🔍 Slots esperados para ${testDate.toLocaleDateString('pt-BR')}:`);
    
    // Missão 8029: 08:00-17:00, blocked until 20:33
    const missionStart = new Date(2025, 7, 21, 8, 0); // 08:00
    const missionEnd = new Date(2025, 7, 21, 17, 0); // 17:00
    const blockedUntil = new Date(2025, 7, 21, 20, 33); // 20:33
    
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(testDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        let status = '🟢 available';
        let reason = '';
        
        if (slotTime >= missionStart && slotTime < missionEnd) {
          status = '⚫ booked';
          reason = 'Missão em andamento';
        } else if (slotTime >= missionEnd && slotTime < blockedUntil) {
          status = '🟠 blocked';
          reason = 'Pós-voo (+3h)';
        }
        
        const timeStr = slotTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ${timeStr}: ${status} - ${reason}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedCalendar().catch(console.error);
