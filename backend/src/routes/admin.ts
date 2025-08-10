import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/financials', async (req, res) => {
  const bookingsConfirmada = await prisma.booking.aggregate({ _sum: { value: true }, where: { status: 'confirmada' } });
  const sharedConfirmada = await prisma.sharedMissionBooking.aggregate({ _sum: { totalPrice: true }, where: { status: { in: ['confirmada', 'confirmed'] } } });
  const totalReceived = (bookingsConfirmada._sum.value || 0) + (sharedConfirmada._sum.totalPrice || 0);

  const totalPending = await prisma.booking.aggregate({ _sum: { value: true }, where: { status: 'pendente' } });

  res.json({ 
    totalReceived,
    breakdown: {
      bookingsConfirmada: bookingsConfirmada._sum.value || 0,
      sharedMissionsConfirmada: sharedConfirmada._sum.totalPrice || 0,
    },
    totalPending: totalPending._sum.value || 0 
  });
});

router.get('/reports', async (req, res) => {
  const totalUsers = await prisma.user.count();
  const totalBookings = await prisma.booking.count();
  const totalFlights = await prisma.aircraft.count();
  res.json({ totalUsers, totalBookings, totalFlights });
});

export default router;


