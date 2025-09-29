const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function corrigirBlockedUntilParaReturnDate() {
  try {
    console.log('🔧 CORRIGINDO BLOCKED_UNTIL PARA SER IGUAL AO RETURN_DATE');
    console.log('=' .repeat(60));
    
    // Buscar todas as reservas ativas
    const reservas = await prisma.booking.findMany({
      where: {
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
    
    console.log(`📊 Encontradas ${reservas.length} reservas ativas`);
    
    let corrigidas = 0;
    
    for (const reserva of reservas) {
      const returnDate = new Date(reserva.return_date);
      const blockedUntil = reserva.blocked_until ? new Date(reserva.blocked_until) : null;
      
      // Verificar se blocked_until é diferente de return_date
      const precisaCorrigir = !blockedUntil || blockedUntil.getTime() !== returnDate.getTime();
      
      if (precisaCorrigir) {
        console.log(`\n📅 Corrigindo Reserva ID ${reserva.id}:`);
        console.log(`   Aeronave: ${reserva.aircraft.name} (${reserva.aircraft.registration})`);
        console.log(`   Rota: ${reserva.origin} → ${reserva.destination}`);
        console.log(`   return_date: ${returnDate.toLocaleString('pt-BR')}`);
        console.log(`   blocked_until antigo: ${blockedUntil ? blockedUntil.toLocaleString('pt-BR') : 'null'}`);
        console.log(`   blocked_until novo: ${returnDate.toLocaleString('pt-BR')} ✅`);
        
        // Atualizar blocked_until para ser igual ao return_date
        await prisma.booking.update({
          where: { id: reserva.id },
          data: { blocked_until: returnDate }
        });
        
        corrigidas++;
      }
    }
    
    console.log('');
    console.log(`🎉 CORREÇÃO CONCLUÍDA!`);
    console.log(`   ✅ ${corrigidas} reservas corrigidas`);
    console.log(`   ✅ ${reservas.length - corrigidas} reservas já estavam corretas`);
    console.log('');
    console.log('💡 Agora blocked_until = return_date para todas as reservas');
    console.log('   • Pós-voo terminará exatamente no return_date');
    console.log('   • Calendário não mostrará mais janelas no dia seguinte incorretamente');
    
  } catch (error) {
    console.error('❌ Erro ao corrigir reservas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  corrigirBlockedUntilParaReturnDate().catch(console.error);
}

module.exports = { corrigirBlockedUntilParaReturnDate };