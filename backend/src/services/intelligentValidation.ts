import { prisma } from '../db';
// Helper para formatar datas em string local sem timezone (sem Z)
const formatLocalNoTZ = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const HH = pad(d.getHours());
  const MI = pad(d.getMinutes());
  const SS = pad(d.getSeconds());
  return `${yyyy}-${mm}-${dd}T${HH}:${MI}:${SS}`;
};
import { addHours, isWithinInterval, isBefore, isAfter, isEqual } from 'date-fns';
import { 
  Missao, 
  ValidationResult, 
  JanelaBloqueada,
  janelaBloqueada,
  proximaDecolagemPossivel,
  inicioValido,
  validarMissaoCompleta,
  calcularJanelasBloqueadas,
  sugerirHorarios
} from './missionValidator';


export interface TimeSlot {
  start: Date;
  end: Date;
  status: 'available' | 'booked' | 'blocked' | 'invalid' | 'selected' | 'conflict';
  booking?: any;
  reason?: string;
  nextAvailable?: Date;
  blockType?: 'pre-voo' | 'missao' | 'pos-voo';
}

/**
 * Converte booking do banco para interface Missao
 * departure_date já é o início do pré-voo (04:00), return_date já é o fim do pós-voo (21:00)
 * actual_departure_date é a decolagem real (07:00), actual_return_date é o retorno real (17:00)
 * 
 * IMPORTANTE: NÃO fazer conversão de timezone - usar as datas exatamente como estão no banco
 */
const bookingToMissao = (booking: any): Missao => {
  // Função para converter data do banco SEM conversão de timezone
  const convertToDate = (dateValue: any): Date => {
    if (!dateValue) return new Date();
    
    if (dateValue instanceof Date) {
      // Se já é um objeto Date, usar diretamente
      return dateValue;
    }
    
    if (typeof dateValue === 'string') {
      // Se é string, criar Date diretamente
      return new Date(dateValue);
    }
    
    return new Date(dateValue);
  };

  return {
    id: booking.id,
    // Usar departure_date e return_date exatamente como estão no banco
    partida: convertToDate(booking.departure_date),
    retorno: convertToDate(booking.return_date),
    actualDeparture: convertToDate(booking.actual_departure_date || booking.departure_date),
    actualReturn: convertToDate(booking.actual_return_date || booking.return_date),
    flightHoursTotal: booking.flight_hours,
    origin: booking.origin,
    destination: booking.destination
  };
};

/**
 * Converte janela bloqueada para TimeSlot
 */
const janelaToTimeSlot = (janela: JanelaBloqueada): TimeSlot => {
  let status: TimeSlot['status'] = 'blocked';
  let reason = '';
  let blockType: TimeSlot['blockType'] = 'missao';
  
  switch (janela.tipo) {
    case 'pre-voo':
      reason = 'Tempo de preparação (-3h)';
      blockType = 'pre-voo';
      break;
    case 'missao':
      status = 'booked';
      reason = `Missão em andamento: ${janela.missao.origin} → ${janela.missao.destination}`;
      blockType = 'missao';
      break;
    case 'pos-voo':
      reason = 'Encerramento/Manutenção (+3h)';
      blockType = 'pos-voo';
      break;

  }
  
  return {
    start: janela.inicio,
    end: janela.fim,
    status,
    reason,
    booking: janela.missao,
    blockType
  };
};

/**
 * Verifica se há sobreposição entre dois intervalos [start, end)
 * Um slot de 30min sobrepõe uma janela se:
 * - O início do slot está dentro da janela, OU
 * - O fim do slot está dentro da janela, OU  
 * - O slot contém completamente a janela
 */
const hasOverlap = (interval1: { start: Date; end: Date }, interval2: { start: Date; end: Date }): boolean => {
  // interval1 = slot (30min), interval2 = janela bloqueada
  const slotStart = interval1.start;
  const slotEnd = interval1.end;
  const windowStart = interval2.start;
  const windowEnd = interval2.end;
  
  // Slot sobrepõe se:
  // 1. Início do slot está dentro da janela (inclusive)
  // 2. Fim do slot está dentro da janela (inclusive)
  // 3. Slot contém a janela completamente
  const resultado = (slotStart >= windowStart && slotStart < windowEnd) ||
         (slotEnd > windowStart && slotEnd <= windowEnd) ||
         (slotStart <= windowStart && slotEnd >= windowEnd);
  
  // Log removido para limpar console
  
  return resultado;
};

/**
 * Valida se um horário está disponível para agendamento
 */
export const validateTimeSlot = async (
  aircraftId: number,
  startTime: Date,
  endTime: Date,
  excludeBookingId?: number
): Promise<ValidationResult> => {
  // Buscar todas as missões da aeronave
  const existingBookings = await prisma.booking.findMany({
    where: {
      aircraftId,
      status: {
        in: ['pendente', 'confirmada', 'paga', 'blocked']
      },
      ...(excludeBookingId && { id: { not: excludeBookingId } })
    },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  // Converter bookings para interface Missao
  const missoesExistentes = existingBookings.map(bookingToMissao);
  
  // Criar missão proposta para validação
  const duracaoMs = endTime.getTime() - startTime.getTime();
  const duracaoHoras = duracaoMs / (60 * 60 * 1000);
  
  const missaoProposta: Missao = {
    partida: startTime,
    retorno: endTime,
    flightHoursTotal: duracaoHoras
  };
  
  // Validar missão completa
  const resultado = validarMissaoCompleta(missaoProposta, missoesExistentes);
  
  // Converter resultado para formato esperado
  return {
    valido: resultado.valido,
    mensagem: resultado.mensagem,
    sugerido: resultado.sugerido,
    proximaDisponibilidade: resultado.proximaDisponibilidade,
    conflitoCom: resultado.conflitoCom
  };
};

/**
 * Gera slots de tempo para uma semana com inteligência avançada
 */
export const generateTimeSlots = async (
  aircraftId: number,
  weekStart: Date,
  selectedStart?: Date,
  selectedEnd?: Date,
  missionDuration?: number, // Duração estimada da missão em horas
  singleDay?: boolean // Se true, gera slots apenas para o dia atual
): Promise<TimeSlot[]> => {
  console.log('📅 Backend - generateTimeSlots chamado com:');
  console.log('📅 weekStart:', weekStart.toISOString());
  console.log('📅 Data atual:', new Date().toISOString());
  
  const slots: TimeSlot[] = [];

  // Buscar missões existentes
  const existingBookings = await prisma.booking.findMany({
    where: {
      aircraftId,
      status: {
        in: ['pendente', 'confirmada', 'paga', 'blocked']
      }
    },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  // Converter bookings para interface Missao
  const missoesExistentes = existingBookings.map(bookingToMissao);
  
  // Calcular todas as janelas bloqueadas
  const todasJanelas = calcularJanelasBloqueadas(missoesExistentes);
  


  // Determinar quantos dias gerar
  const daysToGenerate = singleDay ? 1 : 7;
  
  // Gerar slots de 30 em 30 minutos das 00h às 23h30
  for (let day = 0; day < daysToGenerate; day++) {
    // CORREÇÃO CRÍTICA: Usar a data original do weekStart em timezone brasileiro
    // Extrair ano, mês e dia do weekStart que já está em timezone brasileiro
    const baseYear = weekStart.getFullYear();
    const baseMonth = weekStart.getMonth();
    const baseDate = weekStart.getDate();
    
    // Criar data para o dia atual mantendo o timezone brasileiro
    const currentDate = new Date(baseYear, baseMonth, baseDate + day);
    
    // Log apenas para o primeiro dia para debug
    if (day === 0) {
      console.log('📅 Primeiro dia (original weekStart):', weekStart.toISOString());
      console.log('📅 Primeiro dia (currentDate local):', currentDate.toISOString());
      console.log('📅 Primeiro dia (currentDate BR):', currentDate.toLocaleDateString('pt-BR'));
      console.log('📅 Gerando slots para', singleDay ? '1 dia' : '7 dias');
    }
    
    for (let hour = 0; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // CORREÇÃO CRÍTICA: Criar slots usando a data base correta
        const slotStart = new Date(baseYear, baseMonth, baseDate + day, hour, minute, 0, 0);
        const slotEnd = new Date(baseYear, baseMonth, baseDate + day, hour, minute + 30, 0, 0);
        
        // Log para slots noturnos para debug
        if (day === 0 && hour === 21 && minute === 0) {
          console.log('📅 Slot 21:00 gerado:', slotStart.toISOString());
          console.log('📅 Slot 21:00 local BR:', slotStart.toLocaleDateString('pt-BR'), slotStart.toLocaleTimeString('pt-BR'));
          console.log('📅 Slot 21:00 toString():', slotStart.toString());
        }

        // Verificar se o slot está em conflito com alguma janela bloqueada
        const conflictingWindow = todasJanelas.find(janela => 
          hasOverlap({ start: slotStart, end: slotEnd }, { start: janela.inicio, end: janela.fim })
        );

        let status: TimeSlot['status'] = 'available';
        let reason = '';
        let nextAvailable: Date | undefined;
        let blockType: TimeSlot['blockType'];

        if (conflictingWindow) {
          // Converter janela para TimeSlot
          const timeSlot = janelaToTimeSlot(conflictingWindow);
          status = timeSlot.status;
          reason = timeSlot.reason || '';
          blockType = timeSlot.blockType;
          nextAvailable = proximaDecolagemPossivel(conflictingWindow.missao);
        }
        // REMOVIDO: Validação das 3 horas agora é feita apenas no frontend no clique

        // Verificar se é slot selecionado pelo usuário
        if (selectedStart && selectedEnd && hasOverlap({ start: slotStart, end: slotEnd }, { start: selectedStart, end: selectedEnd })) {
          if (status === 'available') {
            status = 'selected';
          } else {
            status = 'conflict';
          }
        }

        slots.push({
          start: slotStart,
          end: slotEnd,
          status,
          booking: conflictingWindow?.missao,
          reason: reason || '',
          nextAvailable,
          blockType
        });
      }
    }
  }

  return slots;
};

/**
 * Valida uma missão completa (partida e retorno)
 */
export const validateMission = async (
  aircraftId: number,
  departureTime: Date,
  returnTime: Date,
  flightHours: number,
  excludeBookingId?: number
): Promise<ValidationResult> => {
  // Buscar missões existentes
  const existingBookings = await prisma.booking.findMany({
    where: {
      aircraftId,
      status: {
        in: ['pendente', 'confirmada', 'paga', 'blocked']
      },
      ...(excludeBookingId && { id: { not: excludeBookingId } })
    },
    include: {
      user: {
        select: { name: true }
      }
    }
  });

  // Converter bookings para interface Missao
  const missoesExistentes = existingBookings.map(bookingToMissao);
  
  // Criar missão proposta
  const missaoProposta: Missao = {
    partida: departureTime,
    retorno: returnTime,
    flightHoursTotal: flightHours
  };
  
  // Validar missão completa
  const resultado = validarMissaoCompleta(missaoProposta, missoesExistentes);
  
  // Converter resultado para formato esperado
  return {
    valido: resultado.valido,
    mensagem: resultado.mensagem,
    sugerido: resultado.sugerido,
    proximaDisponibilidade: resultado.proximaDisponibilidade,
    conflitoCom: resultado.conflitoCom
  };
};

/**
 * Calcula o próximo horário disponível após uma missão para uma aeronave específica
 */
export const calculateNextAvailableTimeForAircraft = async (
  aircraftId: number,
  afterTime: Date
): Promise<Date> => {
  const relevantBookings = await prisma.booking.findMany({
    where: {
      aircraftId,
      status: {
        in: ['pendente', 'confirmada', 'paga', 'blocked']
      },
      return_date: {
        gt: formatLocalNoTZ(afterTime)
      }
    },
    orderBy: {
      return_date: 'asc'
    }
  });

  if (relevantBookings.length === 0) {
    return afterTime;
  }

  // Encontrar o primeiro horário disponível após o bloqueio da próxima missão
  const nextBooking = relevantBookings[0];
  const missao = bookingToMissao(nextBooking);
  return proximaDecolagemPossivel(missao);
};

/**
 * Sugere horários disponíveis para uma missão
 */
export const suggestAvailableSlots = async (
  aircraftId: number,
  desiredStartTime: Date,
  missionDuration: number
): Promise<Date[]> => {
  // Buscar missões existentes
  const existingBookings = await prisma.booking.findMany({
    where: {
      aircraftId,
      status: {
        in: ['pendente', 'confirmada', 'paga', 'blocked']
      }
    }
  });

  // Converter para interface Missao
  const missoesExistentes = existingBookings.map(bookingToMissao);
  
  // Usar função do validador para sugerir horários
  return sugerirHorarios(desiredStartTime, missionDuration, missoesExistentes);
};


