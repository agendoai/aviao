// Teste para verificar formato das datas no banco
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDatabaseFormat() {
  console.log('🧪 TESTE - FORMATO DAS DATAS NO BANCO');
  console.log('======================================');

  try {
    // Buscar missão 8036 para ver como está salva
    const mission = await prisma.booking.findUnique({
      where: { id: 8036 }
    });

    if (!mission) {
      console.log('❌ Missão #8036 não encontrada');
      return;
    }

    console.log('🔍 Missão #8036 no banco:');
    console.log('📅 departure_date (raw):', mission.departure_date);
    console.log('📅 return_date (raw):', mission.return_date);
    console.log('📅 actual_departure_date (raw):', mission.actual_departure_date);
    console.log('📅 actual_return_date (raw):', mission.actual_return_date);

    console.log('\n🔍 Conversão para horário brasileiro:');
    console.log('📅 departure_date (BR):', mission.departure_date.toLocaleString('pt-BR'));
    console.log('📅 return_date (BR):', mission.return_date.toLocaleString('pt-BR'));
    console.log('📅 actual_departure_date (BR):', mission.actual_departure_date?.toLocaleString('pt-BR'));
    console.log('📅 actual_return_date (BR):', mission.actual_return_date?.toLocaleString('pt-BR'));

    console.log('\n🔍 ISO strings:');
    console.log('📅 departure_date (ISO):', mission.departure_date.toISOString());
    console.log('📅 return_date (ISO):', mission.return_date.toISOString());
    console.log('📅 actual_departure_date (ISO):', mission.actual_departure_date?.toISOString());
    console.log('📅 actual_return_date (ISO):', mission.actual_return_date?.toISOString());

    // Verificar se está em UTC ou horário local
    console.log('\n🔍 Análise:');
    const departureBR = mission.departure_date.toLocaleString('pt-BR');
    const returnBR = mission.return_date.toLocaleString('pt-BR');
    
    console.log('📅 Se departure_date mostra 07:00 em BR, está correto');
    console.log('📅 Se departure_date mostra 10:00 em BR, está em UTC');
    console.log('📅 Se return_date mostra 21:00 em BR, está correto');
    console.log('📅 Se return_date mostra 00:00 em BR, está em UTC');

  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseFormat().catch(console.error);
