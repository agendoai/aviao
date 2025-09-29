const { startOfWeek, addDays } = require('date-fns');

console.log('🔍 DEBUG: Como o frontend está enviando datas para o backend');
console.log('=' .repeat(70));

// Simular o que o frontend faz
function simulateFrontendDateRequest() {
  console.log('📅 SIMULANDO REQUISIÇÃO DO FRONTEND:');
  console.log('');
  
  // 1. Data que o usuário quer ver (27 de janeiro de 2025)
  const targetDate = new Date(2025, 0, 27); // 27 de janeiro de 2025
  console.log(`1. Data alvo do usuário: ${targetDate.toLocaleDateString('pt-BR')}`);
  console.log(`   Como Date object: ${targetDate.toString()}`);
  console.log('');
  
  // 2. Como o frontend calcula startOfWeek
  const weekStart = startOfWeek(targetDate, { weekStartsOn: 1 }); // Segunda-feira
  console.log(`2. startOfWeek calculado: ${weekStart.toLocaleDateString('pt-BR')}`);
  console.log(`   Como Date object: ${weekStart.toString()}`);
  console.log(`   Como ISO: ${weekStart.toISOString()}`);
  console.log('');
  
  // 3. Como convertWeekStartToBrazilianTimezone funciona
  console.log('3. Função convertWeekStartToBrazilianTimezone:');
  const brazilianOffset = -3 * 60 * 60 * 1000; // -3 horas em milissegundos
  const adjustedDate = new Date(weekStart.getTime() + brazilianOffset);
  const result = adjustedDate.toISOString();
  
  console.log(`   weekStart.getTime(): ${weekStart.getTime()}`);
  console.log(`   brazilianOffset: ${brazilianOffset} ms`);
  console.log(`   adjustedDate: ${adjustedDate.toString()}`);
  console.log(`   Resultado ISO: ${result}`);
  console.log('');
  
  // 4. O que o backend recebe
  console.log('4. O que o backend recebe:');
  console.log(`   weekStart parameter: ${result}`);
  console.log(`   new Date(weekStart): ${new Date(result).toString()}`);
  console.log(`   Data local no backend: ${new Date(result).toLocaleDateString('pt-BR')}`);
  console.log('');
  
  // 5. Testar diferentes cenários
  console.log('5. TESTANDO DIFERENTES CENÁRIOS:');
  
  const testDates = [
    new Date(2025, 0, 27), // Segunda-feira
    new Date(2025, 0, 28), // Terça-feira  
    new Date(2025, 0, 29), // Quarta-feira
  ];
  
  testDates.forEach((date, index) => {
    console.log(`\n   Cenário ${index + 1}: ${date.toLocaleDateString('pt-BR')} (${date.toLocaleDateString('en-US', { weekday: 'long' })})`);
    
    const ws = startOfWeek(date, { weekStartsOn: 1 });
    const adjusted = new Date(ws.getTime() + brazilianOffset);
    const isoResult = adjusted.toISOString();
    
    console.log(`     startOfWeek: ${ws.toLocaleDateString('pt-BR')}`);
    console.log(`     Enviado para backend: ${isoResult}`);
    console.log(`     Backend interpreta como: ${new Date(isoResult).toLocaleDateString('pt-BR')}`);
  });
  
  return result;
}

// 6. Verificar se o problema está na interpretação
function analyzeBackendInterpretation() {
  console.log('\n📊 ANÁLISE DA INTERPRETAÇÃO DO BACKEND:');
  console.log('');
  
  // Data que queremos: 27/01/2025
  const targetISO = '2025-01-27T03:00:00.000Z'; // Resultado da conversão
  
  console.log(`Data enviada: ${targetISO}`);
  console.log(`Backend cria Date: ${new Date(targetISO).toString()}`);
  console.log(`Data local: ${new Date(targetISO).toLocaleDateString('pt-BR')}`);
  console.log(`Hora local: ${new Date(targetISO).toLocaleTimeString('pt-BR')}`);
  console.log('');
  
  // O backend deve gerar slots para esta data
  console.log('🎯 EXPECTATIVA:');
  console.log('   O backend deve gerar slots para 27/01/2025');
  console.log('   Slots de 06:00 até 23:30 (horário brasileiro)');
  console.log('   Incluindo slots noturnos: 21:00, 21:30, 22:00, 22:30, 23:00, 23:30');
}

// Executar simulação
const frontendRequest = simulateFrontendDateRequest();
analyzeBackendInterpretation();

console.log('\n🔍 PRÓXIMOS PASSOS:');
console.log('   1. Verificar se o backend está recebendo a data correta');
console.log('   2. Verificar se o backend está gerando slots para a data correta');
console.log('   3. Verificar se os slots noturnos estão sendo gerados');
console.log('   4. Verificar se há filtros que removem os slots noturnos');