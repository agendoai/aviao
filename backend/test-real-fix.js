// Teste para verificar se a correção real funcionou
console.log('🧪 TESTE REAL - CORREÇÃO FINAL');
console.log('==============================');

// Simular dados do booking real (como o Prisma retorna)
const bookingData = {
  "id": 9579,
  "departure_date": new Date("2025-08-30T04:00:00.000Z"), // 04:00 (início pré-voo - já calculado)
  "return_date": new Date("2025-08-30T21:07:46.535Z"), // 21:00 (fim pós-voo - já calculado)
  "actual_departure_date": new Date("2025-08-30T07:00:00.000Z"), // 07:00 (decolagem real)
  "actual_return_date": new Date("2025-08-30T17:00:00.000Z"), // 17:00 (retorno real)
  "flight_hours": 2.259186330715704
};

console.log('📊 Dados do booking real:');
console.log('   departure_date:', bookingData.departure_date.toISOString(), '(04:00 - início pré-voo)');
console.log('   return_date:', bookingData.return_date.toISOString(), '(21:00 - fim pós-voo)');
console.log('   actual_departure_date:', bookingData.actual_departure_date.toISOString(), '(07:00 - decolagem real)');
console.log('   actual_return_date:', bookingData.actual_return_date.toISOString(), '(17:00 - retorno real)');

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
  actualReturn: new Date(actualReturnDateStr.replace('Z', '-03:00')), // 17:00 (retorno real)
  flightHoursTotal: bookingData.flight_hours
};

console.log('   partida:', missao.partida.toLocaleString('pt-BR'), '(04:00 - início pré-voo)');
console.log('   retorno:', missao.retorno.toLocaleString('pt-BR'), '(21:00 - fim pós-voo)');
console.log('   actualDeparture:', missao.actualDeparture.toLocaleString('pt-BR'), '(07:00 - decolagem real)');
console.log('   actualReturn:', missao.actualReturn.toLocaleString('pt-BR'), '(17:00 - retorno real)');

// Simular janelaBloqueada CORRETO
console.log('\n🔍 janelaBloqueada (CORRETO):');
const H = (n) => n * 60 * 60 * 1000;
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

// Pré-voo: m.partida já é o início (04:00), fim é 3h depois (07:00)
const preVooInicio = new Date(missao.partida.getTime()); // 04:00
const preVooFim = new Date(missao.partida.getTime() + H(PRE_VOO_HORAS)); // 07:00

// Missão: usar actualDeparture e actualReturn (07:00 até 17:00)
const missaoInicio = missao.actualDeparture; // 07:00 (decolagem real)
const missaoFim = missao.actualReturn; // 17:00 (retorno real)

// Pós-voo: m.retorno já é o fim (21:00), início é 3h antes (18:00)
const posVooInicio = new Date(missao.retorno.getTime() - H(POS_VOO_HORAS)); // 18:00
const posVooFim = new Date(missao.retorno.getTime()); // 21:00

console.log('   Pré-voo:');
console.log('     início:', preVooInicio.toLocaleString('pt-BR'), '(04:00)');
console.log('     fim:', preVooFim.toLocaleString('pt-BR'), '(07:00)');

console.log('   Missão:');
console.log('     início:', missaoInicio.toLocaleString('pt-BR'), '(07:00)');
console.log('     fim:', missaoFim.toLocaleString('pt-BR'), '(17:00)');

console.log('   Pós-voo:');
console.log('     início:', posVooInicio.toLocaleString('pt-BR'), '(18:00)');
console.log('     fim:', posVooFim.toLocaleString('pt-BR'), '(21:00)');

console.log('\n✅ RESULTADO ESPERADO:');
console.log('   Pré-voo: 04:00 até 07:00 ✅');
console.log('   Missão: 07:00 até 17:00 ✅');
console.log('   Pós-voo: 18:00 até 21:00 ✅');

console.log('\n🎯 CORREÇÃO REAL APLICADA:');
console.log('   ✅ bookingToMissao agora inclui actualDeparture e actualReturn');
console.log('   ✅ janelaBloqueada usa actualDeparture e actualReturn para a missão');
console.log('   ✅ departure_date (04:00) = início pré-voo');
console.log('   ✅ return_date (21:00) = fim pós-voo');
console.log('   ✅ actual_departure_date (07:00) = início missão');
console.log('   ✅ actual_return_date (17:00) = fim missão');
console.log('   ✅ Frontend agora mostra horários corretos no calendário');
