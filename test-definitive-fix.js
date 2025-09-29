console.log('🔧 CORREÇÃO DEFINITIVA - Problema do Pós-voo');
console.log('=' .repeat(60));

// Vamos simular exatamente como os dados chegam do backend
const missionData = {
  departure_date: '2025-09-15T18:00:00.000Z', // 15:00 BRT
  return_date: '2025-09-15T21:00:00.000Z',    // 18:00 BRT
  blocked_until: '2025-09-16T01:00:00.000Z'   // 22:00 BRT = 01:00 UTC dia seguinte
};

console.log('📊 Dados da missão (do backend):');
console.log(`   departure_date: ${missionData.departure_date} (${new Date(missionData.departure_date).toLocaleString('pt-BR')})`);
console.log(`   return_date: ${missionData.return_date} (${new Date(missionData.return_date).toLocaleString('pt-BR')})`);
console.log(`   blocked_until: ${missionData.blocked_until} (${new Date(missionData.blocked_until).toLocaleString('pt-BR')})`);
console.log('');

// Simular como o SmartCalendar deve funcionar
function testSmartCalendarLogic(date, time, missionData) {
  // 1. Criar slot em horário local brasileiro
  const [hours, minutes] = time.split(':').map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  // 2. Obter blocked_until do backend (já está em UTC)
  const blockedUntilUTC = new Date(missionData.blocked_until);
  
  // 3. Converter slot para UTC para comparação
  // ATENÇÃO: Brasil é UTC-3, então para converter BRT para UTC, adicionamos 3h
  const slotDateTimeUTC = new Date(slotDateTime.getTime() + (3 * 60 * 60 * 1000));
  
  // 4. Comparar UTC com UTC
  const isBlocked = slotDateTimeUTC < blockedUntilUTC;
  
  return {
    slotDateTime,
    slotDateTimeUTC,
    blockedUntilUTC,
    isBlocked
  };
}

// Testar data específica
const testDate = new Date('2025-09-15T00:00:00'); // 15 de setembro

console.log('🧪 Testando lógica corrigida:');
const testSlots = ['19:00', '20:00', '21:00', '22:00', '23:00'];

testSlots.forEach(time => {
  const result = testSmartCalendarLogic(testDate, time, missionData);
  const expected = time >= '22:00' ? 'BLOQUEADO' : 'DISPONÍVEL';
  const actual = result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL';
  const correct = actual === expected;
  
  console.log(`   ${time}: ${actual} ${correct ? '✅' : '❌'} (esperado: ${expected})`);
  if (time === '22:00') {
    console.log(`     Slot BRT: ${result.slotDateTime.toLocaleString('pt-BR')}`);
    console.log(`     Slot UTC: ${result.slotDateTimeUTC.toISOString()}`);
    console.log(`     Blocked UTC: ${result.blockedUntilUTC.toISOString()}`);
    console.log(`     22:00 BRT = 01:00 UTC do dia seguinte: ${result.slotDateTimeUTC.toISOString()}`);
  }
});

console.log('');
console.log('🎯 Análise:');
console.log('   22:00 BRT (15/09) = 01:00 UTC (16/09)');
console.log('   blocked_until = 01:00 UTC (16/09)');
console.log('   Logo, 22:00 BRT está EXATAMENTE no limite (= blocked_until)');
console.log('   Por isso, slots >= 22:00 devem estar BLOQUEADOS');

console.log('');
console.log('💡 A lógica correta no SmartCalendar:');
console.log('   1. Slot criado em horário brasileiro');
console.log('   2. Converter slot para UTC (+3h)');
console.log('   3. Comparar slot UTC < blocked_until UTC');
console.log('   4. Se TRUE, slot está BLOQUEADO');