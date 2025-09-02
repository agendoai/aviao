import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAllData() {
  try {
    console.log('🧹 Iniciando limpeza completa do sistema...');
    console.log('='.repeat(50));
    
    // 1. Limpar missões (bookings)
    console.log('📋 1. Limpando missões...');
    const bookingsCount = await prisma.booking.count();
    if (bookingsCount > 0) {
      const bookingsResult = await prisma.booking.deleteMany({});
      console.log(`   ✅ ${bookingsResult.count} missões deletadas`);
    } else {
      console.log('   ✅ Nenhuma missão encontrada');
    }
    
    // 2. Limpar transações
    console.log('💰 2. Limpando transações...');
    const transactionsCount = await prisma.transaction.count();
    if (transactionsCount > 0) {
      const transactionsResult = await prisma.transaction.deleteMany({});
      console.log(`   ✅ ${transactionsResult.count} transações deletadas`);
    } else {
      console.log('   ✅ Nenhuma transação encontrada');
    }
    
    // 3. Limpar solicitações de participação
    console.log('👥 3. Limpando solicitações de participação...');
    const participationCount = await prisma.participationRequest.count();
    if (participationCount > 0) {
      const participationResult = await prisma.participationRequest.deleteMany({});
      console.log(`   ✅ ${participationResult.count} solicitações deletadas`);
    } else {
      console.log('   ✅ Nenhuma solicitação encontrada');
    }
    
    // 4. Limpar mensagens do chat
    console.log('💬 4. Limpando mensagens do chat...');
    const chatCount = await prisma.chatMessage.count();
    if (chatCount > 0) {
      const chatResult = await prisma.chatMessage.deleteMany({});
      console.log(`   ✅ ${chatResult.count} mensagens deletadas`);
    } else {
      console.log('   ✅ Nenhuma mensagem encontrada');
    }
    
    // 5. Limpar missões compartilhadas
    console.log('🛩️  5. Limpando missões compartilhadas...');
    const sharedCount = await prisma.sharedMission.count();
    if (sharedCount > 0) {
      const sharedResult = await prisma.sharedMission.deleteMany({});
      console.log(`   ✅ ${sharedResult.count} missões compartilhadas deletadas`);
    } else {
      console.log('   ✅ Nenhuma missão compartilhada encontrada');
    }
    
    console.log('='.repeat(50));
    console.log('🎉 Limpeza completa concluída!');
    console.log('');
    console.log('📊 Resumo da limpeza:');
    console.log(`   • Missões: ${bookingsCount} → 0`);
    console.log(`   • Transações: ${transactionsCount} → 0`);
    console.log(`   • Solicitações: ${participationCount} → 0`);
    console.log(`   • Mensagens: ${chatCount} → 0`);
    console.log(`   • Missões compartilhadas: ${sharedCount} → 0`);
    console.log('');
    console.log('✅ Sistema limpo e pronto para testes!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
cleanAllData();

