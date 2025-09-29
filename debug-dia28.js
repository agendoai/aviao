console.log('=== DEBUG: Testando conversão de data para dia 28 ===');

// Simular seleção do dia 28/09/2025
const currentWeek = new Date(2025, 8, 28); // 28 de setembro de 2025 (mês 8 = setembro)
console.log('1. currentWeek original:', currentWeek);
console.log('   - toString():', currentWeek.toString());
console.log('   - toDateString():', currentWeek.toDateString());

// Simular o que acontece no código
const dayStart = new Date(currentWeek);
dayStart.setHours(0, 0, 0, 0);
console.log('2. dayStart (00:00:00):', dayStart);
console.log('   - toString():', dayStart.toString());

// Simular convertWeekStartToBrazilianTimezone
const year = dayStart.getFullYear();
const month = String(dayStart.getMonth() + 1).padStart(2, '0');
const day = String(dayStart.getDate()).padStart(2, '0');
const hours = String(dayStart.getHours()).padStart(2, '0');
const minutes = String(dayStart.getMinutes()).padStart(2, '0');
const seconds = String(dayStart.getSeconds()).padStart(2, '0');

const dayStartBrazilian = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
console.log('3. dayStartBrazilian:', dayStartBrazilian);

// Simular criação de slot às 21:00
const slotDate = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 21, 0, 0);
console.log('4. Slot às 21:00:', slotDate);
console.log('   - toString():', slotDate.toString());
console.log('   - toDateString():', slotDate.toDateString());
console.log('   - Data formatada (DD/MM/YYYY):', slotDate.toLocaleDateString('pt-BR'));

// Verificar se há problema de timezone
console.log('5. Verificações de timezone:');
console.log('   - Timezone offset:', slotDate.getTimezoneOffset());
console.log('   - UTC string:', slotDate.toISOString());