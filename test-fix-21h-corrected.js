// Teste CORRIGIDO: Validação da correção do problema de timezone 21h+
console.log('🧪 TESTE CORRIGIDO: VALIDAÇÃO CORREÇÃO TIMEZONE 21H+');
console.log('=' .repeat(60));

// Simular a lógica corrigida do SmartCalendar
function testSlotBlocking(date, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Criar slot no horário brasileiro primeiro
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
  const slotDateTime = new Date(slotDateTimeBR.getTime() + (3 * 60 * 60 * 1000));
  const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  
  // Usar as datas UTC diretamente do backend (sem conversão)
  const eventStart = new Date(missionData.departure_date);
  const finalEnd = new Date(missionData.blocked_until);
  
  // Comparar diretamente em UTC (sem dupla conversão de timezone)
  const isBlocked = slotDateTime < finalEnd && slotEndDateTime > eventStart;
  
  return {
    slotDateTimeBR: slotDateTimeBR.toLocaleString('pt-BR'),
    slotDateTimeUTC: slotDateTime.toISOString(),
    eventStartUTC: eventStart.toISOString(),
    finalEndUTC: finalEnd.toISOString(),
    isBlocked,
    comparison: {
      slotStart: slotDateTime.getTime(),
      slotEnd: slotEndDateTime.getTime(),
      missionStart: eventStart.getTime(),
      missionEnd: finalEnd.getTime()
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

console.log('🎯 TESTE SLOTS DO DIA 19/10 (dia da partida):');
const testDate19 = new Date('2025-10-19');
const testSlots19 = ['21:00', '22:00', '23:00'];

testSlots19.forEach(timeSlot => {
  const result = testSlotBlocking(testDate19, timeSlot, missionData);
  console.log(`   ${timeSlot}: ${result.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
  console.log(`     Slot BR: ${result.slotDateTimeBR}`);
  console.log(`     Slot UTC: ${result.slotDateTimeUTC}`);
  
  // Análise detalhada
  if (timeSlot === '23:00') {
    console.log(`     🔍 ANÁLISE 23:00:`);
    console.log(`       Slot inicia: ${new Date(result.comparison.slotStart).toISOString()}`);
    console.log(`       Missão inicia: ${new Date(result.comparison.missionStart).toISOString()}`);
    console.log(`       Slot < Missão? ${result.comparison.slotStart < result.comparison.missionStart}`);
    console.log(`       Deveria estar BLOQUEADO (slot coincide com partida)`);
  }
  console.log('');
});

console.log('🎯 TESTE SLOTS DO DIA 20/10 (dia do retorno):');
const testDate20 = new Date('2025-10-20');
const testSlots20 = ['21:00', '22:00', '23:00'];

testSlots20.forEach(timeSlot => {
  const result = testSlotBlocking(testDate20, timeSlot, missionData);
  console.log(`   ${timeSlot}: ${result.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
  console.log(`     Slot BR: ${result.slotDateTimeBR}`);
  console.log(`     Slot UTC: ${result.slotDateTimeUTC}`);
  
  // Análise detalhada
  if (timeSlot === '22:00') {
    console.log(`     🔍 ANÁLISE 22:00:`);
    console.log(`       Slot inicia: ${new Date(result.comparison.slotStart).toISOString()}`);
    console.log(`       Missão termina: ${new Date(result.comparison.missionEnd).toISOString()}`);
    console.log(`       Slot < Fim? ${result.comparison.slotStart < result.comparison.missionEnd}`);
    console.log(`       Deveria estar BLOQUEADO (ainda dentro do período)`);
  }
  console.log('');
});

console.log('🎯 TESTE SLOTS DO DIA 21/10 (após retorno):');
const testDate21 = new Date('2025-10-21');
const testSlots21 = ['00:00', '01:00', '02:00', '03:00'];

testSlots21.forEach(timeSlot => {
  const result = testSlotBlocking(testDate21, timeSlot, missionData);
  console.log(`   ${timeSlot}: ${result.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
  console.log(`     Slot BR: ${result.slotDateTimeBR}`);
  console.log(`     Slot UTC: ${result.slotDateTimeUTC}`);
  
  // Análise detalhada para 02:00 (deveria estar disponível)
  if (timeSlot === '02:00') {
    console.log(`     🔍 ANÁLISE 02:00:`);
    console.log(`       Slot inicia: ${new Date(result.comparison.slotStart).toISOString()}`);
    console.log(`       Bloqueio termina: ${new Date(result.comparison.missionEnd).toISOString()}`);
    console.log(`       Slot >= Fim? ${result.comparison.slotStart >= result.comparison.missionEnd}`);
    console.log(`       Deveria estar DISPONÍVEL (após fim do bloqueio)`);
  }
  console.log('');
});

console.log('✅ RESULTADO ESPERADO APÓS CORREÇÃO:');
console.log('   • Slot 23:00 do dia 19/10: BLOQUEADO (partida da missão)');
console.log('   • Slots 21:00, 22:00 do dia 20/10: BLOQUEADOS (ainda em missão)');
console.log('   • Slots 00:00, 01:00 do dia 21/10: BLOQUEADOS (buffer pós-missão)');
console.log('   • Slots 02:00+ do dia 21/10: DISPONÍVEIS (após fim do bloqueio)');