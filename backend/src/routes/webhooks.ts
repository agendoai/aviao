import { Router } from 'express';
import { prisma } from '../db';
import { updateUserStatus } from '../services/userStatus';

const router = Router();

// Webhook principal - apenas roteia para webhooks específicos
router.post('/asaas', async (req, res) => {
  try {
    const { event, payment, subscription } = req.body;
    
    console.log('📥 Webhook Asaas recebido:', { event, paymentId: payment?.id, subscriptionId: subscription?.id });
    
    // Roteamento para webhooks específicos
    switch (event) {
      case 'PAYMENT_RECEIVED':
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED_IN_CASH':
        return await handlePaymentWebhook(req, res);
        
      case 'PAYMENT_CREATED':
        return await handleNewChargeWebhook(req, res);
        
      case 'PAYMENT_OVERDUE':
        return await handleOverdueWebhook(req, res);
        
      case 'SUBSCRIPTION_CREATED':
        return await handleSubscriptionCreatedWebhook(req, res);
        
      case 'SUBSCRIPTION_INACTIVATED':
      case 'SUBSCRIPTION_DELETED':
        return await handleSubscriptionCancelledWebhook(req, res);
        
      default:
        console.log(`⚠️ Evento não suportado: ${event}`);
        return res.sendStatus(200);
    }
    
  } catch (error) {
    console.error('❌ Erro no webhook Asaas:', error);
    res.sendStatus(500);
  }
});

// Webhook específico para pagamentos confirmados
router.post('/payment-confirmed', async (req, res) => {
  return await handlePaymentWebhook(req, res);
});

// Webhook específico para pagamentos vencidos
router.post('/payment-overdue', async (req, res) => {
  return await handleOverdueWebhook(req, res);
});

// Webhook específico para nova cobrança criada
router.post('/new-charge-created', async (req, res) => {
  return await handleNewChargeWebhook(req, res);
});

// Função para lidar com pagamentos confirmados
async function handlePaymentWebhook(req: any, res: any) {
  try {
    const { payment } = req.body;
    
    console.log(`💰 Pagamento confirmado - Payment ID: ${payment.id}`);
    
    // Atualizar reserva se for pagamento de voo
    await prisma.booking.updateMany({
      where: { paymentId: payment.id },
      data: { status: 'paga' }
    });

    // Atualizar mensalidade se for pagamento de mensalidade
    const membershipPayment = await prisma.membershipPayment.findFirst({
      where: { paymentId: payment.id }
    });

    if (membershipPayment) {
      // Marcar mensalidade como confirmada
      await prisma.membershipPayment.update({
        where: { id: membershipPayment.id },
        data: { status: 'confirmada' }
      });

      // Atualizar status do usuário
      await updateUserStatus(membershipPayment.userId);

      console.log(`✅ Mensalidade ID ${membershipPayment.id} marcada como confirmada`);
      console.log(`🔄 Asaas criará automaticamente a próxima cobrança`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook de pagamento:', error);
    res.sendStatus(500);
  }
}

// Função para lidar com pagamentos vencidos
async function handleOverdueWebhook(req: any, res: any) {
  try {
    const { payment } = req.body;
    
    console.log(`⏰ Pagamento vencido - Payment ID: ${payment.id}`);
    
    // Atualizar mensalidade se for pagamento de mensalidade
    const membershipPayment = await prisma.membershipPayment.findFirst({
      where: { paymentId: payment.id }
    });

    if (membershipPayment) {
      // Marcar mensalidade como atrasada
      await prisma.membershipPayment.update({
        where: { id: membershipPayment.id },
        data: { status: 'atrasada' }
      });

      // Atualizar status do usuário
      await updateUserStatus(membershipPayment.userId);

      console.log(`✅ Mensalidade ID ${membershipPayment.id} marcada como atrasada`);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook de vencimento:', error);
    res.sendStatus(500);
  }
}

// Função para lidar com nova cobrança criada
async function handleNewChargeWebhook(req: any, res: any) {
  try {
    const { payment, subscription } = req.body;
    
    console.log('📥 Webhook PAYMENT_CREATED recebido - Nova cobrança de assinatura criada pelo Asaas');
    console.log('📊 Payment ID:', payment.id);
    console.log('📊 Due Date:', payment.dueDate);
    console.log('📊 Value:', payment.value);
    console.log('🔍 Verificando se é cobrança de assinatura...');
    
    // Verificar se payment existe
    if (!payment || !payment.id) {
      console.log('❌ Payment não encontrado no payload');
      return res.sendStatus(400);
    }
    
    // Tentar obter subscriptionId de diferentes formas
    let subscriptionId = null;
    if (subscription && subscription.id) {
      subscriptionId = subscription.id;
    } else if (payment.subscription) {
      subscriptionId = payment.subscription;
    } else if (payment.subscriptionId) {
      subscriptionId = payment.subscriptionId;
    }
    
    if (!subscriptionId) {
      console.log('❌ Subscription ID não encontrado no payload');
      console.log('ℹ️ Esta é uma cobrança manual (não de assinatura)');
      console.log('ℹ️ Webhook PAYMENT_CREATED só processa cobranças de assinatura');
      console.log('ℹ️ Ignorando cobrança manual - retornando 200');
      return res.sendStatus(200);
    }
    
    console.log(`✅ Cobrança de assinatura confirmada - Payment ID: ${payment.id}, Subscription ID: ${subscriptionId}`);
    console.log(`🔄 Processando criação da próxima mensalidade local...`);
    console.log(`📅 Data de vencimento: ${payment.dueDate}`);
    console.log(`💰 Valor: R$ ${(payment.value / 100).toFixed(2)}`);
    
    // Buscar usuário diretamente pelo asaasSubscriptionId
    const user = await prisma.user.findFirst({
      where: { asaasSubscriptionId: subscriptionId }
    });

    if (user) {
      console.log(`✅ Usuário encontrado: ${user.name} (ID: ${user.id})`);
      
      // Buscar configuração do valor da mensalidade
      const membershipConfig = await prisma.systemConfig.findUnique({
        where: { key: 'membership_value' }
      });
      const membershipValue = membershipConfig ? parseFloat(membershipConfig.value) : 200.00;
      console.log(`💰 Valor da mensalidade configurado: R$ ${membershipValue}`);
      
      // Calcular data de vencimento (baseado na data da cobrança do Asaas)
      const dueDate = new Date(payment.dueDate);
      
      // Verificar se já existe uma mensalidade para este período
      const periodMembership = await prisma.membershipPayment.findFirst({
        where: {
          userId: user.id,
          dueDate: {
            gte: new Date(dueDate.getFullYear(), dueDate.getMonth(), 1),
            lt: new Date(dueDate.getFullYear(), dueDate.getMonth() + 1, 1)
          }
        }
      });
      
      if (!periodMembership) {
        // Criar nova mensalidade no banco
        const newMembership = await prisma.membershipPayment.create({
          data: {
            userId: user.id,
            value: membershipValue,
            dueDate: dueDate,
            status: 'pendente',
            subscriptionId: subscriptionId,
            paymentId: payment.id
          }
        });
        
        console.log(`✅ Nova mensalidade criada: ID ${newMembership.id}, vencimento ${dueDate.toLocaleDateString('pt-BR')}, valor R$ ${membershipValue}`);
        console.log(`🎯 Usuário ${user.name} agora tem nova mensalidade pendente!`);
        console.log(`🔄 Frontend será atualizado em até 5 segundos via polling`);
        console.log(`📱 Usuário verá: "Mensalidade Atual (PAGA)" + "Próxima Mensalidade (PENDENTE)"`);
      } else {
        // Atualizar paymentId da mensalidade existente
        await prisma.membershipPayment.update({
          where: { id: periodMembership.id },
          data: { paymentId: payment.id }
        });
        
        console.log(`ℹ️ Mensalidade existente atualizada: ID ${periodMembership.id} com paymentId ${payment.id}`);
      }
    } else {
      console.log(`❌ Nenhuma mensalidade encontrada para subscriptionId: ${subscriptionId}`);
      console.log('🔍 Tentando buscar mensalidades existentes...');
      
      // Listar todas as mensalidades para debug
      const allMemberships = await prisma.membershipPayment.findMany({
        where: { subscriptionId: { not: null } },
        include: { user: true }
      });
      
      console.log('📋 SubscriptionIds no banco:', allMemberships.map(m => ({ subscriptionId: m.subscriptionId, userId: m.userId, userName: m.user.name })));
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook de nova cobrança:', error);
    res.sendStatus(500);
  }
}

// Função para lidar com assinatura criada
async function handleSubscriptionCreatedWebhook(req: any, res: any) {
  try {
    const { subscription } = req.body;
    console.log('✅ Assinatura criada:', subscription.id);
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook de assinatura criada:', error);
    res.sendStatus(500);
  }
}

// Função para lidar com assinatura cancelada
async function handleSubscriptionCancelledWebhook(req: any, res: any) {
  try {
    const { subscription } = req.body;
    console.log('❌ Assinatura cancelada:', subscription.id);
    
    // Marcar mensalidades da assinatura como canceladas
    await prisma.membershipPayment.updateMany({
      where: { subscriptionId: subscription.id },
      data: { status: 'cancelada' }
    });
    
    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Erro no webhook de assinatura cancelada:', error);
    res.sendStatus(500);
  }
}

// Função removida - Asaas cria automaticamente a próxima cobrança

export default router;




