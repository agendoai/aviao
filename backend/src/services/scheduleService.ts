import { prisma } from '../db';
import { MissionCalculator, MissionCalculation } from './missionCalculator';

export interface ScheduleConflict {
  startTime: Date;
  endTime: Date;
  type: 'booking' | 'maintenance' | 'unavailable';
  description: string;
}

export interface AvailableSlot {
  startTime: Date;
  endTime: Date;
  duration: number; // em horas
}

interface DaysConfig {
  [key: number]: {
    active: boolean;
    startHour: number;
    endHour: number;
  };
}

export class ScheduleService {
  /**
   * Verifica se há conflito de horários para uma aeronave
   */
  static async checkConflict(
    aircraftId: number,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: number
  ): Promise<ScheduleConflict[]> {
    const conflicts = await prisma.aircraftSchedule.findMany({
      where: {
        aircraftId,
        OR: [
          {
            // Conflito: início dentro de um bloqueio existente
            startTime: { lte: startTime },
            endTime: { gt: startTime }
          },
          {
            // Conflito: fim dentro de um bloqueio existente
            startTime: { lt: endTime },
            endTime: { gte: endTime }
          },
          {
            // Conflito: bloqueio existente completamente dentro do novo
            startTime: { gte: startTime },
            endTime: { lte: endTime }
          }
        ],
        ...(excludeBookingId && { bookingId: { not: excludeBookingId } })
      },
      orderBy: { startTime: 'asc' }
    });

    return conflicts.map(conflict => ({
      startTime: conflict.startTime,
      endTime: conflict.endTime,
      type: conflict.type as 'booking' | 'maintenance' | 'unavailable',
      description: conflict.description || 'Bloqueio de agenda'
    }));
  }

  /**
   * Encontra próximo horário disponível
   */
  static async findNextAvailableTime(
    aircraftId: number,
    desiredStartTime: Date,
    missionDuration: number
  ): Promise<Date> {
    let currentTime = new Date(desiredStartTime);
    const maxAttempts = 30; // Tentar por 30 dias
    let attempts = 0;

    while (attempts < maxAttempts) {
      const endTime = new Date(currentTime.getTime() + missionDuration * 60 * 60 * 1000);
      const conflicts = await this.checkConflict(aircraftId, currentTime, endTime);

      if (conflicts.length === 0) {
        return currentTime;
      }

      // Mover para o próximo horário disponível (após o último conflito)
      const lastConflict = conflicts[conflicts.length - 1];
      currentTime = new Date(lastConflict.endTime.getTime() + 30 * 60 * 1000); // +30 minutos
      attempts++;
    }

    throw new Error('Não foi possível encontrar horário disponível nos próximos 30 dias');
  }

  /**
   * Bloqueia a agenda da aeronave para uma missão
   */
  static async blockAircraftSchedule(
    aircraftId: number,
    bookingId: number,
    startTime: Date,
    endTime: Date,
    description: string
  ): Promise<void> {
    await prisma.aircraftSchedule.create({
      data: {
        aircraftId,
        bookingId,
        startTime,
        endTime,
        type: 'booking',
        description
      }
    });
  }

  /**
   * Remove bloqueio da agenda
   */
  static async unblockAircraftSchedule(bookingId: number): Promise<void> {
    await prisma.aircraftSchedule.deleteMany({
      where: { bookingId }
    });
  }

  /**
   * Busca slots disponíveis para uma aeronave em um período
   */
  static async getAvailableSlots(
    aircraftId: number,
    startDate: Date,
    endDate: Date,
    minDuration: number = 2 // Duração mínima em horas
  ): Promise<AvailableSlot[]> {
    // Buscar todos os bloqueios no período
    const conflicts = await prisma.aircraftSchedule.findMany({
      where: {
        aircraftId,
        OR: [
          {
            startTime: { gte: startDate, lte: endDate }
          },
          {
            endTime: { gte: startDate, lte: endDate }
          },
          {
            startTime: { lte: startDate },
            endTime: { gte: endDate }
          }
        ]
      },
      orderBy: { startTime: 'asc' }
    });

    const slots: AvailableSlot[] = [];
    let currentTime = new Date(startDate);

    for (const conflict of conflicts) {
      // Se há espaço antes do conflito
      if (currentTime < conflict.startTime) {
        const duration = (conflict.startTime.getTime() - currentTime.getTime()) / (60 * 60 * 1000);
        if (duration >= minDuration) {
          slots.push({
            startTime: currentTime,
            endTime: conflict.startTime,
            duration
          });
        }
      }
      currentTime = new Date(conflict.endTime.getTime() + 30 * 60 * 1000); // +30 minutos
    }

    // Verificar se há espaço após o último conflito
    if (currentTime < endDate) {
      const duration = (endDate.getTime() - currentTime.getTime()) / (60 * 60 * 1000);
      if (duration >= minDuration) {
        slots.push({
          startTime: currentTime,
          endTime: endDate,
          duration
        });
      }
    }

    return slots;
  }

  /**
   * Calcula missão e verifica disponibilidade
   */
  static async calculateMissionWithAvailability(
    aircraftId: number,
    origin: string,
    destinations: string[],
    departureTime: Date,
    groundTimePerDestination: number = 1,
    maintenanceTime: number = 3
  ): Promise<{
    mission: MissionCalculation;
    conflicts: ScheduleConflict[];
    isAvailable: boolean;
    nextAvailableTime?: Date;
  }> {
    // Calcular missão
    const mission = MissionCalculator.calculateMission({
      origin,
      destinations,
      departureTime,
      groundTimePerDestination,
      maintenanceTime
    });

    // Verificar conflitos
    const conflicts = await this.checkConflict(
      aircraftId,
      departureTime,
      mission.maintenanceEndTime
    );

    const isAvailable = conflicts.length === 0;

    // Se não disponível, encontrar próximo horário
    let nextAvailableTime: Date | undefined;
    if (!isAvailable) {
      nextAvailableTime = await this.findNextAvailableTime(
        aircraftId,
        departureTime,
        mission.totalBlockTime
      );
    }

    return {
      mission,
      conflicts,
      isAvailable,
      nextAvailableTime
    };
  }

  /**
   * Busca agenda de uma aeronave para um período
   */
  static async getAircraftSchedule(
    aircraftId: number,
    startDate: Date,
    endDate: Date
  ) {
    return await prisma.aircraftSchedule.findMany({
      where: {
        aircraftId,
        OR: [
          {
            startTime: { gte: startDate, lte: endDate }
          },
          {
            endTime: { gte: startDate, lte: endDate }
          },
          {
            startTime: { lte: startDate },
            endTime: { gte: endDate }
          }
        ]
      },
      include: {
        booking: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      },
      orderBy: { startTime: 'asc' }
    });
  }

  // Configuração padrão: todos os dias disponíveis o dia todo
  private static defaultConfig: DaysConfig = {
    0: { active: true, startHour: 0, endHour: 24 },   // Domingo
    1: { active: true, startHour: 0, endHour: 24 },   // Segunda
    2: { active: true, startHour: 0, endHour: 24 },   // Terça
    3: { active: true, startHour: 0, endHour: 24 },   // Quarta
    4: { active: true, startHour: 0, endHour: 24 },   // Quinta
    5: { active: true, startHour: 0, endHour: 24 },   // Sexta
    6: { active: true, startHour: 0, endHour: 24 }    // Sábado
  };

  // Verificar e gerar slots automaticamente quando necessário
  static async ensureSlotsAvailable(aircraftId: number, targetDate: Date): Promise<void> {
    // Garantir que targetDate é uma data válida
    const validTargetDate = new Date(targetDate);
    if (isNaN(validTargetDate.getTime())) {
      console.log('⚠️ Data inválida recebida, usando data atual');
      validTargetDate.setTime(Date.now());
    }
    
    const startDate = new Date(validTargetDate);
    startDate.setDate(startDate.getDate() - 1); // Verificar desde ontem
    
    const endDate = new Date(validTargetDate);
    endDate.setDate(endDate.getDate() + 30); // Garantir 30 dias à frente
    
    // Verificar se já existem slots para este período
    const existingSlots = await prisma.booking.count({
      where: {
        aircraftId,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        departure_date: {
          gte: startDate,
          lte: endDate
        }
      }
    });

    // Se não há slots suficientes, gerar automaticamente
    if (existingSlots < 30) {
      console.log(`🔄 Gerando slots automaticamente para aeronave ${aircraftId}`);
      await this.generateSlotsForPeriod(aircraftId, startDate, endDate);
    }
  }

  // Gerar slots para um período específico
  static async generateSlotsForPeriod(
    aircraftId: number, 
    startDate: Date, 
    endDate: Date,
    config: DaysConfig = this.defaultConfig
  ): Promise<void> {
    const slots = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const weekDay = d.getDay();
      const dayConfig = config[weekDay];
      
      if (dayConfig && dayConfig.active) {
        // Criar slots de 1 hora cada, das 00:00 às 23:00
        for (let hour = dayConfig.startHour; hour < dayConfig.endHour; hour++) {
          const slotStart = new Date(d);
          slotStart.setHours(hour, 0, 0, 0);
          const slotEnd = new Date(d);
          slotEnd.setHours(hour + 1, 0, 0, 0);
          
          // Verificar se já existe slot para este horário
          const existingSlot = await prisma.booking.findFirst({
            where: {
              aircraftId,
              status: 'available',
              origin: 'AGENDA',
              destination: 'AGENDA',
              departure_date: {
                gte: slotStart,
                lt: slotEnd
              }
            }
          });

          if (!existingSlot) {
            slots.push({
              userId: 1, // sistema
              aircraftId,
              origin: 'AGENDA',
              destination: 'AGENDA',
              departure_date: new Date(slotStart.getTime() - (3 * 60 * 60 * 1000) - (3 * 60 * 60 * 1000)), // 07:00 (início pré-voo) - ajustar timezone
              return_date: new Date(slotEnd.getTime() + (3 * 60 * 60 * 1000)), // 21:00 (fim lógico + 3h timezone)
              actual_departure_date: new Date(slotStart.getTime() + (3 * 60 * 60 * 1000)), // 10:00 (partida real + 3h timezone)
              actual_return_date: new Date(slotEnd.getTime() + (3 * 60 * 60 * 1000)), // 17:00 (retorno real + 3h timezone)
              passengers: 0,
              flight_hours: 0,
              overnight_stays: 0,
              value: 0,
              status: 'available',
            });
          }
        }
      }
    }

    if (slots.length > 0) {
      await prisma.booking.createMany({
        data: slots,
        skipDuplicates: true
      });
      console.log(`✅ ${slots.length} slots gerados para aeronave ${aircraftId}`);
      console.log(`📅 Slots criados de ${startDate.toLocaleDateString('pt-BR')} até ${endDate.toLocaleDateString('pt-BR')}`);
      console.log(`🕐 Horários: 00:00 às 23:59 (slots de 1 hora cada)`);
    }
  }

  // Limpar slots antigos (mais de 6 meses)
  static async cleanupOldSlots(): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 6);
    
    const deleted = await prisma.booking.deleteMany({
      where: {
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        departure_date: {
          lt: cutoffDate
        }
      }
    });

    if (deleted.count > 0) {
      console.log(`🧹 ${deleted.count} slots antigos removidos`);
    }
  }

  // Verificar disponibilidade para uma data/hora específica
  static async checkAvailability(
    aircraftId: number, 
    startTime: Date, 
    endTime: Date
  ): Promise<boolean> {
    // Verificar se há slot disponível
    const availableSlot = await prisma.booking.findFirst({
      where: {
        aircraftId,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA',
        departure_date: { lte: startTime },
        return_date: { gte: endTime }
      }
    });

    if (!availableSlot) {
      return false;
    }

    // Verificar se há conflito com reservas/bloqueios
    const conflict = await prisma.booking.findFirst({
      where: {
        aircraftId,
        status: { in: ['pendente', 'confirmada', 'paga', 'blocked'] },
        OR: [
          {
            departure_date: { lte: endTime },
            return_date: { gte: startTime }
          },
          {
            blocked_until: { gte: startTime }
          }
        ]
      }
    });

    return !conflict;
  }

  // Configurar agenda personalizada
  static async configureSchedule(
    aircraftId: number, 
    config: DaysConfig
  ): Promise<void> {
    // Limpar slots existentes
    await prisma.booking.deleteMany({
      where: {
        aircraftId,
        status: 'available',
        origin: 'AGENDA',
        destination: 'AGENDA'
      }
    });

    // Gerar novos slots com a configuração
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);

    await this.generateSlotsForPeriod(aircraftId, startDate, endDate, config);
  }
}


