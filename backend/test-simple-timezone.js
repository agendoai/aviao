const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSimpleTimezone() {
  console.log('🔍 TESTE SIMPLES - TIMEZONE');
  console.log('============================');

  try {
    // Buscar booking existente
    const booking = await prisma.booking.findFirst({
      where: {
        aircraftId: 2,
        status: {
          in: ['pendente', 'confirmada', 'paga', 'blocked']
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!booking) {
      console.log('❌ Nenhum booking encontrado');
      return;
    }

    console.log('📊 Booking encontrado:');
    console.log('   ID:', booking.id);
    console.log('   departure_date:', booking.departure_date);
    console.log('   return_date:', booking.return_date);
    console.log('   actual_departure_date:', booking.actual_departure_date);
    console.log('   actual_return_date:', booking.actual_return_date);

    console.log('\n🔍 Como o JavaScript interpreta essas datas:');
    
    // Testar conversão direta
    const departureDate = new Date(booking.departure_date);
    const returnDate = new Date(booking.return_date);
    const actualDepartureDate = new Date(booking.actual_departure_date);
    const actualReturnDate = new Date(booking.actual_return_date);

    console.log('   Conversão direta:');
    console.log('   departure_date:', departureDate.toLocaleString('pt-BR'));
    console.log('   return_date:', returnDate.toLocaleString('pt-BR'));
    console.log('   actual_departure_date:', actualDepartureDate.toLocaleString('pt-BR'));
    console.log('   actual_return_date:', actualReturnDate.toLocaleString('pt-BR'));

    console.log('\n🔍 ISO Strings:');
    console.log('   departure_date ISO:', departureDate.toISOString());
    console.log('   return_date ISO:', returnDate.toISOString());
    console.log('   actual_departure_date ISO:', actualDepartureDate.toISOString());
    console.log('   actual_return_date ISO:', actualReturnDate.toISOString());

    console.log('\n🔍 Timestamps:');
    console.log('   departure_date timestamp:', departureDate.getTime());
    console.log('   return_date timestamp:', returnDate.getTime());
    console.log('   actual_departure_date timestamp:', actualDepartureDate.getTime());
    console.log('   actual_return_date timestamp:', actualReturnDate.getTime());

    // Simular o que o frontend faria
    console.log('\n🔍 Simulação do frontend:');
    console.log('   Se o frontend fizer new Date(departure_date):');
    console.log('   Resultado:', departureDate.toLocaleString('pt-BR'));
    console.log('   Esperado: 26/08/2025, 04:00:00');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleTimezone();
