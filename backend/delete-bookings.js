const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllBookings() {
  try {
    console.log('🗑️ Deletando todas as missões...');
    
    const countBefore = await prisma.booking.count();
    console.log(`📊 Missões encontradas: ${countBefore}`);
    
    if (countBefore === 0) {
      console.log('✅ Nenhuma missão para deletar!');
      return;
    }
    
    const result = await prisma.booking.deleteMany({});
    console.log(`✅ ${result.count} missões deletadas!`);
    
    const countAfter = await prisma.booking.count();
    console.log(`📊 Missões restantes: ${countAfter}`);
    
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllBookings();

