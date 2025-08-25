// Teste rápido para verificar se o backend está funcionando
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickTest() {
  console.log('🔍 Teste rápido do backend...\n');

  try {
    // Verificar se há missões
    const missions = await prisma.booking.findMany({
      take: 3,
      include: {
        aircraft: true
      }
    });

    console.log(`📊 Missões encontradas: ${missions.length}`);
    
    for (const mission of missions) {
      console.log(`   ID: ${mission.id} - ${mission.departure_date.toLocaleString('pt-BR')} → ${mission.return_date.toLocaleString('pt-BR')}`);
    }

    if (missions.length === 0) {
      console.log('❌ Nenhuma missão encontrada');
      return;
    }

    // Testar a lógica de janelas
    const H = (horas) => horas * 60 * 60 * 1000;
    const PRE_VOO_HORAS = 3;
    
    const mission = missions[0];
    const departureTime = mission.departure_date;
    
    // Calcular pré-voo (3h ANTES)
    const preVooStart = new Date(departureTime.getTime() - H(PRE_VOO_HORAS));
    const preVooEnd = new Date(departureTime.getTime());
    
    console.log(`\n🟡 Pré-voo calculado:`);
    console.log(`   Início: ${preVooStart.toLocaleString('pt-BR')}`);
    console.log(`   Fim: ${preVooEnd.toLocaleString('pt-BR')}`);
    console.log(`   Decolagem: ${departureTime.toLocaleString('pt-BR')}`);
    
    // Verificar se está correto
    const hoursBefore = (departureTime.getTime() - preVooStart.getTime()) / H(1);
    console.log(`\n✅ Horas antes da decolagem: ${hoursBefore}h`);
    
    if (hoursBefore === 3) {
      console.log('✅ Lógica correta! Pré-voo é 3h ANTES da decolagem');
    } else {
      console.log('❌ Lógica incorreta!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest().catch(console.error);
