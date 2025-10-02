// Correção: Problema de timezone no SmartCalendar para slots 21h+
console.log('🔧 CORREÇÃO: PROBLEMA TIMEZONE SLOTS 21H+');
console.log('=' .repeat(60));

console.log('🚨 PROBLEMA IDENTIFICADO:');
console.log('   O SmartCalendar está criando slotDateTime no horário local,');
console.log('   mas comparando com eventEndLocal que já foi convertido de UTC.');
console.log('   Isso causa inconsistência na comparação de datas.');
console.log('');

// Dados da missão (como vêm do backend)
const missionData = {
  departure_date: "2025-10-20T02:00:00.000Z", // 23:00 BRT do dia 19
  return_date: "2025-10-21T01:54:47.898Z",    // 22:54 BRT do dia 20
  blocked_until: "2025-10-21T04:54:47.898Z"   // 01:54 BRT do dia 21
};

console.log('📊 DADOS DA MISSÃO:');
console.log(`   Partida UTC: ${missionData.departure_date}`);
console.log(`   Retorno UTC: ${missionData.return_date}`);
console.log(`   Bloqueado até UTC: ${missionData.blocked_until}`);
console.log('');

// Função INCORRETA (atual do SmartCalendar)
function logicaIncorreta(date, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Criar slot no horário local brasileiro
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  // Converter datas da missão para horário brasileiro
  const eventStart = new Date(missionData.departure_date);
  const finalEnd = new Date(missionData.blocked_until);
  const eventStartLocal = new Date(eventStart.getTime() - (3 * 60 * 60 * 1000));
  const eventEndLocal = new Date(finalEnd.getTime() - (3 * 60 * 60 * 1000));
  
  const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  const isBlocked = slotDateTime < eventEndLocal && slotEndDateTime > eventStartLocal;
  
  return {
    slotDateTime,
    eventEndLocal,
    isBlocked,
    slotDateTimeBR: slotDateTime.toLocaleString('pt-BR'),
    eventEndLocalBR: eventEndLocal.toLocaleString('pt-BR')
  };
}

// Função CORRETA (proposta)
function logicaCorreta(date, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Criar slot no horário UTC (para comparar com datas UTC do backend)
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  // Converter para UTC (adicionar 3 horas para compensar o fuso brasileiro)
  const slotDateTimeUTC = new Date(slotDateTime.getTime() + (3 * 60 * 60 * 1000));
  
  // Usar datas UTC diretamente do backend
  const eventStart = new Date(missionData.departure_date);
  const finalEnd = new Date(missionData.blocked_until);
  
  const slotEndDateTimeUTC = new Date(slotDateTimeUTC.getTime() + (60 * 60 * 1000));
  const isBlocked = slotDateTimeUTC < finalEnd && slotEndDateTimeUTC > eventStart;
  
  return {
    slotDateTimeUTC,
    finalEnd,
    isBlocked,
    slotDateTimeBR: slotDateTime.toLocaleString('pt-BR'),
    finalEndBR: new Date(finalEnd.getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR')
  };
}

console.log('🧪 COMPARAÇÃO LÓGICA INCORRETA vs CORRETA:');
console.log('');

const testDate = new Date('2025-10-20'); // Dia 20/10
const testSlots = ['21:00', '22:00', '23:00'];

testSlots.forEach(timeSlot => {
  console.log(`⏰ SLOT ${timeSlot}:`);
  
  const incorrect = logicaIncorreta(testDate, timeSlot, missionData);
  const correct = logicaCorreta(testDate, timeSlot, missionData);
  
  console.log(`   LÓGICA ATUAL (INCORRETA):`);
  console.log(`     Slot: ${incorrect.slotDateTimeBR}`);
  console.log(`     Fim missão: ${incorrect.eventEndLocalBR}`);
  console.log(`     Status: ${incorrect.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
  
  console.log(`   LÓGICA CORRIGIDA:`);
  console.log(`     Slot: ${correct.slotDateTimeBR}`);
  console.log(`     Fim missão: ${correct.finalEndBR}`);
  console.log(`     Status: ${correct.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
  
  if (incorrect.isBlocked !== correct.isBlocked) {
    console.log(`   🎯 DIFERENÇA DETECTADA! Correção mudará o resultado.`);
  }
  
  console.log('');
});

console.log('💡 SOLUÇÃO PROPOSTA:');
console.log('   1. Converter slotDateTime para UTC antes da comparação');
console.log('   2. Comparar diretamente com as datas UTC do backend');
console.log('   3. Evitar dupla conversão de timezone que causa inconsistência');
console.log('');

console.log('🎯 RESULTADO ESPERADO APÓS CORREÇÃO:');
console.log('   • Slots 21:00, 22:00, 23:00 do dia 20/10 estarão DISPONÍVEIS');
console.log('   • Apenas slots do dia 21/10 até 01:54 estarão bloqueados');
console.log('   • Calendário mostrará bloqueios no dia correto');