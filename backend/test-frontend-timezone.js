// Teste para verificar como o frontend processa os dados do backend
console.log('🧪 TESTE - FRONTEND TIMEZONE');
console.log('============================');

// Dados do backend (corretos)
const bookingData = {
  "id": 9575,
  "userId": 24,
  "aircraftId": 2,
  "origin": "SBAU",
  "destination": "SBKP",
  "departure_date": "2025-08-26T04:00:00.000Z",
  "return_date": "2025-08-26T21:07:46.535Z",
  "actual_departure_date": "2025-08-26T07:00:00.000Z",
  "actual_return_date": "2025-08-26T17:00:00.000Z",
  "passengers": 1,
  "flight_hours": 2.259186330715704,
  "overnight_stays": 0,
  "value": 10448.58258900596,
  "status": "pendente",
  "paymentId": null,
  "blocked_until": "2025-08-26T21:07:46.535Z",
  "maintenance_buffer_hours": 3,
  "createdAt": "2025-08-25T08:10:52.248Z"
};

console.log('📊 Dados do backend:');
console.log('   departure_date:', bookingData.departure_date);
console.log('   return_date:', bookingData.return_date);
console.log('   actual_departure_date:', bookingData.actual_departure_date);
console.log('   actual_return_date:', bookingData.actual_return_date);

// Simular como o frontend processa
console.log('\n🔍 Como o frontend processa:');

// 1. Conversão direta (sem ajuste de timezone)
const departureDate = new Date(bookingData.departure_date);
const returnDate = new Date(bookingData.return_date);

console.log('   Conversão direta:');
console.log('   departure_date:', departureDate.toLocaleString('pt-BR'));
console.log('   return_date:', returnDate.toLocaleString('pt-BR'));

// 2. Conversão com ajuste de timezone (errado!)
const departureDateWithTZ = new Date(departureDate.getTime() + (3 * 60 * 60 * 1000));
const returnDateWithTZ = new Date(returnDate.getTime() + (3 * 60 * 60 * 1000));

console.log('   Conversão com timezone (ERRADO):');
console.log('   departure_date:', departureDateWithTZ.toLocaleString('pt-BR'));
console.log('   return_date:', returnDateWithTZ.toLocaleString('pt-BR'));

// 3. Conversão com timezone brasileiro
const departureDateBR = new Date(bookingData.departure_date.replace('Z', '-03:00'));
const returnDateBR = new Date(bookingData.return_date.replace('Z', '-03:00'));

console.log('   Conversão com timezone BR:');
console.log('   departure_date:', departureDateBR.toLocaleString('pt-BR'));
console.log('   return_date:', returnDateBR.toLocaleString('pt-BR'));

console.log('\n✅ RESULTADO ESPERADO:');
console.log('   departure_date deve ser: 26/08/2025, 04:00:00');
console.log('   return_date deve ser: 26/08/2025, 21:07:46');
