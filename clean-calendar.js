const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanCalendar() {
  try {
    console.log('🧹 Iniciando limpeza do calendário...');
    
    // Contar missões existentes
    const countBefore = await prisma.booking.count();
    console.log(`📊 Missões encontradas: ${countBefore}`);
    
    if (countBefore === 0) {
      console.log('✅ Nenhuma missão encontrada. Calendário já está limpo!');
      return;
    }
    
    // Deletar todas as missões
    const result = await prisma.booking.deleteMany({});
    
    console.log(`🗑️  Missões deletadas: ${result.count}`);
    console.log('✅ Calendário limpo com sucesso!');
    
    // Verificar se foi limpo
    const countAfter = await prisma.booking.count();
    console.log(`📊 Missões restantes: ${countAfter}`);
    
    if (countAfter === 0) {
      console.log('🎉 Limpeza concluída! O calendário está pronto para testes.');
    } else {
      console.log('⚠️  Ainda existem missões no banco.');
    }
    
  } catch (error) {
    console.error('❌ Erro ao limpar calendário:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o script
cleanCalendar();

