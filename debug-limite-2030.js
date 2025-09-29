console.log('🔍 DEBUG - LIMITE 20:30 NO CALENDÁRIO');
console.log('=' .repeat(50));

// Vamos testar eventos que começam em diferentes horários para ver onde está o limite
const testCases = [
  {
    name: 'Evento antes de 20:30',
    departure: '2025-09-15T23:00:00.000Z', // 20:00 BRT (pré-voo)
    return: '2025-09-16T02:00:00.000Z'     // 23:00 BRT (fim)
  },
  {
    name: 'Evento exatamente 20:30',
    departure: '2025-09-15T23:30:00.000Z', // 20:30 BRT (pré-voo)  
    return: '2025-09-16T02:30:00.000Z'     // 23:30 BRT (fim)
  },
  {
    name: 'Evento depois de 20:30',
    departure: '2025-09-16T00:00:00.000Z', // 21:00 BRT (pré-voo)
    return: '2025-09-16T03:00:00.000Z'     // 00:00 BRT próximo dia (fim)
  }
];

console.log('📊 TESTANDO DIFERENTES HORÁRIOS DE INÍCIO:');

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. ${testCase.name}:`);
  
  const event = {
    start: new Date(testCase.departure),
    end: new Date(testCase.return),
    resource: { blocked_until: testCase.return }
  };
  
  console.log(`   departure (pré-voo): ${event.start.toISOString()} (${event.start.toLocaleString('pt-BR')})`);
  console.log(`   return (fim): ${event.end.toISOString()} (${event.end.toLocaleString('pt-BR')})`);
  
  // Testar em que dias o evento é detectado
  const dia15 = new Date(2025, 8, 15); // 15/09
  const dia16 = new Date(2025, 8, 16); // 16/09
  
  function testarDeteccao(date, event) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.resource.blocked_until);
    
    // Lógica atual do SmartCalendar (UTC)
    const dayStartUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0)); // 00:00 BRT = 03:00 UTC
    const dayEndUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1, 2, 59, 59, 999)); // 23:59 BRT = 02:59 UTC próximo dia
    
    return (eventStart <= dayEndUTC && eventEnd >= dayStartUTC);
  }
  
  const detectaDia15 = testarDeteccao(dia15, event);
  const detectaDia16 = testarDeteccao(dia16, event);
  
  console.log(`   Detectado no dia 15/09: ${detectaDia15 ? 'SIM' : 'NÃO'}`);
  console.log(`   Detectado no dia 16/09: ${detectaDia16 ? 'SIM' : 'NÃO'}`);
  
  // Verificar se há algo suspeito
  if (!detectaDia15 && detectaDia16) {
    console.log(`   🚨 PROBLEMA: Evento não detectado no dia 15 mas sim no 16!`);
  } else if (detectaDia15 && !detectaDia16) {
    console.log(`   ✅ Normal: Evento detectado apenas no dia 15`);
  } else if (detectaDia15 && detectaDia16) {
    console.log(`   ✅ Normal: Evento detectado em ambos os dias (atravessa meia-noite)`);
  }
});

console.log('\n💡 POSSÍVEIS CAUSAS DO LIMITE 20:30:');
console.log('1. dayEndUTC está sendo calculado incorretamente');
console.log('2. Alguma validação está limitando horários após 20:30');
console.log('3. Conversão de timezone com erro para horários tardios');
console.log('4. Lógica de slots TIME_SLOTS não inclui horários após 20:30');

// Verificar TIME_SLOTS
console.log('\n🕐 VERIFICANDO TIME_SLOTS:');
const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
  '21:00', '22:00', '23:00', '00:00'
];

console.log('TIME_SLOTS disponíveis:', TIME_SLOTS.join(', '));
console.log(`Último horário: ${TIME_SLOTS[TIME_SLOTS.length - 2]} (antes de 00:00)`);

if (TIME_SLOTS.includes('21:00') && TIME_SLOTS.includes('22:00') && TIME_SLOTS.includes('23:00')) {
  console.log('✅ TIME_SLOTS inclui horários após 20:30');
} else {
  console.log('🚨 TIME_SLOTS pode estar limitado!');
}