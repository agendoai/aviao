// Script para testar timezone das datas
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTimezone() {
  console.log('🧪 TESTANDO TIMEZONE DAS DATAS');
  console.log('==============================');

  try {
    // Buscar a missão 8036
    const mission = await prisma.booking.findUnique({
      where: { id: 8036 }
    });

    if (!mission) {
      console.log('❌ Missão #8036 não encontrada');
      return;
    }

    console.log('🔍 Datas da missão:');
    console.log('📅 departure_date (UTC):', mission.departure_date.toISOString());
    console.log('📅 return_date (UTC):', mission.return_date.toISOString());
    console.log('📅 actual_departure_date (UTC):', mission.actual_departure_date?.toISOString());
    console.log('📅 actual_return_date (UTC):', mission.actual_return_date?.toISOString());

    console.log('\n🕐 Conversão para horário brasileiro (UTC-3):');
    console.log('📅 departure_date (BR):', new Date(mission.departure_date.getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR'));
    console.log('📅 return_date (BR):', new Date(mission.return_date.getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR'));
    console.log('📅 actual_departure_date (BR):', mission.actual_departure_date ? new Date(mission.actual_departure_date.getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR') : 'N/A');
    console.log('📅 actual_return_date (BR):', mission.actual_return_date ? new Date(mission.actual_return_date.getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR') : 'N/A');

    // Simular o que o frontend recebe
    console.log('\n🖥️ O que o frontend recebe (JSON):');
    const frontendData = {
      departure_date: mission.departure_date.toISOString(),
      return_date: mission.return_date.toISOString(),
      actual_departure_date: mission.actual_departure_date?.toISOString(),
      actual_return_date: mission.actual_return_date?.toISOString()
    };
    console.log(JSON.stringify(frontendData, null, 2));

    // Simular o que o frontend faz
    console.log('\n🖥️ O que o frontend faz:');
    const frontendDeparture = new Date(frontendData.departure_date);
    const frontendReturn = new Date(frontendData.return_date);
    console.log('📅 Frontend departure_date:', frontendDeparture.toLocaleString('pt-BR'));
    console.log('📅 Frontend return_date:', frontendReturn.toLocaleString('pt-BR'));

  } catch (error) {
    console.error('❌ Erro ao testar timezone:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimezone().catch(console.error);
