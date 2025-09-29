// Testar criação de slots para diferentes horários
const weekStart = new Date('2025-09-27T00:00:00-03:00');
console.log('weekStart:', weekStart.toISOString());
console.log('weekStart local BR:', weekStart.toLocaleDateString('pt-BR'));

// Testar criação de slots para diferentes horários
const testHours = [17, 18, 19, 20];
testHours.forEach(hour => {
  // Método antigo (problemático)
  const oldSlot = new Date(weekStart);
  oldSlot.setHours(hour, 30, 0, 0);
  
  // Método novo (corrigido)
  const newSlot = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate(), hour, 30, 0, 0);
  
  console.log(`${hour}:30 - Antigo: ${oldSlot.toISOString()} (BR: ${oldSlot.toLocaleDateString('pt-BR')})`);
  console.log(`${hour}:30 - Novo: ${newSlot.toISOString()} (BR: ${newSlot.toLocaleDateString('pt-BR')})`);
  console.log('---');
});