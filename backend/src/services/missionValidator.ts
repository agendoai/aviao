// Validador inteligente de missões com janelas de bloqueio
// Regras: pré-voo (-3h), missão (ida+volta), pós-voo (+3h), próximo voo (+3h)

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
 * Converte uma data para o início do dia (00:00:00)
 */
function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/**
 * Converte uma data para o fim do dia (23:59:59)
 */
function fimDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59, 999);
}

/**
 * Calcula o tempo de voo de volta baseado no tempo total
 */
export function calcularTempoVolta(flightHoursTotal: number): number {
  return flightHoursTotal / 2;
}

/**
 * Janela bloqueada completa de UMA missão existente (para pintar no calendário)
 * m.partida já é o início do pré-voo (04:00), m.retorno já é o fim do pós-voo (21:00)
 * USAR APENAS departure_date e return_date que já estão calculados!
 */
export function janelaBloqueada(m: Missao): JanelaBloqueada[] {
  // m.partida já é o início do pré-voo (04:00)
  // m.retorno já é o fim do pós-voo (21:00)
  // USAR APENAS departure_date e return_date que já estão calculados!
  
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
 * CORRIGIDA: m.retorno já é o fim do pós-voo, então a próxima decolagem é retorno + 3h
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
  
  // VALIDAÇÃO PRIORITÁRIA: Verificar se há missões no caminho entre partida e retorno
  const validacaoMissaoNoCaminho = validarMissaoNoCaminho(missaoProposta, missoesExistentes);
  if (!validacaoMissaoNoCaminho.valido) {
    return validacaoMissaoNoCaminho;
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
    sugerido: missaoProposta.partida,
    proximaDisponibilidade: new Date(missaoProposta.retorno.getTime() + (3 * 60 * 60 * 1000)) // 3h após o retorno
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
 * Verifica se há missões no caminho entre partida e retorno de uma missão proposta
 * Esta validação é específica para verificar se existem missões que impedem a criação de uma missão
 * CORRIGIDA: Agora só considera conflito quando há sobreposição real de horários
 */
export function validarMissaoNoCaminho(
  missaoProposta: Missao,
  missoesExistentes: Missao[]
): ValidationResult {
  // Se não há missões existentes, não há conflito
  if (missoesExistentes.length === 0) {
    return { valido: true, mensagem: "✅ Nenhuma missão existente no caminho" };
  }

  // Encontrar missões que realmente sobrepõem com a missão proposta
  const missoesConflitantes = missoesExistentes.filter(missao => {
    // Verificar sobreposição real usando as janelas bloqueadas
    const janelasProposta = janelaBloqueada(missaoProposta);
    const janelasExistente = janelaBloqueada(missao);
    
    // Verificar se há sobreposição entre as janelas
    for (const janelaProposta of janelasProposta) {
      for (const janelaExistente of janelasExistente) {
        if (temInterseção(
          janelaProposta.inicio, 
          janelaProposta.fim, 
          janelaExistente.inicio, 
          janelaExistente.fim
        )) {
          return true; // Há sobreposição real
        }
      }
    }
    
    return false; // Não há sobreposição
  });

  if (missoesConflitantes.length === 0) {
    return { valido: true, mensagem: "✅ Nenhuma missão conflitante no caminho" };
  }

  // Ordenar missões por data de partida para melhor apresentação
  const missoesOrdenadas = [...missoesConflitantes].sort((a, b) => 
    a.partida.getTime() - b.partida.getTime()
  );

  // Retornar a primeira missão que está em conflito
  const primeiraMissaoConflitante = missoesOrdenadas[0];
  
  return {
    valido: false,
    mensagem: `⛔ CONFLITO DE HORÁRIOS! Existe uma missão conflitante: ${primeiraMissaoConflitante.origin || 'N/A'} → ${primeiraMissaoConflitante.destination || 'N/A'} (${primeiraMissaoConflitante.partida.toLocaleDateString('pt-BR')} - ${primeiraMissaoConflitante.retorno.toLocaleDateString('pt-BR')})`,
    conflitoCom: primeiraMissaoConflitante
  };
}

/**
 * Verifica se uma missão proposta "atropela" outras missões existentes
 * Uma missão atropela quando cria gaps que impedem outras missões
 * Exemplo: missão dia 25, proposta dia 23-27 (atropela a missão do dia 25)
 */
export function validarAtropelamentoMissao(
  missaoProposta: Missao,
  missoesExistentes: Missao[]
): ValidationResult {
  // Primeiro, verificar se há missões no caminho
  const validacaoCaminho = validarMissaoNoCaminho(missaoProposta, missoesExistentes);
  if (!validacaoCaminho.valido) {
    return validacaoCaminho;
  }

  // Se não há missões existentes, não há atropelamento
  if (missoesExistentes.length === 0) {
    return { valido: true, mensagem: "✅ Nenhuma missão existente para atropelar" };
  }

  // Encontrar missões que estão dentro do período da missão proposta
  const missoesDentroDoPeriodo = missoesExistentes.filter(missao => {
    // Verificar se a missão existente está dentro do período da missão proposta
    const missaoInicio = inicioDoDia(missao.partida);
    const missaoFim = fimDoDia(missao.retorno);
    const propostaInicio = inicioDoDia(missaoProposta.partida);
    const propostaFim = fimDoDia(missaoProposta.retorno);

    // A missão está dentro se:
    // 1. O início da missão existente está dentro do período da proposta, OU
    // 2. O fim da missão existente está dentro do período da proposta, OU
    // 3. A missão existente contém completamente o período da proposta
    return (missaoInicio >= propostaInicio && missaoInicio <= propostaFim) ||
           (missaoFim >= propostaInicio && missaoFim <= propostaFim) ||
           (missaoInicio <= propostaInicio && missaoFim >= propostaFim);
  });

  if (missoesDentroDoPeriodo.length === 0) {
    return { valido: true, mensagem: "✅ Nenhuma missão no período para atropelar" };
  }

  // Verificar se há missões que serão "atropeladas"
  // Uma missão é atropelada se:
  // 1. Está dentro do período da missão proposta
  // 2. A missão proposta não é contínua (tem gaps)
  // 3. A missão proposta impede outras missões de serem criadas

  // Ordenar missões por data de partida
  const missoesOrdenadas = [...missoesDentroDoPeriodo].sort((a, b) => 
    a.partida.getTime() - b.partida.getTime()
  );

  // Verificar se a missão proposta cria gaps problemáticos
  for (let i = 0; i < missoesOrdenadas.length; i++) {
    const missaoAtual = missoesOrdenadas[i];
    const missaoAnterior = i > 0 ? missoesOrdenadas[i - 1] : null;
    const missaoPosterior = i < missoesOrdenadas.length - 1 ? missoesOrdenadas[i + 1] : null;

    // Verificar se a missão proposta impede a missão atual
    const propostaInicio = missaoProposta.partida;
    const propostaFim = missaoProposta.retorno;
    const missaoAtualInicio = missaoAtual.partida;
    const missaoAtualFim = missaoAtual.retorno;

    // Se a missão proposta sobrepõe com a missão atual, é um atropelamento
    if (temInterseção(propostaInicio, propostaFim, missaoAtualInicio, missaoAtualFim)) {
      return {
        valido: false,
        mensagem: `⛔ ATROPELAMENTO DETECTADO! A missão proposta (${propostaInicio.toLocaleDateString('pt-BR')} - ${propostaFim.toLocaleDateString('pt-BR')}) atropela a missão existente de ${missaoAtual.origin || 'N/A'} → ${missaoAtual.destination || 'N/A'} (${missaoAtualInicio.toLocaleDateString('pt-BR')} - ${missaoAtualFim.toLocaleDateString('pt-BR')})`,
        conflitoCom: missaoAtual
      };
    }

    // Verificar se a missão proposta cria um gap que impede outras missões
    // Se há uma missão anterior e posterior, e a proposta está entre elas
    if (missaoAnterior && missaoPosterior) {
      const anteriorFim = missaoAnterior.retorno;
      const posteriorInicio = missaoPosterior.partida;
      
      // Se a missão proposta está entre duas missões existentes
      if (propostaInicio > anteriorFim && propostaFim < posteriorInicio) {
        // Verificar se o gap criado é muito pequeno para outras missões
        const gapAntes = propostaInicio.getTime() - anteriorFim.getTime();
        const gapDepois = posteriorInicio.getTime() - propostaFim.getTime();
        
        // Se algum gap é menor que 24 horas, pode ser problemático
        const umDia = 24 * 60 * 60 * 1000;
        if (gapAntes < umDia || gapDepois < umDia) {
          return {
            valido: false,
            mensagem: `⛔ GAP PROBLEMÁTICO! A missão proposta cria gaps muito pequenos que impedem outras missões. Gap anterior: ${Math.round(gapAntes / (60 * 60 * 1000))}h, Gap posterior: ${Math.round(gapDepois / (60 * 60 * 1000))}h`,
            conflitoCom: missaoAtual
          };
        }
      }
    }
  }

  // Verificar se a missão proposta está isolada (não contínua com outras missões)
  const propostaInicio = missaoProposta.partida;
  const propostaFim = missaoProposta.retorno;
  
  // Encontrar missões que são adjacentes (antes e depois)
  const missaoAnterior = missoesOrdenadas
    .filter(m => m.retorno <= propostaInicio)
    .sort((a, b) => b.retorno.getTime() - a.retorno.getTime())[0];
    
  const missaoPosterior = missoesOrdenadas
    .filter(m => m.partida >= propostaFim)
    .sort((a, b) => a.partida.getTime() - b.partida.getTime())[0];

  // Se há missões adjacentes, verificar se a proposta não quebra a continuidade
  if (missaoAnterior && missaoPosterior) {
    const gapAnterior = propostaInicio.getTime() - missaoAnterior.retorno.getTime();
    const gapPosterior = missaoPosterior.partida.getTime() - propostaFim.getTime();
    
    // Se os gaps são muito grandes, pode indicar que a proposta está isolada
    const tresDias = 3 * 24 * 60 * 60 * 1000;
    if (gapAnterior > tresDias && gapPosterior > tresDias) {
      return {
        valido: false,
        mensagem: `⛔ MISSÃO ISOLADA! A missão proposta está muito isolada das missões existentes, criando gaps de ${Math.round(gapAnterior / (24 * 60 * 60 * 1000))} dias antes e ${Math.round(gapPosterior / (24 * 60 * 60 * 1000))} dias depois`,
        conflitoCom: missaoAnterior
      };
    }
  }

  return { valido: true, mensagem: "✅ Nenhum atropelamento detectado" };
}
