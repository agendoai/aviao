const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPosVooFix() {
  try {
    console.log('🧪 Testando correção do pós-voo...');
    console.log('=' .repeat(50));
    
    // 1. Limpar dados existentes
    console.log('🧹 Limpando dados...');
    await prisma.booking.deleteMany({});
    
    // 2. Criar uma missão que termina às 20:30 (horário brasileiro)
    console.log('✈️ Criando missão que termina às 20:30...');
    
    const mission = await prisma.booking.create({
      data: {
        userId: 1,
        aircraftId: 1,
        origin: 'SBAU',
        destination: 'SBSP',
        departure_date: new Date('2025-09-15T10:00:00.000Z'), // 07:00 BRT
        return_date: new Date('2025-09-15T23:30:00.000Z'), // 20:30 BRT  
        passengers: 2,
        flight_hours: 4, // 2h ida + 2h volta
        overnight_stays: 0,
        value: 8000,
        status: 'confirmada'
      }
    });
    
    console.log(`✅ Missão criada com ID: ${mission.id}`);
    console.log(`📅 Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
    console.log(`📅 Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
    
    // 3. Calcular blocked_until usando a lógica corrigida
    const returnTime = new Date(mission.return_date);
    const totalFlightDuration = mission.flight_hours; // 4h total
    const returnFlightDuration = totalFlightDuration / 2; // 2h volta
    
    // Converter para minutos para maior precisão
    const returnFlightDurationMinutes = returnFlightDuration * 60; // 120 min
    const flightEnd = new Date(returnTime.getTime() + (returnFlightDurationMinutes * 60 * 1000)); // 20:30 + 2h = 22:30
    const blockedUntil = new Date(flightEnd.getTime() + (3 * 60 * 60 * 1000)); // 22:30 + 3h = 01:30 (próximo dia)
    
    // Apenas zerar minutos para horário mais limpo, SEM forçar próxima hora
    blockedUntil.setMinutes(0, 0, 0); // 01:00 do próximo dia
    
    console.log('');
    console.log('🧮 Cálculos do pós-voo:');
    console.log(`   • Retorno: ${returnTime.toLocaleString('pt-BR')}`);
    console.log(`   • Fim do voo de volta: ${flightEnd.toLocaleString('pt-BR')}`);
    console.log(`   • Blocked until (antes da correção): ${blockedUntil.toLocaleString('pt-BR')}`);
    
    // 4. Atualizar o booking com blocked_until
    await prisma.booking.update({
      where: { id: mission.id },
      data: { blocked_until: blockedUntil }
    });
    
    console.log('');
    console.log('✅ Blocked until salvo no banco!');
    
    // 5. Testar slots que deveriam estar disponíveis no mesmo dia
    console.log('');
    console.log('🕐 Testando disponibilidade de slots no mesmo dia (15/09):');
    
    const testSlots = ['21:00', '22:00', '23:00'];
    
    for (const slot of testSlots) {
      const [hours, minutes] = slot.split(':').map(Number);
      // Criar data em horário brasileiro (UTC-3)
      const slotDateTime = new Date('2025-09-15T00:00:00-03:00');
      slotDateTime.setHours(hours, minutes, 0, 0);
      
      const isBlocked = slotDateTime < blockedUntil && slotDateTime >= new Date(mission.departure_date);
      
      console.log(`   ${slot}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
      console.log(`     slotDateTime: ${slotDateTime.toLocaleString('pt-BR')} (UTC: ${slotDateTime.toISOString()})`);
      console.log(`     blockedUntil: ${blockedUntil.toLocaleString('pt-BR')} (UTC: ${blockedUntil.toISOString()})`);
      console.log(`     slotDateTime < blockedUntil: ${slotDateTime < blockedUntil}`);
    }
    
    // 6. Testar slots do próximo dia
    console.log('');
    console.log('🕐 Testando disponibilidade de slots no próximo dia (16/09):');
    
    const nextDaySlots = ['00:00', '01:00', '02:00'];
    
    for (const slot of nextDaySlots) {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotDateTime = new Date('2025-09-16T00:00:00Z');
      slotDateTime.setUTCHours(hours, minutes, 0, 0);
      
      const isBlocked = slotDateTime < blockedUntil;
      
      console.log(`   ${slot}: ${isBlocked ? '❌ BLOQUEADO' : '✅ DISPONÍVEL'}`);
      console.log(`     slotDateTime: ${slotDateTime.toLocaleString('pt-BR')}`);
      console.log(`     blockedUntil: ${blockedUntil.toLocaleString('pt-BR')}`);
    }
    
    console.log('');
    console.log('🎯 Conclusão:');
    console.log('   • Slots 21:00, 22:00, 23:00 do dia 15/09 devem estar DISPONÍVEIS');
    console.log('   • Apenas slots do dia 16/09 até 01:00 devem estar bloqueados');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPosVooFix().catch(console.error);