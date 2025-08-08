import { Router } from 'express';
import { prisma } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  const stops = await prisma.stop.findMany();
  res.json(stops);
});

export default router;


