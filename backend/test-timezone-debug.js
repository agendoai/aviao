const { PrismaClient } = require('@prisma/client');
const { generateTimeSlots } = require('./src/services/intelligentValidation');

const prisma = new PrismaClient();

async function testTimezoneDebug() {
  console.log('🔍 TESTE - DEBUG TIMEZONE');
  console.log('==========================');

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

    // Testar generateTimeSlots
    const weekStart = new Date('2025-08-26T00:00:00.000Z');
    console.log('\n🔍 Testando generateTimeSlots:');
    console.log('   weekStart:', weekStart.toISOString());

    const slots = await generateTimeSlots(
      2, // aircraftId
      weekStart,
      undefined, // selectedStart
      undefined, // selectedEnd
      2.0 // missionDuration
    );

    console.log('\n📅 Slots gerados:');
    slots.slice(0, 10).forEach((slot, index) => {
      console.log(`   Slot ${index + 1}:`);
      console.log(`     start: ${slot.start} (${new Date(slot.start).toLocaleString('pt-BR')})`);
      console.log(`     end: ${slot.end} (${new Date(slot.end).toLocaleString('pt-BR')})`);
      console.log(`     status: ${slot.status}`);
      if (slot.reason) console.log(`     reason: ${slot.reason}`);
      console.log('');
    });

    // Verificar se há slots bloqueados
    const blockedSlots = slots.filter(slot => slot.status === 'blocked' || slot.status === 'booked');
    console.log(`🚫 Slots bloqueados encontrados: ${blockedSlots.length}`);

    if (blockedSlots.length > 0) {
      console.log('\n🔒 Primeiros slots bloqueados:');
      blockedSlots.slice(0, 5).forEach((slot, index) => {
        console.log(`   Bloqueado ${index + 1}:`);
        console.log(`     start: ${slot.start} (${new Date(slot.start).toLocaleString('pt-BR')})`);
        console.log(`     end: ${slot.end} (${new Date(slot.end).toLocaleString('pt-BR')})`);
        console.log(`     status: ${slot.status}`);
        console.log(`     reason: ${slot.reason}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimezoneDebug();
