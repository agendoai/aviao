console.log('🔍 DEBUG: IntelligentTimeSelectionStep - Slots de 24 horas');
console.log('=' .repeat(60));

// Simular o que acontece no IntelligentTimeSelectionStep
function debugIntelligentSlots() {
  console.log('📋 PROBLEMA IDENTIFICADO:');
  console.log('   Backend: Gera 48 slots (00:00 às 23:30)');
  console.log('   Frontend: Renderiza 48 slots, mas pode não encontrar todos');
  console.log('');
  
  // Simular timeSlots que vem do backend (pode estar incompleto)
  const timeSlots = [];
  
  // Gerar slots como o backend faz (00:00 às 23:30)
  for (let hour = 0; hour <= 23; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const start = new Date();
      start.setHours(hour, minute, 0, 0);
      
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      
      timeSlots.push({
        start,
        end,
        status: 'available'
      });
    }
  }
  
  console.log(`🕐 SLOTS GERADOS PELO BACKEND: ${timeSlots.length}`);
  console.log(`   Primeiro: ${timeSlots[0].start.getHours()}:${timeSlots[0].start.getMinutes().toString().padStart(2, '0')}`);
  console.log(`   Último: ${timeSlots[timeSlots.length-1].start.getHours()}:${timeSlots[timeSlots.length-1].start.getMinutes().toString().padStart(2, '0')}`);
  console.log('');
  
  // Simular o que o frontend faz - Array.from({ length: 48 })
  console.log('🖥️ FRONTEND - RENDERIZAÇÃO DOS 48 SLOTS:');
  let slotsEncontrados = 0;
  let slotsNaoEncontrados = 0;
  
  for (let slotIndex = 0; slotIndex < 48; slotIndex++) {
    const hour = Math.floor(slotIndex / 2);
    const minute = (slotIndex % 2) * 30;
    
    // Procurar o slot correspondente (como faz o frontend)
    const slot = timeSlots.find(s => 
      s.start.getHours() === hour && s.start.getMinutes() === minute
    );
    
    if (slot) {
      slotsEncontrados++;
    } else {
      slotsNaoEncontrados++;
      console.log(`   ❌ Slot ${slotIndex} não encontrado: ${hour}:${minute.toString().padStart(2, '0')}`);
    }
  }
  
  console.log(`   ✅ Slots encontrados: ${slotsEncontrados}`);
  console.log(`   ❌ Slots não encontrados: ${slotsNaoEncontrados}`);
  console.log('');
  
  if (slotsNaoEncontrados === 0) {
    console.log('✅ TUDO OK: Todos os 48 slots foram encontrados!');
    console.log('   O problema pode estar na API ou na conversão de timezone');
  } else {
    console.log('🚨 PROBLEMA: Alguns slots não foram encontrados!');
    console.log('   Isso explica por que alguns horários não aparecem');
  }
  
  console.log('');
  console.log('🔧 PRÓXIMOS PASSOS:');
  console.log('   1. Verificar se a API está retornando todos os 48 slots');
  console.log('   2. Verificar conversão de timezone no frontend');
  console.log('   3. Adicionar logs no IntelligentTimeSelectionStep');
}

debugIntelligentSlots();