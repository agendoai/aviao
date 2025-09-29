console.log('🎯 TESTE LÓGICA SIMPLES E CORRETA');
console.log('=' .repeat(50));

function testSimpleCorrectLogic(date, time, event) {
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
  
  const slotEndUTC = new Date(slotUTC.getTime() + (60 * 60 * 1000));
  const eventStartUTC = new Date(event.start);
  
  // Lógica SIMPLES: Usar blocked_until como fim real da ocupação
  let blockedUntilUTC;
  if (event.resource?.blocked_until) {
    blockedUntilUTC = new Date(event.resource.blocked_until);
  } else {
    blockedUntilUTC = new Date(event.end);
  }
  
  // Slot está bloqueado se sobrepor com o período ocupado (início até blocked_until)
  const isBlocked = slotUTC < blockedUntilUTC && slotEndUTC > eventStartUTC;
  
  return {
    time,
    slotUTC,
    slotEndUTC,
    eventStartUTC,
    blockedUntilUTC,
    isBlocked
  };
}

// Dados da missão
const event = {
  start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT - Início da missão
  end: new Date('2025-09-15T21:00:00.000Z'),   // 18:00 BRT - Fim da missão
  resource: {
    blocked_until: '2025-09-16T01:00:00.000Z', // 22:00 BRT - Fim total (missão + volta + manutenção)
    flight_hours: 2
  }
};

const date = new Date(2025, 8, 15);

console.log('📊 ENTENDIMENTO CORRETO:');
console.log(`   Período ocupado: 15:00-22:00 BRT (início da missão até fim da manutenção)`);
console.log(`   • 15:00-18:00 BRT: Missão`);
console.log(`   • 18:00-19:00 BRT: Voo de volta`);
console.log(`   • 19:00-22:00 BRT: Manutenção pós-voo`);
console.log(`   • 22:00+ BRT: DISPONÍVEL`);
console.log('');

console.log('🧪 TESTANDO LÓGICA SIMPLES:');

const slots = ['14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

let allCorrect = true;
slots.forEach(time => {
  const result = testSimpleCorrectLogic(date, time, event);
  
  // Expectativa: bloqueado de 15:00 até 21:59, disponível de 22:00+
  const hourNum = parseInt(time.split(':')[0]);
  const expected = hourNum >= 15 && hourNum < 22;
  const actual = result.isBlocked;
  const correct = actual === expected;
  
  if (!correct) allCorrect = false;
  
  console.log(`   ${time} BRT: ${actual ? 'BLOQUEADO' : 'DISPONÍVEL'} ${correct ? '✅' : '❌'} (esperado: ${expected ? 'BLOQUEADO' : 'DISPONÍVEL'})`);
  
  if (time === '21:00' || time === '22:00') {
    console.log(`     → slot UTC: ${result.slotUTC.toISOString()}`);
    console.log(`     → blocked até: ${result.blockedUntilUTC.toISOString()}`);
  }
});

console.log('');
if (allCorrect) {
  console.log('🎉 FUNCIONOU PERFEITAMENTE!');
  console.log('   ✅ Aeronave ocupada: 15:00-21:59 BRT');
  console.log('   ✅ Aeronave disponível: 22:00+ BRT');
  console.log('   ✅ Pós-voo não vira mais pro dia seguinte incorretamente!');
  console.log('   ✅ Conversão de timezone funcionando!');
} else {
  console.log('❌ Ainda há problemas...');
}

console.log('');
console.log('💡 A solução final:');
console.log('   • blocked_until já inclui todo o período ocupado (missão + volta + manutenção)');
console.log('   • Não precisa calcular períodos separados');
console.log('   • Simples: slot bloqueado se estiver entre eventStart e blocked_until');