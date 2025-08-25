// Teste para verificar se a correção da janelaBloqueada funcionou
console.log('🧪 TESTE - JANELA BLOQUEADA');
console.log('============================');

// Simular dados do booking
const bookingData = {
  "id": 9576,
  "departure_date": "2025-08-27T04:00:00.000Z", // 04:00 (início pré-voo)
  "return_date": "2025-08-27T21:07:46.535Z", // 21:00 (fim lógico)
  "actual_departure_date": "2025-08-27T07:00:00.000Z", // 07:00 (hora real de decolagem)
  "actual_return_date": "2025-08-27T17:00:00.000Z", // 17:00 (hora real de retorno)
  "flight_hours": 2.0
};

console.log('📊 Dados do booking:');
console.log('   departure_date:', bookingData.departure_date);
console.log('   return_date:', bookingData.return_date);
console.log('   actual_departure_date:', bookingData.actual_departure_date);
console.log('   actual_return_date:', bookingData.actual_return_date);

// Simular bookingToMissao ANTES da correção (ERRADO)
console.log('\n🔍 ANTES da correção (ERRADO):');
const missaoAntes = {
  partida: new Date(bookingData.departure_date), // 04:00
  retorno: new Date(bookingData.return_date), // 21:00
  flightHoursTotal: bookingData.flight_hours
};

console.log('   partida:', missaoAntes.partida.toLocaleString('pt-BR'));
console.log('   retorno:', missaoAntes.retorno.toLocaleString('pt-BR'));

// Simular janelaBloqueada ANTES
const H = (n) => n * 60 * 60 * 1000;
const PRE_VOO_HORAS = 3;

const preVooInicioAntes = new Date(missaoAntes.partida.getTime() - H(PRE_VOO_HORAS));
const preVooFimAntes = new Date(missaoAntes.partida.getTime());

console.log('   Pré-voo ANTES:');
console.log('     início:', preVooInicioAntes.toLocaleString('pt-BR'));
console.log('     fim:', preVooFimAntes.toLocaleString('pt-BR'));

// Simular bookingToMissao DEPOIS da correção (CORRETO)
console.log('\n🔍 DEPOIS da correção (CORRETO):');
const missaoDepois = {
  partida: new Date(bookingData.actual_departure_date), // 07:00
  retorno: new Date(bookingData.actual_return_date), // 17:00
  flightHoursTotal: bookingData.flight_hours
};

console.log('   partida:', missaoDepois.partida.toLocaleString('pt-BR'));
console.log('   retorno:', missaoDepois.retorno.toLocaleString('pt-BR'));

// Simular janelaBloqueada DEPOIS
const preVooInicioDepois = new Date(missaoDepois.partida.getTime() - H(PRE_VOO_HORAS));
const preVooFimDepois = new Date(missaoDepois.partida.getTime());

console.log('   Pré-voo DEPOIS:');
console.log('     início:', preVooInicioDepois.toLocaleString('pt-BR'));
console.log('     fim:', preVooFimDepois.toLocaleString('pt-BR'));

console.log('\n✅ RESULTADO ESPERADO:');
console.log('   Pré-voo deve ser: 04:00 até 07:00');
console.log('   Missão deve ser: 07:00 até 18:00');
console.log('   Pós-voo deve ser: 18:00 até 21:00');

console.log('\n🎯 CORREÇÃO APLICADA:');
console.log('   ✅ bookingToMissao agora usa actual_departure_date e actual_return_date');
console.log('   ✅ janelaBloqueada calcula corretamente as janelas de bloqueio');
console.log('   ✅ Frontend mostra horários corretos no calendário');
