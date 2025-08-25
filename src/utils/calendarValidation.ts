import { addHours, isWithinInterval, isBefore, isAfter, parseISO } from 'date-fns';
import { convertUTCToBrazilianTime } from './dateUtils';

export interface Booking {
  id: number;
  aircraftId: number;
  departure_date: string;
  return_date: string;
  blocked_until: string;
  status: string;
  origin: string;
  destination: string;
  user: {
    name: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  nextAvailable?: Date;
  conflictingBooking?: Booking;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  status: 'available' | 'booked' | 'blocked' | 'invalid';
  booking?: Booking;
  reason?: string;
  nextAvailable?: Date;
}

/**
 * Valida se um horário está disponível para agendamento
 */
export const validateTimeSlot = (
  aircraftId: number,
  startTime: Date,
  endTime: Date,
  existingBookings: Booking[]
): ValidationResult => {
  // Verificar se o horário está dentro do período de funcionamento (6h às 19h)
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();
  
  if (startHour < 6 || startHour >= 19) {
    return {
      isValid: false,
      reason: 'Horário fora do período de funcionamento (6h às 19h)'
    };
  }

  if (endHour < 6 || endHour >= 19) {
    return {
      isValid: false,
      reason: 'Horário fora do período de funcionamento (6h às 19h)'
    };
  }

  // Verificar conflitos com reservas existentes
  for (const booking of existingBookings) {
    if (booking.aircraftId !== aircraftId) continue;

    const bookingStart = convertUTCToBrazilianTime(booking.departure_date);
    const bookingEnd = convertUTCToBrazilianTime(booking.return_date);
    const blockedUntil = booking.blocked_until ? convertUTCToBrazilianTime(booking.blocked_until) : null;

    // Verificar se há sobreposição direta com o voo
    const hasDirectConflict = isWithinInterval(startTime, { start: bookingStart, end: bookingEnd }) ||
                             isWithinInterval(endTime, { start: bookingStart, end: bookingEnd }) ||
                             (isBefore(startTime, bookingStart) && isAfter(endTime, bookingEnd));

    if (hasDirectConflict) {
      return {
        isValid: false,
        reason: `Conflito com missão existente: ${booking.origin} → ${booking.destination}`,
        nextAvailable: blockedUntil,
        conflictingBooking: booking
      };
    }

    // Verificar se está no período de bloqueio (3h antes + voo + 3h depois)
    if (blockedUntil && isBefore(startTime, blockedUntil)) {
      const preparationStart = addHours(bookingStart, -3);
      
      if (isBefore(startTime, preparationStart)) {
        return {
          isValid: false,
          reason: 'Tempo de preparação (3h antes da missão)',
          nextAvailable: blockedUntil,
          conflictingBooking: booking
        };
      } else {
        return {
          isValid: false,
          reason: 'Tempo de encerramento (3h após retorno + manutenção)',
          nextAvailable: blockedUntil,
          conflictingBooking: booking
        };
      }
    }
  }

  return { isValid: true };
};

/**
 * Calcula o próximo horário disponível após uma missão
 */
export const calculateNextAvailableTime = (
  aircraftId: number,
  afterTime: Date,
  existingBookings: Booking[]
): Date => {
  const relevantBookings = existingBookings
    .filter(booking => booking.aircraftId === aircraftId)
    .filter(booking => {
      const bookingStart = convertUTCToBrazilianTime(booking.departure_date);
      return isAfter(bookingStart, afterTime);
    })
    .sort((a, b) => {
      const aStart = convertUTCToBrazilianTime(a.departure_date);
      const bStart = convertUTCToBrazilianTime(b.departure_date);
      return aStart.getTime() - bStart.getTime();
    });

  if (relevantBookings.length === 0) {
    // Se não há reservas futuras, verificar se está dentro do horário de funcionamento
    const hour = afterTime.getHours();
    if (hour >= 6 && hour < 19) {
      return afterTime;
    } else if (hour < 6) {
      // Se for antes das 6h, retornar 6h do mesmo dia
      const nextAvailable = new Date(afterTime);
      nextAvailable.setHours(6, 0, 0, 0);
      return nextAvailable;
    } else {
      // Se for após 19h, retornar 6h do próximo dia
      const nextAvailable = new Date(afterTime);
      nextAvailable.setDate(nextAvailable.getDate() + 1);
      nextAvailable.setHours(6, 0, 0, 0);
      return nextAvailable;
    }
  }

  // Encontrar o primeiro horário disponível após o bloqueio da próxima missão
  const nextBooking = relevantBookings[0];
  const blockedUntil = nextBooking.blocked_until ? convertUTCToBrazilianTime(nextBooking.blocked_until) : null;
  
  if (blockedUntil) {
    return blockedUntil;
  }

  // Se não há blocked_until, usar o horário de partida da próxima missão
  return convertUTCToBrazilianTime(nextBooking.departure_date);
};

/**
 * Gera slots de tempo para uma semana
 */
export const generateTimeSlots = (
  aircraftId: number,
  weekStart: Date,
  existingBookings: Booking[]
): TimeSlot[] => {
  const slots: TimeSlot[] = [];

  // Gerar slots de hora em hora das 6h às 19h para cada dia da semana
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(currentDate.getDate() + day);
    
    for (let hour = 6; hour < 19; hour++) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);
      
      const slotEnd = new Date(currentDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Verificar conflitos
      const conflictingBooking = existingBookings.find(booking => {
        if (booking.aircraftId !== aircraftId) return false;
        
        const bookingStart = convertUTCToBrazilianTime(booking.departure_date);
        const bookingEnd = convertUTCToBrazilianTime(booking.return_date);
        const blockedUntil = booking.blocked_until ? convertUTCToBrazilianTime(booking.blocked_until) : null;

        // Verificar se o slot está dentro do período de voo
        const isDuringFlight = isWithinInterval(slotStart, { start: bookingStart, end: bookingEnd });
        
        // Verificar se o slot está no período de bloqueio
        const isDuringBlock = blockedUntil ? isBefore(slotStart, blockedUntil) : false;

        return isDuringFlight || isDuringBlock;
      });

      let status: TimeSlot['status'] = 'available';
      let reason = '';
      let nextAvailable: Date | undefined;

      if (conflictingBooking) {
        const bookingStart = convertUTCToBrazilianTime(conflictingBooking.departure_date);
        const bookingEnd = convertUTCToBrazilianTime(conflictingBooking.return_date);
        const blockedUntil = conflictingBooking.blocked_until ? convertUTCToBrazilianTime(conflictingBooking.blocked_until) : null;

        if (isWithinInterval(slotStart, { start: bookingStart, end: bookingEnd })) {
          status = 'booked';
          reason = `Missão em andamento: ${conflictingBooking.origin} → ${conflictingBooking.destination}`;
          nextAvailable = blockedUntil;
        } else if (blockedUntil && isBefore(slotStart, blockedUntil)) {
          status = 'blocked';
          const preparationStart = addHours(bookingStart, -3);
          
          if (isBefore(slotStart, preparationStart)) {
            reason = 'Tempo de preparação (3h antes da missão)';
          } else {
            reason = 'Tempo de encerramento (3h após retorno + manutenção)';
          }
          nextAvailable = blockedUntil;
        }
      }

      slots.push({
        start: slotStart,
        end: slotEnd,
        status,
        booking: conflictingBooking,
        reason,
        nextAvailable
      });
    }
  }

  return slots;
};

/**
 * Valida uma missão completa (partida e retorno)
 */
export const validateMission = (
  aircraftId: number,
  departureTime: Date,
  returnTime: Date,
  existingBookings: Booking[]
): ValidationResult => {
  // Validar horário de partida
  const departureValidation = validateTimeSlot(aircraftId, departureTime, departureTime, existingBookings);
  if (!departureValidation.isValid) {
    return departureValidation;
  }

  // Validar horário de retorno
  const returnValidation = validateTimeSlot(aircraftId, returnTime, returnTime, existingBookings);
  if (!returnValidation.isValid) {
    return returnValidation;
  }

  // Validar se o retorno é posterior à partida
  if (isBefore(returnTime, departureTime)) {
    return {
      isValid: false,
      reason: 'Horário de retorno deve ser posterior ao horário de partida'
    };
  }

  // Validar se a missão não é muito longa (máximo 12 horas)
  const missionDuration = returnTime.getTime() - departureTime.getTime();
  const maxDuration = 12 * 60 * 60 * 1000; // 12 horas em milissegundos
  
  if (missionDuration > maxDuration) {
    return {
      isValid: false,
      reason: 'Missão muito longa (máximo 12 horas)'
    };
  }

  // Validar se há conflitos durante todo o período da missão
  const missionInterval = { start: departureTime, end: returnTime };
  
  for (const booking of existingBookings) {
    if (booking.aircraftId !== aircraftId) continue;

    const bookingStart = convertUTCToBrazilianTime(booking.departure_date);
    const bookingEnd = convertUTCToBrazilianTime(booking.return_date);
    const blockedUntil = booking.blocked_until ? convertUTCToBrazilianTime(booking.blocked_until) : null;

    // Verificar sobreposição com o voo
    const hasFlightConflict = isWithinInterval(departureTime, { start: bookingStart, end: bookingEnd }) ||
                             isWithinInterval(returnTime, { start: bookingStart, end: bookingEnd }) ||
                             (isBefore(departureTime, bookingStart) && isAfter(returnTime, bookingEnd));

    if (hasFlightConflict) {
      return {
        isValid: false,
        reason: `Conflito com missão existente: ${booking.origin} → ${booking.destination}`,
        nextAvailable: blockedUntil,
        conflictingBooking: booking
      };
    }

    // Verificar conflito com período de bloqueio
    if (blockedUntil && isBefore(returnTime, blockedUntil)) {
      return {
        isValid: false,
        reason: 'Missão termina durante período de bloqueio de outra missão',
        nextAvailable: blockedUntil,
        conflictingBooking: booking
      };
    }
  }

  return { isValid: true };
};
