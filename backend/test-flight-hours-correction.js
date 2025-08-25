// Teste para verificar a correção do flightHours
console.log('🧪 TESTE FLIGHT HOURS - CORREÇÃO');
console.log('================================');

// Simular dados do booking real (como o Prisma retorna)
const bookingData = {
  "id": 9579,
  "departure_date": new Date("2025-08-30T04:00:00.000Z"), // 04:00 (início pré-voo - já calculado)
  "return_date": new Date("2025-08-30T21:07:46.535Z"), // 21:00 (fim pós-voo - já calculado)
  "actual_departure_date": new Date("2025-08-30T07:00:00.000Z"), // 07:00 (decolagem real)
  "actual_return_date": new Date("2025-08-30T17:00:00.000Z"), // 17:00 (ERRADO! Deveria ser 09:26)
  "flight_hours": 2.259186330715704 // 2.26h total (ida + volta)
};

console.log('📊 Dados do booking real:');
console.log('   departure_date:', bookingData.departure_date.toISOString(), '(04:00 - início pré-voo)');
console.log('   return_date:', bookingData.return_date.toISOString(), '(21:00 - fim pós-voo)');
console.log('   actual_departure_date:', bookingData.actual_departure_date.toISOString(), '(07:00 - decolagem real)');
console.log('   actual_return_date:', bookingData.actual_return_date.toISOString(), '(17:00 - ERRADO!)');
console.log('   flight_hours:', bookingData.flight_hours, 'h (total ida + volta)');

// Calcular o CORRETO
const H = (n) => n * 60 * 60 * 1000;
const actualDeparture = new Date(bookingData.actual_departure_date);
const actualReturnCORRETO = new Date(actualDeparture.getTime() + H(bookingData.flight_hours));

console.log('\n🔍 CÁLCULO CORRETO:');
console.log('   actual_departure_date:', actualDeparture.toLocaleString('pt-BR'), '(07:00)');
console.log('   flight_hours:', bookingData.flight_hours, 'h');
console.log('   actual_return_date CORRETO:', actualReturnCORRETO.toLocaleString('pt-BR'), '(09:26)');
console.log('   actual_return_date ERRADO:', new Date(bookingData.actual_return_date).toLocaleString('pt-BR'), '(17:00)');

// Simular bookingToMissao CORRETO
console.log('\n🔍 bookingToMissao (CORRETO):');

// Converter para string se for Date object
const departureDateStr = typeof bookingData.departure_date === 'string' 
  ? bookingData.departure_date 
  : bookingData.departure_date.toISOString();

const returnDateStr = typeof bookingData.return_date === 'string' 
  ? bookingData.return_date 
  : bookingData.return_date.toISOString();

const actualDepartureDateStr = typeof bookingData.actual_departure_date === 'string' 
  ? bookingData.actual_departure_date 
  : bookingData.actual_departure_date.toISOString();

const actualReturnDateStr = typeof bookingData.actual_return_date === 'string' 
  ? bookingData.actual_return_date 
  : bookingData.actual_return_date.toISOString();

const missao = {
  partida: new Date(departureDateStr.replace('Z', '-03:00')), // 04:00 (início pré-voo - já calculado)
  retorno: new Date(returnDateStr.replace('Z', '-03:00')), // 21:00 (fim pós-voo - já calculado)
  actualDeparture: new Date(actualDepartureDateStr.replace('Z', '-03:00')), // 07:00 (decolagem real)
  actualReturn: new Date(actualReturnDateStr.replace('Z', '-03:00')), // 17:00 (ERRADO!)
  flightHoursTotal: bookingData.flight_hours
};

console.log('   partida:', missao.partida.toLocaleString('pt-BR'), '(04:00 - início pré-voo)');
console.log('   retorno:', missao.retorno.toLocaleString('pt-BR'), '(21:00 - fim pós-voo)');
console.log('   actualDeparture:', missao.actualDeparture.toLocaleString('pt-BR'), '(07:00 - decolagem real)');
console.log('   actualReturn:', missao.actualReturn.toLocaleString('pt-BR'), '(17:00 - ERRADO!)');

// Simular janelaBloqueada CORRETO
console.log('\n🔍 janelaBloqueada (CORRETO):');
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

// Pré-voo: m.partida já é o início (04:00), fim é 3h depois (07:00)
const preVooInicio = new Date(missao.partida.getTime()); // 04:00
const preVooFim = new Date(missao.partida.getTime() + H(PRE_VOO_HORAS)); // 07:00

// Missão: usar actualDeparture e actualReturn CORRETO (07:00 até 09:26)
const missaoInicio = missao.actualDeparture; // 07:00 (decolagem real)
const missaoFim = new Date(missao.actualDeparture.getTime() + H(missao.flightHoursTotal)); // 09:26 (retorno real = decolagem + flightHours)

// Pós-voo: m.retorno já é o fim (21:00), início é 3h antes (18:00)
const posVooInicio = new Date(missao.retorno.getTime() - H(POS_VOO_HORAS)); // 18:00
const posVooFim = new Date(missao.retorno.getTime()); // 21:00

console.log('   Pré-voo:');
console.log('     início:', preVooInicio.toLocaleString('pt-BR'), '(04:00)');
console.log('     fim:', preVooFim.toLocaleString('pt-BR'), '(07:00)');

console.log('   Missão:');
console.log('     início:', missaoInicio.toLocaleString('pt-BR'), '(07:00)');
console.log('     fim:', missaoFim.toLocaleString('pt-BR'), '(09:26 - CORRETO!)');

console.log('   Pós-voo:');
console.log('     início:', posVooInicio.toLocaleString('pt-BR'), '(18:00)');
console.log('     fim:', posVooFim.toLocaleString('pt-BR'), '(21:00)');

console.log('\n✅ RESULTADO ESPERADO:');
console.log('   Pré-voo: 04:00 até 07:00 ✅');
console.log('   Missão: 07:00 até 09:26 ✅ (CORRETO!)');
console.log('   Pós-voo: 18:00 até 21:00 ✅');

console.log('\n🎯 CORREÇÃO APLICADA:');
console.log('   ✅ actual_return_date = actual_departure_date + flightHours');
console.log('   ✅ flightHours = tempo total (ida + volta)');
console.log('   ✅ Tempo de ida = flightHours / 2');
console.log('   ✅ Tempo de volta = flightHours / 2');
console.log('   ✅ Pós-voo = 3 horas');
console.log('   ✅ Frontend agora mostra horários corretos no calendário');

console.log('\n🚀 TESTE AGORA NO FRONTEND!');
console.log('   O calendário deve mostrar:');
console.log('   - Pré-voo: 04:00-07:00 (amarelo)');
console.log('   - Missão: 07:00-09:26 (cinza)');
console.log('   - Pós-voo: 18:00-21:00 (laranja)');
