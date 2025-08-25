// Script para corrigir missões já existentes no banco de dados
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExistingMissions() {
  console.log('🔧 Corrigindo missões existentes no banco de dados...\n');

  try {
    // Buscar todas as missões existentes
    const existingMissions = await prisma.booking.findMany({
      where: {
        status: {
          in: ['pendente', 'confirmado', 'em_andamento', 'concluido']
        }
      },
      include: {
        aircraft: true,
        user: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Encontradas ${existingMissions.length} missões para verificar`);

    if (existingMissions.length === 0) {
      console.log('✅ Nenhuma missão encontrada para corrigir');
      return;
    }

    let correctedCount = 0;
    let errorCount = 0;

    for (const mission of existingMissions) {
      try {
        console.log(`\n🔍 Verificando missão ID ${mission.id}:`);
        console.log(`   Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
        console.log(`   Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
        console.log(`   Status: ${mission.status}`);

        // Verificar se a missão tem blocked_until calculado incorretamente
        const flightHoursTotal = mission.flight_hours || 0;
        const tVoltaMs = (flightHoursTotal / 2) * 60 * 60 * 1000; // 30min em milissegundos
        const pousoVolta = new Date(mission.return_date.getTime() + tVoltaMs);
        const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // +3h

        // Verificar se o blocked_until atual está incorreto
        const currentBlockedUntil = mission.blocked_until;
        const correctBlockedUntil = fimLogico;

        if (currentBlockedUntil && Math.abs(currentBlockedUntil.getTime() - correctBlockedUntil.getTime()) > 60000) { // Diferença > 1 minuto
          console.log(`   ❌ blocked_until incorreto:`);
          console.log(`      Atual: ${currentBlockedUntil.toLocaleString('pt-BR')}`);
          console.log(`      Correto: ${correctBlockedUntil.toLocaleString('pt-BR')}`);

          // Atualizar o blocked_until
          await prisma.booking.update({
            where: { id: mission.id },
            data: {
              blocked_until: correctBlockedUntil
            }
          });

          console.log(`   ✅ Corrigido!`);
          correctedCount++;
        } else {
          console.log(`   ✅ blocked_until já está correto`);
        }

      } catch (error) {
        console.error(`   ❌ Erro ao corrigir missão ${mission.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n📋 Resumo da correção:');
    console.log(`   ✅ Missões corrigidas: ${correctedCount}`);
    console.log(`   ❌ Erros: ${errorCount}`);
    console.log(`   📊 Total verificadas: ${existingMissions.length}`);

    if (correctedCount > 0) {
      console.log('\n🎉 Correção concluída! As missões agora têm o blocked_until correto.');
      console.log('💡 Agora teste o calendário no frontend para ver as correções!');
    } else {
      console.log('\n✅ Todas as missões já estavam corretas!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a correção
fixExistingMissions().catch(console.error);
