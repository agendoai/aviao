// Script para testar slots corrigidos
const { generateTimeSlots } = require('./src/services/intelligentValidation.ts');

async function testSlotsFixed() {
  console.log('🧪 TESTANDO SLOTS CORRIGIDOS');
  console.log('============================');

  try {
    // Testar geração de slots para a semana atual
    const weekStart = new Date('2025-08-25'); // Segunda-feira
    const aircraftId = 2; // PR-FOM

    console.log('🔍 Gerando slots para semana:', weekStart.toLocaleDateString('pt-BR'));
    console.log('🔍 Aeronave ID:', aircraftId);

    const slots = await generateTimeSlots(aircraftId, weekStart);

    console.log(`\n📊 Total de slots gerados: ${slots.length}`);

    // Filtrar slots de 28/08 (quarta-feira) para verificar a missão 8036
    const slots28 = slots.filter(slot => {
      const slotDate = new Date(slot.start);
      return slotDate.getDate() === 28 && slotDate.getMonth() === 7; // Agosto = 7
    });

    console.log(`\n📅 Slots do dia 28/08: ${slots28.length}`);

    // Mostrar slots de pré-voo, missão e pós-voo
    const preVooSlots = slots28.filter(s => s.blockType === 'pre-voo');
    const missaoSlots = slots28.filter(s => s.blockType === 'missao');
    const posVooSlots = slots28.filter(s => s.blockType === 'pos-voo');

    console.log('\n🟡 Slots de pré-voo:');
    preVooSlots.slice(0, 5).forEach(slot => {
      console.log(`   ${slot.start.toLocaleTimeString('pt-BR')} - ${slot.reason}`);
    });

    console.log('\n🟢 Slots de missão:');
    missaoSlots.slice(0, 5).forEach(slot => {
      console.log(`   ${slot.start.toLocaleTimeString('pt-BR')} - ${slot.reason}`);
    });

    console.log('\n🔴 Slots de pós-voo:');
    posVooSlots.slice(0, 5).forEach(slot => {
      console.log(`   ${slot.start.toLocaleTimeString('pt-BR')} - ${slot.reason}`);
    });

    // Verificar se os horários estão corretos
    console.log('\n✅ Verificação de horários:');
    if (preVooSlots.length > 0) {
      const firstPreVoo = preVooSlots[0];
      console.log(`   Primeiro pré-voo: ${firstPreVoo.start.toLocaleTimeString('pt-BR')}`);
    }
    if (missaoSlots.length > 0) {
      const firstMissao = missaoSlots[0];
      console.log(`   Primeira missão: ${firstMissao.start.toLocaleTimeString('pt-BR')}`);
    }
    if (posVooSlots.length > 0) {
      const firstPosVoo = posVooSlots[0];
      console.log(`   Primeiro pós-voo: ${firstPosVoo.start.toLocaleTimeString('pt-BR')}`);
    }

  } catch (error) {
    console.error('❌ Erro ao testar slots:', error);
  }
}

testSlotsFixed().catch(console.error);
