import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../auth';

const router = Router();

// Listar agenda (todas reservas e bloqueios)
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Garantir que há slots disponíveis para todas as aeronaves
    const { ScheduleService } = require('../services/scheduleService');
    
    // Buscar todas as aeronaves
    const aircrafts = await prisma.aircraft.findMany({
      where: { status: 'available' }
    });
    
    // Garantir slots para cada aeronave
    const today = new Date();
    for (const aircraft of aircrafts) {
      await ScheduleService.ensureSlotsAvailable(aircraft.id, today);
    }
    
    // Limpar slots antigos periodicamente
    await ScheduleService.cleanupOldSlots();
    
    const calendar = await prisma.booking.findMany({
      where: { status: { in: ['pendente', 'confirmada', 'paga', 'blocked', 'available'] } },
      orderBy: { departure_date: 'asc' }
    });
    
    res.json(calendar);
  } catch (error) {
    console.error('❌ Erro ao buscar agenda:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Bloquear faixa de horário (admin)
router.post('/block', authMiddleware, async (req: any, res) => {
  try {
    const { aircraftId, start, end, reason } = req.body;
    if (!aircraftId || !start || !end) {
      return res.status(400).json({ error: 'aircraftId, start, end são obrigatórios' });
    }
    
    console.log('🔒 Criando bloqueio:', { aircraftId, start, end, reason });
    
    // Criar booking com status 'blocked' e blocked_until
    const block = await prisma.booking.create({
      data: {
        userId: 1, // sistema/admin; em produção, usar req.user.userId
        aircraftId,
        origin: reason || 'BLOQUEIO',
        destination: reason || 'BLOQUEIO',
        departure_date: new Date(new Date(start + 'Z').getTime() - (3 * 60 * 60 * 1000) - (3 * 60 * 60 * 1000)), // 07:00 (início pré-voo) - ajustar timezone
        return_date: new Date(new Date(end + 'Z').getTime() + (3 * 60 * 60 * 1000)), // 21:00 (fim lógico + 3h timezone)
        actual_departure_date: new Date(new Date(start + 'Z').getTime() + (3 * 60 * 60 * 1000)), // 10:00 (partida real + 3h timezone)
        actual_return_date: new Date(new Date(end + 'Z').getTime() + (3 * 60 * 60 * 1000)), // 17:00 (retorno real + 3h timezone)
        blocked_until: new Date(end + 'Z'), // Bloqueado até o fim
        passengers: 0,
        flight_hours: 0,
        overnight_stays: 0,
        value: 0,
        status: 'blocked',
        maintenance_buffer_hours: 0 // Bloqueio manual não tem buffer adicional
      }
    });
    
    console.log('✅ Bloqueio criado:', block);
    res.status(201).json(block);
  } catch (e) {
    console.error('❌ Erro ao bloquear horário:', e);
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

// Salvar configuração de agenda permanente
router.post('/config', authMiddleware, async (req: any, res) => {
  try {
    const { aircraftId, daysConfig } = req.body;
    if (!aircraftId || !daysConfig) {
      return res.status(400).json({ error: 'aircraftId e daysConfig são obrigatórios' });
    }
    
    const { ScheduleService } = require('../services/scheduleService');
    
    // Configurar agenda usando o serviço
    await ScheduleService.configureSchedule(aircraftId, daysConfig);
    
    console.log(`✅ Agenda configurada para aeronave ${aircraftId}`);
    res.json({ 
      message: 'Agenda configurada com sucesso',
      aircraftId
    });
    
  } catch (e) {
    console.error('❌ Erro ao configurar agenda:', e);
    res.status(500).json({ error: 'Erro ao configurar agenda' });
  }
});

// Gerar agenda recorrente para uma aeronave (mantido para compatibilidade)
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
            departure_date: new Date(slotStart.getTime() - (3 * 60 * 60 * 1000) - (3 * 60 * 60 * 1000)), // 07:00 (início pré-voo) - ajustar timezone
            return_date: new Date(slotEnd.getTime() + (3 * 60 * 60 * 1000)), // 21:00 (fim lógico + 3h timezone)
            actual_departure_date: new Date(slotStart.getTime() + (3 * 60 * 60 * 1000)), // 10:00 (partida real + 3h timezone)
            actual_return_date: new Date(slotEnd.getTime() + (3 * 60 * 60 * 1000)), // 17:00 (retorno real + 3h timezone)
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


