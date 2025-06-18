
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageCircle, Send, Users, Plane, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import type { ProfileWithRole, ChatMessage, ChatRoom } from '@/types/supabase-extended';

interface FlightSharingChatProps {
  bookingId?: string;
  preReservationId?: string;
}

const FlightSharingChat: React.FC<FlightSharingChatProps> = ({
  bookingId,
  preReservationId
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<(ChatMessage & { user: ProfileWithRole })[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (bookingId || preReservationId) {
      initializeChat();
    }
  }, [bookingId, preReservationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initializeChat = async () => {
    if (!profile) return;

    setIsLoading(true);
    try {
      // Verificar se já existe um chat room
      let { data: existingRoom, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(
          bookingId ? `booking_id.eq.${bookingId}` : `pre_reservation_id.eq.${preReservationId}`
        )
        .single();

      if (roomError && roomError.code !== 'PGRST116') {
        throw roomError;
      }

      if (!existingRoom) {
        // Criar novo chat room
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .insert({
            booking_id: bookingId || null,
            pre_reservation_id: preReservationId || null,
            title: `Compartilhamento de Voo ${bookingId ? `#${bookingId.slice(-8)}` : `#${preReservationId?.slice(-8)}`}`,
            type: 'flight_sharing',
            created_by: profile.id
          })
          .select()
          .single();

        if (createError) throw createError;
        existingRoom = newRoom;

        // Adicionar criador como participante
        await supabase
          .from('chat_participants')
          .insert({
            room_id: existingRoom.id,
            user_id: profile.id
          });
      }

      setChatRoom(existingRoom);
      await loadMessages(existingRoom.id);
      await checkParticipation(existingRoom.id);

    } catch (error) {
      console.error('Error initializing chat:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar chat.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkParticipation = async (roomId: string) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('chat_participants')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', profile.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Usuário não é participante, adicionar
        await supabase
          .from('chat_participants')
          .insert({
            room_id: roomId,
            user_id: profile.id
          });
      }
    } catch (error) {
      console.error('Error checking participation:', error);
    }
  };

  const loadMessages = async (roomId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          user:user_id (
            id,
            name,
            email,
            role
          )
        `)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        setMessages(data as any);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !chatRoom || !profile || isSending) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: chatRoom.id,
          user_id: profile.id,
          message: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      setNewMessage('');
      await loadMessages(chatRoom.id);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar mensagem.",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendSeatOffer = async (seatNumber: number, price: number) => {
    if (!chatRoom || !profile) return;

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: chatRoom.id,
          user_id: profile.id,
          message: `Ofereço assento ${seatNumber} por R$ ${price.toLocaleString('pt-BR')}`,
          message_type: 'seat_offer',
          metadata: {
            seat_number: seatNumber,
            price: price,
            booking_id: bookingId
          }
        });

      if (error) throw error;
      await loadMessages(chatRoom.id);

      toast({
        title: "Oferta Enviada",
        description: `Sua oferta do assento ${seatNumber} foi enviada.`,
      });

    } catch (error) {
      console.error('Error sending seat offer:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar oferta de assento.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!profile) return null;

  if (isLoading) {
    return (
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle>Carregando Chat...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Chat de Compartilhamento</span>
        </CardTitle>
        <CardDescription>
          Negocie compartilhamento de assentos e detalhes do voo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Mensagens */}
        <div className="h-64 overflow-y-auto border rounded-lg p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((message) => {
                const isOwnMessage = message.user_id === profile.id;
                return (
                  <div key={message.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-start space-x-2 max-w-xs ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {message.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`rounded-lg p-2 ${isOwnMessage ? 'bg-aviation-blue text-white' : 'bg-white border'}`}>
                        <div className="text-xs opacity-75 mb-1">
                          {message.user.name} • {new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm">
                          {message.message}
                        </div>
                        {message.message_type === 'seat_offer' && message.metadata && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Oferta de Assento
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input de Nova Mensagem */}
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="flex-1"
          />
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            className="bg-aviation-blue hover:bg-aviation-blue/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Ações Rápidas */}
        <div className="border-t pt-4">
          <div className="text-sm font-medium text-gray-700 mb-2">Ações Rápidas:</div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewMessage("Olá! Gostaria de saber se há interesse em compartilhar este voo.");
              }}
            >
              <Users className="h-3 w-3 mr-1" />
              Interesse em Compartilhar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewMessage("Tenho assentos disponíveis para compartilhamento. Vamos conversar?");
              }}
            >
              <Plane className="h-3 w-3 mr-1" />
              Oferecer Assentos
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightSharingChat;
