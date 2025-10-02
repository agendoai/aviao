// Teste final da correção no SmartCalendar
console.log('🎯 TESTE FINAL - SMARTCALENDAR CORRIGIDO');
console.log('=' .repeat(60));

function simulateSmartCalendarLogic(dateInput, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Simular como o SmartCalendar recebe a data (objeto Date local)
  const date = new Date(dateInput);
  
  console.log(`\n📅 TESTANDO: ${dateInput} às ${timeSlot}`);
  console.log(`   Data recebida: ${date.toISOString()} (${date.toLocaleString('pt-BR')})`);
  
  // LÓGICA CORRIGIDA: Usar diretamente o objeto Date local
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

console.log('\n📊 DADOS DA MISSÃO:');
console.log(`   Partida: ${missionData.departure_date} (23:00 BRT do dia 19)`);
console.log(`   Retorno: ${missionData.return_date} (22:54 BRT do dia 20)`);
console.log(`   Bloqueado até: ${missionData.blocked_until} (01:54 BRT do dia 21)`);

console.log('\n🎯 TESTE CRÍTICO - PROBLEMA ORIGINAL (21h+ no dia 20):');

// Simular como o calendário passa as datas (objetos Date locais)
const testDate20 = new Date(2025, 9, 20); // 20 de outubro de 2025 (mês é 0-indexed)
const testDate19 = new Date(2025, 9, 19); // 19 de outubro de 2025
const testDate21 = new Date(2025, 9, 21); // 21 de outubro de 2025

const criticalTests = [
  { date: testDate20, time: '21:00', expected: false, desc: 'Deve estar DISPONÍVEL' },
  { date: testDate20, time: '22:00', expected: false, desc: 'Deve estar DISPONÍVEL' },
  { date: testDate20, time: '23:00', expected: false, desc: 'Deve estar DISPONÍVEL' }
];

let allCorrect = true;

criticalTests.forEach(test => {
  const isBlocked = simulateSmartCalendarLogic(test.date, test.time, missionData);
  const correct = isBlocked === test.expected;
  
  if (!correct) allCorrect = false;
  
  const dateStr = test.date.toISOString().split('T')[0];
  console.log(`   ${dateStr} ${test.time}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'} ${correct ? '✅' : '❌'} (${test.desc})`);
});

console.log('\n🔍 TESTE VALIDAÇÃO - OUTROS SLOTS:');

const validationTests = [
  { date: testDate19, time: '23:00', expected: true, desc: 'Deve estar BLOQUEADO (partida da missão)' },
  { date: testDate21, time: '00:00', expected: true, desc: 'Deve estar BLOQUEADO (buffer pós-missão)' },
  { date: testDate21, time: '01:00', expected: true, desc: 'Deve estar BLOQUEADO (buffer pós-missão)' },
  { date: testDate21, time: '02:00', expected: false, desc: 'Deve estar DISPONÍVEL (após fim do bloqueio)' }
];

validationTests.forEach(test => {
  const isBlocked = simulateSmartCalendarLogic(test.date, test.time, missionData);
  const correct = isBlocked === test.expected;
  
  if (!correct) allCorrect = false;
  
  const dateStr = test.date.toISOString().split('T')[0];
  console.log(`   ${dateStr} ${test.time}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'} ${correct ? '✅' : '❌'} (${test.desc})`);
});

console.log('\n🏆 RESULTADO FINAL:');
if (allCorrect) {
  console.log('   ✅ TODOS OS TESTES PASSARAM! O problema foi RESOLVIDO!');
  console.log('   🎉 SmartCalendar agora deve mostrar slots 21h+ disponíveis no dia 20/10.');
  console.log('   📝 A correção está aplicada no arquivo SmartCalendar.tsx');
} else {
  console.log('   ❌ Ainda há problemas na lógica. Verificar implementação.');
}

console.log('\n💡 RESUMO DA CORREÇÃO:');
console.log('   1. Removida conversão desnecessária de timezone');
console.log('   2. Usar diretamente o objeto Date local (brasileiro)');
console.log('   3. Comparar diretamente com datas UTC do backend');
console.log('   4. Eliminar dupla conversão que causava o bug');