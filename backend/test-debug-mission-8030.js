// Teste específico para debugar a missão 8030
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Constantes
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;
const PROXIMA_MISSAO_HORAS = 3;

// Função helper para converter horas em milissegundos
const H = (horas) => horas * 60 * 60 * 1000;

// Simular a função janelaBloqueada
function janelaBloqueada(missao) {
  const tVoltaMs = (missao.flightHoursTotal / 2) * H(1);
  
  // Pré-voo: 3h antes da decolagem
  const preVooInicio = new Date(missao.partida.getTime() - H(PRE_VOO_HORAS));
  const preVooFim = new Date(missao.partida.getTime());
  
  // Missão: decolagem até retorno
  const missaoInicio = new Date(missao.partida.getTime());
  const missaoFim = new Date(missao.retorno.getTime());
  
  // Pós-voo: retorno + tempo de voo volta + 3h buffer
  const pousoVolta = new Date(missao.retorno.getTime() + tVoltaMs);
  const posVooInicio = new Date(pousoVolta.getTime());
  const posVooFim = new Date(pousoVolta.getTime() + H(POS_VOO_HORAS));
  
  return [
    {
      inicio: preVooInicio,
      fim: preVooFim,
      tipo: 'pre-voo',
      missao: missao
    },
    {
      inicio: missaoInicio,
      fim: missaoFim,
      tipo: 'missao',
      missao: missao
    },
    {
      inicio: posVooInicio,
      fim: posVooFim,
      tipo: 'pos-voo',
      missao: missao
    }
  ];
}

async function testDebugMission8030() {
  console.log('🧪 Teste: Debug da missão 8030\n');

  try {
    // Buscar a missão específica
    const booking = await prisma.booking.findUnique({
      where: { id: 8030 }
    });

    if (!booking) {
      console.log('❌ Missão 8030 não encontrada');
      return;
    }

    console.log('📅 Dados da missão:');
    console.log(`   ID: ${booking.id}`);
    console.log(`   ${booking.origin} → ${booking.destination}`);
    console.log(`   Partida (raw): ${booking.departure_date}`);
    console.log(`   Retorno (raw): ${booking.return_date}`);
    console.log(`   Flight hours: ${booking.flight_hours}h`);

    // Converter para interface Missao
    const missao = {
      id: booking.id,
      partida: new Date(booking.departure_date),
      retorno: new Date(booking.return_date),
      flightHoursTotal: booking.flight_hours,
      origin: booking.origin,
      destination: booking.destination
    };

    console.log('\n🔍 Datas convertidas:');
    console.log(`   Partida: ${missao.partida.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${missao.retorno.toLocaleString('pt-BR')}`);

    // Calcular janelas bloqueadas
    const janelas = janelaBloqueada(missao);
    
    console.log('\n🟡 Janelas bloqueadas calculadas:');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Testar slots específicos
    console.log('\n🔍 Testando slots específicos:');
    const testSlots = [
      { time: '09:00', expected: 'available' },
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
      { time: '23:00', expected: 'pos-voo' }
    ];

    for (const test of testSlots) {
      const [hour, minute] = test.time.split(':').map(Number);
      const slotTime = new Date(missao.partida);
      slotTime.setHours(hour, minute, 0, 0);
      
      let status = 'available';
      let reason = '';
      let blockType = '';
      
      // Verificar em qual janela o slot está
      for (const janela of janelas) {
        if (slotTime >= janela.inicio && slotTime < janela.fim) {
          switch (janela.tipo) {
            case 'pre-voo':
              status = 'blocked';
              reason = 'Tempo de preparação (-3h)';
              blockType = 'pre-voo';
              break;
            case 'missao':
              status = 'booked';
              reason = 'Missão em andamento';
              blockType = 'missao';
              break;
            case 'pos-voo':
              status = 'blocked';
              reason = 'Encerramento/Manutenção (+3h)';
              blockType = 'pos-voo';
              break;
          }
          break;
        }
      }
      
      const icon = status === 'available' ? '🟢' : 
                   blockType === 'pre-voo' ? '🟡' : 
                   blockType === 'missao' ? '⚫' : 
                   blockType === 'pos-voo' ? '🟠' : '🔴';
      
      const expectedIcon = test.expected === 'available' ? '🟢' : 
                          test.expected === 'pre-voo' ? '🟡' : 
                          test.expected === 'missao' ? '⚫' : 
                          test.expected === 'pos-voo' ? '🟠' : '🔴';
      
      const match = status === test.expected ? '✅' : '❌';
      
      console.log(`   ${match} ${test.time}: ${icon} ${status} (${blockType}) - ${reason} | Esperado: ${expectedIcon} ${test.expected}`);
    }

    // Verificar se há problema de timezone
    console.log('\n🔍 Verificando timezone:');
    const timezoneOffset = missao.partida.getTimezoneOffset();
    console.log(`   Timezone offset: ${timezoneOffset} minutos`);
    console.log(`   Isso significa: ${timezoneOffset > 0 ? 'UTC+' : 'UTC-'}${Math.abs(timezoneOffset/60)}h`);
    
    // Testar com diferentes interpretações de timezone
    console.log('\n🔍 Testando diferentes interpretações:');
    
    // Interpretação 1: UTC
    const partidaUTC = new Date(booking.departure_date);
    const preVooInicioUTC = new Date(partidaUTC.getTime() - H(PRE_VOO_HORAS));
    const preVooFimUTC = new Date(partidaUTC.getTime());
    
    console.log('   Interpretação UTC:');
    console.log(`     Pré-voo: ${preVooInicioUTC.toLocaleString('pt-BR')} - ${preVooFimUTC.toLocaleString('pt-BR')}`);
    
    // Interpretação 2: Local
    const partidaLocal = new Date(partidaUTC.getTime() - (timezoneOffset * 60 * 1000));
    const preVooInicioLocal = new Date(partidaLocal.getTime() - H(PRE_VOO_HORAS));
    const preVooFimLocal = new Date(partidaLocal.getTime());
    
    console.log('   Interpretação Local:');
    console.log(`     Pré-voo: ${preVooInicioLocal.toLocaleString('pt-BR')} - ${preVooFimLocal.toLocaleString('pt-BR')}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDebugMission8030().catch(console.error);
