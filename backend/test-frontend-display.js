// Teste para simular o que o frontend está mostrando
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Constantes
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;

// Função helper para converter horas em milissegundos
const H = (horas) => horas * 60 * 60 * 1000;

// Simular a função janelaBloqueada
function janelaBloqueada(missao) {
  const tVoltaMs = (missao.flightHoursTotal / 2) * H(1);
  
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

async function testFrontendDisplay() {
  console.log('🧪 Teste: Simulando o que o frontend está mostrando\n');

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

    console.log(`📋 Total de missões: ${bookings.length}`);
    
    // Converter para interface Missao
    const missoes = bookings.map(booking => ({
      id: booking.id,
      partida: new Date(booking.departure_date),
      retorno: new Date(booking.return_date),
      flightHoursTotal: booking.flight_hours,
      origin: booking.origin,
      destination: booking.destination
    }));

    // Calcular todas as janelas bloqueadas
    const todasJanelas = [];
    for (const missao of missoes) {
      const janelas = janelaBloqueada(missao);
      todasJanelas.push(...janelas);
    }

    console.log('\n🟡 Todas as janelas bloqueadas:');
    for (const janela of todasJanelas) {
      console.log(`   ${janela.tipo}: ${janela.inicio.toLocaleString('pt-BR')} - ${janela.fim.toLocaleString('pt-BR')} (Missão ${janela.missao.id})`);
    }

    // Simular slots do dia 22/08 (dia da missão 8030)
    console.log('\n🔍 Simulando slots do dia 22/08:');
    const dia22 = new Date(2025, 7, 22); // 22/08
    
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotTime = new Date(dia22);
        slotTime.setHours(hour, minute, 0, 0);
        
        let status = 'available';
        let reason = '';
        let blockType = '';
        let missaoId = '';
        
        // Verificar em qual janela o slot está
        for (const janela of todasJanelas) {
          if (slotTime >= janela.inicio && slotTime < janela.fim) {
            switch (janela.tipo) {
              case 'pre-voo':
                status = 'blocked';
                reason = 'Tempo de preparação (-3h)';
                blockType = 'pre-voo';
                missaoId = janela.missao.id;
                break;
              case 'missao':
                status = 'booked';
                reason = 'Missão em andamento';
                blockType = 'missao';
                missaoId = janela.missao.id;
                break;
              case 'pos-voo':
                status = 'blocked';
                reason = 'Encerramento/Manutenção (+3h)';
                blockType = 'pos-voo';
                missaoId = janela.missao.id;
                break;
            }
            break;
          }
        }
        
        if (status !== 'available') {
          const icon = blockType === 'pre-voo' ? '🟡' : 
                       blockType === 'missao' ? '⚫' : 
                       blockType === 'pos-voo' ? '🟠' : '🔴';
          
          const timeStr = slotTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          console.log(`   ${icon} ${timeStr}: ${status} (${blockType}) - ${reason} [Missão ${missaoId}]`);
        }
      }
    }

    // Verificar especificamente os horários problemáticos
    console.log('\n🔍 Verificando horários específicos:');
    const problemTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
    
    for (const timeStr of problemTimes) {
      const [hour, minute] = timeStr.split(':').map(Number);
      const slotTime = new Date(dia22);
      slotTime.setHours(hour, minute, 0, 0);
      
      let status = 'available';
      let reason = '';
      let blockType = '';
      let missaoId = '';
      
      for (const janela of todasJanelas) {
        if (slotTime >= janela.inicio && slotTime < janela.fim) {
          switch (janela.tipo) {
            case 'pre-voo':
              status = 'blocked';
              reason = 'Tempo de preparação (-3h)';
              blockType = 'pre-voo';
              missaoId = janela.missao.id;
              break;
            case 'missao':
              status = 'booked';
              reason = 'Missão em andamento';
              blockType = 'missao';
              missaoId = janela.missao.id;
              break;
            case 'pos-voo':
              status = 'blocked';
              reason = 'Encerramento/Manutenção (+3h)';
              blockType = 'pos-voo';
              missaoId = janela.missao.id;
              break;
          }
          break;
        }
      }
      
      const icon = status === 'available' ? '🟢' : 
                   blockType === 'pre-voo' ? '🟡' : 
                   blockType === 'missao' ? '⚫' : 
                   blockType === 'pos-voo' ? '🟠' : '🔴';
      
      console.log(`   ${icon} ${timeStr}: ${status} (${blockType}) - ${reason} [Missão ${missaoId}]`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendDisplay().catch(console.error);
