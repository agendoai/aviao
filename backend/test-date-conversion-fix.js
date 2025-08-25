// Teste para verificar se a correção da conversão de datas está funcionando
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Simular a função convertBrazilianDateToUTCString corrigida
function convertBrazilianDateToUTCString(brazilianDate) {
  const year = brazilianDate.getFullYear();
  const month = String(brazilianDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilianDate.getDate()).padStart(2, '0');
  const hours = String(brazilianDate.getHours()).padStart(2, '0');
  const minutes = String(brazilianDate.getMinutes()).padStart(2, '0');
  const seconds = String(brazilianDate.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
}

// Simular a função convertUTCToBrazilianTime corrigida
function convertUTCToBrazilianTime(utcDate) {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  const brazilianTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  return brazilianTime;
}

async function testDateConversionFix() {
  console.log('🧪 TESTANDO CORREÇÃO DA CONVERSÃO DE DATAS');
  console.log('==========================================');

  // Teste 1: Partida às 07:00
  console.log('\n📅 TESTE 1: Partida às 07:00');
  const departureBrazilian = new Date(2025, 7, 26, 7, 0, 0); // 26/08/2025 07:00
  console.log('🕐 Horário brasileiro (partida):', departureBrazilian.toLocaleString('pt-BR'));
  
  const departureUTCString = convertBrazilianDateToUTCString(departureBrazilian);
  console.log('📤 Enviado para backend:', departureUTCString);
  
  const departureBackendDate = new Date(departureUTCString);
  console.log('💾 Backend interpreta como:', departureBackendDate.toISOString());
  
  const departureDisplay = convertUTCToBrazilianTime(departureBackendDate);
  console.log('📱 Frontend exibe:', departureDisplay.toLocaleString('pt-BR'));
  
  if (departureDisplay.getHours() === 7) {
    console.log('✅ PARTIDA CORRETA!');
  } else {
    console.log('❌ PARTIDA INCORRETA!');
  }

  // Teste 2: Retorno às 17:00
  console.log('\n📅 TESTE 2: Retorno às 17:00');
  const returnBrazilian = new Date(2025, 7, 26, 17, 0, 0); // 26/08/2025 17:00
  console.log('🕐 Horário brasileiro (retorno):', returnBrazilian.toLocaleString('pt-BR'));
  
  const returnUTCString = convertBrazilianDateToUTCString(returnBrazilian);
  console.log('📤 Enviado para backend:', returnUTCString);
  
  const returnBackendDate = new Date(returnUTCString);
  console.log('💾 Backend interpreta como:', returnBackendDate.toISOString());
  
  const returnDisplay = convertUTCToBrazilianTime(returnBackendDate);
  console.log('📱 Frontend exibe:', returnDisplay.toLocaleString('pt-BR'));
  
  if (returnDisplay.getHours() === 17) {
    console.log('✅ RETORNO CORRETO!');
  } else {
    console.log('❌ RETORNO INCORRETO!');
  }

  // Teste 3: Verificar missão existente
  console.log('\n📅 TESTE 3: Verificar missão existente #8034');
  try {
    const mission = await prisma.booking.findUnique({
      where: { id: 8034 },
      select: {
        id: true,
        departure_date: true,
        return_date: true,
        origin: true,
        destination: true
      }
    });

    if (mission) {
      console.log('🔍 Missão encontrada:', {
        id: mission.id,
        origin: mission.origin,
        destination: mission.destination,
        departure_date: mission.departure_date,
        return_date: mission.return_date
      });

      const departureDisplay = convertUTCToBrazilianTime(mission.departure_date);
      const returnDisplay = convertUTCToBrazilianTime(mission.return_date);

      console.log('📱 Partida exibida:', departureDisplay.toLocaleString('pt-BR'));
      console.log('📱 Retorno exibido:', returnDisplay.toLocaleString('pt-BR'));

      if (departureDisplay.getHours() === 7 && returnDisplay.getHours() === 17) {
        console.log('✅ MISSÃO #8034 EXIBIÇÃO CORRETA!');
      } else {
        console.log('❌ MISSÃO #8034 EXIBIÇÃO INCORRETA!');
      }
    } else {
      console.log('❌ Missão #8034 não encontrada');
    }
  } catch (error) {
    console.log('❌ Erro ao buscar missão:', error.message);
  }

  await prisma.$disconnect();
}

testDateConversionFix().catch(console.error);
