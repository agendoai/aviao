// Script para deletar a missão 8035
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteMission8035() {
  console.log('🗑️ DELETANDO MISSÃO #8035');
  console.log('==========================');

  try {
    // Buscar a missão 8035
    const mission = await prisma.booking.findUnique({
      where: { id: 8035 }
    });

    if (!mission) {
      console.log('❌ Missão #8035 não encontrada');
      return;
    }

    console.log('🔍 Missão encontrada:', {
      id: mission.id,
      origin: mission.origin,
      destination: mission.destination,
      departure_date: mission.departure_date,
      return_date: mission.return_date,
      flight_hours: mission.flight_hours
    });

    // Deletar a missão
    await prisma.booking.delete({
      where: { id: 8035 }
    });

    console.log('✅ Missão #8035 deletada com sucesso!');
    console.log('🎉 Agora você pode criar uma nova missão sem conflitos!');

  } catch (error) {
    console.error('❌ Erro ao deletar missão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteMission8035().catch(console.error);
