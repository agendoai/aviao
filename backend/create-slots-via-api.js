const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function createSlotsViaAPI() {
  console.log('🚀 Criando slots via API...\n');
  
  try {
    // Configuração para todos os dias 24h
    const daysConfig = {
      0: { active: true, startHour: 0, endHour: 24 },   // Domingo
      1: { active: true, startHour: 0, endHour: 24 },   // Segunda
      2: { active: true, startHour: 0, endHour: 24 },   // Terça
      3: { active: true, startHour: 0, endHour: 24 },   // Quarta
      4: { active: true, startHour: 0, endHour: 24 },   // Quinta
      5: { active: true, startHour: 0, endHour: 24 },   // Sexta
      6: { active: true, startHour: 0, endHour: 24 }    // Sábado
    };

    const response = await fetch('http://localhost:4000/api/calendar/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer SEU_TOKEN_AQUI', // Substitua pelo token do admin
      },
      body: JSON.stringify({
        aircraftId: 2, // ID da aeronave
        daysConfig: daysConfig
      }),
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Slots criados com sucesso!');
      console.log('📊 Resultado:', result);
    } else {
      console.log('❌ Erro ao criar slots:', result);
    }
    
  } catch (error) {
    console.error('❌ Erro na requisição:', error);
  }
}

createSlotsViaAPI();



