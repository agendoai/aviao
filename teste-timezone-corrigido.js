console.log('🎯 TESTE FINAL - CORREÇÃO DE TIMEZONE');
console.log('=' .repeat(50));

function testeTimezone() {
  const event = {
    start: new Date('2025-09-15T15:00:00.000Z'), // 12:00 BRT (pré-voo)
    resource: {
      blocked_until: '2025-09-16T01:00:00.000Z', // 22:00 BRT = 01:00 UTC DIA 16
    }
  };
  
  console.log('📅 EVENTO:');
  console.log(`   blocked_until: ${event.resource.blocked_until} (22:00 BRT do dia 15)`);
  console.log('');
  
  const dia15 = new Date(2025, 8, 15); // 15/09
  const dia16 = new Date(2025, 8, 16); // 16/09
  
  console.log('🔍 TESTANDO CORREÇÃO UTC:');
  
  function testarDia(date, event) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.resource.blocked_until);
    
    // Limites do dia em UTC (corrigido)
    const dayStartUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0)); // 00:00 BRT = 03:00 UTC
    const dayEndUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1, 2, 59, 59, 999)); // 23:59 BRT = 02:59 UTC próximo dia
    
    console.log(`   Dia ${date.getDate()}/09:`);
    console.log(`     dayStartUTC: ${dayStartUTC.toISOString()} (00:00 BRT)`);
    console.log(`     dayEndUTC: ${dayEndUTC.toISOString()} (23:59 BRT)`);
    console.log(`     eventStart: ${eventStart.toISOString()}`);
    console.log(`     eventEnd: ${eventEnd.toISOString()}`);
    console.log(`     eventStart <= dayEndUTC: ${eventStart <= dayEndUTC}`);
    console.log(`     eventEnd >= dayStartUTC: ${eventEnd >= dayStartUTC}`);
    
    const afeta = (eventStart <= dayEndUTC && eventEnd >= dayStartUTC);
    console.log(`     RESULTADO: ${afeta ? 'AFETA ✅' : 'NÃO AFETA ❌'}`);
    console.log('');
    
    return afeta;
  }
  
  const afetaDia15 = testarDia(dia15, event);
  const afetaDia16 = testarDia(dia16, event);
  
  console.log('📊 RESULTADO FINAL:');
  console.log(`   Dia 15/09: ${afetaDia15 ? 'AFETADO' : 'NÃO AFETADO'}`);
  console.log(`   Dia 16/09: ${afetaDia16 ? 'AFETADO' : 'NÃO AFETADO'}`);
  console.log('');
  
  if (afetaDia15 && !afetaDia16) {
    console.log('🎉 PERFEITO!');
    console.log('   ✅ Dia 15/09 detecta o evento (correto)');
    console.log('   ✅ Dia 16/09 NÃO detecta o evento (correto)');
    console.log('   ✅ Pós-voo fica contido no mesmo dia');
  } else if (afetaDia15 && afetaDia16) {
    console.log('⚠️ Ainda detectando no dia 16...');
  } else {
    console.log('❌ Problema na detecção');
  }
}

testeTimezone();