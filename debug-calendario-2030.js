console.log('🎯 DEBUG ESPECÍFICO: Por que calendário para em 20:30?');
console.log('=' .repeat(60));

function debugCalendario2030() {
  console.log('📋 INVESTIGAÇÃO COMPLETA:');
  console.log('   Usuário relata: calendário só vê até 20:30');
  console.log('   Mesmo tendo TIME_SLOTS até 23:00, sistema não enxerga');
  console.log('');
  
  // Simular uma reserva que deveria terminar depois de 20:30
  const reservaExemplo = {
    id: 'teste',
    start: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT (início)
    end: new Date('2025-09-16T01:30:00.000Z'),   // 22:30 BRT (fim)
    resource: {
      blocked_until: '2025-09-16T01:30:00.000Z', // 22:30 BRT
      status: 'confirmada'
    }
  };
  
  console.log('🧪 TESTE COM RESERVA ATÉ 22:30:');
  console.log(`   Início: ${reservaExemplo.start.toLocaleString('pt-BR')}`);
  console.log(`   Fim: ${new Date(reservaExemplo.resource.blocked_until).toLocaleString('pt-BR')}`);
  console.log('');
  
  const dia15 = new Date(2025, 8, 15);
  
  // 1. Testar generateAvailableDates
  console.log('🔍 TESTE 1: generateAvailableDates');
  
  function testarGenerateAvailableDates(date, scheduleEvents) {
    const dayEvents = scheduleEvents.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.resource?.blocked_until || event.end);
      
      // Lógica atual corrigida
      const dayStartUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0));
      const dayEndUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1, 3, 0, 0, 0));
      
      return (eventStart < dayEndUTC && eventEnd > dayStartUTC);
    });
    
    // Disponibilidade: menos de 5 eventos = disponível
    const isAvailable = dayEvents.length < 5;
    
    console.log(`   Data: ${date.toLocaleDateString('pt-BR')}`);
    console.log(`   Eventos detectados: ${dayEvents.length}`);
    console.log(`   Dia disponível: ${isAvailable ? 'SIM ✅' : 'NÃO ❌'}`);
    
    return isAvailable;
  }
  
  const disponivel = testarGenerateAvailableDates(dia15, [reservaExemplo]);
  
  // 2. Testar getAvailableTimeSlots
  console.log('\n🔍 TESTE 2: getAvailableTimeSlots');
  
  function testarGetAvailableTimeSlots(date, events) {
    const TIME_SLOTS = [
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
      '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
      '21:00', '22:00', '23:00', '00:00'
    ];
    
    // Simular relevantEvents
    const relevantEvents = events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.resource?.blocked_until || event.end);
      
      const dayStartUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 3, 0, 0, 0));
      const dayEndUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate() + 1, 3, 0, 0, 0));
      
      return (eventStart < dayEndUTC && eventEnd > dayStartUTC);
    });
    
    console.log(`   Eventos relevantes: ${relevantEvents.length}`);
    
    const slotsProblematicos = ['20:00', '20:30', '21:00', '21:30', '22:00', '22:30', '23:00'];
    
    slotsProblematicos.forEach(time => {
      const conflictingEvent = relevantEvents.find(event => {
        if (event.resource?.status === 'available') return false;
        
        const [hours, minutes] = time.split(':').map(Number);
        
        // UTC conversion
        let slotUTC;
        if (hours === 0) {
          const nextDay = new Date(date);
          nextDay.setDate(date.getDate() + 1);
          slotUTC = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 3, minutes, 0, 0));
        } else {
          let utcHour = hours + 3;
          if (utcHour >= 24) {
            const nextDay = new Date(date);
            nextDay.setDate(date.getDate() + 1);
            slotUTC = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), utcHour - 24, minutes, 0, 0));
          } else {
            slotUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), utcHour, minutes, 0, 0));
          }
        }
        
        const slotEndUTC = new Date(slotUTC.getTime() + (60 * 60 * 1000));
        const eventStartUTC = new Date(event.start);
        const blockedUntilUTC = new Date(event.resource?.blocked_until || event.end);
        
        return slotUTC < blockedUntilUTC && slotEndUTC > eventStartUTC;
      });
      
      const isAvailable = !conflictingEvent;
      console.log(`     Slot ${time}: ${isAvailable ? 'DISPONÍVEL' : 'BLOQUEADO'}`);
    });
  }
  
  testarGetAvailableTimeSlots(dia15, [reservaExemplo]);
  
  // 3. Verificar se é problema de renderização
  console.log('\n🔍 TESTE 3: Verificação de renderização');
  
  const agora = new Date();
  agora.setHours(20, 35, 0, 0); // Simular que são 20:35
  
  console.log(`   Hora atual simulada: ${agora.toLocaleTimeString('pt-BR')}`);
  
  // Testar lógica isToday
  const isToday = dia15.toDateString() === agora.toDateString();
  console.log(`   É hoje: ${isToday}`);
  
  if (isToday) {
    console.log('   Testando lógica isToday:');
    const slotsNoturnos = ['21:00', '22:00', '23:00'];
    
    slotsNoturnos.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const timeSlot = new Date(agora);
      timeSlot.setHours(hours, minutes, 0, 0);
      
      const isTimeInPast = timeSlot <= agora;
      console.log(`     ${time}: ${isTimeInPast ? 'PASSADO ❌' : 'FUTURO ✅'}`);
    });
  }
  
  console.log('\n💡 POSSÍVEIS CAUSAS:');
  console.log('1. Lógica isToday bloqueando slots futuros incorretamente');
  console.log('2. Problema na conversão UTC para horários noturnos');
  console.log('3. Conflito entre generateAvailableDates e getAvailableTimeSlots');
  console.log('4. Problema na renderização dos slots após 20:30');
  console.log('5. Validação adicional limitando horários tardios');
}

debugCalendario2030();