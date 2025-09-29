console.log('=== DEBUG BACKEND: Processamento do dia 28 ===');

// Simular o que o frontend envia
const weekStartString = '2025-09-28T00:00:00';
console.log('1. String do frontend:', weekStartString);

// Simular o processamento do backend
const weekStart = new Date(weekStartString + '-03:00');
console.log('2. weekStart processado:', weekStart.toISOString());
console.log('   - Local BR:', weekStart.toLocaleDateString('pt-BR'));
console.log('   - toString():', weekStart.toString());

// Simular criação do currentDate (PROBLEMA ATUAL)
const currentDateProblema = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
console.log('3. currentDate (método atual - PROBLEMA):');
console.log('   - ISO:', currentDateProblema.toISOString());
console.log('   - Local BR:', currentDateProblema.toLocaleDateString('pt-BR'));
console.log('   - toString():', currentDateProblema.toString());

// Simular slot às 21:00 com método atual (PROBLEMA)
const slotProblema = new Date(currentDateProblema.getFullYear(), currentDateProblema.getMonth(), currentDateProblema.getDate(), 21, 0, 0);
console.log('4. Slot 21:00 (método atual - PROBLEMA):');
console.log('   - ISO:', slotProblema.toISOString());
console.log('   - Local BR:', slotProblema.toLocaleDateString('pt-BR'));
console.log('   - toString():', slotProblema.toString());

console.log('\n=== ANÁLISE DO PROBLEMA ===');
console.log('weekStart.getDate():', weekStart.getDate());
console.log('weekStart.getMonth():', weekStart.getMonth());
console.log('weekStart.getFullYear():', weekStart.getFullYear());