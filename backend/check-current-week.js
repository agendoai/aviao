// Verificar missões na semana atual
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentWeek() {
  console.log('🔍 Verificando missões na semana atual...\n');

  try {
    // Buscar missões da semana de 23/08/2025
    const weekStart = new Date(2025, 7, 18); // 18/08/2025 (segunda-feira)
    const weekEnd = new Date(2025, 7, 25); // 25/08/2025 (domingo)
    
    console.log(`📅 Verificando semana: ${weekStart.toLocaleDateString('pt-BR')} - ${weekEnd.toLocaleDateString('pt-BR')}`);

    const missions = await prisma.booking.findMany({
      where: {
        departure_date: {
          gte: weekStart,
          lt: weekEnd
        },
        status: {
          in: ['pendente', 'confirmado', 'em_andamento', 'concluido']
        }
      },
      include: {
        user: {
          select: { name: true }
        },
        aircraft: true
      },
      orderBy: {
        departure_date: 'asc'
      }
    });

    console.log(`📊 Missões encontradas: ${missions.length}`);
    
    for (const mission of missions) {
      console.log(`   ID: ${mission.id}`);
      console.log(`   Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
      console.log(`   Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
      console.log(`   Flight hours: ${mission.flight_hours}`);
      console.log(`   Status: ${mission.status}`);
      console.log(`   User: ${mission.user.name}`);
      console.log(`   Aircraft: ${mission.aircraft.registration}`);
      console.log('');
    }

    if (missions.length === 0) {
      console.log('❌ Nenhuma missão encontrada nesta semana');
      console.log('💡 Crie uma missão para testar o pré-voo');
    } else {
      // Testar a lógica para a primeira missão
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

checkCurrentWeek().catch(console.error);
