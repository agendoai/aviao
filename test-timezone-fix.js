console.log('🕒 TESTE DE TIMEZONE - Compreendendo o problema');
console.log('=' .repeat(50));

// blocked_until vem do backend em UTC: 2025-09-16T01:00:00.000Z
// Isso significa 01:00 UTC do dia 16
// Em horário brasileiro (UTC-3): 01:00 - 3 = 22:00 do dia 15

const blockedUntilUTC = '2025-09-16T01:00:00.000Z';
const eventStartUTC = '2025-09-15T18:00:00.000Z';

console.log('📊 DADOS DO BACKEND (UTC):');
console.log(`   blocked_until: ${blockedUntilUTC}`);
console.log(`   event_start: ${eventStartUTC}`);
console.log('');

// Conversão CORRETA para horário brasileiro
const blockedUntilDate = new Date(blockedUntilUTC);
const eventStartDate = new Date(eventStartUTC);

console.log('🕒 CONVERSÃO PARA HORÁRIO BRASILEIRO:');
console.log(`   blocked_until UTC: ${blockedUntilDate.toISOString()}`);
console.log(`   blocked_until LOCAL: ${blockedUntilDate.toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})}`);
console.log(`   event_start UTC: ${eventStartDate.toISOString()}`);
console.log(`   event_start LOCAL: ${eventStartDate.toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'})}`);
console.log('');

// O que DEVERIA acontecer:
// 2025-09-16T01:00:00.000Z = 01:00 UTC dia 16 = 22:00 BRT dia 15
// 2025-09-15T18:00:00.000Z = 18:00 UTC dia 15 = 15:00 BRT dia 15

console.log('📋 CENÁRIO CORRETO:');
console.log('   Missão: 15:00-18:00 BRT (12:00-15:00 UTC)');
console.log('   Pós-voo até: 22:00 BRT dia 15 (01:00 UTC dia 16)');
console.log('   Slots 15:00-21:59: BLOQUEADOS');
console.log('   Slots 22:00+: DISPONÍVEIS');
console.log('');

// A CONVERSÃO CORRETA é usar toLocaleString com timezone
function converterUTCParaBRT(utcString) {
  const utcDate = new Date(utcString);
  const brtString = utcDate.toLocaleString('pt-BR', {timeZone: 'America/Sao_Paulo'});
  const [datePart, timePart] = brtString.split(', ');
  const [day, month, year] = datePart.split('/');
  const [hours, minutes, seconds] = timePart.split(':');
  
  return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes), parseInt(seconds || 0));
}

const blockedUntilBRT = converterUTCParaBRT(blockedUntilUTC);
const eventStartBRT = converterUTCParaBRT(eventStartUTC);

console.log('✅ CONVERSÃO CORRIGIDA:');
console.log(`   blocked_until BRT: ${blockedUntilBRT.toLocaleString('pt-BR')}`);
console.log(`   event_start BRT: ${eventStartBRT.toLocaleString('pt-BR')}`);
console.log('');

// Teste com slots
console.log('🧪 TESTE COM SLOTS:');
const date = new Date(2025, 8, 15); // 15/09/2025
const slots = ['19:00', '20:00', '21:00', '22:00', '23:00'];

slots.forEach(time => {
  const [hours, minutes] = time.split(':').map(Number);
  const slotDateTime = new Date(date);
  slotDateTime.setHours(hours, minutes, 0, 0);
  
  const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
  
  const isBlocked = slotDateTime < blockedUntilBRT && slotEndDateTime > eventStartBRT;
  
  console.log(`   ${time}: ${isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'} (slot: ${slotDateTime.toLocaleString('pt-BR')}, até: ${blockedUntilBRT.toLocaleString('pt-BR')})`);
});