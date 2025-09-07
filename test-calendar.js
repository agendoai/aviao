const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCalendar() {
  try {
    console.log('🧪 Testando calendário após limpeza...');
    console.log('=' .repeat(50));
    
    // 1. Verificar se está limpo
    console.log('📊 1. Verificando estado atual...');
    const bookingsCount = await prisma.booking.count();
    console.log(`   Missões no sistema: ${bookingsCount}`);
    
    if (bookingsCount > 0) {
      console.log('   ⚠️  Sistema ainda tem missões. Execute limpeza primeiro.');
      return;
    }
    
    console.log('   ✅ Sistema limpo!');
    
    // 2. Criar missão de teste
    console.log('');
    console.log('🛩️  2. Criando missão de teste...');
    
    const testMission = await prisma.booking.create({
      data: {
        userId: 1, // Assumindo que existe um usuário com ID 1
        aircraftId: 1, // Assumindo que existe uma aeronave com ID 1
        origin: 'SBAU',
        destination: 'SBBS',
        departure_date: new Date('2025-08-29T06:00:00.000Z'),
        return_date: new Date('2025-08-29T14:00:00.000Z'),
        passengers: 2,
        flight_hours: 4,
        overnight_stays: 0,
        value: 15000,
        status: 'pendente',
        maintenance_buffer_hours: 3,
        blocked_until: new Date('2025-08-29T19:00:00.000Z') // 14:00 + 2h + 3h
      }
    });
    
    console.log(`   ✅ Missão criada com ID: ${testMission.id}`);
    console.log(`   📅 Partida: 29/08/2025 às 06:00`);
    console.log(`   📅 Retorno: 29/08/2025 às 14:00`);
    console.log(`   ⏰ Bloqueado até: 29/08/2025 às 19:00`);
    
    // 3. Verificar cálculos
    console.log('');
    console.log('🧮 3. Verificando cálculos...');
    
    const departureTime = new Date(testMission.departure_date);
    const returnTime = new Date(testMission.return_date);
    const blockedUntil = new Date(testMission.blocked_until);
    
    console.log(`   • Tempo de voo total: ${testMission.flight_hours}h`);
    console.log(`   • Tempo de voo volta: ${testMission.flight_hours / 2}h`);
    console.log(`   • Preparação: ${departureTime.toLocaleString('pt-BR')} - 3h = ${new Date(departureTime.getTime() - 3 * 60 * 60 * 1000).toLocaleString('pt-BR')}`);
    console.log(`   • Missão: ${departureTime.toLocaleString('pt-BR')} até ${returnTime.toLocaleString('pt-BR')}`);
    console.log(`   • Encerramento: ${returnTime.toLocaleString('pt-BR')} + 2h + 3h = ${blockedUntil.toLocaleString('pt-BR')}`);
    
    // 4. Verificar se bloqueio está correto
    console.log('');
    console.log('✅ 4. Verificando bloqueio...');
    
    const expectedBlockedUntil = new Date(returnTime.getTime() + (2 + 3) * 60 * 60 * 1000);
    const isCorrect = Math.abs(blockedUntil.getTime() - expectedBlockedUntil.getTime()) < 60000; // 1 minuto de tolerância
    
    if (isCorrect) {
      console.log('   ✅ Bloqueio calculado corretamente!');
    } else {
      console.log('   ❌ Erro no cálculo do bloqueio');
      console.log(`   Esperado: ${expectedBlockedUntil.toLocaleString('pt-BR')}`);
      console.log(`   Atual: ${blockedUntil.toLocaleString('pt-BR')}`);
    }
    
    console.log('=' .repeat(50));
    console.log('🎉 Teste concluído!');
    console.log('');
    console.log('📋 Próximos passos:');
    console.log('   1. Acesse o calendário no frontend');
    console.log('   2. Verifique se os slots estão bloqueados corretamente');
    console.log('   3. Tente criar uma missão conflitante');
    console.log('   4. Teste a validação de conflitos');
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
testCalendar();




