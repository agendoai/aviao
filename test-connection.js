const fetch = require('node-fetch');

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com o backend...');
    
    // Teste 1: Rota sem autenticação
    const testResponse = await fetch('http://localhost:4000/bookings/test');
    console.log('✅ Rota de teste:', testResponse.status);
    
    // Teste 2: Rota com autenticação (sem token)
    const authResponse = await fetch('http://localhost:4000/bookings');
    console.log('🔒 Rota com auth (sem token):', authResponse.status);
    
    // Teste 3: Rota com token inválido
    const invalidTokenResponse = await fetch('http://localhost:4000/bookings', {
      headers: {
        'Authorization': 'Bearer invalid_token'
      }
    });
    console.log('❌ Rota com token inválido:', invalidTokenResponse.status);
    
  } catch (error) {
    console.error('💥 Erro na conexão:', error.message);
  }
}

testConnection(); 