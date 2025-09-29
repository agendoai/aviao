// Debug específico para o problema do dia 27 de janeiro de 2025
// Vamos simular exatamente o que acontece quando o frontend chama a API

const https = require('https');
const http = require('http');

// Token de teste - você pode pegar um token válido do localStorage do navegador
// ou criar um usuário de teste
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI0LCJlbWFpbCI6InJhdWFuY29uY2VpY2FvMTVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTkwMTEwNjMsImV4cCI6MTc1OTYxNTg2M30.4LsI9LA2wbtycU4JxX1KlqOV-a7dtvg5WnoZ1fLGfZo';

// Função auxiliar para fazer requisições HTTP com autenticação
function makeHttpRequest(url, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {}
    };

    // Adicionar token de autenticação se fornecido
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
      options.headers['Content-Type'] = 'application/json';
    }

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error('Erro ao parsear JSON: ' + error.message));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function debugDia27Janeiro() {
  console.log('🔍 DEBUGANDO PROBLEMA DO DIA 27 DE JANEIRO DE 2025');
  console.log('=' .repeat(60));
  
  try {
    // Simular chamada da API para o dia 27 de janeiro de 2025
    const aircraftId = 1; // Assumindo aeronave ID 1
    
    // Data de início da semana que contém 27 de janeiro de 2025
    // 27 de janeiro de 2025 é uma segunda-feira
    const weekStart = new Date('2025-01-27T00:00:00.000Z');
    
    console.log('📅 Data da semana:', weekStart.toISOString());
    console.log('📅 Data local:', weekStart.toLocaleString('pt-BR'));
    
    // Fazer chamada para a API usando módulos nativos
    const url = `http://localhost:4000/api/bookings/time-slots/${aircraftId}?weekStart=${encodeURIComponent(weekStart.toISOString())}&singleDay=false`;
    
    console.log('🌐 URL da chamada:', url);
    
    const response = await makeHttpRequest(url, TEST_TOKEN);
    console.log(`\n📊 Resposta da API:`, JSON.stringify(response, null, 2).substring(0, 500) + '...');
    
    // Verificar se a resposta tem a estrutura esperada
    const timeSlots = Array.isArray(response) ? response : (response.timeSlots || response.data || []);
    console.log(`\n📊 Total de slots recebidos: ${timeSlots.length}`);
    
    if (!Array.isArray(timeSlots)) {
      console.error('❌ Resposta da API não é um array:', typeof timeSlots);
      return;
    }
    
    // Filtrar slots do dia 27 de janeiro
    const slotsDia27 = timeSlots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.getDate() === 27 && 
             slotDate.getMonth() === 0 && // Janeiro = 0
             slotDate.getFullYear() === 2025;
    });
    
    console.log(`\n🎯 Slots do dia 27 de janeiro: ${slotsDia27.length}`);
    
    // Analisar status dos slots
    const statusCount = {};
    slotsDia27.forEach(slot => {
      statusCount[slot.status] = (statusCount[slot.status] || 0) + 1;
    });
    
    console.log('\n📈 Distribuição de status no dia 27:');
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} slots`);
    });
    
    // Mostrar alguns slots específicos para análise
    console.log('\n🔍 Análise detalhada de alguns slots:');
    
    // Slot das 21:00 (que deveria estar disponível)
    const slot21h = slotsDia27.find(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.getHours() === 21 && slotDate.getMinutes() === 0;
    });
    
    if (slot21h) {
      console.log('\n🕘 Slot 21:00:');
      console.log('   Start:', new Date(slot21h.start).toLocaleString('pt-BR'));
      console.log('   End:', new Date(slot21h.end).toLocaleString('pt-BR'));
      console.log('   Status:', slot21h.status);
      console.log('   Reason:', slot21h.reason || 'Nenhuma');
      if (slot21h.booking) {
        console.log('   Booking ID:', slot21h.booking.id);
        console.log('   Booking Status:', slot21h.booking.status);
      }
    }
    
    // Slot das 09:00 (manhã)
    const slot09h = slotsDia27.find(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.getHours() === 9 && slotDate.getMinutes() === 0;
    });
    
    if (slot09h) {
      console.log('\n🕘 Slot 09:00:');
      console.log('   Start:', new Date(slot09h.start).toLocaleString('pt-BR'));
      console.log('   End:', new Date(slot09h.end).toLocaleString('pt-BR'));
      console.log('   Status:', slot09h.status);
      console.log('   Reason:', slot09h.reason || 'Nenhuma');
      if (slot09h.booking) {
        console.log('   Booking ID:', slot09h.booking.id);
        console.log('   Booking Status:', slot09h.booking.status);
      }
    }
    
    // Listar todos os slots bloqueados/conflito no dia 27
    const slotsProblematicos = slotsDia27.filter(slot => 
      slot.status === 'blocked' || slot.status === 'conflict' || slot.status === 'booked'
    );
    
    console.log(`\n❌ Slots problemáticos no dia 27: ${slotsProblematicos.length}`);
    
    if (slotsProblematicos.length > 0) {
      console.log('\n🚫 Detalhes dos slots problemáticos:');
      slotsProblematicos.slice(0, 10).forEach((slot, index) => {
        const slotDate = new Date(slot.start);
        console.log(`   ${index + 1}. ${slotDate.toLocaleTimeString('pt-BR')} - Status: ${slot.status} - Reason: ${slot.reason || 'N/A'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao fazer chamada da API:', error.message);
    
    // Tentar conectar no backend primeiro
    try {
      await makeHttpRequest('http://localhost:4000/health', TEST_TOKEN);
      console.log('✅ Backend está rodando');
    } catch (healthError) {
      console.log('❌ Backend não está rodando. Inicie o backend primeiro com: npm run dev');
      console.log('💡 Ou verifique se a porta 4000 está correta');
      console.log('💡 IMPORTANTE: Você precisa de um token válido. Faça login no frontend e copie o token do localStorage');
    }
  }
}

// Executar debug
debugDia27Janeiro();