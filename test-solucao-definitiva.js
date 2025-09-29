console.log('🏆 SOLUÇÃO DEFINITIVA - Teste do Pós-voo');
console.log('=' .repeat(60));

function testSolucaoDefinitiva(date, time, event) {
  // SOLUÇÃO DEFINITIVA: Criar slot assumindo timezone brasileiro
  const [hours, minutes] = time.split(':').map(Number);
  
  // Criar data em UTC considerando que o slot é em horário brasileiro
  // Se é 22:00 BRT no dia 15/09, isso é 01:00 UTC no dia 16/09
  const slotDateTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0);
  
  // Converter para UTC assumindo que estamos trabalhando com BRT (UTC-3)
  // Então: 22:00 BRT = 22:00 + 3 = 01:00 UTC do próximo dia
  let slotUTC;
  if (hours >= 0 && hours < 21) {
    // 00:00-20:59 BRT = +3h UTC no mesmo dia
    slotUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours + 3, minutes, 0, 0));
  } else {
    // 21:00-23:59 BRT = +3h UTC pro próximo dia
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);
    slotUTC = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), (hours + 3) % 24, minutes, 0, 0));
  }
  
  // CORREÇÃO FINAL: Usar blocked_until em UTC
  let blockedUntilUTC;
  if (event.resource?.blocked_until) {
    blockedUntilUTC = new Date(event.resource.blocked_until);
  } else {
    blockedUntilUTC = new Date(event.end);
  }
  
  // Lógica de bloqueio: slot está bloqueado se estiver entre o início da missão e o fim do pós-voo
  const slotEndUTC = new Date(slotUTC.getTime() + (60 * 60 * 1000)); // +1h
  const eventStartUTC = new Date(event.start);
  
  // Slot bloqueado se: 
  // 1. Começa antes do fim do pós-voo E
  // 2. Termina depois do início da missão
  const isBlocked = slotUTC < blockedUntilUTC && slotEndUTC > eventStartUTC;
  
  return {
    slotDateTime,
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
console.log(`   Significa: 22:00 BRT do dia 15/09`);
console.log('');

// Testar conversões críticas
console.log('🔧 Testando conversões:');
console.log('   22:00 BRT (15/09) deveria virar 01:00 UTC (16/09)');

const slots = ['19:00', '20:00', '21:00', '22:00', '23:00'];
let allCorrect = true;

slots.forEach(time => {
  const result = testSolucaoDefinitiva(date, time, event);
  const expected = time >= '22:00' ? 'BLOQUEADO' : 'DISPONÍVEL';
  const actual = result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL';
  const correct = actual === expected;
  
  if (!correct) allCorrect = false;
  
  console.log(`   ${time}: ${actual} ${correct ? '✅' : '❌'} (esperado: ${expected})`);
  
  if (time === '22:00') {
    console.log(`     → slot UTC: ${result.slotUTC.toISOString()}`);
    console.log(`     → blocked: ${result.blockedUntilUTC.toISOString()}`);
    console.log(`     → Correto: ${result.slotUTC.toISOString() === '2025-09-16T01:00:00.000Z' ? '✅ SIM' : '❌ NÃO'}`);
  }
});

console.log('');
if (allCorrect) {
  console.log('🎉🎉 FINALMENTE RESOLVIDO! 🎉🎉');
  console.log('');
  console.log('✅ O que foi corrigido:');
  console.log('   • Pós-voo não vira mais pro dia seguinte incorretamente');
  console.log('   • 22:00 BRT é corretamente convertido para 01:00 UTC');
  console.log('   • Slots após 21:59 são bloqueados corretamente');
  console.log('   • Timezone brasileiro tratado adequadamente');
  console.log('');
  console.log('🚀 Resultado:');
  console.log('   • Missão termina às 18:00 BRT');
  console.log('   • Pós-voo: 18:00 + 1h + 3h = 22:00 BRT');
  console.log('   • Slots 19:00-21:00: DISPONÍVEIS ✅');
  console.log('   • Slots 22:00+: BLOQUEADOS ✅');
} else {
  console.log('❌ Ainda precisa de ajustes...');
}