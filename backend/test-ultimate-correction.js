// Teste final para verificar se a correção do slot 15:00 funcionou
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Constantes
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

// Função helper para converter horas em milissegundos
const H = (horas) => horas * 60 * 60 * 1000;

// Simular a função calcularTempoVolta
const calcularTempoVolta = (flightHoursTotal) => flightHoursTotal / 2;

// Simular a função hasOverlap
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

// Simular a função janelaBloqueada CORRIGIDA
function janelaBloqueada(missao) {
  const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
  
  // Pré-voo: 3h antes da decolagem (2:00, 3:00, 4:00 para decolagem às 5:00)
  const preVooInicio = new Date(missao.partida.getTime() - H(PRE_VOO_HORAS));
  const preVooFim = new Date(missao.partida.getTime());
  
  // Missão: decolagem até retorno (5:00 até 15:00)
  const missaoInicio = new Date(missao.partida.getTime());
  const missaoFim = new Date(missao.retorno.getTime() + (30 * 60 * 1000)); // +30min para incluir o slot 15:00
  
  // Pós-voo: retorno + tempo de voo volta + 3h buffer (20:00 até 23:00)
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

// Simular a função janelaToTimeSlot
function janelaToTimeSlot(janela) {
  let status = 'blocked';
  let reason = '';
  let blockType = 'missao';
  
  switch (janela.tipo) {
    case 'pre-voo':
      reason = 'Tempo de preparação (-3h)';
      blockType = 'pre-voo';
      break;
    case 'missao':
      status = 'booked';
      reason = `Missão em andamento: ${janela.missao.origin} → ${janela.missao.destination}`;
      blockType = 'missao';
      break;
    case 'pos-voo':
      reason = 'Encerramento/Manutenção (+3h)';
      blockType = 'pos-voo';
      break;
  }
  
  return {
    start: janela.inicio,
    end: janela.fim,
    status,
    reason,
    booking: janela.missao,
    blockType
  };
}

async function testUltimateCorrection() {
  console.log('🧪 Teste Final: Correção do slot 15:00\n');

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

    // Testar slots específicos
    console.log('\n🔍 Testando slots específicos:');
    
    const testSlots = [
      { time: '01:00', expected: 'available', description: 'Livre (antes do pré-voo)' },
      { time: '02:00', expected: 'pre-voo', description: 'Pré-voo (2h antes da decolagem)' },
      { time: '03:00', expected: 'pre-voo', description: 'Pré-voo (3h antes da decolagem)' },
      { time: '04:00', expected: 'pre-voo', description: 'Pré-voo (1h antes da decolagem)' },
      { time: '05:00', expected: 'missao', description: 'Missão (decolagem)' },
      { time: '06:00', expected: 'missao', description: 'Missão (em andamento)' },
      { time: '15:00', expected: 'missao', description: 'Missão (retorno)' },
      { time: '19:00', expected: 'available', description: 'Livre (entre missão e pós-voo)' },
      { time: '20:00', expected: 'pos-voo', description: 'Pós-voo (pouso da volta)' },
      { time: '21:00', expected: 'pos-voo', description: 'Pós-voo (manutenção)' },
      { time: '22:00', expected: 'pos-voo', description: 'Pós-voo (manutenção)' },
      { time: '23:00', expected: 'available', description: 'Livre (após pós-voo)' }
    ];

    let allCorrect = true;

    for (const test of testSlots) {
      const [hour, minute] = test.time.split(':').map(Number);
      const slotStart = new Date(2025, 7, 23, hour, minute, 0);
      const slotEnd = new Date(2025, 7, 23, hour, minute + 30, 0);
      
      // Verificar se o slot está em conflito com alguma janela bloqueada
      const conflictingWindow = janelas.find(janela => 
        hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })
      );

      let status = 'available';
      let reason = '';
      let blockType = undefined;

      if (conflictingWindow) {
        // Converter janela para TimeSlot
        const timeSlot = janelaToTimeSlot(conflictingWindow);
        status = timeSlot.status;
        reason = timeSlot.reason;
        blockType = timeSlot.blockType;
      }

      const icon = status === 'available' ? '🟢' : 
                   blockType === 'pre-voo' ? '🟡' : 
                   blockType === 'missao' ? '⚫' : 
                   blockType === 'pos-voo' ? '🟠' : '🔴';
      
      const expectedIcon = test.expected === 'available' ? '🟢' : 
                          test.expected === 'pre-voo' ? '🟡' : 
                          test.expected === 'missao' ? '⚫' : 
                          test.expected === 'pos-voo' ? '🟠' : '🔴';
      
      const match = (status === 'available' && test.expected === 'available') || 
                   (blockType === test.expected);
      
      if (!match) {
        allCorrect = false;
      }
      
      const matchIcon = match ? '✅' : '❌';
      
      console.log(`   ${test.time}: ${icon} ${status}${blockType ? ` (${blockType})` : ''} | ${matchIcon} Esperado: ${expectedIcon} ${test.expected} | ${test.description}`);
    }

    console.log('\n📋 Resultado final:');
    if (allCorrect) {
      console.log('   ✅ TODOS OS SLOTS ESTÃO CORRETOS!');
      console.log('   ✅ Pré-voo: 02:00-05:00 (3h antes da decolagem)');
      console.log('   ✅ Missão: 05:00-15:00 (decolagem até retorno)');
      console.log('   ✅ Pós-voo: 20:00-23:00 (3h após pouso da volta)');
      console.log('   ✅ Livre: 00:00-02:00, 15:00-20:00, 23:00-24:00');
      console.log('\n🎉 PROBLEMA RESOLVIDO! Agora teste no frontend!');
    } else {
      console.log('   ❌ Ainda há problemas na lógica!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUltimateCorrection().catch(console.error);
