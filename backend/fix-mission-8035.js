// Script para corrigir a missão 8035
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMission8035() {
  console.log('🔧 CORRIGINDO MISSÃO #8035');
  console.log('==========================');

  try {
    // Buscar a missão 8035
    const mission = await prisma.booking.findUnique({
      where: { id: 8035 }
    });

    if (!mission) {
      console.log('❌ Missão #8035 não encontrada');
      return;
    }

    console.log('🔍 Missão encontrada:', {
      id: mission.id,
      origin: mission.origin,
      destination: mission.destination,
      departure_date: mission.departure_date,
      return_date: mission.return_date,
      flight_hours: mission.flight_hours
    });

    // Calcular os valores corretos
    const actualDepartureDate = new Date(mission.departure_date.getTime() + (3 * 60 * 60 * 1000)); // +3h
    // O return_date já tem as 3h incluídas, então só subtrair o tempo de volta
    const actualReturnDate = new Date(mission.return_date.getTime() - ((mission.flight_hours / 2) * 60 * 60 * 1000) - (3 * 60 * 60 * 1000)); // -tempo_volta - 3h
    
    // Calcular o return_date correto
    const returnFlightTime = mission.flight_hours / 2; // Tempo de voo de volta
    const pousoVolta = new Date(actualReturnDate.getTime() + (returnFlightTime * 60 * 60 * 1000));
    const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // Pouso volta + 3h

    console.log('📊 Valores calculados:');
    console.log('🕐 actual_departure_date:', actualDepartureDate.toISOString());
    console.log('🕐 actual_return_date:', actualReturnDate.toISOString());
    console.log('🕐 return_date corrigido:', fimLogico.toISOString());

    // Atualizar a missão
    const updatedMission = await prisma.booking.update({
      where: { id: 8035 },
      data: {
        actual_departure_date: actualDepartureDate,
        actual_return_date: actualReturnDate,
        return_date: fimLogico,
        blocked_until: fimLogico
      }
    });

    console.log('✅ Missão #8035 corrigida com sucesso!');
    console.log('📋 Dados atualizados:', {
      departure_date: updatedMission.departure_date,
      return_date: updatedMission.return_date,
      actual_departure_date: updatedMission.actual_departure_date,
      actual_return_date: updatedMission.actual_return_date,
      blocked_until: updatedMission.blocked_until
    });

  } catch (error) {
    console.error('❌ Erro ao corrigir missão:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMission8035().catch(console.error);
