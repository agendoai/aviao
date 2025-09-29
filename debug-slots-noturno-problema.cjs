console.log('🌙 DEBUG: PROBLEMA DOS SLOTS NOTURNOS NO DIA ERRADO');
console.log('=' .repeat(60));

// Simular exatamente o cenário que você descreveu:
// Voo das 21h às 23h no dia, retorno às 5h do dia seguinte
function debugSlotsNoturno() {
  console.log('📋 CENÁRIO PROBLEMÁTICO:');
  console.log('   • Partida: 21:00 do dia 27/01/2025');
  console.log('   • Retorno: 23:00 do dia 27/01/2025');
  console.log('   • Volta para base: 05:00 do dia 28/01/2025');
  console.log('   • PROBLEMA: Slots 21h-23h aparecem no dia 28 em vez do dia 27');
  console.log('');

  // Como o backend calcula as datas
  const userSelectedDeparture = new Date('2025-01-27T21:00:00'); // 21:00 BRT dia 27
  const userSelectedReturn = new Date('2025-01-27T23:00:00');    // 23:00 BRT dia 27
  const flightHours = 2; // 2 horas de voo
  const returnFlightTime = flightHours / 2; // 1 hora de volta

  console.log('🗄️ CÁLCULOS DO BACKEND:');
  console.log(`   Partida escolhida: ${userSelectedDeparture.toLocaleString('pt-BR')}`);
  console.log(`   Retorno escolhido: ${userSelectedReturn.toLocaleString('pt-BR')}`);
  console.log(`   Tempo de voo volta: ${returnFlightTime}h`);
  console.log('');

  // Cálculo do backend (baseado no código em bookings.ts)
  const calculatedDepartureDate = new Date(userSelectedDeparture.getTime() - (3 * 60 * 60 * 1000)); // -3h pré-voo
  const calculatedReturnDate = new Date(userSelectedReturn.getTime() + (returnFlightTime * 60 * 60 * 1000) + (3 * 60 * 60 * 1000)); // +1h volta +3h pós-voo

  console.log('   📐 Datas calculadas pelo backend:');
  console.log(`      departure_date (pré-voo): ${calculatedDepartureDate.toISOString()} (${calculatedDepartureDate.toLocaleString('pt-BR')})`);
  console.log(`      return_date (fim total): ${calculatedReturnDate.toISOString()} (${calculatedReturnDate.toLocaleString('pt-BR')})`);
  console.log(`      actual_departure_date: ${userSelectedDeparture.toISOString()} (${userSelectedDeparture.toLocaleString('pt-BR')})`);
  console.log(`      actual_return_date: ${userSelectedReturn.toISOString()} (${userSelectedReturn.toLocaleString('pt-BR')})`);
  console.log('');

  // Como o SmartCalendar processa isso
  const scheduleEvent = {
    start: new Date(calculatedDepartureDate.toISOString()), // departure_date
    end: new Date(calculatedReturnDate.toISOString()),      // return_date
    resource: {
      blocked_until: calculatedReturnDate.toISOString()
    }
  };

  console.log('📊 EVENTO PROCESSADO PELO SMARTCALENDAR:');
  console.log(`   event.start: ${scheduleEvent.start.toISOString()} (${scheduleEvent.start.toLocaleString('pt-BR')})`);
  console.log(`   event.end: ${scheduleEvent.end.toISOString()} (${scheduleEvent.end.toLocaleString('pt-BR')})`);
  console.log('');

  // Simular a lógica do SmartCalendar para diferentes dias
  const dias = [
    new Date('2025-01-27'), // Dia 27 (dia da partida)
    new Date('2025-01-28')  // Dia 28 (dia seguinte)
  ];

  dias.forEach(date => {
    console.log(`🗓️ ANALISANDO DIA ${date.toLocaleDateString('pt-BR')}:`);
    
    // Lógica atual do SmartCalendar para filtrar eventos relevantes
    const eventStart = new Date(scheduleEvent.start);
    const eventEnd = new Date(scheduleEvent.end);
    
    // Converter UTC para horário local brasileiro (como faz o SmartCalendar)
    const eventStartLocal = new Date(eventStart.getTime() - (3 * 60 * 60 * 1000));
    const eventEndLocal = new Date(eventEnd.getTime() - (3 * 60 * 60 * 1000));
    
    // Verificar se o evento afeta este dia
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    
    const eventAffectsDay = (eventStartLocal < dayEnd && eventEndLocal > dayStart);
    
    console.log(`   Evento start local: ${eventStartLocal.toLocaleString('pt-BR')}`);
    console.log(`   Evento end local: ${eventEndLocal.toLocaleString('pt-BR')}`);
    console.log(`   Dia start: ${dayStart.toLocaleString('pt-BR')}`);
    console.log(`   Dia end: ${dayEnd.toLocaleString('pt-BR')}`);
    console.log(`   Evento afeta este dia: ${eventAffectsDay}`);
    
    if (eventAffectsDay) {
      // Testar slots específicos
      const slotsToTest = ['21:00', '22:00', '23:00'];
      
      slotsToTest.forEach(time => {
        const [hours, minutes] = time.split(':').map(Number);
        
        // Lógica atual do SmartCalendar
        const slotDateTime = new Date(date);
        if (hours === 0) {
          slotDateTime.setDate(date.getDate() + 1);
          slotDateTime.setHours(0, minutes, 0, 0);
        } else {
          slotDateTime.setHours(hours, minutes, 0, 0);
        }
        
        const slotEndDateTime = new Date(slotDateTime.getTime() + (60 * 60 * 1000));
        
        // Verificar se slot está bloqueado
        const isBlocked = slotDateTime < eventEndLocal && slotEndDateTime > eventStartLocal;
        
        console.log(`      Slot ${time}: ${slotDateTime.toLocaleString('pt-BR')} - ${isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'}`);
      });
    }
    
    console.log('');
  });

  console.log('🎯 ANÁLISE DO PROBLEMA:');
  console.log('   1. O evento vai de 18:00 dia 27 até 08:00 dia 28 (horário local)');
  console.log('   2. Isso faz com que AMBOS os dias sejam afetados pelo evento');
  console.log('   3. Os slots 21h-23h do dia 27 ficam bloqueados (correto)');
  console.log('   4. Mas o calendário pode estar mostrando esses slots no dia 28 também');
  console.log('');
  
  console.log('💡 POSSÍVEL SOLUÇÃO:');
  console.log('   • Slots noturnos (21h-23h) devem SEMPRE aparecer no dia da partida');
  console.log('   • Não importa se o evento atravessa a meia-noite');
  console.log('   • A lógica deve priorizar o dia da actual_departure_date para slots noturnos');
}

debugSlotsNoturno();