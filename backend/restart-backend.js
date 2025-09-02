// Script para reiniciar o backend e verificar se está funcionando
const { exec } = require('child_process');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restartBackend() {
  console.log('🔄 Reiniciando o backend...\n');

  try {
    // Verificar se há processos rodando na porta 4000
    console.log('🔍 Verificando processos na porta 4000...');
    
    exec('netstat -ano | findstr :4000', (error, stdout, stderr) => {
      if (stdout) {
        console.log('📊 Processos encontrados na porta 4000:');
        console.log(stdout);
        
        // Matar processos na porta 4000
        console.log('\n🔄 Matando processos na porta 4000...');
        exec('for /f "tokens=5" %a in (\'netstat -aon ^| findstr :4000\') do taskkill /f /pid %a', (error, stdout, stderr) => {
          if (error) {
            console.log('❌ Erro ao matar processos:', error.message);
          } else {
            console.log('✅ Processos mortos com sucesso');
          }
          
          // Iniciar o backend
          console.log('\n🚀 Iniciando o backend...');
          exec('npm run dev', { cwd: './backend' }, (error, stdout, stderr) => {
            if (error) {
              console.log('❌ Erro ao iniciar backend:', error.message);
            } else {
              console.log('✅ Backend iniciado com sucesso');
              console.log(stdout);
            }
          });
        });
      } else {
        console.log('✅ Nenhum processo encontrado na porta 4000');
        
        // Iniciar o backend
        console.log('\n🚀 Iniciando o backend...');
        exec('npm run dev', { cwd: './backend' }, (error, stdout, stderr) => {
          if (error) {
            console.log('❌ Erro ao iniciar backend:', error.message);
          } else {
            console.log('✅ Backend iniciado com sucesso');
            console.log(stdout);
          }
        });
      }
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restartBackend().catch(console.error);

