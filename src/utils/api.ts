import { buildApiUrl } from '@/config/api';



// Usuários
export async function getUsers() {
  const token = localStorage.getItem('token');
  const url = buildApiUrl('/api/users');

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Informações do usuário logado (usuário comum)
export async function getCurrentUser() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/users/me'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}
export async function createUser(data) {
  const res = await fetch(buildApiUrl('/api/users'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Aeronaves
export async function getAircrafts() {
  try {
    const token = localStorage.getItem('token');
    const url = buildApiUrl('/api/aircrafts/available');

    const res = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    if (!res.ok) {

      return [];
    }
    
    return res.json();
  } catch (error) {

    return [];
  }
}

// Todas as aeronaves (apenas admin)
export async function getAllAircrafts() {
  const token = localStorage.getItem('token');
  const url = buildApiUrl('/api/aircrafts');

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Criar aeronave (apenas admin)
export async function createAircraft(data) {
  const token = localStorage.getItem('token');
  const url = buildApiUrl('/api/aircrafts');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Reservas
export async function getBookings() {
  const token = localStorage.getItem('token');
  const url = buildApiUrl('/api/bookings/my-bookings');

  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || 'Erro ao buscar reservas');
  }
  
  const data = await res.json();
  return data;
}

// Todas as reservas (apenas admin)
export async function getAllBookings() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/bookings'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}
 
// Agenda (calendar)
export async function getCalendar() {
  const token = localStorage.getItem('token');
  const url = buildApiUrl('/api/calendar');
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

export async function blockTimeSlot(data: { aircraftId: number; start: string; end: string; reason?: string }) {
  const token = localStorage.getItem('token');
  const url = buildApiUrl('/api/calendar/block');
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

export async function unblockTimeSlot(id: number) {
  const token = localStorage.getItem('token');
  const url = buildApiUrl(`/api/calendar/block/${id}`);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}
export async function createBooking(data) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/bookings'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!res.ok) {
    const errorData = await res.json();
    console.error('❌ Erro na criação da missão:', {
      status: res.status,
      statusText: res.statusText,
      error: errorData
    });
    
    if (res.status === 409) {
      const conflictMessage = errorData.error || 'Existe uma missão conflitante no período selecionado';
      const nextAvailable = errorData.nextAvailable ? `\n💡 Próximo horário disponível: ${new Date(errorData.nextAvailable).toLocaleString('pt-BR')}` : '';
      const fullMessage = `⛔ CONFLITO DE HORÁRIO: ${conflictMessage}${nextAvailable}`;
              // // console.log('🔍 Lançando erro 409:', fullMessage);
      throw new Error(fullMessage);
    } else {
      const fullMessage = `Erro ${res.status}: ${errorData.error || 'Erro ao criar missão'}`;
              // // console.log('🔍 Lançando erro genérico:', fullMessage);
      throw new Error(fullMessage);
    }
  }
  
  return res.json();
}

// Missões compartilhadas
export async function getSharedMissions() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/shared-missions'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Validar missão compartilhada
export async function validateSharedMission(data: {
  aircraftId: number;
  departure_date: string;
  return_date: string;
  flight_hours: number;
  origin: string;
  destination: string;
}) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/shared-missions/validate'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Criar missão compartilhada
export async function createSharedMission(data: {
  title: string;
  description?: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  aircraftId: number;
  totalSeats: number;
  availableSeats?: number;
  pricePerSeat: number;
  totalCost: number;
  overnightFee?: number;
  flight_hours?: number;
}) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/shared-missions'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

// Buscar missão compartilhada específica
export async function getSharedMission(id: number) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl(`/api/shared-missions/${id}`), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Reservar assento em missão compartilhada
export async function bookSharedMissionSeat(missionId: number, seats: number) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl(`/api/shared-missions/${missionId}/book`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ seats })
  });
  return res.json();
}

// Minhas missões compartilhadas (criadas por mim)
export async function getMyCreatedSharedMissions() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/shared-missions/my/created'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Minhas reservas em missões compartilhadas
export async function getMySharedMissionBookings() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/shared-missions/my/bookings'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Pagamentos
export async function createPixPayment(bookingId) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl(`/api/payments/booking/${bookingId}`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

export async function getPaymentStatus(paymentId) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl(`/api/payments/status/${paymentId}`), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Aeroportos
export async function getAirports() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/airports'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Paradas
export async function getStops() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/stops'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Relatórios
export async function getFinancials() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/admin/financials'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

export async function getReports() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/admin/reports'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Transações
export async function getTransactions() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/transactions'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
}

// Transações do usuário logado (cliente)
export async function getMyTransactions() {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl('/api/transactions/my-transactions'), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
} 

// Chat API functions
export const createChatRoom = async (data: {
  bookingId: string;
  title: string;
  type?: string;
}) => {
  const response = await fetch(buildApiUrl('/api/chat/rooms'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const getChatRooms = async () => {
  const response = await fetch(buildApiUrl('/api/chat/rooms'), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.json();
};

export const getChatMessages = async (roomId: string) => {
  const response = await fetch(buildApiUrl(`/api/chat/rooms/${roomId}/messages`), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.json();
};

export const sendChatMessageToRoom = async (roomId: string, data: {
  message: string;
  messageType?: string;
  metadata?: any;
}) => {
  const response = await fetch(buildApiUrl(`/api/chat/rooms/${roomId}/messages`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });
  return response.json();
};

export const getChatParticipants = async (roomId: string) => {
  const response = await fetch(buildApiUrl(`/api/chat/rooms/${roomId}/participants`), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.json();
};

export const addChatParticipant = async (roomId: string, userId: string) => {
  const response = await fetch(buildApiUrl(`/api/chat/rooms/${roomId}/participants`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ userId })
  });
  return response.json();
};

// Funções adicionais para missões compartilhadas
export async function bookSharedMission(missionId: number, seats: number) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl(`/api/shared-missions/${missionId}/book`), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ seats })
  });
  return res.json();
}

export async function cancelSharedMission(missionId: number) {
  const token = localStorage.getItem('token');
  const res = await fetch(buildApiUrl(`/api/shared-missions/${missionId}`), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  return res.json();
} 

// Participation Requests APIs
export const createParticipationRequest = async (data: {
  sharedMissionId: number;
  message?: string;
}) => {
  const response = await fetch(buildApiUrl('/api/shared-missions/participation-requests'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao criar pedido de participação');
  }

  return response.json();
};

export const getParticipationRequestsForMission = async (missionId: number) => {
  const response = await fetch(buildApiUrl(`/api/shared-missions/participation-requests/mission/${missionId}`), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar pedidos de participação');
  }

  return response.json();
};

export const getMyParticipationRequests = async () => {
  const response = await fetch(buildApiUrl('/api/shared-missions/participation-requests/my'), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar meus pedidos');
  }

  return response.json();
};

export const sendParticipationRequestMessage = async (requestId: number, data: {
  message: string;
  messageType?: 'message' | 'acceptance' | 'rejection';
}) => {
  const response = await fetch(buildApiUrl(`/api/shared-missions/participation-requests/${requestId}/messages`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao enviar mensagem');
  }

  return response.json();
};

export const acceptParticipationRequest = async (requestId: number) => {
  const response = await fetch(buildApiUrl(`/api/shared-missions/participation-requests/${requestId}/accept`), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao aceitar pedido');
  }

  return response.json();
};

export const rejectParticipationRequest = async (requestId: number) => {
  const response = await fetch(buildApiUrl(`/api/shared-missions/participation-requests/${requestId}/reject`), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao rejeitar pedido');
  }

  return response.json();
};

// Obter contagem de mensagens não lidas
export const getMessageCounts = async () => {
  const response = await fetch(buildApiUrl('/api/shared-missions/participation-requests/message-counts'), {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao buscar contagem de mensagens');
  }

  return response.json();
};

// Marcar mensagens como lidas
export const markMessagesAsRead = async (requestId: number) => {
  const response = await fetch(buildApiUrl(`/api/shared-missions/participation-requests/${requestId}/mark-read`), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao marcar mensagens como lidas');
  }

  return response.json();
}; 

// Buscar slots de tempo para uma semana
export const getTimeSlots = async (
  aircraftId: number, 
  weekStart: string, 
  selectedStart?: string, 
  selectedEnd?: string,
  missionDuration?: number,
  singleDay?: boolean
): Promise<any[]> => {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams({
    weekStart,
    ...(selectedStart && { selectedStart }),
    ...(selectedEnd && { selectedEnd }),
    ...(missionDuration && { missionDuration: missionDuration.toString() }),
    ...(singleDay && { singleDay: 'true' })
  });

  const res = await fetch(buildApiUrl(`/api/bookings/time-slots/${aircraftId}?${params}`), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!res.ok) {
    throw new Error('Erro ao buscar slots de tempo');
  }
  
  return res.json();
};

export const suggestAvailableSlots = async (
  aircraftId: number,
  desiredStart: string,
  missionDuration: number
): Promise<Date[]> => {
  try {
    const response = await fetch(
      buildApiUrl(`/api/bookings/suggest-slots/${aircraftId}?desiredStart=${desiredStart}&missionDuration=${missionDuration}`),
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Erro ao buscar sugestões de horários');
    }
    
    const suggestions = await response.json();
    return suggestions.map((date: string) => new Date(date));
  } catch (error) {
    console.error('Erro ao buscar sugestões:', error);
    throw error;
  }
};

// Deletar todas as missões (apenas para testes)
export const deleteAllBookings = async (): Promise<any> => {
  const token = localStorage.getItem('token');
  
  const res = await fetch(buildApiUrl('/api/bookings/delete-all'), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  });
  
  if (!res.ok) {
    throw new Error('Erro ao deletar missões');
  }
  
  return res.json();
};
