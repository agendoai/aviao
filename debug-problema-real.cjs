console.log('🔍 DEBUG: PROBLEMA REAL DOS SLOTS NOTURNOS');
console.log('=' .repeat(70));

// Simular exatamente como o SmartCalendar filtra eventos por dia
function debugProblemaReal() {
  console.log('📋 CENÁRIO DE TESTE (CORRIGIDO):');
  console.log('   • Missão: 21:00-23:00 do dia 27/01, volta 05:00 do dia 28/01');
  console.log('   • Problema relatado: Slots 21h-23h aparecem no dia 28 em vez do dia 27');
  console.log('');

  // Evento como vem do backend (baseado no debug anterior)
  const evento = {
    start: '2025-01-27T21:00:00.000Z', // 18:00 BRT dia 27 (departure_date com -3h)
    end: '2025-01-28T06:00:00.000Z',   // 03:00 BRT dia 28 (return_date com +4h total)
    title: 'Missão Teste',
    resource: {
      blocked_until: '2025-01-28T06:00:00.000Z'
    }
  };

  console.log('🗄️ EVENTO DO BACKEND:');
  console.log(`   start: ${evento.start} (${new Date(evento.start).toLocaleString('pt-BR')})`);
  console.log(`   end: ${evento.end} (${new Date(evento.end).toLocaleString('pt-BR')})`);
  console.log('');

  // Testar filtragem para diferentes dias (CORRIGIDO)
  const diasTeste = [
    { data: new Date('2025-01-26'), nome: 'Dia 26 (anterior)' },
    { data: new Date('2025-01-27'), nome: 'Dia 27 (partida)' },
    { data: new Date('2025-01-28'), nome: 'Dia 28 (retorno)' },
    { data: new Date('2025-01-29'), nome: 'Dia 29 (posterior)' }
  ];

  diasTeste.forEach(({ data: date, nome }) => {
    console.log(`📅 TESTANDO ${nome.toUpperCase()}:`);
    
    const events = [evento]; // Lista com apenas nosso evento de teste
    
    // Lógica exata do SmartCalendar para filtrar eventos relevantes
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    console.log(`   Período do dia: ${dayStart.toLocaleString('pt-BR')} → ${dayEnd.toLocaleString('pt-BR')}`);
    
    const relevantEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      const finalEnd = event.resource?.blocked_until ? 
        new Date(event.resource.blocked_until) : new Date(event.end);
      
      // Converter para horário brasileiro (como faz o SmartCalendar)
      const eventStartLocal = new Date(eventStart.getTime() - (3 * 60 * 60 * 1000));
      const eventEndLocal = new Date(finalEnd.getTime() - (3 * 60 * 60 * 1000));
      
      // Verificar se evento afeta este dia
      const eventAffectsDay = (eventStartLocal < dayEnd && eventEndLocal > dayStart);
      
      console.log(`   Evento local: ${eventStartLocal.toLocaleString('pt-BR')} → ${eventEndLocal.toLocaleString('pt-BR')}`);
      console.log(`   Afeta este dia: ${eventAffectsDay}`);
      
      return eventAffectsDay;
    });
    
    console.log(`   Eventos relevantes: ${relevantEvents.length}`);
    
    if (relevantEvents.length > 0) {
      // Testar slots específicos que são problemáticos
      const slotsProblematicos = ['21:00', '22:00', '23:00'];
      
      console.log('   🕘 TESTANDO SLOTS PROBLEMÁTICOS:');
      
      slotsProblematicos.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        
        // Lógica exata do SmartCalendar para criar slotDateTime
        const slotDateTime = new Date(date);
        if (hours === 0) {
          slotDateTime.setDate(date.getDate() + 1);
          slotDateTime.setHours(0, minutes, 0, 0);
        } else {
          slotDateTime.setHours(hours, minutes, 0, 0);
        }
        
        const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
        
        // Verificar conflito com cada evento relevante
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

  console.log('🎯 ANÁLISE DETALHADA:');
  console.log('   O evento vai de 15:00 dia 27 até 00:00 dia 28 (horário local)');
  console.log('   Isso significa que:');
  console.log('   • Dia 27: evento afeta das 15:00 às 23:59 - slots 21h-23h BLOQUEADOS ✅');
  console.log('   • Dia 28: evento afeta das 00:00 às 00:00 - nenhum slot afetado ✅');
  console.log('');
  
  console.log('🤔 SE O PROBLEMA PERSISTE, PODE SER:');
  console.log('   1. Interface mostrando dados incorretos');
  console.log('   2. Timezone sendo aplicado incorretamente');
  console.log('   3. Eventos sendo duplicados entre dias');
  console.log('   4. Cache ou estado desatualizado no frontend');
}

debugProblemaReal();