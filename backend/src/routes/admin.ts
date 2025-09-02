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

export default router;


