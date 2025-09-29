console.log('🔍 DEBUG REAL - PROBLEMA DO PÓS-VOO NO DIA SEGUINTE');
console.log('=' .repeat(70));

// Vamos simular exatamente o que acontece quando você cria uma missão
function debugMissaoReal() {
  console.log('📋 CENÁRIO: Criando missão que termina às 18:00 BRT');
  console.log('   • Pré-voo: 12:00-15:00 BRT');
  console.log('   • Missão: 15:00-18:00 BRT');
  console.log('   • Pós-voo: 18:00+volta+manutenção até 22:00 BRT');
  console.log('');
  
  // Dados que vêm do backend quando cria a reserva
  const booking = {
    id: 123,
    departure_date: '2025-09-15T15:00:00.000Z', // 12:00 BRT (pré-voo -3h)
    return_date: '2025-09-16T01:00:00.000Z',    // 22:00 BRT (fim total)
    actual_departure_date: '2025-09-15T18:00:00.000Z', // 15:00 BRT (real)
    actual_return_date: '2025-09-15T21:00:00.000Z',    // 18:00 BRT (real)
    blocked_until: '2025-09-16T01:00:00.000Z',         // 22:00 BRT
    flight_hours: 2
  };
  
  console.log('🗄️ DADOS DO BACKEND:');
  console.log(`   departure_date (pré-voo): ${booking.departure_date}`);
  console.log(`   actual_departure_date: ${booking.actual_departure_date}`);
  console.log(`   actual_return_date: ${booking.actual_return_date}`);
  console.log(`   blocked_until: ${booking.blocked_until}`);
  console.log('');
  
  // Como o SmartCalendar processa isso
  const scheduleEvent = {
    id: booking.id.toString(),
    title: `Missão SBAU → SBSP`,
    start: new Date(booking.departure_date), // Pré-voo
    end: new Date(booking.return_date),      // Fim total
    type: 'booking',
    resource: booking
  };
  
  console.log('📅 EVENTO PROCESSADO PELO SMARTCALENDAR:');
  console.log(`   event.start: ${scheduleEvent.start.toISOString()} (${scheduleEvent.start.toLocaleString('pt-BR')})`);
  console.log(`   event.end: ${scheduleEvent.end.toISOString()} (${scheduleEvent.end.toLocaleString('pt-BR')})`);
  console.log(`   event.resource.blocked_until: ${scheduleEvent.resource.blocked_until}`);
  console.log('');
  
  // Simular o que acontece no dia 15/09 e 16/09
  const dia15 = new Date(2025, 8, 15); // 15 de setembro
  const dia16 = new Date(2025, 8, 16); // 16 de setembro
  
  console.log('🔍 VERIFICANDO SLOTS NO DIA 15/09:');
  testSlotsForDay(dia15, scheduleEvent);
  
  console.log('\n🔍 VERIFICANDO SLOTS NO DIA 16/09:');
  testSlotsForDay(dia16, scheduleEvent);
}

function testSlotsForDay(date, event) {
  console.log(`   Data: ${date.toLocaleDateString('pt-BR')}`);
  
  // Verificar se o evento afeta este dia
  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);
  
  const eventStart = new Date(event.start);
  const eventEnd = new Date(event.resource.blocked_until || event.end);
  
  const affectsDay = (eventStart <= dayEnd && eventEnd >= dayStart);
  console.log(`   Evento afeta este dia: ${affectsDay ? 'SIM' : 'NÃO'}`);
  
  if (affectsDay) {
    // Testar slots específicos
    const testSlots = ['19:00', '20:00', '21:00', '22:00'];
    
    testSlots.forEach(time => {
      const [hours, minutes] = time.split(':').map(Number);
      
      // Lógica atual do SmartCalendar
      let slotUTC;
      if (hours < 21) {
        slotUTC = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hours + 3, minutes, 0, 0));
      } else {
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);
        slotUTC = new Date(Date.UTC(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), (hours + 3) % 24, minutes, 0, 0));
      }
      
      const slotEndUTC = new Date(slotUTC.getTime() + (60 * 60 * 1000));
      const eventStartUTC = new Date(event.start);
      const blockedUntilUTC = new Date(event.resource.blocked_until);
      
      const isBlocked = slotUTC < blockedUntilUTC && slotEndUTC > eventStartUTC;
      
      console.log(`     ${time}: ${isBlocked ? 'BLOQUEADO' : 'DISPONÍVEL'} (slotUTC: ${slotUTC.toISOString()})`);
      
      // Verificar se o slot está sendo exibido no dia errado
      const slotDate = new Date(slotUTC.getTime() - (3 * 60 * 60 * 1000)); // Converter de volta para BRT
      const slotDay = slotDate.getDate();
      const expectedDay = date.getDate();
      
      if (slotDay !== expectedDay) {
        console.log(`       ⚠️ PROBLEMA: Slot ${time} do dia ${expectedDay} está sendo calculado para o dia ${slotDay}`);
      }
    });
  }
}

debugMissaoReal();