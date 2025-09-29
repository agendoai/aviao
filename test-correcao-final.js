console.log('🔧 TESTE DA CORREÇÃO FINAL - Pós-voo');
console.log('=' .repeat(50));

function testCorrecaoFinal() {
  console.log('📋 PROBLEMA ORIGINAL:');
  console.log('   • Pós-voo antes 20:30: marca no dia normal ✅');
  console.log('   • Pós-voo depois 20:30: marca no dia seguinte ❌');
  console.log('   • Deveria sempre marcar no mesmo dia!');
  console.log('');
  
  // Simular evento com pós-voo indo até 22:00 BRT
  const event = {
    start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT
    end: new Date('2025-09-15T21:00:00.000Z'),   // 18:00 BRT
    resource: {
      blocked_until: '2025-09-16T01:00:00.000Z' // 22:00 BRT (01:00 UTC dia seguinte)
    }
  };
  
  console.log('📊 EVENTO DE TESTE:');
  console.log(`   Início: 15:00 BRT (${event.start.toISOString()})`);
  console.log(`   Fim: 18:00 BRT (${event.end.toISOString()})`);
  console.log(`   Blocked until: 22:00 BRT (${event.resource.blocked_until})`);
  console.log('');
  
  const date = new Date(2025, 8, 15); // 15/09/2025
  
  // Testar nova lógica corrigida
  console.log('🧪 TESTANDO NOVA LÓGICA (horário brasileiro):');
  
  function testNovaLogica(date, time, event) {
    const [hours, minutes] = time.split(':').map(Number);
    
    // Slot em horário brasileiro
    const slotDateTime = new Date(date);
    if (hours === 0) {
      slotDateTime.setDate(date.getDate() + 1);
      slotDateTime.setHours(0, minutes, 0, 0);
    } else {
      slotDateTime.setHours(hours, minutes, 0, 0);
    }
    
    const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
    
    // Converter blocked_until de UTC para BRT
    const blockedUntilUTC = new Date(event.resource.blocked_until);
    const blockedUntilBRT = new Date(blockedUntilUTC.getTime() + (3 * 60 * 60 * 1000)); // UTC para BRT: SOMAR 3h
    
    // Converter event start de UTC para BRT
    const eventStartUTC = new Date(event.start);
    const eventStartBRT = new Date(eventStartUTC.getTime() + (3 * 60 * 60 * 1000)); // UTC para BRT: SOMAR 3h
    
    // Slot bloqueado se sobrepor
    const isBlocked = slotDateTime < blockedUntilBRT && slotEndDateTime > eventStartBRT;
    
    return {
      slotDateTime,
      blockedUntilBRT,
      eventStartBRT,
      isBlocked
    };
  }
  
  const slotsProblematicos = ['19:00', '20:00', '21:00', '22:00', '23:00'];
  
  slotsProblematicos.forEach(time => {
    const result = testNovaLogica(date, time, event);
    const expected = time >= '15:00' && time < '22:00';
    const correct = result.isBlocked === expected;
    
    console.log(`   ${time} BRT: ${result.isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'} ${correct ? '✅' : '❌'}`);
    console.log(`     → Slot: ${result.slotDateTime.toLocaleString('pt-BR')}`);
    console.log(`     → Blocked até: ${result.blockedUntilBRT.toLocaleString('pt-BR')}`);
    console.log(`     → Event start: ${result.eventStartBRT.toLocaleString('pt-BR')}`);
    console.log('');
  });
  
  console.log('💡 EXPECTATIVAS:');
  console.log('   • 15:00-21:59: BLOQUEADO (período ocupado)');
  console.log('   • 22:00+: DISPONÍVEL (pós-voo terminou)');
  console.log('   • TODOS os slots ficam no dia 15/09 (não viram pro dia 16)');
  console.log('');
  
  console.log('🎯 CORREÇÕES IMPLEMENTADAS:');
  console.log('   1. ✅ Filtro relevantEvents corrigido (horário brasileiro)');
  console.log('   2. ✅ Conversão de slot simplificada (horário brasileiro)');
  console.log('   3. ✅ Comparações em horário brasileiro (sem UTC)');
  console.log('   4. ✅ blocked_until convertido de UTC para BRT');
  console.log('   5. ✅ Logs de debug em horário brasileiro');
}

testCorrecaoFinal();