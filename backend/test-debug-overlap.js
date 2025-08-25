// Teste específico para debugar a lógica de sobreposição
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Constantes
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

// Função helper para converter horas em milissegundos
const H = (horas) => horas * 60 * 60 * 1000;

// Simular a função calcularTempoVolta
const calcularTempoVolta = (flightHoursTotal) => flightHoursTotal / 2;

// Simular a função hasOverlap do backend
const hasOverlap = (interval1, interval2) => {
  // interval1 = slot (30min), interval2 = janela bloqueada
  const slotStart = interval1.start;
  const slotEnd = interval1.end;
  const windowStart = interval2.start;
  const windowEnd = interval2.end;
  
  // Slot sobrepõe se:
  // 1. Início do slot está dentro da janela (inclusive)
  // 2. Fim do slot está dentro da janela (inclusive)
  // 3. Slot contém a janela completamente
  return (slotStart >= windowStart && slotStart < windowEnd) ||
         (slotEnd > windowStart && slotEnd <= windowEnd) ||
         (slotStart <= windowStart && slotEnd >= windowEnd);
};

// Simular a função janelaBloqueada
function janelaBloqueada(missao) {
  const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
  
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

async function testDebugOverlap() {
  console.log('🧪 Teste: Debug da lógica de sobreposição\n');

  try {
    // Simular uma missão às 5:00 (como o usuário criou)
    const missao = {
      id: 'teste',
      partida: new Date(2025, 7, 23, 5, 0, 0), // 23/08 às 5:00
      retorno: new Date(2025, 7, 23, 15, 0, 0), // 23/08 às 15:00 (10h de missão)
      flightHoursTotal: 10,
      origin: 'SBAU',
      destination: 'SBAU'
    };

    console.log('📅 Missão de teste:');
    console.log(`   Partida: ${missao.partida.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${missao.retorno.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${missao.flightHoursTotal}h`);

    // Calcular janelas bloqueadas
    const janelas = janelaBloqueada(missao);
    
    console.log('\n🟡 Janelas bloqueadas calculadas:');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Testar slots específicos com debug detalhado
    console.log('\n🔍 Debug detalhado dos slots problemáticos:');
    
    const testSlots = [
      { time: '02:00', expected: 'available' },
      { time: '03:00', expected: 'available' },
      { time: '04:00', expected: 'pre-voo' },
      { time: '05:00', expected: 'missao' },
      { time: '15:00', expected: 'missao' },
      { time: '20:00', expected: 'pos-voo' }
    ];

    for (const test of testSlots) {
      const [hour, minute] = test.time.split(':').map(Number);
      const slotStart = new Date(2025, 7, 23, hour, minute, 0);
      const slotEnd = new Date(2025, 7, 23, hour, minute + 30, 0);
      
      console.log(`\n   🔍 Testando slot ${test.time}:`);
      console.log(`     Slot: ${slotStart.toLocaleString('pt-BR')} - ${slotEnd.toLocaleString('pt-BR')}`);
      
      // Verificar cada janela individualmente
      for (const janela of janelas) {
        const overlap = hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim });
        
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
          break;
        }
      }
      
      // Se não encontrou sobreposição
      const conflictingWindow = janelas.find(janela => 
        hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })
      );
      
      if (!conflictingWindow) {
        const expectedIcon = test.expected === 'available' ? '🟢' : '❌';
        const match = test.expected === 'available' ? '✅' : '❌';
        console.log(`     ${match} Resultado: 🟢 available | Esperado: ${expectedIcon} ${test.expected}`);
      }
    }

    console.log('\n📋 Análise dos problemas:');
    console.log('   ❌ 02:00 e 03:00: Estão sendo marcados como pré-voo quando deveriam ser livres');
    console.log('   ❌ 15:00: Está sendo marcado como livre quando deveria ser missão');
    console.log('   ✅ 04:00, 05:00, 20:00: Estão corretos');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDebugOverlap().catch(console.error);
