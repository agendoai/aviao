// Teste final da correção do pós-voo
console.log('🎯 TESTE FINAL - Correção do Pós-voo');
console.log('=' .repeat(50));

// Simular exatamente a lógica corrigida do SmartCalendar
function testSlot(date, time, blockedUntilUTC, eventStartUTC) {
  const [hours, minutes] = time.split(':').map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  // Converter blocked_until de UTC para horário brasileiro
  const blockedUntil = new Date(blockedUntilUTC.getTime() - (3 * 60 * 60 * 1000));
  
  // Verificar se o slot está bloqueado
  const slotEnd = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  const eventStartBRT = new Date(eventStartUTC.getTime() - (3 * 60 * 60 * 1000));
  const isBlocked = slotDateTime < blockedUntil && slotEnd > eventStartBRT;
  
  return {
    slotDateTime,
    blockedUntil,
    isBlocked
  };
}

// Dados do teste (baseado no backend)
const date = new Date('2025-09-15T00:00:00-03:00'); // 15 de setembro, horário brasileiro
const blockedUntilUTC = new Date('2025-09-16T01:00:00.000Z'); // 22:00 BRT = 01:00 UTC dia seguinte
const eventStartUTC = new Date('2025-09-15T18:00:00.000Z'); // 15:00 BRT = 18:00 UTC

console.log('📊 Cenário de teste:');
console.log(`   Data: ${date.toLocaleDateString('pt-BR')}`);
console.log(`   blocked_until UTC: ${blockedUntilUTC.toISOString()}`);
console.log(`   blocked_until BRT: ${new Date(blockedUntilUTC.getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR')}`);
console.log('');

// Testar slots específicos
const testSlots = [
  { time: '19:00', expected: 'DISPONÍVEL' },
  { time: '20:00', expected: 'DISPONÍVEL' },
  { time: '21:00', expected: 'DISPONÍVEL' },
  { time: '22:00', expected: 'BLOQUEADO' },
  { time: '23:00', expected: 'BLOQUEADO' }
];

console.log('🕐 Resultados:');
testSlots.forEach(({ time, expected }) => {
  const result = testSlot(date, time, blockedUntilUTC, eventStartUTC);
  const actual = result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL';
  const correct = actual === expected;
  
  console.log(`   ${time}: ${actual} ${correct ? '✅' : '❌'} (esperado: ${expected})`);
  if (time === '22:00') {
    console.log(`     Debug: slot=${result.slotDateTime.toLocaleString('pt-BR')}, blocked=${result.blockedUntil.toLocaleString('pt-BR')}`);
  }
});

console.log('');
console.log('🎯 Status:');
const correctResults = testSlots.filter(({ time, expected }) => {
  const result = testSlot(date, time, blockedUntilUTC, eventStartUTC);
  const actual = result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL';
  return actual === expected;
});

if (correctResults.length === testSlots.length) {
  console.log('   ✅ TODOS OS SLOTS CORRETOS! Problema resolvido!');
} else {
  console.log(`   ❌ ${correctResults.length}/${testSlots.length} slots corretos. Ainda há problemas.`);
}

console.log('');
console.log('💡 Explicação do que deveria acontecer:');
console.log('   • Missão termina às 18:00 BRT');
console.log('   • Pós-voo de 3h: 18:00 + 1h (volta) + 3h (manutenção) = 22:00 BRT');
console.log('   • Slots 19:00, 20:00, 21:00 devem estar DISPONÍVEIS');
console.log('   • Slots 22:00+ devem estar BLOQUEADOS');