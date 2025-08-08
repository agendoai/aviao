import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Plane, Users, MapPin, Calendar, Clock, Share2, Bell, Settings, MessageCircle, Send, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { 
  createChatRoom, 
  getChatRooms, 
  getChatMessages, 
  sendChatMessageToRoom, 
  getChatParticipants,
  addChatParticipant 
} from '@/utils/api';
import { useAuth } from '@/hooks/use-auth';

interface SharedMissionData {
  aircraft: {
    id: string;
    name: string;
    registration: string;
    model: string;
    maxPassengers: number;
  };
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  origin: string;
  destination: string;
  stops: string;
  notes: string;
  availableSeats: number;
  totalCost: number;
}

interface ChatMessage {
  id: string;
  message: string;
  messageType: string;
  metadata?: any;
  createdAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface ChatParticipant {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface ChatRoom {
  id: string;
  bookingId?: string;
  title: string;
  type: string;
  createdBy: string;
  createdAt: string;
  participants: ChatParticipant[];
  messages: ChatMessage[];
}

interface InterestedUser {
  id: string;
  name: string;
  avatar: string;
  status: 'pending' | 'approved' | 'rejected';
  lastMessage?: string;
  unreadCount: number;
}

interface SharedMissionConfirmationProps {
  missionData: SharedMissionData;
  onFinish: () => void;
}

const SharedMissionConfirmation: React.FC<SharedMissionConfirmationProps> = ({
  missionData,
  onFinish
}) => {
  const { user } = useAuth();
  
  // Dono paga o total
  const ownerCost = missionData.totalCost;
  const departureDateTime = new Date(`${missionData.departureDate}T${missionData.departureTime}`);
  const returnDateTime = new Date(`${missionData.returnDate}T${missionData.returnTime}`);

  // Estados para o modal de gerenciamento
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Carregar salas de chat quando abrir o modal
  useEffect(() => {
    if (showManageModal) {
      loadChatRooms();
    }
  }, [showManageModal]);

  // Carregar mensagens quando selecionar uma sala
  useEffect(() => {
    if (selectedRoom) {
      loadChatMessages(selectedRoom.id);
    }
  }, [selectedRoom]);

  const loadChatRooms = async () => {
    try {
      setLoading(true);
      const rooms = await getChatRooms();
      setChatRooms(rooms);
    } catch (error) {
      console.error('Erro ao carregar salas de chat:', error);
      toast.error('Erro ao carregar salas de chat');
    } finally {
      setLoading(false);
    }
  };

  const loadChatMessages = async (roomId: string) => {
    try {
      const messages = await getChatMessages(roomId);
      setChatMessages(messages);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedRoom) return;

    try {
      const message = await sendChatMessageToRoom(selectedRoom.id, {
        message: newMessage,
        messageType: 'text'
      });
      
      setChatMessages([...chatMessages, message]);
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      // Aqui você pode implementar a lógica de aprovação
      toast.success('Usuário aprovado!', {
        description: 'O usuário foi aprovado para participar da viagem.'
      });
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
      toast.error('Erro ao aprovar usuário');
    }
  };

  const handleRejectUser = async (userId: string) => {
    try {
      // Aqui você pode implementar a lógica de rejeição
      toast.error('Usuário rejeitado', {
        description: 'O usuário foi rejeitado da viagem.'
      });
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error);
      toast.error('Erro ao rejeitar usuário');
    }
  };

  const handleNextSteps = () => {
    toast.info('Aguardando interessados na sua viagem...', {
      description: 'Você será notificado quando alguém se interessar em participar.'
    });
  };

  const handleManage = () => {
    setShowManageModal(true);
  };

  const handleCloseModal = () => {
    setShowManageModal(false);
    setSelectedRoom(null);
  };

  const handleSelectRoom = (room: ChatRoom) => {
    setSelectedRoom(room);
  };

  const handleShare = () => {
    // Criar link para compartilhamento
    const shareUrl = `${window.location.origin}/shared-flight/${missionData.aircraft.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Viagem Compartilhada',
        text: `Participe da minha viagem de ${missionData.origin} para ${missionData.destination}!`,
        url: shareUrl
      });
    } else {
      // Fallback para copiar para clipboard
      navigator.clipboard.writeText(shareUrl).then(() => {
        toast.success('Link copiado!', {
          description: 'Compartilhe este link com seus amigos.'
        });
      });
    }
  };

  const handleNotifications = () => {
    toast.success('Notificações ativadas!', {
      description: 'Você receberá alertas quando alguém se interessar pela viagem.'
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Viagem Compartilhada Criada!
        </h2>
        <p className="text-gray-600">
          Sua viagem foi criada com sucesso e já está disponível para outros usuários
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Detalhes da Missão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-aviation-blue" />
              <span>Detalhes da Missão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Aeronave:</span>
                <span className="font-medium">{missionData.aircraft.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registro:</span>
                <span className="font-medium">{missionData.aircraft.registration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modelo:</span>
                <span className="font-medium">{missionData.aircraft.model}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Rota</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="font-medium">{missionData.origin}</div>
                  <div className="text-sm text-gray-500">
                    {format(departureDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="text-center text-gray-400">↓</div>
                <div>
                  <div className="font-medium">{missionData.destination}</div>
                  <div className="text-sm text-gray-500">
                    {format(returnDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>

            {missionData.stops && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Escalas:</div>
                <div className="text-sm text-gray-600">{missionData.stops}</div>
              </div>
            )}

            {missionData.notes && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Observações:</div>
                <div className="text-sm text-gray-600">{missionData.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações de Compartilhamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-aviation-blue" />
              <span>Compartilhamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Poltronas disponíveis:</span>
                <Badge variant="outline" className="text-aviation-blue">
                  {missionData.availableSeats}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacidade total:</span>
                <span className="font-medium">{missionData.aircraft.maxPassengers} passageiros</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sua poltrona:</span>
                <Badge variant="outline" className="text-green-600">
                  Reservada
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Custos:</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Custo total da viagem:</span>
                    <span className="font-medium text-aviation-blue">R$ {ownerCost.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Share2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Status da Viagem</span>
              </div>
              <div className="text-sm text-blue-700 mb-3">
                Sua viagem está agora disponível para outros usuários. Você receberá notificações 
                quando alguém se interessar em participar.
              </div>
              <div className="flex items-center justify-between text-xs text-blue-600">
                <span>Status: Ativa</span>
                <Badge variant="outline" className="text-green-600 bg-green-50">
                  Disponível
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card className="text-center cursor-pointer hover:shadow-md transition-shadow" onClick={handleNextSteps}>
          <CardContent className="p-4">
            <Calendar className="h-8 w-8 text-aviation-blue mx-auto mb-2" />
            <div className="text-sm font-medium">Próximos Passos</div>
            <div className="text-xs text-gray-500">
              Aguarde interessados na sua viagem
            </div>
          </CardContent>
        </Card>

        <Card className="text-center cursor-pointer hover:shadow-md transition-shadow" onClick={handleManage}>
          <CardContent className="p-4">
            <Users className="h-8 w-8 text-aviation-blue mx-auto mb-2" />
            <div className="text-sm font-medium">Gerenciar</div>
            <div className="text-xs text-gray-500">
              Veja quem se interessou pela viagem
            </div>
          </CardContent>
        </Card>

        <Card className="text-center cursor-pointer hover:shadow-md transition-shadow" onClick={handleShare}>
          <CardContent className="p-4">
            <Share2 className="h-8 w-8 text-aviation-blue mx-auto mb-2" />
            <div className="text-sm font-medium">Compartilhar</div>
            <div className="text-xs text-gray-500">
              Divulgue sua viagem para amigos
            </div>
          </CardContent>
        </Card>

        <Card className="text-center cursor-pointer hover:shadow-md transition-shadow" onClick={handleNotifications}>
          <CardContent className="p-4">
            <Bell className="h-8 w-8 text-aviation-blue mx-auto mb-2" />
            <div className="text-sm font-medium">Notificações</div>
            <div className="text-xs text-gray-500">
              Ativar alertas de interesse
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-4">
        <div className="text-sm text-gray-600">
          Sua viagem compartilhada foi criada com sucesso! Você pode gerenciar esta viagem 
          na seção "Minhas Missões" do painel principal.
        </div>
        
        <Button 
          onClick={onFinish}
          className="bg-aviation-gradient hover:opacity-90 text-white px-8"
        >
          Finalizar
        </Button>
      </div>

      {/* Modal de Gerenciamento */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl h-[80vh] flex flex-col">
            {/* Header do Modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-aviation-blue" />
                <div>
                  <h3 className="text-lg font-semibold">Gerenciar Viagem Compartilhada</h3>
                  <p className="text-sm text-gray-600">
                    {missionData.origin} → {missionData.destination}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 flex overflow-hidden">
              {/* Lista de Salas de Chat */}
              <div className="w-1/3 border-r bg-gray-50">
                <div className="p-4 border-b">
                  <h4 className="font-medium text-gray-900">Salas de Chat ({chatRooms.length})</h4>
                </div>
                <div className="overflow-y-auto h-full">
                  {loading ? (
                    <div className="p-4 text-center text-gray-500">
                      Carregando...
                    </div>
                  ) : chatRooms.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma sala de chat encontrada
                    </div>
                  ) : (
                    chatRooms.map((room) => (
                      <div
                        key={room.id}
                        className={`p-4 border-b cursor-pointer hover:bg-gray-100 transition-colors ${
                          selectedRoom?.id === room.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                        onClick={() => handleSelectRoom(room)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-aviation-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {room.title.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-gray-900 truncate">{room.title}</h5>
                              <Badge variant="secondary" className="text-xs">
                                {room.participants.length} participantes
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 truncate mt-1">
                              {room.messages[0]?.message || 'Nenhuma mensagem ainda'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {room.messages[0]?.user?.name || 'Sistema'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 flex flex-col">
                {selectedRoom ? (
                  <>
                    {/* Header do Chat */}
                    <div className="p-4 border-b bg-white">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-aviation-blue text-white rounded-full flex items-center justify-center text-sm font-medium">
                            {selectedRoom.title.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h4 className="font-medium">{selectedRoom.title}</h4>
                            <p className="text-sm text-gray-600">
                              {selectedRoom.participants.length} participantes
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Implementar lógica para adicionar participantes
                              toast.info('Funcionalidade em desenvolvimento');
                            }}
                          >
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Mensagens */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.user.id === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.user.id === user?.id
                                ? 'bg-aviation-blue text-white'
                                : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <p className={`text-xs mt-1 ${
                              message.user.id === user?.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {format(new Date(message.createdAt), 'HH:mm')} - {message.user.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Input de Mensagem */}
                    <div className="p-4 border-t bg-white">
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                          placeholder="Digite sua mensagem..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aviation-blue"
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim()}
                          className="bg-aviation-blue hover:bg-aviation-blue/90"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Selecione uma sala para iniciar o chat</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedMissionConfirmation;