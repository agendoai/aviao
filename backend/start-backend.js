// Script simples para iniciar o backend
const { exec } = require('child_process');

console.log('🚀 Iniciando backend...');

exec('npm run dev', { cwd: './backend' }, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Erro ao iniciar backend:', error.message);
  } else {
    console.log('✅ Backend iniciado com sucesso');
    console.log(stdout);
  }
});
