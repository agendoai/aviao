console.log('🔍 DEBUG DETALHADO DO PROBLEMA');
console.log('=' .repeat(60));

function debugSlotLogic(date, time, event) {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Criar slot em UTC
  let slotUTC;
  if (hours < 21) {
    slotUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours + 3, minutes, 0, 0));
  } else {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    slotUTC = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), (hours + 3) % 24, minutes, 0, 0));
  }
  
  const blockedUntilUTC = new Date(event.resource.blocked_until);
  const slotEndUTC = new Date(slotUTC.getTime() + (60 * 60 * 1000));
  const eventStartUTC = new Date(event.start);
  const eventEndUTC = new Date(event.end);
  
  const isBlocked = slotUTC < blockedUntilUTC && slotEndUTC > eventStartUTC;
  
  return {
    time,
    slotUTC,
    slotEndUTC,
    eventStartUTC,
    eventEndUTC,
    blockedUntilUTC,
    isBlocked,
    shouldBeBlocked: time >= '22:00' // Expectativa
  };
}

// Dados simulados
const event = {
  start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT - Início da missão
  end: new Date('2025-09-15T21:00:00.000Z'),   // 18:00 BRT - Fim da missão
  resource: {
    blocked_until: '2025-09-16T01:00:00.000Z'  // 22:00 BRT - Fim do pós-voo
  }
};

const date = new Date(2025, 8, 15);

console.log('📊 CENÁRIO DA MISSÃO:');
console.log(`   Missão: 15:00-18:00 BRT (${event.start.toISOString()} - ${event.end.toISOString()})`);
console.log(`   Pós-voo até: 22:00 BRT (${event.resource.blocked_until})`);
console.log('');
console.log('💡 EXPECTATIVA:');
console.log('   • 19:00-21:00 BRT: DISPONÍVEIS (após fim da missão, antes do fim do pós-voo)');
console.log('   • 22:00+ BRT: BLOQUEADOS (durante pós-voo)');
console.log('');

console.log('🔍 ANÁLISE DETALHADA:');
['19:00', '20:00', '21:00', '22:00'].forEach(time => {
  const debug = debugSlotLogic(date, time, event);
  
  console.log(`\n⏰ SLOT ${time} BRT:`);
  console.log(`   Slot UTC: ${debug.slotUTC.toISOString()} - ${debug.slotEndUTC.toISOString()}`);
  console.log(`   Missão UTC: ${debug.eventStartUTC.toISOString()} - ${debug.eventEndUTC.toISOString()}`);
  console.log(`   Blocked até: ${debug.blockedUntilUTC.toISOString()}`);
  console.log(`   Condições:`);
  console.log(`     slotUTC < blockedUntil: ${debug.slotUTC < debug.blockedUntilUTC} (${debug.slotUTC.toISOString()} < ${debug.blockedUntilUTC.toISOString()})`);
  console.log(`     slotEndUTC > eventStart: ${debug.slotEndUTC > debug.eventStartUTC} (${debug.slotEndUTC.toISOString()} > ${debug.eventStartUTC.toISOString()})`);
  console.log(`   Resultado: ${debug.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'} ${debug.isBlocked === debug.shouldBeBlocked ? '✅' : '❌'}`);
  console.log(`   Esperado: ${debug.shouldBeBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'}`);
});

console.log('\n🤔 ANÁLISE DO PROBLEMA:');
console.log('A lógica atual bloqueia desde o INÍCIO da missão (15:00) até o fim do pós-voo (22:00)');
console.log('Mas deveria bloquear apenas:');
console.log('1. Pré-voo: 12:00-15:00 (3h antes)');  
console.log('2. Missão: 15:00-18:00');
console.log('3. Pós-voo: 19:00-22:00');
console.log('');
console.log('❌ Slots 19:00-21:00 estão sendo bloqueados incorretamente!');
console.log('✅ Eles deveriam estar DISPONÍVEIS porque a missão já terminou às 18:00');