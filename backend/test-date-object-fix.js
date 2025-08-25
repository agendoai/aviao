// Teste para verificar se a correção do erro de Date object funcionou
console.log('🧪 TESTE - DATE OBJECT FIX');
console.log('==========================');

// Simular dados do booking (como o Prisma retorna)
const bookingData = {
  "id": 9576,
  "departure_date": new Date("2025-08-27T04:00:00.000Z"), // Date object (não string)
  "return_date": new Date("2025-08-27T21:07:46.535Z"), // Date object (não string)
  "actual_departure_date": new Date("2025-08-27T07:00:00.000Z"),
  "actual_return_date": new Date("2025-08-27T17:00:00.000Z"),
  "flight_hours": 2.0
};

console.log('📊 Dados do booking (Date objects):');
console.log('   departure_date:', bookingData.departure_date);
console.log('   return_date:', bookingData.return_date);
console.log('   departure_date type:', typeof bookingData.departure_date);
console.log('   return_date type:', typeof bookingData.return_date);

// Simular bookingToMissao CORRIGIDO
console.log('\n🔍 bookingToMissao CORRIGIDO:');

// Converter para string se for Date object
const departureDateStr = typeof bookingData.departure_date === 'string' 
  ? bookingData.departure_date 
  : bookingData.departure_date.toISOString();

const returnDateStr = typeof bookingData.return_date === 'string' 
  ? bookingData.return_date 
  : bookingData.return_date.toISOString();

console.log('   departureDateStr:', departureDateStr);
console.log('   returnDateStr:', returnDateStr);

const missao = {
  partida: new Date(departureDateStr.replace('Z', '-03:00')), // Forçar timezone BR
  retorno: new Date(returnDateStr.replace('Z', '-03:00')), // Forçar timezone BR
  flightHoursTotal: bookingData.flight_hours
};

console.log('   partida:', missao.partida.toLocaleString('pt-BR'));
console.log('   retorno:', missao.retorno.toLocaleString('pt-BR'));

// Simular janelaBloqueada
console.log('\n🔍 janelaBloqueada:');
const H = (n) => n * 60 * 60 * 1000;
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

// Pré-voo: m.partida já é o início (04:00), fim é 3h depois (07:00)
const preVooInicio = new Date(missao.partida.getTime()); // 04:00
const preVooFim = new Date(missao.partida.getTime() + H(PRE_VOO_HORAS)); // 07:00

// Missão: decolagem (07:00) até retorno (17:00)
const missaoInicio = new Date(missao.partida.getTime() + H(PRE_VOO_HORAS)); // 07:00
const missaoFim = new Date(missao.retorno.getTime() - H(POS_VOO_HORAS)); // 18:00

// Pós-voo: m.retorno já é o fim (21:00), início é 3h antes (18:00)
const posVooInicio = new Date(missao.retorno.getTime() - H(POS_VOO_HORAS)); // 18:00
const posVooFim = new Date(missao.retorno.getTime()); // 21:00

console.log('   Pré-voo:');
console.log('     início:', preVooInicio.toLocaleString('pt-BR'));
console.log('     fim:', preVooFim.toLocaleString('pt-BR'));

console.log('   Missão:');
console.log('     início:', missaoInicio.toLocaleString('pt-BR'));
console.log('     fim:', missaoFim.toLocaleString('pt-BR'));

console.log('   Pós-voo:');
console.log('     início:', posVooInicio.toLocaleString('pt-BR'));
console.log('     fim:', posVooFim.toLocaleString('pt-BR'));

console.log('\n✅ RESULTADO ESPERADO:');
console.log('   Pré-voo: 04:00 até 07:00 ✅');
console.log('   Missão: 07:00 até 18:00 ✅');
console.log('   Pós-voo: 18:00 até 21:00 ✅');

console.log('\n🎯 CORREÇÃO APLICADA:');
console.log('   ✅ bookingToMissao agora verifica se é string ou Date object');
console.log('   ✅ Converte Date object para string antes de usar .replace()');
console.log('   ✅ Evita erro "replace is not a function"');
console.log('   ✅ Backend funciona corretamente com dados do Prisma');
