// Script simples para testar slots
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSimpleSlots() {
  console.log('🧪 TESTANDO SLOTS SIMPLES');
  console.log('==========================');

  try {
    // Buscar missão 8036
    const mission = await prisma.booking.findUnique({
      where: { id: 8036 }
    });

    if (!mission) {
      console.log('❌ Missão #8036 não encontrada');
      return;
    }

    console.log('🔍 Missão encontrada:');
    console.log('📅 departure_date:', mission.departure_date.toISOString());
    console.log('📅 return_date:', mission.return_date.toISOString());
    console.log('📅 actual_departure_date:', mission.actual_departure_date?.toISOString());
    console.log('📅 actual_return_date:', mission.actual_return_date?.toISOString());

         // Simular geração de slots para 28/08
     const testDate = new Date('2025-08-28');
     console.log('\n🔍 Testando slots para:', testDate.toLocaleDateString('pt-BR'));

     // Verificar janela da missão
     const missionStart = new Date(mission.departure_date);
     const missionEnd = new Date(mission.return_date);
     
     console.log('🔍 Janela da missão:');
     console.log('   Início:', missionStart.toLocaleString('pt-BR'));
     console.log('   Fim:', missionEnd.toLocaleString('pt-BR'));

     // Simular slots de 02:00 às 23:00
     for (let hour = 2; hour <= 23; hour++) {
       const slotStart = new Date(testDate);
       slotStart.setHours(hour, 0, 0, 0);
       
       // Ajustar para horário local (como no backend corrigido)
       slotStart.setTime(slotStart.getTime() - (3 * 60 * 60 * 1000));
       
       const slotEnd = new Date(testDate);
       slotEnd.setHours(hour + 1, 0, 0, 0);
       slotEnd.setTime(slotEnd.getTime() - (3 * 60 * 60 * 1000));

       let status = 'available';
       let reason = '';
       let blockType = '';

       // Verificar se está na janela da missão
       if (slotStart >= missionStart && slotStart < missionEnd) {
         if (hour < 5) {
           status = 'blocked';
           reason = 'Tempo de preparação (-3h)';
           blockType = 'pre-voo';
         } else if (hour >= 5 && hour < 20) {
           status = 'booked';
           reason = 'Missão em andamento';
           blockType = 'missao';
         } else {
           status = 'blocked';
           reason = 'Encerramento/Manutenção (+3h)';
           blockType = 'pos-voo';
         }
       }

      console.log(`🕐 ${hour.toString().padStart(2, '0')}:00 - ${status} - ${reason}`);
    }

  } catch (error) {
    console.error('❌ Erro ao testar:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSimpleSlots().catch(console.error);
