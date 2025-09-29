const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function corrigirBlockedUntilNulo() {
  try {
    console.log('🔧 CORRIGINDO RESERVAS COM BLOCKED_UNTIL NULO');
    console.log('=' .repeat(60));
    
    // Buscar reservas com blocked_until nulo
    const reservasProblematicas = await prisma.booking.findMany({
      where: {
        blocked_until: null,
        status: {
          in: ['pendente', 'confirmada', 'paga']
        }
      },
      include: {
        aircraft: {
          select: { name: true, registration: true }
        }
      }
    });
    
    console.log(`📊 Encontradas ${reservasProblematicas.length} reservas com blocked_until nulo`);
    
    if (reservasProblematicas.length === 0) {
      console.log('✅ Nenhuma correção necessária!');
      return;
    }
    
    console.log('');
    console.log('🔍 RESERVAS A SEREM CORRIGIDAS:');
    
    for (const reserva of reservasProblematicas) {
      console.log(`\n📅 Reserva ID ${reserva.id}:`);
      console.log(`   Aeronave: ${reserva.aircraft.name} (${reserva.aircraft.registration})`);
      console.log(`   Rota: ${reserva.origin} → ${reserva.destination}`);
      console.log(`   Retorno real: ${new Date(reserva.actual_return_date).toLocaleString('pt-BR')}`);
      console.log(`   Flight hours: ${reserva.flight_hours}h`);
      
      // Calcular blocked_until correto
      const returnDateTime = new Date(reserva.actual_return_date);
      const returnFlightTime = reserva.flight_hours / 2; // Tempo de voo de volta
      const blockedUntil = new Date(returnDateTime.getTime() + (returnFlightTime + 3) * 60 * 60 * 1000);
      
      console.log(`   Blocked until calculado: ${blockedUntil.toLocaleString('pt-BR')} (${blockedUntil.toISOString()})`);
      
      // Atualizar no banco
      await prisma.booking.update({
        where: { id: reserva.id },
        data: { blocked_until: blockedUntil }
      });
      
      console.log(`   ✅ Corrigido!`);
    }
    
    console.log('');
    console.log('🎉 TODAS AS CORREÇÕES APLICADAS COM SUCESSO!');
    console.log('');
    console.log('💡 O que foi corrigido:');
    console.log('   • blocked_until calculado como: actual_return_date + tempo_voo_volta + 3h_manutencao');
    console.log('   • Reservas agora terão pós-voo marcado corretamente no calendário');
    console.log('   • Janelas laranja não vão mais "pular" para o próximo dia incorretamente');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir reservas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  corrigirBlockedUntilNulo().catch(console.error);
}

module.exports = { corrigirBlockedUntilNulo };