// Teste para verificar nova missão às 7:00
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Constantes
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

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

async function testNewMission7am() {
  console.log('🧪 Teste: Nova missão às 7:00\n');

  try {
    // Simular uma nova missão às 7:00
    const novaMissao = {
      id: 'nova',
      partida: new Date(2025, 7, 22, 7, 0, 0), // 22/08 às 7:00
      retorno: new Date(2025, 7, 22, 15, 0, 0), // 22/08 às 15:00 (8h de missão)
      flightHoursTotal: 8,
      origin: 'SBAU',
      destination: 'SBBS'
    };

    console.log('📅 Nova missão simulada:');
    console.log(`   Partida: ${novaMissao.partida.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${novaMissao.retorno.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${novaMissao.flightHoursTotal}h`);

    // Calcular janelas bloqueadas
    const janelas = janelaBloqueada(novaMissao);
    
    console.log('\n🟡 Janelas bloqueadas da nova missão:');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Testar slots específicos
    console.log('\n🔍 Testando slots específicos:');
    const testSlots = [
      { time: '03:00', expected: 'available' },
      { time: '04:00', expected: 'pre-voo' },
      { time: '05:00', expected: 'pre-voo' },
      { time: '06:00', expected: 'pre-voo' },
      { time: '07:00', expected: 'missao' },
      { time: '08:00', expected: 'missao' },
      { time: '09:00', expected: 'missao' },
      { time: '10:00', expected: 'missao' },
      { time: '11:00', expected: 'missao' },
      { time: '12:00', expected: 'missao' },
      { time: '13:00', expected: 'missao' },
      { time: '14:00', expected: 'missao' },
      { time: '15:00', expected: 'missao' },
      { time: '15:30', expected: 'pos-voo' },
      { time: '16:00', expected: 'pos-voo' },
      { time: '17:00', expected: 'pos-voo' },
      { time: '18:00', expected: 'pos-voo' }
    ];

    for (const test of testSlots) {
      const [hour, minute] = test.time.split(':').map(Number);
      const slotTime = new Date(novaMissao.partida);
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
    const timezoneOffset = novaMissao.partida.getTimezoneOffset();
    console.log(`   Timezone offset: ${timezoneOffset} minutos`);
    console.log(`   Isso significa: ${timezoneOffset > 0 ? 'UTC+' : 'UTC-'}${Math.abs(timezoneOffset/60)}h`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewMission7am().catch(console.error);
