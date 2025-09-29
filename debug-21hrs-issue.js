console.log('🔍 DEBUG ESPECÍFICO - PROBLEMA 21:00 HORAS');
console.log('=' .repeat(60));

function debugSlot21Hours(date, time, event) {
  const [hours, minutes] = time.split(':').map(Number);
  
  console.log(`\n⏰ DEBUGANDO SLOT ${time}:`);
  console.log(`   hours: ${hours}, minutes: ${minutes}`);
  
  // Lógica atual do SmartCalendar
  let slotUTC;
  if (hours < 21) {
    slotUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours + 3, minutes, 0, 0));
    console.log(`   Condição: hours < 21 (${hours} < 21) = TRUE`);
    console.log(`   Usando MESMO DIA: ${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
  } else {
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    slotUTC = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), (hours + 3) % 24, minutes, 0, 0));
    console.log(`   Condição: hours >= 21 (${hours} >= 21) = TRUE`);
    console.log(`   Usando PRÓXIMO DIA: ${nextDay.getFullYear()}-${nextDay.getMonth()}-${nextDay.getDate()}`);
  }
  
  console.log(`   slotUTC gerado: ${slotUTC.toISOString()}`);
  console.log(`   Equivale em BRT: ${new Date(slotUTC.getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR')}`);
  
  const slotEndUTC = new Date(slotUTC.getTime() + (60 * 60 * 1000));
  const eventStartUTC = new Date(event.start);
  const blockedUntilUTC = new Date(event.resource.blocked_until);
  
  console.log(`   slotEndUTC: ${slotEndUTC.toISOString()}`);
  console.log(`   eventStartUTC: ${eventStartUTC.toISOString()}`);
  console.log(`   blockedUntilUTC: ${blockedUntilUTC.toISOString()}`);
  
  const condition1 = slotUTC < blockedUntilUTC;
  const condition2 = slotEndUTC > eventStartUTC;
  const isBlocked = condition1 && condition2;
  
  console.log(`   Condição 1 (slotUTC < blockedUntil): ${condition1}`);
  console.log(`   Condição 2 (slotEndUTC > eventStart): ${condition2}`);
  console.log(`   Resultado: ${isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'}`);
  
  return { slotUTC, isBlocked };
}

// Cenário problemático: missão que termina 18:00, pós-voo até 22:00
const event = {
  start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT
  end: new Date('2025-09-15T21:00:00.000Z'),   // 18:00 BRT
  resource: {
    blocked_until: '2025-09-16T01:00:00.000Z', // 22:00 BRT
    flight_hours: 2
  }
};

const date = new Date(2025, 8, 15); // 15 de setembro

console.log('📊 CENÁRIO PROBLEMÁTICO:');
console.log(`   Data: ${date.toLocaleDateString('pt-BR')}`);
console.log(`   Missão: 15:00-18:00 BRT`);
console.log(`   Pós-voo até: 22:00 BRT (${event.resource.blocked_until})`);

// Testar especificamente os slots problemáticos
const problematicSlots = ['20:00', '21:00', '22:00'];

problematicSlots.forEach(time => {
  const result = debugSlot21Hours(date, time, event);
  
  const hourNum = parseInt(time.split(':')[0]);
  const expectedBlocked = hourNum < 22; // Deveria estar bloqueado até 21:59
  const actualBlocked = result.isBlocked;
  
  console.log(`   ESPERADO: ${expectedBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'}`);
  console.log(`   STATUS: ${actualBlocked === expectedBlocked ? '✅ CORRETO' : '❌ INCORRETO'}`);
  
  if (time === '21:00') {
    console.log(`\n🚨 FOCO NO PROBLEMA 21:00:`);
    console.log(`   21:00 BRT deveria ser: 2025-09-16T00:00:00.000Z (00:00 UTC do dia 16)`);
    console.log(`   21:00 BRT está sendo: ${result.slotUTC.toISOString()}`);
    console.log(`   PROBLEMA: ${result.slotUTC.toISOString() === '2025-09-16T00:00:00.000Z' ? 'NÃO ENCONTRADO' : 'ENCONTRADO - CONVERSÃO ERRADA!'}`);
  }
});

console.log('\n💡 ANÁLISE:');
console.log('Se 21:00 está sendo convertido para o próximo dia quando não deveria,');
console.log('o problema pode estar na condição: hours < 21 vs hours >= 21');
console.log('Talvez a condição deveria ser hours <= 20 vs hours >= 21');