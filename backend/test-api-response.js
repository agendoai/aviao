// Teste para verificar o que a API está retornando
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiResponse() {
  console.log('🔍 Testando resposta da API...\n');

  try {
    // Buscar uma missão existente
    const existingMission = await prisma.booking.findFirst({
      where: {
        status: {
          in: ['pendente', 'confirmado', 'em_andamento', 'concluido']
        }
      },
      include: {
        aircraft: true,
        user: true
      }
    });

    if (!existingMission) {
      console.log('❌ Nenhuma missão encontrada para testar');
      return;
    }

    console.log('📅 Missão encontrada:');
    console.log(`   ID: ${existingMission.id}`);
    console.log(`   Partida: ${existingMission.departure_date.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${existingMission.return_date.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${existingMission.flight_hours}`);
    console.log(`   Aircraft: ${existingMission.aircraft.registration}`);

    // Simular a chamada da API
    const weekStart = new Date(2025, 7, 18); // Semana de 18/08/2025
    const aircraftId = existingMission.aircraftId;

    console.log(`\n🔍 Simulando API para aeronave ${aircraftId}, semana ${weekStart.toLocaleDateString('pt-BR')}`);

    // Buscar missões da aeronave
    const aircraftMissions = await prisma.booking.findMany({
      where: {
        aircraftId: aircraftId,
        status: {
          in: ['pendente', 'confirmado', 'em_andamento', 'concluido']
        }
      },
      orderBy: {
        departure_date: 'asc'
      }
    });

    console.log(`\n📊 Missões da aeronave: ${aircraftMissions.length}`);
    for (const mission of aircraftMissions) {
      console.log(`   - ${mission.departure_date.toLocaleString('pt-BR')} → ${mission.return_date.toLocaleString('pt-BR')} (${mission.flight_hours}h)`);
    }

    // Simular a lógica de geração de slots (inline para evitar problemas de módulo)
    const H = (horas) => horas * 60 * 60 * 1000;
    
    const calcularTempoVolta = (flightHoursTotal) => flightHoursTotal / 2;
    
    const hasOverlap = (interval1, interval2) => {
      const slotStart = interval1.start;
      const slotEnd = interval1.end;
      const windowStart = interval2.start;
      const windowEnd = interval2.end;
      
      return (slotStart >= windowStart && slotStart < windowEnd) ||
             (slotEnd > windowStart && slotEnd <= windowEnd) ||
             (slotStart <= windowStart && slotEnd >= windowEnd);
    };
    
    const janelaBloqueada = (missao) => {
      const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
      
      const preVooInicio = new Date(missao.partida.getTime() - H(3));
      const preVooFim = new Date(missao.partida.getTime());
      
      const missaoInicio = new Date(missao.partida.getTime());
      const missaoFim = new Date(missao.retorno.getTime() + (30 * 60 * 1000));
      
      const pousoVolta = new Date(missao.retorno.getTime() + tVoltaMs);
      const posVooInicio = new Date(pousoVolta.getTime());
      const posVooFim = new Date(pousoVolta.getTime() + H(3));
      
      return [
        { inicio: preVooInicio, fim: preVooFim, tipo: 'pre-voo', missao },
        { inicio: missaoInicio, fim: missaoFim, tipo: 'missao', missao },
        { inicio: posVooInicio, fim: posVooFim, tipo: 'pos-voo', missao }
      ];
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
    
    const generateTimeSlots = (weekStart, missions) => {
      const slots = [];
      const weekEnd = new Date(weekStart.getTime() + (7 * 24 * 60 * 60 * 1000));
      
      // Gerar slots de 30min para toda a semana
      for (let time = weekStart.getTime(); time < weekEnd.getTime(); time += 30 * 60 * 1000) {
        const slotStart = new Date(time);
        const slotEnd = new Date(time + 30 * 60 * 1000);
        
        // Verificar se o slot está em conflito com alguma missão
        let conflictingWindow = null;
        
        for (const mission of missions) {
          const janelas = janelaBloqueada(mission);
          for (const janela of janelas) {
            if (hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })) {
              conflictingWindow = janela;
              break;
            }
          }
          if (conflictingWindow) break;
        }
        
        if (conflictingWindow) {
          const timeSlot = janelaToTimeSlot(conflictingWindow);
          slots.push({
            ...timeSlot,
            start: slotStart,
            end: slotEnd
          });
        } else {
          slots.push({
            start: slotStart,
            end: slotEnd,
            status: 'available',
            reason: 'Disponível'
          });
        }
      }
      
      return slots;
    };

    // Converter missões para o formato esperado
    const missions = aircraftMissions.map(m => ({
      partida: m.departure_date,
      retorno: m.return_date,
      flightHoursTotal: m.flight_hours,
      id: m.id,
      origin: m.origin,
      destination: m.destination
    }));

    console.log(`\n🔍 Gerando slots para ${missions.length} missões...`);

    // Gerar slots para a semana
    const slots = generateTimeSlots(weekStart, missions);

    console.log(`\n📊 Slots gerados: ${slots.length}`);

    // Mostrar alguns slots específicos
    const testSlots = slots.filter(s => {
      const slotDate = new Date(s.start);
      return slotDate.getDate() === 23 && slotDate.getMonth() === 7; // 23/08
    });

    console.log(`\n🔍 Slots do dia 23/08 (${testSlots.length} encontrados):`);
    
    for (let hour = 0; hour < 24; hour++) {
      const hourSlots = testSlots.filter(s => {
        const slotDate = new Date(s.start);
        return slotDate.getHours() === hour;
      });

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

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiResponse().catch(console.error);
