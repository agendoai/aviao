// Teste para diferentes flightHours
console.log('🧪 TESTE - DIFERENTES FLIGHT HOURS');
console.log('==================================');

// Cenário 1: flightHours = 2.0
console.log('\n🔍 CENÁRIO 1: flightHours = 2.0');
const departure1 = new Date('2025-08-30T10:00:00.000Z');
const return1 = new Date('2025-08-30T17:00:00.000Z');
const flightHours1 = 2.0;

const returnFlightTime1 = flightHours1 / 2; // 1.0 hora
const pousoVolta1 = new Date(return1.getTime() + (returnFlightTime1 * 60 * 60 * 1000));
const fimLogico1 = new Date(pousoVolta1.getTime() + (3 * 60 * 60 * 1000) + (1 * 60 * 60 * 1000));

console.log('📅 Retorno: 17:00');
console.log('📅 Tempo voo volta:', returnFlightTime1, 'horas');
console.log('📅 Pouso volta:', pousoVolta1.toLocaleTimeString('pt-BR'), '(17:00 + 1h = 18:00)');
console.log('📅 Fim lógico:', fimLogico1.toLocaleTimeString('pt-BR'), '(18:00 + 3h + 1h = 22:00)');

// Cenário 2: flightHours = 3.0
console.log('\n🔍 CENÁRIO 2: flightHours = 3.0');
const departure2 = new Date('2025-08-30T10:00:00.000Z');
const return2 = new Date('2025-08-30T17:00:00.000Z');
const flightHours2 = 3.0;

const returnFlightTime2 = flightHours2 / 2; // 1.5 horas
const pousoVolta2 = new Date(return2.getTime() + (returnFlightTime2 * 60 * 60 * 1000));
const fimLogico2 = new Date(pousoVolta2.getTime() + (3 * 60 * 60 * 1000) + (1 * 60 * 60 * 1000));

console.log('📅 Retorno: 17:00');
console.log('📅 Tempo voo volta:', returnFlightTime2, 'horas');
console.log('📅 Pouso volta:', pousoVolta2.toLocaleTimeString('pt-BR'), '(17:00 + 1.5h = 18:30)');
console.log('📅 Fim lógico:', fimLogico2.toLocaleTimeString('pt-BR'), '(18:30 + 3h + 1h = 22:30)');

// Cenário 3: flightHours = 4.0
console.log('\n🔍 CENÁRIO 3: flightHours = 4.0');
const departure3 = new Date('2025-08-30T10:00:00.000Z');
const return3 = new Date('2025-08-30T17:00:00.000Z');
const flightHours3 = 4.0;

const returnFlightTime3 = flightHours3 / 2; // 2.0 horas
const pousoVolta3 = new Date(return3.getTime() + (returnFlightTime3 * 60 * 60 * 1000));
const fimLogico3 = new Date(pousoVolta3.getTime() + (3 * 60 * 60 * 1000) + (1 * 60 * 60 * 1000));

console.log('📅 Retorno: 17:00');
console.log('📅 Tempo voo volta:', returnFlightTime3, 'horas');
console.log('📅 Pouso volta:', pousoVolta3.toLocaleTimeString('pt-BR'), '(17:00 + 2h = 19:00)');
console.log('📅 Fim lógico:', fimLogico3.toLocaleTimeString('pt-BR'), '(19:00 + 3h + 1h = 23:00)');

console.log('\n✅ Resumo:');
console.log('✅ flightHours = 2.0 → voo volta = 1.0h → fim lógico = 22:00');
console.log('✅ flightHours = 3.0 → voo volta = 1.5h → fim lógico = 22:30');
console.log('✅ flightHours = 4.0 → voo volta = 2.0h → fim lógico = 23:00');
