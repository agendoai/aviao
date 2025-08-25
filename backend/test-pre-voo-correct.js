// Teste específico para verificar pré-voo correto
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPreVooCorrect() {
  console.log('🔍 Teste específico: Pré-voo para missão às 05:00\n');

  try {
    // Buscar a missão às 05:00
    const mission = await prisma.booking.findFirst({
      where: {
        departure_date: {
          gte: new Date(2025, 7, 23, 5, 0, 0),
          lt: new Date(2025, 7, 23, 5, 1, 0)
        }
      },
      include: {
        aircraft: true
      }
    });

    if (!mission) {
      console.log('❌ Missão às 05:00 não encontrada');
      return;
    }

    console.log('📅 Missão encontrada:');
    console.log(`   ID: ${mission.id}`);
    console.log(`   Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${mission.flight_hours}`);

    // Simular a lógica de janelas bloqueadas
    const H = (horas) => horas * 60 * 60 * 1000;
    const PRE_VOO_HORAS = 3;
    const POS_VOO_HORAS = 3;
    
    const calcularTempoVolta = (flightHoursTotal) => flightHoursTotal / 2;
    
    const janelaBloqueada = (missao) => {
      const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
      
      // Pré-voo: 3h ANTES da decolagem (02:00, 03:00, 04:00 para decolagem às 05:00)
      const preVooInicio = new Date(missao.partida.getTime() - H(PRE_VOO_HORAS));
      const preVooFim = new Date(missao.partida.getTime());
      
      // Missão: decolagem até retorno (05:00 até 15:00)
      const missaoInicio = new Date(missao.partida.getTime());
      const missaoFim = new Date(missao.retorno.getTime() + (30 * 60 * 1000));
      
      // Pós-voo: retorno + tempo de voo volta + 3h buffer
      const pousoVolta = new Date(missao.retorno.getTime() + tVoltaMs);
      const posVooInicio = new Date(pousoVolta.getTime());
      const posVooFim = new Date(pousoVolta.getTime() + H(POS_VOO_HORAS));
      
      return [
        { inicio: preVooInicio, fim: preVooFim, tipo: 'pre-voo', missao },
        { inicio: missaoInicio, fim: missaoFim, tipo: 'missao', missao },
        { inicio: posVooInicio, fim: posVooFim, tipo: 'pos-voo', missao }
      ];
    };

    // Converter para formato Missao
    const missao = {
      partida: mission.departure_date,
      retorno: mission.return_date,
      flightHoursTotal: mission.flight_hours,
      id: mission.id,
      origin: mission.origin,
      destination: mission.destination
    };

    // Calcular janelas
    const janelas = janelaBloqueada(missao);
    
    console.log('\n🟡 Janelas calculadas:');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Testar slots específicos
    console.log('\n🔍 Testando slots específicos:');
    
    const testSlots = [
      { time: '01:00', expected: 'available', description: 'Livre (antes do pré-voo)' },
      { time: '02:00', expected: 'pre-voo', description: 'Pré-voo (3h antes da decolagem)' },
      { time: '03:00', expected: 'pre-voo', description: 'Pré-voo (2h antes da decolagem)' },
      { time: '04:00', expected: 'pre-voo', description: 'Pré-voo (1h antes da decolagem)' },
      { time: '05:00', expected: 'missao', description: 'Missão (decolagem)' },
      { time: '06:00', expected: 'missao', description: 'Missão (em andamento)' },
      { time: '15:00', expected: 'missao', description: 'Missão (retorno)' },
      { time: '18:30', expected: 'pos-voo', description: 'Pós-voo (pouso da volta)' },
      { time: '19:00', expected: 'pos-voo', description: 'Pós-voo (manutenção)' },
      { time: '21:00', expected: 'available', description: 'Livre (após pós-voo)' }
    ];

    const hasOverlap = (interval1, interval2) => {
      const slotStart = interval1.start;
      const slotEnd = interval1.end;
      const windowStart = interval2.start;
      const windowEnd = interval2.end;
      
      return (slotStart >= windowStart && slotStart < windowEnd) ||
             (slotEnd > windowStart && slotEnd <= windowEnd) ||
             (slotStart <= windowStart && slotEnd >= windowEnd);
    };

    const janelaToTimeSlot = (janela) => {
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
    };

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
      console.log('   ✅ PRÉ-VOO ESTÁ CORRETO!');
      console.log('   ✅ 02:00, 03:00, 04:00 = Pré-voo (3h ANTES da decolagem)');
      console.log('   ✅ 05:00 = Missão (decolagem)');
    } else {
      console.log('   ❌ PRÉ-VOO AINDA ESTÁ ERRADO!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPreVooCorrect().catch(console.error);
