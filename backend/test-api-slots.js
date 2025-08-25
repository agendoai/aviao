// Teste para verificar o que a API está retornando para os slots
const { PrismaClient } = require('@prisma/client');
const { generateTimeSlots } = require('./src/services/intelligentValidation');

const prisma = new PrismaClient();

async function testApiSlots() {
  console.log('🧪 Teste: Verificando o que a API está retornando para os slots\n');

  try {
    // Simular a chamada da API
    const weekStart = new Date(2025, 7, 18); // Segunda-feira, 18/08
    console.log(`📅 Semana: ${weekStart.toLocaleDateString('pt-BR')}`);
    
    const slots = await generateTimeSlots(2, weekStart); // PR-FOM
    
    console.log(`📊 Total de slots gerados: ${slots.length}`);
    
    // Filtrar slots do dia 22/08 (dia da missão 8030)
    const slots22 = slots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.getDate() === 22 && 
             slotDate.getMonth() === 7 && 
             slotDate.getFullYear() === 2025;
    });
    
    console.log(`\n📅 Slots do dia 22/08: ${slots22.length}`);
    
    // Agrupar por status
    const statusCount = {};
    const preVooSlots = [];
    const missaoSlots = [];
    const posVooSlots = [];
    
    for (const slot of slots22) {
      const timeStr = slot.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      
      if (!statusCount[slot.status]) statusCount[slot.status] = 0;
      statusCount[slot.status]++;
      
      if (slot.blockType === 'pre-voo') {
        preVooSlots.push({ time: timeStr, slot });
      } else if (slot.blockType === 'missao') {
        missaoSlots.push({ time: timeStr, slot });
      } else if (slot.blockType === 'pos-voo') {
        posVooSlots.push({ time: timeStr, slot });
      }
    }
    
    console.log('\n📊 Status dos slots:');
    for (const [status, count] of Object.entries(statusCount)) {
      console.log(`   ${status}: ${count}`);
    }
    
    console.log('\n🟡 Slots de pré-voo:');
    for (const { time, slot } of preVooSlots) {
      console.log(`   ${time}: ${slot.reason}`);
    }
    
    console.log('\n⚫ Slots de missão:');
    for (const { time, slot } of missaoSlots) {
      console.log(`   ${time}: ${slot.reason}`);
    }
    
    console.log('\n🟠 Slots de pós-voo:');
    for (const { time, slot } of posVooSlots) {
      console.log(`   ${time}: ${slot.reason}`);
    }
    
    // Verificar slots específicos problemáticos
    console.log('\n🔍 Verificando slots específicos:');
    const problemSlots = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    
    for (const timeStr of problemSlots) {
      const [hour, minute] = timeStr.split(':').map(Number);
      const slot = slots22.find(s => 
        s.start.getHours() === hour && s.start.getMinutes() === minute
      );
      
      if (slot) {
        const icon = slot.blockType === 'pre-voo' ? '🟡' : 
                     slot.blockType === 'missao' ? '⚫' : 
                     slot.blockType === 'pos-voo' ? '🟠' : '🟢';
        console.log(`   ${icon} ${timeStr}: ${slot.status} - ${slot.blockType} - ${slot.reason}`);
      } else {
        console.log(`   ❓ ${timeStr}: Slot não encontrado`);
      }
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testApiSlots().catch(console.error);
