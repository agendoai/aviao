const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debugBlockedUntil() {
  try {
    console.log('🔍 DEBUG: Como blocked_until está sendo calculado');
    console.log('=' .repeat(60));
    
    // Limpar dados
    await prisma.booking.deleteMany({});
    
    // Cenário: Missão que DEVERIA ter pós-voo até 22:00 do mesmo dia
    console.log('📝 Cenário:');
    console.log('   • Partida: 15:00 BRT (usuário seleciona)');
    console.log('   • Retorno: 18:00 BRT (usuário seleciona)');
    console.log('   • Flight hours: 2h (1h ida + 1h volta)');
    console.log('   • Pós-voo esperado: 18:00 + 1h + 3h = 22:00 BRT');
    console.log('');
    
    // Criar booking simulando exatamente o que o frontend faz
    const departureDateTime = new Date('2025-09-15T18:00:00.000Z'); // 15:00 BRT
    const returnDateTime = new Date('2025-09-15T21:00:00.000Z');    // 18:00 BRT
    const flight_hours = 2;
    
    console.log('🧮 Cálculo do backend (bookings.ts linha 164-170):');
    console.log(`   departureDateTime: ${departureDateTime.toISOString()} (${departureDateTime.toLocaleString('pt-BR')})`);
    console.log(`   returnDateTime: ${returnDateTime.toISOString()} (${returnDateTime.toLocaleString('pt-BR')})`);
    
    // ESTE É O CÁLCULO EXATO DO BACKEND:
    const returnFlightTime = flight_hours / 2; // 1h (tempo de volta)
    const blockedUntil = new Date(returnDateTime.getTime() + (returnFlightTime + 3) * 60 * 60 * 1000);
    
    console.log(`   returnFlightTime: ${returnFlightTime}h`);
    console.log(`   (returnFlightTime + 3): ${returnFlightTime + 3}h`);
    console.log(`   blocked_until calculado: ${blockedUntil.toISOString()}`);
    console.log(`   blocked_until BRT: ${blockedUntil.toLocaleString('pt-BR')}`);
    console.log('');
    
    // Verificar se está correto
    const expectedBlockedUntilBRT = new Date('2025-09-15T22:00:00-03:00'); // 22:00 BRT
    const expectedBlockedUntilUTC = new Date('2025-09-16T01:00:00.000Z');   // 01:00 UTC dia seguinte
    
    console.log('✅ Verificação:');
    console.log(`   Esperado BRT: ${expectedBlockedUntilBRT.toLocaleString('pt-BR')}`);
    console.log(`   Esperado UTC: ${expectedBlockedUntilUTC.toISOString()}`);
    console.log(`   Calculado UTC: ${blockedUntil.toISOString()}`);
    console.log(`   Está correto: ${blockedUntil.toISOString() === expectedBlockedUntilUTC.toISOString() ? '✅ SIM' : '❌ NÃO'}`);
    console.log('');
    
    // Testar a conversão para BRT no frontend
    console.log('🔄 Conversão no frontend:');
    const frontendBRT = new Date(blockedUntil.getTime() - (3 * 60 * 60 * 1000));
    console.log(`   blocked_until UTC: ${blockedUntil.toISOString()}`);
    console.log(`   Conversão BRT (UTC - 3h): ${frontendBRT.toLocaleString('pt-BR')}`);
    console.log(`   Deveria ser 22:00: ${frontendBRT.getHours() === 22 ? '✅ SIM' : '❌ NÃO (é ' + frontendBRT.getHours() + 'h)'}`);
    console.log('');
    
    if (frontendBRT.getHours() !== 22) {
      console.log('🚨 PROBLEMA ENCONTRADO!');
      console.log(`   O frontend está convertendo ${blockedUntil.toISOString()} para ${frontendBRT.toLocaleString('pt-BR')}`);
      console.log(`   Mas deveria ser 22:00 do dia 15/09`);
      console.log('');
      console.log('💡 Possíveis causes:');
      console.log('   1. Backend está calculando errado');
      console.log('   2. Frontend está convertendo errado');
      console.log('   3. Confusão entre fusos horários');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBlockedUntil().catch(console.error);