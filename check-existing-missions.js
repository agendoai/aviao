// Script para verificar missões existentes e identificar problemas
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkExistingMissions() {
  console.log('🔍 Verificando missões existentes no banco...\n');

  try {
    // Buscar todas as missões
    const missions = await prisma.booking.findMany({
      where: {
        status: {
          in: ['pendente', 'confirmado', 'available']
        }
      },
      orderBy: {
        departure_date: 'desc'
      }
    });

    console.log(`📊 Encontradas ${missions.length} missões`);

    for (const mission of missions) {
      console.log(`\n🔍 Missão #${mission.id}:`);
      console.log(`   Origem: ${mission.origin} → Destino: ${mission.destination}`);
      console.log(`   Status: ${mission.status}`);
      console.log(`   Flight hours: ${mission.flight_hours}h`);
      
      // Datas originais
      console.log(`   📅 departure_date: ${mission.departure_date.toLocaleString('pt-BR')}`);
      console.log(`   📅 return_date: ${mission.return_date.toLocaleString('pt-BR')}`);
      console.log(`   📅 blocked_until: ${mission.blocked_until ? mission.blocked_until.toLocaleString('pt-BR') : 'N/A'}`);

      // Calcular o que deveria ser
      const returnFlightTime = mission.flight_hours / 2; // Tempo de voo de volta
      const expectedReturnDate = new Date(mission.return_date.getTime() + (returnFlightTime * 60 * 60 * 1000) + (3 * 60 * 60 * 1000));
      const expectedBlockedUntil = new Date(mission.return_date.getTime() + (returnFlightTime + 3) * 60 * 60 * 1000);

      console.log(`   🧮 Cálculo esperado:`);
      console.log(`      return_date deveria ser: ${expectedReturnDate.toLocaleString('pt-BR')}`);
      console.log(`      blocked_until deveria ser: ${expectedBlockedUntil.toLocaleString('pt-BR')}`);

      // Verificar se os dados estão corretos
      const returnDateCorrect = Math.abs(mission.return_date.getTime() - expectedReturnDate.getTime()) < 60000; // 1 minuto de tolerância
      const blockedUntilCorrect = mission.blocked_until ? 
        Math.abs(mission.blocked_until.getTime() - expectedBlockedUntil.getTime()) < 60000 : false;

      console.log(`   ✅ return_date correto: ${returnDateCorrect ? 'SIM' : 'NÃO'}`);
      console.log(`   ✅ blocked_until correto: ${blockedUntilCorrect ? 'SIM' : 'NÃO'}`);

      // Verificar se o pós-voo está no dia seguinte
      const posVooInicio = new Date(mission.return_date.getTime() - (3 * 60 * 60 * 1000));
      const posVooFim = new Date(mission.return_date.getTime());
      
      const mesmoDia = posVooFim.getDate() === mission.return_date.getDate();
      const mesmoMes = posVooFim.getMonth() === mission.return_date.getMonth();
      const mesmoAno = posVooFim.getFullYear() === mission.return_date.getFullYear();

      console.log(`   🟠 Pós-voo: ${posVooInicio.toLocaleString('pt-BR')} - ${posVooFim.toLocaleString('pt-BR')}`);
      console.log(`   📅 Pós-voo no mesmo dia: ${mesmoDia && mesmoMes && mesmoAno ? 'SIM' : 'NÃO'}`);

      if (!mesmoDia || !mesmoMes || !mesmoAno) {
        console.log(`   ❌ PROBLEMA: Pós-voo está no dia seguinte!`);
      }
    }

    console.log('\n🎯 Resumo:');
    console.log('   - Se alguma missão mostra "PROBLEMA", os dados no banco estão incorretos');
    console.log('   - Se todas mostram "SIM", o problema pode estar no frontend');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingMissions().catch(console.error);


