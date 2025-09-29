// Validador inteligente de missões para o frontend
// Replica a lógica do backend para validação em tempo real no calendário

export interface Missao {
  partida: Date;           // início do pré-voo (04:00)
  retorno: Date;           // fim do pós-voo (21:00)
  actualDeparture?: Date;  // decolagem real (07:00)
  actualReturn?: Date;     // retorno real (17:00)
  flightHoursTotal: number; // horas totais (ida+volta)
  id?: number;
  origin?: string;         // origem (Base)
  destination?: string;    // destino principal
  secondaryDestination?: string; // destino secundário
  departureSecondaryTime?: Date; // horário de saída do destino principal para o secundário
  departureFromSecondaryTime?: Date; // horário de saída do destino secundário para a base
  hasSecondaryDestination?: boolean; // indica se a missão tem destino secundário
}

export interface ValidationResult {
  valido: boolean;
  mensagem: string;
  sugerido?: Date;
  proximaDisponibilidade?: Date;
  conflitoCom?: Missao;
}

export interface JanelaBloqueada {
  inicio: Date;
  fim: Date;
  tipo: 'pre-voo' | 'missao' | 'missao-secundaria' | 'missao-retorno' | 'pos-voo';
  missao: Missao;
}

// Constantes
const H = (n: number) => n * 60 * 60 * 1000; // Converte horas para milissegundos
const PRE_VOO_HORAS = 3;
const POS_VOO_HORAS = 3;
const PROXIMA_MISSAO_HORAS = 3;

/**
 * Calcula o tempo de voo de volta baseado no tempo total
 */
export function calcularTempoVolta(flightHoursTotal: number): number {
  return flightHoursTotal / 2;
}

/**
 * Janela bloqueada completa de UMA missão existente (para pintar no calendário)
 * m.partida já é o início do pré-voo (04:00), m.retorno já é o fim do pós-voo (21:00)
 */
export function janelaBloqueada(m: Missao): JanelaBloqueada[] {
  // Validar se a missão tem datas válidas
  if (isNaN(m.partida.getTime()) || isNaN(m.retorno.getTime())) {
    console.error('❌ Missão com datas inválidas:', {
      partida: m.partida.toISOString(),
      retorno: m.retorno.toISOString(),
      missao: m
    });
    return [];
  }
  
  // Janelas padrão (sempre presentes)
  const janelas: JanelaBloqueada[] = [
    {
      inicio: new Date(m.partida.getTime()), // início pré-voo
      fim: new Date(m.partida.getTime() + H(PRE_VOO_HORAS)), // fim pré-voo
      tipo: 'pre-voo' as const,
      missao: m
    }
  ];
  
  // Adicionar janelas baseadas no tipo de missão (com ou sem destino secundário)
  if (m.hasSecondaryDestination && m.departureSecondaryTime && m.departureFromSecondaryTime) {
    // Missão com destino secundário: Base → Principal → Secundário → Base
    
    // Trecho 1: Base → Destino Principal
    janelas.push({
      inicio: new Date(m.partida.getTime() + H(PRE_VOO_HORAS)), // fim do pré-voo
      fim: new Date(m.departureSecondaryTime.getTime()), // chegada ao destino principal
      tipo: 'missao' as const,
      missao: m
    });
    
    // Trecho 2: Destino Principal → Destino Secundário
    janelas.push({
      inicio: new Date(m.departureSecondaryTime.getTime()), // saída do destino principal
      fim: new Date(m.departureFromSecondaryTime.getTime()), // chegada ao destino secundário
      tipo: 'missao-secundaria' as const,
      missao: m
    });
    
    // Trecho 3: Destino Secundário → Base
    janelas.push({
      inicio: new Date(m.departureFromSecondaryTime.getTime()), // saída do destino secundário
      fim: new Date(m.retorno.getTime() - H(POS_VOO_HORAS)), // chegada à base
      tipo: 'missao-retorno' as const,
      missao: m
    });
  } else {
    // Missão padrão: Base → Destino Principal → Base
    janelas.push({
      inicio: new Date(m.partida.getTime() + H(PRE_VOO_HORAS)), // fim do pré-voo
      fim: new Date(m.retorno.getTime() - H(POS_VOO_HORAS)), // início do pós-voo
      tipo: 'missao' as const,
      missao: m
    });
  }
  
  // Pós-voo (sempre presente)
  // CORRIGIDO: m.retorno já é o fim do pós-voo (inclui tempo de voo volta + 3h)
  // Então o pós-voo é 3h antes do fim
  janelas.push({
    inicio: new Date(m.retorno.getTime() - H(POS_VOO_HORAS)), // início pós-voo
    fim: new Date(m.retorno.getTime()), // fim pós-voo (já inclui tempo de voo volta + 3h)
    tipo: 'pos-voo' as const,
    missao: m
  });
  
  // Validar se todas as janelas têm datas válidas
  const janelasValidas = janelas.filter(janela => {
    const valida = !isNaN(janela.inicio.getTime()) && !isNaN(janela.fim.getTime());
    if (!valida) {
      console.error('❌ Janela com datas inválidas:', {
        tipo: janela.tipo,
        inicio: janela.inicio.toISOString(),
        fim: janela.fim.toISOString()
      });
    }
    return valida;
  });
  
  return janelasValidas;
}

/**
 * Menor início possível DEPOIS de uma missão (para sugerir no UI)
 * CORRIGIDO: m.retorno já é o fim do pós-voo, então a próxima decolagem é retorno + 3h
 */
export function proximaDecolagemPossivel(m: Missao): Date {
  // m.retorno já é o fim do pós-voo (21:00), então a próxima decolagem possível é 3h depois
  const proximaDecolagem = new Date(m.retorno.getTime() + H(PROXIMA_MISSAO_HORAS));
  return proximaDecolagem;
}

/**
 * Verifica se há interseção entre dois intervalos
 */
function temInterseção(inicio1: Date, fim1: Date, inicio2: Date, fim2: Date): boolean {
  // Validar se as datas são válidas
  if (isNaN(inicio1.getTime()) || isNaN(fim1.getTime()) || isNaN(inicio2.getTime()) || isNaN(fim2.getTime())) {
    console.error('❌ Datas inválidas detectadas:', {
      inicio1: inicio1.toISOString(),
      fim1: fim1.toISOString(),
      inicio2: inicio2.toISOString(),
      fim2: fim2.toISOString()
    });
    return false;
  }
  
  return inicio1 < fim2 && inicio2 < fim1;
}

/**
 * Checa se um início candidato é válido (considerando 3h de pré-voo)
 */
export function inicioValido(candidatoInicio: Date, missoes: Missao[]): ValidationResult {
  const preInicio = new Date(candidatoInicio.getTime() - H(PRE_VOO_HORAS)); // precisa estar livre
  
  // Verifica invasão do pré-voo com JANELAS existentes
  for (const m of missoes) {
    const janelas = janelaBloqueada(m);
    
    for (const janela of janelas) {
      const invade = temInterseção(preInicio, candidatoInicio, janela.inicio, janela.fim);
      
      if (invade) {
        const smin = proximaDecolagemPossivel(m);
        const tipoBloqueio = janela.tipo === 'pre-voo' ? 'Tempo de preparação (-3h)' :
                           janela.tipo === 'missao' ? 'Missão em andamento' :
                           'Encerramento/Manutenção (+3h)';
        
        return {
          valido: false,
          mensagem: `⛔ Indisponível: só pode decolar a partir de ${smin.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${smin.toLocaleDateString('pt-BR')})`,
          sugerido: smin,
          proximaDisponibilidade: smin,
          conflitoCom: m
        };
      }
    }
  }
  return { 
    valido: true, 
    mensagem: "✅ Início válido", 
    sugerido: candidatoInicio 
  };
}

/**
 * Valida uma missão completa (partida e retorno)
 */
export function validarMissaoCompleta(
  missaoProposta: Missao, 
  missoesExistentes: Missao[]
): ValidationResult {
  // Validar se o retorno é posterior à partida
  if (missaoProposta.retorno <= missaoProposta.partida) {
    return {
      valido: false,
      mensagem: "❌ Horário de retorno deve ser posterior ao horário de partida"
    };
  }
  
  // Validar duração mínima
  const duracaoMs = missaoProposta.retorno.getTime() - missaoProposta.partida.getTime();
  const duracaoMinima = 1 * 60 * 1000; // 1 minuto
  
  if (duracaoMs < duracaoMinima) {
    return {
      valido: false,
      mensagem: "❌ Missão muito curta (mínimo 1 minuto)"
    };
  }
  
  // Validar destino secundário, se estiver ativado
  if (missaoProposta.hasSecondaryDestination) {
    // Verificar se os horários do destino secundário foram definidos
    if (!missaoProposta.departureSecondaryTime || !missaoProposta.departureFromSecondaryTime) {
      return {
        valido: false,
        mensagem: "❌ Os horários do destino secundário devem ser definidos"
      };
    }

    // Validar se o horário de saída do destino principal é após a chegada
    const chegadaDestinoPrincipal = new Date(missaoProposta.partida.getTime() + H(PRE_VOO_HORAS));
    if (missaoProposta.departureSecondaryTime < chegadaDestinoPrincipal) {
      return {
        valido: false,
        mensagem: "❌ O horário de saída do destino principal deve ser após a chegada"
      };
    }

    // Validar se o horário de saída do destino secundário é após a chegada
    if (missaoProposta.departureFromSecondaryTime < missaoProposta.departureSecondaryTime) {
      return {
        valido: false,
        mensagem: "❌ O horário de saída do destino secundário deve ser após a chegada"
      };
    }

    // Validar se o retorno à base é após a saída do destino secundário
    const chegadaBase = new Date(missaoProposta.retorno.getTime() - H(POS_VOO_HORAS));
    if (chegadaBase < missaoProposta.departureFromSecondaryTime) {
      return {
        valido: false,
        mensagem: "❌ O horário de chegada à base deve ser após a saída do destino secundário"
      };
    }
  }
  
  // Validar início da missão
  const validacaoInicio = inicioValido(missaoProposta.partida, missoesExistentes);
  if (!validacaoInicio.valido) {
    return validacaoInicio;
  }
  
  // Validar se a missão proposta não conflita com nenhuma existente
  const janelasProposta = janelaBloqueada(missaoProposta);
  
  for (const m of missoesExistentes) {
    const janelasExistente = janelaBloqueada(m);
    
    for (const janelaProposta of janelasProposta) {
      for (const janelaExistente of janelasExistente) {
        const conflita = temInterseção(
          janelaProposta.inicio, 
          janelaProposta.fim, 
          janelaExistente.inicio, 
          janelaExistente.fim
        );
        
        if (conflita) {
          const smin = proximaDecolagemPossivel(m);
          const tipoConflito = janelaExistente.tipo === 'pre-voo' ? 'Tempo de preparação (-3h)' :
                             janelaExistente.tipo === 'missao' ? 'Missão em andamento' :
                             'Encerramento/Manutenção (+3h)';
          
          return {
            valido: false,
            mensagem: `⛔ Conflito: ${tipoConflito}. Próxima decolagem possível: ${smin.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} (${smin.toLocaleDateString('pt-BR')})`,
            sugerido: smin,
            proximaDisponibilidade: smin,
            conflitoCom: m
          };
        }
      }
    }
  }
  
  return { 
    valido: true, 
    mensagem: "✅ Missão válida", 
    sugerido: missaoProposta.partida 
  };
}

/**
 * Calcula todas as janelas bloqueadas para uma aeronave
 */
export function calcularJanelasBloqueadas(missoes: Missao[]): JanelaBloqueada[] {
  const todasJanelas: JanelaBloqueada[] = [];
  
  for (const missao of missoes) {
    const janelas = janelaBloqueada(missao);
    todasJanelas.push(...janelas);
  }
  
  return todasJanelas.sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

/**
 * Encontra o próximo horário disponível após uma missão
 */
export function proximaDisponibilidade(missao: Missao): Date {
  return proximaDecolagemPossivel(missao);
}

/**
 * Sugere horários disponíveis para uma missão
 */
export function sugerirHorarios(
  horarioDesejado: Date,
  duracaoMissao: number,
  missoesExistentes: Missao[]
): Date[] {
  const sugestoes: Date[] = [];
  let horarioAtual = new Date(horarioDesejado);
  
  // Tentar os próximos 10 horários possíveis
  for (let i = 0; i < 10; i++) {
    const missaoTeste: Missao = {
      partida: horarioAtual,
      retorno: new Date(horarioAtual.getTime() + (duracaoMissao * H(1))),
      flightHoursTotal: duracaoMissao
    };
    
    const validacao = validarMissaoCompleta(missaoTeste, missoesExistentes);
    
    if (validacao.valido) {
      sugestoes.push(horarioAtual);
      if (sugestoes.length >= 3) break; // Máximo 3 sugestões
    } else if (validacao.sugerido) {
      horarioAtual = validacao.sugerido;
    } else {
      // Avançar 2 horas se não houver sugestão
      horarioAtual = new Date(horarioAtual.getTime() + H(2));
    }
  }
  
  return sugestoes;
}

/**
 * Converte dados de booking do Supabase para o formato Missao
 */
export function converterBookingParaMissao(booking: any): Missao {
  // Validar se os dados estão presentes
  if (!booking.departure_date || !booking.departure_time || !booking.return_date || !booking.return_time) {
    console.error('❌ Dados de booking incompletos:', booking);
    throw new Error('Dados de booking incompletos');
  }
  
  // Criar datas com validação
  const departureDateTime = new Date(`${booking.departure_date}T${booking.departure_time}`);
  const returnDateTime = new Date(`${booking.return_date}T${booking.return_time}`);
  
  // Validar se as datas foram criadas corretamente
  if (isNaN(departureDateTime.getTime()) || isNaN(returnDateTime.getTime())) {
    console.error('❌ Datas inválidas criadas:', {
      departure_date: booking.departure_date,
      departure_time: booking.departure_time,
      return_date: booking.return_date,
      return_time: booking.return_time,
      departureDateTime: departureDateTime.toISOString(),
      returnDateTime: returnDateTime.toISOString()
    });
    throw new Error('Datas inválidas criadas');
  }
  
  const missao = {
    id: booking.id,
    partida: departureDateTime,
    retorno: returnDateTime,
    flightHoursTotal: booking.flight_hours || 2, // Padrão 2 horas se não especificado
    origin: booking.origin,
    destination: booking.destination
  };
  
  return missao;
}

/**
 * Valida um horário específico no calendário
 */
export function validarHorarioCalendario(
  horarioCandidato: Date,
  bookings: any[],
  duracaoMissao: number = 2
): ValidationResult {
  // Converter bookings para missões
  const missoes = bookings.map(converterBookingParaMissao);
  
  // Criar missão de teste
  const missaoTeste: Missao = {
    partida: horarioCandidato,
    retorno: new Date(horarioCandidato.getTime() + (duracaoMissao * H(1))),
    flightHoursTotal: duracaoMissao
  };
  
  // Validar a missão completa
  const resultado = validarMissaoCompleta(missaoTeste, missoes);
  
  return resultado;
}
