// Teste dos cálculos corrigidos do blocked_until
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCalculations() {
  console.log('🧪 Testando cálculos corrigidos do blocked_until\n');

  // Dados da missão de teste (usando horário local)
  const departureDate = new Date(2025, 7, 20, 5, 0, 0); // 20/08/2025 05:00 BRT
  const returnDate = new Date(2025, 7, 20, 16, 0, 0);   // 20/08/2025 16:00 BRT
  const flightHours = 1; // 1 hora total

  console.log('📋 Dados da missão:');
  console.log(`   Partida: ${departureDate.toLocaleString('pt-BR')}`);
  console.log(`   Retorno: ${returnDate.toLocaleString('pt-BR')}`);
  console.log(`   Flight hours: ${flightHours}h`);
  console.log('');

  // Cálculo correto
  const returnFlightTime = flightHours / 2; // 0.5h (30 min)
  const pousoVolta = new Date(returnDate.getTime() + (returnFlightTime * 60 * 60 * 1000));
  const blockedUntil = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // +3h

  console.log('📐 Cálculos:');
  console.log(`   tVolta: ${returnFlightTime}h (${returnFlightTime * 60} min)`);
  console.log(`   Pouso da volta: ${pousoVolta.toLocaleString('pt-BR')}`);
  console.log(`   Blocked until: ${blockedUntil.toLocaleString('pt-BR')}`);
  console.log(`   Blocked until (ISO): ${blockedUntil.toISOString()}`);
  console.log('');

  // Verificar se está correto (blocked_until deveria ser 19:30 BRT)
  const expectedBlockedHour = 19;
  const expectedBlockedMinute = 30;
  const actualHour = blockedUntil.getHours();
  const actualMinute = blockedUntil.getMinutes();

  console.log('✅ Verificação:');
  console.log(`   Blocked until esperado: ${expectedBlockedHour}:${expectedBlockedMinute.toString().padStart(2, '0')}`);
  console.log(`   Blocked until obtido: ${actualHour}:${actualMinute.toString().padStart(2, '0')}`);
  
  if (actualHour === expectedBlockedHour && actualMinute === expectedBlockedMinute) {
    console.log('   ✅ Cálculo CORRETO!');
  } else {
    console.log('   ❌ Cálculo INCORRETO!');
  }

  // Calcular próxima decolagem possível (blocked_until + 3h)
  const proximaDecolagem = new Date(blockedUntil.getTime() + (3 * 60 * 60 * 1000));
  console.log(`   Próxima decolagem possível: ${proximaDecolagem.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`);

  console.log('\n📅 Janelas esperadas no calendário:');
  console.log('   🟡 Pré-voo: 02:00 - 05:00 (amarelo)');
  console.log('   ⚫ Missão: 05:00 - 16:00 (cinza)');
  console.log('   🟠 Pós-voo: 16:30 - 19:30 (laranja)');
  console.log('   🟢 Livre: 22:30 em diante (verde)');

  await prisma.$disconnect();
}

testCalculations().catch(console.error);
