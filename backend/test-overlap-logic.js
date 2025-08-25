// Teste específico para verificar a lógica de sobreposição
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Constantes
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

// Função helper para converter horas em milissegundos
const H = (horas) => horas * 60 * 60 * 1000;

// Simular a função hasOverlap
const hasOverlap = (interval1, interval2) => {
  return interval1.start < interval2.end && interval2.start < interval1.end;
};

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

async function testOverlapLogic() {
  console.log('🧪 Teste: Lógica de sobreposição\n');

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

    // Calcular janelas bloqueadas
    const janelas = janelaBloqueada(novaMissao);
    
    console.log('\n🟡 Janelas bloqueadas:');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Testar slots específicos
    console.log('\n🔍 Testando sobreposição de slots:');
    const testSlots = [
      { time: '04:00', expected: 'pre-voo' },
      { time: '05:00', expected: 'pre-voo' },
      { time: '06:00', expected: 'pre-voo' },
      { time: '07:00', expected: 'missao' },
      { time: '08:00', expected: 'missao' },
      { time: '15:00', expected: 'missao' },
      { time: '19:00', expected: 'pos-voo' },
      { time: '20:00', expected: 'pos-voo' }
    ];

    for (const test of testSlots) {
      const [hour, minute] = test.time.split(':').map(Number);
      const slotStart = new Date(2025, 7, 22, hour, minute, 0);
      const slotEnd = new Date(2025, 7, 22, hour, minute + 30, 0);
      
      console.log(`\n   Testando slot ${test.time}:`);
      console.log(`     Slot: ${slotStart.toLocaleString('pt-BR')} - ${slotEnd.toLocaleString('pt-BR')}`);
      
      let found = false;
      
      for (const janela of janelas) {
        const overlap = hasOverlap(
          { start: slotStart, end: slotEnd },
          { start: janela.inicio, end: janela.fim }
        );
        
        console.log(`     Janela ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')} | Overlap: ${overlap ? 'SIM' : 'NÃO'}`);
        
        if (overlap) {
          const icon = janela.tipo === 'pre-voo' ? '🟡' : 
                       janela.tipo === 'missao' ? '⚫' : 
                       janela.tipo === 'pos-voo' ? '🟠' : '🔴';
          
          const expectedIcon = test.expected === 'pre-voo' ? '🟡' : 
                              test.expected === 'missao' ? '⚫' : 
                              test.expected === 'pos-voo' ? '🟠' : '🔴';
          
          const match = janela.tipo === test.expected ? '✅' : '❌';
          
          console.log(`     ${match} Resultado: ${icon} ${janela.tipo} | Esperado: ${expectedIcon} ${test.expected}`);
          found = true;
          break;
        }
      }
      
      if (!found) {
        console.log(`     ❌ Nenhuma sobreposição encontrada | Esperado: ${test.expected}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOverlapLogic().catch(console.error);
