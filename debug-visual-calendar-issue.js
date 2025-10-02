// Debug: Problema visual do calendário - slots 21h aparecendo no dia seguinte
console.log('🔍 DEBUGANDO PROBLEMA VISUAL DO CALENDÁRIO');
console.log('');

// Simular a lógica do SmartCalendar para criação de datas
const testDate = new Date(2025, 9, 20); // 20 de outubro de 2025 (mês 9 = outubro)
console.log(`📅 Data selecionada no calendário: ${testDate.toLocaleDateString('pt-BR')}`);
console.log(`   Objeto Date: ${testDate}`);
console.log('');

// Testar slots problemáticos
const slotsProblematicos = ['21:00', '22:00', '23:00', '00:00'];

console.log('🕐 TESTANDO CRIAÇÃO DE SLOTS:');
slotsProblematicos.forEach(time => {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Lógica atual do SmartCalendar - handleTimeSelect
  const selectedDateTime = new Date(testDate);
  
  if (hours === 0) {
    // 00:00 = meia-noite do próximo dia
    selectedDateTime.setDate(testDate.getDate() + 1);
    selectedDateTime.setHours(0, minutes, 0, 0);
  } else {
    // Todos os outros horários (incluindo 21:00-23:30) ficam no mesmo dia
    selectedDateTime.setHours(hours, minutes, 0, 0);
  }
  
  console.log(`   Slot ${time}:`);
  console.log(`     Data/Hora criada: ${selectedDateTime.toLocaleString('pt-BR')}`);
  console.log(`     Dia: ${selectedDateTime.getDate()}`);
  console.log(`     Mês: ${selectedDateTime.getMonth() + 1}`);
  console.log(`     Deveria aparecer em: ${time === '00:00' ? '21/10' : '20/10'}`);
  console.log('');
});

console.log('🎯 ANÁLISE DO PROBLEMA:');
console.log('   - Slots 21:00, 22:00, 23:00 deveriam aparecer no dia 20/10');
console.log('   - Slot 00:00 deveria aparecer no dia 21/10');
console.log('   - Se estão aparecendo no dia errado, pode ser problema na renderização');
console.log('');

// Testar a lógica de criação de data do calendário
console.log('📅 TESTANDO CRIAÇÃO DE DATAS DO CALENDÁRIO:');
const currentMonth = new Date(2025, 9, 1); // Outubro 2025
console.log(`   Mês atual: ${currentMonth.toLocaleDateString('pt-BR')}`);

// Simular como o calendário cria as datas dos dias
for (let i = 19; i <= 21; i++) {
  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
  console.log(`   Dia ${i}: ${date.toLocaleDateString('pt-BR')} - ${date}`);
}

console.log('');
console.log('🚨 POSSÍVEIS CAUSAS DO PROBLEMA VISUAL:');
console.log('   1. Timezone na criação das datas do calendário');
console.log('   2. Conversão UTC/Local na renderização');
console.log('   3. Problema na lógica de comparação de datas');
console.log('   4. Cache ou estado desatualizado no componente');