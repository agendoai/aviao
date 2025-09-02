const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMissions() {
  try {
    const missions = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        status: { in: ['pendente', 'confirmada', 'paga'] },
        NOT: {
          AND: [
            { origin: 'AGENDA' },
            { destination: 'AGENDA' }
          ]
        }
      },
      orderBy: { departure_date: 'asc' }
    });

    console.log('Missões encontradas:');
    missions.forEach(mission => {
      console.log(`ID: ${mission.id}`);
      console.log(`Rota: ${mission.origin} → ${mission.destination}`);
      console.log(`Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
      console.log(`Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
      console.log(`Tempo de voo: ${mission.flight_hours}h`);
      console.log(`Bloqueado até: ${mission.blocked_until?.toLocaleString('pt-BR') || 'N/A'}`);
      console.log('---');
    });
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMissions();



