const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSlotsInDatabase() {
  console.log('🔍 Verificando slots no banco de dados...\n');
  
  try {
    // 1. Verificar slots disponíveis
    console.log('1️⃣ Slots disponíveis (status: available):');
    const availableSlots = await prisma.booking.findMany({
      where: {
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA'
      },
      orderBy: { departure_date: 'asc' }
    });
    
    console.log(`   Total: ${availableSlots.length} slots`);
    
    if (availableSlots.length > 0) {
      console.log('   Primeiros 5 slots:');
      availableSlots.slice(0, 5).forEach(slot => {
        const start = new Date(slot.departure_date);
        const end = new Date(slot.return_date);
        console.log(`   - ${start.toLocaleDateString('pt-BR')} ${start.toLocaleTimeString('pt-BR')} às ${end.toLocaleTimeString('pt-BR')}`);
      });
    }
    
    // 2. Verificar todas as reservas
    console.log('\n2️⃣ Todas as reservas:');
    const allBookings = await prisma.booking.findMany({
      orderBy: { departure_date: 'asc' }
    });
    
    console.log(`   Total: ${allBookings.length} reservas`);
    
    // Agrupar por status
    const byStatus = {};
    allBookings.forEach(booking => {
      byStatus[booking.status] = (byStatus[booking.status] || 0) + 1;
    });
    
    console.log('   Por status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count}`);
    });
    
    // 3. Verificar slots para aeronave específica
    console.log('\n3️⃣ Slots para aeronave ID 2:');
    const aircraft2Slots = await prisma.booking.findMany({
      where: {
        aircraftId: 2,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA'
      },
      orderBy: { departure_date: 'asc' }
    });
    
    console.log(`   Total: ${aircraft2Slots.length} slots`);
    
    if (aircraft2Slots.length > 0) {
      console.log('   Primeiros 3 slots:');
      aircraft2Slots.slice(0, 3).forEach(slot => {
        const start = new Date(slot.departure_date);
        const end = new Date(slot.return_date);
        console.log(`   - ${start.toLocaleDateString('pt-BR')} ${start.toLocaleTimeString('pt-BR')} às ${end.toLocaleTimeString('pt-BR')}`);
      });
    }
    
    // 4. Verificar se há slots para hoje
    console.log('\n4️⃣ Slots para hoje:');
    const today = new Date();
    const todaySlots = await prisma.booking.findMany({
      where: {
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        departure_date: {
          gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
          lt: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)
        }
      }
    });
    
    console.log(`   Total: ${todaySlots.length} slots para hoje`);
    
    if (todaySlots.length === 0) {
      console.log('   ❌ Nenhum slot para hoje encontrado!');
      console.log('   💡 Execute o script test-realistic-schedule.js para criar slots');
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar slots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlotsInDatabase();



