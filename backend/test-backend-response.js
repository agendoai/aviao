// Teste para verificar se o backend está respondendo
const http = require('http');

async function testBackendResponse() {
  console.log('🔍 Testando se o backend está respondendo...\n');

  const options = {
    hostname: 'localhost',
    port: 4000,
    path: '/api/bookings/time-slots/2?weekStart=2025-08-18T00:00:00.000Z',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`📊 Headers: ${JSON.stringify(res.headers)}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const slots = JSON.parse(data);
            console.log(`✅ Backend respondendo! Slots recebidos: ${slots.length}`);
            
            // Verificar se há slots de pré-voo
            const preVooSlots = slots.filter(s => s.blockType === 'pre-voo');
            const missaoSlots = slots.filter(s => s.blockType === 'missao');
            const posVooSlots = slots.filter(s => s.blockType === 'pos-voo');
            
            console.log(`\n📋 Slots encontrados:`);
            console.log(`   Pré-voo: ${preVooSlots.length}`);
            console.log(`   Missão: ${missaoSlots.length}`);
            console.log(`   Pós-voo: ${posVooSlots.length}`);
            
            if (preVooSlots.length > 0) {
              console.log(`\n🟡 Slots de pré-voo:`);
              for (const slot of preVooSlots.slice(0, 5)) {
                const time = new Date(slot.start).toLocaleTimeString('pt-BR');
                console.log(`   ${time}: ${slot.reason}`);
              }
            }
            
            resolve(slots);
          } catch (error) {
            console.log('❌ Erro ao parsear resposta:', error.message);
            console.log('📄 Resposta bruta:', data);
            reject(error);
          }
        } else {
          console.log(`❌ Backend retornou status ${res.statusCode}`);
          console.log('📄 Resposta:', data);
          reject(new Error(`Status ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.log('❌ Erro ao conectar com backend:', error.message);
      console.log('💡 Verifique se o backend está rodando na porta 4000');
      reject(error);
    });

    req.end();
  });
}

testBackendResponse()
  .then(() => {
    console.log('\n✅ Backend está funcionando corretamente!');
    console.log('💡 Se o frontend não está mostrando as cores corretas, limpe o cache do navegador');
  })
  .catch((error) => {
    console.log('\n❌ Backend não está respondendo');
    console.log('🚀 Execute: cd backend && npm run dev');
  });
