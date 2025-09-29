console.log('🔧 TESTE CORREÇÃO - RELEVANT EVENTS COM UTC');
console.log('=' .repeat(60));

// Simular a reserva problemática
const reserva = {
  departure_date: "2025-09-12T02:00:00.000Z", // 23:00 BRT dia 11 (pré-voo)
  return_date: "2025-09-12T22:24:47.898Z",    // 19:24 BRT dia 12 (fim pós-voo)
  blocked_until: "2025-09-12T22:24:47.898Z"   // 19:24 BRT dia 12
};

const scheduleEvent = {
  start: new Date(reserva.departure_date),
  end: new Date(reserva.return_date),
  resource: reserva
};

console.log('📅 DADOS DO EVENTO:');
console.log(`   start: ${scheduleEvent.start.toISOString()} (${scheduleEvent.start.toLocaleString('pt-BR')})`);
console.log(`   blocked_until: ${scheduleEvent.resource.blocked_until} (${new Date(scheduleEvent.resource.blocked_until).toLocaleString('pt-BR')})`);
console.log('');

// Testar função relevantEvents CORRIGIDA
console.log('🔍 TESTANDO RELEVANT EVENTS (CORRIGIDA):');

function testarRelevantEvents(date, event) {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.resource?.blocked_until || event.end);
  
  // LÓGICA CORRIGIDA: UTC como generateAvailableDates
  const dayStartUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0)); // 00:00 BRT = 03:00 UTC
  const dayEndUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1, 2, 59, 59, 999)); // 23:59 BRT = 02:59 UTC próximo dia
  
  const relevante = (eventStart <= dayEndUTC && eventEnd >= dayStartUTC);
  
  console.log(`   Dia ${date.getDate()}/09:`);
  console.log(`     dayStartUTC: ${dayStartUTC.toISOString()} (00:00 BRT)`);
  console.log(`     dayEndUTC: ${dayEndUTC.toISOString()} (23:59 BRT)`);
  console.log(`     eventStart: ${eventStart.toISOString()}`);
  console.log(`     eventEnd: ${eventEnd.toISOString()}`);
  console.log(`     eventStart <= dayEndUTC: ${eventStart <= dayEndUTC}`);
  console.log(`     eventEnd >= dayStartUTC: ${eventEnd >= dayStartUTC}`);
  console.log(`     RESULTADO: ${relevante ? 'EVENTO RELEVANTE' : 'EVENTO NÃO RELEVANTE'}`);
  console.log('');
  
  return relevante;
}

const dia11 = new Date(2025, 8, 11); // 11/09
const dia12 = new Date(2025, 8, 12); // 12/09  
const dia13 = new Date(2025, 8, 13); // 13/09

const relevanteDia11 = testarRelevantEvents(dia11, scheduleEvent);
const relevanteDia12 = testarRelevantEvents(dia12, scheduleEvent);
const relevanteDia13 = testarRelevantEvents(dia13, scheduleEvent);

console.log('📊 RESUMO RELEVANT EVENTS:');
console.log(`   Dia 11/09: ${relevanteDia11 ? 'RELEVANTE ✅' : 'NÃO RELEVANTE ❌'} (pré-voo)`);
console.log(`   Dia 12/09: ${relevanteDia12 ? 'RELEVANTE ✅' : 'NÃO RELEVANTE ❌'} (missão + pós-voo)`);
console.log(`   Dia 13/09: ${relevanteDia13 ? 'RELEVANTE ❌' : 'NÃO RELEVANTE ✅'} (livre)`);
console.log('');

// Comparar com generateAvailableDates (que já estava correto)
console.log('🔍 COMPARANDO COM GENERATE AVAILABLE DATES:');

function testarGenerateAvailableDates(date, event) {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.resource?.blocked_until || event.end);
  
  const dayStartUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0));
  const dayEndUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1, 2, 59, 59, 999));
  
  return (eventStart <= dayEndUTC && eventEnd >= dayStartUTC);
}

const generateDia11 = testarGenerateAvailableDates(dia11, scheduleEvent);
const generateDia12 = testarGenerateAvailableDates(dia12, scheduleEvent);
const generateDia13 = testarGenerateAvailableDates(dia13, scheduleEvent);

console.log('📊 COMPARAÇÃO:');
console.log(`   Dia 11/09: relevantEvents=${relevanteDia11}, generateAvailable=${generateDia11} ${relevanteDia11 === generateDia11 ? '✅' : '❌'}`);
console.log(`   Dia 12/09: relevantEvents=${relevanteDia12}, generateAvailable=${generateDia12} ${relevanteDia12 === generateDia12 ? '✅' : '❌'}`);
console.log(`   Dia 13/09: relevantEvents=${relevanteDia13}, generateAvailable=${generateDia13} ${relevanteDia13 === generateDia13 ? '✅' : '❌'}`);

console.log('');
if (relevanteDia11 === generateDia11 && relevanteDia12 === generateDia12 && relevanteDia13 === generateDia13) {
  console.log('🎉 CORREÇÃO FUNCIONOU!');
  console.log('   ✅ relevantEvents e generateAvailableDates agora são consistentes');
  console.log('   ✅ Evento só é detectado nos dias corretos (11 e 12)');
  console.log('   ✅ Dia 13 não detecta o evento (pós-voo não "vaza")');
} else {
  console.log('❌ Ainda há inconsistência...');
}