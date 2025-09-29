console.log('🎯 TESTE LÓGICA CORRETA - Períodos Separados');
console.log('=' .repeat(60));

function testCorrectLogic(date, time, event) {
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
  const eventEndUTC = new Date(event.end); // Fim real da missão
  
  // Lógica CORRETA: Slot bloqueado apenas se sobrepor com períodos ocupados
  let isOccupied = false;
  
  // 1. Verificar se sobrepoe com a missão (início até fim)
  if (slotUTC < eventEndUTC && slotEndUTC > eventStartUTC) {
    isOccupied = true;
  }
  
  // 2. Verificar se está no período de pós-voo (21:00-22:00 BRT = 00:00-01:00 UTC)
  if (event.resource?.blocked_until) {
    const blockedUntilUTC = new Date(event.resource.blocked_until);
    
    // Calcular início do pós-voo: fim da missão + tempo de voo de volta
    const totalFlightHours = event.resource?.flight_hours || 2;
    const returnFlightHours = totalFlightHours / 2;
    const postFlightStartUTC = new Date(eventEndUTC.getTime() + (returnFlightHours * 60 * 60 * 1000));
    
    // Slot bloqueado se estiver no período de pós-voo
    if (slotUTC >= postFlightStartUTC && slotUTC < blockedUntilUTC) {
      isOccupied = true;
    }
  }
  
  return {
    time,
    slotUTC,
    slotEndUTC,
    eventStartUTC,
    eventEndUTC,
    postFlightStartUTC: event.resource?.blocked_until ? 
      new Date(new Date(event.end).getTime() + ((event.resource?.flight_hours || 2) / 2 * 60 * 60 * 1000)) : null,
    blockedUntilUTC: event.resource?.blocked_until ? new Date(event.resource.blocked_until) : null,
    isOccupied
  };
}

// Dados da missão
const event = {
  start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT - Início
  end: new Date('2025-09-15T21:00:00.000Z'),   // 18:00 BRT - Fim da missão
  resource: {
    blocked_until: '2025-09-16T01:00:00.000Z', // 22:00 BRT - Fim do pós-voo
    flight_hours: 2 // 1h ida + 1h volta
  }
};

const date = new Date(2025, 8, 15);

console.log('📊 CRONOGRAMA DA MISSÃO:');
console.log(`   Missão: 15:00-18:00 BRT`);
console.log(`   Voo de volta: 18:00-19:00 BRT (1h)`);
console.log(`   Pós-voo: 19:00-22:00 BRT (3h manutenção)`);
console.log(`   Disponível novamente: 22:00 BRT`);
console.log('');

console.log('✅ PERÍODOS CORRETOS:');
console.log('   • 15:00-18:00 BRT: BLOQUEADO (missão)');
console.log('   • 19:00-21:00 BRT: DISPONÍVEL (entre voo volta e pós-voo)');
console.log('   • 22:00+ BRT: DISPONÍVEL (após pós-voo)');
console.log('');

console.log('🧪 TESTANDO NOVA LÓGICA:');
['15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].forEach(time => {
  const result = testCorrectLogic(date, time, event);
  
  // Determinar expectativa baseada no cronograma
  let expected = false;
  if (time >= '15:00' && time < '18:00') expected = true; // Missão
  // 18:00-21:00 disponível 
  // 22:00+ disponível
  
  const status = result.isOccupied === expected ? '✅' : '❌';
  
  console.log(`   ${time} BRT: ${result.isOccupied ? 'BLOQUEADO' : 'DISPONÍVEL'} ${status}`);
  
  if (time === '19:00') {
    console.log(`     → Pós-voo inicia: ${result.postFlightStartUTC?.toISOString()} (19:00 BRT)`);
    console.log(`     → Slot UTC: ${result.slotUTC.toISOString()}`);
    console.log(`     → Deveria estar DISPONÍVEL entre fim da missão e início do pós-voo`);
  }
});

console.log('\n💡 EXPLICAÇÃO:');
console.log('   A nova lógica separa corretamente:');
console.log('   1. Período da missão (15:00-18:00)');
console.log('   2. Período livre (18:00-19:00) - voo de volta, mas slots podem ser usados');
console.log('   3. Período de pós-voo (19:00-22:00) - manutenção');
console.log('   4. Período livre (22:00+)');