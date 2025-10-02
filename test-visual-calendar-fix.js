// Teste: Verificar se há problema na renderização visual do calendário
console.log('🎨 TESTANDO RENDERIZAÇÃO VISUAL DO CALENDÁRIO');
console.log('');

// Simular a data selecionada no calendário (20 de outubro)
const selectedDate = new Date(2025, 9, 20); // 20/10/2025
console.log(`📅 Data selecionada: ${selectedDate.toLocaleDateString('pt-BR')}`);
console.log(`   Objeto Date: ${selectedDate}`);
console.log('');

// Testar a lógica de handleTimeSelect para cada slot
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00', '00:00'
];

console.log('🕐 TESTANDO LÓGICA DE handleTimeSelect:');
TIME_SLOTS.forEach(time => {
  const [hours, minutes] = time.split(':').map(Number);
  
  // Lógica exata do SmartCalendar - handleTimeSelect
  const selectedDateTime = new Date(selectedDate);
  
  if (hours === 0) {
    // 00:00 = meia-noite do próximo dia
    selectedDateTime.setDate(selectedDate.getDate() + 1);
    selectedDateTime.setHours(0, minutes, 0, 0);
  } else {
    // Todos os outros horários (incluindo 21:00-23:30) ficam no mesmo dia
    selectedDateTime.setHours(hours, minutes, 0, 0);
  }
  
  const endDateTime = new Date(selectedDateTime);
  if (hours === 0) {
    endDateTime.setHours(1, minutes, 0, 0); // 01:00 do dia seguinte
  } else {
    endDateTime.setHours(hours + 1, minutes, 0, 0);
  }
  
  // Simular o toast message
  const toastMessage = `${selectedDateTime.toLocaleDateString('pt-BR')} ${selectedDateTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  
  console.log(`   Slot ${time}:`);
  console.log(`     Data/Hora: ${selectedDateTime.toLocaleString('pt-BR')}`);
  console.log(`     Toast: "Horário selecionado: ${toastMessage}"`);
  console.log(`     Dia: ${selectedDateTime.getDate()}`);
  console.log(`     Deveria aparecer em: ${time === '00:00' ? '21/10' : '20/10'}`);
  
  if (time === '21:00' || time === '22:00' || time === '23:00') {
    if (selectedDateTime.getDate() !== 20) {
      console.log(`     🚨 ERRO: Slot ${time} criado no dia ${selectedDateTime.getDate()} em vez de 20!`);
    } else {
      console.log(`     ✅ OK: Slot ${time} criado corretamente no dia 20`);
    }
  }
  
  if (time === '00:00') {
    if (selectedDateTime.getDate() !== 21) {
      console.log(`     🚨 ERRO: Slot 00:00 criado no dia ${selectedDateTime.getDate()} em vez de 21!`);
    } else {
      console.log(`     ✅ OK: Slot 00:00 criado corretamente no dia 21`);
    }
  }
  
  console.log('');
});

console.log('🔍 POSSÍVEIS CAUSAS DO PROBLEMA VISUAL:');
console.log('   1. Cache do navegador mostrando dados antigos');
console.log('   2. Estado do React não atualizando corretamente');
console.log('   3. Problema na comparação de datas no getAvailableTimeSlots');
console.log('   4. Conversão de timezone na renderização dos slots');
console.log('');

console.log('💡 SOLUÇÕES RECOMENDADAS:');
console.log('   1. Limpar cache do navegador (Ctrl+Shift+R)');
console.log('   2. Verificar se há console.logs no navegador mostrando dados incorretos');
console.log('   3. Adicionar logs de debug na renderização dos slots');
console.log('   4. Verificar se o estado selectedDate está correto no componente');