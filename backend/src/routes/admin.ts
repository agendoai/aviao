import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../auth';

const router = Router();
const prisma = new PrismaClient();

// Middleware para verificar se é admin
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && (req.user as any).role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }
};

// Rota para verificar status das mensalidades
router.get('/memberships-status', requireAdmin, async (req, res) => {
  try {
    const memberships = await prisma.membershipPayment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 50 // Últimas 50 mensalidades
    });

    const stats = {
      total: memberships.length,
      pendente: memberships.filter(m => m.status === 'pendente').length,
      confirmada: memberships.filter(m => m.status === 'confirmada').length,
      atrasada: memberships.filter(m => m.status === 'atrasada').length,
      cancelada: memberships.filter(m => m.status === 'cancelada').length
    };

    res.json({
      stats,
      memberships: memberships.map(m => ({
        id: m.id,
        userId: m.userId,
        userName: m.user.name,
        userEmail: m.user.email,
        value: m.value,
        dueDate: m.dueDate,
        status: m.status,
        paymentId: m.paymentId,
        createdAt: m.createdAt
      }))
    });
  } catch (error) {
    console.error('❌ Erro ao buscar status das mensalidades:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// Rota para obter configuração da mensalidade
router.get('/membership-config', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const config = await prisma.systemConfig.findUnique({
      where: { key: 'membership_value' }
    });

    res.json({
      membershipValue: config ? parseFloat(config.value) : 200.00
    });
  } catch (error) {
    console.error('Erro ao buscar configuração da mensalidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar configuração da mensalidade
router.put('/membership-config', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { membershipValue } = req.body;

    if (!membershipValue || membershipValue <= 0) {
      return res.status(400).json({ error: 'Valor da mensalidade deve ser maior que zero' });
    }

    // Buscar valor atual para comparar
    const currentConfig = await prisma.systemConfig.findUnique({
      where: { key: 'membership_value' }
    });
    
    const currentValue = currentConfig ? parseFloat(currentConfig.value) : 200.00;
    const isValueChanged = currentValue !== membershipValue;

    // Criar ou atualizar configuração
    const config = await prisma.systemConfig.upsert({
      where: { key: 'membership_value' },
      update: { 
        value: membershipValue.toString(),
        updatedAt: new Date()
      },
      create: {
        key: 'membership_value',
        value: membershipValue.toString(),
        description: 'Valor da mensalidade em reais'
      }
    });

    // Se o valor mudou, atualizar todas as assinaturas ativas no Asaas
    if (isValueChanged) {
      try {
        // console.log(`🔄 Valor da mensalidade mudou de R$ ${currentValue} para R$ ${membershipValue}`);
        // console.log('🔄 Atualizando todas as assinaturas ativas no Asaas...');
        
        // Buscar todas as assinaturas ativas
        const activeMemberships = await prisma.membershipPayment.findMany({
          where: {
            subscriptionId: { not: null },
            status: { in: ['pendente', 'confirmada', 'paga'] }
          },
          include: {
            user: true
          }
        });

        // console.log(`📊 Encontradas ${activeMemberships.length} assinaturas ativas para atualizar`);

        const { updateSubscription } = await import('../services/asaas');
        let updatedCount = 0;
        let errorCount = 0;

        for (const membership of activeMemberships) {
          try {
            if (membership.subscriptionId) {
              await updateSubscription(membership.subscriptionId, membershipValue);
              // console.log(`✅ Assinatura ${membership.subscriptionId} (${membership.user.name}) atualizada`);
              updatedCount++;
            }
          } catch (error) {
            console.error(`❌ Erro ao atualizar assinatura ${membership.subscriptionId}:`, error);
            errorCount++;
          }
        }

        // console.log(`🎯 Atualização concluída: ${updatedCount} sucessos, ${errorCount} erros`);

        res.json({
          message: `Configuração atualizada com sucesso. ${updatedCount} assinaturas atualizadas no Asaas.`,
          membershipValue: parseFloat(config.value),
          updatedSubscriptions: updatedCount,
          errors: errorCount
        });
      } catch (error) {
        console.error('Erro ao atualizar assinaturas no Asaas:', error);
        res.json({
          message: 'Configuração atualizada, mas houve erro ao atualizar assinaturas no Asaas',
          membershipValue: parseFloat(config.value),
          error: 'Erro ao sincronizar com Asaas'
        });
      }
    } else {
      res.json({
        message: 'Configuração atualizada com sucesso',
        membershipValue: parseFloat(config.value)
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar configuração da mensalidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para dados financeiros consolidados
router.get('/financials', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { period, startDate, endDate } = req.query;
    
    // Calcular datas baseado no período selecionado
    let dateFilter: any = {};
    const now = new Date();
    
    if (period) {
      switch (period) {
        case 'today':
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          dateFilter = {
            createdAt: {
              gte: today,
              lt: tomorrow
            }
          };
          break;
          
        case 'week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          dateFilter = {
            createdAt: {
              gte: startOfWeek
            }
          };
          break;
          
        case 'month':
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = {
            createdAt: {
              gte: startOfMonth
            }
          };
          break;
          
        case 'year':
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          dateFilter = {
            createdAt: {
              gte: startOfYear
            }
          };
          break;
          
        case 'custom':
          if (startDate && endDate) {
            dateFilter = {
              createdAt: {
                gte: new Date(startDate as string),
                lte: new Date(endDate as string)
              }
            };
          }
          break;
      }
    }

    // Buscar transações com filtro de data
    const transactions = await prisma.transaction.findMany({
      where: dateFilter,
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

    // Buscar mensalidades com filtro de data
    const memberships = await prisma.membershipPayment.findMany({
      where: dateFilter,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Buscar reservas com filtro de data
    const bookings = await prisma.booking.findMany({
      where: dateFilter,
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
            name: true,
            registration: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calcular estatísticas financeiras
    const totalRevenue = transactions
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const pendingRevenue = 0; // Transações não possuem status, considerando 0 para pendentes

    const membershipRevenue = memberships
      .filter(m => m.status === 'confirmada' || m.status === 'paga')
      .reduce((sum, m) => sum + (m.value || 0), 0);

    const pendingMemberships = memberships
      .filter(m => m.status === 'pendente')
      .reduce((sum, m) => sum + (m.value || 0), 0);

    const bookingRevenue = bookings
      .filter(b => b.status === 'confirmada')
      .reduce((sum, b) => sum + (b.value || 0), 0);

    const pendingBookings = bookings
      .filter(b => b.status === 'pendente')
      .reduce((sum, b) => sum + (b.value || 0), 0);

    // Estatísticas por período (adaptável baseado no filtro)
    let periodStats = [];
    
    if (!period || period === 'year') {
      // Estatísticas mensais para o ano (padrão)
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        // Buscar dados para este mês específico (sem filtro de data global)
         const monthTransactions = await prisma.transaction.findMany({
           where: {
             createdAt: { gte: date, lt: nextMonth }
           }
         });
         
         const monthMemberships = await prisma.membershipPayment.findMany({
           where: {
             createdAt: { gte: date, lt: nextMonth },
             status: { in: ['confirmada', 'paga'] }
           }
         });
         
         const monthBookings = await prisma.booking.findMany({
           where: {
             createdAt: { gte: date, lt: nextMonth },
             status: { in: ['confirmada'] }
           }
         });

        periodStats.push({
          period: date.toISOString().substring(0, 7), // YYYY-MM
          label: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
          transactions: monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
          memberships: monthMemberships.reduce((sum, m) => sum + (m.value || 0), 0),
          bookings: monthBookings.reduce((sum, b) => sum + (b.value || 0), 0),
          total: monthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) +
                 monthMemberships.reduce((sum, m) => sum + (m.value || 0), 0) +
                 monthBookings.reduce((sum, b) => sum + (b.value || 0), 0)
        });
      }
    } else if (period === 'month') {
      // Estatísticas diárias para o mês atual
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(now.getFullYear(), now.getMonth(), day);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayTransactions = await prisma.transaction.findMany({
           where: {
             createdAt: { gte: date, lt: nextDay }
           }
         });
         
         const dayMemberships = await prisma.membershipPayment.findMany({
           where: {
             createdAt: { gte: date, lt: nextDay },
             status: { in: ['confirmada', 'paga'] }
           }
         });
         
         const dayBookings = await prisma.booking.findMany({
           where: {
             createdAt: { gte: date, lt: nextDay },
             status: { in: ['confirmada'] }
           }
         });

        periodStats.push({
          period: date.toISOString().substring(0, 10), // YYYY-MM-DD
          label: date.toLocaleDateString('pt-BR'),
          transactions: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
          memberships: dayMemberships.reduce((sum, m) => sum + (m.value || 0), 0),
          bookings: dayBookings.reduce((sum, b) => sum + (b.value || 0), 0),
          total: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) +
                 dayMemberships.reduce((sum, m) => sum + (m.value || 0), 0) +
                 dayBookings.reduce((sum, b) => sum + (b.value || 0), 0)
        });
      }
    } else if (period === 'week') {
      // Estatísticas diárias para a semana atual
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);
        
        const dayTransactions = await prisma.transaction.findMany({
          where: {
            createdAt: { gte: date, lt: nextDay }
          }
        });
        
        const dayMemberships = await prisma.membershipPayment.findMany({
          where: {
            createdAt: { gte: date, lt: nextDay },
            status: { in: ['confirmada', 'paga'] }
          }
        });
        
        const dayBookings = await prisma.booking.findMany({
          where: {
            createdAt: { gte: date, lt: nextDay },
            status: { in: ['confirmada'] }
          }
        });

        periodStats.push({
          period: date.toISOString().substring(0, 10), // YYYY-MM-DD
          label: date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }),
          transactions: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
          memberships: dayMemberships.reduce((sum, m) => sum + (m.value || 0), 0),
          bookings: dayBookings.reduce((sum, b) => sum + (b.value || 0), 0),
          total: dayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) +
                 dayMemberships.reduce((sum, m) => sum + (m.value || 0), 0) +
                 dayBookings.reduce((sum, b) => sum + (b.value || 0), 0)
        });
      }
    }

    res.json({
      filter: {
        period: period || 'all',
        startDate: startDate || null,
        endDate: endDate || null
      },
      summary: {
        totalRevenue: totalRevenue + membershipRevenue + bookingRevenue,
        pendingRevenue: pendingRevenue + pendingMemberships + pendingBookings,
        transactionRevenue: totalRevenue,
        membershipRevenue,
        bookingRevenue,
        pendingTransactions: pendingRevenue,
        pendingMemberships,
        pendingBookings
      },
      counts: {
        totalTransactions: transactions.length,
        totalMemberships: memberships.length,
        confirmedMemberships: memberships.filter(m => m.status === 'confirmada' || m.status === 'paga').length,
        pendingMemberships: memberships.filter(m => m.status === 'pendente').length,
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmada').length,
        pendingBookings: bookings.filter(b => b.status === 'pendente').length
      },
      periodStats,
      recentTransactions: transactions.slice(0, 10),
      recentMemberships: memberships.slice(0, 10),
      recentBookings: bookings.slice(0, 10)
    });
  } catch (error) {
    console.error('❌ Erro ao buscar dados financeiros:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;


