/**
 * Utilitários para manipulação de datas e exibição em UTC
 */

/**
 * Converte uma data do horário brasileiro para UTC
 * @param brazilianDate - Data no horário brasileiro
 * @returns String ISO em UTC
 */
export const convertBrazilianDateToUTCString = (brazilianDate: Date): string => {
  // Converter para UTC SOMANDO 3 horas (horário de Brasília é UTC-3)
  // UTC = horário local (BRT) + 3h
  const utcDate = new Date(brazilianDate.getTime() + (3 * 60 * 60 * 1000));
  
  // Retornar no formato ISO UTC
  return utcDate.toISOString();
};

/**
 * Converte uma data UTC para horário brasileiro
 * @param utcDate - Data em UTC (string ou Date)
 * @returns Date no horário brasileiro
 */
export const convertUTCToBrazilianTime = (utcDate: string | Date): Date => {
  // Objetivo: exibir exatamente a MESMA HORA salva no backend (UTC),
  // sem deslocar para o fuso do cliente.
  // Estratégia: se for string ISO, construir Date usando componentes locais,
  // preservando o “relógio” recebido (HH:mm) — isto mantém a exibição em UTC.
  if (utcDate instanceof Date) {
    return utcDate;
  }

  const str = utcDate;
  if (!str) return new Date(NaN);

  const m = str.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?(Z|[+-]\d{2}:\d{2})?$/
  );

  if (m) {
    const year = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const day = parseInt(m[3], 10);
    const hour = parseInt(m[4], 10);
    const minute = parseInt(m[5], 10);
    const second = m[6] ? parseInt(m[6], 10) : 0;
    const ms = m[7] ? parseInt(m[7], 10) : 0;

    return new Date(year, month, day, hour, minute, second, ms);
  }

  return new Date(str);
};

// Função específica para partida (não adiciona horas)
export const convertUTCToBrazilianTimeDeparture = (utcDate: string | Date): Date => {
  return convertUTCToBrazilianTime(utcDate);
};

// Função específica para retorno (não adiciona horas)
export const convertUTCToBrazilianTimeReturn = (utcDate: string | Date): Date => {
  return convertUTCToBrazilianTime(utcDate);
};

/**
 * Converte uma data do horário brasileiro para UTC
 * @param brazilianDate - Data no horário brasileiro
 * @returns Date em UTC
 */
export const convertBrazilianTimeToUTC = (brazilianDate: Date): Date => {
  // NÃO converter para UTC - retornar o horário brasileiro diretamente
  return brazilianDate;
};

/**
 * Formata uma data UTC para exibição no horário brasileiro
 * @param utcDate - Data em formato UTC
 * @param formatString - String de formatação (padrão: 'dd/MM/yyyy')
 * @returns String formatada no horário brasileiro
 */
export const formatUTCToBrazilian = (utcDate: string | Date, formatString: string = 'dd/MM/yyyy'): string => {
  // Exibir a data em UTC exatamente como salva
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
};

/**
 * Formata uma data UTC para exibição de data e hora no horário brasileiro
 * @param utcDate - Data em formato UTC
 * @returns String formatada no horário brasileiro
 */
export const formatUTCToBrazilianDateTime = (utcDate: string | Date): string => {
  // Exibir data e hora em UTC
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return date.toLocaleString('pt-BR', { timeZone: 'UTC' });
};

/**
 * Formata apenas a hora de uma data UTC no horário brasileiro
 * @param utcDate - Data em formato UTC
 * @returns String formatada da hora no horário brasileiro
 */
export const formatUTCToBrazilianTime = (utcDate: string | Date): string => {
  // Exibir apenas a hora em UTC
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC'
  });
};

// ===== Formatação em fuso horário do Brasil (America/Sao_Paulo) =====
export const formatBrazilTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Sao_Paulo'
  });
};

export const formatBrazilDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
};

export const formatBrazilDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
};

/**
 * Converte blocked_until que já está no horário brasileiro
 * @param blockedUntilDate - Data do blocked_until
 * @returns Date no horário brasileiro (sem conversão adicional)
 */
export const convertBlockedUntilToBrazilianTime = (blockedUntilDate: string | Date): Date => {
  const date = typeof blockedUntilDate === 'string' ? new Date(blockedUntilDate) : blockedUntilDate;
  
  // blocked_until já está no horário brasileiro, não precisamos converter
  return date;
};

/**
 * Verifica se uma data está no passado (considerando horário brasileiro)
 * @param utcDate - Data em formato UTC
 * @returns boolean
 */
export const isDateInPast = (utcDate: string | Date): boolean => {
  const brazilianDate = convertUTCToBrazilianTime(utcDate);
  const now = new Date();
  return brazilianDate < now;
};

/**
 * Calcula a diferença em dias entre duas datas UTC (considerando horário brasileiro)
 * @param utcDate1 - Primeira data em UTC
 * @param utcDate2 - Segunda data em UTC
 * @returns Número de dias
 */
export const getDaysDifference = (utcDate1: string | Date, utcDate2: string | Date): number => {
  const brazilianDate1 = convertUTCToBrazilianTime(utcDate1);
  const brazilianDate2 = convertUTCToBrazilianTime(utcDate2);
  
  const diffTime = brazilianDate2.getTime() - brazilianDate1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Cria uma data no horário brasileiro a partir de componentes
 * @param year - Ano
 * @param month - Mês (0-11)
 * @param day - Dia
 * @param hour - Hora (0-23)
 * @param minute - Minuto (0-59)
 * @returns Date no horário brasileiro
 */
export const createBrazilianDate = (year: number, month: number, day: number, hour: number = 0, minute: number = 0): Date => {
  // Criar data no horário local (que deve ser brasileiro)
  const date = new Date(year, month, day, hour, minute, 0, 0);
  return date;
};

/**
 * Converte uma data para o timezone brasileiro (UTC-3) para envio ao backend
 * @param date - Data local
 * @returns String ISO no timezone brasileiro
 */
export const convertToSaoPauloTimezone = (date: Date): string => {
  // Criar uma nova data ajustada para o timezone de São Paulo (UTC-3)
  const saoPauloOffset = -3 * 60; // -3 horas em minutos
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const saoPauloTime = new Date(utc + (saoPauloOffset * 60000));
  
  return saoPauloTime.toISOString();
};

/**
 * Converte startOfWeek para o timezone brasileiro antes de enviar para o backend
 * @param weekStart - Data do início da semana
 * @returns String ISO no timezone brasileiro
 */
export const convertWeekStartToBrazilianTimezone = (weekStart: Date): string => {
  // CORREÇÃO: Não usar toISOString() pois converte para UTC
  // Construir a string ISO usando os componentes locais da data
  const year = weekStart.getFullYear();
  const month = String(weekStart.getMonth() + 1).padStart(2, '0');
  const day = String(weekStart.getDate()).padStart(2, '0');
  const hours = String(weekStart.getHours()).padStart(2, '0');
  const minutes = String(weekStart.getMinutes()).padStart(2, '0');
  const seconds = String(weekStart.getSeconds()).padStart(2, '0');
  
  // Retornar no formato ISO preservando o horário brasileiro local
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};
