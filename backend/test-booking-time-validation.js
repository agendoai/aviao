const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBookingTimeValidation() {
  console.log('🧪 Testando validação de horários de reserva...\n');

  try {
    // Buscar aeronave disponível
    const aircraft = await prisma.aircraft.findFirst({
      where: { status: 'available' }
    });

    if (!aircraft) {
      console.log('❌ Nenhuma aeronave disponível encontrada');
      return;
    }

    console.log(`✅ Aeronave encontrada: ${aircraft.name} (${aircraft.registration})`);

    // Teste 1: Tentar criar reserva fora do horário de funcionamento (23h)
    console.log('\n📋 Teste 1: Reserva fora do horário (23h)');
    try {
      const invalidBooking = await prisma.booking.create({
        data: {
          userId: 1,
          aircraftId: aircraft.id,
          origin: 'SBAU',
          destination: 'SBSP',
          departure_date: new Date('2025-08-29T23:00:00.000Z'), // 23h UTC
          return_date: new Date('2025-08-30T01:00:00.000Z'),   // 1h do dia seguinte
          passengers: 1,
          flight_hours: 2,
          overnight_stays: 0,
          value: 5000,
          status: 'pendente',
          maintenance_buffer_hours: 3
        }
      });
      console.log('❌ ERRO: Reserva fora do horário foi criada!');
      console.log('   Deveria ter sido rejeitada');
      
      // Limpar o teste
      await prisma.booking.delete({ where: { id: invalidBooking.id } });
    } catch (error) {
      if (error.message.includes('Horário fora do período de funcionamento')) {
        console.log('✅ CORRETO: Reserva fora do horário foi rejeitada');
      } else {
        console.log('❌ Erro inesperado:', error.message);
      }
    }

    // Teste 2: Tentar criar reserva no horário válido (14h)
    console.log('\n📋 Teste 2: Reserva no horário válido (14h)');
    try {
      const validBooking = await prisma.booking.create({
        data: {
          userId: 1,
          aircraftId: aircraft.id,
          origin: 'SBAU',
          destination: 'SBSP',
          departure_date: new Date('2025-08-29T14:00:00.000Z'), // 14h UTC
          return_date: new Date('2025-08-29T16:00:00.000Z'),   // 16h UTC
          passengers: 1,
          flight_hours: 2,
          overnight_stays: 0,
          value: 5000,
          status: 'pendente',
          maintenance_buffer_hours: 3
        }
      });
      console.log('✅ Reserva válida criada com sucesso');
      console.log(`   ID: ${validBooking.id}`);
      console.log(`   Blocked until: ${validBooking.blocked_until}`);
      
      // Verificar se o blocked_until não ultrapassa 18h
      const blockedUntilHour = new Date(validBooking.blocked_until).getUTCHours();
      if (blockedUntilHour >= 18) {
        console.log('❌ ERRO: blocked_until ultrapassa o horário de funcionamento');
        console.log(`   Hora: ${blockedUntilHour}h (deveria ser < 18h)`);
      } else {
        console.log(`✅ CORRETO: blocked_until está dentro do horário (${blockedUntilHour}h)`);
      }
      
      // Limpar o teste
      await prisma.booking.delete({ where: { id: validBooking.id } });
    } catch (error) {
      console.log('❌ Erro ao criar reserva válida:', error.message);
    }

    // Teste 3: Verificar cálculo do blocked_until
    console.log('\n📋 Teste 3: Cálculo do blocked_until');
    const returnTime = new Date('2025-08-29T16:00:00.000Z'); // 16h UTC
    const flightHours = 2; // 2 horas total (ida + volta)
    const returnFlightDuration = flightHours / 2; // 1 hora de volta
    const returnFlightDurationMinutes = returnFlightDuration * 60;
    const flightEnd = new Date(returnTime.getTime() + (returnFlightDurationMinutes * 60 * 1000));
    let blockedUntil = new Date(flightEnd.getTime() + (3 * 60 * 60 * 1000)); // +3h manutenção
    
    console.log(`   Retorno: ${returnTime.toISOString()}`);
    console.log(`   Fim do voo de volta: ${flightEnd.toISOString()}`);
    console.log(`   Blocked until (antes do ajuste): ${blockedUntil.toISOString()}`);
    
    // Aplicar a mesma lógica do backend
    const blockedUntilHour = blockedUntil.getUTCHours();
    const maxWorkingHour = 18;
    
    if (blockedUntilHour >= maxWorkingHour) {
      blockedUntil.setUTCHours(maxWorkingHour, 0, 0, 0);
      console.log(`   Blocked until (após ajuste): ${blockedUntil.toISOString()}`);
    } else {
      blockedUntil.setMinutes(0, 0, 0);
      blockedUntil.setHours(blockedUntil.getHours() + 1);
      
      if (blockedUntil.getUTCHours() >= maxWorkingHour) {
        blockedUntil.setUTCHours(maxWorkingHour, 0, 0, 0);
      }
      console.log(`   Blocked until (após arredondamento): ${blockedUntil.toISOString()}`);
    }
    
    const finalHour = blockedUntil.getUTCHours();
    if (finalHour >= 18) {
      console.log('❌ ERRO: Cálculo ainda ultrapassa 18h');
    } else {
      console.log(`✅ CORRETO: Cálculo final está dentro do horário (${finalHour}h)`);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingTimeValidation();


