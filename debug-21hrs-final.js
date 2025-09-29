console.log('🚨 DEBUG FINAL - PROBLEMA ESPECÍFICO DO 21:00');
console.log('=' .repeat(60));

// Simular exatamente o que está acontecendo no calendário
function debugProblema21hrs() {
  console.log('🎯 SITUAÇÃO REAL QUE ESTÁ ACONTECENDO:');
  console.log('   1. Você cria uma missão das 15:00-18:00');
  console.log('   2. Pós-voo deveria bloquear até 22:00 do MESMO dia');
  console.log('   3. Mas o slot 21:00 aparece bloqueado no DIA SEGUINTE');
  console.log('');
  
  // Dados reais da missão
  const missao = {
    start: new Date('2025-09-15T15:00:00.000Z'), // 12:00 BRT (pré-voo)
    end: new Date('2025-09-16T01:00:00.000Z'),   // 22:00 BRT (fim total)
    resource: {
      blocked_until: '2025-09-16T01:00:00.000Z', // 22:00 BRT
      actual_return_date: '2025-09-15T21:00:00.000Z' // 18:00 BRT (fim da missão)
    }
  };
  
  console.log('📅 DADOS DA MISSÃO:');
  console.log(`   Início (pré-voo): ${new Date(missao.start).toLocaleString('pt-BR')}`);
  console.log(`   Fim total: ${new Date(missao.end).toLocaleString('pt-BR')}`);
  console.log(`   Blocked until: ${new Date(missao.resource.blocked_until).toLocaleString('pt-BR')}`);
  console.log('');
  
  // Verificar se o problema está na detecção de eventos por dia
  console.log('🔍 VERIFICANDO FILTRO POR DIA:');
  
  const dia15 = new Date(2025, 8, 15); // 15/09
  const dia16 = new Date(2025, 8, 16); // 16/09
  
  // Como o SmartCalendar filtra eventos por dia usando isSameDay
  const eventStart = new Date(missao.start);
  
  const afetaDia15_metodoAtual = eventStart.getDate() === dia15.getDate() && 
                                 eventStart.getMonth() === dia15.getMonth() && 
                                 eventStart.getFullYear() === dia15.getFullYear();
  
  const afetaDia16_metodoAtual = eventStart.getDate() === dia16.getDate() && 
                                 eventStart.getMonth() === dia16.getMonth() && 
                                 eventStart.getFullYear() === dia16.getFullYear();
  
  console.log(`   Dia 15/09 afetado pelo evento: ${afetaDia15_metodoAtual ? 'SIM' : 'NÃO'}`);
  console.log(`   Dia 16/09 afetado pelo evento: ${afetaDia16_metodoAtual ? 'SIM' : 'NÃO'}`);
  console.log('');
  
  // Agora vamos verificar o filtro correto considerando blocked_until
  console.log('🔍 VERIFICANDO FILTRO CORRETO (COM BLOCKED_UNTIL):');
  
  const eventEnd = new Date(missao.resource.blocked_until);
  
  function eventoAfetaDia(date, eventStart, eventEnd) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    return (eventStart <= dayEnd && eventEnd >= dayStart);
  }
  
  const afetaDia15_correto = eventoAfetaDia(dia15, eventStart, eventEnd);
  const afetaDia16_correto = eventoAfetaDia(dia16, eventStart, eventEnd);
  
  console.log(`   Dia 15/09 afetado (método correto): ${afetaDia15_correto ? 'SIM' : 'NÃO'}`);
  console.log(`   Dia 16/09 afetado (método correto): ${afetaDia16_correto ? 'SIM' : 'NÃO'}`);
  console.log('');
  
  // Verificar se o problema está na disponibilidade de datas
  console.log('🔍 VERIFICANDO DISPONIBILIDADE DE DATAS:');
  
  // Método atual: filtra por isSameDay(event.start, date)
  const eventosNoDia15_atual = afetaDia15_metodoAtual ? 1 : 0;
  const eventosNoDia16_atual = afetaDia16_metodoAtual ? 1 : 0;
  
  const dia15_disponivel_atual = eventosNoDia15_atual < 5;
  const dia16_disponivel_atual = eventosNoDia16_atual < 5;
  
  console.log(`   Dia 15/09 disponível (método atual): ${dia15_disponivel_atual ? 'SIM' : 'NÃO'} (${eventosNoDia15_atual} eventos)`);
  console.log(`   Dia 16/09 disponível (método atual): ${dia16_disponivel_atual ? 'SIM' : 'NÃO'} (${eventosNoDia16_atual} eventos)`);
  console.log('');
  
  // Testar slots específicos no dia 16 (onde pode estar aparecendo o 21:00)
  console.log('🚨 TESTANDO SLOTS NO DIA 16/09 (ONDE NÃO DEVERIA TER NADA):');
  
  const slotsProblematicos = ['20:00', '21:00', '22:00'];
  
  slotsProblematicos.forEach(time => {
    const [hours, minutes] = time.split(':').map(Number);
    
    // Lógica atual do SmartCalendar
    let slotUTC;
    if (hours < 21) {
      slotUTC = new Date(Date.UTC(dia16.getFullYear(), dia16.getMonth(), dia16.getDate(), hours + 3, minutes, 0, 0));
    } else {
      const nextDay = new Date(dia16);
      nextDay.setDate(dia16.getDate() + 1);
      slotUTC = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), (hours + 3) % 24, minutes, 0, 0));
    }
    
    console.log(`   Slot ${time} no dia 16/09:`);
    console.log(`     slotUTC: ${slotUTC.toISOString()}`);
    console.log(`     Equivale BRT: ${new Date(slotUTC.getTime() - (3 * 60 * 60 * 1000)).toLocaleString('pt-BR')}`);
    
    // Se o filtro atual não detecta o evento no dia 16, o slot apareceria disponível
    if (!afetaDia16_metodoAtual) {
      console.log(`     ⚠️ PROBLEMA: Slot apareceria DISPONÍVEL porque evento não foi detectado no dia 16!`);
    }
  });
  
  console.log('');
  console.log('💡 DIAGNÓSTICO:');
  console.log('   O problema está no filtro generateAvailableDates() e relevantEvents');
  console.log('   Eles usam isSameDay(event.start, date) que só olha o início do evento');
  console.log('   Mas deveriam considerar o período completo até blocked_until');
  console.log('   Isso faz com que o dia 16/09 apareça disponível quando não deveria');
}

debugProblema21hrs();