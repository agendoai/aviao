// Script para restartar o backend e testar a API
const { exec } = require('child_process');

console.log('🔄 Restartando backend e testando API...\n');

// Matar processos Node.js
console.log('🔪 Matando processos Node.js...');
exec('taskkill /f /im node.exe', (error, stdout, stderr) => {
  if (error) {
    console.log('⚠️ Erro ao matar processos:', error.message);
  } else {
    console.log('✅ Processos Node.js mortos');
  }
  
  // Aguardar 3 segundos
  setTimeout(() => {
    console.log('\n🚀 Iniciando backend...');
    exec('npm run dev', { cwd: './backend' }, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Erro ao iniciar backend:', error.message);
      } else {
        console.log('✅ Backend iniciado com sucesso');
        console.log(stdout);
        
        // Aguardar 5 segundos e testar a API
        setTimeout(() => {
          console.log('\n🔍 Testando API...');
          exec('node test-api-direct.js', { cwd: './backend' }, (error, stdout, stderr) => {
            if (error) {
              console.log('❌ Erro ao testar API:', error.message);
            } else {
              console.log('✅ API testada com sucesso');
              console.log(stdout);
              console.log('\n💡 Agora limpe o cache do navegador e teste novamente!');
            }
          });
        }, 5000);
      }
    });
  }, 3000);
});
