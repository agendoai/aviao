// Teste simulando EXATAMENTE a lógica corrigida do SmartCalendar
console.log('🏆 TESTE FINAL - SmartCalendar Corrigido');
console.log('=' .repeat(60));

function testSmartCalendarCorrected(date, time, event) {
  // Simular exatamente o que está no SmartCalendar
  const [hours, minutes] = time.split(':').map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  // Converter para UTC assumindo que o slot está em horário brasileiro (UTC-3)
  // 22:00 BRT = 22:00 + 3 = 01:00 UTC do dia seguinte
  const slotUTC = new Date(slotDateTime.getTime() + (3 * 60 * 60 * 1000));
  
  // blocked_until vem do backend em UTC, usar diretamente
  let blockedUntil;
  if (event.resource?.blocked_until) {
    blockedUntil = new Date(event.resource.blocked_until);
  } else {
    blockedUntil = new Date(event.end);
  }
  
  // Comparar slot UTC com blocked_until UTC
  const slotEndUTC = new Date(slotUTC.getTime() + (60 * 60 * 1000));
  const eventStartUTC = new Date(event.start);
  const isBlocked = slotUTC < blockedUntil && slotEndUTC > eventStartUTC;
  
  return {
    slotDateTime,
    slotUTC,
    blockedUntil,
    isBlocked
  };
}

// Dados simulados da missão (como vêm do backend)
const event = {
  start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT
  end: new Date('2025-09-15T21:00:00.000Z'),   // 18:00 BRT
  resource: {
    blocked_until: '2025-09-16T01:00:00.000Z'  // 22:00 BRT
  }
};

const testDate = new Date('2025-09-15');

console.log('📊 Dados do evento:');
console.log(`   start: ${event.start.toISOString()} (${event.start.toLocaleString('pt-BR')})`);
console.log(`   end: ${event.end.toISOString()} (${event.end.toLocaleString('pt-BR')})`);
console.log(`   blocked_until: ${event.resource.blocked_until} (${new Date(event.resource.blocked_until).toLocaleString('pt-BR')})`);
console.log('');

// Testar slots críticos
const testSlots = ['19:00', '20:00', '21:00', '22:00', '23:00'];

console.log('🕐 Resultados finais:');
testSlots.forEach(time => {
  const result = testSmartCalendarCorrected(testDate, time, event);
  const expected = time >= '22:00' ? 'BLOQUEADO' : 'DISPONÍVEL';
  const actual = result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL';
  const correct = actual === expected;
  
  console.log(`   ${time}: ${actual} ${correct ? '✅' : '❌'} (esperado: ${expected})`);
  
  if (time === '22:00') {
    console.log(`     → slot 22:00 BRT = ${result.slotUTC.toISOString()}`);
    console.log(`     → blocked_until = ${result.blockedUntil.toISOString()}`);
    console.log(`     → 22:00 BRT deveria ser = 2025-09-16T01:00:00.000Z`);
    console.log(`     → Conversão correta: ${result.slotUTC.toISOString() === '2025-09-16T01:00:00.000Z' ? '✅' : '❌'}`);
  }
});

// Verificar se todos estão corretos
const allCorrect = testSlots.every(time => {
  const result = testSmartCalendarCorrected(testDate, time, event);
  const expected = time >= '22:00' ? 'BLOQUEADO' : 'DISPONÍVEL';
  const actual = result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL';
  return actual === expected;
});

console.log('');
console.log(`🎯 Resultado final: ${allCorrect ? '✅ TODOS CORRETOS!' : '❌ Ainda há problemas'}`);

if (allCorrect) {
  console.log('');
  console.log('🎉 PROBLEMA RESOLVIDO!');
  console.log('   ✅ Slots 19:00, 20:00, 21:00 estão DISPONÍVEIS');
  console.log('   ✅ Slots 22:00, 23:00 estão BLOQUEADOS');
  console.log('   ✅ Pós-voo permanece no mesmo dia até 21:59');
  console.log('   ✅ Manutenção inicia corretamente às 22:00');
}