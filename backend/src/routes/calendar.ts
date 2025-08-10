import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../auth';

const router = Router();

// Listar agenda (todas reservas e bloqueios)
router.get('/', authMiddleware, async (req, res) => {
  const calendar = await prisma.booking.findMany({
    where: { status: { in: ['pendente', 'confirmada', 'paga', 'blocked', 'available'] } },
    orderBy: { departure_date: 'asc' }
  });
  res.json(calendar);
});

// Bloquear faixa de horário (admin)
router.post('/block', authMiddleware, async (req: any, res) => {
  try {
    const { aircraftId, start, end, reason } = req.body;
    if (!aircraftId || !start || !end) {
      return res.status(400).json({ error: 'aircraftId, start, end são obrigatórios' });
    }
    // Criar booking com status 'blocked'
    const block = await prisma.booking.create({
      data: {
        userId: 1, // sistema/admin; em produção, usar req.user.userId
        aircraftId,
        origin: reason || 'BLOQUEIO',
        destination: reason || 'BLOQUEIO',
        departure_date: new Date(start),
        return_date: new Date(end),
        passengers: 0,
        flight_hours: 0,
        overnight_stays: 0,
        value: 0,
        status: 'blocked'
      }
    });
    res.status(201).json(block);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao bloquear horário' });
  }
});

// Desbloquear (cancelar bloqueio)
router.delete('/block/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.booking.findUnique({ where: { id: parseInt(id) } });
    if (!existing || existing.status !== 'blocked') {
      return res.status(404).json({ error: 'Bloqueio não encontrado' });
    }
    await prisma.booking.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Bloqueio removido' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao remover bloqueio' });
  }
});

// Gerar agenda recorrente para uma aeronave
router.post('/generate', authMiddleware, async (req: any, res) => {
  try {
    const { aircraftId, startDate, daysConfig } = req.body;
    if (!aircraftId || !startDate || !daysConfig) {
      return res.status(400).json({ error: 'aircraftId, startDate e daysConfig são obrigatórios' });
    }
    // Gerar slots para 3 meses a partir da data de início
    const start = new Date(startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 3);
    const slots = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const weekDay = d.getDay();
      const config = daysConfig[weekDay];
      if (config && config.active) {
        for (let h = config.startHour; h < config.endHour; h++) {
          const slotStart = new Date(d);
          slotStart.setHours(h, 0, 0, 0);
          const slotEnd = new Date(d);
          slotEnd.setHours(h + 1, 0, 0, 0);
          slots.push({
            userId: 1, // sistema/admin; em produção, usar req.user.userId
            aircraftId,
            origin: 'AGENDA',
            destination: 'AGENDA',
            departure_date: new Date(slotStart),
            return_date: new Date(slotEnd),
            passengers: 0,
            flight_hours: 0,
            overnight_stays: 0,
            value: 0,
            status: 'available',
          });
        }
      }
    }
    // Remover slots que já existem (conflito de horário)
    for (const slot of slots) {
      const conflict = await prisma.booking.findFirst({
        where: {
          aircraftId: slot.aircraftId,
          status: { in: ['pendente', 'confirmada', 'paga', 'blocked', 'available'] },
          OR: [
            {
              departure_date: { lte: slot.return_date },
              return_date: { gte: slot.departure_date },
            },
          ],
        },
      });
      if (!conflict) {
        await prisma.booking.create({ data: slot });
      }
    }
    res.json({ message: 'Agenda gerada com sucesso' });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao gerar agenda' });
  }
});

export default router;


