const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanAllMissionsAndSlots() {
  try {
    console.log('🧹 Iniciando limpeza de todas as missões e slots...');
    
    // 1. Limpar mensagens do chat
    console.log('🗑️ Limpando mensagens do chat...');
    await prisma.chatMessage.deleteMany();
    
    // 2. Limpar pedidos de participação
    console.log('🗑️ Limpando pedidos de participação...');
    await prisma.participationRequest.deleteMany();
    
    // 3. Limpar reservas de missões compartilhadas
    console.log('🗑️ Limpando reservas de missões compartilhadas...');
    await prisma.sharedMissionBooking.deleteMany();
    
    // 4. Limpar missões compartilhadas
    console.log('🗑️ Limpando missões compartilhadas...');
    await prisma.sharedMission.deleteMany();
    
    // 5. Limpar transações
    console.log('🗑️ Limpando transações...');
    await prisma.transaction.deleteMany();
    
    // 6. Limpar slots de agenda da aeronave
    console.log('🗑️ Limpando slots de agenda...');
    await prisma.aircraftSchedule.deleteMany();
    
    // 7. Limpar reservas individuais
    console.log('🗑️ Limpando reservas individuais...');
    await prisma.booking.deleteMany();
    
    console.log('✅ Limpeza concluída com sucesso!');
    console.log('🎯 Todas as missões, reservas e slots foram removidos do banco.');
    
    // Verificar se tudo foi limpo
    const counts = await Promise.all([
      prisma.chatMessage.count(),
      prisma.participationRequest.count(),
      prisma.sharedMissionBooking.count(),
      prisma.sharedMission.count(),
      prisma.transaction.count(),
      prisma.aircraftSchedule.count(),
      prisma.booking.count()
    ]);
    
    console.log('\n📊 Contagem de registros após limpeza:');
    console.log(`ChatMessage: ${counts[0]}`);
    console.log(`ParticipationRequest: ${counts[1]}`);
    console.log(`SharedMissionBooking: ${counts[2]}`);
    console.log(`SharedMission: ${counts[3]}`);
    console.log(`Transaction: ${counts[4]}`);
    console.log(`AircraftSchedule: ${counts[5]}`);
    console.log(`Booking: ${counts[6]}`);
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a limpeza
cleanAllMissionsAndSlots();









