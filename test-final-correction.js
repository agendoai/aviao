// Teste final da correção do problema de timezone
console.log('🎯 TESTE FINAL - CORREÇÃO DEFINITIVA');
console.log('=' .repeat(60));

function testCorrectedSmartCalendar(dateStr, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const date = new Date(dateStr);
  
  console.log(`\n📅 TESTANDO: ${dateStr} às ${timeSlot}`);
  console.log(`   Data base: ${date.toISOString()} (${date.toLocaleString('pt-BR')})`);
  
  // LÓGICA CORRIGIDA: Criar slot no timezone local
  const slotDateTimeBR = new Date(date);
  if (hours === 0) {
    slotDateTimeBR.setDate(date.getDate() + 1);
    slotDateTimeBR.setHours(0, minutes, 0, 0);
  } else {
    slotDateTimeBR.setHours(hours, minutes, 0, 0);
  }
  
  console.log(`   Slot BR: ${slotDateTimeBR.toISOString()} (${slotDateTimeBR.toLocaleString('pt-BR')})`);
  
  // CORREÇÃO: Usar diretamente o slotDateTimeBR (que já está correto)
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
  
  console.log(`   Comparação: slot(${slotDateTime.getTime()}) < fim(${finalEnd.getTime()}) = ${slotDateTime < finalEnd}`);
  console.log(`   Comparação: slotEnd(${slotEndDateTime.getTime()}) > início(${eventStart.getTime()}) = ${slotEndDateTime > eventStart}`);
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

const criticalTests = [
  { date: '2025-10-20', time: '21:00', expected: false, desc: 'Deve estar DISPONÍVEL' },
  { date: '2025-10-20', time: '22:00', expected: false, desc: 'Deve estar DISPONÍVEL' },
  { date: '2025-10-20', time: '23:00', expected: false, desc: 'Deve estar DISPONÍVEL' }
];

let allCorrect = true;

criticalTests.forEach(test => {
  const isBlocked = testCorrectedSmartCalendar(test.date, test.time, missionData);
  const correct = isBlocked === test.expected;
  
  if (!correct) allCorrect = false;
  
  console.log(`   ${test.date} ${test.time}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'} ${correct ? '✅' : '❌'} (${test.desc})`);
});

console.log('\n🔍 TESTE VALIDAÇÃO - OUTROS SLOTS:');

const validationTests = [
  { date: '2025-10-19', time: '23:00', expected: true, desc: 'Deve estar BLOQUEADO (partida da missão)' },
  { date: '2025-10-21', time: '00:00', expected: true, desc: 'Deve estar BLOQUEADO (buffer pós-missão)' },
  { date: '2025-10-21', time: '01:00', expected: true, desc: 'Deve estar BLOQUEADO (buffer pós-missão)' },
  { date: '2025-10-21', time: '02:00', expected: false, desc: 'Deve estar DISPONÍVEL (após fim do bloqueio)' }
];

validationTests.forEach(test => {
  const isBlocked = testCorrectedSmartCalendar(test.date, test.time, missionData);
  const correct = isBlocked === test.expected;
  
  if (!correct) allCorrect = false;
  
  console.log(`   ${test.date} ${test.time}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'} ${correct ? '✅' : '❌'} (${test.desc})`);
});

console.log('\n🏆 RESULTADO FINAL:');
if (allCorrect) {
  console.log('   ✅ TODOS OS TESTES PASSARAM! O problema foi RESOLVIDO!');
  console.log('   🎉 Slots 21h+ no dia 20/10 agora devem aparecer DISPONÍVEIS no calendário.');
} else {
  console.log('   ❌ Ainda há problemas na lógica. Verificar implementação.');
}