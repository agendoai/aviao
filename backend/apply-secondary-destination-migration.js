const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('🔄 Aplicando migration para campos de destino secundário...');
    
    // Verificar se as colunas já existem
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'SharedMission' 
      AND column_name IN ('secondaryDestination', 'secondary_departure_time')
    `;
    
    console.log('📊 Colunas existentes:', tableInfo);
    
    if (tableInfo.length === 0) {
      console.log('➕ Adicionando colunas secondaryDestination e secondary_departure_time...');
      
      // Adicionar campo secondaryDestination
      await prisma.$executeRaw`
        ALTER TABLE "SharedMission" 
        ADD COLUMN IF NOT EXISTS "secondaryDestination" TEXT
      `;
      
      // Adicionar campo secondary_departure_time  
      await prisma.$executeRaw`
        ALTER TABLE "SharedMission" 
        ADD COLUMN IF NOT EXISTS "secondary_departure_time" TIMESTAMP(3)
      `;
      
      console.log('✅ Colunas adicionadas com sucesso!');
    } else {
      console.log('ℹ️ Colunas já existem, pulando migration...');
    }
    
    // Verificar se a migration foi aplicada
    const finalCheck = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'SharedMission' 
      AND column_name IN ('secondaryDestination', 'secondary_departure_time')
    `;
    
    console.log('🎯 Estado final das colunas:', finalCheck);
    console.log('✨ Migration aplicada com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();