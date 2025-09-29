console.log('🎯 TESTE COM DADOS REAIS DA MISSÃO');
console.log('=' .repeat(50));

// Dados reais da missão 16035
const missao = {
  id: 16035,
  departure_date: "2025-09-15T02:00:00.000Z",  // 23:00 BRT dia 14 (pré-voo)
  return_date: "2025-09-15T22:10:12.000Z",     // 19:10 BRT dia 15
  blocked_until: "2025-09-15T22:10:12.000Z",   // 19:10 BRT dia 15
  maintenance_buffer_hours: 3,
  origin: "SBAU",
  destination: "SBKP"
};

console.log('📊 DADOS DA MISSÃO (como vem do backend):');
console.log(`   departure_date: ${missao.departure_date}`);
console.log(`   return_date: ${missao.return_date}`);
console.log(`   blocked_until: ${missao.blocked_until}`);
console.log('');

// Converter para horário brasileiro
const departureUTC = new Date(missao.departure_date);
const returnUTC = new Date(missao.return_date);
const blockedUntilUTC = new Date(missao.blocked_until);

const departureBRT = new Date(departureUTC.getTime() - (3 * 60 * 60 * 1000));
const returnBRT = new Date(returnUTC.getTime() - (3 * 60 * 60 * 1000));
const blockedUntilBRT = new Date(blockedUntilUTC.getTime() - (3 * 60 * 60 * 1000));

console.log('🕒 HORÁRIOS EM BRT:');
console.log(`   Início (pré-voo): ${departureBRT.toLocaleString('pt-BR')}`);
console.log(`   Fim: ${returnBRT.toLocaleString('pt-BR')}`);
console.log(`   Bloqueado até: ${blockedUntilBRT.toLocaleString('pt-BR')}`);
console.log('');

// Testar slots para o dia 15/09
const dia15 = new Date(2025, 8, 15);
const slots = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];

console.log('🧪 TESTANDO SLOTS DIA 15/09:');

function testarSlot(date, time, missao) {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Slot em horário brasileiro
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  
  // Dados da missão em horário brasileiro
  const eventStart = new Date(new Date(missao.departure_date).getTime() - (3 * 60 * 60 * 1000));
  const eventEnd = new Date(new Date(missao.blocked_until).getTime() - (3 * 60 * 60 * 1000));
  
  // Verificar se há sobreposição
  const isBlocked = slotDateTime < eventEnd && slotEndDateTime > eventStart;
  
  return {
    slotDateTime,
    eventStart,
    eventEnd,
    isBlocked
  };
}

slots.forEach(time => {
  const resultado = testarSlot(dia15, time, missao);
  
  console.log(`   ${time}: ${resultado.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'}`);
  console.log(`     → Slot: ${resultado.slotDateTime.toLocaleString('pt-BR')}`);
  console.log(`     → Missão: ${resultado.eventStart.toLocaleString('pt-BR')} até ${resultado.eventEnd.toLocaleString('pt-BR')}`);
  console.log('');
});

console.log('💡 RESULTADO ESPERADO:');
console.log('   18:00-19:10: BLOQUEADOS (dentro do período da missão)');
console.log('   19:11+: DISPONÍVEIS (após o término da missão)');
console.log('');

console.log('🎉 LÓGICA CORRIGIDA:');
console.log('   ✅ Usa departure_date e blocked_until diretamente');
console.log('   ✅ Converte UTC para BRT corretamente (-3h)');
console.log('   ✅ Testa sobreposição simples entre slot e período da missão');
console.log('   ✅ Não complica com cálculos extras de pós-voo');