console.log('🔧 SOLUÇÃO SIMPLES - Teste do Pós-voo');
console.log('=' .repeat(50));

// Simular exatamente a solução simples
function testSolucaoSimples(date, time, event) {
  // SOLUÇÃO SIMPLES: Criar slot direto sem confusão de fuso
  const [hours, minutes] = time.split(':').map(Number);
  const slotDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
  
  // SOLUÇÃO SIMPLES: Converter blocked_until para horário brasileiro e comparar direto
  let blockedUntilBRT;
  if (event.resource?.blocked_until) {
    const blockedUTC = new Date(event.resource.blocked_until);
    blockedUntilBRT = new Date(blockedUTC.getTime() - (3 * 60 * 60 * 1000)); // UTC-3 = BRT
  } else {
    const endUTC = new Date(event.end);
    blockedUntilBRT = new Date(endUTC.getTime() - (3 * 60 * 60 * 1000)); // UTC-3 = BRT
  }
  
  // COMPARAÇÃO SIMPLES: Horário brasileiro com horário brasileiro
  const slotEnd = new Date(slotDateTime.getTime() + (60 * 60 * 1000)); // +1h
  const eventStartBRT = new Date(new Date(event.start).getTime() - (3 * 60 * 60 * 1000)); // UTC para BRT
  const isBlocked = slotDateTime < blockedUntilBRT && slotEnd > eventStartBRT;
  
  return {
    slotDateTime,
    blockedUntilBRT,
    isBlocked
  };
}

// Evento simulado (dados do backend)
const event = {
  start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT
  end: new Date('2025-09-15T21:00:00.000Z'),   // 18:00 BRT
  resource: {
    blocked_until: '2025-09-16T01:00:00.000Z'  // 22:00 BRT (deveria ser)
  }
};

const date = new Date(2025, 8, 15); // 15 de setembro de 2025

console.log('📊 Dados do evento:');
console.log(`   blocked_until UTC: ${event.resource.blocked_until}`);
console.log(`   blocked_until BRT (calculado): ${new Date(new Date(event.resource.blocked_until).getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR')}`);
console.log('');

// Testar slots do pós-voo
const slots = ['19:00', '20:00', '21:00', '22:00', '23:00'];

console.log('🕐 Testando solução simples:');
slots.forEach(time => {
  const result = testSolucaoSimples(date, time, event);
  const expected = time >= '22:00' ? 'BLOQUEADO' : 'DISPONÍVEL';
  const actual = result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL';
  const status = actual === expected ? '✅' : '❌';
  
  console.log(`   ${time}: ${actual} ${status} (esperado: ${expected})`);
  
  if (time === '21:00' || time === '22:00') {
    console.log(`     slot: ${result.slotDateTime.toLocaleString('pt-BR')}`);
    console.log(`     blocked: ${result.blockedUntilBRT.toLocaleString('pt-BR')}`);
  }
});

// Verificar se funcionou
const allCorrect = slots.every(time => {
  const result = testSolucaoSimples(date, time, event);
  const expected = time >= '22:00' ? 'BLOQUEADO' : 'DISPONÍVEL';
  const actual = result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL';
  return actual === expected;
});

console.log('');
if (allCorrect) {
  console.log('🎉 FUNCIONOU! Solução simples resolveu o problema!');
  console.log('   ✅ 19:00, 20:00, 21:00: DISPONÍVEIS');
  console.log('   ✅ 22:00, 23:00: BLOQUEADOS');
  console.log('   ✅ Pós-voo não vira mais pro dia seguinte incorretamente!');
} else {
  console.log('❌ Ainda não funcionou completamente...');
}