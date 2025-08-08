import { Router } from 'express';
import { prisma } from '../db';
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

const router = Router();

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

// Criar nova reserva (usuário comum)
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
      departure_date, 
      return_date, 
      passengers, 
      flight_hours, 
      overnight_stays, 
      value, 
      status 
    } = req.body;

    // Validações
    if (!aircraftId || !origin || !destination || !departure_date || !return_date) {
      return res.status(400).json({ error: 'Campos obrigatórios: aircraftId, origin, destination, departure_date, return_date' });
    }

    // Verificar se a aeronave existe e está disponível
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId }
    });

    if (!aircraft) {
      return res.status(404).json({ error: 'Aeronave não encontrada' });
    }

    if (aircraft.status !== 'available') {
      return res.status(400).json({ error: 'Aeronave não está disponível' });
    }

    // Verificar se há conflito de horário
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        aircraftId,
        status: {
          in: ['pendente', 'confirmada', 'paga', 'blocked']
        },
        OR: [
          {
            departure_date: {
              lte: new Date(return_date)
            },
            return_date: {
              gte: new Date(departure_date)
            }
          }
        ]
      }
    });

    if (conflictingBooking) {
      return res.status(400).json({ error: 'Conflito de horário com reserva existente' });
    }

    // Criar a reserva
    const booking = await prisma.booking.create({
      data: {
        userId,
        aircraftId,
        origin,
        destination,
        departure_date: new Date(departure_date),
        return_date: new Date(return_date),
        passengers: passengers || 1,
        flight_hours: flight_hours || 2,
        overnight_stays: overnight_stays || 0,
        value: value || 0,
        status: status || 'pendente'
      },
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


    res.status(201).json(booking);
  } catch (error) {
    console.error('❌ Erro ao criar reserva:', error);
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

// Listar todas as reservas (admin)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
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
    res.json(bookings);
  } catch (error) {
    console.error('❌ Erro ao buscar reservas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar reserva específica
router.get('/:id', authMiddleware, requireAdmin, async (req, res) => {
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
router.patch('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pendente', 'confirmada', 'paga', 'cancelada'].includes(status)) {
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
router.patch('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, value, origin, destination, departure_date, return_date, passengers, flight_hours, overnight_stays } = req.body;

    // Validações
    if (status && !['pendente', 'confirmada', 'paga', 'cancelada'].includes(status)) {
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
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
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

// Estatísticas das reservas
router.get('/stats/overview', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const totalBookings = await prisma.booking.count();
    const pendingBookings = await prisma.booking.count({ where: { status: 'pendente' } });
    const confirmedBookings = await prisma.booking.count({ where: { status: 'confirmada' } });
    const paidBookings = await prisma.booking.count({ where: { status: 'paga' } });
    const cancelledBookings = await prisma.booking.count({ where: { status: 'cancelada' } });

    res.json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      paidBookings,
      cancelledBookings
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
