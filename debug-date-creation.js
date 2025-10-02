// Debug: Análise da criação de datas no SmartCalendar
console.log('🔍 DEBUG: CRIAÇÃO DE DATAS NO SMARTCALENDAR');
console.log('=' .repeat(60));

function debugDateCreation(inputDate, timeSlot) {
  console.log(`\n📅 TESTANDO: ${inputDate} às ${timeSlot}`);
  
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const date = new Date(inputDate);
  
  console.log(`   Data base: ${date.toISOString()} (${date.toLocaleString('pt-BR')})`);
  
  // Lógica atual do SmartCalendar
  const slotDateTimeBR = new Date(date);
  if (hours === 0) {
    // 00:00 = meia-noite do próximo dia
    slotDateTimeBR.setDate(date.getDate() + 1);
    slotDateTimeBR.setHours(0, minutes, 0, 0);
    console.log(`   Aplicando lógica 00:00 - próximo dia`);
  } else {
    // Todos os outros horários (incluindo 21:00-23:30) ficam no mesmo dia
    slotDateTimeBR.setHours(hours, minutes, 0, 0);
    console.log(`   Aplicando lógica horário normal - mesmo dia`);
  }
  
  console.log(`   Slot BR: ${slotDateTimeBR.toISOString()} (${slotDateTimeBR.toLocaleString('pt-BR')})`);
  
  // Converter para UTC
  const slotDateTimeUTC = new Date(slotDateTimeBR.getTime() + (3 * 60 * 60 * 1000));
  console.log(`   Slot UTC: ${slotDateTimeUTC.toISOString()} (${slotDateTimeUTC.toLocaleString('pt-BR')})`);
  
  return {
    inputDate,
    timeSlot,
    slotBR: slotDateTimeBR.toISOString(),
    slotUTC: slotDateTimeUTC.toISOString()
  };
}

// Testar diferentes cenários
console.log('🧪 CENÁRIOS DE TESTE:');

// Dia 20/10 às 21:00 - deveria ser 20/10 21:00 BR = 21/10 00:00 UTC
debugDateCreation('2025-10-20', '21:00');

// Dia 20/10 às 22:00 - deveria ser 20/10 22:00 BR = 21/10 01:00 UTC  
debugDateCreation('2025-10-20', '22:00');

// Dia 20/10 às 23:00 - deveria ser 20/10 23:00 BR = 21/10 02:00 UTC
debugDateCreation('2025-10-20', '23:00');

// Dia 21/10 às 00:00 - deveria ser 21/10 00:00 BR = 21/10 03:00 UTC
debugDateCreation('2025-10-20', '00:00'); // Note: input é 20/10 mas 00:00 vai para 21/10

console.log('\n💡 PROBLEMA IDENTIFICADO:');
console.log('   A data base está sendo interpretada como UTC, mas deveria ser BR');
console.log('   Quando fazemos new Date("2025-10-20"), isso cria meia-noite UTC');
console.log('   Mas queremos meia-noite do horário brasileiro');

console.log('\n🔧 SOLUÇÃO:');
console.log('   Usar new Date(year, month, day) ao invés de string ISO');
console.log('   Isso cria a data no timezone local (brasileiro)');

function correctDateCreation(inputDateStr, timeSlot) {
  console.log(`\n✅ CORREÇÃO: ${inputDateStr} às ${timeSlot}`);
  
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  // Criar data no timezone local (brasileiro)
  const dateParts = inputDateStr.split('-');
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1; // Month é 0-indexed
  const day = parseInt(dateParts[2]);
  
  const date = new Date(year, month, day);
  console.log(`   Data base (local): ${date.toISOString()} (${date.toLocaleString('pt-BR')})`);
  
  const slotDateTimeBR = new Date(date);
  if (hours === 0) {
    slotDateTimeBR.setDate(date.getDate() + 1);
    slotDateTimeBR.setHours(0, minutes, 0, 0);
  } else {
    slotDateTimeBR.setHours(hours, minutes, 0, 0);
  }
  
  console.log(`   Slot BR (local): ${slotDateTimeBR.toISOString()} (${slotDateTimeBR.toLocaleString('pt-BR')})`);
  
  // Para comparar com UTC do backend, converter para UTC
  const slotDateTimeUTC = new Date(slotDateTimeBR.getTime() + (3 * 60 * 60 * 1000));
  console.log(`   Slot UTC: ${slotDateTimeUTC.toISOString()}`);
  
  return slotDateTimeUTC;
}

console.log('\n🧪 TESTE COM CORREÇÃO:');
correctDateCreation('2025-10-20', '21:00');
correctDateCreation('2025-10-20', '22:00');
correctDateCreation('2025-10-20', '23:00');