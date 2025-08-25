// Teste específico para verificar o cálculo do pré-voo da missão 8030
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPreVooCalculation() {
  console.log('🧪 Teste: Verificando cálculo do pré-voo da missão 8030\n');

  try {
    // Buscar a missão específica
    const booking = await prisma.booking.findUnique({
      where: { id: 8030 },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    if (!booking) {
      console.log('❌ Missão 8030 não encontrada');
      return;
    }

    console.log('📅 Missão encontrada:');
    console.log(`   ID: ${booking.id}`);
    console.log(`   ${booking.origin} → ${booking.destination}`);
    console.log(`   Partida: ${new Date(booking.departure_date).toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${new Date(booking.return_date).toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${booking.flight_hours}h`);

    // Simular a lógica do missionValidator
    const partida = new Date(booking.departure_date);
    const retorno = new Date(booking.return_date);
    const flightHours = booking.flight_hours;
    
    console.log('\n🔍 Cálculos:');
    console.log(`   Partida: ${partida.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${retorno.toLocaleString('pt-BR')}`);
    
    // Pré-voo: 3h antes da decolagem
    const preVooInicio = new Date(partida.getTime() - (3 * 60 * 60 * 1000));
    const preVooFim = new Date(partida.getTime());
    
    console.log('\n⏰ Pré-voo (deveria ser):');
    console.log(`   Início: ${preVooInicio.toLocaleString('pt-BR')}`);
    console.log(`   Fim: ${preVooFim.toLocaleString('pt-BR')}`);
    console.log(`   Duração: 3 horas ANTES da decolagem`);
    
    // Missão
    const missaoInicio = new Date(partida.getTime());
    const missaoFim = new Date(retorno.getTime());
    
    console.log('\n✈️ Missão:');
    console.log(`   Início: ${missaoInicio.toLocaleString('pt-BR')}`);
    console.log(`   Fim: ${missaoFim.toLocaleString('pt-BR')}`);
    
    // Pós-voo
    const tVolta = flightHours / 2; // 1h / 2 = 0.5h
    const pousoVolta = new Date(retorno.getTime() + (tVolta * 60 * 60 * 1000));
    const posVooInicio = new Date(pousoVolta.getTime());
    const posVooFim = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000));
    
    console.log('\n🔧 Pós-voo:');
    console.log(`   Tempo de volta: ${tVolta}h`);
    console.log(`   Pouso da volta: ${pousoVolta.toLocaleString('pt-BR')}`);
    console.log(`   Início: ${posVooInicio.toLocaleString('pt-BR')}`);
    console.log(`   Fim: ${posVooFim.toLocaleString('pt-BR')}`);
    
    // Verificar slots específicos
    console.log('\n🔍 Verificando slots específicos:');
    
    const testSlots = [
      { time: '10:00', expected: 'pre-voo' },
      { time: '11:00', expected: 'pre-voo' },
      { time: '12:00', expected: 'pre-voo' },
      { time: '13:00', expected: 'missao' },
      { time: '14:00', expected: 'missao' },
      { time: '15:00', expected: 'missao' },
      { time: '16:00', expected: 'missao' },
      { time: '17:00', expected: 'missao' },
      { time: '18:00', expected: 'missao' },
      { time: '19:00', expected: 'missao' },
      { time: '20:00', expected: 'missao' },
      { time: '21:00', expected: 'missao' },
      { time: '21:30', expected: 'pos-voo' },
      { time: '22:00', expected: 'pos-voo' },
      { time: '23:00', expected: 'pos-voo' },
      { time: '00:00', expected: 'pos-voo' }
    ];
    
    for (const test of testSlots) {
      const [hour, minute] = test.time.split(':').map(Number);
      const slotTime = new Date(partida);
      slotTime.setHours(hour, minute, 0, 0);
      
      let status = 'available';
      let reason = '';
      
      if (slotTime >= preVooInicio && slotTime < preVooFim) {
        status = 'pre-voo';
        reason = 'Tempo de preparação (-3h)';
      } else if (slotTime >= missaoInicio && slotTime < missaoFim) {
        status = 'missao';
        reason = 'Missão em andamento';
      } else if (slotTime >= posVooInicio && slotTime < posVooFim) {
        status = 'pos-voo';
        reason = 'Encerramento/Manutenção (+3h)';
      }
      
      const icon = status === 'pre-voo' ? '🟡' : 
                   status === 'missao' ? '⚫' : 
                   status === 'pos-voo' ? '🟠' : '🟢';
      
      console.log(`   ${icon} ${test.time}: ${status} - ${reason}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPreVooCalculation().catch(console.error);
