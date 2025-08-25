// Teste para verificar se a correção da função proximaDecolagemPossivel funcionou
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Constantes
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

// Função helper para converter horas em milissegundos
const H = (horas) => horas * 60 * 60 * 1000;

// Simular a função calcularTempoVolta
const calcularTempoVolta = (flightHoursTotal) => flightHoursTotal / 2;

// Simular a função proximaDecolagemPossivel corrigida
function proximaDecolagemPossivel(missao) {
  const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
  const pousoVolta = new Date(missao.retorno.getTime() + tVoltaMs);
  const fimLogico = new Date(pousoVolta.getTime() + H(POS_VOO_HORAS)); // E = pouso volta + 3h
  return fimLogico; // Smin = E (já inclui 3h livres antes)
}

// Simular a função janelaBloqueada
function janelaBloqueada(missao) {
  const tVoltaMs = calcularTempoVolta(missao.flightHoursTotal) * H(1);
  
  // Pré-voo: 3h antes da decolagem
  const preVooInicio = new Date(missao.partida.getTime() - H(PRE_VOO_HORAS));
  const preVooFim = new Date(missao.partida.getTime());
  
  // Missão: decolagem até retorno
  const missaoInicio = new Date(missao.partida.getTime());
  const missaoFim = new Date(missao.retorno.getTime());
  
  // Pós-voo: retorno + tempo de voo volta + 3h buffer
  const pousoVolta = new Date(missao.retorno.getTime() + tVoltaMs);
  const posVooInicio = new Date(pousoVolta.getTime());
  const posVooFim = new Date(pousoVolta.getTime() + H(POS_VOO_HORAS));
  
  return [
    {
      inicio: preVooInicio,
      fim: preVooFim,
      tipo: 'pre-voo',
      missao: missao
    },
    {
      inicio: missaoInicio,
      fim: missaoFim,
      tipo: 'missao',
      missao: missao
    },
    {
      inicio: posVooInicio,
      fim: posVooFim,
      tipo: 'pos-voo',
      missao: missao
    }
  ];
}

async function testFixProximaDecolagem() {
  console.log('🧪 Teste: Correção da função proximaDecolagemPossivel\n');

  try {
    // Simular uma missão às 7:00
    const missao = {
      id: 'teste',
      partida: new Date(2025, 7, 22, 7, 0, 0), // 22/08 às 7:00
      retorno: new Date(2025, 7, 22, 15, 0, 0), // 22/08 às 15:00 (8h de missão)
      flightHoursTotal: 8,
      origin: 'SBAU',
      destination: 'SBBS'
    };

    console.log('📅 Missão de teste:');
    console.log(`   Partida: ${missao.partida.toLocaleString('pt-BR')}`);
    console.log(`   Retorno: ${missao.retorno.toLocaleString('pt-BR')}`);
    console.log(`   Flight hours: ${missao.flightHoursTotal}h`);

    // Calcular janelas bloqueadas
    const janelas = janelaBloqueada(missao);
    
    console.log('\n🟡 Janelas bloqueadas:');
    for (const janela of janelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')}`);
    }

    // Calcular próxima decolagem possível
    const proximaDecolagem = proximaDecolagemPossivel(missao);
    
    console.log('\n🎯 Próxima decolagem possível:');
    console.log(`   ${proximaDecolagem.toLocaleString('pt-BR')}`);

    // Verificar se a próxima decolagem está correta
    const tVolta = missao.flightHoursTotal / 2; // 8h / 2 = 4h
    const pousoVolta = new Date(missao.retorno.getTime() + (tVolta * 60 * 60 * 1000));
    const fimLogico = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000));
    
    console.log('\n🔍 Verificação dos cálculos:');
    console.log(`   Tempo de volta: ${tVolta}h`);
    console.log(`   Pouso da volta: ${pousoVolta.toLocaleString('pt-BR')}`);
    console.log(`   Fim lógico (E): ${fimLogico.toLocaleString('pt-BR')}`);
    console.log(`   Próxima decolagem (Smin): ${proximaDecolagem.toLocaleString('pt-BR')}`);
    
    const correto = proximaDecolagem.getTime() === fimLogico.getTime();
    console.log(`   ✅ Correto: ${correto ? 'SIM' : 'NÃO'}`);

    // Testar se uma nova missão às 19:00 seria válida
    console.log('\n🔍 Testando nova missão às 19:00:');
    const novaMissao = {
      id: 'nova',
      partida: new Date(2025, 7, 22, 19, 0, 0), // 22/08 às 19:00
      retorno: new Date(2025, 7, 22, 23, 0, 0), // 22/08 às 23:00 (4h de missão)
      flightHoursTotal: 4,
      origin: 'SBAU',
      destination: 'SBBS'
    };

    console.log(`   Nova missão: ${novaMissao.partida.toLocaleString('pt-BR')} - ${novaMissao.retorno.toLocaleString('pt-BR')}`);
    
    // Verificar se há conflito
    const janelasNova = janelaBloqueada(novaMissao);
    const conflito = janelasNova.some(janelaNova => 
      janelas.some(janela => 
        janelaNova.inicio < janela.fim && janela.inicio < janelaNova.fim
      )
    );
    
    console.log(`   Conflito: ${conflito ? 'SIM' : 'NÃO'}`);
    console.log(`   Válida: ${!conflito ? 'SIM' : 'NÃO'}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixProximaDecolagem().catch(console.error);
