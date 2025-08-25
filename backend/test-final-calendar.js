// Teste final do calendário com todas as janelas
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFinalCalendar() {
  console.log('🧪 Teste Final do Calendário\n');

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
    console.log(`   Próxima missão: 13:30 - 16:30 (precisa de 3h livres antes)`);
    
    console.log('\n🔍 Slots para 21/08:');
    
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(2025, 7, 21, hour, minute);
        
        let status = '🟢 available';
        let reason = '';
        let blockType = '';
        
        // Pré-voo (00:00-03:00)
        if (slotTime >= new Date(2025, 7, 21, 0, 0) && slotTime < partida) {
          status = '🟡 blocked';
          reason = 'Tempo de preparação (-3h)';
          blockType = 'pre-voo';
        }
        // Missão (03:00-10:00)
        else if (slotTime >= partida && slotTime < retorno) {
          status = '⚫ booked';
          reason = 'Missão em andamento';
          blockType = 'missao';
        }
        // Pós-voo (10:30-13:30)
        else if (slotTime >= pousoVolta && slotTime < fimLogico) {
          status = '🟠 blocked';
          reason = 'Encerramento/Manutenção (+3h)';
          blockType = 'pos-voo';
        }
        // Próxima missão (13:30-16:30)
        else if (slotTime >= fimLogico && slotTime < proximaDecolagem) {
          status = '🟡 blocked';
          reason = 'Precisa de 3h livres antes da decolagem';
          blockType = 'proxima-missao';
        }
        
        const timeStr = slotTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ${timeStr}: ${status} - ${reason} [${blockType}]`);
      }
    }
    
    console.log('\n✅ Conclusão:');
    console.log(`   Aeronave liberada às: ${fimLogico.toLocaleTimeString('pt-BR')}`);
    console.log(`   Próxima missão possível às: ${proximaDecolagem.toLocaleTimeString('pt-BR')}`);
    console.log(`   (precisa de 3h livres antes da decolagem)`);
    
    console.log('\n🎨 Cores no Frontend:');
    console.log(`   🟢 Verde: Disponível`);
    console.log(`   ⚫ Cinza: Missão em andamento`);
    console.log(`   🟡 Amarelo: Pré-voo (-3h) e Próxima missão (3h livres)`);
    console.log(`   🟠 Laranja: Pós-voo (+3h)`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFinalCalendar().catch(console.error);
