/**
 * Utilitários para manipulação de datas e fuso horário brasileiro
 */

/**
 * Converte uma data do horário brasileiro para UTC
 * @param brazilianDate - Data no horário brasileiro
 * @returns String ISO em UTC
 */
export const convertBrazilianDateToUTCString = (brazilianDate: Date): string => {
  // Criar uma string ISO que preserve o horário brasileiro
  // Não usar toISOString() pois ele converte para UTC automaticamente
  const year = brazilianDate.getFullYear();
  const month = String(brazilianDate.getMonth() + 1).padStart(2, '0');
  const day = String(brazilianDate.getDate()).padStart(2, '0');
  const hours = String(brazilianDate.getHours()).padStart(2, '0');
  const minutes = String(brazilianDate.getMinutes()).padStart(2, '0');
  const seconds = String(brazilianDate.getSeconds()).padStart(2, '0');
  
  // Retornar no formato ISO mas sem conversão UTC
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
};

/**
 * Converte uma data UTC para horário brasileiro
 * @param utcDate - Data em UTC (string ou Date)
 * @returns Date no horário brasileiro
 */
export const convertUTCToBrazilianTime = (utcDate: string | Date): Date => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // A data já está no horário brasileiro (não converter)
  // O backend salva as datas no horário local
  const brazilianTime = new Date(date.getTime());
  
  return brazilianTime;
};

// Função específica para partida (adiciona 3 horas)
export const convertUTCToBrazilianTimeDeparture = (utcDate: string | Date): Date => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Para partida: adicionar 3 horas (07:00 → 10:00)
  const brazilianTime = new Date(date.getTime() + (3 * 60 * 60 * 1000));
  
  return brazilianTime;
};

// Função específica para retorno (não adiciona 3 horas)
export const convertUTCToBrazilianTimeReturn = (utcDate: string | Date): Date => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  
  // Para retorno: não adicionar (17:00 → 17:00)
  const brazilianTime = new Date(date.getTime());
  
  return brazilianTime;
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
  const brazilianDate = convertUTCToBrazilianTime(utcDate);
  return brazilianDate.toLocaleDateString('pt-BR');
};

/**
 * Formata uma data UTC para exibição de data e hora no horário brasileiro
 * @param utcDate - Data em formato UTC
 * @returns String formatada no horário brasileiro
 */
export const formatUTCToBrazilianDateTime = (utcDate: string | Date): string => {
  const brazilianDate = convertUTCToBrazilianTime(utcDate);
  return brazilianDate.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
};

/**
 * Formata apenas a hora de uma data UTC no horário brasileiro
 * @param utcDate - Data em formato UTC
 * @returns String formatada da hora no horário brasileiro
 */
export const formatUTCToBrazilianTime = (utcDate: string | Date): string => {
  const brazilianDate = convertUTCToBrazilianTime(utcDate);
  return brazilianDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
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
