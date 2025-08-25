// Teste simples para horário brasileiro
console.log('🧪 TESTE SIMPLES - HORÁRIO BRASILEIRO');
console.log('======================================');

// Simular missão: usuário escolhe sair às 10:00 BR
const departureTime = new Date('2025-08-30T10:00:00.000Z'); // 10:00 BR
const returnTime = new Date('2025-08-30T17:00:00.000Z'); // 17:00 BR
const flightHours = 2.0;

console.log('🔍 Usuário escolheu:');
console.log('📅 Partida: 10:00 BR');
console.log('📅 Retorno: 17:00 BR');
console.log('📅 Horas de voo:', flightHours);

// Calcular janela bloqueada
const returnFlightTime = flightHours / 2; // 1 hora de voo de volta
const pousoVolta = new Date(returnTime.getTime() + (returnFlightTime * 60 * 60 * 1000)); // 18:00
const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // 21:00 (pouso + 3h manutenção)

console.log('\n🔍 Cálculos:');
console.log('📅 Pouso volta:', pousoVolta.toLocaleTimeString('pt-BR'));
console.log('📅 Fim lógico:', fimLogico.toLocaleTimeString('pt-BR'));

// O que será salvo no banco
const departureDate = new Date(departureTime.getTime() - (3 * 60 * 60 * 1000)); // 07:00 (3h antes)
const returnDate = fimLogico; // 21:00 (fim lógico)

console.log('\n🔍 O que será salvo no banco:');
console.log('📅 departure_date:', departureDate.toLocaleString('pt-BR'), '(pré-voo: 07:00)');
console.log('📅 return_date:', returnDate.toLocaleString('pt-BR'), '(fim lógico: 21:00)');
console.log('📅 actual_departure_date:', departureTime.toLocaleString('pt-BR'), '(partida real: 10:00)');
console.log('📅 actual_return_date:', returnTime.toLocaleString('pt-BR'), '(retorno real: 17:00)');

console.log('\n✅ Resultado esperado no calendário:');
console.log('🟡 Pré-voo: 07:00-10:00');
console.log('🟢 Missão: 10:00-17:00');
console.log('🔴 Pós-voo: 17:00-21:00');
