// Corrigir a missão 7317 com os dados corretos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fix25AugMission() {
  console.log('🔧 Corrigindo missão 7317...\n');

  try {
    // Buscar a missão atual
    const currentMission = await prisma.booking.findUnique({
      where: { id: 7317 },
      include: {
        user: { select: { name: true } },
        aircraft: true
      }
    });

    if (!currentMission) {
      console.log('❌ Missão 7317 não encontrada');
      return;
    }

    console.log('📋 Missão atual:');
    console.log(`   ID: ${currentMission.id}`);
    console.log(`   Partida: ${currentMission.departure_date.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${currentMission.return_date.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${currentMission.flight_hours}`);
    console.log(`   Status: ${currentMission.status}`);
    console.log(`   User: ${currentMission.user.name}`);
    console.log(`   Aircraft: ${currentMission.aircraft.registration}`);
    console.log('');

    // Dados corretos baseados na imagem
    const correctReturnDate = new Date(2025, 7, 25, 17, 0, 0); // 17:00
    const correctFlightHours = 1;
    const correctStatus = 'pendente';

    console.log('✅ Dados corretos:');
    console.log(`   Partida: ${currentMission.departure_date.toLocaleString('pt-BR')} (já correto)`);
    console.log(`   Retorno: ${correctReturnDate.toLocaleString('pt-BR')} (corrigir)`);
    console.log(`   Flight hours: ${correctFlightHours} (corrigir)`);
    console.log(`   Status: ${correctStatus} (corrigir)`);
    console.log('');

    // Atualizar a missão
    const updatedMission = await prisma.booking.update({
      where: { id: 7317 },
      data: {
        return_date: correctReturnDate,
        flight_hours: correctFlightHours,
        status: correctStatus
      },
      include: {
        user: { select: { name: true } },
        aircraft: true
      }
    });

    console.log('✅ Missão corrigida:');
    console.log(`   ID: ${updatedMission.id}`);
    console.log(`   Partida: ${updatedMission.departure_date.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${updatedMission.return_date.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${updatedMission.flight_hours}`);
    console.log(`   Status: ${updatedMission.status}`);
    console.log(`   User: ${updatedMission.user.name}`);
    console.log(`   Aircraft: ${updatedMission.aircraft.registration}`);
    console.log('');

    // Testar os cálculos com os dados corretos
    const H = (horas) => horas * 60 * 60 * 1000;
    const PRE_VOO_HORAS = 3;
    
    const calcularTempoVolta = (flightHoursTotal) => flightHoursTotal / 2;
    
    const janelaBloqueada = (missao) => {
      const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
      
      // Pré-voo: 3h ANTES da decolagem (07:00, 08:00, 09:00 para decolagem às 10:00)
      const preVooInicio = new Date(missao.partida.getTime() - H(PRE_VOO_HORAS));
      const preVooFim = new Date(missao.partida.getTime());
      
      // Missão: decolagem até retorno (10:00 até 17:00)
      const missaoInicio = new Date(missao.partida.getTime());
      const missaoFim = new Date(missao.retorno.getTime() + (30 * 60 * 1000));
      
      // Pós-voo: retorno + tempo de voo volta + 3h buffer
      const pousoVolta = new Date(missao.retorno.getTime() + tVoltaMs);
      const posVooInicio = new Date(pousoVolta.getTime());
      const posVooFim = new Date(pousoVolta.getTime() + H(3));
      
      return [
        { inicio: preVooInicio, fim: preVooFim, tipo: 'pre-voo', missao },
        { inicio: missaoInicio, fim: missaoFim, tipo: 'missao', missao },
        { inicio: posVooInicio, fim: posVooFim, tipo: 'pos-voo', missao }
      ];
    };

    // Converter para formato Missao
    const missao = {
      partida: updatedMission.departure_date,
      retorno: updatedMission.return_date,
      flightHoursTotal: updatedMission.flight_hours,
      id: updatedMission.id,
      origin: updatedMission.origin,
      destination: updatedMission.destination
    };

    // Calcular janelas
    const janelas = janelaBloqueada(missao);
    
    console.log('🟡 Janelas calculadas (após correção):');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Verificar se está correto
    const expectedPreVooStart = new Date(2025, 7, 25, 7, 0, 0); // 07:00
    const expectedPreVooEnd = new Date(2025, 7, 25, 10, 0, 0); // 10:00
    const expectedMissaoStart = new Date(2025, 7, 25, 10, 0, 0); // 10:00
    const expectedMissaoEnd = new Date(2025, 7, 25, 17, 30, 0); // 17:30

    console.log('\n📋 Verificação:');
    console.log(`   Pré-voo esperado: ${expectedPreVooStart.toLocaleString('pt-BR')} - ${expectedPreVooEnd.toLocaleString('pt-BR')}`);
    console.log(`   Pré-voo calculado: ${janelas[0].inicio.toLocaleString('pt-BR')} - ${janelas[0].fim.toLocaleString('pt-BR')}`);
    console.log(`   Missão esperada: ${expectedMissaoStart.toLocaleString('pt-BR')} - ${expectedMissaoEnd.toLocaleString('pt-BR')}`);
    console.log(`   Missão calculada: ${janelas[1].inicio.toLocaleString('pt-BR')} - ${janelas[1].fim.toLocaleString('pt-BR')}`);

    const preVooCorrect = janelas[0].inicio.getTime() === expectedPreVooStart.getTime() && 
                         janelas[0].fim.getTime() === expectedPreVooEnd.getTime();
    const missaoCorrect = janelas[1].inicio.getTime() === expectedMissaoStart.getTime() && 
                         janelas[1].fim.getTime() === expectedMissaoEnd.getTime();

    if (preVooCorrect && missaoCorrect) {
      console.log('\n✅ Cálculos corretos!');
      console.log('🎯 Agora o frontend deve mostrar:');
      console.log('   07:00-09:30 = Pré-voo (amarelo)');
      console.log('   10:00-17:00 = Missão (cinza)');
      console.log('   17:00-20:00 = Pós-voo (laranja)');
    } else {
      console.log('\n❌ Cálculos ainda incorretos!');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fix25AugMission().catch(console.error);
