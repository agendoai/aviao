const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🗑️ DELETANDO TODAS AS MISSÕES/RESERVAS');
console.log('=======================================');

async function deleteAllBookings() {
  try {
    console.log('🔍 Buscando todas as reservas...');
    
    // Buscar todas as reservas
    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Encontradas ${bookings.length} reservas para deletar`);

    if (bookings.length === 0) {
      console.log('✅ Nenhuma reserva encontrada para deletar');
      return;
    }

    // Mostrar as reservas que serão deletadas
    console.log('\n📋 Reservas que serão deletadas:');
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. ID: ${booking.id} - ${booking.origin} → ${booking.destination}`);
      console.log(`   📅 ${booking.departure_date.toLocaleString('pt-BR')} → ${booking.return_date.toLocaleString('pt-BR')}`);
      console.log(`   👤 Usuário: ${booking.userId} | Status: ${booking.status}`);
      console.log('');
    });

    // Confirmar deleção
    console.log('⚠️  ATENÇÃO: Isso irá deletar TODAS as reservas permanentemente!');
    console.log('⚠️  Esta ação NÃO pode ser desfeita!');
    
    // Deletar todas as reservas
    const deletedCount = await prisma.booking.deleteMany({});
    
    console.log('\n🎉 DELETADAS TODAS AS RESERVAS!');
    console.log('================================');
    console.log(`✅ Reservas deletadas: ${deletedCount.count}`);
    console.log(`📊 Total processado: ${bookings.length}`);

  } catch (error) {
    console.error('❌ Erro ao deletar reservas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a deleção
deleteAllBookings();

