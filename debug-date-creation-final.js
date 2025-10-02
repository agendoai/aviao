// Debug final: Problema na criação de datas
console.log('🔍 DEBUG FINAL: CRIAÇÃO DE DATAS NO TIMEZONE BRASILEIRO');
console.log('=' .repeat(70));

console.log('🚨 PROBLEMA IDENTIFICADO:');
console.log('   new Date("2025-10-21") cria uma data em UTC, não no timezone local');
console.log('   Precisamos criar a data no timezone brasileiro (-3 UTC)');
console.log('');

function debugDateCreation(dateStr) {
  console.log(`\n📅 TESTANDO CRIAÇÃO DE DATA: ${dateStr}`);
  
  // Método atual (INCORRETO)
  const dateUTC = new Date(dateStr);
  console.log(`   1. new Date("${dateStr}"): ${dateUTC.toISOString()} (${dateUTC.toLocaleString('pt-BR')})`);
  
  // Método correto: criar data no timezone local
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateLocal = new Date(year, month - 1, day); // month é 0-indexed
  console.log(`   2. new Date(${year}, ${month-1}, ${day}): ${dateLocal.toISOString()} (${dateLocal.toLocaleString('pt-BR')})`);
  
  return { dateUTC, dateLocal };
}

// Testar criação de datas
debugDateCreation('2025-10-20');
debugDateCreation('2025-10-21');

console.log('\n💡 SOLUÇÃO:');
console.log('   Usar new Date(year, month-1, day) ao invés de new Date(dateString)');
console.log('   Isso garante que a data seja criada no timezone local (brasileiro)');

console.log('\n🧪 TESTE DA CORREÇÃO COMPLETA:');

function testCorrectedLogicFinal(dateStr, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // CORREÇÃO: Criar data no timezone local brasileiro
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day); // month é 0-indexed
  
  console.log(`\n📅 TESTANDO: ${dateStr} às ${timeSlot}`);
  console.log(`   Data base (local): ${date.toISOString()} (${date.toLocaleString('pt-BR')})`);
  
  // Criar slot no horário brasileiro (timezone local)
  const slotDateTimeBR = new Date(date);
  if (hours === 0) {
    slotDateTimeBR.setDate(date.getDate() + 1);
    slotDateTimeBR.setHours(0, minutes, 0, 0);
  } else {
    slotDateTimeBR.setHours(hours, minutes, 0, 0);
  }
  
  console.log(`   Slot BR: ${slotDateTimeBR.toISOString()} (${slotDateTimeBR.toLocaleString('pt-BR')})`);
  
  // Usar diretamente o slotDateTimeBR
  const slotDateTime = slotDateTimeBR;
  const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  
  console.log(`   Slot UTC: ${slotDateTime.toISOString()}`);
  console.log(`   Slot End UTC: ${slotEndDateTime.toISOString()}`);
  
  // Usar as datas UTC diretamente do backend
  const eventStart = new Date(missionData.departure_date);
  const finalEnd = new Date(missionData.blocked_until);
  
  console.log(`   Missão Start: ${eventStart.toISOString()}`);
  console.log(`   Missão End: ${finalEnd.toISOString()}`);
  
  // Comparar diretamente em UTC
  const isBlocked = slotDateTime < finalEnd && slotEndDateTime > eventStart;
  
  console.log(`   Comparação: slot < fim? ${slotDateTime < finalEnd}`);
  console.log(`   Comparação: slotEnd > início? ${slotEndDateTime > eventStart}`);
  console.log(`   Resultado: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
  
  return isBlocked;
}

const missionData = {
  departure_date: "2025-10-20T02:00:00.000Z", // 23:00 BRT do dia 19
  return_date: "2025-10-21T01:54:47.898Z",    // 22:54 BRT do dia 20
  blocked_until: "2025-10-21T04:54:47.898Z"   // 01:54 BRT do dia 21
};

console.log('\n🎯 TESTE CRÍTICO - SLOTS QUE DEVEM ESTAR DISPONÍVEIS:');

const availableTests = [
  { date: '2025-10-20', time: '21:00', desc: 'Slot 21h do dia 20 (problema original)' },
  { date: '2025-10-20', time: '22:00', desc: 'Slot 22h do dia 20' },
  { date: '2025-10-20', time: '23:00', desc: 'Slot 23h do dia 20' }
];

let allCorrect = true;

availableTests.forEach(test => {
  const isBlocked = testCorrectedLogicFinal(test.date, test.time, missionData);
  const correct = !isBlocked; // Deve estar disponível
  
  if (!correct) allCorrect = false;
  
  console.log(`   ${test.date} ${test.time}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'} ${correct ? '✅' : '❌'} (${test.desc})`);
});

console.log('\n🔍 TESTE VALIDAÇÃO - SLOTS QUE DEVEM ESTAR BLOQUEADOS:');

const blockedTests = [
  { date: '2025-10-19', time: '23:00', desc: 'Slot 23h do dia 19 (partida da missão)' },
  { date: '2025-10-21', time: '00:00', desc: 'Slot 00h do dia 21 (buffer pós-missão)' },
  { date: '2025-10-21', time: '01:00', desc: 'Slot 01h do dia 21 (buffer pós-missão)' }
];

blockedTests.forEach(test => {
  const isBlocked = testCorrectedLogicFinal(test.date, test.time, missionData);
  const correct = isBlocked; // Deve estar bloqueado
  
  if (!correct) allCorrect = false;
  
  console.log(`   ${test.date} ${test.time}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'} ${correct ? '✅' : '❌'} (${test.desc})`);
});

console.log('\n🔍 TESTE VALIDAÇÃO - SLOTS QUE DEVEM ESTAR DISPONÍVEIS APÓS BLOQUEIO:');

const afterBlockTests = [
  { date: '2025-10-21', time: '02:00', desc: 'Slot 02h do dia 21 (após fim do bloqueio às 01:54)' }
];

afterBlockTests.forEach(test => {
  const isBlocked = testCorrectedLogicFinal(test.date, test.time, missionData);
  const correct = !isBlocked; // Deve estar disponível
  
  if (!correct) allCorrect = false;
  
  console.log(`   ${test.date} ${test.time}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'} ${correct ? '✅' : '❌'} (${test.desc})`);
});

console.log('\n🏆 RESULTADO FINAL:');
if (allCorrect) {
  console.log('   ✅ TODOS OS TESTES PASSARAM! O problema foi RESOLVIDO!');
  console.log('   🎉 Agora é só aplicar a correção no SmartCalendar.tsx');
} else {
  console.log('   ❌ Ainda há problemas na lógica. Verificar implementação.');
}