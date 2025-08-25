const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

console.log('🔧 CORRIGINDO TIMEZONE BRASILEIRO NO BANCO DE DADOS');
console.log('==================================================');

async function fixBrazilianTimezone() {
  try {
    console.log('🔍 Buscando todas as reservas...');
    
    // Buscar todas as reservas
    const bookings = await prisma.booking.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📊 Encontradas ${bookings.length} reservas para corrigir`);

    let correctedCount = 0;
    let errorCount = 0;

    for (const booking of bookings) {
      try {
        console.log(`\n🔧 Corrigindo reserva #${booking.id}:`);
        console.log(`   📅 Partida original: ${booking.departure_date.toLocaleString('pt-BR')}`);
        console.log(`   📅 Retorno original: ${booking.return_date.toLocaleString('pt-BR')}`);
        
        if (booking.actual_departure_date) {
          console.log(`   📅 Partida real original: ${booking.actual_departure_date.toLocaleString('pt-BR')}`);
        }
        if (booking.actual_return_date) {
          console.log(`   📅 Retorno real original: ${booking.actual_return_date.toLocaleString('pt-BR')}`);
        }

        // Aplicar a lógica correta de timezone (MANTENDO O DIA CORRETO)
        // Para departure_date: 3h antes da partida real (início pré-voo)
        const departureDate = new Date(booking.departure_date.getTime() - (3 * 60 * 60 * 1000));
        
        // Para return_date: fim lógico (retorno + tempo voo volta + 3h manutenção)
        const returnFlightTime = (booking.flight_hours || 2) / 2; // Tempo de voo de volta
        const pousoVolta = new Date(booking.return_date.getTime() + (returnFlightTime * 60 * 60 * 1000));
        const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000));
        const returnDate = fimLogico;
        
        // Para actual_departure_date: partida real (mesmo horário que o usuário escolheu)
        const actualDepartureDate = booking.departure_date;
        
        // Para actual_return_date: retorno real (mesmo horário que o usuário escolheu)
        const actualReturnDate = booking.return_date;

        // Atualizar a reserva
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            departure_date: departureDate,
            return_date: returnDate,
            actual_departure_date: actualDepartureDate,
            actual_return_date: actualReturnDate
          }
        });

        console.log(`   ✅ Corrigido:`);
        console.log(`      📅 Partida: ${departureDate.toLocaleString('pt-BR')} (07:00 - início pré-voo)`);
        console.log(`      📅 Retorno: ${returnDate.toLocaleString('pt-BR')} (21:00 - fim lógico)`);
        console.log(`      📅 Partida real: ${actualDepartureDate.toLocaleString('pt-BR')} (10:00 - partida real)`);
        console.log(`      📅 Retorno real: ${actualReturnDate.toLocaleString('pt-BR')} (17:00 - retorno real)`);

        correctedCount++;
      } catch (error) {
        console.error(`   ❌ Erro ao corrigir reserva #${booking.id}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n🎉 CORREÇÃO CONCLUÍDA!');
    console.log('========================');
    console.log(`✅ Reservas corrigidas: ${correctedCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total processado: ${bookings.length}`);

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar a correção
fixBrazilianTimezone();
