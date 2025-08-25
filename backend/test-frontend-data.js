// Testar exatamente o que o frontend está recebendo
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFrontendData() {
  console.log('🔍 Testando dados enviados para o frontend...\n');

  try {
    // Simular a função generateTimeSlots
    const aircraftId = 2; // PR-FOM
    const weekStart = new Date(2025, 7, 25); // 25/08/2025 (segunda-feira)
    
    console.log(`📅 Semana: ${weekStart.toLocaleDateString('pt-BR')}`);
    console.log(`✈️ Aeronave: ${aircraftId}\n`);

    // Buscar missões existentes
    const existingBookings = await prisma.booking.findMany({
      where: {
        aircraftId,
        status: {
          in: ['pendente', 'confirmada', 'paga', 'blocked']
        }
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    console.log(`📊 Missões encontradas: ${existingBookings.length}`);
    for (const booking of existingBookings) {
      console.log(`   ID: ${booking.id} - ${booking.departure_date.toLocaleString('pt-BR')} → ${booking.return_date.toLocaleString('pt-BR')} - ${booking.status}`);
    }
    console.log('');

    // Converter bookings para interface Missao
    const bookingToMissao = (booking) => {
      return {
        id: booking.id,
        partida: new Date(booking.departure_date),
        retorno: new Date(booking.return_date),
        flightHoursTotal: booking.flight_hours,
        origin: booking.origin,
        destination: booking.destination
      };
    };

    const missoesExistentes = existingBookings.map(bookingToMissao);
    
    // Funções necessárias
    const H = (horas) => horas * 60 * 60 * 1000;
    const PRE_VOO_HORAS = 3;
    const POS_VOO_HORAS = 3;
    
    const calcularTempoVolta = (flightHoursTotal) => flightHoursTotal / 2;
    
    const janelaBloqueada = (missao) => {
      const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
      
      // Pré-voo: 3h ANTES da decolagem
      const preVooInicio = new Date(missao.partida.getTime() - H(PRE_VOO_HORAS));
      const preVooFim = new Date(missao.partida.getTime());
      
      // Missão: decolagem até retorno
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

    const calcularJanelasBloqueadas = (missoes) => {
      const todasJanelas = [];
      for (const missao of missoes) {
        const janelas = janelaBloqueada(missao);
        todasJanelas.push(...janelas);
      }
      return todasJanelas;
    };

    // Calcular todas as janelas bloqueadas
    const todasJanelas = calcularJanelasBloqueadas(missoesExistentes);

    console.log('🟡 Janelas bloqueadas calculadas:');
    for (const janela of todasJanelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }
    console.log('');

    // Função hasOverlap
    const hasOverlap = (interval1, interval2) => {
      const slotStart = interval1.start;
      const slotEnd = interval1.end;
      const windowStart = interval2.start;
      const windowEnd = interval2.end;
      
      return (slotStart >= windowStart && slotStart < windowEnd) ||
             (slotEnd > windowStart && slotEnd <= windowEnd) ||
             (slotStart <= windowStart && slotEnd >= windowEnd);
    };

    // Função janelaToTimeSlot
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

    // Testar slots específicos que estão errados
    const slotsToTest = [
      { time: '07:00', expected: 'pre-voo' },
      { time: '07:30', expected: 'pre-voo' },
      { time: '08:00', expected: 'pre-voo' },
      { time: '08:30', expected: 'pre-voo' },
      { time: '09:00', expected: 'pre-voo' },
      { time: '09:30', expected: 'pre-voo' },
      { time: '10:00', expected: 'missao' },
      { time: '10:30', expected: 'missao' },
      { time: '11:00', expected: 'missao' },
      { time: '11:30', expected: 'missao' },
      { time: '12:00', expected: 'missao' },
      { time: '12:30', expected: 'missao' },
      { time: '13:00', expected: 'missao' },
      { time: '17:00', expected: 'missao' },
      { time: '17:30', expected: 'pos-voo' },
      { time: '20:00', expected: 'pos-voo' }
    ];

    console.log('🧪 Testando slots específicos:');
    for (const test of slotsToTest) {
      const [hour, minute] = test.time.split(':').map(Number);
      const slotStart = new Date(2025, 7, 25, hour, minute, 0, 0);
      const slotEnd = new Date(2025, 7, 25, hour, minute + 30, 0, 0);

      // Verificar se o slot está em conflito com alguma janela bloqueada
      const conflictingWindow = todasJanelas.find(janela => 
        hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })
      );

      let status = 'available';
      let reason = '';
      let blockType;

      if (conflictingWindow) {
        const timeSlot = janelaToTimeSlot(conflictingWindow);
        status = timeSlot.status;
        reason = timeSlot.reason;
        blockType = timeSlot.blockType;
      }

      const result = blockType || 'available';
      const isCorrect = result === test.expected;
      const icon = isCorrect ? '✅' : '❌';
      
      console.log(`   ${icon} ${test.time}: ${result} (esperado: ${test.expected}) - ${reason}`);
    }

    // Verificar se há alguma missão com dados incorretos
    console.log('\n🔍 Verificando missões com dados incorretos:');
    for (const missao of missoesExistentes) {
      if (missao.flightHoursTotal === 0 || missao.retorno.getTime() === missao.partida.getTime() + H(1)) {
        console.log(`   ⚠️ Missão ${missao.id} pode ter dados incorretos:`);
        console.log(`      Partida: ${missao.partida.toLocaleString('pt-BR')}`);
        console.log(`      Retorno: ${missao.retorno.toLocaleString('pt-BR')}`);
        console.log(`      Flight hours: ${missao.flightHoursTotal}`);
        console.log('');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendData().catch(console.error);
