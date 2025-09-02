import { Router } from 'express';
import { prisma } from '../db';
import { createPixChargeForBooking, getPixQrCode, getPaymentStatus, createAsaasCustomer, createSubscription, cancelSubscription, getNextPendingPayment, syncUserPaymentsStatus, syncPaymentStatus } from '../services/asaas';
import { updateUserStatus, canUserMakeBooking } from '../services/userStatus';

const router = Router();

router.post('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id: Number(bookingId) } });
    if (!booking) return res.status(404).json({ error: 'Reserva não encontrada' });
    
    // Verificar se usuário pode fazer reservas
    const canBook = await canUserMakeBooking(booking.userId);
    if (!canBook.canBook) {
      return res.status(403).json({ error: canBook.reason });
    }
    
    const user = await prisma.user.findUnique({ where: { id: booking.userId } });
    if (!user || !user.asaasCustomerId) return res.status(404).json({ error: 'Usuário sem customerId Asaas' });

    const description = `Pagamento da reserva ${bookingId}`;
    const payment = await createPixChargeForBooking(user.asaasCustomerId, booking.value, description);
    const qrCodeData = await getPixQrCode(payment.id);

    await prisma.booking.update({ where: { id: Number(bookingId) }, data: { paymentId: payment.id } });

    res.json({
      paymentId: payment.id,
      pixCopiaCola: qrCodeData.payload,
      pixQrCodeImage: qrCodeData.encodedImage,
      status: payment.status,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar cobrança Pix' });
  }
});

router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await getPaymentStatus(paymentId);
    res.json({ paymentId, status: payment.status });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar status do pagamento' });
  }
});

// Gera cobrança Pix para mensalidade (pagamento único)
router.post('/membership/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se não tem asaasCustomerId, criar cliente no Asaas
    let asaasCustomerId = user.asaasCustomerId;
    if (!asaasCustomerId) {
      try {
        asaasCustomerId = await createAsaasCustomer({
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpfCnpj,
          phone: user.phone,
        });
        
        // Atualizar usuário com o customerId
        await prisma.user.update({
          where: { id: user.id },
          data: { asaasCustomerId }
        });
      } catch (error) {
        console.error('Erro ao criar cliente no Asaas:', error);
        return res.status(500).json({ error: 'Erro ao configurar pagamento' });
      }
    }

    // Verificar se o asaasCustomerId foi obtido com sucesso
    if (!asaasCustomerId) {
      return res.status(500).json({ error: 'Não foi possível obter o ID do cliente Asaas' });
    }

    // Buscar mensalidade pendente mais recente
    const existingMembership = await prisma.membershipPayment.findFirst({
      where: {
        userId: Number(userId),
        status: 'pendente'
      },
      orderBy: { dueDate: 'desc' }
    });

    if (!existingMembership) {
      return res.status(404).json({ error: 'Nenhuma mensalidade pendente encontrada' });
    }

    // Se não tem subscriptionId, criar assinatura recorrente
    if (!existingMembership.subscriptionId) {
      try {
        const subscription = await createSubscription(
          asaasCustomerId,
          existingMembership.value,
          `Mensalidade do Clube - ${user.name}`
        );

        // Atualizar mensalidade com subscriptionId
        await prisma.membershipPayment.update({
          where: { id: existingMembership.id },
          data: { subscriptionId: subscription.id }
        });

        existingMembership.subscriptionId = subscription.id;
        // console.log(`✅ Assinatura recorrente criada: ${subscription.id} para usuário ${user.name}`);
      } catch (error) {
        console.error('❌ Erro ao criar assinatura recorrente:', error);
        return res.status(500).json({ error: 'Erro ao configurar assinatura recorrente' });
      }
    }

    // Buscar próxima cobrança pendente da assinatura
    const pendingPayment = await getNextPendingPayment(existingMembership.subscriptionId!);
    
    if (!pendingPayment) {
      return res.status(404).json({ error: 'Nenhuma cobrança pendente encontrada na assinatura' });
    }

    // Gerar QR Code PIX para a cobrança pendente
    const qrCodeData = await getPixQrCode(pendingPayment.id);

    // Atualizar mensalidade com o paymentId da cobrança atual
    await prisma.membershipPayment.update({
      where: { id: existingMembership.id },
      data: { paymentId: pendingPayment.id }
    });

    res.json({
      membershipId: existingMembership.id,
      paymentId: pendingPayment.id,
      subscriptionId: existingMembership.subscriptionId,
      pixCopiaCola: qrCodeData.payload,
      pixQrCodeImage: qrCodeData.encodedImage,
      status: pendingPayment.status,
      message: 'QR Code PIX gerado para cobrança pendente'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar cobrança Pix' });
  }
});

// Continuar pagamento de uma cobrança existente
router.post('/continue/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // Verificar se o pagamento existe e está pendente
    const paymentStatus = await getPaymentStatus(paymentId);
    
    if (paymentStatus.status === 'CONFIRMED' || paymentStatus.status === 'RECEIVED') {
      return res.json({
        status: 'confirmada',
        message: 'Pagamento já foi confirmado'
      });
    }
    
    if (paymentStatus.status !== 'PENDING' && paymentStatus.status !== 'OVERDUE') {
      return res.status(400).json({ error: 'Pagamento não está pendente' });
    }

    // Gerar QR Code PIX para a cobrança existente
    const qrCodeData = await getPixQrCode(paymentId);

    res.json({
      paymentId: paymentId,
      pixCopiaCola: qrCodeData.payload,
      pixQrCodeImage: qrCodeData.encodedImage,
      status: paymentStatus.status,
      message: 'QR Code PIX gerado para cobrança existente'
    });
  } catch (error) {
    console.error('Erro ao continuar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Verificar status do pagamento manualmente
router.post('/membership/:userId/verify-payment', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar mensalidade mais recente
    const membership = await prisma.membershipPayment.findFirst({
      where: { userId: Number(userId) },
      orderBy: { dueDate: 'desc' }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Nenhuma mensalidade encontrada' });
    }

    // Se tem paymentId, verificar status no Asaas
    if (membership.paymentId) {
      try {
        const paymentStatus = await getPaymentStatus(membership.paymentId);
        
        let newStatus = membership.status;
        
        if (paymentStatus.status === 'CONFIRMED' || paymentStatus.status === 'RECEIVED') {
          newStatus = 'confirmada';
        } else if (paymentStatus.status === 'OVERDUE') {
          newStatus = 'atrasada';
        }
        
        // Atualizar se status mudou
        if (newStatus !== membership.status) {
          await prisma.membershipPayment.update({
            where: { id: membership.id },
            data: { status: newStatus }
          });
          
          await updateUserStatus(Number(userId));
          
          return res.json({
            success: true,
            message: `Status atualizado: ${membership.status} → ${newStatus}`,
            oldStatus: membership.status,
            newStatus: newStatus,
            paymentStatus: paymentStatus.status
          });
        } else {
          return res.json({
            success: true,
            message: 'Status já está atualizado',
            status: membership.status,
            paymentStatus: paymentStatus.status
          });
        }
      } catch (error) {
        console.error('Erro ao verificar status no Asaas:', error);
        return res.status(500).json({ error: 'Erro ao verificar status no Asaas' });
      }
    } else {
      return res.json({
        success: true,
        message: 'Mensalidade sem paymentId - status local',
        status: membership.status
      });
    }
  } catch (error) {
    console.error('Erro ao verificar pagamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Pagar mensalidade existente (para mensalidades vencidas)
router.post('/membership/:userId/pay-existing', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Buscar mensalidade pendente/vencida mais recente
    const existingMembership = await prisma.membershipPayment.findFirst({
      where: {
        userId: Number(userId),
        status: {
          in: ['pendente', 'atrasada']
        }
      },
      orderBy: { dueDate: 'desc' }
    });

    if (!existingMembership) {
      return res.status(404).json({ error: 'Nenhuma mensalidade pendente encontrada' });
    }

    // Se não tem asaasCustomerId, criar cliente no Asaas
    let asaasCustomerId = user.asaasCustomerId;
    if (!asaasCustomerId) {
      try {
        asaasCustomerId = await createAsaasCustomer({
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpfCnpj,
          phone: user.phone,
        });
        
        // Atualizar usuário com o customerId
        await prisma.user.update({
          where: { id: user.id },
          data: { asaasCustomerId }
        });
      } catch (error) {
        console.error('Erro ao criar cliente no Asaas:', error);
        return res.status(500).json({ error: 'Erro ao configurar pagamento' });
      }
    }

    // Verificar se o asaasCustomerId foi obtido com sucesso
    if (!asaasCustomerId) {
      return res.status(500).json({ error: 'Não foi possível obter o ID do cliente Asaas' });
    }

    // Se já tem paymentId, retornar o existente
    if (existingMembership.paymentId) {
      try {
        const qrCodeData = await getPixQrCode(existingMembership.paymentId);
        
        return res.json({
          membershipId: existingMembership.id,
          paymentId: existingMembership.paymentId,
          pixCopiaCola: qrCodeData.payload,
          pixQrCodeImage: qrCodeData.encodedImage,
          status: existingMembership.status,
          message: 'Pagamento existente recuperado'
        });
      } catch (error) {
        console.error('Erro ao recuperar QR Code existente:', error);
        // Se não conseguir recuperar, criar novo pagamento
      }
    }

    // Criar novo pagamento para a mensalidade existente
    const description = `Mensalidade do Clube - ${user.name} (${existingMembership.dueDate.toLocaleDateString('pt-BR')})`;
    const payment = await createPixChargeForBooking(asaasCustomerId, existingMembership.value, description);
    const qrCodeData = await getPixQrCode(payment.id);

    // Atualizar mensalidade com o paymentId
    await prisma.membershipPayment.update({
      where: { id: existingMembership.id },
      data: {
        paymentId: payment.id,
        status: 'pendente'
      }
    });
    
    res.json({
      membershipId: existingMembership.id,
      paymentId: payment.id,
      pixCopiaCola: qrCodeData.payload,
      pixQrCodeImage: qrCodeData.encodedImage,
      status: payment.status,
      message: 'Pagamento gerado para mensalidade existente'
    });
  } catch (error) {
    console.error('Erro ao pagar mensalidade existente:', error);
    res.status(500).json({ error: 'Erro ao gerar pagamento para mensalidade existente' });
  }
});

// Criar assinatura recorrente para mensalidade
router.post('/membership/subscription/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Se não tem asaasCustomerId, criar cliente no Asaas
    let asaasCustomerId = user.asaasCustomerId;
    if (!asaasCustomerId) {
      try {
        asaasCustomerId = await createAsaasCustomer({
          name: user.name,
          email: user.email,
          cpfCnpj: user.cpfCnpj,
          phone: user.phone,
        });
        
        // Atualizar usuário com o customerId
        await prisma.user.update({
          where: { id: user.id },
          data: { asaasCustomerId }
        });
      } catch (error) {
        console.error('Erro ao criar cliente no Asaas:', error);
        return res.status(500).json({ error: 'Erro ao configurar pagamento' });
      }
    }

    // Verificar se o asaasCustomerId foi obtido com sucesso
    if (!asaasCustomerId) {
      return res.status(500).json({ error: 'Não foi possível obter o ID do cliente Asaas' });
    }

    const value = 200; // Valor da mensalidade
    const description = `Assinatura Mensal do Clube - ${user.name}`;
    
    // Criar assinatura recorrente no Asaas
    const subscription = await createSubscription(asaasCustomerId, value, description);

    // Criar registro de mensalidade com assinatura
    const membership = await prisma.membershipPayment.create({
      data: {
        userId: Number(userId),
        value: value,
        dueDate: new Date(), // Primeira cobrança hoje
        status: 'pendente',
        subscriptionId: subscription.id,
      }
    });
    
    res.json({
      membershipId: membership.id,
      subscriptionId: subscription.id,
      status: subscription.status,
      message: 'Assinatura recorrente criada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    res.status(500).json({ error: 'Erro ao criar assinatura recorrente' });
  }
});

// Cancelar assinatura recorrente
router.post('/membership/subscription/:subscriptionId/cancel', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    
    // Cancelar no Asaas
    const result = await cancelSubscription(subscriptionId);
    
    // Atualizar no banco
    await prisma.membershipPayment.updateMany({
      where: { subscriptionId },
      data: { status: 'cancelada' }
    });
    
    res.json({
      subscriptionId,
      status: result.status,
      message: 'Assinatura cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    res.status(500).json({ error: 'Erro ao cancelar assinatura' });
  }
});

// Endpoint para criar primeira mensalidade para usuário novo
router.post('/membership/first/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { value } = req.body;
    
    // Verificar se já existe mensalidade para este usuário
    const existingMembership = await prisma.membershipPayment.findFirst({
      where: { userId: Number(userId) }
    });
    
    if (existingMembership) {
      return res.status(400).json({ error: 'Usuário já possui mensalidade' });
    }
    
    // Criar primeira mensalidade (vencimento em 7 dias)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    const membership = await prisma.membershipPayment.create({
      data: {
        userId: Number(userId),
        value: value || 200,
        dueDate,
        status: 'pendente',
      }
    });
    
    res.json(membership);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar primeira mensalidade' });
  }
});

// Endpoint para criar uma mensalidade manualmente (admin/teste)
router.post('/membership/manual/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { value, dueDate, status } = req.body;
    const membership = await prisma.membershipPayment.create({
      data: {
        userId: Number(userId),
        value: value || 200,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: status || 'pendente',
      }
    });
    res.json(membership);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar mensalidade manualmente' });
  }
});

// Lista mensalidades do usuário
router.get('/membership/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const memberships = await prisma.membershipPayment.findMany({
      where: { userId: Number(userId) },
      orderBy: { createdAt: 'desc' } // Ordenar por data de criação (mais recente primeiro)
    });

    // Calcular status baseado na data de vencimento
    const membershipsWithStatus = memberships.map(membership => {
      const now = new Date();
      const dueDate = new Date(membership.dueDate);
      
      let status = membership.status;
      
      // Só recalcular se não estiver paga
      if (status !== 'paga') {
        if (now > dueDate) {
          status = 'atrasada';
        } else {
          status = 'pendente';
        }
      }
      // Se já está paga, manter como paga
      
      return {
        ...membership,
        status
      };
    });

    res.json(membershipsWithStatus);
  } catch (error) {
    console.error('❌ API: Erro ao buscar mensalidades:', error);
    res.status(500).json({ error: 'Erro ao buscar mensalidades' });
  }
});

// Consulta status da mensalidade
router.get('/membership/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await getPaymentStatus(paymentId);
    res.json({ paymentId, status: payment.status });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar status da mensalidade' });
  }
});

// Gera cobrança Pix para missão
router.post('/mission/:missionId', async (req, res) => {
  try {
    const { missionId } = req.params;
    const { amount, description } = req.body;
    
    // Buscar a missão
    const mission = await prisma.sharedMission.findUnique({ 
      where: { id: Number(missionId) } 
    });
    
    if (!mission) {
      return res.status(404).json({ error: 'Missão não encontrada' });
    }
    
    // Buscar o usuário
    const user = await prisma.user.findUnique({ 
      where: { id: mission.userId || 1 } // Assumindo que o usuário logado criou a missão
    });
    
    if (!user || !user.asaasCustomerId) {
      return res.status(404).json({ error: 'Usuário não encontrado ou sem customerId Asaas' });
    }
    
    // Criar cobrança Pix no Asaas
    const payment = await createPixChargeForBooking(user.asaasCustomerId, amount, description);
    const qrCodeData = await getPixQrCode(payment.id);
    
    // Atualizar missão com paymentId
    await prisma.sharedMission.update({
      where: { id: Number(missionId) },
      data: { paymentId: payment.id }
    });
    
    res.json({
      paymentId: payment.id,
      pixCopiaCola: qrCodeData.payload,
      pixQrCodeImage: qrCodeData.encodedImage,
      status: payment.status,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar cobrança Pix da missão' });
  }
});

// Listar pagamentos pendentes do usuário
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Buscar apenas pagamentos pendentes válidos (últimas 24h)
    const pendingPayments = await prisma.membershipPayment.findMany({
      where: { 
        userId: Number(userId),
        status: {
          in: ['pendente', 'processando']
        },
        paymentId: {
          not: null
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pendingPayments);
  } catch (error) {
    console.error('Erro ao buscar pagamentos pendentes:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});



// Sincronizar status de uma cobrança específica
router.post('/sync/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    // console.log(`🔄 Sincronizando status da cobrança: ${paymentId}`);
    
    // Sincronizar com o Asaas
    const asaasPayment = await syncPaymentStatus(paymentId);
    
    // Buscar mensalidade local
    const membership = await prisma.membershipPayment.findFirst({
      where: { paymentId: paymentId }
    });
    
    if (membership) {
      // Mapear status do Asaas para status local
      const statusMap: { [key: string]: string } = {
        'PENDING': 'pendente',
        'CONFIRMED': 'confirmada',
        'RECEIVED': 'confirmada',
        'OVERDUE': 'atrasada',
        'CANCELLED': 'cancelada',
        'REFUNDED': 'cancelada',
        'RECEIVED_IN_CASH': 'paga'
      };
      
      const newStatus = statusMap[asaasPayment.status] || 'pendente';
      
      if (membership.status !== newStatus) {
        await prisma.membershipPayment.update({
          where: { id: membership.id },
          data: { status: newStatus }
        });
        
        // console.log(`✅ Cobrança ${paymentId} atualizada: ${membership.status} → ${newStatus}`);
      }
      
      // Sempre atualizar status do usuário após sincronização
      const userStatusResult = await updateUserStatus(membership.userId);
      // console.log(`✅ Status do usuário ${membership.userId} atualizado: ${userStatusResult.status}`);
    }
    
    res.json({
      paymentId: paymentId,
      asaasStatus: asaasPayment.status,
      localStatus: membership?.status,
      message: 'Status sincronizado com sucesso'
    });
    
  } catch (error) {
    console.error('Erro ao sincronizar cobrança:', error);
    res.status(500).json({ error: 'Erro ao sincronizar status da cobrança' });
  }
});

// Sincronizar todas as cobranças de um usuário
router.post('/sync-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // console.log(`🔄 Sincronizando cobranças do usuário: ${userId}`);
    
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) },
      include: {
        membershipPayments: {
          where: { subscriptionId: { not: null } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    if (!user.membershipPayments[0]?.subscriptionId) {
      return res.status(400).json({ error: 'Usuário não possui assinatura configurada' });
    }
    
    // Sincronizar cobranças
    const result = await syncUserPaymentsStatus(user.id, user.membershipPayments[0].subscriptionId);
    
    res.json({
      userId: user.id,
      subscriptionId: user.membershipPayments[0].subscriptionId,
      updated: result.updated,
      errors: result.errors,
      message: `Sincronização concluída: ${result.updated} atualizações, ${result.errors} erros`
    });
    
  } catch (error) {
    console.error('Erro ao sincronizar usuário:', error);
    res.status(500).json({ error: 'Erro ao sincronizar cobranças do usuário' });
  }
});

export default router;
