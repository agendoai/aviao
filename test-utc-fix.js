console.log('🎯 TESTE CONVERSÃO UTC CORRETA');
console.log('=' .repeat(50));

function testUTCConversion(date, time, event) {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Criar slot em UTC considerando que o horário é BRT (UTC-3)
  // 22:00 BRT = 01:00 UTC do próximo dia
  let slotUTC;
  if (hours < 21) {
    // 00:00-20:59 BRT = mesmo dia UTC + 3h
    slotUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours + 3, minutes, 0, 0));
  } else {
    // 21:00-23:59 BRT = próximo dia UTC + (horas-21)h
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    slotUTC = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), (hours + 3) % 24, minutes, 0, 0));
  }
  
  // Usar blocked_until em UTC
  let blockedUntilUTC;
  if (event.resource?.blocked_until) {
    blockedUntilUTC = new Date(event.resource.blocked_until);
  } else {
    blockedUntilUTC = new Date(event.end);
  }
  
  // Comparar UTC com UTC
  const slotEndUTC = new Date(slotUTC.getTime() + (60 * 60 * 1000)); // +1h
  const eventStartUTC = new Date(event.start);
  const isBlocked = slotUTC < blockedUntilUTC && slotEndUTC > eventStartUTC;
  
  return {
    slotUTC,
    blockedUntilUTC,
    isBlocked
  };
}

// Dados do evento
const event = {
  start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT
  end: new Date('2025-09-15T21:00:00.000Z'),   // 18:00 BRT
  resource: {
    blocked_until: '2025-09-16T01:00:00.000Z'  // 22:00 BRT = 01:00 UTC dia seguinte
  }
};

const date = new Date(2025, 8, 15); // 15 de setembro de 2025

console.log('📊 Dados do evento:');
console.log(`   blocked_until UTC: ${event.resource.blocked_until}`);
console.log(`   Equivale a: 22:00 BRT do dia 15/09`);
console.log('');

console.log('🔧 Testando conversões específicas:');

// Testar conversões críticas
console.log('22:00 BRT → UTC:');
const result22 = testUTCConversion(date, '22:00', event);
console.log(`   22:00 BRT = ${result22.slotUTC.toISOString()}`);
console.log(`   blocked_until = ${result22.blockedUntilUTC.toISOString()}`);
console.log(`   Conversão correta: ${result22.slotUTC.toISOString() === '2025-09-16T01:00:00.000Z' ? '✅ SIM' : '❌ NÃO'}`);
console.log('');

// Testar todos os slots
const slots = ['19:00', '20:00', '21:00', '22:00', '23:00'];
let allCorrect = true;

console.log('🧪 Testando todos os slots:');
slots.forEach(time => {
  const result = testUTCConversion(date, time, event);
  const expected = time >= '22:00';
  const actual = result.isBlocked;
  const correct = actual === expected;
  
  if (!correct) allCorrect = false;
  
  console.log(`   ${time} BRT: ${actual ? 'BLOQUEADO' : 'DISPONÍVEL'} ${correct ? '✅' : '❌'} (esperado: ${expected ? 'BLOQUEADO' : 'DISPONÍVEL'})`);
  console.log(`     UTC: ${result.slotUTC.toISOString()}`);
});

console.log('');
if (allCorrect) {
  console.log('🎉 CONVERSÃO UTC FUNCIONANDO PERFEITAMENTE!');
  console.log('   ✅ 22:00 BRT = 01:00 UTC (próximo dia)');
  console.log('   ✅ Slots 19:00-21:00: DISPONÍVEIS');
  console.log('   ✅ Slots 22:00+: BLOQUEADOS');
  console.log('   ✅ Pós-voo não vira mais pro dia seguinte incorretamente!');
} else {
  console.log('❌ Ainda há problemas na conversão...');
}