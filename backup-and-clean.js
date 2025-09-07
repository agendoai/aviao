const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function backupAndClean() {
  try {
    console.log('🔄 Iniciando backup e limpeza...');
    console.log('=' .repeat(50));
    
    // 1. Fazer backup dos dados
    console.log('💾 1. Fazendo backup dos dados...');
    const backup = {
      timestamp: new Date().toISOString(),
      bookings: await prisma.booking.findMany(),
      transactions: await prisma.transaction.findMany(),
      participationRequests: await prisma.participationRequest.findMany(),
      chatMessages: await prisma.chatMessage.findMany(),
      sharedMissions: await prisma.sharedMission.findMany()
    };
    
    // Salvar backup em arquivo
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }
    
    const backupFile = path.join(backupDir, `backup-${Date.now()}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    
    console.log(`   ✅ Backup salvo em: ${backupFile}`);
    console.log(`   📊 Dados no backup:`);
    console.log(`      • Missões: ${backup.bookings.length}`);
    console.log(`      • Transações: ${backup.transactions.length}`);
    console.log(`      • Solicitações: ${backup.participationRequests.length}`);
    console.log(`      • Mensagens: ${backup.chatMessages.length}`);
    console.log(`      • Missões compartilhadas: ${backup.sharedMissions.length}`);
    
    // 2. Confirmar limpeza
    console.log('');
    console.log('⚠️  ATENÇÃO: Isso irá deletar TODOS os dados!');
    console.log('   Backup foi criado em caso de necessidade de restauração.');
    console.log('');
    
    // 3. Limpar dados
    console.log('🧹 2. Limpando dados...');
    
    await prisma.booking.deleteMany({});
    await prisma.transaction.deleteMany({});
    await prisma.participationRequest.deleteMany({});
    await prisma.chatMessage.deleteMany({});
    await prisma.sharedMission.deleteMany({});
    
    console.log('   ✅ Todos os dados foram deletados');
    
    console.log('=' .repeat(50));
    console.log('🎉 Backup e limpeza concluídos!');
    console.log('');
    console.log('📁 Backup salvo em:', backupFile);
    console.log('✅ Sistema limpo e pronto para testes!');
    console.log('');
    console.log('💡 Para restaurar dados, use o arquivo de backup criado.');
    
  } catch (error) {
    console.error('❌ Erro durante backup/limpeza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
backupAndClean();




