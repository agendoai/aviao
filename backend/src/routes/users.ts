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

    // Atualizar status do usuário após mudança na mensalidade
    await updateUserStatus(payment.userId);

    res.json({ message: 'Status do pagamento atualizado com sucesso', payment });
  } catch (error) {
    console.error('Erro ao atualizar status do pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar e atualizar status do usuário
router.post('/status/check/:userId', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await updateUserStatus(parseInt(userId));
    
    res.json({
      message: 'Status do usuário verificado',
      userId: parseInt(userId),
      status: result.status,
      message: result.message
    });
  } catch (error) {
    console.error('Erro ao verificar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar se usuário pode fazer reservas
router.get('/can-book/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await canUserMakeBooking(parseInt(userId));
    
    res.json({
      userId: parseInt(userId),
      canBook: result.canBook,
      reason: result.reason
    });
  } catch (error) {
    console.error('Erro ao verificar permissão de reserva:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Atualizar status de todos os usuários (cron job)
router.post('/status/check-all', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const result = await updateAllUsersStatus();
    
    res.json({
      message: 'Status de todos os usuários verificado',
      updated: result.updated,
      errors: result.errors
    });
  } catch (error) {
    console.error('Erro ao verificar status de todos os usuários:', error);
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

// Verificar status do usuário e mensalidades
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        asaasCustomerId: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar mensalidade do mês atual
    const currentMonth = new Date();
    const currentYear = currentMonth.getFullYear();
    const currentMonthNumber = currentMonth.getMonth();
    
    // Primeiro, buscar mensalidade PAGA mais recente (prioridade máxima)
    let currentMembership = await prisma.membershipPayment.findFirst({
      where: { 
        userId: Number(userId),
        status: 'confirmada'
      },
      orderBy: { dueDate: 'desc' }
    });

    // Se não encontrou mensalidade paga, buscar mensalidade PENDENTE mais recente
    if (!currentMembership) {
      currentMembership = await prisma.membershipPayment.findFirst({
        where: { 
          userId: Number(userId),
          status: 'pendente'
        },
        orderBy: { dueDate: 'desc' }
      });
    }

    // Se não encontrou mensalidade pendente, buscar mensalidade ATRASADA mais recente
    if (!currentMembership) {
      currentMembership = await prisma.membershipPayment.findFirst({
        where: { 
          userId: Number(userId),
          status: 'atrasada'
        },
        orderBy: { dueDate: 'desc' }
      });
    }

    // Se ainda não encontrou, buscar a mais recente de qualquer status
    if (!currentMembership) {
      currentMembership = await prisma.membershipPayment.findFirst({
        where: { userId: Number(userId) },
        orderBy: { dueDate: 'desc' }
      });
    }



    // Buscar histórico de mensalidades (últimas 5)
    const memberships = await prisma.membershipPayment.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    let needsPayment = false;
    let paymentMessage = '';

    if (currentMembership) {
      const now = new Date();
      const dueDate = new Date(currentMembership.dueDate);
      
      if (currentMembership.status === 'pendente' && now > dueDate) {
        needsPayment = true;
        paymentMessage = 'Mensalidade vencida - pagamento necessário';
      } else if (currentMembership.status === 'atrasada') {
        needsPayment = true;
        paymentMessage = 'Mensalidade em atraso - pagamento necessário';
      } else if (currentMembership.status === 'confirmada') {
        needsPayment = false;
        paymentMessage = 'Mensalidade confirmada';
      } else if (currentMembership.status === 'pendente') {
        needsPayment = true;
        paymentMessage = 'Mensalidade pendente';
      }
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      },
      currentMembership: currentMembership ? {
        id: currentMembership.id,
        value: currentMembership.value,
        dueDate: currentMembership.dueDate,
        status: currentMembership.status,
        paymentId: currentMembership.paymentId
      } : null,
      memberships: memberships.map(m => ({
        id: m.id,
        value: m.value,
        dueDate: m.dueDate,
        status: m.status,
        paymentId: m.paymentId
      })),
      needsPayment,
      paymentMessage,
      canAccessFeatures: user.status === 'active'
    });
  } catch (error) {
    console.error('Erro ao verificar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
