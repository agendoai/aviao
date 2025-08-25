// Teste da lógica com exemplo específico
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testLogicExample() {
  console.log('🧪 Testando lógica com exemplo específico\n');

  try {
    // Exemplo: Partida 03:00, Retorno 10:00, Tempo total 1h
    const partida = new Date(2025, 7, 21, 3, 0); // 21/08 03:00
    const retorno = new Date(2025, 7, 21, 10, 0); // 21/08 10:00
    const flightHoursTotal = 1; // 1 hora total
    
    console.log('📋 Exemplo de Missão:');
    console.log(`   Partida: ${partida.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${retorno.toLocaleString('pt-BR')}`);
    console.log(`   Tempo total: ${flightHoursTotal}h`);
    
    // Cálculos
    const tVolta = flightHoursTotal / 2; // 0.5h = 30min
    const pousoVolta = new Date(retorno.getTime() + (tVolta * 60 * 60 * 1000));
    const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // +3h
    const proximaDecolagem = new Date(fimLogico.getTime() + (3 * 60 * 60 * 1000)); // +3h
    
    console.log('\n📐 Cálculos:');
    console.log(`   Tempo de volta: ${tVolta}h (${tVolta * 60}min)`);
    console.log(`   Pouso da volta: ${pousoVolta.toLocaleString('pt-BR')}`);
    console.log(`   Fim lógico (E): ${fimLogico.toLocaleString('pt-BR')}`);
    console.log(`   Próxima decolagem (Smin): ${proximaDecolagem.toLocaleString('pt-BR')}`);
    
    console.log('\n🎯 Janelas de Bloqueio:');
    console.log(`   Pré-voo: 00:00 - 03:00 (3h antes da partida)`);
    console.log(`   Missão: 03:00 - 10:00 (durante a missão)`);
    console.log(`   Pós-voo: 10:30 - 13:30 (pouso volta + 3h)`);
    console.log(`   Próxima missão: 16:30+ (precisa de 3h livres antes)`);
    
    console.log('\n🔍 Slots para 21/08:');
    
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(2025, 7, 21, hour, minute);
        
        let status = '🟢 available';
        let reason = '';
        
        // Pré-voo (00:00-03:00)
        if (slotTime >= new Date(2025, 7, 21, 0, 0) && slotTime < partida) {
          status = '🟡 blocked';
          reason = 'Pré-voo (-3h)';
        }
        // Missão (03:00-10:00)
        else if (slotTime >= partida && slotTime < retorno) {
          status = '⚫ booked';
          reason = 'Missão em andamento';
        }
        // Pós-voo (10:30-13:30)
        else if (slotTime >= pousoVolta && slotTime < fimLogico) {
          status = '🟠 blocked';
          reason = 'Pós-voo (+3h)';
        }
        // Antes da próxima decolagem (13:30-16:30)
        else if (slotTime >= fimLogico && slotTime < proximaDecolagem) {
          status = '🟡 blocked';
          reason = 'Precisa 3h livres antes';
        }
        
        const timeStr = slotTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ${timeStr}: ${status} - ${reason}`);
      }
    }
    
    console.log('\n✅ Conclusão:');
    console.log(`   Aeronave liberada às: ${fimLogico.toLocaleTimeString('pt-BR')}`);
    console.log(`   Próxima missão possível às: ${proximaDecolagem.toLocaleTimeString('pt-BR')}`);
    console.log(`   (precisa de 3h livres antes da decolagem)`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogicExample().catch(console.error);
