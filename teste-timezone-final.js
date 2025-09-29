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
    
    console.log(`   Dia ${date.getDate()}/09:`);\n    console.log(`     dayStartUTC: ${dayStartUTC.toISOString()} (00:00 BRT)`);\n    console.log(`     dayEndUTC: ${dayEndUTC.toISOString()} (23:59 BRT)`);\n    console.log(`     eventStart: ${eventStart.toISOString()}`);\n    console.log(`     eventEnd: ${eventEnd.toISOString()}`);\n    console.log(`     eventStart <= dayEndUTC: ${eventStart <= dayEndUTC}`);\n    console.log(`     eventEnd >= dayStartUTC: ${eventEnd >= dayStartUTC}`);\n    \n    const afeta = (eventStart <= dayEndUTC && eventEnd >= dayStartUTC);\n    console.log(`     RESULTADO: ${afeta ? 'AFETA ✅' : 'NÃO AFETA ❌'}`);\n    console.log('');\n    \n    return afeta;\n  }\n  \n  const afetaDia15 = testarDia(dia15, event);\n  const afetaDia16 = testarDia(dia16, event);\n  \n  console.log('📊 RESULTADO FINAL:');\n  console.log(`   Dia 15/09: ${afetaDia15 ? 'AFETADO' : 'NÃO AFETADO'}`);\n  console.log(`   Dia 16/09: ${afetaDia16 ? 'AFETADO' : 'NÃO AFETADO'}`);\n  console.log('');\n  \n  if (afetaDia15 && !afetaDia16) {\n    console.log('🎉 PERFEITO!');\n    console.log('   ✅ Dia 15/09 detecta o evento (correto)');\n    console.log('   ✅ Dia 16/09 NÃO detecta o evento (correto)');\n    console.log('   ✅ Pós-voo fica contido no mesmo dia');\n  } else if (afetaDia15 && afetaDia16) {\n    console.log('⚠️ Ainda detectando no dia 16...');\n  } else {\n    console.log('❌ Problema na detecção');\n  }\n}\n\ntesteTimezone();