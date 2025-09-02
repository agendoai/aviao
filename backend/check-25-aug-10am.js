// Verificar especificamente a missão às 10:00 em 25/08/2025
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function check25Aug10AM() {
  console.log('🔍 Verificando missão às 10:00 em 25/08/2025...\n');

  try {
    // Buscar missão específica às 10:00
    const mission = await prisma.booking.findFirst({
      where: {
        departure_date: {
          gte: new Date(2025, 7, 25, 10, 0, 0),
          lt: new Date(2025, 7, 25, 10, 1, 0)
        },
        aircraftId: 2 // PR-FOM
      },
      include: {
        user: {
          select: { name: true }
        },
        aircraft: true
      }
    });

    if (!mission) {
      console.log('❌ Nenhuma missão encontrada às 10:00 em 25/08/2025');
      console.log('💡 Crie uma missão para testar o pré-voo');
      return;
    }

    console.log('✅ Missão encontrada:');
    console.log(`   ID: ${mission.id}`);
    console.log(`   Partida: ${mission.departure_date.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${mission.return_date.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${mission.flight_hours}`);
    console.log(`   Status: ${mission.status}`);
    console.log(`   User: ${mission.user.name}`);
    console.log(`   Aircraft: ${mission.aircraft.registration}`);
    console.log('');

    // Testar a lógica
    const H = (horas) => horas * 60 * 60 * 1000;
    const PRE_VOO_HORAS = 3;
    
    // Calcular pré-voo (3h ANTES)
    const preVooStart = new Date(mission.departure_date.getTime() - H(PRE_VOO_HORAS));
    const preVooEnd = new Date(mission.departure_date.getTime());
    
    console.log('🟡 Pré-voo calculado:');
    console.log(`   Início: ${preVooStart.toLocaleString('pt-BR')}`);
    console.log(`   Fim: ${preVooEnd.toLocaleString('pt-BR')}`);
    console.log(`   Decolagem: ${mission.departure_date.toLocaleString('pt-BR')}`);
    
    // Verificar se está correto
    const hoursBefore = (mission.departure_date.getTime() - preVooStart.getTime()) / H(1);
    console.log(`\n✅ Horas antes da decolagem: ${hoursBefore}h`);
    
    if (hoursBefore === 3) {
      console.log('✅ Lógica correta! Pré-voo é 3h ANTES da decolagem');
    } else {
      console.log('❌ Lógica incorreta!');
    }

    // Incluir as funções necessárias
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
      partida: mission.departure_date,
      retorno: mission.return_date,
      flightHoursTotal: mission.flight_hours,
      id: mission.id,
      origin: mission.origin,
      destination: mission.destination
    };

    // Calcular janelas
    const janelas = janelaBloqueada(missao);
    
    console.log('\n🟡 Janelas calculadas:');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Verificar se está correto para 10:00
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
      console.log('💡 Se o frontend não está mostrando isso, o problema é no frontend');
    } else {
      console.log('\n❌ Cálculos incorretos!');
    }

    // Simular o que o frontend deveria mostrar
    console.log('\n🎯 O que o frontend deveria mostrar:');
    console.log('   07:00-09:30 = Pré-voo (amarelo)');
    console.log('   10:00-17:00 = Missão (cinza)');
    console.log('   17:00-20:00 = Pós-voo (laranja)');

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check25Aug10AM().catch(console.error);

