console.log('🧪 TESTE: CORREÇÃO PREVENTIVA DOS SLOTS NOTURNOS');
console.log('=' .repeat(70));

function testeCorrecaoPreventiva() {
  console.log('📋 CENÁRIO DE TESTE:');
  console.log('   • Missão: 21:00-23:00 do dia 27/01, volta 05:00 do dia 28/01');
  console.log('   • Correção: Slots noturnos devem aparecer no dia da partida real');
  console.log('');

  // Simular evento com dados completos (como viria do backend)
  const evento = {
    start: '2025-01-27T21:00:00.000Z', // departure_date (18:00 BRT)
    end: '2025-01-28T06:00:00.000Z',   // return_date (03:00 BRT)
    title: 'Missão Teste',
    resource: {
      blocked_until: '2025-01-28T06:00:00.000Z',
      actual_departure_date: '2025-01-28T00:00:00.000Z', // 21:00 BRT dia 27
      actual_return_date: '2025-01-28T02:00:00.000Z'     // 23:00 BRT dia 27
    }
  };

  console.log('🗄️ EVENTO COM DADOS COMPLETOS:');
  console.log(`   start (departure_date): ${evento.start} (${new Date(evento.start).toLocaleString('pt-BR')})`);
  console.log(`   end (return_date): ${evento.end} (${new Date(evento.end).toLocaleString('pt-BR')})`);
  console.log(`   actual_departure_date: ${evento.resource.actual_departure_date} (${new Date(evento.resource.actual_departure_date).toLocaleString('pt-BR')})`);
  console.log(`   actual_return_date: ${evento.resource.actual_return_date} (${new Date(evento.resource.actual_return_date).toLocaleString('pt-BR')})`);
  console.log('');

  // Testar a lógica corrigida
  const diasTeste = [
    { date: new Date('2025-01-27T00:00:00'), nome: 'Dia 27 (partida)' },
    { date: new Date('2025-01-28T00:00:00'), nome: 'Dia 28 (retorno)' }
  ];

  diasTeste.forEach(({ date, nome }) => {
    console.log(`📅 TESTANDO ${nome.toUpperCase()} COM CORREÇÃO:`);
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    console.log(`   Período do dia: ${dayStart.toLocaleString('pt-BR')} → ${dayEnd.toLocaleString('pt-BR')}`);
    
    // LÓGICA CORRIGIDA: Filtrar eventos relevantes
    const events = [evento];
    const relevantEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      const finalEnd = event.resource?.blocked_until ? 
        new Date(event.resource.blocked_until) : new Date(event.end);
      
      const eventStartLocal = new Date(eventStart.getTime() - (3 * 60 * 60 * 1000));
      const eventEndLocal = new Date(finalEnd.getTime() - (3 * 60 * 60 * 1000));
      
      let eventAffectsDay = (eventStartLocal < dayEnd && eventEndLocal > dayStart);
      
      // CORREÇÃO: Se o evento tem actual_departure_date, usar essa data para slots noturnos
      if (event.resource?.actual_departure_date) {
        const actualDepartureLocal = new Date(new Date(event.resource.actual_departure_date).getTime() - (3 * 60 * 60 * 1000));
        const actualDepartureDay = new Date(actualDepartureLocal);
        actualDepartureDay.setHours(0, 0, 0, 0);
        
        if (actualDepartureDay.getTime() === dayStart.getTime()) {
          eventAffectsDay = true;
        }
      }
      
      console.log(`   Evento afeta este dia: ${eventAffectsDay}`);
      return eventAffectsDay;
    });
    
    console.log(`   Eventos relevantes: ${relevantEvents.length}`);
    
    if (relevantEvents.length > 0) {
      const slotsNoturnos = ['21:00', '22:00', '23:00'];
      
      console.log('   🌙 TESTANDO SLOTS NOTURNOS COM CORREÇÃO:');
      
      slotsNoturnos.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        
        const slotDateTime = new Date(date);
        slotDateTime.setHours(hours, minutes, 0, 0);
        const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
        
        const conflictingEvent = relevantEvents.find(event => {
          const eventStart = new Date(event.start);
          const finalEnd = event.resource?.blocked_until ? 
            new Date(event.resource.blocked_until) : new Date(event.end);
          
          const eventStartLocal = new Date(eventStart.getTime() - (3 * 60 * 60 * 1000));
          const eventEndLocal = new Date(finalEnd.getTime() - (3 * 60 * 60 * 1000));
          
          let isBlocked = slotDateTime < eventEndLocal && slotEndDateTime > eventStartLocal;
          
          // CORREÇÃO: Para slots noturnos, verificar também o período da missão real
          if (hours >= 21 && hours <= 23 && event.resource?.actual_departure_date) {
            const actualDepartureLocal = new Date(new Date(event.resource.actual_departure_date).getTime() - (3 * 60 * 60 * 1000));
            const actualReturnLocal = event.resource?.actual_return_date ? 
              new Date(new Date(event.resource.actual_return_date).getTime() - (3 * 60 * 60 * 1000)) : 
              actualDepartureLocal;
            
            const slotInRealMissionPeriod = slotDateTime < actualReturnLocal && slotEndDateTime > actualDepartureLocal;
            
            if (slotInRealMissionPeriod) {
              isBlocked = true;
              console.log(`      ${time}: BLOQUEADO por período da missão real`);
            } else {
              console.log(`      ${time}: Verificando período total...`);
            }
          }
          
          return isBlocked;
        });
        
        const status = conflictingEvent ? 'BLOQUEADO' : 'DISPONÍVEL';
        console.log(`      ${time}: ${slotDateTime.toLocaleString('pt-BR')} - ${status}`);
      });
    }
    
    console.log('');
  });

  console.log('🎯 RESULTADO ESPERADO COM CORREÇÃO:');
  console.log('   • Dia 27: Slots 21h-23h BLOQUEADOS (correto - dia da partida)');
  console.log('   • Dia 28: Slots 21h-23h DISPONÍVEIS (correto - não é dia da partida)');
  console.log('');
  
  console.log('✅ CORREÇÃO IMPLEMENTADA:');
  console.log('   1. Eventos com actual_departure_date são considerados relevantes no dia da partida');
  console.log('   2. Slots noturnos (21h-23h) verificam o período da missão real');
  console.log('   3. Isso garante que slots noturnos apareçam no dia correto');
}

testeCorrecaoPreventiva();