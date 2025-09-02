import express from 'express';
import { PrismaClient } from '@prisma/client';
import { validateMission, generateTimeSlots, suggestAvailableSlots, calculateNextAvailableTimeForAircraft } from '../services/intelligentValidation';
import { authMiddleware } from '../auth';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string | number;
        email: string;
      };
    }
  }
}

const router = express.Router();
const prisma = new PrismaClient();

// Middleware para verificar se é admin
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const userId = typeof req.user.userId === 'string' ? parseInt(req.user.userId) : Number(req.user.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar permissões:', error);
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Rota para buscar slots de tempo com inteligência avançada
router.get('/time-slots/:aircraftId', authMiddleware, async (req, res) => {
  try {
    const { aircraftId } = req.params;
    const { weekStart, selectedStart, selectedEnd, missionDuration } = req.query;

    if (!weekStart) {
      return res.status(400).json({ error: 'weekStart é obrigatório' });
    }

    const weekStartDate = new Date(weekStart as string);
    const selectedStartDate = selectedStart ? new Date(selectedStart as string) : undefined;
    const selectedEndDate = selectedEnd ? new Date(selectedEnd as string) : undefined;
    const missionDurationNum = missionDuration ? parseFloat(missionDuration as string) : undefined;

    const slots = await generateTimeSlots(
      parseInt(aircraftId),
      weekStartDate,
      selectedStartDate,
      selectedEndDate,
      missionDurationNum
    );

    // Log para debug: verificar slots bloqueados
    const blockedSlots = slots.filter(slot => slot.status === 'blocked');
    console.log(`📊 Slots enviados: ${slots.length}, Bloqueados: ${blockedSlots.length}`);
    if (blockedSlots.length > 0) {
      console.log(`🚫 Slots bloqueados:`, blockedSlots.slice(0, 3).map(s => ({
        time: s.start.toLocaleTimeString('pt-BR'),
        reason: s.reason,
        blockType: s.blockType
      })));
    }

    res.json(slots);
  } catch (error) {
    console.error('Erro ao buscar slots de tempo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para sugerir horários disponíveis
router.get('/suggest-slots/:aircraftId', authMiddleware, async (req, res) => {
  try {
    const { aircraftId } = req.params;
    const { desiredStart, missionDuration } = req.query;

    if (!desiredStart || !missionDuration) {
      return res.status(400).json({ error: 'desiredStart e missionDuration são obrigatórios' });
    }

    const desiredStartDate = new Date(desiredStart as string);
    const duration = parseFloat(missionDuration as string);

    const suggestions = await suggestAvailableSlots(
      parseInt(aircraftId),
      desiredStartDate,
      duration
    );

    res.json(suggestions);
  } catch (error) {
    console.error('Erro ao sugerir slots:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar booking com validação inteligente
router.post('/', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const userId = typeof req.user.userId === 'string' ? parseInt(req.user.userId) : Number(req.user.userId);
    
    const {
      aircraftId,
      origin,
      destination,
      secondaryDestination,
      departure_date,
      return_date,
      passengers,
      flight_hours,
      overnight_stays,
      value
    } = req.body;

    // Validar dados obrigatórios
    if (!aircraftId || !origin || !destination || !departure_date || !return_date || !passengers || !flight_hours || !value) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Converter datas para objetos Date
    const departureDateTime = new Date(departure_date);
    const returnDateTime = new Date(return_date);

    // Validar missão com inteligência avançada
    const validation = await validateMission(
      aircraftId,
      departureDateTime,
      returnDateTime,
      flight_hours
    );



    if (!validation.valido) {

      return res.status(409).json({
        error: validation.mensagem,
        nextAvailable: validation.proximaDisponibilidade,
        conflictingBooking: validation.conflitoCom
      });
    }

    // Calcular horários para salvar no banco
    const returnFlightTime = flight_hours / 2; // Tempo de voo de volta
    
    // departure_date: horário real - 3h (início do pré-voo)
    const calculatedDepartureDate = new Date(departureDateTime.getTime() - (3 * 60 * 60 * 1000));
    
    // return_date: horário real + tempo de voo volta + 3h (fim do pós-voo)
    const calculatedReturnDate = new Date(returnDateTime.getTime() + (returnFlightTime * 60 * 60 * 1000) + (3 * 60 * 60 * 1000));
    
    // Calcular janela bloqueada - próximo voo só pode iniciar após retorno + tempo_voo_volta + 3h
    const blockedUntil = new Date(returnDateTime.getTime() + (returnFlightTime + 3) * 60 * 60 * 1000);

    // Criar booking
    const booking = await prisma.booking.create({
      data: {
        userId,
        aircraftId,
        origin,
        destination,
        secondaryDestination: secondaryDestination || null,
        departure_date: calculatedDepartureDate, // Horário calculado (real - 3h)
        return_date: calculatedReturnDate, // Horário calculado (real + voo volta + 3h)
        actual_departure_date: departureDateTime, // Horário real de partida
        actual_return_date: returnDateTime, // Horário real de retorno
        passengers,
        flight_hours,
        overnight_stays: overnight_stays || 0,
        value,
        status: 'pendente',
        blocked_until: blockedUntil,
        maintenance_buffer_hours: 3
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        aircraft: {
          select: {
            name: true,
            registration: true,
            model: true
          }
        }
      }
    });

    res.status(201).json({
      ...booking,
      nextAvailable: validation.nextAvailable
    });

  } catch (error) {
    console.error('Erro ao criar booking:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar reservas do usuário logado (usuário comum)
router.get('/my-bookings', authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    const userId = typeof req.user.userId === 'string' ? parseInt(req.user.userId) : Number(req.user.userId);

    
    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    

    
    res.json(bookings);
  } catch (error) {
    console.error('❌ Erro ao buscar reservas do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar reservas de uma aeronave específica (usuário comum)
router.get('/aircraft/:aircraftId', authMiddleware, async (req, res) => {
  try {
    const { aircraftId } = req.params;
    const { startDate, endDate } = req.query;

    console.log('🔍 Buscando reservas para aeronave:', aircraftId);
    console.log('🔍 Período:', { startDate, endDate });

    // Se não foram fornecidas datas, buscar todas as reservas da aeronave
    let whereClause: any = {
      aircraftId: Number(aircraftId),
      status: {
        in: ['pendente', 'confirmada', 'paga', 'blocked']
      }
    };

    // Se foram fornecidas datas, filtrar por período
    if (startDate && endDate) {
      whereClause.OR = [
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
      ];
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true
          }
        }
      },
      orderBy: {
        departure_date: 'asc'
      }
    });

    res.json(bookings);
  } catch (error) {
    console.error('❌ Erro ao buscar reservas da aeronave:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todas as reservas (admin) ou reservas de uma aeronave específica (usuário comum)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { aircraftId } = req.query;
    
    // Se foi fornecido aircraftId, permitir acesso para usuários comuns
    if (aircraftId) {
      console.log('🔍 Buscando reservas para aeronave:', aircraftId);
      
      const bookings = await prisma.booking.findMany({
        where: {
          aircraftId: Number(aircraftId),
          status: {
            in: ['pendente', 'confirmada', 'paga', 'blocked']
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          },
          aircraft: {
            select: {
              id: true,
              name: true,
              registration: true,
              model: true
            }
          }
        },
        orderBy: { departure_date: 'asc' }
      });

      console.log('✅ Reservas encontradas:', bookings.length);
      
      return res.json({
        success: true,
        bookings: bookings
      });
    }
    
    // Se não foi fornecido aircraftId, verificar se é admin para listar todas as reservas
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const userId = typeof req.user.userId === 'string' ? parseInt(req.user.userId) : Number(req.user.userId);
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores podem listar todas as reservas.' });
    }
    
    // Admin: listar todas as reservas
    const allBookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(allBookings);
  } catch (error) {
    console.error('❌ Erro ao buscar reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar reserva específica
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await prisma.booking.findUnique({
      where: { id: parseInt(id) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true
          }
        }
      }
    });
    
    if (!booking) {
      return res.status(404).json({ error: 'Reserva não encontrada' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Erro ao buscar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status da reserva
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendente', 'confirmada', 'cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true
          }
        }
      }
    });

    res.json({ message: 'Status da reserva atualizado com sucesso', booking });
  } catch (error) {
    console.error('Erro ao atualizar status da reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar reserva (edição completa)
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, value, origin, destination, departure_date, return_date, passengers, flight_hours, overnight_stays } = req.body;

    // Validações
    if (status && !['pendente', 'confirmada', 'cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    if (value && (typeof value !== 'number' || value < 0)) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (value !== undefined) updateData.value = value;
    if (origin) updateData.origin = origin;
    if (destination) updateData.destination = destination;
    if (departure_date) updateData.departure_date = new Date(departure_date);
    if (return_date) updateData.return_date = new Date(return_date);
    if (passengers !== undefined) updateData.passengers = passengers;
    if (flight_hours !== undefined) updateData.flight_hours = flight_hours;
    if (overnight_stays !== undefined) updateData.overnight_stays = overnight_stays;

    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true
          }
        }
      }
    });

    res.json({ message: 'Reserva atualizada com sucesso', booking });
  } catch (error) {
    console.error('Erro ao atualizar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar reserva
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelada' }
    });

    res.json({ message: 'Reserva cancelada com sucesso', booking });
  } catch (error) {
    console.error('Erro ao cancelar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar reserva completamente (remover do banco)
router.delete('/:id/force', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const booking = await prisma.booking.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Reserva removida completamente com sucesso', booking });
  } catch (error) {
    console.error('Erro ao deletar reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar múltiplas reservas por status
router.delete('/bulk/status/:status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.params;
    
    const deletedBookings = await prisma.booking.deleteMany({
      where: { status: status }
    });

    res.json({ 
      message: `${deletedBookings.count} reservas com status '${status}' foram removidas completamente`,
      deletedCount: deletedBookings.count
    });
  } catch (error) {
    console.error('Erro ao deletar reservas em massa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Deletar todas as reservas de um usuário específico
router.delete('/bulk/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const deletedBookings = await prisma.booking.deleteMany({
      where: { userId: parseInt(userId) }
    });

    res.json({ 
      message: `${deletedBookings.count} reservas do usuário ${userId} foram removidas completamente`,
      deletedCount: deletedBookings.count
    });
  } catch (error) {
    console.error('Erro ao deletar reservas do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar todas as reservas com status específico (endpoint de emergência)
router.delete('/cleanup/status/:status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.params;
    
    // Primeiro, contar quantas reservas existem com esse status
    const count = await prisma.booking.count({
      where: { status: status }
    });
    
    if (count === 0) {
      return res.json({ 
        message: `Nenhuma reserva com status '${status}' encontrada`,
        deletedCount: 0
      });
    }
    
    // Deletar todas as reservas com o status especificado
    const deletedBookings = await prisma.booking.deleteMany({
      where: { status: status }
    });

    res.json({ 
      message: `${deletedBookings.count} reservas com status '${status}' foram removidas completamente`,
      deletedCount: deletedBookings.count
    });
  } catch (error) {
    console.error('Erro ao limpar reservas por status:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Limpar todas as reservas (endpoint de emergência - CUIDADO!)
router.delete('/cleanup/all', authMiddleware, async (req, res) => {
  try {
    // Primeiro, contar quantas reservas existem
    const count = await prisma.booking.count();
    
    if (count === 0) {
      return res.json({ 
        message: 'Nenhuma reserva encontrada',
        deletedCount: 0
      });
    }
    
    // Deletar TODAS as reservas
    const deletedBookings = await prisma.booking.deleteMany({});

    res.json({ 
      message: `${deletedBookings.count} reservas foram removidas completamente`,
      deletedCount: deletedBookings.count
    });
  } catch (error) {
    console.error('Erro ao limpar todas as reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas das reservas
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const totalBookings = await prisma.booking.count();
    const pendingBookings = await prisma.booking.count({ where: { status: 'pendente' } });
    const confirmedBookings = await prisma.booking.count({ where: { status: 'confirmada' } });
    const cancelledBookings = await prisma.booking.count({ where: { status: 'cancelada' } });

    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para validar missão (para testes)
router.post('/validate', async (req, res) => {
  try {
    const {
      aircraftId,
      departure_date,
      return_date,
      flight_hours,
      origin,
      destination
    } = req.body;

    // Validar dados obrigatórios
    if (!aircraftId || !origin || !destination || !departure_date || !return_date || !flight_hours) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    }

    // Converter datas para objetos Date
    const departureDateTime = new Date(departure_date);
    const returnDateTime = new Date(return_date);

    // Validar missão com inteligência avançada
    const validation = await validateMission(
      aircraftId,
      departureDateTime,
      returnDateTime,
      flight_hours
    );

    if (!validation.valido) {
      return res.status(409).json({
        error: validation.mensagem,
        nextAvailable: validation.proximaDisponibilidade,
        conflictingBooking: validation.conflitoCom
      });
    }

    res.json({
      valido: true,
      mensagem: "✅ Missão válida",
      proximaDisponibilidade: validation.proximaDisponibilidade
    });

  } catch (error) {
    console.error('Erro ao validar missão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para deletar TODAS as missões (apenas para testes)
router.delete('/delete-all', authMiddleware, async (req, res) => {
  try {
    // Verificar se é admin (opcional, para segurança)
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Deletar todas as missões
    const deletedCount = await prisma.booking.deleteMany({});
    
    res.json({ 
      message: `Todas as missões foram deletadas (${deletedCount.count} missões removidas)`,
      deletedCount: deletedCount.count
    });
  } catch (error) {
    console.error('Erro ao deletar todas as missões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rotas de PIX para missões solo
router.post('/pix-payment', authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user?.userId;
    const {
      aircraftId,
      origin,
      destination,
      secondaryDestination,
      departure_date,
      return_date,
      passengers,
      flight_hours,
      overnight_stays,
      value
    } = req.body;



    // Converter datas para objetos Date
    const departureDateTime = new Date(departure_date);
    const returnDateTime = new Date(return_date);



    // Validar missão com inteligência avançada
    const validation = await validateMission(
      aircraftId,
      departureDateTime,
      returnDateTime,
      flight_hours
    );



    if (!validation.valido) {

      return res.status(409).json({
        error: validation.mensagem,
        nextAvailable: validation.proximaDisponibilidade,
        conflictingBooking: validation.conflitoCom
      });
    }

    // Calcular horários para salvar no banco
    const returnFlightTime = flight_hours / 2; // Tempo de voo de volta
    
    // departure_date: horário real - 3h (início do pré-voo)
    const calculatedDepartureDate = new Date(departureDateTime.getTime() - (3 * 60 * 60 * 1000));
    
    // return_date: horário real + tempo de voo volta + 3h (fim do pós-voo)
    const calculatedReturnDate = new Date(returnDateTime.getTime() + (returnFlightTime * 60 * 60 * 1000) + (3 * 60 * 60 * 1000));
    
    // Calcular janela bloqueada - próximo voo só pode iniciar após retorno + tempo_voo_volta + 3h
    const blockedUntil = new Date(returnDateTime.getTime() + (returnFlightTime + 3) * 60 * 60 * 1000);

    // Criar booking com status 'pendente'
    const booking = await prisma.booking.create({
      data: {
        userId,
        aircraftId,
        origin,
        destination,
        secondaryDestination: secondaryDestination || null,
        departure_date: calculatedDepartureDate, // Horário calculado (real - 3h)
        return_date: calculatedReturnDate, // Horário calculado (real + voo volta + 3h)
        actual_departure_date: departureDateTime, // Horário real de partida
        actual_return_date: returnDateTime, // Horário real de retorno
        passengers,
        flight_hours,
        overnight_stays,
        value,
        status: 'pendente'
      }
    });

    // Importar funções do Asaas
    const { createPixChargeForBooking, getPixQrCode, createAsaasCustomer } = await import('../services/asaas');

    // Verificar se o usuário já tem customerId no Asaas
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, phone: true, cpfCnpj: true, asaasCustomerId: true }
    });
    
    if (!user) {
      throw new Error('Usuário não encontrado');
    }
    
    let asaasCustomerId = user.asaasCustomerId;
    
    if (!asaasCustomerId) {
      // Criar customer no Asaas
      const customer = await createAsaasCustomer({
        name: user.name || 'Usuário',
        email: user.email || '',
        phone: user.phone || '',
        mobilePhone: user.phone || '',
        cpfCnpj: user.cpfCnpj || ''
      });
      
      asaasCustomerId = customer.id;
      
      // Atualizar usuário com asaasCustomerId
      await prisma.user.update({
        where: { id: userId },
        data: { asaasCustomerId }
      });
    }

    // Verificar se já existe um pagamento pendente para esta missão (menos de 30 minutos)
    // IMPORTANTE: Buscar APENAS na tabela Booking para evitar conflitos com missões compartilhadas
    const existingPayment = await prisma.booking.findFirst({
      where: {
        userId,
        aircraftId,
        origin,
        destination,
        status: 'pendente',
        paymentId: { not: null },
        createdAt: {
          gte: new Date(Date.now() - 30 * 60 * 1000) // Últimos 30 minutos
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    

    let pixCharge;
    let qrCodeData;

    if (existingPayment && existingPayment.paymentId) {
      
      
      // Reutilizar pagamento existente
      pixCharge = { id: existingPayment.paymentId };
      
      // Gerar QR Code PIX para o pagamento existente
      qrCodeData = await getPixQrCode(existingPayment.paymentId);
    } else {

      
      // Criar nova cobrança PIX no Asaas
      const pixDescription = `Missão Solo - ${origin} → ${destination}${secondaryDestination ? ` → ${secondaryDestination}` : ''}`;
      pixCharge = await createPixChargeForBooking(asaasCustomerId, value, pixDescription);
      
      
      
      // Gerar QR Code PIX
      qrCodeData = await getPixQrCode(pixCharge.id);
      
      // Atualizar booking com paymentId
      await prisma.booking.update({
        where: { id: booking.id },
        data: { paymentId: pixCharge.id }
      });
      
      
    }

    

    res.json({
      success: true,
      bookingId: booking.id,
      paymentId: pixCharge.id,
      qrCode: qrCodeData.encodedImage,
      copiaCola: qrCodeData.payload,
      value: value
    });

  } catch (error) {
    console.error('❌ Erro ao criar PIX para missão solo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar pagamento PIX de missão solo
router.post('/pix-payment/:paymentId/verify', authMiddleware, async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Buscar booking pelo paymentId
    const booking = await prisma.booking.findFirst({
      where: { paymentId: paymentId }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Missão não encontrada' });
    }

    // Importar função do Asaas
    const { getPaymentStatus } = await import('../services/asaas');

    // Verificar status do pagamento no Asaas
    const paymentStatus = await getPaymentStatus(paymentId);

    if (paymentStatus.status === 'CONFIRMED' || paymentStatus.status === 'RECEIVED') {
      // Atualizar status da missão para 'confirmada'
      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: 'confirmada' }
      });

      res.json({
        success: true,
        status: 'confirmada',
        message: 'Pagamento confirmado com sucesso'
      });
    } else {
      res.json({
        success: false,
        status: paymentStatus.status,
        message: 'Pagamento ainda não foi confirmado'
      });
    }

  } catch (error) {
    console.error('❌ Erro ao verificar pagamento PIX:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
