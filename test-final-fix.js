// Teste FINAL: Validação da correção completa do problema de timezone
console.log('🎯 TESTE FINAL: CORREÇÃO COMPLETA TIMEZONE 21H+');
console.log('=' .repeat(60));

// Simular a lógica FINAL corrigida do SmartCalendar
function testFinalSlotBlocking(dateStr, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Simular como o SmartCalendar recebe a data (do calendário)
  const date = new Date(dateStr); // Esta é a data que vem do calendário
  
  // Criar slot no horário brasileiro (timezone local)
  const slotDateTimeBR = new Date(date);
  if (hours === 0) {
    // 00:00 = meia-noite do próximo dia
    slotDateTimeBR.setDate(date.getDate() + 1);
    slotDateTimeBR.setHours(0, minutes, 0, 0);
  } else {
    // Todos os outros horários (incluindo 21:00-23:30) ficam no mesmo dia
    slotDateTimeBR.setHours(hours, minutes, 0, 0);
  }
  
  // Converter slot para UTC para comparar com as datas UTC do backend
  // Não adicionar 3 horas, pois o Date já está no timezone local
  const slotDateTime = new Date(slotDateTimeBR.toISOString());
  const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  
  // Usar as datas UTC diretamente do backend (sem conversão)
  const eventStart = new Date(missionData.departure_date);
  const finalEnd = new Date(missionData.blocked_until);
  
  // Comparar diretamente em UTC (sem dupla conversão de timezone)
  const isBlocked = slotDateTime < finalEnd && slotEndDateTime > eventStart;
  
  return {
    dateStr,
    timeSlot,
    slotDateTimeBR: slotDateTimeBR.toLocaleString('pt-BR'),
    slotDateTimeUTC: slotDateTime.toISOString(),
    eventStartUTC: eventStart.toISOString(),
    finalEndUTC: finalEnd.toISOString(),
    isBlocked,
    debug: {
      slotStart: slotDateTime.getTime(),
      slotEnd: slotEndDateTime.getTime(),
      missionStart: eventStart.getTime(),
      missionEnd: finalEnd.getTime(),
      slotBeforeEnd: slotDateTime < finalEnd,
      slotEndAfterStart: slotEndDateTime > eventStart
    }
  };
}

// Dados da missão de teste
const missionData = {
  departure_date: "2025-10-20T02:00:00.000Z", // 23:00 BRT do dia 19
  return_date: "2025-10-21T01:54:47.898Z",    // 22:54 BRT do dia 20
  blocked_until: "2025-10-21T04:54:47.898Z"   // 01:54 BRT do dia 21
};

console.log('📊 DADOS DA MISSÃO:');
console.log(`   Partida: ${missionData.departure_date} (23:00 BRT do dia 19)`);
console.log(`   Retorno: ${missionData.return_date} (22:54 BRT do dia 20)`);
console.log(`   Bloqueado até: ${missionData.blocked_until} (01:54 BRT do dia 21)`);
console.log('');

console.log('🎯 TESTE CRÍTICO - DIA 20/10 ÀS 21H+ (problema original):');
const criticalTests = [
  { date: '2025-10-20', time: '21:00', expected: 'DISPONÍVEL' },
  { date: '2025-10-20', time: '22:00', expected: 'DISPONÍVEL' },
  { date: '2025-10-20', time: '23:00', expected: 'DISPONÍVEL' }
];

criticalTests.forEach(test => {
  const result = testFinalSlotBlocking(test.date, test.time, missionData);
  const status = result.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL';
  const correct = (result.isBlocked && test.expected === 'BLOQUEADO') || 
                  (!result.isBlocked && test.expected === 'DISPONÍVEL');
  
  console.log(`   ${test.time}: ${status} ${correct ? '✅' : '❌'} (esperado: ${test.expected})`);
  console.log(`     Slot BR: ${result.slotDateTimeBR}`);
  console.log(`     Slot UTC: ${result.slotDateTimeUTC}`);
  console.log(`     Missão termina: ${result.finalEndUTC}`);
  console.log(`     Debug: slot < fim? ${result.debug.slotBeforeEnd}, slot_end > início? ${result.debug.slotEndAfterStart}`);
  console.log('');
});

console.log('🎯 TESTE VALIDAÇÃO - SLOTS QUE DEVEM ESTAR BLOQUEADOS:');
const blockedTests = [
  { date: '2025-10-19', time: '23:00', expected: 'BLOQUEADO', reason: 'partida da missão' },
  { date: '2025-10-21', time: '00:00', expected: 'BLOQUEADO', reason: 'buffer pós-missão' },
  { date: '2025-10-21', time: '01:00', expected: 'BLOQUEADO', reason: 'buffer pós-missão' }
];

blockedTests.forEach(test => {
  const result = testFinalSlotBlocking(test.date, test.time, missionData);
  const status = result.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL';
  const correct = (result.isBlocked && test.expected === 'BLOQUEADO') || 
                  (!result.isBlocked && test.expected === 'DISPONÍVEL');
  
  console.log(`   ${test.date} ${test.time}: ${status} ${correct ? '✅' : '❌'} (${test.reason})`);
  if (!correct) {
    console.log(`     ⚠️  ERRO: Esperado ${test.expected}`);
    console.log(`     Debug: slot < fim? ${result.debug.slotBeforeEnd}, slot_end > início? ${result.debug.slotEndAfterStart}`);
  }
  console.log('');
});

console.log('🎯 TESTE VALIDAÇÃO - SLOTS QUE DEVEM ESTAR DISPONÍVEIS:');
const availableTests = [
  { date: '2025-10-21', time: '02:00', expected: 'DISPONÍVEL', reason: 'após fim do bloqueio' },
  { date: '2025-10-21', time: '03:00', expected: 'DISPONÍVEL', reason: 'após fim do bloqueio' }
];

availableTests.forEach(test => {
  const result = testFinalSlotBlocking(test.date, test.time, missionData);
  const status = result.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL';
  const correct = (result.isBlocked && test.expected === 'BLOQUEADO') || 
                  (!result.isBlocked && test.expected === 'DISPONÍVEL');
  
  console.log(`   ${test.date} ${test.time}: ${status} ${correct ? '✅' : '❌'} (${test.reason})`);
  if (!correct) {
    console.log(`     ⚠️  ERRO: Esperado ${test.expected}`);
    console.log(`     Debug: slot < fim? ${result.debug.slotBeforeEnd}, slot_end > início? ${result.debug.slotEndAfterStart}`);
  }
  console.log('');
});

console.log('🏆 RESULTADO FINAL:');
console.log('   Se todos os testes acima estão ✅, o problema foi RESOLVIDO!');
console.log('   Slots 21h+ no dia 20/10 agora devem aparecer DISPONÍVEIS no calendário.');