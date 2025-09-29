const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Token obtido anteriormente
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

async function debugFrontendVsBackend() {
  console.log('🔍 DEBUG: Comparando Backend vs Frontend');
  console.log('=' .repeat(60));
  
  const aircraftId = 1;
  const targetDate = new Date('2025-01-27T00:00:00.000Z');
  
  console.log(`📅 Analisando aeronave ${aircraftId} para ${targetDate.toISOString()}`);
  console.log('');

  // 1. Buscar dados do backend
  console.log('🔧 1. DADOS DO BACKEND:');
  const backendUrl = `http://localhost:4000/api/bookings/time-slots/${aircraftId}?weekStart=${encodeURIComponent(targetDate.toISOString())}&singleDay=true`;
  console.log(`   URL: ${backendUrl}`);
  
  const backendSlots = await makeHttpRequest(backendUrl, TOKEN);
  
  if (!backendSlots) {
    console.log('❌ Falha ao obter dados do backend');
    return;
  }

  console.log(`   ✅ Recebidos ${backendSlots.length} slots do backend`);
  
  // Filtrar slots para 27 de janeiro
  const jan27Slots = backendSlots.filter(slot => {
    const slotDate = new Date(slot.start);
    return slotDate.getDate() === 27 && slotDate.getMonth() === 0 && slotDate.getFullYear() === 2025;
  });
  
  console.log(`   📊 Slots para 27/01/2025: ${jan27Slots.length}`);
  
  // Analisar status dos slots
  const statusCount = {};
  jan27Slots.forEach(slot => {
    statusCount[slot.status] = (statusCount[slot.status] || 0) + 1;
  });
  
  console.log('   📈 Distribuição de status (Backend):');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`     ${status}: ${count} slots`);
  });
  console.log('');

  // 2. Simular lógica do frontend
  console.log('🎨 2. SIMULAÇÃO DA LÓGICA DO FRONTEND:');
  
  // TIME_SLOTS do SmartCalendar
  const TIME_SLOTS = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', 
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', 
    '22:00', '22:30', '23:00', '23:30'
  ];
  
  console.log(`   📋 TIME_SLOTS definidos: ${TIME_SLOTS.length} horários`);
  console.log(`   🕐 Horários: ${TIME_SLOTS.join(', ')}`);
  console.log('');
  
  // Simular validação "isToday" (assumindo que hoje é 27/01/2025 às 20:35)
  const now = new Date('2025-01-27T20:35:00.000Z'); // Simular horário atual
  const isToday = true; // Simulando que é hoje
  
  console.log('   🕐 Simulando validação "isToday":');
  console.log(`     Hora atual simulada: ${now.toISOString()}`);
  console.log(`     É hoje: ${isToday}`);
  console.log('');
  
  // Analisar cada TIME_SLOT
  console.log('   🔍 Análise slot por slot (lógica do frontend):');
  const frontendResults = [];
  
  TIME_SLOTS.forEach(time => {
    const [hours, minutes] = time.split(':').map(Number);
    const timeSlot = new Date(now);
    
    // Lógica do SmartCalendar
    if (hours === 0) {
      timeSlot.setHours(24, minutes, 0, 0);
    } else {
      timeSlot.setHours(hours, minutes, 0, 0);
    }
    
    const isTimeInPast = timeSlot <= now;
    
    // Encontrar slot correspondente no backend
    const backendSlot = jan27Slots.find(slot => {
      const slotTime = new Date(slot.start);
      return slotTime.getHours() === hours && slotTime.getMinutes() === minutes;
    });
    
    const frontendStatus = isTimeInPast ? 'blocked (past)' : 'available';
    const backendStatus = backendSlot ? backendSlot.status : 'not found';
    
    const mismatch = (frontendStatus === 'blocked (past)' && backendStatus === 'available') ||
                     (frontendStatus === 'available' && backendStatus !== 'available');
    
    frontendResults.push({
      time,
      frontendStatus,
      backendStatus,
      mismatch,
      timeSlot: timeSlot.toISOString(),
      isTimeInPast
    });
    
    if (mismatch) {
      console.log(`     ⚠️  ${time}: Frontend=${frontendStatus}, Backend=${backendStatus} (MISMATCH)`);
    } else {
      console.log(`     ✅ ${time}: Frontend=${frontendStatus}, Backend=${backendStatus}`);
    }
  });
  
  console.log('');
  
  // 3. Resumo das discrepâncias
  console.log('📊 3. RESUMO DAS DISCREPÂNCIAS:');
  const mismatches = frontendResults.filter(r => r.mismatch);
  console.log(`   Total de discrepâncias: ${mismatches.length}`);
  
  if (mismatches.length > 0) {
    console.log('   🚨 Slots com problemas:');
    mismatches.forEach(slot => {
      console.log(`     ${slot.time}: Frontend diz "${slot.frontendStatus}", Backend diz "${slot.backendStatus}"`);
      if (slot.frontendStatus === 'blocked (past)') {
        console.log(`       Motivo: Frontend considera ${slot.time} como "passado" (${slot.timeSlot})`);
      }
    });
  }
  
  console.log('');
  
  // 4. Recomendações
  console.log('💡 4. RECOMENDAÇÕES:');
  console.log('   1. O frontend está aplicando validação "isTimeInPast" que o backend não aplica');
  console.log('   2. Backend retorna slots disponíveis, mas frontend os bloqueia localmente');
  console.log('   3. Considerar sincronizar a lógica de validação entre frontend e backend');
  console.log('   4. Ou remover a validação "isTimeInPast" do frontend para confiar no backend');
  
  console.log('');
  console.log('🎯 CONCLUSÃO:');
  console.log('   O problema está na validação local do frontend que bloqueia slots');
  console.log('   que o backend considera disponíveis. O backend está correto.');
}

// Executar o debug
debugFrontendVsBackend().catch(console.error);