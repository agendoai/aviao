import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../auth';

const router = Router();

// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware);

/**
 * POST /api/missions/secondary-departure
 * Salva o horário de saída do destino secundário
 */
router.post('/secondary-departure', async (req, res) => {
  try {
    const {
      missionId,
      secondaryDepartureTime
    } = req.body;

    // Validações
    if (!missionId || !secondaryDepartureTime) {
      return res.status(400).json({
        error: 'Parâmetros obrigatórios: missionId, secondaryDepartureTime'
      });
    }

    // Verificar se a missão existe
    const mission = await prisma.booking.findUnique({
      where: { id: Number(missionId) }
    });

    if (!mission) {
      return res.status(404).json({
        error: 'Missão não encontrada'
      });
    }

    // Atualizar a missão com o horário de saída do destino secundário
    const updatedMission = await prisma.booking.update({
      where: { id: Number(missionId) },
      data: {
        secondary_departure_time: new Date(secondaryDepartureTime)
      }
    });

    res.json({
      success: true,
      message: 'Horário de saída do destino secundário salvo com sucesso',
      mission: updatedMission
    });

  } catch (error) {
    console.error('Erro ao salvar horário de saída do destino secundário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;