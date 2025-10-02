// Debug: Problema específico na conversão de timezone
console.log('🔍 DEBUG: PROBLEMA CONVERSÃO TIMEZONE');
console.log('=' .repeat(60));

console.log('🚨 PROBLEMA IDENTIFICADO:');
console.log('   new Date(slotDateTimeBR.toISOString()) está criando uma data incorreta');
console.log('   porque toISOString() já converte para UTC, mas estamos tratando como local');
console.log('');

function debugTimezoneConversion(dateStr, timeSlot) {
  console.log(`\n📅 TESTANDO: ${dateStr} às ${timeSlot}`);
  
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const date = new Date(dateStr);
  
  console.log(`   1. Data base: ${date.toISOString()} (${date.toLocaleString('pt-BR')})`);
  
  // Criar slot no horário brasileiro (timezone local)
  const slotDateTimeBR = new Date(date);
  slotDateTimeBR.setHours(hours, minutes, 0, 0);
  
  console.log(`   2. Slot BR: ${slotDateTimeBR.toISOString()} (${slotDateTimeBR.toLocaleString('pt-BR')})`);
  
  // PROBLEMA: Conversão incorreta
  const slotDateTimeIncorrect = new Date(slotDateTimeBR.toISOString());
  console.log(`   3. INCORRETO - new Date(toISOString()): ${slotDateTimeIncorrect.toISOString()} (${slotDateTimeIncorrect.toLocaleString('pt-BR')})`);
  
  // CORREÇÃO: Usar diretamente o objeto Date
  const slotDateTimeCorrect = slotDateTimeBR;
  console.log(`   4. CORRETO - usar direto: ${slotDateTimeCorrect.toISOString()} (${slotDateTimeCorrect.toLocaleString('pt-BR')})`);
  
  return {
    incorrect: slotDateTimeIncorrect,
    correct: slotDateTimeCorrect
  };
}

// Testar conversões
debugTimezoneConversion('2025-10-20', '21:00');
debugTimezoneConversion('2025-10-20', '23:00');

console.log('\n💡 SOLUÇÃO:');
console.log('   Não usar new Date(slotDateTimeBR.toISOString())');
console.log('   Usar diretamente slotDateTimeBR (que já está correto)');

console.log('\n🧪 TESTE DA CORREÇÃO:');

function testCorrectedLogic(dateStr, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const date = new Date(dateStr);
  
  // Criar slot no horário brasileiro (timezone local)
  const slotDateTimeBR = new Date(date);
  if (hours === 0) {
    slotDateTimeBR.setDate(date.getDate() + 1);
    slotDateTimeBR.setHours(0, minutes, 0, 0);
  } else {
    slotDateTimeBR.setHours(hours, minutes, 0, 0);
  }
  
  // CORREÇÃO: Usar diretamente o slotDateTimeBR (que já está em UTC)
  const slotDateTime = slotDateTimeBR;
  const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  
  // Usar as datas UTC diretamente do backend
  const eventStart = new Date(missionData.departure_date);
  const finalEnd = new Date(missionData.blocked_until);
  
  // Comparar diretamente em UTC
  const isBlocked = slotDateTime < finalEnd && slotEndDateTime > eventStart;
  
  return {
    slotDateTimeBR: slotDateTimeBR.toLocaleString('pt-BR'),
    slotDateTimeUTC: slotDateTime.toISOString(),
    eventStartUTC: eventStart.toISOString(),
    finalEndUTC: finalEnd.toISOString(),
    isBlocked,
    debug: {
      slotStart: slotDateTime.getTime(),
      slotEnd: slotEndDateTime.getTime(),
      missionStart: eventStart.getTime(),
      missionEnd: finalEnd.getTime()
    }
  };
}

const missionData = {
  departure_date: "2025-10-20T02:00:00.000Z", // 23:00 BRT do dia 19
  return_date: "2025-10-21T01:54:47.898Z",    // 22:54 BRT do dia 20
  blocked_until: "2025-10-21T04:54:47.898Z"   // 01:54 BRT do dia 21
};

console.log('\n🎯 TESTE SLOTS CRÍTICOS:');
const testCases = [
  { date: '2025-10-20', time: '21:00', expected: 'DISPONÍVEL' },
  { date: '2025-10-20', time: '23:00', expected: 'DISPONÍVEL' },
  { date: '2025-10-19', time: '23:00', expected: 'BLOQUEADO' }
];

testCases.forEach(test => {
  const result = testCorrectedLogic(test.date, test.time, missionData);
  const status = result.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL';
  const correct = (result.isBlocked && test.expected === 'BLOQUEADO') || 
                  (!result.isBlocked && test.expected === 'DISPONÍVEL');
  
  console.log(`   ${test.date} ${test.time}: ${status} ${correct ? '✅' : '❌'} (esperado: ${test.expected})`);
  console.log(`     Slot UTC: ${result.slotDateTimeUTC}`);
  console.log(`     Missão: ${result.eventStartUTC} até ${result.finalEndUTC}`);
  console.log('');
});