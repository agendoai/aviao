// Teste para encontrar a missão que decola às 13:00
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFind13hMission() {
  console.log('🧪 Teste: Procurando missão que decola às 13:00\n');

  try {
    // Buscar todas as missões do PR-FOM
    const bookings = await prisma.booking.findMany({
      where: {
        aircraftId: 2, // PR-FOM
        status: {
          in: ['pendente', 'confirmada', 'paga']
        }
      },
      orderBy: {
        departure_date: 'asc'
      }
    });

    console.log(`📋 Total de missões encontradas: ${bookings.length}`);
    
    for (const booking of bookings) {
      const partida = new Date(booking.departure_date);
      const hora = partida.getHours();
      
      console.log(`\n📅 Missão ${booking.id}:`);
      console.log(`   ${booking.origin} → ${booking.destination}`);
      console.log(`   Partida: ${partida.toLocaleString('pt-BR')} (${hora}h)`);
      console.log(`   Retorno: ${new Date(booking.return_date).toLocaleString('pt-BR')}`);
      console.log(`   Flight hours: ${booking.flight_hours}h`);
      
      if (hora === 13) {
        console.log(`   🎯 ENCONTRADA! Esta é a missão que decola às 13:00!`);
      }
    }

    // Verificar especificamente a missão 8030
    console.log('\n🔍 Verificando missão 8030 especificamente:');
    const booking8030 = await prisma.booking.findUnique({
      where: { id: 8030 }
    });
    
    if (booking8030) {
      const partida = new Date(booking8030.departure_date);
      console.log(`   Partida: ${partida.toLocaleString('pt-BR')} (${partida.getHours()}h)`);
      console.log(`   Retorno: ${new Date(booking8030.return_date).toLocaleString('pt-BR')}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFind13hMission().catch(console.error);
