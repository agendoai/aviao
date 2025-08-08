import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.post('/asaas', async (req, res) => {
  const { event, payment } = req.body;
  
  if (event === 'PAYMENT_RECEIVED') {
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
      // Marcar mensalidade como paga
      await prisma.membershipPayment.update({
        where: { id: membershipPayment.id },
        data: { status: 'paga' }
      });

      // Criar próxima mensalidade (vencimento em 1 mês)
      const nextDueDate = new Date();
      nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      
      await prisma.membershipPayment.create({
        data: {
          userId: membershipPayment.userId,
          value: membershipPayment.value,
          dueDate: nextDueDate,
          status: 'pendente'
        }
      });
    }
  }
  
  res.sendStatus(200);
});

export default router;
