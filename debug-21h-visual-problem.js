// Debug: Problema visual de bloqueio às 21h no calendário
console.log('🚨 DEBUG: PROBLEMA VISUAL 21H NO CALENDÁRIO');
console.log('=' .repeat(60));

console.log('🎯 SITUAÇÃO REPORTADA:');
console.log('   • Missão salva corretamente: 20/10 → 21/10');
console.log('   • Problema: slots 21h+ aparecem bloqueados no DIA SEGUINTE');
console.log('   • Esperado: slots 21h+ deveriam estar disponíveis no MESMO DIA');
console.log('');

// Simular dados reais da missão (como vêm do backend)
const missionData = {
  departure_date: "2025-10-20T02:00:00.000Z", // 23:00 BRT do dia 19
  return_date: "2025-10-21T01:54:47.898Z",    // 22:54 BRT do dia 20
  blocked_until: "2025-10-21T04:54:47.898Z"   // 01:54 BRT do dia 21
};

console.log('📊 DADOS DA MISSÃO:');
console.log(`   departure_date: ${missionData.departure_date}`);
console.log(`   return_date: ${missionData.return_date}`);
console.log(`   blocked_until: ${missionData.blocked_until}`);
console.log('');

// Converter para horário brasileiro (como o SmartCalendar faz)
const eventStart = new Date(missionData.departure_date);
const eventEnd = new Date(missionData.return_date);
const blockedUntil = new Date(missionData.blocked_until);

console.log('🕐 CONVERSÃO PARA HORÁRIO BRASILEIRO:');
console.log(`   Partida: ${eventStart.toLocaleString('pt-BR')} (UTC-3)`);
console.log(`   Retorno: ${eventEnd.toLocaleString('pt-BR')} (UTC-3)`);
console.log(`   Bloqueado até: ${blockedUntil.toLocaleString('pt-BR')} (UTC-3)`);
console.log('');

// Simular como o SmartCalendar calcula bloqueios
function simulateSmartCalendarLogic(date, timeSlot, missionData) {
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Lógica do SmartCalendar para criar slotDateTime
  const slotDateTime = new Date(date);
  if (hours === 0) {
    slotDateTime.setDate(date.getDate() + 1);
    slotDateTime.setHours(0, minutes, 0, 0);
  } else {
    slotDateTime.setHours(hours, minutes, 0, 0);
  }
  
  const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  
  // Converter datas da missão para horário brasileiro (como no SmartCalendar)
  const eventStart = new Date(missionData.departure_date);
  const finalEnd = new Date(missionData.blocked_until);
  
  const eventStartLocal = new Date(eventStart.getTime() - (3 * 60 * 60 * 1000));
  const eventEndLocal = new Date(finalEnd.getTime() - (3 * 60 * 60 * 1000));
  
  // Verificar se há conflito
  const isBlocked = slotDateTime < eventEndLocal && slotEndDateTime > eventStartLocal;
  
  return {
    slotDateTime,
    slotEndDateTime,
    eventStartLocal,
    eventEndLocal,
    isBlocked,
    slotDateTimeBR: slotDateTime.toLocaleString('pt-BR'),
    eventStartLocalBR: eventStartLocal.toLocaleString('pt-BR'),
    eventEndLocalBR: eventEndLocal.toLocaleString('pt-BR')
  };
}

// Testar slots problemáticos
console.log('🧪 TESTANDO SLOTS PROBLEMÁTICOS:');
console.log('');

const testDate = new Date('2025-10-20'); // Dia 20/10
const problematicSlots = ['19:00', '20:00', '21:00', '22:00', '23:00'];

problematicSlots.forEach(timeSlot => {
  console.log(`⏰ SLOT ${timeSlot}:`);
  
  const result = simulateSmartCalendarLogic(testDate, timeSlot, missionData);
  
  console.log(`   Slot DateTime: ${result.slotDateTimeBR}`);
  console.log(`   Missão inicia: ${result.eventStartLocalBR}`);
  console.log(`   Missão termina: ${result.eventEndLocalBR}`);
  console.log(`   Status: ${result.isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
  
  // Análise específica para slots 21h+
  if (timeSlot >= '21:00') {
    const shouldBeAvailable = result.slotDateTime >= new Date(result.eventEndLocal);
    console.log(`   Deveria estar disponível: ${shouldBeAvailable ? '✅ SIM' : '❌ NÃO'}`);
    
    if (result.isBlocked && shouldBeAvailable) {
      console.log(`   🚨 PROBLEMA DETECTADO: Slot ${timeSlot} está bloqueado mas deveria estar disponível!`);
    }
  }
  
  console.log('');
});

console.log('🔍 ANÁLISE DO PROBLEMA:');
console.log('');
console.log('O problema pode estar em:');
console.log('1. ❌ Conversão incorreta de timezone (UTC → BRT)');
console.log('2. ❌ Lógica de comparação de datas no SmartCalendar');
console.log('3. ❌ Cálculo incorreto do blocked_until no backend');
console.log('4. ❌ Filtro de eventos por dia não está funcionando corretamente');
console.log('');

// Verificar se o problema está na conversão de timezone
console.log('🌍 VERIFICAÇÃO DE TIMEZONE:');
const testSlot21 = new Date('2025-10-20');
testSlot21.setHours(21, 0, 0, 0);

const blockedUntilBRT = new Date(missionData.blocked_until);
blockedUntilBRT.setTime(blockedUntilBRT.getTime() - (3 * 60 * 60 * 1000));

console.log(`   Slot 21:00 BRT: ${testSlot21.toISOString()}`);
console.log(`   Blocked until BRT: ${blockedUntilBRT.toISOString()}`);
console.log(`   21:00 < blocked_until: ${testSlot21 < blockedUntilBRT}`);
console.log(`   Resultado esperado: 21:00 deveria estar DISPONÍVEL (false)`);
console.log('');

console.log('💡 POSSÍVEL SOLUÇÃO:');
console.log('   Verificar se o SmartCalendar está usando a conversão de timezone correta');
console.log('   e se a lógica de comparação está considerando o dia correto.');