import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../auth';

const router = Router();

// Middleware para verificar se é admin
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.userId) }
    });

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// GET /aircrafts/available - Listar aeronaves disponíveis (usuário comum)
router.get('/available', authMiddleware, async (req, res) => {
  try {
    const aircrafts = await prisma.aircraft.findMany({
      where: { status: 'available' },
      orderBy: { name: 'asc' }
    });
    
    // Converter os campos para o formato esperado pelo frontend
    const formattedAircrafts = aircrafts.map((aircraft: any) => ({
      id: aircraft.id,
      name: aircraft.name,
      model: aircraft.model,
      registration: aircraft.registration,
      max_passengers: aircraft.seats,
      hourly_rate: aircraft.hourlyRate,
      overnight_fee: aircraft.overnightRate,
      status: aircraft.status
    }));
    
    res.json(formattedAircrafts);
  } catch (error) {
    console.error('❌ Erro ao buscar aeronaves disponíveis:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /aircrafts - Listar todas as aeronaves (com autenticação para admin)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const aircrafts = await prisma.aircraft.findMany({
      orderBy: { id: 'desc' }
    });
    
    // Converter os campos para o formato esperado pelo frontend
    const formattedAircrafts = aircrafts.map((aircraft: any) => ({
      id: aircraft.id,
      name: aircraft.name,
      model: aircraft.model,
      registration: aircraft.registration,
      max_passengers: aircraft.seats,
      hourly_rate: aircraft.hourlyRate,
      overnight_fee: aircraft.overnightRate,
      status: aircraft.status
    }));
    
    res.json(formattedAircrafts);
  } catch (error) {
    console.error('Erro ao buscar aeronaves:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /aircrafts - Criar nova aeronave
router.post('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { name, model, registration, max_passengers, hourly_rate, overnight_fee, status } = req.body;
    
    // Validações
    if (!name || !model || !registration) {
      return res.status(400).json({ error: 'Nome, modelo e matrícula são obrigatórios' });
    }

    // Verificar se já existe aeronave com esta matrícula
    const existingAircraft = await prisma.aircraft.findFirst({
      where: { registration }
    });

    if (existingAircraft) {
      return res.status(400).json({ error: 'Já existe uma aeronave com esta matrícula' });
    }

    const aircraft = await prisma.aircraft.create({
      data: {
        name,
        model,
        registration,
        seats: max_passengers || 8,
        hourlyRate: hourly_rate || 2800,
        overnightRate: overnight_fee || 1500,
        status: status || 'available'
      } as any
    });

    res.status(201).json(aircraft);
  } catch (error) {
    console.error('Erro ao criar aeronave:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /aircrafts/:id - Atualizar aeronave
router.put('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, model, registration, seats, hourly_rate, overnight_fee, status } = req.body;

    // Verificar se a aeronave existe
    const existingAircraft = await prisma.aircraft.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAircraft) {
      return res.status(404).json({ error: 'Aeronave não encontrada' });
    }

    const aircraft = await prisma.aircraft.update({
      where: { id: parseInt(id) },
      data: {
        name,
        model,
        registration,
        seats,
        hourlyRate: hourly_rate,
        overnightRate: overnight_fee,
        status
      } as any
    });

    res.json(aircraft);
  } catch (error) {
    console.error('Erro ao atualizar aeronave:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /aircrafts/:id - Deletar aeronave
router.delete('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a aeronave existe
    const existingAircraft = await prisma.aircraft.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAircraft) {
      return res.status(404).json({ error: 'Aeronave não encontrada' });
    }

    // Verificar se há reservas ativas para esta aeronave
    const activeBookings = await prisma.booking.findFirst({
      where: { 
        aircraftId: parseInt(id),
        status: { in: ['pendente', 'confirmada'] }
      }
    });

    if (activeBookings) {
      return res.status(400).json({ error: 'Não é possível deletar uma aeronave com reservas ativas' });
    }

    await prisma.aircraft.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Aeronave deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar aeronave:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH /aircrafts/:id/status - Atualizar status da aeronave
router.patch('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verificar se a aeronave existe
    const existingAircraft = await prisma.aircraft.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAircraft) {
      return res.status(404).json({ error: 'Aeronave não encontrada' });
    }

    const aircraft = await prisma.aircraft.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json(aircraft);
  } catch (error) {
    console.error('Erro ao atualizar status da aeronave:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
