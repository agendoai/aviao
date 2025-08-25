import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../auth';
import { ScheduleService } from '../services/scheduleService';
import { MissionCalculator } from '../services/missionCalculator';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * POST /api/schedule/calculate-mission
 * Calcula uma missão e verifica disponibilidade
 */
router.post('/calculate-mission', async (req, res) => {
  try {
    const {
      aircraftId,
      origin,
      destinations,
      departureTime,
      groundTimePerDestination = 1,
      maintenanceTime = 3
    } = req.body;

    // Validações
    if (!aircraftId || !origin || !destinations || !departureTime) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: aircraftId, origin, destinations, departureTime'
      });
    }

    if (!Array.isArray(destinations) || destinations.length === 0) {
      return res.status(400).json({
        error: 'Destinations deve ser um array não vazio'
      });
    }

    // Verificar se a aeronave existe
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId }
    });

    if (!aircraft) {
      return res.status(404).json({
        error: 'Aeronave não encontrada'
      });
    }

    // Calcular missão e verificar disponibilidade
    const result = await ScheduleService.calculateMissionWithAvailability(
      aircraftId,
      origin,
      destinations,
      new Date(departureTime),
      groundTimePerDestination,
      maintenanceTime
    );

    res.json({
      success: true,
      ...result,
      aircraft: {
        id: aircraft.id,
        name: aircraft.name,
        registration: aircraft.registration,
        model: aircraft.model
      }
    });

  } catch (error: any) {
    console.error('Erro ao calcular missão:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/schedule/available-slots/:aircraftId
 * Busca slots disponíveis para uma aeronave
 */
router.get('/available-slots/:aircraftId', async (req, res) => {
  try {
    const { aircraftId } = req.params;
    const { startDate, endDate, minDuration = 2 } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: startDate, endDate'
      });
    }

    const slots = await ScheduleService.getAvailableSlots(
      Number(aircraftId),
      new Date(startDate as string),
      new Date(endDate as string),
      Number(minDuration)
    );

    res.json({
      success: true,
      slots
    });

  } catch (error: any) {
    console.error('Erro ao buscar slots disponíveis:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/schedule/aircraft/:aircraftId
 * Busca agenda de uma aeronave
 */
router.get('/aircraft/:aircraftId', async (req, res) => {
  try {
    const { aircraftId } = req.params;
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: startDate, endDate'
      });
    }

    const schedule = await ScheduleService.getAircraftSchedule(
      Number(aircraftId),
      new Date(startDate as string),
      new Date(endDate as string)
    );

    res.json({
      success: true,
      schedule
    });

  } catch (error: any) {
    console.error('Erro ao buscar agenda da aeronave:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * POST /api/schedule/book
 * Cria uma reserva e bloqueia a agenda
 */
router.post('/book', async (req, res) => {
  try {
    const {
      aircraftId,
      origin,
      destinations,
      departureTime,
      groundTimePerDestination = 1,
      maintenanceTime = 3,
      passengers = 1
    } = req.body;

    const userId = (req as any).user.id;

    // Validações
    if (!aircraftId || !origin || !destinations || !departureTime) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: aircraftId, origin, destinations, departureTime'
      });
    }

    // Calcular missão e verificar disponibilidade
    const result = await ScheduleService.calculateMissionWithAvailability(
      aircraftId,
      origin,
      destinations,
      new Date(departureTime),
      groundTimePerDestination,
      maintenanceTime
    );

    if (!result.isAvailable) {
      return res.status(409).json({
        error: 'Horário não disponível',
        conflicts: result.conflicts,
        nextAvailableTime: result.nextAvailableTime
      });
    }

    // Criar reserva
    const booking = await prisma.booking.create({
      data: {
        userId,
        aircraftId,
        origin,
        destination: destinations.join(', '),
        departure_date: new Date(departureTime.getTime() - (3 * 60 * 60 * 1000)), // 04:00 (início pré-voo - 3h antes)
        return_date: result.mission.estimatedReturnTime, // 21:00 (fim lógico)
        actual_departure_date: departureTime, // 07:00 (hora real que o usuário escolheu)
        actual_return_date: result.mission.estimatedReturnTime, // 18:00 (hora real que o usuário escolheu)
        passengers,
        flight_hours: Math.ceil(result.mission.totalFlightTime),
        overnight_stays: 0, // Por enquanto sem pernoite
        value: result.mission.totalCost,
        status: 'pendente'
      }
    });

    // Bloquear agenda da aeronave
    await ScheduleService.blockAircraftSchedule(
      aircraftId,
      booking.id,
      new Date(departureTime),
      result.mission.maintenanceEndTime,
      `Reserva #${booking.id} - ${(req as any).user.name}`
    );

    res.json({
      success: true,
      booking,
      mission: result.mission
    });

  } catch (error: any) {
    console.error('Erro ao criar reserva:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * DELETE /api/schedule/booking/:bookingId
 * Cancela uma reserva e libera a agenda
 */
router.delete('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = (req as any).user.id;

    // Buscar reserva
    const booking = await prisma.booking.findUnique({
      where: { id: Number(bookingId) },
      include: { schedule: true }
    });

    if (!booking) {
      return res.status(404).json({
        error: 'Reserva não encontrada'
      });
    }

    // Verificar se o usuário é o dono da reserva
    if (booking.userId !== userId) {
      return res.status(403).json({
        error: 'Não autorizado a cancelar esta reserva'
      });
    }

    // Verificar se pode cancelar (não pode cancelar se já foi paga e está próxima da data)
    const now = new Date();
    const timeUntilDeparture = booking.departure_date.getTime() - now.getTime();
    const hoursUntilDeparture = timeUntilDeparture / (1000 * 60 * 60);

    if (booking.status === 'paga' && hoursUntilDeparture < 24) {
      return res.status(400).json({
        error: 'Não é possível cancelar reservas pagas com menos de 24h de antecedência'
      });
    }

    // Remover bloqueio da agenda
    await ScheduleService.unblockAircraftSchedule(Number(bookingId));

    // Atualizar status da reserva
    await prisma.booking.update({
      where: { id: Number(bookingId) },
      data: { status: 'cancelada' }
    });

    res.json({
      success: true,
      message: 'Reserva cancelada com sucesso'
    });

  } catch (error: any) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

/**
 * GET /api/schedule/bookings/:aircraftId
 * Busca bookings de uma aeronave com blocked_until para o SmartCalendar
 */
router.get('/bookings/:aircraftId', async (req, res) => {
  try {
    const { aircraftId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('🔍 Buscando bookings para aeronave:', aircraftId);
    console.log('🔍 Período:', { startDate, endDate });

    if (!startDate || !endDate) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: startDate, endDate'
      });
    }

    // Buscar bookings reais (reservas e bloqueios)
    const bookings = await prisma.booking.findMany({
      where: {
        aircraftId: Number(aircraftId),
        status: {
          in: ['pendente', 'confirmada', 'paga', 'blocked']
        },
        OR: [
          {
            departure_date: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          },
          {
            return_date: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          }
        ]
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { departure_date: 'asc' }
    });

    // Buscar slots de agenda gerados pelo admin (status: 'available')
    const adminSlots = await prisma.booking.findMany({
      where: {
        aircraftId: Number(aircraftId),
        status: 'available',
        OR: [
          {
            departure_date: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          },
          {
            return_date: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string)
            }
          }
        ]
      },
      orderBy: { departure_date: 'asc' }
    });

    console.log('📅 Bookings reais encontrados:', bookings.length);
    console.log('📅 Slots de agenda admin encontrados:', adminSlots.length);

    // Usar blocked_until real do banco ou calcular se não existir
    const bookingsWithBlockedUntil = bookings.map(booking => {
      const departureTime = new Date(booking.departure_date);
      const returnTime = new Date(booking.return_date);
      
      // Usar blocked_until do banco se existir, senão calcular usando a mesma lógica do backend
      let blockedUntil: Date;
      if (booking.blocked_until) {
        blockedUntil = booking.blocked_until;
      } else {
        // Calcular usando a mesma lógica do backend: retorno + tempo de voo de volta + 3h de manutenção
        const totalFlightDuration = booking.flight_hours || 1; // tempo total de voo (ida + volta)
        const returnFlightDuration = totalFlightDuration / 2; // tempo de voo de volta (metade do total)
        
        // Converter para minutos para maior precisão
        const returnFlightDurationMinutes = returnFlightDuration * 60;
        const flightEnd = new Date(returnTime.getTime() + (returnFlightDurationMinutes * 60 * 1000)); // Retorno + tempo de voo de volta
        blockedUntil = new Date(flightEnd.getTime() + (3 * 60 * 60 * 1000)); // +3 horas de manutenção
        
        // Arredondar para a próxima hora para evitar confusão no calendário
        blockedUntil.setMinutes(0, 0, 0); // Zerar minutos, segundos e milissegundos
        blockedUntil.setHours(blockedUntil.getHours() + 1); // Arredondar para próxima hora
      }
      
      console.log(`📅 Booking ${booking.id}: ${booking.origin} → ${booking.destination}`);
      console.log(`📅   Partida: ${departureTime.toISOString()}`);
      console.log(`📅   Retorno: ${returnTime.toISOString()}`);
      console.log(`📅   Bloqueado até: ${blockedUntil.toISOString()}`);
      console.log(`📅   Fonte blocked_until: ${booking.blocked_until ? 'banco' : 'calculado'}`);
      
      return {
        ...booking,
        blocked_until: blockedUntil,
        maintenance_buffer_hours: booking.maintenance_buffer_hours || 3
      };
    });

    // Processar slots de agenda do admin (sem blocked_until pois são apenas slots disponíveis)
    const adminSlotsProcessed = adminSlots.map(slot => ({
      ...slot,
      blocked_until: null, // Slots disponíveis não têm bloqueio
      maintenance_buffer_hours: 0
    }));

    // Combinar bookings reais + slots de agenda
    const allBookings = [...bookingsWithBlockedUntil, ...adminSlotsProcessed];

    console.log('✅ Resposta enviada com', allBookings.length, 'registros (bookings + slots admin)');
    
    res.json({
      success: true,
      bookings: allBookings
    });

  } catch (error: any) {
    console.error('Erro ao buscar bookings da aeronave:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
});

export default router;
