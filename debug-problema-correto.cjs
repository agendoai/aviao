console.log('🔍 DEBUG: PROBLEMA REAL DOS SLOTS NOTURNOS (FINAL)');
console.log('=' .repeat(70));

// Simular exatamente como o SmartCalendar filtra eventos por dia
function debugProblemaCorreto() {
  console.log('📋 CENÁRIO DE TESTE:');
  console.log('   • Usuário seleciona: 21:00-23:00 do dia 27/01');
  console.log('   • Volta para base: 05:00 do dia 28/01');
  console.log('   • Problema: Slots 21h-23h aparecem bloqueados no dia 28 em vez do dia 27');
  console.log('');

  // Como o backend calcula as datas (baseado no código real)
  const userSelectedDeparture = new Date('2025-01-27T21:00:00-03:00'); // 21:00 BRT
  const userSelectedReturn = new Date('2025-01-27T23:00:00-03:00');    // 23:00 BRT
  const flightHours = 2;
  const returnFlightTime = flightHours / 2; // 1 hora de volta

  // Cálculo do backend (departure_date = partida - 3h, return_date = retorno + tempo_volta + 3h)
  const calculatedDepartureDate = new Date(userSelectedDeparture.getTime() - (3 * 60 * 60 * 1000));
  const calculatedReturnDate = new Date(userSelectedReturn.getTime() + (returnFlightTime * 60 * 60 * 1000) + (3 * 60 * 60 * 1000));

  console.log('🗄️ CÁLCULOS DO BACKEND:');
  console.log(`   Partida escolhida: ${userSelectedDeparture.toISOString()} (${userSelectedDeparture.toLocaleString('pt-BR')})`);
  console.log(`   Retorno escolhido: ${userSelectedReturn.toISOString()} (${userSelectedReturn.toLocaleString('pt-BR')})`);
  console.log(`   departure_date: ${calculatedDepartureDate.toISOString()} (${calculatedDepartureDate.toLocaleString('pt-BR')})`);
  console.log(`   return_date: ${calculatedReturnDate.toISOString()} (${calculatedReturnDate.toLocaleString('pt-BR')})`);
  console.log('');

  // Evento como chega no SmartCalendar
  const evento = {
    start: calculatedDepartureDate.toISOString(),
    end: calculatedReturnDate.toISOString(),
    title: 'Missão Teste',
    resource: {
      blocked_until: calculatedReturnDate.toISOString()
    }
  };

  console.log('📊 EVENTO NO SMARTCALENDAR:');
  console.log(`   start: ${evento.start}`);
  console.log(`   end: ${evento.end}`);
  console.log('');

  // Testar filtragem para os dias relevantes
  const diasTeste = [
    { date: new Date('2025-01-27T00:00:00'), nome: 'Dia 27 (partida)' },
    { date: new Date('2025-01-28T00:00:00'), nome: 'Dia 28 (retorno)' }
  ];

  diasTeste.forEach(({ date, nome }) => {
    console.log(`📅 TESTANDO ${nome.toUpperCase()}:`);
    
    const events = [evento];
    
    // Lógica exata do SmartCalendar
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    console.log(`   Período do dia: ${dayStart.toLocaleString('pt-BR')} → ${dayEnd.toLocaleString('pt-BR')}`);
    
    const relevantEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      const finalEnd = event.resource?.blocked_until ? 
        new Date(event.resource.blocked_until) : new Date(event.end);
      
      // Converter para horário brasileiro (subtraindo 3h do UTC)
      const eventStartLocal = new Date(eventStart.getTime() - (3 * 60 * 60 * 1000));
      const eventEndLocal = new Date(finalEnd.getTime() - (3 * 60 * 60 * 1000));
      
      // Verificar se evento afeta este dia
      const eventAffectsDay = (eventStartLocal < dayEnd && eventEndLocal > dayStart);
      
      console.log(`   Evento UTC: ${eventStart.toISOString()} → ${finalEnd.toISOString()}`);
      console.log(`   Evento local: ${eventStartLocal.toLocaleString('pt-BR')} → ${eventEndLocal.toLocaleString('pt-BR')}`);
      console.log(`   Afeta este dia: ${eventAffectsDay}`);
      
      return eventAffectsDay;
    });
    
    console.log(`   Eventos relevantes: ${relevantEvents.length}`);
    
    if (relevantEvents.length > 0) {
      const slotsProblematicos = ['21:00', '22:00', '23:00'];
      
      console.log('   🕘 TESTANDO SLOTS PROBLEMÁTICOS:');
      
      slotsProblematicos.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        
        const slotDateTime = new Date(date);
        if (hours === 0) {
          slotDateTime.setDate(date.getDate() + 1);
          slotDateTime.setHours(0, minutes, 0, 0);
        } else {
          slotDateTime.setHours(hours, minutes, 0, 0);
        }
        
        const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
        
        const conflictingEvent = relevantEvents.find(event => {
          const eventStart = new Date(event.start);
          const finalEnd = event.resource?.blocked_until ? 
            new Date(event.resource.blocked_until) : new Date(event.end);
          
          const eventStartLocal = new Date(eventStart.getTime() - (3 * 60 * 60 * 1000));
          const eventEndLocal = new Date(finalEnd.getTime() - (3 * 60 * 60 * 1000));
          
          const isBlocked = slotDateTime < eventEndLocal && slotEndDateTime > eventStartLocal;
          
          return isBlocked;
        });
        
        const status = conflictingEvent ? 'BLOQUEADO' : 'DISPONÍVEL';
        console.log(`      ${time}: ${slotDateTime.toLocaleString('pt-BR')} - ${status}`);
      });
    }
    
    console.log('');
  });

  console.log('🎯 DIAGNÓSTICO FINAL:');
  console.log('   Se os slots 21h-23h aparecem bloqueados APENAS no dia 27: CORRETO ✅');
  console.log('   Se os slots 21h-23h aparecem bloqueados no dia 28: PROBLEMA ❌');
  console.log('   Se aparecem bloqueados em ambos os dias: PROBLEMA DE LÓGICA ❌');
}

debugProblemaCorreto();