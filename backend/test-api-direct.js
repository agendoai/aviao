// Teste direto da API para verificar se está retornando os dados corretos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiDirect() {
  console.log('🔍 Testando API diretamente...\n');

  try {
    // Buscar missões da aeronave 2
    const missions = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        status: {
          in: ['pendente', 'confirmado', 'em_andamento', 'concluido']
        }
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    console.log(`📊 Missões encontradas: ${missions.length}`);
    
    for (const mission of missions) {
      console.log(`   ID: ${mission.id} - ${mission.departure_date.toLocaleString('pt-BR')} → ${mission.return_date.toLocaleString('pt-BR')} (${mission.flight_hours}h)`);
    }

    if (missions.length === 0) {
      console.log('❌ Nenhuma missão encontrada');
      return;
    }

    // Simular a semana
    const weekStart = new Date(2025, 7, 18); // 18/08/2025
    
    console.log(`\n🔍 Simulando semana: ${weekStart.toLocaleDateString('pt-BR')}`);

    // Incluir as funções necessárias
    const H = (horas) => horas * 60 * 60 * 1000;
    const PRE_VOO_HORAS = 3;
    const POS_VOO_HORAS = 3;
    
    const calcularTempoVolta = (flightHoursTotal) => flightHoursTotal / 2;
    
    const janelaBloqueada = (missao) => {
      const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
      
      // Pré-voo: 3h ANTES da decolagem (02:00, 03:00, 04:00 para decolagem às 05:00)
      const preVooInicio = new Date(missao.partida.getTime() - H(PRE_VOO_HORAS));
      const preVooFim = new Date(missao.partida.getTime());
      
      // Missão: decolagem até retorno (05:00 até 06:00)
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
      const janelas = [];
      for (const missao of missoes) {
        const missaoFormatada = {
          partida: missao.departure_date,
          retorno: missao.return_date,
          flightHoursTotal: missao.flight_hours,
          id: missao.id,
          origin: missao.origin,
          destination: missao.destination
        };
        janelas.push(...janelaBloqueada(missaoFormatada));
      }
      return janelas;
    };

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

    // Calcular janelas bloqueadas
    const janelas = calcularJanelasBloqueadas(missions);
    
    console.log('\n🟡 Janelas calculadas:');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Gerar slots para a semana
    const slots = [];
    const startDate = new Date(weekStart);
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + 7);

    for (let date = new Date(startDate); date < endDate; date.setDate(date.getDate() + 1)) {
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotStart = new Date(date);
          slotStart.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + 30);

          // Verificar se o slot está em conflito com alguma janela bloqueada
          const conflictingWindow = janelas.find(janela => 
            hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })
          );

          let status = 'available';
          let reason = '';
          let blockType = undefined;
          let booking = undefined;

          if (conflictingWindow) {
            // Converter janela para TimeSlot
            const timeSlot = janelaToTimeSlot(conflictingWindow);
            status = timeSlot.status;
            reason = timeSlot.reason;
            blockType = timeSlot.blockType;
            booking = timeSlot.booking;
          }

          slots.push({
            start: slotStart,
            end: slotEnd,
            status,
            reason,
            booking,
            blockType
          });
        }
      }
    }

    console.log(`\n📊 Slots gerados: ${slots.length}`);

    // Mostrar slots do dia 23/08 (se houver missões)
    const targetDate = new Date(2025, 7, 23); // 23/08/2025
    const daySlots = slots.filter(s => {
      return s.start.getDate() === targetDate.getDate() && 
             s.start.getMonth() === targetDate.getMonth() &&
             s.start.getFullYear() === targetDate.getFullYear();
    });

    console.log(`\n🔍 Slots do dia ${targetDate.toLocaleDateString('pt-BR')} (${daySlots.length} encontrados):`);
    
    // Mostrar slots das 02:00 às 08:00
    for (let hour = 2; hour <= 8; hour++) {
      const hourSlots = daySlots.filter(s => s.start.getHours() === hour);
      
      if (hourSlots.length > 0) {
        console.log(`\n   ${hour.toString().padStart(2, '0')}:00 - ${hour.toString().padStart(2, '0')}:30:`);
        for (const slot of hourSlots) {
          const status = slot.status;
          const blockType = slot.blockType || 'N/A';
          const reason = slot.reason || 'N/A';
          console.log(`     ${slot.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}: ${status} (${blockType}) - ${reason}`);
        }
      }
    }

    // Verificar se há slots de pré-voo corretos
    const preVooSlots = daySlots.filter(s => s.blockType === 'pre-voo');
    const missaoSlots = daySlots.filter(s => s.blockType === 'missao');
    const posVooSlots = daySlots.filter(s => s.blockType === 'pos-voo');

    console.log(`\n📋 Resumo dos slots:`);
    console.log(`   Pré-voo: ${preVooSlots.length} slots`);
    console.log(`   Missão: ${missaoSlots.length} slots`);
    console.log(`   Pós-voo: ${posVooSlots.length} slots`);

    if (preVooSlots.length > 0) {
      console.log(`\n🟡 Slots de pré-voo:`);
      for (const slot of preVooSlots) {
        console.log(`   ${slot.start.toLocaleTimeString('pt-BR')}: ${slot.reason}`);
      }
    }

    console.log('\n✅ Teste concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiDirect().catch(console.error);
