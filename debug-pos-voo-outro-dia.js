console.log('🔍 DEBUG ESPECÍFICO - POR QUE PÓS-VOO VAI PRO OUTRO DIA?');
console.log('=' .repeat(60));

// Simular exatamente a sua reserva corrigida
const reserva = {
  id: 16033,
  departure_date: "2025-09-12T02:00:00.000Z", // 23:00 BRT dia 11 (pré-voo)
  return_date: "2025-09-12T22:24:47.898Z",    // 19:24 BRT dia 12 (fim pós-voo)
  actual_return_date: "2025-09-12T18:00:00.000Z", // 15:00 BRT dia 12 (fim missão)
  blocked_until: "2025-09-12T22:24:47.898Z",  // 19:24 BRT dia 12 (= return_date)
  flight_hours: 2.826610263559868
};

console.log('📅 DADOS DA RESERVA:');
console.log(`   departure_date: ${new Date(reserva.departure_date).toLocaleString('pt-BR')} (pré-voo)`);
console.log(`   actual_return_date: ${new Date(reserva.actual_return_date).toLocaleString('pt-BR')} (fim missão)`);
console.log(`   return_date: ${new Date(reserva.return_date).toLocaleString('pt-BR')} (fim pós-voo)`);
console.log(`   blocked_until: ${new Date(reserva.blocked_until).toLocaleString('pt-BR')} (bloqueio)`);
console.log('');

// Como o SmartCalendar processa
const scheduleEvent = {
  start: new Date(reserva.departure_date), // Pré-voo
  end: new Date(reserva.return_date),      // Fim pós-voo
  resource: reserva
};

console.log('📊 EVENTO PROCESSADO PELO CALENDÁRIO:');
console.log(`   event.start: ${scheduleEvent.start.toISOString()} (${scheduleEvent.start.toLocaleString('pt-BR')})`);
console.log(`   event.end: ${scheduleEvent.end.toISOString()} (${scheduleEvent.end.toLocaleString('pt-BR')})`);
console.log(`   blocked_until: ${scheduleEvent.resource.blocked_until}`);
console.log('');

// Testar detecção por dia (função generateAvailableDates)
console.log('🔍 TESTANDO DETECÇÃO POR DIA (generateAvailableDates):');

function testarDeteccaoPorDia(date, event) {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.resource?.blocked_until || event.end);
  
  // Lógica atual do SmartCalendar após correção UTC
  const dayStartUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0)); // 00:00 BRT = 03:00 UTC
  const dayEndUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1, 2, 59, 59, 999)); // 23:59 BRT = 02:59 UTC próximo dia
  
  const afeta = (eventStart <= dayEndUTC && eventEnd >= dayStartUTC);
  
  console.log(`   Dia ${date.getDate()}/09:`);
  console.log(`     dayStartUTC: ${dayStartUTC.toISOString()} (00:00 BRT)`);
  console.log(`     dayEndUTC: ${dayEndUTC.toISOString()} (23:59 BRT)`);
  console.log(`     eventStart: ${eventStart.toISOString()}`);
  console.log(`     eventEnd: ${eventEnd.toISOString()}`);
  console.log(`     eventStart <= dayEndUTC: ${eventStart <= dayEndUTC}`);
  console.log(`     eventEnd >= dayStartUTC: ${eventEnd >= dayStartUTC}`);
  console.log(`     RESULTADO: ${afeta ? 'DETECTA EVENTO' : 'NÃO DETECTA'}`);
  console.log('');
  
  return afeta;
}

const dia11 = new Date(2025, 8, 11); // 11/09
const dia12 = new Date(2025, 8, 12); // 12/09  
const dia13 = new Date(2025, 8, 13); // 13/09

const detectaDia11 = testarDeteccaoPorDia(dia11, scheduleEvent);
const detectaDia12 = testarDeteccaoPorDia(dia12, scheduleEvent);
const detectaDia13 = testarDeteccaoPorDia(dia13, scheduleEvent);

console.log('📊 RESUMO DETECÇÃO:');
console.log(`   Dia 11/09: ${detectaDia11 ? 'DETECTA ✅' : 'NÃO DETECTA ❌'} (pré-voo)`);
console.log(`   Dia 12/09: ${detectaDia12 ? 'DETECTA ✅' : 'NÃO DETECTA ❌'} (missão + pós-voo)`);
console.log(`   Dia 13/09: ${detectaDia13 ? 'DETECTA ❌' : 'NÃO DETECTA ✅'} (livre)`);
console.log('');

// Agora testar slots específicos no dia 12
console.log('🕐 TESTANDO SLOTS ESPECÍFICOS NO DIA 12/09:');

function testarSlot(date, time, event) {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Lógica atual do SmartCalendar
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
  const blockedUntilUTC = new Date(event.resource?.blocked_until || event.end);
  
  const isBlocked = slotUTC < blockedUntilUTC && slotEndUTC > eventStartUTC;
  
  console.log(`   Slot ${time}:`);
  console.log(`     slotUTC: ${slotUTC.toISOString()}`);
  console.log(`     slotEndUTC: ${slotEndUTC.toISOString()}`);
  console.log(`     blockedUntilUTC: ${blockedUntilUTC.toISOString()}`);
  console.log(`     slotUTC < blockedUntil: ${slotUTC < blockedUntilUTC}`);
  console.log(`     slotEndUTC > eventStart: ${slotEndUTC > eventStartUTC}`);
  console.log(`     RESULTADO: ${isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'}`);
  console.log('');
  
  return isBlocked;
}

const slots = ['18:00', '19:00', '20:00', '21:00', '22:00'];
slots.forEach(time => {
  testarSlot(dia12, time, scheduleEvent);
});

console.log('💡 ANÁLISE:');
console.log('Se slots 21:00+ estão sendo calculados para o próximo dia UTC,');
console.log('mas o blocked_until é 19:24 BRT (22:24 UTC) do dia 12,');
console.log('então pode haver problema na conversão de timezone dos slots.');
console.log('');
console.log('🚨 POSSÍVEL PROBLEMA:');
console.log('Slot 21:00 do dia 12 → vai para 00:00 UTC do dia 13');
console.log('Mas blocked_until é 22:24 UTC do dia 12');
console.log('Logo, slot 21:00 deveria estar DISPONÍVEL!');