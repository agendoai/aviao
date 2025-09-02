// Verificar se o backend está rodando e respondendo
const http = require('http');

function checkBackendStatus() {
  console.log('🔍 Verificando se o backend está rodando...\n');

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`📊 Status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('✅ Backend está rodando!');
      console.log('💡 O problema pode ser:');
      console.log('   1. Frontend não está conectando');
      console.log('   2. Cache do navegador');
      console.log('   3. Token de autenticação');
    } else {
      console.log('⚠️ Backend respondeu mas com status diferente');
    }
  });

  req.on('error', (error) => {
    console.log('❌ Backend não está rodando!');
    console.log('🚀 Execute: cd backend && npm run dev');
  });

  req.on('timeout', () => {
    console.log('⏰ Timeout - Backend não respondeu');
    console.log('🚀 Execute: cd backend && npm run dev');
  });

  req.end();
}

checkBackendStatus();

