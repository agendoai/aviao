// Debug: Testar comportamento dos slots após 21:00
// Simular cenário onde usuário seleciona retorno às 21:00 ou depois

console.log('🔍 DEBUG: Testando slots após 21:00\n');

// Simular dados de uma missão
const departureDateTime = new Date('2025-01-27T05:00:00'); // 5h da manhã
const returnTimes = [
  new Date('2025-01-27T20:30:00'), // 20:30 - funciona
  new Date('2025-01-27T21:00:00'), // 21:00 - problema
  new Date('2025-01-27T22:00:00'), // 22:00 - problema
  new Date('2025-01-27T23:00:00'), // 23:00 - problema
];

const missionPreview = {
  destination: 'SBGR',
  flightTimeMinutes: 120 // 2 horas de voo
};

// Simular função isSlotInPreviewPeriod
function isSlotInPreviewPeriod(slot, isReturnSelection, selectedSlot, departureDateTime, missionPreview) {
  if (!missionPreview || !slot?.start) return false;
  
  try {
    const slotTime = slot.start;
    
    // Se for seleção de retorno, usar departureDateTime como início da missão
    if (isReturnSelection && selectedSlot) {
      const missionStart = departureDateTime; // Horário de partida (5h)
      const missionEnd = selectedSlot.start; // Horário de retorno selecionado
      
      if (!missionStart) return false;
      
      const isInMission = slotTime >= missionStart && slotTime <= missionEnd;
      
      return isInMission;
    }
    
    // Para seleção de partida, usar horário de partida selecionado ou departureDateTime
    const flightStart = selectedSlot?.start || departureDateTime;
    if (!flightStart) return false;
    
    // Calcular período de voo baseado no horário de partida
    const flightEnd = new Date(flightStart.getTime() + missionPreview.flightTimeMinutes * 60 * 1000);
    
    // Verificar se o slot está no período de voo
    const isInPeriod = slotTime >= flightStart && slotTime <= flightEnd;
    return isInPeriod;
  } catch (error) {
    console.error('Erro ao verificar período de preview:', error);
    return false;
  }
}

// Gerar slots de 30 em 30 minutos das 5h às 23:30
function generateTimeSlots(date) {
  const slots = [];
  const startHour = 5;
  const endHour = 24; // até 23:30
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const start = new Date(date);
      start.setHours(hour, minute, 0, 0);
      
      const end = new Date(start);
      end.setMinutes(end.getMinutes() + 30);
      
      slots.push({
        start,
        end,
        status: 'available'
      });
    }
  }
  
  return slots;
}

// Testar cada horário de retorno
returnTimes.forEach((returnTime, index) => {
  console.log(`\n📅 TESTE ${index + 1}: Retorno às ${returnTime.toLocaleTimeString()}`);
  console.log('=' .repeat(50));
  
  const selectedSlot = { start: returnTime };
  const timeSlots = generateTimeSlots(departureDateTime);
  
  // Contar slots cinzas (no período da missão)
  let graySlots = 0;
  let lastGraySlot = null;
  
  timeSlots.forEach(slot => {
    const isGray = isSlotInPreviewPeriod(slot, true, selectedSlot, departureDateTime, missionPreview);
    
    if (isGray) {
      graySlots++;
      lastGraySlot = slot;
    }
  });
  
  console.log(`✅ Partida: ${departureDateTime.toLocaleTimeString()}`);
  console.log(`🔄 Retorno: ${returnTime.toLocaleTimeString()}`);
  console.log(`🎯 Slots cinzas encontrados: ${graySlots}`);
  
  if (lastGraySlot) {
    console.log(`⏰ Último slot cinza: ${lastGraySlot.start.toLocaleTimeString()}`);
  }
  
  // Verificar se os slots cinzas vão até o horário de retorno
  if (lastGraySlot && lastGraySlot.start.getTime() === returnTime.getTime()) {
    console.log('✅ CORRETO: Slots cinzas vão até o horário de retorno');
  } else {
    console.log('❌ PROBLEMA: Slots cinzas NÃO vão até o horário de retorno');
    if (lastGraySlot) {
      const diff = (returnTime.getTime() - lastGraySlot.start.getTime()) / (1000 * 60);
      console.log(`   Diferença: ${diff} minutos`);
    }
  }
});

console.log('\n🔍 ANÁLISE DETALHADA: Slots das 20:00 às 23:30');
console.log('=' .repeat(50));

const detailedSlots = generateTimeSlots(departureDateTime).filter(slot => 
  slot.start.getHours() >= 20
);

const returnAt21 = { start: new Date('2025-01-27T21:00:00') };

detailedSlots.forEach(slot => {
  const isGray = isSlotInPreviewPeriod(slot, true, returnAt21, departureDateTime, missionPreview);
  const status = isGray ? '🔘 CINZA' : '⚪ NORMAL';
  
  console.log(`${slot.start.toLocaleTimeString()} - ${status}`);
});