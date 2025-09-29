// Script para fazer login e obter um token válido para debug
const http = require('http');

function makeHttpRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          reject(new Error('Erro ao parsear JSON: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function getToken() {
  console.log('🔑 OBTENDO TOKEN PARA DEBUG');
  console.log('=' .repeat(40));
  
  try {
    // Primeiro, tentar fazer login com credenciais fornecidas
    const loginData = {
      email: 'rauanconceicao15@gmail.com',
      password: '123456'
    };
    
    console.log('📧 Tentando login com:', loginData.email);
    
    const response = await makeHttpRequest('http://localhost:4000/api/auth/login', 'POST', loginData);
    
    if (response.status === 200 && response.data.token) {
      console.log('✅ Login realizado com sucesso!');
      console.log('🔑 Token obtido:', response.data.token);
      console.log('\n📋 COPIE ESTE TOKEN PARA O SCRIPT DEBUG:');
      console.log(`const TEST_TOKEN = '${response.data.token}';`);
      return response.data.token;
    } else {
      console.log('❌ Falha no login:', response.data);
      
      // Se o login falhou, tentar criar um usuário admin de teste
      console.log('\n🔧 Tentando criar usuário admin de teste...');
      
      const registerData = {
        name: 'Admin Teste',
        email: 'admin@teste.com',
        password: '123456',
        cpf: '12345678901',
        phone: '11999999999',
        role: 'admin'
      };
      
      const registerResponse = await makeHttpRequest('http://localhost:4000/api/auth/register', 'POST', registerData);
      
      if (registerResponse.status === 201 && registerResponse.data.token) {
        console.log('✅ Usuário criado e login realizado!');
        console.log('🔑 Token obtido:', registerResponse.data.token);
        console.log('\n📋 COPIE ESTE TOKEN PARA O SCRIPT DEBUG:');
        console.log(`const TEST_TOKEN = '${registerResponse.data.token}';`);
        return registerResponse.data.token;
      } else {
        console.log('❌ Falha ao criar usuário:', registerResponse.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.log('\n💡 Certifique-se de que o backend está rodando na porta 4000');
  }
}

// Executar
getToken();