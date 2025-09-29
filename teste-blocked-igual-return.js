console.log('✅ TESTE FINAL - BLOCKED_UNTIL = RETURN_DATE');
console.log('=' .repeat(50));

// Simular a sua reserva corrigida
const reservaCorrigida = {
  id: 16033,
  actual_return_date: "2025-09-12T18:00:00.000Z", // 15:00 BRT (fim da missão)
  return_date: "2025-09-12T22:24:47.898Z",        // 19:24 BRT (fim do pós-voo)
  blocked_until: "2025-09-12T22:24:47.898Z",      // AGORA IGUAL AO return_date ✅
  flight_hours: 2.826610263559868
};

console.log('📅 RESERVA CORRIGIDA:');
console.log(`   Fim da missão: ${new Date(reservaCorrigida.actual_return_date).toLocaleString('pt-BR')}`);
console.log(`   return_date: ${new Date(reservaCorrigida.return_date).toLocaleString('pt-BR')}`);
console.log(`   blocked_until: ${new Date(reservaCorrigida.blocked_until).toLocaleString('pt-BR')}`);
console.log(`   São iguais: ${reservaCorrigida.return_date === reservaCorrigida.blocked_until ? 'SIM ✅' : 'NÃO ❌'}`);
console.log('');

// Simular evento processado pelo SmartCalendar
const scheduleEvent = {
  start: new Date("2025-09-12T02:00:00.000Z"), // departure_date (pré-voo)
  end: new Date(reservaCorrigida.return_date),  // return_date
  resource: reservaCorrigida
};

console.log('📅 EVENTO NO CALENDÁRIO:');
console.log(`   event.start: ${scheduleEvent.start.toLocaleString('pt-BR')} (pré-voo)`);
console.log(`   event.end: ${scheduleEvent.end.toLocaleString('pt-BR')} (fim do pós-voo)`);
console.log(`   blocked_until: ${new Date(scheduleEvent.resource.blocked_until).toLocaleString('pt-BR')}`);
console.log('');

// Testar se os slots agora ficam corretos
const dia12 = new Date(2025, 8, 12); // 12/09
const dia13 = new Date(2025, 8, 13); // 13/09

console.log('🔍 TESTANDO DETECÇÃO POR DIA:');

function testarDia(date, event) {
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.resource.blocked_until); // Usando blocked_until que agora = return_date
  
  // Limites do dia em UTC
  const dayStartUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0)); // 00:00 BRT
  const dayEndUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1, 2, 59, 59, 999)); // 23:59 BRT
  
  const afeta = (eventStart <= dayEndUTC && eventEnd >= dayStartUTC);
  
  console.log(`   Dia ${date.getDate()}/09: ${afeta ? 'AFETADO' : 'NÃO AFETADO'}`);
  console.log(`     eventEnd: ${eventEnd.toISOString()}`);
  console.log(`     dayEndUTC: ${dayEndUTC.toISOString()}`);
  
  return afeta;
}

const afetaDia12 = testarDia(dia12, scheduleEvent);
const afetaDia13 = testarDia(dia13, scheduleEvent);

console.log('');
console.log('📊 RESULTADO:');
console.log(`   Dia 12/09: ${afetaDia12 ? 'OCUPADO ✅' : 'LIVRE ❌'} (correto)`);
console.log(`   Dia 13/09: ${afetaDia13 ? 'OCUPADO ❌' : 'LIVRE ✅'} (correto)`);

console.log('');
if (afetaDia12 && !afetaDia13) {
  console.log('🎉 PERFEITO!');
  console.log('   ✅ Pós-voo termina no return_date (19:24 do dia 12)');
  console.log('   ✅ Não "vaza" para o dia 13');
  console.log('   ✅ Janelas laranja ficam no dia correto');
} else {
  console.log('❌ Ainda há problema...');
}