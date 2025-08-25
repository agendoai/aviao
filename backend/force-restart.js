// Script para forçar o restart do backend
const { exec } = require('child_process');

console.log('🔄 Forçando restart do backend...\n');

// Matar todos os processos Node.js
console.log('🔪 Matando processos Node.js...');
exec('taskkill /f /im node.exe', (error, stdout, stderr) => {
  if (error) {
    console.log('⚠️ Erro ao matar processos:', error.message);
  } else {
    console.log('✅ Processos Node.js mortos');
  }
  
  // Aguardar 2 segundos
  setTimeout(() => {
    console.log('\n🚀 Iniciando backend...');
    exec('npm run dev', { cwd: './backend' }, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Erro ao iniciar backend:', error.message);
      } else {
        console.log('✅ Backend iniciado com sucesso');
        console.log(stdout);
      }
    });
  }, 2000);
});
