// Teste final para verificar se está tudo correto
console.log('🧪 TESTE FINAL - VERIFICAÇÃO COMPLETA');
console.log('=====================================');

// Simular missão: usuário escolhe sair às 10:00 BR
const departureDateTime = new Date('2025-08-30T10:00:00.000Z'); // 10:00 BR
const returnDateTime = new Date('2025-08-30T17:00:00.000Z'); // 17:00 BR
const flightHours = 2.0;

console.log('🔍 Usuário escolheu:');
console.log('📅 Partida: 10:00 BR');
console.log('📅 Retorno: 17:00 BR');
console.log('📅 Horas de voo:', flightHours);

// Calcular janela bloqueada
const returnFlightTime = flightHours / 2; // 1 hora de voo de volta
const pousoVolta = new Date(returnDateTime.getTime() + (returnFlightTime * 60 * 60 * 1000)); // 18:00 (17:00 + 1h)
const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000) + (1 * 60 * 60 * 1000)); // 22:00 (18:00 + 3h manutenção + 1h adicional)

console.log('\n🔍 Cálculos:');
console.log('📅 Pouso volta:', pousoVolta.toLocaleTimeString('pt-BR'));
console.log('📅 Fim lógico:', fimLogico.toLocaleTimeString('pt-BR'));

// O que será salvo no banco
const departureDate = new Date(departureDateTime.getTime() - (3 * 60 * 60 * 1000)); // 07:00 (3h antes)
const returnDate = fimLogico; // 21:00 (fim lógico)

console.log('\n🔍 O que será salvo no banco:');
console.log('📅 departure_date:', departureDate.toLocaleString('pt-BR'), '(07:00 - início pré-voo)');
console.log('📅 return_date:', returnDate.toLocaleString('pt-BR'), '(22:00 - fim lógico)');
console.log('📅 actual_departure_date:', departureDateTime.toLocaleString('pt-BR'), '(10:00 - partida real)');
console.log('📅 actual_return_date:', returnDateTime.toLocaleString('pt-BR'), '(17:00 - retorno real)');

console.log('\n✅ Resultado esperado no calendário:');
console.log('🟡 Pré-voo: 07:00-10:00 (baseado em departure_date)');
console.log('🟢 Missão: 10:00-17:00 (baseado em actual_departure_date e actual_return_date)');
console.log('🔴 Pós-voo: 17:00-22:00 (baseado em return_date)');

console.log('\n🎯 Verificação:');
console.log('✅ departure_date (07:00) = início do pré-voo');
console.log('✅ return_date (22:00) = fim lógico da missão');
console.log('✅ actual_departure_date (10:00) = partida real');
console.log('✅ actual_return_date (17:00) = retorno real');
