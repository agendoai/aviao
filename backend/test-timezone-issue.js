// Teste para verificar problema de timezone
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTimezoneIssue() {
  console.log('🧪 Teste: Verificando problema de timezone\n');

  try {
    // Buscar a missão específica
    const booking = await prisma.booking.findUnique({
      where: { id: 8030 }
    });

    if (!booking) {
      console.log('❌ Missão 8030 não encontrada');
      return;
    }

    console.log('📅 Dados da missão:');
    console.log(`   Partida (raw): ${booking.departure_date}`);
    console.log(`   Retorno (raw): ${booking.return_date}`);
    
    // Testar diferentes formas de criar a data
    const partidaUTC = new Date(booking.departure_date);
    const partidaLocal = new Date(booking.departure_date + 'T00:00:00');
    
    console.log('\n🔍 Comparação de datas:');
    console.log(`   Partida UTC: ${partidaUTC.toLocaleString('pt-BR')}`);
    console.log(`   Partida Local: ${partidaLocal.toLocaleString('pt-BR')}`);
    console.log(`   Partida ISO: ${partidaUTC.toISOString()}`);
    console.log(`   Partida Local ISO: ${partidaLocal.toISOString()}`);
    
    // Verificar se há diferença de timezone
    const timezoneOffset = partidaUTC.getTimezoneOffset();
    console.log(`\n⏰ Timezone offset: ${timezoneOffset} minutos`);
    console.log(`   Isso significa: ${timezoneOffset > 0 ? 'UTC+' : 'UTC-'}${Math.abs(timezoneOffset/60)}h`);
    
    // Simular a lógica do missionValidator com diferentes interpretações
    console.log('\n🔍 Testando diferentes interpretações:');
    
    // Interpretação 1: UTC
    const preVooInicioUTC = new Date(partidaUTC.getTime() - (3 * 60 * 60 * 1000));
    const preVooFimUTC = new Date(partidaUTC.getTime());
    
    console.log('\n📅 Interpretação UTC:');
    console.log(`   Pré-voo início: ${preVooInicioUTC.toLocaleString('pt-BR')}`);
    console.log(`   Pré-voo fim: ${preVooFimUTC.toLocaleString('pt-BR')}`);
    
    // Interpretação 2: Local
    const preVooInicioLocal = new Date(partidaLocal.getTime() - (3 * 60 * 60 * 1000));
    const preVooFimLocal = new Date(partidaLocal.getTime());
    
    console.log('\n📅 Interpretação Local:');
    console.log(`   Pré-voo início: ${preVooInicioLocal.toLocaleString('pt-BR')}`);
    console.log(`   Pré-voo fim: ${preVooFimLocal.toLocaleString('pt-BR')}`);
    
    // Testar slots específicos
    console.log('\n🔍 Testando slots específicos:');
    const testTimes = ['10:00', '11:00', '12:00', '13:00'];
    
    for (const timeStr of testTimes) {
      const [hour, minute] = timeStr.split(':').map(Number);
      
      // Criar slot UTC
      const slotUTC = new Date(partidaUTC);
      slotUTC.setHours(hour, minute, 0, 0);
      
      // Criar slot Local
      const slotLocal = new Date(partidaLocal);
      slotLocal.setHours(hour, minute, 0, 0);
      
      // Verificar se está no pré-voo UTC
      const isPreVooUTC = slotUTC >= preVooInicioUTC && slotUTC < preVooFimUTC;
      
      // Verificar se está no pré-voo Local
      const isPreVooLocal = slotLocal >= preVooInicioLocal && slotLocal < preVooFimLocal;
      
      console.log(`   ${timeStr}:`);
      console.log(`     UTC: ${slotUTC.toLocaleString('pt-BR')} - Pré-voo: ${isPreVooUTC ? '🟡 SIM' : '🟢 NÃO'}`);
      console.log(`     Local: ${slotLocal.toLocaleString('pt-BR')} - Pré-voo: ${isPreVooLocal ? '🟡 SIM' : '🟢 NÃO'}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimezoneIssue().catch(console.error);
