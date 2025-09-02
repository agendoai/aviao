import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../auth';

const router = Router();

// Middleware para verificar se é admin
const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.user.userId) }
    });

    if (user?.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar sala de chat para uma viagem compartilhada
router.post('/rooms', authMiddleware, async (req, res) => {
  try {
    const { bookingId, title, type = 'flight_sharing' } = req.body;
    const userId = parseInt(req.user.userId);

    const room = await prisma.chatRoom.create({
      data: {
        bookingId,
        title,
        type,
        createdBy: userId
      }
    });

    // Adicionar o criador como participante
    await prisma.chatParticipant.create({
      data: {
        roomId: room.id,
        userId
      }
    });

    res.json(room);
  } catch (error) {
    console.error('Erro ao criar sala de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter salas de chat do usuário
router.get('/rooms', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.user.userId);

    const rooms = await prisma.chatRoom.findMany({
      where: {
        participants: {
          some: {
            userId
          }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1,
          include: {
            user: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    res.json(rooms);
  } catch (error) {
    console.error('Erro ao buscar salas de chat:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter mensagens de uma sala
router.get('/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = parseInt(req.user.userId);

    // Verificar se o usuário é participante da sala
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: {
        roomId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem
router.post('/rooms/:roomId/messages', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { message, messageType = 'text', metadata } = req.body;
    const userId = parseInt(req.user.userId);

    // Verificar se o usuário é participante da sala
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const newMessage = await prisma.chatMessage.create({
      data: {
        roomId,
        userId,
        message,
        messageType,
        metadata
      },
      include: {
        user: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(newMessage);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Adicionar participante à sala
router.post('/rooms/:roomId/participants', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId: newUserId } = req.body;
    const currentUserId = parseInt(req.user.userId);

    // Verificar se o usuário atual é o criador da sala
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        createdBy: currentUserId
      }
    });

    if (!room) {
      return res.status(403).json({ error: 'Apenas o criador pode adicionar participantes' });
    }

    const participant = await prisma.chatParticipant.create({
      data: {
        roomId,
        userId: parseInt(newUserId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(participant);
  } catch (error) {
    console.error('Erro ao adicionar participante:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter participantes de uma sala
router.get('/rooms/:roomId/participants', authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = parseInt(req.user.userId);

    // Verificar se o usuário é participante da sala
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        roomId,
        userId
      }
    });

    if (!participant) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const participants = await prisma.chatParticipant.findMany({
      where: {
        roomId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(participants);
  } catch (error) {
    console.error('Erro ao buscar participantes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router; 
