// Deletar a missão 8033 que está causando conflito
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteConflictingMission() {
  console.log('🗑️ Deletando missão conflitante 8033...\n');

  try {
    // Verificar a missão antes de deletar
    const mission = await prisma.booking.findUnique({
      where: { id: 8033 },
      include: {
        user: { select: { name: true } },
        aircraft: true
      }
    });

    if (!mission) {
      console.log('❌ Missão 8033 não encontrada');
      return;
    }

    console.log('📋 Missão a ser deletada:');
    console.log(`   ID: ${mission.id}`);
    console.log(`   Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${mission.flight_hours}`);
    console.log(`   Status: ${mission.status}`);
    console.log(`   User: ${mission.user.name}`);
    console.log(`   Aircraft: ${mission.aircraft.registration}`);
    console.log('');

    // Deletar a missão
    await prisma.booking.delete({
      where: { id: 8033 }
    });

    console.log('✅ Missão 8033 deletada com sucesso!');
    console.log('💡 Agora a missão 7317 (10:00-17:00) deve aparecer corretamente');

    // Verificar missões restantes em 25/08/2025
    const remainingMissions = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        departure_date: {
          gte: new Date(2025, 7, 25, 0, 0, 0),
          lt: new Date(2025, 7, 26, 0, 0, 0)
        }
      },
      include: {
        user: { select: { name: true } },
        aircraft: true
      },
      orderBy: {
        departure_date: 'asc'
      }
    });

    console.log('\n📊 Missões restantes em 25/08/2025:');
    for (const remaining of remainingMissions) {
      console.log(`   ID: ${remaining.id} - ${remaining.departure_date.toLocaleString('pt-BR')} → ${remaining.return_date.toLocaleString('pt-BR')} - ${remaining.status}`);
    }

    if (remainingMissions.length === 0) {
      console.log('   Nenhuma missão encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteConflictingMission().catch(console.error);
