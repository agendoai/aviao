const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanAllData() {
  try {
    console.log('🧹 Iniciando limpeza completa do banco de dados...');
    
    // Deletar todas as bookings
    console.log('🗑️ Deletando todas as bookings...');
    const deletedBookings = await prisma.booking.deleteMany({});
    console.log(`✅ ${deletedBookings.count} bookings deletadas`);
    
    // Deletar todas as shared missions
    console.log('🗑️ Deletando todas as shared missions...');
    const deletedSharedMissions = await prisma.sharedMission.deleteMany({});
    console.log(`✅ ${deletedSharedMissions.count} shared missions deletadas`);
    
    // Deletar todas as transactions
    console.log('🗑️ Deletando todas as transactions...');
    const deletedTransactions = await prisma.transaction.deleteMany({});
    console.log(`✅ ${deletedTransactions.count} transactions deletadas`);
    
    // Deletar todas as participation requests
    console.log('🗑️ Deletando todas as participation requests...');
    const deletedParticipationRequests = await prisma.participationRequest.deleteMany({});
    console.log(`✅ ${deletedParticipationRequests.count} participation requests deletadas`);
    
    // Deletar todas as chat messages
    console.log('🗑️ Deletando todas as chat messages...');
    const deletedChatMessages = await prisma.chatMessage.deleteMany({});
    console.log(`✅ ${deletedChatMessages.count} chat messages deletadas`);
    
    // Deletar todos os chat rooms
    console.log('🗑️ Deletando todos os chat rooms...');
    const deletedChatRooms = await prisma.chatRoom.deleteMany({});
    console.log(`✅ ${deletedChatRooms.count} chat rooms deletadas`);
    
    console.log('🎉 Limpeza completa finalizada!');
    console.log('📝 Banco de dados limpo e pronto para novos dados.');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAllData();
