import { Router } from 'express';
import { prisma } from '../db';
import { createPixChargeForBooking, getPixQrCode, getPaymentStatus } from '../services/asaas';

const router = Router();

router.post('/booking/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await prisma.booking.findUnique({ where: { id: Number(bookingId) } });
    if (!booking) return res.status(404).json({ error: 'Reserva não encontrada' });
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

// Gera cobrança Pix para mensalidade
router.post('/membership/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!user || !user.asaasCustomerId) return res.status(404).json({ error: 'Usuário não encontrado ou sem customerId Asaas' });
    // Defina o valor e vencimento da mensalidade conforme sua regra
    const value = 200; // Exemplo: R$200
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7); // Vence em 7 dias
    const description = `Mensalidade do clube - ${dueDate.toLocaleDateString('pt-BR')}`;
    // Cria cobrança Pix no Asaas
    const payment = await createPixChargeForBooking(user.asaasCustomerId, value, description);
    const qrCodeData = await getPixQrCode(payment.id);
    // Cria registro da mensalidade
    const membership = await prisma.membershipPayment.create({
      data: {
        userId: user.id,
        value,
        dueDate,
        status: 'pendente',
        paymentId: payment.id,
      }
    });
    res.json({
      paymentId: payment.id,
      pixCopiaCola: qrCodeData.payload,
      pixQrCodeImage: qrCodeData.encodedImage,
      status: payment.status,
      membershipId: membership.id,
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar cobrança Pix da mensalidade' });
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
      console.log(`📊 Mensalidade ID ${membership.id}: status original = ${status}, dueDate = ${dueDate}, now = ${now}`);
      
      // Só recalcular se não estiver paga
      if (status !== 'paga') {
        if (now > dueDate) {
          status = 'atrasada';
        } else {
          status = 'pendente';
        }
      }
      // Se já está paga, manter como paga
      
      console.log(`✅ Status final: ${status}`);
      
      return {
        ...membership,
        status
      };
    });

    res.json(membershipsWithStatus);
  } catch (error) {
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

export default router;
