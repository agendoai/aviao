console.log('🔍 TESTE PRECISO - BLOCKED_UNTIL UTC');
console.log('=' .repeat(50));

function testePreciso() {
  // Dados REAIS que vêm do backend
  const event = {
    start: new Date('2025-09-15T15:00:00.000Z'), // 12:00 BRT (pré-voo)
    end: new Date('2025-09-16T01:00:00.000Z'),   // 22:00 BRT (fim total)
    resource: {
      blocked_until: '2025-09-16T01:00:00.000Z', // 22:00 BRT = 01:00 UTC DIA 16
    }
  };
  
  console.log('📅 DADOS REAIS DO BACKEND:');
  console.log(`   event.start: ${event.start.toISOString()} (${event.start.toLocaleString('pt-BR')})`);
  console.log(`   blocked_until: ${event.resource.blocked_until} (22:00 BRT do dia 15)`);
  console.log('   ATENÇÃO: 22:00 BRT = 01:00 UTC do DIA 16!');
  console.log('');
  
  const dia15 = new Date(2025, 8, 15); // 15/09
  const dia16 = new Date(2025, 8, 16); // 16/09
  
  console.log('🔍 TESTANDO NOVO FILTRO:');
  
  function novoFiltro(date, event) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.resource?.blocked_until || event.end);
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    console.log(`     Dia ${date.getDate()}/09:`);
    console.log(`       dayStart: ${dayStart.toISOString()}`);
    console.log(`       dayEnd: ${dayEnd.toISOString()}`);
    console.log(`       eventStart: ${eventStart.toISOString()}`);
    console.log(`       eventEnd: ${eventEnd.toISOString()}`);
    console.log(`       eventStart <= dayEnd: ${eventStart <= dayEnd}`);
    console.log(`       eventEnd >= dayStart: ${eventEnd >= dayStart}`);
    
    const afeta = (eventStart <= dayEnd && eventEnd >= dayStart);
    console.log(`       RESULTADO: ${afeta ? 'AFETA' : 'NÃO AFETA'}`);
    console.log('');
    
    return afeta;
  }
  
  const afetaDia15 = novoFiltro(dia15, event);
  const afetaDia16 = novoFiltro(dia16, event);
  
  console.log('📊 RESUMO:');
  console.log(`   Dia 15/09 afetado: ${afetaDia15 ? 'SIM ✅' : 'NÃO ❌'}`);
  console.log(`   Dia 16/09 afetado: ${afetaDia16 ? 'SIM ✅' : 'NÃO ❌'}`);
  console.log('');
  
  if (afetaDia16) {
    console.log('🎉 CORREÇÃO FUNCIONANDO!');
    console.log('   ✅ Dia 16/09 agora detecta que está ocupado até 01:00 UTC');
    console.log('   ✅ Isso vai impedir slots 21:00+ aparecerem incorretamente');
  } else {
    console.log('❌ Ainda há problema na lógica');
  }
}

testePreciso();