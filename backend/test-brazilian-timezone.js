// Teste para verificar timezone brasileiro
console.log('🧪 TESTE - TIMEZONE BRASILEIRO');
console.log('==============================');

// Simular missão: usuário escolhe sair às 07:00 BR
const departureDateTime = new Date('2025-08-30T07:00:00.000-03:00'); // 07:00 BR
const returnDateTime = new Date('2025-08-30T18:00:00.000-03:00'); // 18:00 BR
const flightHours = 2.0;

console.log('🔍 Usuário escolheu:');
console.log('📅 Partida: 07:00 BR');
console.log('📅 Retorno: 18:00 BR');
console.log('📅 Horas de voo:', flightHours);

// Calcular janela bloqueada
const returnFlightTime = flightHours / 2; // 1 hora de voo de volta
const pousoVolta = new Date(returnDateTime.getTime() + (returnFlightTime * 60 * 60 * 1000)); // 18:00
const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // 21:00 (pouso + 3h manutenção)

console.log('\n🔍 Cálculos:');
console.log('📅 Pouso volta:', pousoVolta.toLocaleTimeString('pt-BR'));
console.log('📅 Fim lógico:', fimLogico.toLocaleTimeString('pt-BR'));

// O que será salvo no banco (com ajuste de timezone)
const departureDate = new Date(departureDateTime.getTime() - (3 * 60 * 60 * 1000)); // 04:00 (início pré-voo - 3h antes)
const returnDate = fimLogico; // 21:00 (fim lógico)
const actualDepartureDate = departureDateTime; // 07:00 (hora real que o usuário escolheu)
const actualReturnDate = returnDateTime; // 18:00 (hora real que o usuário escolheu)

console.log('\n🔍 O que será salvo no banco (com timezone):');
console.log('📅 departure_date:', departureDate.toLocaleString('pt-BR'), '(04:00 - início pré-voo)');
console.log('📅 return_date:', returnDate.toLocaleString('pt-BR'), '(21:00 - fim lógico)');
console.log('📅 actual_departure_date:', actualDepartureDate.toLocaleString('pt-BR'), '(07:00 - partida real)');
console.log('📅 actual_return_date:', actualReturnDate.toLocaleString('pt-BR'), '(18:00 - retorno real)');

console.log('\n✅ Verificação:');
console.log('✅ Todas as datas devem estar no dia 30/08/2025');
console.log('✅ departure_date deve ser 04:00 (início pré-voo)');
console.log('✅ return_date deve ser 21:00 (fim lógico)');
console.log('✅ actual_departure_date deve ser 07:00 (partida real)');
console.log('✅ actual_return_date deve ser 18:00 (retorno real)');
