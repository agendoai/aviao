// Teste para verificar se a criação de missões está enviando datas corretas em UTC
console.log('🧪 Testando criação de missões com timezone correto...');

// Simular dados que o usuário seleciona no calendário (horário brasileiro)
const userSelectedData = {
  departureDate: '2025-08-29',
  departureTime: '06:00',
  returnDate: '2025-08-30', 
  returnTime: '10:00'
};

console.log('📋 Dados selecionados pelo usuário (horário brasileiro):');
console.log(`   Partida: ${userSelectedData.departureDate} ${userSelectedData.departureTime}`);
console.log(`   Retorno: ${userSelectedData.returnDate} ${userSelectedData.returnTime}`);

// Simular a conversão que deve acontecer no frontend
const convertBrazilianDateToUTCString = (brazilianDate) => {
  const utcDate = new Date(brazilianDate.getTime() + (3 * 60 * 60 * 1000)); // UTC+3
  return utcDate.toISOString();
};

// Converter datas para UTC
const departureDateTime = new Date(`${userSelectedData.departureDate}T${userSelectedData.departureTime}:00`);
const returnDateTime = new Date(`${userSelectedData.returnDate}T${userSelectedData.returnTime}:00`);

const departureDateUTC = convertBrazilianDateToUTCString(departureDateTime);
const returnDateUTC = convertBrazilianDateToUTCString(returnDateTime);

console.log('\n🌍 Datas convertidas para UTC:');
console.log(`   Partida UTC: ${departureDateUTC}`);
console.log(`   Retorno UTC: ${returnDateUTC}`);

// Simular dados que seriam enviados para o backend
const bookingData = {
  aircraftId: 2,
  origin: 'SBAU',
  destination: 'SBKP',
  departure_date: departureDateUTC,
  return_date: returnDateUTC,
  passengers: 1,
  flight_hours: 2,
  overnight_stays: 1,
  value: 18848.58,
  status: 'pendente'
};

console.log('\n📤 Dados que seriam enviados para o backend:');
console.log(JSON.stringify(bookingData, null, 2));

// Verificar se as datas estão corretas
const expectedDepartureUTC = '2025-08-29T09:00:00.000Z'; // 06:00 BR + 3h = 09:00 UTC
const expectedReturnUTC = '2025-08-30T13:00:00.000Z'; // 10:00 BR + 3h = 13:00 UTC

console.log('\n✅ Verificação:');
console.log(`   Partida esperada: ${expectedDepartureUTC}`);
console.log(`   Partida enviada:  ${departureDateUTC}`);
console.log(`   ✅ Correto: ${departureDateUTC === expectedDepartureUTC ? 'SIM' : 'NÃO'}`);

console.log(`   Retorno esperado: ${expectedReturnUTC}`);
console.log(`   Retorno enviado:  ${returnDateUTC}`);
console.log(`   ✅ Correto: ${returnDateUTC === expectedReturnUTC ? 'SIM' : 'NÃO'}`);

// Simular o que o backend receberia
console.log('\n🔧 Backend receberia:');
console.log(`   Partida: ${new Date(bookingData.departure_date).toLocaleString('pt-BR')}`);
console.log(`   Retorno: ${new Date(bookingData.return_date).toLocaleString('pt-BR')}`);

console.log('\n🎯 Resultado esperado:');
console.log('   - Usuário seleciona: 29/08 06:00 → 30/08 10:00 (horário brasileiro)');
console.log('   - Frontend envia: 29/08 09:00 → 30/08 13:00 (UTC)');
console.log('   - Backend salva: 29/08 09:00 → 30/08 13:00 (UTC)');
console.log('   - Frontend exibe: 29/08 06:00 → 30/08 10:00 (convertido de volta para BR)');


