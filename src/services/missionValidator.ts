// Validador inteligente de missões para o frontend
// Replica a lógica do backend para validação em tempo real no calendário

export interface Missao {
  partida: Date;           // início do pré-voo (04:00)
  retorno: Date;           // fim do pós-voo (21:00)
  actualDeparture?: Date;  // decolagem real (07:00)
  actualReturn?: Date;     // retorno real (17:00)
  flightHoursTotal: number; // horas totais (ida+volta)
  id?: number;
  origin?: string;
  destination?: string;
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
  tipo: 'pre-voo' | 'missao' | 'pos-voo';
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
  return [
    {
      inicio: new Date(m.partida.getTime()), // 04:00 (início pré-voo)
      fim: new Date(m.partida.getTime() + H(PRE_VOO_HORAS)), // 07:00 (fim pré-voo)
      tipo: 'pre-voo',
      missao: m
    },
    {
      inicio: new Date(m.partida.getTime() + H(PRE_VOO_HORAS)), // 07:00 (início missão)
      fim: new Date(m.retorno.getTime() - H(POS_VOO_HORAS)), // 18:00 (fim missão = return_date - 3h)
      tipo: 'missao',
      missao: m
    },
    {
      inicio: new Date(m.retorno.getTime() - H(POS_VOO_HORAS)), // 18:00 (início pós-voo)
      fim: new Date(m.retorno.getTime()), // 21:00 (fim pós-voo)
      tipo: 'pos-voo',
      missao: m
    }
  ];
}

/**
 * Menor início possível DEPOIS de uma missão (para sugerir no UI)
 * E = retorno + tVolta + 3h (fim lógico da missão)
 * Smin = E (próxima decolagem possível - já inclui 3h livres antes)
 */
export function proximaDecolagemPossivel(m: Missao): Date {
  const tVoltaMs = calcularTempoVolta(m.flightHoursTotal) * H(1);
  const pousoVolta = new Date(m.retorno.getTime() + tVoltaMs);
  const fimLogico = new Date(pousoVolta.getTime() + H(POS_VOO_HORAS)); // E = pouso volta + 3h
  return fimLogico; // Smin = E (já inclui 3h livres antes)
}

/**
 * Verifica se há interseção entre dois intervalos
 */
function temInterseção(inicio1: Date, fim1: Date, inicio2: Date, fim2: Date): boolean {
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
  const departureDateTime = new Date(`${booking.departure_date}T${booking.departure_time}`);
  const returnDateTime = new Date(`${booking.return_date}T${booking.return_time}`);
  
  return {
    id: booking.id,
    partida: departureDateTime,
    retorno: returnDateTime,
    flightHoursTotal: booking.flight_hours || 2, // Padrão 2 horas se não especificado
    origin: booking.origin,
    destination: booking.destination
  };
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
  return validarMissaoCompleta(missaoTeste, missoes);
}
