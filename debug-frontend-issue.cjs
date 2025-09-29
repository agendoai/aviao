const { PrismaClient } = require('@prisma/client');
const { calcularJanelasBloqueadas, bookingToMissao, janelaToTimeSlot, hasOverlap } = require('./backend/src/services/missionValidator.ts');

const prisma = new PrismaClient();

async function debugFrontendIssue() {
  console.log('🔍 DEBUG: Investigando problema de marcação de slots no dia errado');
  console.log('📅 Cenário: Missão de 5h às 5h do dia seguinte');
  
  try {
    // Simular uma missão de 5h às 5h do dia seguinte
    const mockBooking = {
      id: 999,
      aircraftId: 2,
      origin: 'SBSP',
      destination: 'SBRJ',
      departure_date: new Date('2025-01-27T05:00:00.000Z'), // 5h do dia 27
      return_date: new Date('2025-01-28T05:00:00.000Z'),    // 5h do dia 28
      actual_departure_date: new Date('2025-01-27T05:00:00.000Z'),
      actual_return_date: new Date('2025-01-28T05:00:00.000Z'),
      departure_time: '05:00',
      return_time: '05:00',
      status: 'confirmada',
      flight_hours: 2,
      passengers: 4,
      value: 5000,
      user: { name: 'Teste' }
    };

    console.log('\n📊 Dados da missão simulada:');
    console.log('   Partida:', mockBooking.departure_date.toISOString());
    console.log('   Retorno:', mockBooking.return_date.toISOString());
    console.log('   Partida Local:', mockBooking.departure_date.toLocaleString('pt-BR'));
    console.log('   Retorno Local:', mockBooking.return_date.toLocaleString('pt-BR'));

    // Converter booking para missão
    const missao = bookingToMissao(mockBooking);
    console.log('\n🎯 Missão convertida:');
    console.log('   Partida:', missao.partida.toISOString());
    console.log('   Retorno:', missao.retorno.toISOString());
    console.log('   Actual Partida:', missao.actualDeparture?.toISOString());
    console.log('   Actual Retorno:', missao.actualReturn?.toISOString());

    // Calcular janelas bloqueadas
    const janelas = calcularJanelasBloqueadas([missao]);
    console.log('\n🚫 Janelas bloqueadas calculadas:', janelas.length);
    
    janelas.forEach((janela, index) => {
      console.log(`   ${index + 1}. ${janela.tipo}:`);
      console.log(`      Início: ${janela.inicio.toISOString()} (${janela.inicio.toLocaleString('pt-BR')})`);
      console.log(`      Fim: ${janela.fim.toISOString()} (${janela.fim.toLocaleString('pt-BR')})`);
      console.log(`      Dia: ${janela.inicio.getDate()}/${janela.inicio.getMonth() + 1}`);
    });

    // Simular geração de slots para os dias 27 e 28
    console.log('\n📅 Simulando geração de slots:');
    
    // Dia 27 (dia da partida)
    console.log('\n📅 DIA 27 (dia da partida):');
    const dia27 = new Date('2025-01-27T00:00:00.000Z');
    
    // Testar slots específicos do dia 27
    const slotsTesteDia27 = [
      { hora: 21, minuto: 0, nome: '21:00' },  // 9 PM
      { hora: 21, minuto: 30, nome: '21:30' }, // 9:30 PM
      { hora: 22, minuto: 0, nome: '22:00' },  // 10 PM
      { hora: 22, minuto: 30, nome: '22:30' }, // 10:30 PM
      { hora: 23, minuto: 0, nome: '23:00' },  // 11 PM
      { hora: 23, minuto: 30, nome: '23:30' }  // 11:30 PM
    ];

    slotsTesteDia27.forEach(slot => {
      const slotStart = new Date(dia27);
      slotStart.setHours(slot.hora, slot.minuto, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

      // Verificar conflito
      const conflictingWindow = janelas.find(janela => 
        hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })
      );

      let status = 'available';
      let blockType = '';
      if (conflictingWindow) {
        const timeSlot = janelaToTimeSlot(conflictingWindow);
        status = timeSlot.status;
        blockType = timeSlot.blockType || '';
      }

      console.log(`   ${slot.nome}: ${status} ${blockType ? `(${blockType})` : ''}`);
    });

    // Dia 28 (dia do retorno)
    console.log('\n📅 DIA 28 (dia do retorno):');
    const dia28 = new Date('2025-01-28T00:00:00.000Z');
    
    // Testar slots específicos do dia 28
    const slotsTesteDia28 = [
      { hora: 0, minuto: 0, nome: '00:00' },   // Meia-noite
      { hora: 1, minuto: 0, nome: '01:00' },   // 1 AM
      { hora: 2, minuto: 0, nome: '02:00' },   // 2 AM
      { hora: 3, minuto: 0, nome: '03:00' },   // 3 AM
      { hora: 4, minuto: 0, nome: '04:00' },   // 4 AM
      { hora: 5, minuto: 0, nome: '05:00' },   // 5 AM (retorno)
      { hora: 6, minuto: 0, nome: '06:00' },   // 6 AM
      { hora: 7, minuto: 0, nome: '07:00' },   // 7 AM
      { hora: 8, minuto: 0, nome: '08:00' }    // 8 AM
    ];

    slotsTesteDia28.forEach(slot => {
      const slotStart = new Date(dia28);
      slotStart.setHours(slot.hora, slot.minuto, 0, 0);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

      // Verificar conflito
      const conflictingWindow = janelas.find(janela => 
        hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })
      );

      let status = 'available';
      let blockType = '';
      if (conflictingWindow) {
        const timeSlot = janelaToTimeSlot(conflictingWindow);
        status = timeSlot.status;
        blockType = timeSlot.blockType || '';
      }

      console.log(`   ${slot.nome}: ${status} ${blockType ? `(${blockType})` : ''}`);
    });

    // Análise específica do problema
    console.log('\n🔍 ANÁLISE DO PROBLEMA:');
    console.log('   O usuário reporta que slots de 21:00 às 23:30 do dia 27 estão sendo marcados como bloqueados');
    console.log('   Mas esses slots deveriam estar disponíveis, pois a missão só começa às 5h do dia 27');
    console.log('   Vamos verificar se há alguma janela bloqueada que está afetando esses horários...');

    // Verificar especificamente o slot 21:00 do dia 27
    const slot2100 = new Date('2025-01-27T21:00:00.000Z');
    const slot2130 = new Date('2025-01-27T21:30:00.000Z');
    
    console.log('\n🎯 Análise detalhada do slot 21:00-21:30 do dia 27:');
    console.log('   Slot início:', slot2100.toISOString());
    console.log('   Slot fim:', slot2130.toISOString());
    
    janelas.forEach((janela, index) => {
      const overlap = hasOverlap(
        { start: slot2100, end: slot2130 }, 
        { start: janela.inicio, end: janela.fim }
      );
      
      console.log(`   Janela ${index + 1} (${janela.tipo}): ${overlap ? 'CONFLITO' : 'OK'}`);
      if (overlap) {
        console.log(`      Janela: ${janela.inicio.toISOString()} até ${janela.fim.toISOString()}`);
        console.log(`      Slot:   ${slot2100.toISOString()} até ${slot2130.toISOString()}`);
      }
    });

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFrontendIssue();