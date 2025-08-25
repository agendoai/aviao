const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMissionValidation() {
  console.log('✈️ Testando validação de horários na criação de missões...\n');
  
  try {
    // Teste 1: Horário válido (dentro dos slots disponíveis)
    console.log('1️⃣ Teste 1: Horário válido (10:00 às 11:00)');
    const validStart = new Date();
    validStart.setHours(10, 0, 0, 0);
    const validEnd = new Date();
    validEnd.setHours(11, 0, 0, 0);
    
    const validSlots = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        OR: [
          {
            departure_date: { lte: validStart },
            return_date: { gt: validStart }
          },
          {
            departure_date: { lte: validEnd },
            return_date: { gt: validEnd }
          }
        ]
      }
    });
    
    console.log(`   Slots encontrados: ${validSlots.length}`);
    if (validSlots.length > 0) {
      console.log('   ✅ Horário válido - slots disponíveis encontrados');
    } else {
      console.log('   ❌ Horário inválido - nenhum slot disponível');
    }
    
    // Teste 2: Horário inválido (fora dos slots disponíveis)
    console.log('\n2️⃣ Teste 2: Horário inválido (25:00 - horário inexistente)');
    const invalidStart = new Date();
    invalidStart.setHours(25, 0, 0, 0); // Horário inexistente
    const invalidEnd = new Date();
    invalidEnd.setHours(26, 0, 0, 0);
    
    const invalidSlots = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        OR: [
          {
            departure_date: { lte: invalidStart },
            return_date: { gt: invalidStart }
          },
          {
            departure_date: { lte: invalidEnd },
            return_date: { gt: invalidEnd }
          }
        ]
      }
    });
    
    console.log(`   Slots encontrados: ${invalidSlots.length}`);
    if (invalidSlots.length === 0) {
      console.log('   ✅ Validação funcionando - horário inválido rejeitado');
    } else {
      console.log('   ❌ Erro na validação - horário inválido aceito');
    }
    
    // Teste 3: Verificar slots específicos
    console.log('\n3️⃣ Teste 3: Verificar slots específicos para hoje');
    const today = new Date();
    const todaySlots = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        departure_date: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      },
      orderBy: { departure_date: 'asc' }
    });
    
    console.log(`   Total de slots para hoje: ${todaySlots.length}`);
    console.log('   Primeiros 5 slots:');
    todaySlots.slice(0, 5).forEach((slot, index) => {
      const start = new Date(slot.departure_date);
      const end = new Date(slot.return_date);
      console.log(`   ${index + 1}. ${start.toLocaleTimeString('pt-BR')} às ${end.toLocaleTimeString('pt-BR')}`);
    });
    
    console.log('\n✅ Teste de validação concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMissionValidation();


