import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/financials', async (req, res) => {
  const totalReceived = await prisma.booking.aggregate({ _sum: { value: true }, where: { status: 'paga' } });
  const totalPending = await prisma.booking.aggregate({ _sum: { value: true }, where: { status: 'pendente' } });
  res.json({ totalReceived: totalReceived._sum.value || 0, totalPending: totalPending._sum.value || 0 });
});

router.get('/reports', async (req, res) => {
  const totalUsers = await prisma.user.count();
  const totalBookings = await prisma.booking.count();
  const totalFlights = await prisma.aircraft.count();
  res.json({ totalUsers, totalBookings, totalFlights });
});

export default router;


