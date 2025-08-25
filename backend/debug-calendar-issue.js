// Debug do problema do calendário
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugCalendarIssue() {
  console.log('🔍 Debug do problema do calendário\n');

  try {
    // Buscar TODAS as missões da aeronave 2 (PR-FOM)
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
      },
      orderBy: {
        departure_date: 'asc'
      }
    });

    console.log('📋 TODAS as missões encontradas:', bookings.length);
    
    if (bookings.length === 0) {
      console.log('✅ Nenhuma missão encontrada - o problema pode estar na lógica de geração de slots');
      return;
    }
    
    for (const booking of bookings) {
      console.log(`\n📅 Missão ${booking.id}:`);
      console.log(`   ${booking.origin} → ${booking.destination}`);
      console.log(`   Partida: ${new Date(booking.departure_date).toLocaleString('pt-BR')}`);
      console.log(`   Retorno: ${new Date(booking.return_date).toLocaleString('pt-BR')}`);
      console.log(`   Flight hours: ${booking.flight_hours}h`);
      console.log(`   Status: ${booking.status}`);
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

    // Verificar se há missões em dias diferentes
    const dates = [...new Set(bookings.map(b => new Date(b.departure_date).toDateString()))];
    console.log('\n📅 Dias com missões:', dates);
    
    // Verificar se há missões sobrepostas
    console.log('\n🔍 Verificando sobreposições:');
    for (let i = 0; i < bookings.length; i++) {
      for (let j = i + 1; j < bookings.length; j++) {
        const b1 = bookings[i];
        const b2 = bookings[j];
        
        const b1Start = new Date(b1.departure_date);
        const b1End = new Date(b1.blocked_until || b1.return_date);
        const b2Start = new Date(b2.departure_date);
        const b2End = new Date(b2.blocked_until || b2.return_date);
        
        if (b1Start < b2End && b2Start < b1End) {
          console.log(`   ⚠️ SOBREPOSIÇÃO: Missão ${b1.id} e ${b2.id}`);
          console.log(`      ${b1.id}: ${b1Start.toLocaleString('pt-BR')} - ${b1End.toLocaleString('pt-BR')}`);
          console.log(`      ${b2.id}: ${b2Start.toLocaleString('pt-BR')} - ${b2End.toLocaleString('pt-BR')}`);
        }
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugCalendarIssue().catch(console.error);
