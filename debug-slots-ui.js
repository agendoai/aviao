console.log('🔍 DEBUG: Problema de exibição de slots até 20:30');
console.log('=' .repeat(60));

function debugSlotsUI() {
  console.log('📋 INVESTIGANDO LIMITAÇÃO DE EXIBIÇÃO DE SLOTS:');
  console.log('   Problema: Sistema só mostra slots até 20:30');
  console.log('   TIME_SLOTS tem slots até 23:00, mas UI pode estar limitando');
  console.log('');
  
  // TIME_SLOTS do SmartCalendar (exato do código)
  const TIME_SLOTS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00', '00:00'
  ];
  
  console.log('🕐 TIME_SLOTS DEFINIDOS:');
  console.log(`   Total: ${TIME_SLOTS.length} slots`);
  console.log(`   Primeiro: ${TIME_SLOTS[0]}`);
  console.log(`   Último: ${TIME_SLOTS[TIME_SLOTS.length - 1]}`);
  console.log(`   Slots após 20:00: ${TIME_SLOTS.filter(slot => {
    const hour = parseInt(slot.split(':')[0]);
    return hour > 20 || hour === 0; // 0 = 00:00
  }).join(', ')}`);
  console.log('');
  
  // Simular cenário onde usuário relata problema
  console.log('🧪 SIMULANDO CENÁRIO DO USUÁRIO:');
  console.log('   Data: hoje');
  console.log('   Hora atual: 20:35 (após 20:30)');
  console.log('   Expectativa: slots 21:00, 22:00, 23:00 deveriam estar visíveis');
  console.log('');
  
  // Testar lógica isToday para cada slot crítico
  const agora = new Date();
  agora.setHours(20, 35, 0, 0); // 20:35
  
  const slotsProblematicos = ['20:00', '21:00', '22:00', '23:00', '00:00'];
  
  console.log('🔍 ANÁLISE SLOT POR SLOT:');
  slotsProblematicos.forEach(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const timeSlot = new Date(agora);
    
    // Lógica do SmartCalendar
    if (hours === 0) {
      timeSlot.setHours(24, minutes, 0, 0);
    } else {
      timeSlot.setHours(hours, minutes, 0, 0);
    }
    
    const isTimeInPast = timeSlot <= agora;
    
    console.log(`   Slot ${time}:`);
    console.log(`     Horário slot: ${timeSlot.toLocaleTimeString('pt-BR')}`);
    console.log(`     Hora atual: ${agora.toLocaleTimeString('pt-BR')}`);
    console.log(`     É passado: ${isTimeInPast}`);
    console.log(`     Deveria estar: ${isTimeInPast ? 'BLOQUEADO' : 'DISPONÍVEL'}`);
    
    if (time === '21:00' && isTimeInPast) {
      console.log(`     🚨 ERRO: 21:00 sendo marcado como passado quando são 20:35!`);
    }
    console.log('');
  });
  
  // Testar layout da UI
  console.log('🎨 ANÁLISE DO LAYOUT UI:');
  console.log(`   Grid configurado: grid-cols-3 md:grid-cols-5`);
  console.log(`   Total slots: ${TIME_SLOTS.length}`);
  console.log(`   Em 3 colunas: ${Math.ceil(TIME_SLOTS.length / 3)} linhas`);
  console.log(`   Em 5 colunas: ${Math.ceil(TIME_SLOTS.length / 5)} linhas`);
  console.log('');
  
  // Verificar se há overflow ou problemas de renderização
  console.log('📱 SIMULAÇÃO DE RENDERIZAÇÃO:');
  console.log('   Layout 3 colunas (mobile):');
  for (let i = 0; i < TIME_SLOTS.length; i += 3) {
    const linha = TIME_SLOTS.slice(i, i + 3);
    console.log(`     Linha ${Math.floor(i/3) + 1}: ${linha.join(' | ')}`);
  }
  
  console.log('\n   Layout 5 colunas (desktop):');
  for (let i = 0; i < TIME_SLOTS.length; i += 5) {
    const linha = TIME_SLOTS.slice(i, i + 5);
    console.log(`     Linha ${Math.floor(i/5) + 1}: ${linha.join(' | ')}`);
  }
  
  console.log('\n💡 POSSÍVEIS CAUSAS DO PROBLEMA:');
  console.log('1. ❌ Lógica isTimeInPast incorreta para horários futuros');
  console.log('2. ❌ Problema de CSS/height limitando exibição de linhas');
  console.log('3. ❌ JavaScript não renderizando todos os slots do array');
  console.log('4. ❌ Filtro adicional escondendo slots após 20:30');
  console.log('5. ❌ Problema de responsividade do grid');
  
  console.log('\n🔧 PRÓXIMOS PASSOS:');
  console.log('1. Verificar se TODOS os 19 slots são renderizados no DOM');
  console.log('2. Checar se há CSS escondendo slots após linha X');
  console.log('3. Validar lógica isTimeInPast com console.log');
  console.log('4. Testar em diferentes tamanhos de tela');
  console.log('5. Verificar se getAvailableTimeSlots retorna todos os slots');
}

debugSlotsUI();