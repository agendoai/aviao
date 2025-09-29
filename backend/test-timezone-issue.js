const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPostFlightIssue() {
  try {
    console.log('🔍 Teste específico do problema do pós-voo...');
    console.log('=' .repeat(60));
    
    // Cenário: Missão que termina às 18:00, pós-voo deveria ir até 21:00 do MESMO dia
    
    // 1. Limpar dados
    await prisma.booking.deleteMany({});
    console.log('✅ Dados limpos');
    
    // 2. Criar missão com horários brasileiros
    console.log('\n🛩️ Criando missão:');
    console.log('   • Partida: 15:00 BRT (18:00 UTC)');
    console.log('   • Retorno: 18:00 BRT (21:00 UTC)');
    console.log('   • Flight hours: 2h (1h ida + 1h volta)');
    console.log('   • Pós-voo esperado: 18:00 + 1h + 3h = 22:00 BRT (01:00 UTC do dia seguinte)');
    
    const mission = await prisma.booking.create({
      data: {
        userId: 1,
        aircraftId: 1,
        origin: 'SBAU',
        destination: 'SBSP',
        departure_date: new Date('2025-09-15T18:00:00.000Z'), // 15:00 BRT
        return_date: new Date('2025-09-15T21:00:00.000Z'), // 18:00 BRT
        passengers: 2,
        flight_hours: 2, // 1h ida + 1h volta
        overnight_stays: 0,
        value: 5000,
        status: 'confirmada'
      }
    });
    
    console.log(`\n✅ Missão criada (ID: ${mission.id})`);
    
    // 3. Calcular blocked_until usando EXATAMENTE a mesma lógica do backend
    const returnDateTime = new Date(mission.return_date); // 18:00 BRT (21:00 UTC)
    const returnFlightTime = mission.flight_hours / 2; // 1h (tempo de volta)
    
    // ESTE É O CÁLCULO DO BACKEND (bookings.ts linha 170):
    const blockedUntil = new Date(returnDateTime.getTime() + (returnFlightTime + 3) * 60 * 60 * 1000);
    
    console.log('\n🧮 Cálculo do backend (bookings.ts):');
    console.log(`   • return_date (UTC): ${returnDateTime.toISOString()}`);
    console.log(`   • return_date (BRT): ${returnDateTime.toLocaleString('pt-BR')}`);
    console.log(`   • returnFlightTime: ${returnFlightTime}h`);
    console.log(`   • blocked_until calculado: ${blockedUntil.toISOString()} (UTC)`);
    console.log(`   • blocked_until calculado: ${blockedUntil.toLocaleString('pt-BR')} (BRT)`);
    
    // 4. Atualizar a missão
    await prisma.booking.update({
      where: { id: mission.id },
      data: { blocked_until: blockedUntil }
    });
    
    // 5. Verificar como o schedule.ts está calculando
    console.log('\n🔄 Cálculo do schedule.ts (para comparação):');
    const scheduleReturnTime = new Date(mission.return_date);
    const scheduleTotalFlightDuration = mission.flight_hours || 1;
    const scheduleReturnFlightDuration = scheduleTotalFlightDuration / 2;
    const scheduleReturnFlightDurationMinutes = scheduleReturnFlightDuration * 60;
    const scheduleFlightEnd = new Date(scheduleReturnTime.getTime() + (scheduleReturnFlightDurationMinutes * 60 * 1000));
    const scheduleBlockedUntil = new Date(scheduleFlightEnd.getTime() + (3 * 60 * 60 * 1000));
    
    console.log(`   • flightEnd: ${scheduleFlightEnd.toISOString()} (UTC)`);
    console.log(`   • flightEnd: ${scheduleFlightEnd.toLocaleString('pt-BR')} (BRT)`);
    console.log(`   • blocked_until: ${scheduleBlockedUntil.toISOString()} (UTC)`);
    console.log(`   • blocked_until: ${scheduleBlockedUntil.toLocaleString('pt-BR')} (BRT)`);
    
    // 6. Verificar diferença
    const diff = Math.abs(blockedUntil.getTime() - scheduleBlockedUntil.getTime());
    console.log(`\n⚖️ Diferença entre cálculos: ${diff}ms = ${diff / 1000 / 60}min`);
    
    // 7. Testar slots específicos
    console.log('\n🕐 Testando slots problemáticos:');
    
    const testSlots = [
      { time: '19:00', expected: 'DISPONÍVEL' },
      { time: '20:00', expected: 'DISPONÍVEL' }, 
      { time: '21:00', expected: 'DISPONÍVEL' },
      { time: '22:00', expected: 'BLOQUEADO' }
    ];
    
    for (const slot of testSlots) {
      const [hours, minutes] = slot.time.split(':').map(Number);
      
      // Criar slot em horário brasileiro
      const slotDateBRT = new Date('2025-09-15T00:00:00-03:00');
      slotDateBRT.setHours(hours, minutes, 0, 0);
      
      // Converter para UTC para comparar
      const slotDateUTC = new Date(slotDateBRT.getTime() + (3 * 60 * 60 * 1000));
      
      const isBlocked = slotDateUTC < blockedUntil;
      
      console.log(`   ${slot.time} BRT (${slot.expected}):`);
      console.log(`     Slot UTC: ${slotDateUTC.toISOString()}`);
      console.log(`     Blocked até: ${blockedUntil.toISOString()}`);
      console.log(`     Bloqueado: ${isBlocked ? '❌ SIM' : '✅ NÃO'}`);
      console.log(`     Status: ${isBlocked === (slot.expected === 'BLOQUEADO') ? '✅ CORRETO' : '❌ INCORRETO'}`);
      console.log('');
    }
    
    console.log('🎯 Análise:');
    console.log('   O problema parece estar na conversão de fusos horários.');
    console.log('   O frontend precisa entender que:');
    console.log('   • return_date está em UTC');
    console.log('   • blocked_until está em UTC');
    console.log('   • Mas os slots são criados em horário local');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPostFlightIssue().catch(console.error);