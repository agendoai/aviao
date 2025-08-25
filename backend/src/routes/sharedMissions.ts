import { Router } from 'express';
import { prisma } from '../db';
import { authMiddleware } from '../auth';

const router = Router();

// Criar nova missão compartilhada
router.post('/', authMiddleware, async (req, res) => {
  try {
    const rawUserId = (req as any).user?.userId;
    const userId = parseInt(String(rawUserId));
    const {
      title,
      description,
      origin,
      destination,
      departure_date,
      return_date,
      aircraftId,
      totalSeats,
      pricePerSeat,
      totalCost,
      overnightFee,
      overnightStays
    } = req.body;

    // Validações
    if (
      !title ||
      !origin ||
      !destination ||
      !departure_date ||
      !return_date ||
      !aircraftId ||
      !totalSeats ||
      pricePerSeat === undefined ||
      totalCost === undefined
    ) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios: title, origin, destination, departure_date, return_date, aircraftId, totalSeats, totalCost' 
      });
    }

    // Verificar se a aeronave existe
    const aircraft = await prisma.aircraft.findUnique({
      where: { id: aircraftId }
    });

    if (!aircraft) {
      return res.status(404).json({ error: 'Aeronave não encontrada' });
    }

    if (aircraft.status !== 'available') {
      return res.status(400).json({ error: 'Aeronave não está disponível' });
    }

    if (totalSeats > aircraft.seats) {
      return res.status(400).json({ error: 'Número de assentos excede a capacidade da aeronave' });
    }

    // Calcular número de pernoites
    const departureDate = new Date(departure_date);
    const returnDate = new Date(return_date);
    const calculatedOvernightStays = Math.max(0, Math.floor((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24)));

    // Calcular blocked_until (retorno + tempo de voo volta + 3 horas de manutenção)
    const returnFlightTime = 2 / 2; // flight_hours / 2 (valor padrão 2h)
    const pousoVolta = new Date(returnDate.getTime() + (returnFlightTime * 60 * 60 * 1000));
    const blockedUntil = new Date(pousoVolta.getTime() + (3 * 60 * 60 * 1000)); // Pouso volta + 3h
    
    console.log(`📅 Criando missão compartilhada com bloqueio:`);
    console.log(`📅   Retorno: ${returnDate.toISOString()}`);
    console.log(`📅   Bloqueado até: ${blockedUntil.toISOString()}`);

    // Criar a missão compartilhada
    const sharedMission = await prisma.sharedMission.create({
      data: {
        title,
        description,
        origin,
        destination,
        departure_date: new Date(departureDate.getTime() + (3 * 60 * 60 * 1000)), // Ajustar timezone
        return_date: new Date(returnDate.getTime() + (3 * 60 * 60 * 1000)), // Ajustar timezone
        aircraftId,
        totalSeats,
        availableSeats: totalSeats,
        pricePerSeat: pricePerSeat ?? 0,
        totalCost: totalCost ?? 0,
        overnightFee: overnightFee || 0,
        overnightStays: calculatedOvernightStays,
        createdBy: userId
      },
      include: {
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true,
            seats: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Criar booking para bloquear o calendário
    const calendarBooking = await prisma.booking.create({
      data: {
        userId: userId,
        aircraftId: aircraftId,
        origin: origin,
        destination: destination,
        departure_date: new Date(departureDate.getTime() - (3 * 60 * 60 * 1000)), // 04:00 (início pré-voo - 3h antes)
        return_date: blockedUntil, // 21:00 (fim lógico)
        actual_departure_date: departureDate, // 07:00 (hora real que o usuário escolheu)
        actual_return_date: returnDate, // 18:00 (hora real que o usuário escolheu)
        passengers: totalSeats,
        flight_hours: 2, // Valor padrão
        overnight_stays: calculatedOvernightStays,
        value: totalCost ?? 0,
        status: 'confirmada', // Status confirmada para missão compartilhada
        blocked_until: blockedUntil,
        maintenance_buffer_hours: 3
      }
    });

    console.log(`✅ Booking criado para calendário: ${calendarBooking.id}`);

    res.status(201).json(sharedMission);
  } catch (error) {
    console.error('❌ Erro ao criar missão compartilhada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar todas as missões compartilhadas ativas
router.get('/', authMiddleware, async (req, res) => {
  try {
    const sharedMissions = await prisma.sharedMission.findMany({
      where: {
        status: 'active',
        availableSeats: {
          gt: 0
        }
      },
      include: {
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true,
            seats: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        departure_date: 'asc'
      }
    });

    res.json(sharedMissions);
  } catch (error) {
    console.error('❌ Erro ao buscar missões compartilhadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Buscar missão compartilhada específica
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const sharedMission = await prisma.sharedMission.findUnique({
      where: { id: parseInt(id) },
      include: {
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true,
            seats: true
          }
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!sharedMission) {
      return res.status(404).json({ error: 'Missão compartilhada não encontrada' });
    }

    res.json(sharedMission);
  } catch (error) {
    console.error('❌ Erro ao buscar missão compartilhada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Reservar assento em missão compartilhada
router.post('/:id/book', authMiddleware, async (req, res) => {
  try {
    const rawUserId = (req as any).user?.userId;
    const userId = parseInt(String(rawUserId));
    const { id } = req.params;
    const { seats } = req.body;

    if (!seats || seats < 1) {
      return res.status(400).json({ error: 'Número de assentos deve ser maior que 0' });
    }

    // Buscar a missão compartilhada
    const sharedMission = await prisma.sharedMission.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sharedMission) {
      return res.status(404).json({ error: 'Missão compartilhada não encontrada' });
    }

    if (sharedMission.status !== 'active') {
      return res.status(400).json({ error: 'Missão não está mais ativa' });
    }

    if (sharedMission.availableSeats < seats) {
      return res.status(400).json({ error: 'Assentos insuficientes disponíveis' });
    }

    // Verificar se o usuário já tem uma reserva nesta missão
    const existingBooking = await prisma.sharedMissionBooking.findFirst({
      where: {
        sharedMissionId: parseInt(id),
        userId
      }
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'Você já possui uma reserva nesta missão' });
    }

    // Calcular preço total
    const totalPrice = sharedMission.pricePerSeat * seats;

    // Criar a reserva
    const booking = await prisma.sharedMissionBooking.create({
      data: {
        sharedMissionId: parseInt(id),
        userId,
        seats,
        totalPrice
      },
      include: {
        sharedMission: {
          include: {
            aircraft: true,
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Atualizar assentos disponíveis
    await prisma.sharedMission.update({
      where: { id: parseInt(id) },
      data: {
        availableSeats: sharedMission.availableSeats - seats
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('❌ Erro ao reservar assento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Cancelar missão compartilhada (apenas o criador)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const rawUserId = (req as any).user?.userId;
    const userId = parseInt(String(rawUserId));
    const { id } = req.params;

    const sharedMission = await prisma.sharedMission.findUnique({
      where: { id: parseInt(id) }
    });

    if (!sharedMission) {
      return res.status(404).json({ error: 'Missão compartilhada não encontrada' });
    }

    if (sharedMission.createdBy !== userId) {
      return res.status(403).json({ error: 'Apenas o criador pode cancelar a missão' });
    }

    // Cancelar a missão
    await prisma.sharedMission.update({
      where: { id: parseInt(id) },
      data: { status: 'cancelled' }
    });

    res.json({ message: 'Missão compartilhada cancelada com sucesso' });
  } catch (error) {
    console.error('❌ Erro ao cancelar missão compartilhada:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar minhas missões compartilhadas (criadas por mim)
router.get('/my/created', authMiddleware, async (req, res) => {
  try {
    const rawUserId = (req as any).user?.userId;
    const userId = parseInt(String(rawUserId));
    
    const sharedMissions = await prisma.sharedMission.findMany({
      where: { createdBy: userId },
      include: {
        aircraft: {
          select: {
            id: true,
            name: true,
            registration: true,
            model: true
          }
        },
        bookings: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(sharedMissions);
  } catch (error) {
    console.error('❌ Erro ao buscar minhas missões compartilhadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar minhas reservas em missões compartilhadas
router.get('/my/bookings', authMiddleware, async (req, res) => {
  try {
    const rawUserId = (req as any).user?.userId;
    const userId = parseInt(String(rawUserId));
    
    const bookings = await prisma.sharedMissionBooking.findMany({
      where: { userId },
      include: {
        sharedMission: {
          include: {
            aircraft: {
              select: {
                id: true,
                name: true,
                registration: true,
                model: true
              }
            },
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(bookings);
  } catch (error) {
    console.error('❌ Erro ao buscar minhas reservas em missões compartilhadas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Criar pedido de participação
router.post('/participation-requests', authMiddleware, async (req, res) => {
  try {
    const { sharedMissionId, message } = req.body;
    const userId = parseInt((req as any).user.userId);

    if (!(req as any).user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se a missão existe e tem assentos disponíveis
    const mission = await prisma.sharedMission.findUnique({
      where: { id: sharedMissionId }
    });

    if (!mission) {
      return res.status(404).json({ error: 'Missão não encontrada' });
    }

    if (mission.availableSeats <= 0) {
      return res.status(400).json({ error: 'Não há assentos disponíveis' });
    }

    if (mission.createdBy === userId) {
      return res.status(400).json({ error: 'Você não pode pedir participação na sua própria missão' });
    }

    // Verificar se já existe um pedido pendente
    const existingRequest = await prisma.participationRequest.findFirst({
      where: {
        sharedMissionId,
        userId,
        status: 'pending'
      }
    });

    if (existingRequest) {
      return res.status(400).json({ error: 'Você já tem um pedido pendente para esta missão' });
    }

    // Criar o pedido
    const request = await prisma.participationRequest.create({
      data: {
        sharedMissionId,
        userId,
        message: message || 'Olá! Gostaria de participar da sua missão compartilhada. Podemos conversar sobre os detalhes?'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sharedMission: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    res.json(request);
  } catch (error) {
    console.error('Erro ao criar pedido de participação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar pedidos de participação (para o proprietário da missão)
router.get('/participation-requests/mission/:missionId', authMiddleware, async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = parseInt((req as any).user.userId);

    if (!(req as any).user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o usuário é o proprietário da missão
    const mission = await prisma.sharedMission.findUnique({
      where: { id: parseInt(missionId) }
    });

    if (!mission || mission.createdBy !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const requests = await prisma.participationRequest.findMany({
      where: {
        sharedMissionId: parseInt(missionId)
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sharedMission: {
          select: {
            id: true,
            title: true,
            creator: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        chatMessages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Erro ao listar pedidos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Listar pedidos do usuário
router.get('/participation-requests/my', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt((req as any).user.userId);

    if (!(req as any).user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    const requests = await prisma.participationRequest.findMany({
      where: {
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        sharedMission: {
          select: {
            id: true,
            title: true,
            creator: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        chatMessages: {
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Erro ao listar pedidos do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Enviar mensagem no chat
router.post('/participation-requests/:requestId/messages', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message, messageType = 'message' } = req.body;
    const senderId = parseInt((req as any).user.userId);

    if (!(req as any).user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o pedido existe e o usuário tem acesso
    const request = await prisma.participationRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        user: true,
        sharedMission: {
          include: {
            creator: true
          }
        }
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar se o usuário é o solicitante ou o proprietário da missão
    if (request.userId !== senderId && request.sharedMission.createdBy !== senderId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        participationRequestId: parseInt(requestId),
        senderId,
        message,
        messageType
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(chatMessage);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Aceitar pedido de participação
router.put('/participation-requests/:requestId/accept', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = parseInt((req as any).user.userId);

    if (!(req as any).user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o pedido existe
    const request = await prisma.participationRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        sharedMission: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar se o usuário é o proprietário da missão
    if (request.sharedMission.createdBy !== userId) {
      return res.status(403).json({ error: 'Apenas o proprietário pode aceitar pedidos' });
    }

    // Verificar se a missão ainda tem assentos disponíveis
    if (request.sharedMission.availableSeats <= 0) {
      return res.status(400).json({ error: 'Não há assentos disponíveis' });
    }

    // Atualizar o pedido e a missão em uma transação
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar status do pedido
      const updatedRequest = await tx.participationRequest.update({
        where: { id: parseInt(requestId) },
        data: { status: 'accepted' }
      });

      // Reduzir assentos disponíveis
      const updatedMission = await tx.sharedMission.update({
        where: { id: request.sharedMissionId },
        data: {
          availableSeats: request.sharedMission.availableSeats - 1
        }
      });

      // Adicionar mensagem de aceitação
      await tx.chatMessage.create({
        data: {
          participationRequestId: parseInt(requestId),
          senderId: userId,
          message: '✅ Pedido aceito! Você foi aprovado para participar da missão.',
          messageType: 'acceptance'
        }
      });

      return { updatedRequest, updatedMission };
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao aceitar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rejeitar pedido de participação
router.put('/participation-requests/:requestId/reject', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = parseInt((req as any).user.userId);

    if (!(req as any).user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o pedido existe
    const request = await prisma.participationRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        sharedMission: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar se o usuário é o proprietário da missão
    if (request.sharedMission.createdBy !== userId) {
      return res.status(403).json({ error: 'Apenas o proprietário pode rejeitar pedidos' });
    }

    // Atualizar o pedido e adicionar mensagem de rejeição
    const result = await prisma.$transaction(async (tx) => {
      // Atualizar status do pedido
      const updatedRequest = await tx.participationRequest.update({
        where: { id: parseInt(requestId) },
        data: { status: 'rejected' }
      });

      // Adicionar mensagem de rejeição
      await tx.chatMessage.create({
        data: {
          participationRequestId: parseInt(requestId),
          senderId: userId,
          message: '❌ Pedido rejeitado. Obrigado pelo interesse.',
          messageType: 'rejection'
        }
      });

      return updatedRequest;
    });

    res.json(result);
  } catch (error) {
    console.error('Erro ao rejeitar pedido:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter contagem de mensagens não lidas para o usuário
router.get('/participation-requests/message-counts', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt((req as any).user.userId);

    if (!(req as any).user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Buscar todas as missões criadas pelo usuário
    const myMissions = await prisma.sharedMission.findMany({
      where: { createdBy: userId },
      select: { id: true, title: true }
    });

    // Buscar todos os pedidos do usuário
    const myRequests = await prisma.participationRequest.findMany({
      where: { userId },
      select: { 
        id: true, 
        sharedMissionId: true,
        sharedMission: {
          select: { id: true, title: true }
        }
      }
    });

    const messageCounts = {
      totalUnread: 0,
      missionCounts: {} as { [missionId: number]: { title: string; unreadCount: number; requestId: number } },
      myMissionsCounts: {} as { [missionId: number]: { title: string; totalRequests: number; pendingRequests: number } }
    };

    // Contar mensagens não lidas para pedidos do usuário (como requester)
    for (const request of myRequests) {
      const unreadCount = await prisma.chatMessage.count({
        where: {
          participationRequestId: request.id,
          senderId: { not: userId }, // Mensagens de outros usuários
          readAt: null // Apenas mensagens não lidas
        }
      });

      if (unreadCount > 0) {
        messageCounts.totalUnread += unreadCount;
        messageCounts.missionCounts[request.sharedMissionId] = {
          title: request.sharedMission.title,
          unreadCount,
          requestId: request.id
        };
      }
    }

    // Contar pedidos pendentes e mensagens não lidas para missões do usuário (como owner)
    for (const mission of myMissions) {
      const requests = await prisma.participationRequest.findMany({
        where: { sharedMissionId: mission.id },
        select: { id: true, status: true }
      });

      const totalRequests = requests.length;
      const pendingRequests = requests.filter(r => r.status === 'pending').length;

      // Contar mensagens não lidas para esta missão (como owner)
      let totalUnreadForMission = 0;
      for (const request of requests) {
        const unreadCount = await prisma.chatMessage.count({
          where: {
            participationRequestId: request.id,
            senderId: { not: userId }, // Mensagens de outros usuários
            readAt: null // Apenas mensagens não lidas
          }
        });
        totalUnreadForMission += unreadCount;
      }

      // Adicionar ao total geral
      messageCounts.totalUnread += totalUnreadForMission;

      if (totalRequests > 0) {
        messageCounts.myMissionsCounts[mission.id] = {
          title: mission.title,
          totalRequests,
          pendingRequests,
          unreadCount: totalUnreadForMission
        };
      }
    }

    res.json(messageCounts);
  } catch (error) {
    console.error('Erro ao obter contagem de mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Marcar mensagens como lidas
router.put('/participation-requests/:requestId/mark-read', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = parseInt((req as any).user.userId);

    if (!(req as any).user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }

    // Verificar se o pedido existe e se o usuário tem acesso
    const request = await prisma.participationRequest.findUnique({
      where: { id: parseInt(requestId) },
      include: {
        sharedMission: true
      }
    });

    if (!request) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    // Verificar se o usuário é o requester ou o owner da missão
    if (request.userId !== userId && request.sharedMission.createdBy !== userId) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Marcar todas as mensagens não lidas como lidas
    // Para o requester: marcar mensagens do owner como lidas
    // Para o owner: marcar mensagens do requester como lidas
    await prisma.chatMessage.updateMany({
      where: {
        participationRequestId: parseInt(requestId),
        senderId: { not: userId }, // Mensagens de outros usuários
        readAt: null // Apenas mensagens não lidas
      },
      data: {
        readAt: new Date()
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao marcar mensagens como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

export default router;
