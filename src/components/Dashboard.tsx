import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buildApiUrl } from '@/config/api';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Plane, CreditCard, Users, TrendingUp, Clock, CheckCircle, AlertTriangle, LogOut, Users2, MessageCircle, Send, Filter, SortAsc, SortDesc, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { getBookings, getUsers, getTransactions, getMyTransactions, getMyParticipationRequests, sendParticipationRequestMessage, markMessagesAsRead } from '@/utils/api';
import { formatUTCToBrazilian, formatUTCToBrazilianDateTime, getDaysDifference, convertUTCToBrazilianTime, convertUTCToBrazilianTimeDeparture, convertUTCToBrazilianTimeReturn } from '@/utils/dateUtils';
import { getAirportNameByICAO } from '@/utils/airport-search';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';



interface Booking {
  id: number;
  userId: number;
  aircraftId: number;
  value: number;
  status: string;
  origin?: string;
  destination?: string;
  departure_date?: string;
  return_date?: string;
  actual_departure_date?: string;
  actual_return_date?: string;
  total_cost?: number;
  createdAt?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  balance?: number;
  monthly_fee_status?: string;
  membership_tier?: string;
}

interface Transaction {
  id: number;
  userId: number;
  bookingId?: number;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

interface ParticipationRequest {
  id: number;
  sharedMissionId: number;
  userId: number;
  status: string;
  message?: string;
  createdAt: string;
  chatMessages?: ChatMessage[];
  sharedMission: {
    id: number;
    title: string;
    origin: string;
    destination: string;
    departure_date: string;
    return_date: string;
    pricePerSeat: number;
    totalCost: number;
    creator: {
      id: number;
      name: string;
    };
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface ChatMessage {
  id: number;
  requestId: number;
  senderId: number;
  message: string;
  messageType?: 'text' | 'acceptance' | 'rejection';
  createdAt: string;
  sender?: {
    id: number;
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [acceptedSharedMissions, setAcceptedSharedMissions] = useState<ParticipationRequest[]>([]);

  const [membership, setMembership] = useState<any>(null);
  const [memberships, setMemberships] = useState<any[]>([]);
  const [paying, setPaying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiaCola, setCopiaCola] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'missions'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'pending' | 'confirmed' | 'paid'>('all');
  const [bookingSort, setBookingSort] = useState<'recent' | 'oldest'>('recent');
  const [dateFilter, setDateFilter] = useState<string>('');
  
  // Chat states
  const [showChat, setShowChat] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ParticipationRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // Modal de detalhes da reserva
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);
  
  // Ref para scroll automático das mensagens
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchRecentActivity();
      fetchMembership();
      fetchAcceptedSharedMissions();
    }
  }, [user]);



  // Forçar atualização da mensalidade
  useEffect(() => {
    if (user) {
      // // console.log('🔄 Forçando atualização da mensalidade...');
      fetchMembership();
    }
  }, []);

  // Carregar todas as reservas quando a aba de reservas for ativada
  useEffect(() => {
    if (activeTab === 'bookings' && user) {
      fetchAllBookings();
    }
  }, [activeTab, user]);

  // Scroll automático quando novas mensagens forem adicionadas
  useEffect(() => {
    if (showChat && chatMessages.length > 0) {
      scrollToBottom();
    }
  }, [chatMessages, showChat]);

  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const fetchAcceptedSharedMissions = async () => {
    if (!user) return;
    try {
      const requests = await getMyParticipationRequests();
      // Filter only accepted requests where the user is the participant
      const acceptedRequests = requests.filter((request: ParticipationRequest) => 
        request.status === 'accepted' && request.userId === user.id
      );
      setAcceptedSharedMissions(acceptedRequests);
    } catch (error) {
      console.error('Erro ao buscar missões compartilhadas aceitas:', error);
    }
  };

  // Funções do Chat
  const openChat = async (request: ParticipationRequest) => {
    if (!request || !request.user || !request.sharedMission) {
      console.error('Invalid request object:', request);
      toast.error("Dados da solicitação incompletos");
      return;
    }
    
    setSelectedRequest(request);
    setChatMessages(request.chatMessages || []);
    setShowChat(true);
    
    // Marcar mensagens como lidas quando abrir o chat
    try {
      await markMessagesAsRead(request.id);
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }

    // Scroll para a última mensagem após o chat abrir
    setTimeout(scrollToBottom, 200);
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedRequest(null);
    setChatMessages([]);
    setNewMessage('');
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      const response = await sendParticipationRequestMessage(selectedRequest.id, {
        message: newMessage.trim(),
        messageType: 'message'
      });
      
      // Adicionar a nova mensagem ao chat
      setChatMessages(prev => [...prev, response]);
      setNewMessage('');
      
      toast.success('Mensagem enviada!');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Função para scroll automático para a última mensagem
  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  const fetchRecentActivity = async () => {
    if (!user) return;
    try {
      const bookings = await getBookings();
      const userBookings = bookings.filter(b => b.userId === user.id);
      
      // Ordenar por data de partida (mais próximo primeiro)
      const sortedBookings = userBookings.sort((a, b) => {
        const dateA = new Date(a.departure_date || '').getTime();
        const dateB = new Date(b.departure_date || '').getTime();
        return dateA - dateB;
      });
      
      // Pegar apenas reservas confirmadas
      const confirmedBookings = sortedBookings.filter(booking => {
        const isConfirmed = booking.status === 'confirmado' || booking.status === 'confirmada' || booking.status === 'paga';
        

        
        return isConfirmed;
      });
      

      

      
      setRecentBookings(confirmedBookings); // Todas as reservas confirmadas para a seção
      
      setAllBookings(sortedBookings); // Todas as reservas para a aba de reservas
      
      const transactions = await getMyTransactions();
      setRecentTransactions(transactions.filter(t => t.userId === user.id).slice(0, 5));
    } catch (error) {
      toast.error("Erro ao carregar atividades recentes.");
    }
  };

  const fetchAllBookings = async () => {
    if (!user) return;
    setLoadingBookings(true);
    try {
      const bookings = await getBookings();
      const userBookings = bookings.filter(b => b.userId === user.id);
      
      // Ordenar por data de criação (mais recente primeiro)
      const sortedBookings = userBookings.sort((a, b) => {
        const dateA = new Date(a.createdAt || '').getTime();
        const dateB = new Date(b.createdAt || '').getTime();
        return dateB - dateA;
      });
      
      setAllBookings(sortedBookings);
    } catch (error) {
      toast.error("Erro ao carregar reservas.");
    } finally {
      setLoadingBookings(false);
    }
  };

  // Função para obter reservas filtradas e ordenadas
  const getFilteredBookings = () => {
    let filtered = [...allBookings];

    // Filtrar por status
    switch (bookingFilter) {
      case 'pending':
        filtered = filtered.filter(booking => booking.status === 'pendente');
        break;
      case 'confirmed':
        filtered = filtered.filter(booking => booking.status === 'confirmado');
        break;
      case 'paid':
        filtered = filtered.filter(booking => booking.status === 'paga');
        break;
      default:
        break;
    }

    // Filtrar por data
    if (dateFilter) {
      const filterDate = new Date(dateFilter);
      filterDate.setHours(0, 0, 0, 0);
      
      filtered = filtered.filter(booking => {
        if (!booking.departure_date) return false;
        const bookingDate = new Date(booking.departure_date);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === filterDate.getTime();
      });
    }

    // Ordenar
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || '').getTime();
      const dateB = new Date(b.createdAt || '').getTime();
      return bookingSort === 'recent' ? dateB - dateA : dateA - dateB;
    });

    return filtered;
  };


  const fetchMembership = async () => {
    try {
      const res = await fetch(buildApiUrl(`/api/users/status/${user.id}`));
      const data = await res.json();
      
      // Usar a mensalidade atual (do mês atual)
      const membership = data.currentMembership;
      
      // Só atualizar se os dados realmente mudaram
      setMembership(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(membership)) {
          return membership;
        }
        return prev;
      });
      
      setMemberships(prev => {
        if (JSON.stringify(prev) !== JSON.stringify(data.memberships || [])) {
          return data.memberships || [];
        }
        return prev;
      });
    } catch (error) {
      console.error('❌ Erro ao buscar mensalidade:', error);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      // Verificar se já existe uma cobrança PIX válida (menos de 24h)
      if (membership?.paymentId) {
        const res = await fetch(buildApiUrl(`/api/payments/continue/${membership.paymentId}`), { 
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
      const data = await res.json();
        
        if (data.status === 'confirmada') {
          toast.success('✅ Pagamento já foi confirmado!');
          // Atualizar imediatamente
          await fetchMembership();
          // Forçar re-render e verificar novamente em 2 segundos
          setTimeout(() => fetchMembership(), 2000);
          return;
        }
        
        // Se a cobrança ainda é válida, usar ela
        if (data.pixQrCodeImage) {
      setQrCode(data.pixQrCodeImage);
      setCopiaCola(data.pixCopiaCola);
      setPaymentId(data.paymentId);
      setStatus(data.status);
          setShowQrModal(true); // Abrir modal do QR code
          return;
        }
      }
      
      // Se não há cobrança válida, criar nova
      const res = await fetch(buildApiUrl(`/api/payments/membership/${user.id}`), { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      setQrCode(data.pixQrCodeImage);
      setCopiaCola(data.pixCopiaCola);
      setPaymentId(data.paymentId);
      setStatus(data.status);
      setShowQrModal(true); // Abrir modal do QR code
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setPaying(false);
    }
  };

  const handleVerifyPayment = async () => {
    try {
      const res = await fetch(buildApiUrl(`/api/payments/membership/${user.id}/verify-payment`), { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (data.success) {
        toast.success(data.message);
        // Atualizar mensalidade após verificação
        setTimeout(() => {
          fetchMembership();
        }, 500);
      } else {
        toast.error(data.error || 'Erro ao verificar pagamento');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar pagamento');
    }
  };

  const handlePayForMembership = async (targetMembership: any) => {
    setPaying(true);
    try {
      // Usar o mesmo endpoint que funciona para pagamento
      const res = await fetch(buildApiUrl(`/api/payments/membership/${user.id}`), { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await res.json();
      
      if (data.pixQrCodeImage) {
        setQrCode(data.pixQrCodeImage);
        setCopiaCola(data.pixCopiaCola);
        setPaymentId(data.paymentId);
        setStatus(data.status);
        toast.success('QR Code PIX gerado com sucesso!');
        setShowQrModal(true); // Abrir modal imediatamente
      } else {
        toast.error('Erro ao gerar QR Code PIX');
      }
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento');
    } finally {
      setPaying(false);
    }
  };

  // Polling para status do pagamento
  React.useEffect(() => {
    if (!paymentId) return;
    
    const checkPaymentStatus = async () => {
      try {
              const res = await fetch(buildApiUrl(`/api/payments/membership/status/${paymentId}`));
        const data = await res.json();
        setStatus(data.status);
        
        if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
          clearInterval(interval);
          setShowSuccessModal(true);
          setShowQrModal(false); // Fechar modal do QR Code
          toast.success('✅ Pagamento confirmado! Sua mensalidade foi paga com sucesso.');
          fetchMembership();
          setQrCode(null);
          setCopiaCola(null);
          setPaymentId(null);
          
          // Esconder modal após 3 segundos
          setTimeout(() => {
            setShowSuccessModal(false);
          }, 3000);
        }
      } catch (error) {
        console.error('Erro ao verificar status do pagamento:', error);
      }
    };

    const interval = setInterval(checkPaymentStatus, 5000);
    
    // Verificar imediatamente
    checkPaymentStatus();
    
    return () => clearInterval(interval);
  }, [paymentId]);

  // Verificar status da mensalidade periodicamente (atualização em tempo real)
  React.useEffect(() => {
    if (!user) return;
    
    const checkMembershipStatus = async () => {
      try {
        await fetchMembership();
      } catch (error) {
        console.error('Erro ao verificar status da mensalidade:', error);
      }
    };

    // Verificar imediatamente ao carregar
    checkMembershipStatus();
    
    // Verificar a cada 30 segundos (menos frequente para evitar bugs)
    const interval = setInterval(checkMembershipStatus, 30000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  


  const balance = (user as any)?.balance || 0;
  const balanceStatus = balance >= 10000 ? 'high' : balance >= 5000 ? 'medium' : 'low';

  // Função para calcular dias até o vencimento
  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Função para obter status de urgência
  const getUrgencyStatus = (dueDate: string, status: string) => {
    if (status === 'paga') return 'paid';
    const daysUntilDue = getDaysUntilDue(dueDate);
    if (daysUntilDue < 0) return 'overdue';
    if (daysUntilDue <= 3) return 'urgent';
    if (daysUntilDue <= 7) return 'warning';
    return 'normal';
  };

  return (
    <div className="w-full">


      <div className="px-2 pb-4 space-y-4">

        
        {/* Status Cards com design moderno */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Status Mensalidade */}
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm md:text-lg font-semibold text-gray-800">Status Mensalidade</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchMembership}
                className="text-xs text-blue-600 hover:text-blue-700"
              >
                🔄
              </Button>
              {membership?.status === 'paga' || membership?.status === 'confirmada' ? (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
              ) : membership?.status === 'atrasada' ? (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
              ) : membership?.status === 'pendente' ? (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
              )}
            </div>
            
            {/* Seção de Mensalidades com UX Inteligente */}
            <div className="space-y-4">
              {(() => {
                const now = new Date();
                const dueDate = membership?.dueDate ? new Date(membership.dueDate) : null;
                const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                
                // Buscar próxima mensalidade (se existir)
                const nextMembership = memberships?.find(m => 
                  m.status === 'pendente' && 
                  new Date(m.dueDate) > new Date(membership?.dueDate || 0)
                );
                
                // Lógica UX Inteligente
                if (membership?.status === 'paga' || membership?.status === 'confirmada') {
                  return (
                    <>
                      {/* Mensalidade Atual (PAGA) */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-green-800">✅ Mensalidade Atual</h3>
                          <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-semibold px-2 py-1">
                            PAGA
              </Badge>
                        </div>
                        <div className="text-sm text-green-700 space-y-1">
                          <p><strong>Valor:</strong> {(membership.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <p><strong>Vencimento:</strong> {new Date(membership.dueDate).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Status:</strong> Pagamento confirmado</p>
                        </div>
                        <div className="mt-3 text-xs text-green-600 bg-green-100 p-2 rounded">
                          <p>🎉 Sua mensalidade está em dia!</p>
                          <p>Você pode fazer reservas normalmente.</p>
                        </div>
            </div>

                      {/* Próxima Mensalidade (se existir) */}
                      {nextMembership && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-orange-800">📅 Próxima Mensalidade</h3>
                            <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs font-semibold px-2 py-1">
                              PENDENTE
                            </Badge>
                </div>
                          <div className="text-sm text-orange-700 space-y-1">
                            <p><strong>Valor:</strong> {(nextMembership.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                            <p><strong>Vencimento:</strong> {new Date(nextMembership.dueDate).toLocaleDateString('pt-BR')}</p>
                            <p><strong>Dias restantes:</strong> {Math.ceil((new Date(nextMembership.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} dias</p>
                          </div>
                          <div className="mt-3 text-xs text-orange-600 bg-orange-100 p-2 rounded">
                            <p>📋 Próxima mensalidade disponível</p>
                            <p>Sem pressão - vence em {Math.ceil((new Date(nextMembership.dueDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} dias</p>
                          </div>
                          <div className="mt-3">
                            <Button 
                              onClick={() => handlePayForMembership(nextMembership)}
                              disabled={paying}
                              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                            >
                              {paying ? 'Gerando Pix...' : '💳 Pagar Próxima Mensalidade'}
                            </Button>
                          </div>
                </div>
              )}
                    </>
                  );
                } else if (membership?.status === 'atrasada') {
                  return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-red-800">❌ Mensalidade Vencida</h3>
                        <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-semibold px-2 py-1">
                          ATRASADA
                        </Badge>
                      </div>
                      <div className="text-sm text-red-700 space-y-1">
                        <p><strong>Valor:</strong> {(membership.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p><strong>Vencimento:</strong> {new Date(membership.dueDate).toLocaleDateString('pt-BR')}</p>
                        <p><strong>Dias em atraso:</strong> {Math.abs(daysUntilDue)} dias</p>
                      </div>
                      <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded">
                        <p>🚨 Sua mensalidade está vencida!</p>
                        <p>Pague imediatamente para continuar usando o sistema.</p>
                      </div>
                    </div>
                  );
                } else if (membership?.status === 'pendente') {
                  if (daysUntilDue > 7) {
                    return (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-blue-800">📅 Próxima Mensalidade</h3>
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold px-2 py-1">
                            PENDENTE
                          </Badge>
                        </div>
                        <div className="text-sm text-blue-700 space-y-1">
                          <p><strong>Valor:</strong> {(membership.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <p><strong>Vencimento:</strong> {new Date(membership.dueDate).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Dias restantes:</strong> {daysUntilDue} dias</p>
                        </div>
                        <div className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                          <p>📋 Mensalidade disponível</p>
                          <p>Sem pressão - vence em {daysUntilDue} dias</p>
                        </div>
                      </div>
                    );
                  } else if (daysUntilDue > 0) {
                    return (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-orange-800">⏰ Mensalidade Vence Em Breve</h3>
                          <Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs font-semibold px-2 py-1">
                            PENDENTE
                          </Badge>
                        </div>
                        <div className="text-sm text-orange-700 space-y-1">
                          <p><strong>Valor:</strong> {(membership.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <p><strong>Vencimento:</strong> {new Date(membership.dueDate).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Dias restantes:</strong> {daysUntilDue} dias</p>
                        </div>
                        <div className="mt-3 text-xs text-orange-600 bg-orange-100 p-2 rounded">
                          <p>⚠️ Sua mensalidade vence em {daysUntilDue} dias</p>
                          <p>Recomendamos pagar em breve para evitar interrupção</p>
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-red-800">🚨 Mensalidade Pendente</h3>
                          <Badge className="bg-red-100 text-red-800 border-red-200 text-xs font-semibold px-2 py-1">
                            PENDENTE
                          </Badge>
                        </div>
                        <div className="text-sm text-red-700 space-y-1">
                          <p><strong>Valor:</strong> {(membership.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <p><strong>Vencimento:</strong> {new Date(membership.dueDate).toLocaleDateString('pt-BR')}</p>
                          <p><strong>Status:</strong> Aguardando pagamento</p>
                        </div>
                        <div className="mt-3 text-xs text-red-600 bg-red-100 p-2 rounded">
                          <p>🚨 Sua mensalidade está pendente!</p>
                          <p>Pague agora para continuar usando o sistema.</p>
                        </div>
                      </div>
                    );
                  }
                } else {
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">❓ Status da Mensalidade</h3>
                        <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-xs font-semibold px-2 py-1">
                          SEM MENSALIDADE
                        </Badge>
                </div>
                      <div className="text-sm text-gray-600">
                        <p>Nenhuma mensalidade encontrada.</p>
                </div>
                    </div>
                  );
                }
              })()}
            </div>



            {/* Botões de Ação */}
            {membership?.status === 'pendente' && (
              <div className="space-y-2">
                {/* Informação sobre cobrança */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700 font-medium">
                    ℹ️ Clique em "Gerar Cobrança Pix" para criar um QR Code válido por 24h. A cobrança só é gerada quando você solicita.
                  </p>
                </div>
                {/* Alerta para mensalidades que vencem em breve */}
                {membership?.dueDate && getUrgencyStatus(membership.dueDate, membership.status) === 'urgent' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs text-orange-700 font-medium">
                      🚨 Sua mensalidade vence em {getDaysUntilDue(membership.dueDate)} dias! Pague agora para evitar interrupção do serviço.
                    </p>
                  </div>
                )}
                
                {membership?.dueDate && getUrgencyStatus(membership.dueDate, membership.status) === 'warning' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-700 font-medium">
                      ⚠️ Sua mensalidade vence em {getDaysUntilDue(membership.dueDate)} dias. Recomendamos pagar em breve.
                    </p>
                  </div>
                )}

                                  <div className="space-y-2">
                <Button 
                  onClick={handlePay} 
                  disabled={paying} 
                  className={`w-full font-semibold py-2 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs md:text-sm ${
                    membership?.dueDate && getUrgencyStatus(membership.dueDate, membership.status) === 'urgent'
                      ? 'bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white'
                      : membership?.dueDate && getUrgencyStatus(membership.dueDate, membership.status) === 'warning'
                      ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
                  }`}
                >
                  {paying ? 'Gerando Pix...' : '💳 Pagar via Pix'}
                </Button>
                
                      <Button
                      onClick={handleVerifyPayment} 
                        variant="outline"
                      className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 font-semibold py-2 rounded-xl text-xs"
                    >
                      🔄 Verificar Pagamento
                      </Button>
                    </div>
              </div>
            )}

            {membership?.status === 'atrasada' && (
              <div className="space-y-2">
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-700 font-medium">
                    ⚠️ Sua mensalidade está atrasada. Pague para continuar usando o sistema.
                  </p>
                </div>
                <div className="space-y-2">
                <Button 
                  onClick={handlePay} 
                  disabled={paying} 
                  className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 md:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-xs md:text-sm"
                >
                  {paying ? 'Gerando Pix...' : '🚨 Pagar Mensalidade Atrasada'}
                </Button>
                  
                  <Button 
                    onClick={handleVerifyPayment} 
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50 font-semibold py-2 rounded-xl text-xs"
                  >
                    🔄 Verificar Pagamento
                  </Button>
                </div>
              </div>
            )}


            


            {!membership && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-700 font-medium">
                  ℹ️ Nenhuma mensalidade encontrada. Entre em contato com o suporte.
                </p>
              </div>
            )}
          </div>
        </div>



        {/* Próximos Voos com design moderno */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 md:mr-4">
                  <Plane className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Próximos Voos</h2>
                  <p className="text-gray-600 text-xs md:text-sm">Suas reservas com status confirmado</p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setActiveTab('bookings')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg text-xs md:text-sm"
              >
                Ver Todos
              </Button>
            </div>
          
          <div className="space-y-4">
            {/* Regular Bookings */}
            {recentBookings && recentBookings.length > 0 && (
              <div className="space-y-4">
                {recentBookings.map((booking) => {
                  const departureDate = booking.departure_date;
                  let flightDate: Date;
                  let daysUntilFlight: number;
                  
                  try {
                    if (!departureDate || departureDate === 'undefined' || departureDate === 'null') {
                      flightDate = new Date();
                      daysUntilFlight = 0;
                    } else {
                      // Converter UTC para horário brasileiro
                      flightDate = new Date(departureDate);
                      if (isNaN(flightDate.getTime())) {
                        flightDate = new Date();
                        daysUntilFlight = 0;
                      } else {
                        // CORRIGIDO: As datas já estão em horário brasileiro correto
                        const now = new Date();
                        daysUntilFlight = Math.ceil((flightDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      }
                    }
                  } catch (error) {
                    flightDate = new Date();
                    daysUntilFlight = 0;
                  }
                  
                  return (
                    <div key={`booking-${booking.id}`} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center space-x-4">
                        <div className="text-center flex-shrink-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex flex-col items-center justify-center text-white">
                            <div className="text-sm md:text-lg font-bold">
                              {flightDate.toLocaleDateString('pt-BR', { day: '2-digit' })}
                            </div>
                            <div className="text-xs">
                              {flightDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-sm md:text-lg truncate">
                              {getAirportNameByICAO(booking.origin)} → {getAirportNameByICAO(booking.destination)}
                            </h3>
                            <Badge 
                              variant="default"
                              className={`text-xs px-2 md:px-3 py-1 rounded-full ${
                                booking.status === 'paga' ? 'bg-green-100 text-green-800' :
                                booking.status === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {booking.status === 'paga' ? 'Confirmada' :
                               booking.status === 'confirmado' ? 'Confirmada' :
                               booking.status === 'pendente' ? 'Pendente' :
                               booking.status}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
                              <Clock className="h-3 w-3 md:h-4 md:w-4" />
                              <span>
                                {daysUntilFlight === 0 ? 'Hoje' :
                                 daysUntilFlight === 1 ? 'Amanhã' :
                                 daysUntilFlight > 0 ? `Em ${daysUntilFlight} dias` :
                                 'Data não definida'}
                              </span>
                            </div>
                            <div className="text-sm md:text-lg font-bold text-green-600">
                              {(booking.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 bg-white border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-xs md:text-sm"
                          onClick={() => navigate(`/dashboard?tab=bookings&bookingId=${booking.id}`)}
                        >
                          Detalhes
                        </Button>
                        {booking.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg text-xs md:text-sm"
                          >
                            Pagar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Shared Missions */}
            {acceptedSharedMissions && acceptedSharedMissions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Users2 className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-sm md:text-lg text-gray-800">Missões Compartilhadas Aceitas</h3>
                </div>
                {acceptedSharedMissions.map((request) => {
                  const departureDate = request.sharedMission?.departure_date;
                  let flightDate: Date;
                  let daysUntilFlight: number;
                  
                  try {
                    if (!departureDate || departureDate === 'undefined' || departureDate === 'null') {
                      flightDate = new Date();
                      daysUntilFlight = 0;
                    } else {
                      flightDate = new Date(departureDate);
                      if (isNaN(flightDate.getTime())) {
                        flightDate = new Date();
                        daysUntilFlight = 0;
                      } else {
                        const now = new Date();
                        daysUntilFlight = Math.ceil((flightDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      }
                    }
                  } catch (error) {
                    flightDate = new Date();
                    daysUntilFlight = 0;
                  }
                  
                  return (
                    <div key={`shared-${request.id}`} className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                      <div className="flex items-center space-x-4">
                        <div className="text-center flex-shrink-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex flex-col items-center justify-center text-white">
                            <div className="text-sm md:text-lg font-bold">
                              {flightDate.toLocaleDateString('pt-BR', { day: '2-digit' })}
                            </div>
                            <div className="text-xs">
                              {flightDate.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-bold text-gray-900 text-sm md:text-lg truncate">
                              {getAirportNameByICAO(request.sharedMission.origin)} → {getAirportNameByICAO(request.sharedMission.destination)}
                            </h3>
                            <Badge 
                              variant="default"
                              className="bg-purple-100 text-purple-800 text-xs px-2 md:px-3 py-1 rounded-full"
                            >
                              Compartilhada
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-600">
                              <Clock className="h-3 w-3 md:h-4 md:w-4" />
                              <span>
                                {daysUntilFlight === 0 ? 'Hoje' :
                                 daysUntilFlight === 1 ? 'Amanhã' :
                                 daysUntilFlight > 0 ? `Em ${daysUntilFlight} dias` :
                                 'Data não definida'}
                              </span>
                            </div>
                            <div className="text-sm md:text-lg font-bold text-purple-600">
                              {(request.sharedMission.totalCost ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </div>
                            <div className="text-xs md:text-sm text-gray-500 truncate">
                              Organizador: {request.sharedMission.creator?.name || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 bg-white border-purple-300 text-purple-700 hover:bg-purple-50 rounded-xl text-xs md:text-sm"
                          onClick={() => navigate(`/dashboard?tab=missions&missionId=${request.sharedMissionId}`)}
                        >
                          Detalhes
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-lg text-xs md:text-sm"
                          onClick={() => openChat(request)}
                        >
                          <MessageCircle className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                          Chat
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No flights message */}
            {(!recentBookings || recentBookings.length === 0) && (!acceptedSharedMissions || acceptedSharedMissions.length === 0) && (
              <div className="text-center py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Nenhum voo programado</h3>
                <p className="text-gray-600 mb-6 text-xs md:text-sm">Comece agendando sua primeira viagem!</p>
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={() => setActiveTab('missions')}
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 shadow-lg rounded-xl px-6 md:px-8 py-2 md:py-3 text-sm md:text-base"
                >
                  Agendar Voo
                </Button>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Transações Recentes */}
        {activeTab === 'overview' && (
          <div className="bg-white rounded-2xl p-4 shadow-lg border border-blue-100">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-3 md:mr-4">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">Transações Recentes</h2>
              <p className="text-gray-600 text-xs md:text-sm">Histórico de movimentações</p>
            </div>
          </div>
          
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-300">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm md:text-base">{transaction.description}</p>
                    <p className="text-xs md:text-sm text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className={`text-right ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <p className="font-bold text-sm md:text-lg">
                      {transaction.type === 'credit' ? '+' : '-'}{(transaction.amount ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {transaction.type === 'credit' ? 'Crédito' : 'Débito'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-white" />
              </div>
              <p className="text-gray-500 text-xs md:text-sm">Nenhuma transação recente</p>
            </div>
          )}
        </div>
        )}

        {/* Seção de Reservas */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-2xl p-3 md:p-4 lg:p-6 shadow-lg border border-blue-100 min-h-0 w-full max-w-none">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 md:mr-4">
                  <CalendarDays className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Minhas Reservas</h2>
                  <p className="text-gray-600 text-xs md:text-sm">Gerencie suas reservas de voo</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setActiveTab('overview')}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs md:text-sm"
                >
                  Visão Geral
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={fetchAllBookings}
                  disabled={loadingBookings}
                  className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-xs md:text-sm"
                >
                  {loadingBookings ? 'Atualizando...' : 'Atualizar'}
                </Button>

                <Button 
                  size="sm" 
                  onClick={() => setActiveTab('missions')} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg rounded-xl text-xs md:text-sm"
                >
                  <Plane className="h-4 w-4 mr-2" />
                  Nova Reserva
                </Button>
              </div>
            </div>

            {/* Filtros modernos com Selects */}
            <div className="space-y-4 mb-6">
              {/* Filtros de Status e Ordenação */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Filtro de Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Status da Reserva
                  </label>
                  <Select value={bookingFilter} onValueChange={(value: 'all' | 'pending' | 'confirmed' | 'paid') => setBookingFilter(value)}>
                    <SelectTrigger className="w-full bg-white border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center justify-between w-full">
                          <span>Todas as reservas</span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {allBookings.length}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="pending">
                        <div className="flex items-center justify-between w-full">
                          <span>Pendentes</span>
                          <Badge variant="secondary" className="ml-2 text-xs bg-yellow-100 text-yellow-800">
                            {allBookings.filter(b => b.status === 'pendente').length}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="confirmed">
                        <div className="flex items-center justify-between w-full">
                          <span>Confirmadas</span>
                          <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-800">
                            {allBookings.filter(b => b.status === 'confirmado').length}
                          </Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="paid">
                        <div className="flex items-center justify-between w-full">
                          <span>Pagas</span>
                          <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800">
                            {allBookings.filter(b => b.status === 'paga').length}
                          </Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Ordenação */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    {bookingSort === 'recent' ? <SortDesc className="h-4 w-4" /> : <SortAsc className="h-4 w-4" />}
                    Ordenar por
                  </label>
                  <Select value={bookingSort} onValueChange={(value: 'recent' | 'oldest') => setBookingSort(value)}>
                    <SelectTrigger className="w-full bg-white border-blue-200 hover:border-blue-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl">
                      <SelectValue placeholder="Selecione a ordenação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais Recente</SelectItem>
                      <SelectItem value="oldest">Mais Antigas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtro de Data */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Data do Voo
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="flex-1 px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                      placeholder="Selecione uma data"
                    />
                    {dateFilter && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDateFilter('')}
                        className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl px-3"
                      >
                        ✕
                      </Button>
                    )}
                  </div>
                </div>

                {/* Filtro de Busca */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Buscar Reserva
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por origem, destino..."
                    className="w-full px-3 py-2 border border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                  />
                </div>
              </div>

              {/* Resumo dos filtros aplicados */}
              {(bookingFilter !== 'all' || dateFilter) && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-sm text-blue-800">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filtros aplicados:</span>
                    <div className="flex flex-wrap gap-2">
                      {bookingFilter !== 'all' && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {bookingFilter === 'pending' ? 'Pendentes' :
                           bookingFilter === 'confirmed' ? 'Confirmadas' :
                           bookingFilter === 'paid' ? 'Pagas' : bookingFilter}
                        </Badge>
                      )}
                      {dateFilter && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {new Date(dateFilter).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setBookingFilter('all');
                          setDateFilter('');
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 h-6 px-2 text-xs"
                      >
                        Limpar todos
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Lista de Reservas */}
            {loadingBookings ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                  <div className="w-6 w-6 md:w-8 md:h-8 border-4 border-white border-t-transparent rounded-full"></div>
                </div>
                <p className="text-gray-600 font-medium text-xs md:text-sm">Carregando reservas...</p>
              </div>
            ) : getFilteredBookings().length > 0 ? (
              <div className="max-h-[400px] md:max-h-[350px] lg:max-h-[450px] overflow-y-auto space-y-2 md:space-y-3 pr-2">
                {getFilteredBookings().map((booking) => (
                  <div key={booking.id} className="w-full bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-2 md:p-3 border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                                          {/* Header compacto */}
                      <div className="flex items-center justify-between mb-2 md:mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xs md:text-sm">
                          #{booking.id}
                        </div>
                        <Badge 
                          variant="default"
                          className={`text-xs px-2 md:px-3 py-1 rounded-full ${
                            booking.status === 'paga' ? 'bg-green-100 text-green-800' :
                            booking.status === 'confirmado' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {booking.status === 'paga' ? 'Paga' :
                           booking.status === 'confirmado' ? 'Confirmada' :
                           booking.status === 'pendente' ? 'Pendente' :
                           booking.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm md:text-lg text-green-600">
                              {(booking.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                    
                    {/* Informações principais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mb-2 md:mb-3">
                      <div className="bg-white p-1 md:p-2 rounded-xl border border-gray-200 w-full">
                        <p className="text-xs text-gray-600 font-medium mb-1">Origem</p>
                        <p className="font-semibold text-gray-800 text-xs md:text-sm truncate">{getAirportNameByICAO(booking.origin || '--')}</p>
                      </div>
                      <div className="bg-white p-1 md:p-2 rounded-xl border border-gray-200 w-full">
                        <p className="text-xs text-gray-600 font-medium mb-1">Destino</p>
                        <p className="font-semibold text-gray-800 text-xs md:text-sm truncate">{getAirportNameByICAO(booking.destination || '--')}</p>
                      </div>
                    </div>
                    
                    {/* Data e ações */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between pt-2 border-t border-gray-200 gap-2 md:gap-0">
                      <div className="text-xs md:text-sm text-gray-600">
                        <span className="font-medium">Data: </span>
                        {booking.departure_date ? (
                          <>
                            {convertUTCToBrazilianTime(booking.departure_date).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                            <span className="mx-1">•</span>
                            {convertUTCToBrazilianTime(booking.departure_date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </>
                        ) : '--'}
                      </div>
                      <div className="flex space-x-2">
                        {booking.status === 'pendente' && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-green-300 text-green-700 hover:bg-green-50 rounded-xl px-3 md:px-4 text-xs md:text-sm"
                          >
                            Pagar
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl px-3 md:px-4 text-xs md:text-sm"
                          onClick={() => {
                            setSelectedBookingDetails(booking);
                            setShowBookingDetails(true);
                          }}
                        >
                          Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plane className="h-8 w-8 md:h-10 md:w-10 text-white" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
                  {bookingFilter === 'all' && !dateFilter ? 'Nenhuma reserva encontrada' : 'Nenhuma reserva com os filtros aplicados'}
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto text-xs md:text-sm">
                  {bookingFilter === 'all' && !dateFilter
                    ? 'Você ainda não possui reservas de voo. Comece fazendo sua primeira reserva!'
                    : `Não há reservas que correspondam aos filtros selecionados.`
                  }
                </p>
                {bookingFilter === 'all' && !dateFilter ? (
                  <Button 
                    onClick={() => setActiveTab('missions')} 
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg rounded-xl px-6 md:px-8 py-2 md:py-3 text-sm md:text-base"
                    size="lg"
                  >
                    <Plane className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                    Fazer Primeira Reserva
                  </Button>
                ) : (
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Button 
                      onClick={() => setBookingFilter('all')} 
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-50 rounded-xl text-xs md:text-sm"
                    >
                      Limpar Filtros
                    </Button>
                    <Button 
                      onClick={() => setDateFilter('')} 
                      variant="outline"
                      size="sm"
                      className="border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs md:text-sm"
                    >
                      Limpar Data
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Seção de Missões */}
        {activeTab === 'missions' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-blue-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 md:mr-4">
                  <Plane className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-800">Sistema de Missões</h2>
                  <p className="text-gray-600 text-xs md:text-sm">Crie voos individuais ou compartilhados</p>
                </div>
              </div>
              <Button 
                size="sm" 
                onClick={() => navigate('/dashboard?tab=missions')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg rounded-xl text-xs md:text-sm"
              >
                Acessar Missões
              </Button>
            </div>
            
            <div className="text-center py-12">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plane className="h-10 w-10 md:h-12 md:w-12 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">Sistema completo de missões disponível</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-xs md:text-sm">Crie voos individuais ou compartilhados com outros membros do clube</p>
              <Button 
                onClick={() => navigate('/dashboard?tab=missions')} 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg rounded-xl px-6 md:px-8 py-2 md:py-3 text-sm md:text-lg"
                size="lg"
              >
                Ir para Missões
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat Modal moderno */}
      {showChat && selectedRequest && selectedRequest.user && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border border-blue-100">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 md:h-5 md:w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm md:text-base">Chat - {selectedRequest.sharedMission?.title || 'Missão'}</h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    {selectedRequest.user?.id === user?.id ? 'Você é o participante' : `Participante: ${selectedRequest.user?.name || 'Usuário'}`}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeChat}
                className="w-6 h-6 md:w-8 md:h-8 rounded-full hover:bg-gray-100 text-xs md:text-sm"
              >
                ✕
              </Button>
            </div>

            {/* Chat Messages */}
            <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-60">
              {chatMessages.length > 0 ? (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-3 rounded-2xl text-xs md:text-sm ${
                        msg.senderId === user?.id
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                          : msg.messageType === 'acceptance'
                          ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800'
                          : msg.messageType === 'rejection'
                          ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                          : 'bg-gradient-to-r from-gray-100 to-blue-50 text-gray-800'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1">{msg.sender?.name || 'Usuário'}</div>
                      <div>{msg.message}</div>
                      <div className="text-xs opacity-70 mt-2">
                        {convertUTCToBrazilianTime(msg.createdAt).toLocaleTimeString('pt-BR', { 
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-gray-300 to-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="h-6 w-6 md:h-8 md:w-8 text-white" />
                  </div>
                  <p className="text-xs md:text-sm">Nenhuma mensagem ainda. Seja o primeiro a enviar uma mensagem!</p>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50 rounded-b-3xl">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 px-3 md:px-4 py-2 md:py-3 border border-gray-300 rounded-2xl text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  disabled={sendingMessage}
                />
                <Button
                  size="sm"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 md:px-4 py-2 md:py-3 rounded-2xl shadow-lg"
                >
                  {sendingMessage ? (
                    <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-4 w-4 md:h-5 md:w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Pagamento Confirmado!
            </h3>
            <p className="text-gray-600 mb-6">
              Sua mensalidade foi paga com sucesso. O sistema será atualizado automaticamente.
            </p>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Entendi
            </Button>
          </div>
        </div>
      )}
      
      {/* Modal do QR Code PIX */}
      {showQrModal && qrCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Pagamento PIX</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowQrModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100"
              >
                ✕
              </Button>
            </div>
            
            <div className="text-center mb-6">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">Escaneie o QR Code</h4>
              <img 
                src={qrCode} 
                alt="QR Code Pix" 
                className="mx-auto w-48 h-48 border-2 border-gray-300 rounded-lg shadow-lg" 
              />
            </div>
            
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-50"
                onClick={() => {
                  navigator.clipboard.writeText(copiaCola || '');
                  toast.success('Código Pix copiado!');
                }}
              >
                📋 Copiar código Pix
              </Button>
              
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border">
                <div className="font-medium text-gray-700 mb-2">Código PIX:</div>
                <div className="bg-white p-2 rounded border max-h-20 overflow-y-auto break-all font-mono text-xs">
                  {copiaCola}
                </div>
              </div>
              
              <div className="text-xs text-gray-500 text-center">
                <p>⏰ O QR Code expira em 24 horas</p>
                <p>💡 Use o app do seu banco para escanear</p>
                <p className="mt-2 p-2 bg-blue-50 rounded border border-blue-200 text-blue-700">
                  <strong>ℹ️ Após pagar:</strong> Pode aguardar até 1 hora para aparecer como pago. 
                  Caso passe de 24h, consulte o suporte.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Detalhes da Reserva */}
      <Dialog open={showBookingDetails} onOpenChange={setShowBookingDetails}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg font-bold text-gray-800">
                Reserva #{selectedBookingDetails?.id}
              </DialogTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowBookingDetails(false)}
                className="w-6 h-6 rounded-full hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </DialogHeader>
          
          {selectedBookingDetails && (
            <div className="space-y-3">
              {/* Status e Valor */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <Badge 
                  variant="default"
                  className={`text-xs px-2 py-1 rounded-full ${
                    selectedBookingDetails.status === 'paga' ? 'bg-green-100 text-green-800' :
                    selectedBookingDetails.status === 'confirmada' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {selectedBookingDetails.status === 'paga' ? 'Confirmada' :
                   selectedBookingDetails.status === 'confirmada' ? 'Confirmada' :
                   selectedBookingDetails.status === 'pendente' ? 'Pendente' :
                   selectedBookingDetails.status}
                </Badge>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    {(selectedBookingDetails.value ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              </div>

              {/* Rota */}
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">{getAirportNameByICAO(selectedBookingDetails.origin || '--')}</div>
                    <div className="text-xs text-gray-500">Origem</div>
                  </div>
                  <Plane className="h-3 w-3 text-blue-500 transform rotate-45" />
                  <div className="text-center">
                    <div className="text-sm font-bold text-blue-600">{getAirportNameByICAO(selectedBookingDetails.destination || '--')}</div>
                    <div className="text-xs text-gray-500">Destino</div>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-xs text-gray-600 mb-1">Partida</div>
                  {selectedBookingDetails.departure_date ? (
                    <>
                      <div className="text-sm font-bold text-green-600">
                        {selectedBookingDetails.actual_departure_date 
                          ? convertUTCToBrazilianTime(selectedBookingDetails.actual_departure_date).toLocaleDateString('pt-BR')
                          : convertUTCToBrazilianTime(selectedBookingDetails.departure_date).toLocaleDateString('pt-BR')
                        }
                      </div>
                      <div className="text-xs text-green-700">
                        {selectedBookingDetails.actual_departure_date 
                          ? convertUTCToBrazilianTime(selectedBookingDetails.actual_departure_date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : convertUTCToBrazilianTime(selectedBookingDetails.departure_date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                        }
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">--</div>
                  )}
                </div>

                <div className="p-2 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-xs text-gray-600 mb-1">Retorno</div>
                  {selectedBookingDetails.return_date ? (
                    <>
                      <div className="text-sm font-bold text-purple-600">
                        {selectedBookingDetails.actual_return_date 
                          ? convertUTCToBrazilianTime(selectedBookingDetails.actual_return_date).toLocaleDateString('pt-BR')
                          : convertUTCToBrazilianTime(selectedBookingDetails.return_date).toLocaleDateString('pt-BR')
                        }
                      </div>
                      <div className="text-xs text-purple-700">
                        {selectedBookingDetails.actual_return_date 
                          ? convertUTCToBrazilianTime(selectedBookingDetails.actual_return_date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : convertUTCToBrazilianTime(selectedBookingDetails.return_date).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                        }
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-gray-500">--</div>
                  )}
                </div>
              </div>

              {/* Botões */}
              <div className="flex space-x-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBookingDetails(false)}
                  className="flex-1 text-xs"
                >
                  Fechar
                </Button>
                {selectedBookingDetails.status === 'pendente' && (
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                  >
                    Pagar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
