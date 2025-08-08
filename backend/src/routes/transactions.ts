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

// Todas as transações (apenas admin)
router.get('/', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        booking: {
          select: {
            id: true,
            value: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// Transações do usuário logado (cliente)
router.get('/my-transactions', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.user.userId);
    
    const transactions = await prisma.transaction.findMany({
      where: {
        userId: userId
      },
      include: {
        booking: {
          select: {
            id: true,
            origin: true,
            destination: true,
            departure_date: true,
            return_date: true,
            value: true,
            status: true,
            aircraft: {
              select: {
                name: true,
                registration: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    res.json(transactions);
  } catch (error) {
    console.error('Erro ao buscar transações do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

export default router; 