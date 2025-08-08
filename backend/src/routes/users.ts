import express from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../auth';

const router = express.Router();

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

// Buscar informações do usuário logado (usuário comum)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.user.userId);
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('❌ Erro ao buscar informações do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todos os usuários
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        id: 'desc'
      }
    });

    res.json(users);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar usuário específico
router.get('/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Bloquear/Desbloquear usuário
router.patch('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'blocked'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json({ message: `Usuário ${status === 'blocked' ? 'bloqueado' : 'desbloqueado'} com sucesso`, user });
  } catch (error) {
    console.error('Erro ao atualizar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status de reserva
router.patch('/bookings/:bookingId/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    if (!['pendente', 'confirmada', 'paga', 'cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const booking = await prisma.booking.update({
      where: { id: parseInt(bookingId) },
      data: { status },
      include: {
        user: true,
        aircraft: true
      }
    });

    res.json({ message: 'Status da reserva atualizado com sucesso', booking });
  } catch (error) {
    console.error('Erro ao atualizar status da reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status de missão compartilhada
router.patch('/missions/:missionId/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { missionId } = req.params;
    const { status } = req.body;

    if (!['pendente', 'confirmada', 'paga', 'cancelada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const mission = await prisma.sharedMission.update({
      where: { id: parseInt(missionId) },
      data: { status },
      include: {
        user: true
      }
    });

    res.json({ message: 'Status da missão atualizado com sucesso', mission });
  } catch (error) {
    console.error('Erro ao atualizar status da missão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status de pagamento de mensalidade
router.patch('/membership/:paymentId/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status } = req.body;

    if (!['pendente', 'paga', 'atrasada'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const payment = await prisma.membershipPayment.update({
      where: { id: parseInt(paymentId) },
      data: { status },
      include: {
        user: true
      }
    });

    res.json({ message: 'Status do pagamento atualizado com sucesso', payment });
  } catch (error) {
    console.error('Erro ao atualizar status do pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Estatísticas gerais dos usuários
router.get('/stats/overview', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { status: 'active' } });
    const blockedUsers = await prisma.user.count({ where: { status: 'blocked' } });
    const totalBookings = await prisma.booking.count();
    const totalMissions = await prisma.sharedMission.count();
    const totalPayments = await prisma.membershipPayment.count();

    res.json({
      totalUsers,
      activeUsers,
      blockedUsers,
      totalBookings,
      totalMissions,
      totalPayments
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
