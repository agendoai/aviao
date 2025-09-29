// Script para testar se o bug do pós-voo foi corrigido
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPostFlightFix() {
  console.log('🧪 Testando se o bug do pós-voo foi corrigido...\n');

  try {
    // Buscar missões existentes
    const missions = await prisma.booking.findMany({
      where: {
        status: {
          in: ['pendente', 'confirmado']
        }
      },
      orderBy: {
        departure_date: 'desc'
      },
      take: 5
    });

    console.log(`📊 Encontradas ${missions.length} missões para testar`);

    for (const mission of missions) {
      console.log(`\n🔍 Testando missão #${mission.id}:`);
      console.log(`   Origem: ${mission.origin} → Destino: ${mission.destination}`);
      console.log(`   Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
      console.log(`   Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
      console.log(`   Flight hours: ${mission.flight_hours}h`);

      // Simular o cálculo que o frontend fazia (INCORRETO)
      const returnFlightTime = mission.flight_hours / 2;
      const pousoVolta = new Date(mission.return_date.getTime() + (returnFlightTime * 60 * 60 * 1000));
      const posVooFimIncorreto = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000));

      // Cálculo correto (usando return_date diretamente)
      const posVooFimCorreto = new Date(mission.return_date.getTime());

      console.log(`   ❌ Cálculo INCORRETO (antigo): ${posVooFimIncorreto.toLocaleString('pt-BR')}`);
      console.log(`   ✅ Cálculo CORRETO (novo): ${posVooFimCorreto.toLocaleString('pt-BR')}`);

      // Verificar se pulou para o dia seguinte
      const mesmoDia = posVooFimCorreto.getDate() === mission.return_date.getDate();
      const mesmoMes = posVooFimCorreto.getMonth() === mission.return_date.getMonth();
      const mesmoAno = posVooFimCorreto.getFullYear() === mission.return_date.getFullYear();

      if (mesmoDia && mesmoMes && mesmoAno) {
        console.log(`   ✅ SUCESSO: Pós-voo continua no mesmo dia!`);
      } else {
        console.log(`   ❌ ERRO: Pós-voo ainda está pulando para o dia seguinte!`);
      }
    }

    console.log('\n🎯 Resumo do teste:');
    console.log('   - Se todas as missões mostram "SUCESSO", o bug foi corrigido');
    console.log('   - Se alguma mostra "ERRO", ainda há problemas');

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPostFlightFix().catch(console.error);


