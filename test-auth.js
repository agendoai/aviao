const fetch = require('node-fetch');

async function testAuth() {
  try {
    console.log('🔍 Testando autenticação...');
    
    // 1. Testar login
    console.log('\n1️⃣ Testando login...');
    const loginResponse = await fetch('http://localhost:4000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@test.com',
        password: 'admin123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('📡 Login status:', loginResponse.status);
    console.log('📡 Login data:', loginData);
    
    if (!loginResponse.ok) {
      console.log('❌ Login falhou');
      return;
    }
    
    const token = loginData.token;
    console.log('🔑 Token recebido:', token ? 'Sim' : 'Não');
    
    // 2. Testar rota protegida
    console.log('\n2️⃣ Testando rota protegida...');
    const bookingsResponse = await fetch('http://localhost:4000/bookings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Bookings status:', bookingsResponse.status);
    
    if (bookingsResponse.ok) {
      const bookingsData = await bookingsResponse.json();
      console.log('✅ Bookings carregados:', bookingsData.length);
    } else {
      const errorData = await bookingsResponse.json();
      console.log('❌ Erro ao carregar bookings:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Erro no teste:', error.message);
  }
}

testAuth(); 