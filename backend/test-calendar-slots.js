// Script para testar os slots do calendário
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simular as funções do backend
const H = (hours) => hours * 60 * 60 * 1000;
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

function calcularTempoVolta(flightHours) {
  return flightHours / 2;
}

function janelaBloqueada(m) {
  const tVoltaMs = calcularTempoVolta(m.flightHoursTotal) * H(1);
  
  // Pré-voo: 3h antes da decolagem
  const preVooInicio = new Date(m.partida.getTime() - H(PRE_VOO_HORAS));
  const preVooFim = new Date(m.partida.getTime());
  
  // Missão: decolagem até retorno
  const missaoInicio = new Date(m.partida.getTime());
  const missaoFim = new Date(m.retorno.getTime() + (30 * 60 * 1000)); // +30min para incluir o slot
  
  // Pós-voo: retorno + tempo de voo volta + 3h buffer
  const pousoVolta = new Date(m.retorno.getTime() + tVoltaMs);
  const posVooInicio = new Date(pousoVolta.getTime());
  const posVooFim = new Date(pousoVolta.getTime() + H(POS_VOO_HORAS));
  
  return [
    { inicio: preVooInicio, fim: preVooFim, tipo: 'pre-voo', missao: m },
    { inicio: missaoInicio, fim: missaoFim, tipo: 'missao', missao: m },
    { inicio: posVooInicio, fim: posVooFim, tipo: 'pos-voo', missao: m }
  ];
}

function calcularJanelasBloqueadas(missoes) {
  const todasJanelas = [];
  missoes.forEach(missao => {
    const janelas = janelaBloqueada(missao);
    todasJanelas.push(...janelas);
  });
  return todasJanelas;
}

function hasOverlap(interval1, interval2) {
  const slotStart = interval1.start;
  const slotEnd = interval1.end;
  const windowStart = interval2.start;
  const windowEnd = interval2.end;
  
  return (slotStart >= windowStart && slotStart < windowEnd) ||
         (slotEnd > windowStart && slotEnd <= windowEnd) ||
         (slotStart <= windowStart && slotEnd >= windowEnd);
}

async function testCalendarSlots() {
  console.log('🧪 TESTANDO SLOTS DO CALENDÁRIO');
  console.log('================================');

  try {
    // Buscar a missão 8036
    const mission = await prisma.booking.findUnique({
      where: { id: 8036 }
    });

    if (!mission) {
      console.log('❌ Missão #8036 não encontrada');
      return;
    }

    console.log('🔍 Missão encontrada:', {
      id: mission.id,
      origin: mission.origin,
      destination: mission.destination,
      departure_date: mission.departure_date,
      return_date: mission.return_date,
      actual_departure_date: mission.actual_departure_date,
      actual_return_date: mission.actual_return_date,
      flight_hours: mission.flight_hours
    });

    // Converter para interface Missao
    const missao = {
      id: mission.id,
      partida: new Date(mission.departure_date),
      retorno: new Date(mission.return_date),
      flightHoursTotal: mission.flight_hours,
      origin: mission.origin,
      destination: mission.destination
    };

    // Calcular janelas bloqueadas
    const janelas = janelaBloqueada(missao);
    
    console.log('\n📊 JANELAS BLOQUEADAS:');
    janelas.forEach((janela, index) => {
      console.log(`${index + 1}. ${janela.tipo.toUpperCase()}:`);
      console.log(`   Início: ${janela.inicio.toLocaleString('pt-BR')}`);
      console.log(`   Fim: ${janela.fim.toLocaleString('pt-BR')}`);
      console.log(`   Duração: ${((janela.fim - janela.inicio) / (60 * 60 * 1000)).toFixed(2)}h`);
    });

    // Testar slots específicos
    console.log('\n🎯 TESTANDO SLOTS ESPECÍFICOS:');
    
    const testSlots = [
      { time: '02:00', expected: 'pre-voo' },
      { time: '03:00', expected: 'pre-voo' },
      { time: '04:00', expected: 'pre-voo' },
      { time: '05:00', expected: 'missao' },
      { time: '06:00', expected: 'missao' },
      { time: '19:00', expected: 'missao' },
      { time: '20:00', expected: 'pos-voo' },
      { time: '21:00', expected: 'pos-voo' },
      { time: '22:00', expected: 'pos-voo' },
      { time: '23:00', expected: 'pos-voo' }
    ];

    testSlots.forEach(test => {
      const [hour, minute] = test.time.split(':').map(Number);
      const slotStart = new Date(mission.departure_date);
      slotStart.setHours(hour, minute, 0, 0);
      
      const slotEnd = new Date(slotStart.getTime() + (30 * 60 * 1000));
      
      const conflictingWindow = janelas.find(janela => 
        hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })
      );

      const actual = conflictingWindow ? conflictingWindow.tipo : 'available';
      const status = actual === test.expected ? '✅' : '❌';
      
      console.log(`${status} ${test.time}: esperado=${test.expected}, atual=${actual}`);
    });

  } catch (error) {
    console.error('❌ Erro ao testar slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCalendarSlots().catch(console.error);
