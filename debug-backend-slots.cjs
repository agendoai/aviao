const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Token válido
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjI0LCJlbWFpbCI6InJhdWFuY29uY2VpY2FvMTVAZ21haWwuY29tIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTkwMTE1NjIsImV4cCI6MTc1OTYxNjM2Mn0.GLk4vzoJjBMf3GVaa8lTl_4l9xaUYPTT5ix45tvNzF4';

async function makeHttpRequest(url, token) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ Erro na requisição para ${url}:`, error.message);
    return null;
  }
}

async function debugBackendSlots() {
  console.log('🔍 DEBUG: Investigando slots do backend');
  console.log('=' .repeat(60));
  
  const aircraftId = 1;
  
  // Testar diferentes formatos de data
  const testDates = [
    '2025-01-27T00:00:00.000Z',
    '2025-01-27T03:00:00.000Z', // UTC-3 (horário de Brasília)
    '2025-01-27',
    new Date('2025-01-27').toISOString(),
    new Date('2025-01-27T00:00:00-03:00').toISOString() // Brasília
  ];
  
  for (const testDate of testDates) {
    console.log(`\n📅 Testando data: ${testDate}`);
    
    const url = `http://localhost:4000/api/bookings/time-slots/${aircraftId}?weekStart=${encodeURIComponent(testDate)}&singleDay=true`;
    console.log(`   URL: ${url}`);
    
    const slots = await makeHttpRequest(url, TOKEN);
    
    if (!slots) {
      console.log('   ❌ Falha na requisição');
      continue;
    }
    
    console.log(`   ✅ Recebidos ${slots.length} slots`);
    
    // Analisar datas dos slots
    const slotDates = {};
    slots.forEach(slot => {
      const slotDate = new Date(slot.start);
      const dateKey = `${slotDate.getFullYear()}-${String(slotDate.getMonth() + 1).padStart(2, '0')}-${String(slotDate.getDate()).padStart(2, '0')}`;
      slotDates[dateKey] = (slotDates[dateKey] || 0) + 1;
    });
    
    console.log('   📊 Distribuição por data:');
    Object.entries(slotDates).forEach(([date, count]) => {
      console.log(`     ${date}: ${count} slots`);
    });
    
    // Verificar se tem slots para 27/01/2025
    const jan27Slots = slots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.getDate() === 27 && slotDate.getMonth() === 0 && slotDate.getFullYear() === 2025;
    });
    
    if (jan27Slots.length > 0) {
      console.log(`   🎯 ENCONTRADOS ${jan27Slots.length} slots para 27/01/2025!`);
      
      // Mostrar alguns exemplos
      console.log('   📋 Primeiros 5 slots:');
      jan27Slots.slice(0, 5).forEach(slot => {
        const startTime = new Date(slot.start);
        console.log(`     ${startTime.toISOString()} - Status: ${slot.status}`);
      });
      
      // Verificar horários disponíveis
      const availableSlots = jan27Slots.filter(slot => slot.status === 'available');
      console.log(`   ✅ Slots disponíveis: ${availableSlots.length}`);
      
      // Verificar se tem slots até 23:30
      const lateSlots = jan27Slots.filter(slot => {
        const hour = new Date(slot.start).getHours();
        return hour >= 22;
      });
      console.log(`   🌙 Slots após 22h: ${lateSlots.length}`);
      
      if (lateSlots.length > 0) {
        console.log('   📋 Slots noturnos:');
        lateSlots.forEach(slot => {
          const startTime = new Date(slot.start);
          console.log(`     ${startTime.getHours()}:${String(startTime.getMinutes()).padStart(2, '0')} - Status: ${slot.status}`);
        });
      }
      
      break; // Encontrou, pode parar
    } else {
      console.log('   ❌ Nenhum slot encontrado para 27/01/2025');
    }
  }
  
  console.log('\n🎯 CONCLUSÃO:');
  console.log('   Se nenhuma data funcionou, pode ser problema de timezone ou configuração do backend');
  console.log('   Se encontrou slots, o problema pode estar na filtragem do frontend');
}

// Executar o debug
debugBackendSlots().catch(console.error);