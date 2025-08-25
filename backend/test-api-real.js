// Teste da API real para verificar se está retornando dados corretos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testApiReal() {
  console.log('🔍 Testando API real...\n');

  try {
    // Buscar uma missão existente
    const existingMission = await prisma.booking.findFirst({
      where: {
        status: {
          in: ['pendente', 'confirmado', 'em_andamento', 'concluido']
        }
      },
      include: {
        aircraft: true
      }
    });

    if (!existingMission) {
      console.log('❌ Nenhuma missão encontrada');
      return;
    }

    console.log('📅 Missão encontrada:');
    console.log(`   ID: ${existingMission.id}`);
    console.log(`   Partida: ${existingMission.departure_date.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${existingMission.return_date.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${existingMission.flight_hours}`);
    console.log(`   Aircraft: ${existingMission.aircraft.registration}`);

    // Simular a chamada da API real
    const { generateTimeSlots } = require('./src/services/intelligentValidation');

    // Buscar missões da aeronave
    const aircraftMissions = await prisma.booking.findMany({
      where: {
        aircraftId: existingMission.aircraftId,
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

    console.log(`\n📊 Missões da aeronave: ${aircraftMissions.length}`);
    for (const mission of aircraftMissions) {
      console.log(`   - ${mission.departure_date.toLocaleString('pt-BR')} → ${mission.return_date.toLocaleString('pt-BR')} (${mission.flight_hours}h)`);
    }

    // Simular a semana da missão
    const weekStart = new Date(existingMission.departure_date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Segunda-feira

    console.log(`\n🔍 Gerando slots para semana: ${weekStart.toLocaleDateString('pt-BR')}`);

    // Gerar slots usando a API real
    const slots = await generateTimeSlots(
      existingMission.aircraftId,
      weekStart
    );

    console.log(`\n📊 Slots gerados: ${slots.length}`);

    // Mostrar slots do dia da missão
    const missionDate = new Date(existingMission.departure_date);
    const daySlots = slots.filter(s => {
      const slotDate = new Date(s.start);
      return slotDate.getDate() === missionDate.getDate() && 
             slotDate.getMonth() === missionDate.getMonth() &&
             slotDate.getFullYear() === missionDate.getFullYear();
    });

    console.log(`\n🔍 Slots do dia ${missionDate.toLocaleDateString('pt-BR')} (${daySlots.length} encontrados):`);
    
    for (let hour = 0; hour < 24; hour++) {
      const hourSlots = daySlots.filter(s => {
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

    if (missaoSlots.length > 0) {
      console.log(`\n⚫ Slots de missão:`);
      for (const slot of missaoSlots) {
        console.log(`   ${slot.start.toLocaleTimeString('pt-BR')}: ${slot.reason}`);
      }
    }

    if (posVooSlots.length > 0) {
      console.log(`\n🟠 Slots de pós-voo:`);
      for (const slot of posVooSlots) {
        console.log(`   ${slot.start.toLocaleTimeString('pt-BR')}: ${slot.reason}`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiReal().catch(console.error);
