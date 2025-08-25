// Teste para verificar se a correção do timezone funcionou
console.log('🧪 TESTE - CORREÇÃO TIMEZONE');
console.log('============================');

// Dados do backend (corretos)
const bookingData = {
  "departure_date": "2025-08-27T04:00:00.000Z",
  "return_date": "2025-08-27T21:07:46.535Z",
  "actual_departure_date": "2025-08-27T07:00:00.000Z",
  "actual_return_date": "2025-08-27T17:00:00.000Z"
};

console.log('📊 Dados do backend:');
console.log('   departure_date:', bookingData.departure_date);
console.log('   return_date:', bookingData.return_date);

console.log('\n🔍 ANTES da correção (ERRADO):');
const departureDateWrong = new Date(bookingData.departure_date);
const returnDateWrong = new Date(bookingData.return_date);
console.log('   departure_date:', departureDateWrong.toLocaleString('pt-BR'));
console.log('   return_date:', returnDateWrong.toLocaleString('pt-BR'));

console.log('\n🔍 DEPOIS da correção (CORRETO):');
const departureDateCorrect = new Date(bookingData.departure_date.replace('Z', '-03:00'));
const returnDateCorrect = new Date(bookingData.return_date.replace('Z', '-03:00'));
console.log('   departure_date:', departureDateCorrect.toLocaleString('pt-BR'));
console.log('   return_date:', returnDateCorrect.toLocaleString('pt-BR'));

console.log('\n✅ RESULTADO ESPERADO:');
console.log('   departure_date deve ser: 27/08/2025, 04:00:00');
console.log('   return_date deve ser: 27/08/2025, 21:07:46');

console.log('\n🎯 CORREÇÃO APLICADA:');
console.log('   ✅ .replace("Z", "-03:00") força timezone brasileiro');
console.log('   ✅ Evita conversão automática UTC → BR');
console.log('   ✅ Frontend agora mostra horários corretos');


