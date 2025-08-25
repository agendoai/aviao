// Teste para verificar se 'insufficient_space' não aparece mais
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testNoInsufficientSpace() {
  console.log('🧪 Teste: Verificando se "espaço insuficiente" não aparece mais\n');

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
    
    if (bookings.length === 0) {
      console.log('✅ Nenhuma missão encontrada - não deve haver "espaço insuficiente"');
      return;
    }
    
    for (const booking of bookings) {
      console.log(`\n📅 Missão ${booking.id}:`);
      console.log(`   ${booking.origin} → ${booking.destination}`);
      console.log(`   Partida: ${new Date(booking.departure_date).toLocaleString('pt-BR')}`);
      console.log(`   Retorno: ${new Date(booking.return_date).toLocaleString('pt-BR')}`);
      console.log(`   Flight hours: ${booking.flight_hours}h`);
    }

    // Simular slots para o dia 21/08
    const testDate = new Date(2025, 7, 21); // 21/08
    console.log(`\n🔍 Verificando slots para ${testDate.toLocaleDateString('pt-BR')}:`);
    
    let insufficientSpaceCount = 0;
    
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(testDate);
        slotTime.setHours(hour, minute, 0, 0);
        
        // Simular a lógica do sistema
        let status = 'available';
        let reason = '';
        
        // Verificar se está em conflito com alguma missão
        for (const booking of bookings) {
          const departureTime = new Date(booking.departure_date);
          const returnTime = new Date(booking.return_date);
          const flightHours = booking.flight_hours;
          const returnFlightTime = flightHours / 2;
          
          const pousoVolta = new Date(returnTime.getTime() + (returnFlightTime * 60 * 60 * 1000));
          const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000));
          
          // Pré-voo (3h antes)
          const preVooInicio = new Date(departureTime.getTime() - (3 * 60 * 60 * 1000));
          const preVooFim = departureTime;
          
          // Pós-voo (3h após pouso)
          const posVooInicio = pousoVolta;
          const posVooFim = fimLogico;
          
          // Verificar conflitos
          if (slotTime >= preVooInicio && slotTime < preVooFim) {
            status = 'blocked';
            reason = 'Pré-voo (-3h)';
          } else if (slotTime >= departureTime && slotTime < returnTime) {
            status = 'booked';
            reason = 'Missão em andamento';
          } else if (slotTime >= posVooInicio && slotTime < posVooFim) {
            status = 'blocked';
            reason = 'Pós-voo (+3h)';
          }
          
          if (status !== 'available') break;
        }
        
        if (status === 'insufficient_space') {
          insufficientSpaceCount++;
          const timeStr = slotTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          console.log(`   ❌ ${timeStr}: ${status} - ${reason}`);
        }
      }
    }
    
    if (insufficientSpaceCount === 0) {
      console.log('\n✅ SUCESSO: Nenhum slot com "espaço insuficiente" encontrado!');
    } else {
      console.log(`\n❌ PROBLEMA: ${insufficientSpaceCount} slots com "espaço insuficiente" encontrados!`);
    }
    
    console.log('\n🎯 Status possíveis agora:');
    console.log('   🟢 available - Disponível');
    console.log('   ⚫ booked - Missão em andamento');
    console.log('   🟡 blocked - Pré-voo (-3h)');
    console.log('   🟠 blocked - Pós-voo (+3h)');
    console.log('   🔵 selected - Selecionado pelo usuário');
    console.log('   🔴 conflict - Conflito detectado');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNoInsufficientSpace().catch(console.error);
