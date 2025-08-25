// Script para testar nova missão com timezone corrigido
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewMission() {
  console.log('🧪 TESTANDO NOVA MISSÃO COM TIMEZONE CORRIGIDO');
  console.log('==============================================');

  try {
    // Simular dados de uma nova missão
    const departureDateTime = new Date('2025-08-29T10:00:00.000Z'); // 10:00 UTC = 07:00 BR
    const returnDateTime = new Date('2025-08-29T17:00:00.000Z'); // 17:00 UTC = 14:00 BR
    const flightHours = 2.033;

    console.log('🔍 Datas de entrada:');
    console.log('📅 departureDateTime (UTC):', departureDateTime.toISOString());
    console.log('📅 returnDateTime (UTC):', returnDateTime.toISOString());
    console.log('📅 flightHours:', flightHours);

    // Calcular janela bloqueada
    const returnFlightTime = parseFloat(flightHours) / 2; // 1.0165 horas
    const pousoVolta = new Date(returnDateTime.getTime() + (returnFlightTime * 60 * 60 * 1000));
    const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // Pouso volta + 3h manutenção

    console.log('\n🔍 Cálculos intermediários:');
    console.log('📅 pousoVolta (UTC):', pousoVolta.toISOString());
    console.log('📅 fimLogico (UTC):', fimLogico.toISOString());

    // Converter para horário local brasileiro (UTC-3)
    const departureDateLocal = new Date(departureDateTime.getTime() - (3 * 60 * 60 * 1000) - (3 * 60 * 60 * 1000)); // 3h antes para pré-voo + 3h timezone
    const returnDateLocal = new Date(fimLogico.getTime() - (3 * 60 * 60 * 1000)); // Fim lógico da missão + timezone
    const actualDepartureLocal = new Date(departureDateTime.getTime() - (3 * 60 * 60 * 1000)); // Data real de ida + timezone
    const actualReturnLocal = new Date(returnDateTime.getTime() - (3 * 60 * 60 * 1000)); // Data real de volta + timezone

    console.log('\n🔍 Datas convertidas para horário local:');
    console.log('📅 departureDateLocal (BR):', departureDateLocal.toLocaleString('pt-BR'));
    console.log('📅 returnDateLocal (BR):', returnDateLocal.toLocaleString('pt-BR'));
    console.log('📅 actualDepartureLocal (BR):', actualDepartureLocal.toLocaleString('pt-BR'));
    console.log('📅 actualReturnLocal (BR):', actualReturnLocal.toLocaleString('pt-BR'));

    console.log('\n🔍 O que o frontend receberia:');
    console.log('📅 departure_date:', departureDateLocal.toISOString());
    console.log('📅 return_date:', returnDateLocal.toISOString());
    console.log('📅 actual_departure_date:', actualDepartureLocal.toISOString());
    console.log('📅 actual_return_date:', actualReturnLocal.toISOString());

    // Simular o que o frontend faria
    console.log('\n🖥️ Frontend interpretaria como:');
    const frontendDeparture = new Date(departureDateLocal.toISOString());
    const frontendReturn = new Date(returnDateLocal.toISOString());
    console.log('📅 Frontend departure_date:', frontendDeparture.toLocaleString('pt-BR'));
    console.log('📅 Frontend return_date:', frontendReturn.toLocaleString('pt-BR'));

  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNewMission().catch(console.error);
