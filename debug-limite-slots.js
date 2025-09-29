console.log('🔍 DEBUG: Problema limitando slots até 20:30');
console.log('=' .repeat(60));

function debugLimiteSlots() {
  console.log('📋 INVESTIGANDO LIMITAÇÃO DE SLOTS:');
  console.log('   Problema: Sistema só vê até 20:30, não reconhece 21:00-23:00');
  console.log('   Suspeita: Lógica isToday está bloqueando slots noturnos');
  console.log('');
  
  // Simular horário atual problemático
  const agora = new Date();
  agora.setHours(20, 40, 0, 0); // 20:40 - após 20:30
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  console.log('🕐 CENÁRIO ATUAL:');
  console.log(`   Agora: ${agora.toLocaleTimeString('pt-BR')}`);
  console.log(`   Data atual: ${hoje.toLocaleDateString('pt-BR')}`);
  console.log('');
  
  // TIME_SLOTS do SmartCalendar
  const TIME_SLOTS = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00', '00:00'
  ];
  
  console.log('🧪 TESTANDO LÓGICA isToday PARA CADA SLOT:');
  
  const slotsNoturnos = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
  
  slotsNoturnos.forEach(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const timeSlot = new Date(agora);
    
    // Lógica atual do SmartCalendar
    if (hours === 0) {
      timeSlot.setHours(24, minutes, 0, 0);
    } else {
      timeSlot.setHours(hours, minutes, 0, 0);
    }
    
    const isTimeInPast = timeSlot <= agora;
    
    console.log(`   Slot ${time}:`);
    console.log(`     timeSlot: ${timeSlot.toLocaleTimeString('pt-BR')}`);
    console.log(`     agora: ${agora.toLocaleTimeString('pt-BR')}`);
    console.log(`     timeSlot <= agora: ${isTimeInPast}`);
    console.log(`     Status: ${isTimeInPast ? 'BLOQUEADO (passado)' : 'DISPONÍVEL (futuro)'}`);
    
    if (time === '21:00' && isTimeInPast) {
      console.log(`     🚨 PROBLEMA: 21:00 sendo bloqueado como "passado" quando são ${agora.toLocaleTimeString('pt-BR')}`);
    }
    
    console.log('');
  });
  
  console.log('💡 DIAGNÓSTICO:');
  console.log('   Se agora são 20:40, slots 21:00+ deveriam estar DISPONÍVEIS');
  console.log('   Mas se a lógica isTimeInPast está bloqueando, há erro na comparação');
  console.log('');
  
  // Testar cenário específico: 20:30
  console.log('🎯 TESTE ESPECÍFICO: Por que para em 20:30?');
  
  const agora2030 = new Date();
  agora2030.setHours(20, 30, 0, 0);
  
  const slot2100 = new Date(agora2030);
  slot2100.setHours(21, 0, 0, 0);
  
  console.log(`   Agora: ${agora2030.toLocaleTimeString('pt-BR')}`);
  console.log(`   Slot 21:00: ${slot2100.toLocaleTimeString('pt-BR')}`);
  console.log(`   21:00 <= 20:30? ${slot2100 <= agora2030} (deveria ser FALSE)`);
  
  if (slot2100 > agora2030) {
    console.log('   ✅ 21:00 está no futuro, deveria estar DISPONÍVEL');
  } else {
    console.log('   ❌ Há erro na lógica de comparação de tempo');
  }
  
  console.log('');
  console.log('🔧 POSSÍVEIS SOLUÇÕES:');
  console.log('   1. Verificar se há problema na setHours()');
  console.log('   2. Ajustar lógica de isTimeInPast para ser menos restritiva');
  console.log('   3. Permitir seleção de horários futuros mesmo se for "hoje"');
  console.log('   4. Verificar se há conflito com UTC/BRT nas comparações');
}

debugLimiteSlots();