// Verificar se há uma missão às 05:00
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check5amMission() {
  console.log('🔍 Verificando missão às 05:00...\n');

  try {
    // Buscar missões às 05:00
    const missions = await prisma.booking.findMany({
      where: {
        departure_date: {
          gte: new Date(2025, 7, 23, 5, 0, 0),
          lt: new Date(2025, 7, 23, 5, 1, 0)
        }
      },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    console.log(`📊 Missões às 05:00 encontradas: ${missions.length}`);
    
    for (const mission of missions) {
      console.log(`   ID: ${mission.id}`);
      console.log(`   Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
      console.log(`   Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
      console.log(`   Flight hours: ${mission.flight_hours}`);
      console.log(`   Status: ${mission.status}`);
      console.log(`   User: ${mission.user.name}`);
      console.log('');
    }

    if (missions.length === 0) {
      console.log('❌ Nenhuma missão às 05:00 encontrada');
      console.log('💡 Crie uma missão às 05:00 para testar o pré-voo');
    } else {
      // Testar a lógica para a missão às 05:00
      const mission = missions[0];
      const H = (horas) => horas * 60 * 60 * 1000;
      const PRE_VOO_HORAS = 3;
      
      // Calcular pré-voo (3h ANTES)
      const preVooStart = new Date(mission.departure_date.getTime() - H(PRE_VOO_HORAS));
      const preVooEnd = new Date(mission.departure_date.getTime());
      
      console.log('🟡 Pré-voo calculado:');
      console.log(`   Início: ${preVooStart.toLocaleString('pt-BR')}`);
      console.log(`   Fim: ${preVooEnd.toLocaleString('pt-BR')}`);
      console.log(`   Decolagem: ${mission.departure_date.toLocaleString('pt-BR')}`);
      
      // Verificar se está correto
      const hoursBefore = (mission.departure_date.getTime() - preVooStart.getTime()) / H(1);
      console.log(`\n✅ Horas antes da decolagem: ${hoursBefore}h`);
      
      if (hoursBefore === 3) {
        console.log('✅ Lógica correta! Pré-voo é 3h ANTES da decolagem');
        console.log('💡 Se o frontend não está mostrando isso, o problema é no frontend');
      } else {
        console.log('❌ Lógica incorreta!');
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check5amMission().catch(console.error);

