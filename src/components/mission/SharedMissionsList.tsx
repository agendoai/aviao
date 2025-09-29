import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Plane, 
  MapPin, 
  Calendar,
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  Check, 
  ArrowLeft,
  ArrowRight,
  MessageCircle,
  Send,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Crown,
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications';
import { 
  getSharedMissions, 
  createSharedMission, 
  getAircrafts,
  createParticipationRequest,
  getParticipationRequestsForMission,
  getMyParticipationRequests,
  sendParticipationRequestMessage,
  acceptParticipationRequest,
  rejectParticipationRequest,
  getMyCreatedSharedMissions,
  getMessageCounts,
  markMessagesAsRead
} from '@/utils/api';
import { searchAirports, getPopularAirports, getAirportsByRegion, Airport, calculateDistance, getAircraftSpeed, getAirportCoordinatesWithFallback, getAirportNameByICAO, calculateTotalMissionCost } from '@/utils/airport-search';
import { getCalendar } from '@/utils/api';
import IntelligentTimeSelectionStep from '../booking-flow/IntelligentTimeSelectionStep';
import { buildApiUrl } from '@/config/api';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  seats: number;
  hourlyRate: number;
  overnightRate: number;
  status: string;
}

interface CalendarAircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  status: string;
}

interface SharedMission {
  id: number;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  actual_departure_date?: string;
  actual_return_date?: string;
  aircraftId: number;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  totalCost: number;
  overnightFee: number;
  overnightStays: number;
  flight_hours?: number;
  paymentId?: string;
  blocked_until?: string;
  maintenance_buffer_hours?: number;
  status: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  aircraft: Aircraft;
  creator: {
    id: number;
    name: string;
    email: string;
  };
}

interface ParticipationRequest {
  id: number;
  sharedMissionId: number;
  userId: number;
  status: 'pending' | 'accepted' | 'rejected';
  message?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
  sharedMission: {
    id: number;
    title: string;
    creator: {
      id: number;
      name: string;
    };
  };
  chatMessages: ChatMessage[];
}

interface ChatMessage {
  id: number;
  participationRequestId: number;
  senderId: number;
  message: string;
  messageType: 'message' | 'acceptance' | 'rejection';
  createdAt: string;
  sender: {
    id: number;
    name: string;
  };
}

interface SharedMissionsListProps {
  onBookMission?: (mission: SharedMission) => void;
  pendingNavigation?: {
    tab?: string;
    missionId?: number;
    requestId?: number;
  } | null;
}

export default function SharedMissionsList({ onBookMission, pendingNavigation }: SharedMissionsListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { messageCounts, refreshMessageCounts } = useNotifications();
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  
  // State for current view
  const [currentView, setCurrentView] = useState<'main' | 'create' | 'view'>('main');
  const [currentStep, setCurrentStep] = useState(1);
  
  // State for missions and requests
  const [missions, setMissions] = useState<SharedMission[]>([]);
  const [myRequests, setMyRequests] = useState<ParticipationRequest[]>([]);
  const [missionRequests, setMissionRequests] = useState<{[missionId: number]: ParticipationRequest[]}>({});
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);
  
  // State for chat
  const [showChat, setShowChat] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ParticipationRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [shouldOpenChatAfterLoad, setShouldOpenChatAfterLoad] = useState<number | null>(null);

  // State for details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedMissionForDetails, setSelectedMissionForDetails] = useState<SharedMission | null>(null);
  
  // Estados para pagamento PIX
  const [showPixModal, setShowPixModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [copiaCola, setCopiaCola] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [paying, setPaying] = useState(false);
  
  // Estado para resumo da missão
  const [missionSummary, setMissionSummary] = useState<any>(null);
  
  // Estado para cache do pagamento pendente
  const [pendingPayment, setPendingPayment] = useState<{
    paymentId: string;
    qrCode: string;
    copiaCola: string;
    missionData: any;
    createdAt: number;
  } | null>(null);
  
  // Estado para tela de confirmação de pagamento
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    missionTitle: string;
    totalCost: number;
    paymentId: string;
  } | null>(null);
  
  // Estado para verificação automática
  const [autoVerification, setAutoVerification] = useState(false);

  // State for aircrafts and filters
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [filterLoading, setFilterLoading] = useState(false);
  
  // Create mission states
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [selectedDepartureSlot, setSelectedDepartureSlot] = useState<any>(null);
  const [selectedReturnSlot, setSelectedReturnSlot] = useState<any>(null);
  const [missionData, setMissionData] = useState({
    title: '',
    description: '',
    origin: 'SBAU',
    destination: '',
    departureDate: null as Date | null,
    returnDate: null as Date | null,
    departureTime: '',
    returnTime: '',
    availableSeats: 1,
    overnightStays: 0
  });

  // Filter states
  const [filters, setFilters] = useState({
    aircraft: null as Aircraft | null,
    destination: '',
    departureDate: null as Date | null,
    returnDate: null as Date | null
  });

  useEffect(() => {
    loadAircrafts();
    loadMissions();
    loadMyRequests();
  }, []);

  useEffect(() => {
    if (currentView === 'view') {
      loadMissionRequestsForMyMissions();
    }
  }, [currentView]); // Removido 'missions' da dependência

  // Auto-scroll to bottom when chat messages change
  useEffect(() => {
    if (showChat && chatMessages.length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [chatMessages, showChat]);


  // Handle pending navigation to open specific chat
  useEffect(() => {
    if (pendingNavigation?.missionId && pendingNavigation?.requestId !== undefined) {
      const findAndOpenRequest = async () => {
        // If requestId is 0, it means navigate to mission view (for owner notifications)
        if (pendingNavigation.requestId === 0) {
          // Switch to view mode to see all requests for this mission
          setCurrentView('view');
          return;
        }

        // If we have a specific requestId, try to find and open it
        if (pendingNavigation.requestId) {
          // First check if we have the request in myRequests (for requester)
          const myRequest = myRequests.find(req => req.id === pendingNavigation.requestId);
          if (myRequest && myRequest.user && myRequest.sharedMission) {
            await openChat(myRequest);
            return;
          }

          // If not found in myRequests, check missionRequests (for owner)
          const missionRequestsList = missionRequests[pendingNavigation.missionId];
          if (missionRequestsList) {
            const ownerRequest = missionRequestsList.find(req => req.id === pendingNavigation.requestId);
            if (ownerRequest && ownerRequest.user && ownerRequest.sharedMission) {
              await openChat(ownerRequest);
              return;
            }
          }

          // If still not found or data is incomplete, we might need to load the data first
          // This could happen if the component just mounted or data is still loading
          // console.log('Request not found or incomplete, might need to load data first');
          
          // Try to reload data if we don't have it
          if (myRequests.length === 0) {
            await loadMyRequests();
          }
          if (!missionRequests[pendingNavigation.missionId]) {
            await loadMissionRequests(pendingNavigation.missionId);
          }
        }
      };

      findAndOpenRequest();
    }
  }, [pendingNavigation]);

  // Retry opening chat when data is loaded
  useEffect(() => {
    if (pendingNavigation?.missionId && pendingNavigation?.requestId && pendingNavigation.requestId !== 0) {
      const retryOpenChat = async () => {
        // Check if we now have the request data
        const myRequest = myRequests.find(req => req.id === pendingNavigation.requestId);
        if (myRequest && myRequest.user && myRequest.sharedMission) {
          await openChat(myRequest);
          return;
        }

        const missionRequestsList = missionRequests[pendingNavigation.missionId];
        if (missionRequestsList) {
          const ownerRequest = missionRequestsList.find(req => req.id === pendingNavigation.requestId);
          if (ownerRequest && ownerRequest.user && ownerRequest.sharedMission) {
            await openChat(ownerRequest);
            return;
          }
        }
      };

      retryOpenChat();
    }
  }, [myRequests, missionRequests, pendingNavigation]);

  const loadAircrafts = async () => {
    try {
      const data = await getAircrafts();
      
      const normalized: Aircraft[] = (Array.isArray(data) ? data : []).map((item: any) => ({
        id: item.id,
        name: item.name,
        registration: item.registration,
        model: item.model,
        seats: item.seats ?? item.max_passengers ?? 0,
        hourlyRate: item.hourlyRate ?? item.hourly_rate ?? 0,
        overnightRate: item.overnightRate ?? item.overnight_fee ?? 0,
        status: item.status ?? 'available',
      }));
      setAircrafts(normalized);
    } catch (error) {
      console.error('Erro ao carregar aeronaves:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as aeronaves",
        variant: "destructive"
      });
    }
  };

  const loadMissions = async () => {
    try {
      setFilterLoading(true);
      const data = await getSharedMissions();
      setMissions(data);
    } catch (error) {
      console.error('Erro ao carregar missões:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as missões compartilhadas",
        variant: "destructive"
      });
    } finally {
      setFilterLoading(false);
    }
  };

  const loadMyRequests = async () => {
    try {
      const data = await getMyParticipationRequests();
      setMyRequests(data);
      
      // Check if we should open chat after loading
      if (shouldOpenChatAfterLoad) {
        const request = data.find(r => r.sharedMissionId === shouldOpenChatAfterLoad);
        if (request) {
          setSelectedRequest(request);
          setChatMessages(request.chatMessages);
          setShowChat(true);
        }
        setShouldOpenChatAfterLoad(null);
      }
    } catch (error) {
      console.error('Erro ao carregar meus pedidos:', error);
    }
  };

  const loadMissionRequestsForMyMissions = async () => {
    try {
      const myMissions = missions.filter(mission => mission.creator.id === user?.id);
      const requestsMap: {[missionId: number]: ParticipationRequest[]} = {};
      
      for (const mission of myMissions) {
        try {
          const requests = await getParticipationRequestsForMission(mission.id);
          requestsMap[mission.id] = requests;
        } catch (error) {
          console.error(`Erro ao carregar pedidos para missão ${mission.id}:`, error);
          requestsMap[mission.id] = [];
        }
      }
      setMissionRequests(requestsMap);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos das minhas missões:', error);
    }
  };

  const loadMissionRequests = async (missionId: number) => {
    try {
      const requests = await getParticipationRequestsForMission(missionId);
      setMissionRequests(prev => ({
        ...prev,
        [missionId]: requests
      }));
    } catch (error) {
      console.error(`Erro ao carregar pedidos para missão ${missionId}:`, error);
    }
  };

  const hasPendingRequest = (missionId: number) => {
    return myRequests.some(request => 
      request.sharedMissionId === missionId && request.status === 'pending'
    );
  };

  const getMyRequestForMission = (missionId: number) => {
    return myRequests.find(request => request.sharedMissionId === missionId);
  };

  const handleParticipationRequest = async (mission: SharedMission) => {
    if (mission.creator.id === user?.id) {
      toast({
        title: "Erro",
        description: "Você não pode pedir participação na sua própria missão",
        variant: "destructive"
      });
      return;
    }

    if (mission.availableSeats === 0) {
      toast({
        title: "Erro",
        description: "Não há assentos disponíveis nesta missão",
        variant: "destructive"
      });
      return;
    }

    // Check if user already has a pending request for this mission
    const existingRequest = getMyRequestForMission(mission.id);
    if (existingRequest && existingRequest.status === 'pending') {
      // User already has a pending request, just open the chat
      openChat(existingRequest);
      toast({
        title: "Aviso",
        description: "Você já tem um pedido pendente para esta missão. Abrindo o chat...",
      });
      return;
    }

    try {
      setBookingLoading(mission.id);
      const request = await createParticipationRequest({
        sharedMissionId: mission.id,
        message: 'Olá! Gostaria de participar da sua missão compartilhada. Podemos conversar sobre os detalhes?'
      });

      // Find the newly created request in the updated myRequests state
      // (myRequests is updated in the finally block)
      const myRequest = myRequests.find((r: ParticipationRequest) => 
        r.sharedMissionId === mission.id && r.userId === request.userId
      );
      
      if (myRequest) {
        openChat(myRequest);
      }

      toast({
        title: "Sucesso",
        description: "Pedido de participação enviado!",
      });
    } catch (error: any) {
      console.error('Erro ao enviar pedido:', error);
      
      // Check if it's the "already has pending request" error
      if (error.message && error.message.includes('já tem um pedido pendente')) {
        toast({
          title: "Aviso",
          description: "Você já tem um pedido pendente para esta missão. Abrindo o chat...",
        });
        
        // Set a flag to open chat after myRequests is loaded
        setShouldOpenChatAfterLoad(mission.id);
      } else {
        toast({
          title: "Erro",
          description: error.message || "Erro ao enviar pedido de participação",
          variant: "destructive"
        });
      }
    } finally {
      setBookingLoading(null);
      await loadMyRequests(); // Ensure myRequests is always up-to-date
    }
  };

  const sendMessage = async () => {
    if (!selectedRequest || !newMessage.trim()) return;

    try {
      await sendParticipationRequestMessage(selectedRequest.id, {
        message: newMessage.trim()
      });

      // Add message to chat
      const newChatMessage: ChatMessage = {
        id: Date.now(),
        participationRequestId: selectedRequest.id,
        senderId: user?.id || 0,
        message: newMessage.trim(),
        messageType: 'message',
        createdAt: new Date().toISOString(),
        sender: {
          id: user?.id || 0,
          name: user?.name || 'Você'
        }
      };

      setChatMessages(prev => [...prev, newChatMessage]);
      setNewMessage('');

      // Scroll to bottom after sending message
      setTimeout(scrollToBottom, 100);

      // Reload requests for this mission
      await loadMissionRequests(selectedRequest.sharedMissionId);
      // Also reload all mission requests for the view
      await loadMissionRequestsForMyMissions();
    
    // Reload my requests if we're in the client view
    if (currentView === 'view') {
      await loadMyRequests();
    }

    // Refresh message counts
    await refreshMessageCounts();

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar mensagem",
        variant: "destructive"
      });
    }
  };

  const handleAcceptRequest = async () => {
    if (!selectedRequest) return;

    try {
      await acceptParticipationRequest(selectedRequest.id);
      
      toast({
        title: "Sucesso",
        description: "Solicitação aceita com sucesso!",
      });

      // Reload requests for this mission
      await loadMissionRequests(selectedRequest.sharedMissionId);
      // Also reload all mission requests for the view
      await loadMissionRequestsForMyMissions();
      
      // Update the selected request status
      setSelectedRequest(prev => prev ? { ...prev, status: 'accepted' as const } : null);
      
      // Reload my requests if we're in the client view
      if (currentView === 'view') {
        await loadMyRequests();
      }

      // Refresh message counts
      await refreshMessageCounts();
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao aceitar solicitação",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      await rejectParticipationRequest(selectedRequest.id);
      
      toast({
        title: "Sucesso",
        description: "Solicitação rejeitada com sucesso!",
      });

      // Reload requests for this mission
      await loadMissionRequests(selectedRequest.sharedMissionId);
      // Also reload all mission requests for the view
      await loadMissionRequestsForMyMissions();
      
      // Update the selected request status
      setSelectedRequest(prev => prev ? { ...prev, status: 'rejected' as const } : null);
      
      // Reload my requests if we're in the client view
      if (currentView === 'view') {
        await loadMyRequests();
      }

      // Refresh message counts
      await refreshMessageCounts();
      
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar solicitação",
        variant: "destructive"
      });
    }
  };

  const scrollToBottom = () => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedRequest(null);
    setChatMessages([]);
    setNewMessage('');
  };

  const openDetailsModal = (mission: SharedMission) => {
    setSelectedMissionForDetails(mission);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedMissionForDetails(null);
  };

  const openChat = async (request: ParticipationRequest) => {
    // Ensure the request has all required properties before opening chat
    if (!request || !request.user || !request.sharedMission) {
      console.error('Invalid request object:', request);
      toast({
        title: "Erro",
        description: "Dados da solicitação incompletos",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedRequest(request);
    setChatMessages(request.chatMessages || []);
    setShowChat(true);
    
    // Mark messages as read when opening chat
    try {
      await markMessagesAsRead(request.id);
      await refreshMessageCounts();
    } catch (error) {
      console.error('Erro ao marcar mensagens como lidas:', error);
    }

    // Scroll to bottom after chat opens
    setTimeout(scrollToBottom, 200);
  };


  // Funções de cálculo: usar utilitários globais para consistência
  const calculateFlightTime = (distanceNM: number, cruiseSpeedKT: number) => distanceNM / cruiseSpeedKT;

  // Função para calcular valor total incluindo destino principal e secundário
  const calculateTotalCost = async () => {
    if (!selectedAircraft || !selectedDestination) {
      return 0;
    }
    
    const originIcao = selectedOrigin.icao;
    const mainDestIcao = selectedDestination.icao;
    const secondaryDestIcao = selectedSecondaryDestination?.icao;
    
    // Calcular distâncias reais
    const aircraftSpeed = getAircraftSpeed(selectedAircraft.model);
    
    // Distância da origem para destino principal
    const originToMainDistance = resolvedDistanceNM ?? calculateDistance(
      (selectedOrigin as any).latitude || -21.1411,
      (selectedOrigin as any).longitude || -50.4247,
      (selectedDestination as any).latitude,
      (selectedDestination as any).longitude
    );
    
    // Distância do destino principal para secundário (se existir)
    let mainToSecondaryDistance = 0;
    if (selectedSecondaryDestination) {
      mainToSecondaryDistance = calculateDistance(
        (selectedDestination as any).latitude,
        (selectedDestination as any).longitude,
        (selectedSecondaryDestination as any).latitude,
        (selectedSecondaryDestination as any).longitude
      );
    }
    
    // Distância do destino secundário (ou principal) de volta para origem
    let returnDistance = 0;
    if (selectedSecondaryDestination) {
      returnDistance = calculateDistance(
        (selectedSecondaryDestination as any).latitude,
        (selectedSecondaryDestination as any).longitude,
        (selectedOrigin as any).latitude || -21.1411,
        (selectedOrigin as any).longitude || -50.4247
      );
    } else {
      returnDistance = originToMainDistance; // Volta direta
    }
    
    // Calcular tempos de voo individuais
    const originToMainTime = (originToMainDistance / aircraftSpeed) * 1.1; // +10% tráfego
    const mainToSecondaryTime = (mainToSecondaryDistance / aircraftSpeed) * 1.1;
    const returnFlightTime = (returnDistance / aircraftSpeed) * 1.1;
    
    // Tempo total de voo (ida + volta)
    const totalFlightTime = originToMainTime + mainToSecondaryTime + returnFlightTime;
    
    // Calcular pernoite
    let overnightDays = 0;
    if (departureDate && returnDate && departureTime && returnTime) {
      const departureHour = parseInt(departureTime.split(':')[0]);
      const returnHour = parseInt(returnTime.split(':')[0]);
      
      if (departureDate !== returnDate) {
        const departureDateObj = new Date(departureDate);
        const returnDateObj = new Date(returnDate);
        const timeDiff = returnDateObj.getTime() - departureDateObj.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        overnightDays = daysDiff;
      } else {
        if (returnHour >= 0 && returnHour < 6) {
          overnightDays = 1;
        } else if (returnHour >= 22) {
          overnightDays = 1;
        }
      }
    }
    
    // Preparar lista de destinos para cálculo de taxas
    const destinations = [mainDestIcao];
    if (secondaryDestIcao) {
      destinations.push(secondaryDestIcao);
    }
    
    // Calcular custos usando a função da missão solo
    const hourlyRate = selectedAircraft.hourlyRate;
    const overnightRate = selectedAircraft.overnightRate;
    
    try {
      const costCalculation = await calculateTotalMissionCost(
        originIcao,
        destinations,
        totalFlightTime,
        hourlyRate,
        overnightDays,
        overnightRate
      );
      
      // Calcular horários de pouso
      let mainArrivalTime = '';
      let secondaryArrivalTime = '';
      let returnArrivalTime = '';
      
      if (departureTime && returnTime) {
        const departureHour = parseInt(departureTime.split(':')[0]);
        const departureMinute = parseInt(departureTime.split(':')[1]);
        const returnHour = parseInt(returnTime.split(':')[0]);
        const returnMinute = parseInt(returnTime.split(':')[1]);
        
        // Pouso no destino principal
        const mainArrivalMinutes = departureMinute + (originToMainTime * 60);
        const mainArrivalHour = departureHour + Math.floor(mainArrivalMinutes / 60);
        const mainArrivalMin = Math.floor(mainArrivalMinutes % 60);
        mainArrivalTime = `${mainArrivalHour.toString().padStart(2, '0')}:${mainArrivalMin.toString().padStart(2, '0')}`;
        
        // Pouso no destino secundário (se existir)
        if (selectedSecondaryDestination) {
          const secondaryArrivalMinutes = mainArrivalMin + (mainToSecondaryTime * 60);
          const secondaryArrivalHour = mainArrivalHour + Math.floor(secondaryArrivalMinutes / 60);
          const secondaryArrivalMin = Math.floor(secondaryArrivalMinutes % 60);
          secondaryArrivalTime = `${secondaryArrivalHour.toString().padStart(2, '0')}:${secondaryArrivalMin.toString().padStart(2, '0')}`;
        }
        
        // Pouso na origem (volta)
        const returnArrivalMinutes = returnMinute + (returnFlightTime * 60);
        const returnArrivalHour = returnHour + Math.floor(returnArrivalMinutes / 60);
        const returnArrivalMin = Math.floor(returnArrivalMinutes % 60);
        returnArrivalTime = `${returnArrivalHour.toString().padStart(2, '0')}:${returnArrivalMin.toString().padStart(2, '0')}`;
      }
      
      // Calcular distância total
      const totalDistance = originToMainDistance + mainToSecondaryDistance + returnDistance;
      
      // Separar tarifas de navegação das taxas de aeroportos
      let totalNavigationFees = 0;
      let totalAirportFees = 0;
      
      Object.values(costCalculation.feeBreakdown).forEach(fees => {
        totalNavigationFees += fees.navigation_fee;
        totalAirportFees += (fees.landing_fee + fees.takeoff_fee + fees.parking_fee + fees.terminal_fee);
      });

      return {
        distanceNM: totalDistance.toFixed(1),
        flightHours: `${Math.floor(totalFlightTime)}h${totalFlightTime % 1 > 0 ? ` ${Math.round((totalFlightTime % 1) * 60)}min` : ''}`,
        baseCost: costCalculation.hourlyCost,
        overnightCost: costCalculation.overnightCost,
        overnightDays: overnightDays,
        navigationFees: totalNavigationFees,
        airportFees: totalAirportFees,
        feeBreakdown: costCalculation.feeBreakdown,
        mainArrivalTime: mainArrivalTime,
        secondaryArrivalTime: secondaryArrivalTime,
        returnArrivalTime: returnArrivalTime,
        totalCost: costCalculation.totalCost,
        // Detalhes da rota
        routeDetails: {
          originToMain: { distance: originToMainDistance.toFixed(1), time: originToMainTime.toFixed(2) },
          mainToSecondary: selectedSecondaryDestination ? { distance: mainToSecondaryDistance.toFixed(1), time: mainToSecondaryTime.toFixed(2) } : null,
          return: { distance: returnDistance.toFixed(1), time: returnFlightTime.toFixed(2) }
        }
      };
    } catch (error) {
      console.error('Erro ao calcular custos:', error);
      return 0;
    }
  };


  // Função para avançar etapa
  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Função para voltar etapa
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Função para validar etapa atual
  const canProceed = () => {
    switch (currentStep) {
      case 1: return selectedAircraft !== null;
      case 2: return selectedDestination !== null;
      case 3: return selectedDepartureSlot !== null;
      case 4: return selectedReturnSlot !== null;
      case 5: return availableSeats !== '' && parseInt(availableSeats) > 0;
      case 6: return true; // sempre pode criar na última etapa
      default: return false;
    }
  };


  // Função para filtrar as missões conforme os filtros de data/horário
  const applyFilters = () => {
    let filtered = missions.filter(m => m.origin === 'SBAU');
    if (filters.aircraft) {
      filtered = filtered.filter(m => m.aircraftId === filters.aircraft!.id);
    }
    if (filters.destination) {
      filtered = filtered.filter(m => 
        m.destination.toLowerCase().includes(filters.destination.toLowerCase())
      );
    }
    if (filters.departureDate) {
      filtered = filtered.filter(m => {
        const missionDate = new Date(m.departure_date);
        return missionDate.toDateString() === filters.departureDate!.toDateString();
      });
    }
    if (filters.returnDate) {
      filtered = filtered.filter(m => {
        const missionDate = new Date(m.return_date);
        return missionDate.toDateString() === filters.returnDate!.toDateString();
      });
    }
    setFilteredMissions(filtered);
  };

  // Função para checar se todos os campos obrigatórios estão preenchidos
  const isFilterValid = () => {
    return !!(selectedDestination && departureDate && departureTime && returnDate && returnTime);
  };

  const [showFilters, setShowFilters] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [filteredMissions, setFilteredMissions] = useState<SharedMission[]>([]);
  const [selectedOrigin] = useState<Airport>({
    icao: 'SBAU',
    name: 'Araçatuba',
    city: 'Araçatuba',
    state: 'SP',
    iata: 'ARU',
    country: 'Brasil',
    latitude: -21.1411,
    longitude: -50.4247
  });
  const [selectedDestination, setSelectedDestination] = useState<Airport | null>(null);
  const [selectedSecondaryDestination, setSelectedSecondaryDestination] = useState<Airport | null>(null);
  const [selectedAirports, setSelectedAirports] = useState<{[icao: string]: 'main' | 'secondary'}>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loadingAirports, setLoadingAirports] = useState(false);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState<string>('');
  const [totalSteps] = useState(6);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [resolvedOriginCoords, setResolvedOriginCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [resolvedDestCoords, setResolvedDestCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [resolvedDistanceNM, setResolvedDistanceNM] = useState<number | null>(null);

  // Calcular resumo da missão quando os dados mudarem
  useEffect(() => {
    const calculateSummary = async () => {
      if (selectedAircraft && selectedDestination && departureDate && returnDate && departureTime && returnTime) {
        try {
          const summary = await calculateTotalCost();
          if (summary) {
            setMissionSummary({
              aircraft: selectedAircraft,
              destination: selectedDestination,
              departureDate,
              departureTime,
              returnDate,
              returnTime,
              availableSeats,
              ...summary
            });
          }
        } catch (error) {
          console.error('Erro ao calcular resumo:', error);
          setMissionSummary(null);
        }
      } else {
        setMissionSummary(null);
      }
    };

    calculateSummary();
  }, [selectedAircraft, selectedDestination, departureDate, returnDate, departureTime, returnTime, availableSeats]);

  // Função para adicionar destinos
  const handleAddDestination = (airport: Airport, type: 'main' | 'secondary') => {
    const currentType = selectedAirports[airport.icao];
    
    // Se já está selecionado como o mesmo tipo, desselecionar
    if (currentType === type) {
      console.log('🎯 Desselecionando destino:', airport.icao);
      setSelectedAirports(prev => {
        const newSelected = { ...prev };
        delete newSelected[airport.icao];
        return newSelected;
      });

      if (type === 'main') {
        setSelectedDestination(null);
      } else {
        setSelectedSecondaryDestination(null);
      }
    } else {
      // Selecionar novo destino
      console.log('🎯 Selecionando destino:', airport.icao, 'como', type);
      setSelectedAirports(prev => ({
        ...prev,
        [airport.icao]: type
      }));

      if (type === 'main') {
        setSelectedDestination(airport);
      } else {
        setSelectedSecondaryDestination(airport);
      }
    }
  };

  // Resolver coordenadas reais (AISWEB com fallback local)
  useEffect(() => {
    const resolveCoords = async () => {
      try {
        // Origin fixo por enquanto: selectedOrigin.icao
        const origin = await getAirportCoordinatesWithFallback(selectedOrigin.icao);
        const dest = selectedDestination ? await getAirportCoordinatesWithFallback(selectedDestination.icao) : null;

        setResolvedOriginCoords(origin);
        setResolvedDestCoords(dest);

        if (origin && dest) {
          const nm = calculateDistance(origin.lat, origin.lon, dest.lat, dest.lon);
          setResolvedDistanceNM(nm);
          // console.log('🔎 Distância (NM) resolvida via AISWEB/local:', nm.toFixed(1));
        } else {
          setResolvedDistanceNM(null);
        }
      } catch {
        setResolvedDistanceNM(null);
      }
    };

    resolveCoords();
  }, [selectedOrigin.icao, selectedDestination?.icao]);

  // Carregar slots disponíveis da agenda (admin define no backend)
  useEffect(() => {
    const loadSlots = async () => {
      try {
        const cal = await getCalendar();
        // Converter reservas/bloqueios em janelas ocupadas e deduzir livres (simplificado: aqui só exibe ocupados)
        // Em uma versão mais completa, geraríamos os intervalos livres a partir das janelas abertas definidas pelo admin.
        setAvailableSlots([]); // Placeholder: deixar UI só como visualização por enquanto
      } catch (e) {
        setAvailableSlots([]);
      }
    };
    loadSlots();
  }, []);

  const regions = [
    { id: 'sudeste', name: 'Sudeste', states: ['SP', 'RJ', 'MG', 'ES'] },
    { id: 'sul', name: 'Sul', states: ['PR', 'RS', 'SC'] },
    { id: 'centro-oeste', name: 'Centro-Oeste', states: ['DF', 'GO', 'MT', 'MS'] },
    { id: 'nordeste', name: 'Nordeste', states: ['BA', 'PE', 'CE', 'MA', 'PB', 'PI', 'RN', 'SE', 'AL'] },
    { id: 'norte', name: 'Norte', states: ['AM', 'PA', 'AC', 'RO', 'RR', 'AP', 'TO'] }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Buscar aeroportos
  useEffect(() => {
    const searchAirportsAsync = async () => {
      try {
        setLoadingAirports(true);
        let airportsData: Airport[] = [];

        if (searchTerm.length < 2) {
          // Mostrar aeroportos populares por padrão
          airportsData = await getPopularAirports();
        } else if (selectedRegion) {
          airportsData = await getAirportsByRegion(selectedRegion);
        } else {
          airportsData = await searchAirports(searchTerm);
        }

        setAirports(airportsData);
      } catch (error) {
        console.error('❌ Erro ao buscar aeroportos:', error);
        setAirports([]);
      } finally {
        setLoadingAirports(false);
      }
    };

    const timeoutId = setTimeout(searchAirportsAsync, 300);
    return () => clearTimeout(timeoutId);
  }, [searchTerm, selectedRegion]);

  const handleOriginSelect = (airport: Airport) => {
    // Origin is fixed to SBAU
  };

  const handleDestinationSelect = (airport: Airport) => {
    setSelectedDestination(airport);
  };

  const handleRegionSelect = (region: string) => {
    setSelectedRegion(region === selectedRegion ? '' : region);
    setSearchTerm('');
  };

  const handleDepartureSlotSelect = (timeSlot: any) => {
    
    if (typeof timeSlot === 'object' && timeSlot.start) {
      setSelectedDepartureSlot(timeSlot);
      setDepartureDate(format(timeSlot.start, 'yyyy-MM-dd'));
      setDepartureTime(format(timeSlot.start, 'HH:mm'));
      
      // Avançar automaticamente para a próxima etapa
      setCurrentStep(4);
    } else {
      const time = timeSlot.toString();
      setDepartureTime(time);
      
      // Criar um TimeSlot para compatibilidade
      const newTimeSlot = {
        start: new Date(`${departureDate}T${time}:00`),
        end: new Date(`${departureDate}T${time}:00`),
        available: true
      };
      setSelectedDepartureSlot(newTimeSlot);
      
      // Avançar automaticamente para a próxima etapa
      setTimeout(() => {
        setCurrentStep(4);
      }, 500); // Pequeno delay para mostrar a seleção
    }
  };

  const handleReturnSlotSelect = (timeSlot: any) => {
    // console.log('🎯 Horário de retorno selecionado:', timeSlot);
    
    if (typeof timeSlot === 'object' && timeSlot.start) {
      setSelectedReturnSlot(timeSlot);
      setReturnDate(format(timeSlot.start, 'yyyy-MM-dd'));
      setReturnTime(format(timeSlot.start, 'HH:mm'));
      
      // Avançar automaticamente para a próxima etapa
      setCurrentStep(5);
    } else {
      const time = timeSlot.toString();
      setReturnTime(time);
      
      // Criar um TimeSlot para compatibilidade
      const newTimeSlot = {
        start: new Date(`${returnDate}T${time}:00`),
        end: new Date(`${returnDate}T${time}:00`),
        available: true
      };
      setSelectedReturnSlot(newTimeSlot);
      
      // Avançar automaticamente para a próxima etapa
      setTimeout(() => {
        setCurrentStep(5);
      }, 500); // Pequeno delay para mostrar a seleção
    }
  };

  // Atualizar useEffect para exibir todas as missões ao carregar
  useEffect(() => {
    setFilteredMissions(missions);
  }, [missions]);

  // Verificação automática do pagamento PIX
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (autoVerification && paymentId && showPixModal) {
      // console.log('🔄 Iniciando verificação automática do pagamento...');
      
      // Verificar a cada 5 segundos
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(buildApiUrl(`/api/shared-missions/pix-payment/${paymentId}/verify`), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json',
            }
          });
          
          const data = await response.json();
          
          if (data.success) {
            // console.log('✅ Pagamento confirmado automaticamente!');
            
            // Parar verificação automática
            setAutoVerification(false);
            clearInterval(intervalId);
            
            // Mostrar tela de sucesso
            const costCalculation = await calculateTotalCost();
            setPaymentSuccessData({
              missionTitle: `Missão compartilhada de ${getAirportNameByICAO('SBAU')} para ${getAirportNameByICAO(selectedDestination?.icao || '')}`,
              totalCost: typeof costCalculation === 'object' ? costCalculation.totalCost : 0,
              paymentId: paymentId
            });
            
            // Limpar cache e fechar modal
            setPendingPayment(null);
            setShowPixModal(false);
            setShowPaymentSuccess(true);
            
            toast({
              title: "Sucesso",
              description: "✅ Pagamento confirmado! Missão criada com sucesso!",
            });
          }
        } catch (error) {
          console.error('Erro na verificação automática:', error);
        }
      }, 5000); // 5 segundos
    }
    
    // Cleanup: limpar intervalo quando componente desmontar ou quando parar verificação
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoVerification, paymentId, showPixModal, selectedDestination]);

  const resetFilters = () => {
    setFilters({
      aircraft: null,
      destination: '',
      departureDate: null,
      returnDate: null
    });
    setFilteredMissions(missions);
  };

  // Debug: verificar estado do modal
  // console.log('🔍 Estado atual - showPixModal:', showPixModal, 'qrCode:', qrCode ? 'tem' : 'não tem', 'copiaCola:', copiaCola ? 'tem' : 'não tem');



  // Função para gerar pagamento PIX
  const handleGeneratePix = async () => {
    // console.log('🚀 handleGeneratePix iniciado');
    
    if (!selectedAircraft || !selectedDestination || !departureDate || !returnDate || !departureTime || !returnTime) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    setPaying(true);
    try {
      // Criar datas usando a mesma lógica da missão solo
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
      const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);

      const costCalculation = await calculateTotalCost();
      if (costCalculation === 0) {
        toast({
          title: "Erro",
          description: "Erro no cálculo de custos!",
          variant: "destructive"
        });
        return;
      }

      // Calcular flight_hours baseado na distância e velocidade
      const aircraftSpeed = getAircraftSpeed(selectedAircraft.model);
      
      // Buscar coordenadas dos aeroportos
      const originCoords = await getAirportCoordinatesWithFallback('SBAU');
      const destCoords = await getAirportCoordinatesWithFallback(selectedDestination.icao);
      
      if (!originCoords || !destCoords) {
        throw new Error('Não foi possível obter as coordenadas dos aeroportos');
      }
      
      // Calcular distância usando a função calculateDistance
      const distanceNM = calculateDistance(
        originCoords.lat, originCoords.lon,
        destCoords.lat, destCoords.lon
      );
      
      const flightTimeHours = (distanceNM / aircraftSpeed) * 1.1; // + 10% para tráfego aéreo
      const flightHours = flightTimeHours * 2; // Ida e volta

      // Dados da missão para enviar ao backend
      const missionData = {
        title: `Missão compartilhada de ${getAirportNameByICAO('SBAU')} para ${getAirportNameByICAO(selectedDestination.icao)}`,
        description: 'Missão compartilhada criada via wizard',
        origin: 'SBAU',
        destination: selectedDestination.icao,
        departure_date: departureDateTime.toISOString(),
        return_date: returnDateTime.toISOString(),
        aircraftId: selectedAircraft.id,
        totalSeats: selectedAircraft.seats,
        availableSeats: parseInt(availableSeats) || 1,
        pricePerSeat: Math.ceil(costCalculation.totalCost / (parseInt(availableSeats) || 1)),
        totalCost: costCalculation.totalCost,
        overnightFee: selectedAircraft.overnightRate,
        flight_hours: flightHours,
      };

      // Verificar se já existe um pagamento pendente válido (menos de 30 minutos)
      const now = Date.now();
      const thirtyMinutes = 30 * 60 * 1000; // 30 minutos em ms
      
      if (pendingPayment && (now - pendingPayment.createdAt) < thirtyMinutes) {
        // console.log('🔄 Reutilizando pagamento pendente existente');
        
        // Verificar se os dados da missão são os mesmos
        const isSameMission = JSON.stringify(pendingPayment.missionData) === JSON.stringify(missionData);
        
        if (isSameMission) {
          // console.log('✅ Dados da missão são os mesmos, reutilizando QR Code');
          setQrCode(pendingPayment.qrCode);
          setCopiaCola(pendingPayment.copiaCola);
          setPaymentId(pendingPayment.paymentId);
          setShowPixModal(true);
          
          toast({
            title: "Sucesso",
            description: "QR Code PIX carregado do cache!",
          });
          
          setPaying(false);
          return;
        } else {
          // console.log('⚠️ Dados da missão mudaram, criando novo pagamento');
        }
      }

      // console.log('🆕 Criando novo pagamento PIX');
      
      // Chamar API para gerar PIX
      const response = await fetch(buildApiUrl('/api/shared-missions/pix-payment'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(missionData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar pagamento PIX');
      }

      // console.log('🔍 Dados do PIX recebidos:', data);
      
      // Salvar no cache
      const newPendingPayment = {
        paymentId: data.paymentId,
        qrCode: data.pixQrCodeImage,
        copiaCola: data.pixCopiaCola,
        missionData: missionData,
        createdAt: now
      };
      
      setPendingPayment(newPendingPayment);
      setQrCode(data.pixQrCodeImage);
      setCopiaCola(data.pixCopiaCola);
      setPaymentId(data.paymentId);
      setShowPixModal(true);
      
      // Ativar verificação automática
      setAutoVerification(true);

      toast({
        title: "Sucesso",
        description: "QR Code PIX gerado com sucesso!",
      });

    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar pagamento PIX",
        variant: "destructive"
      });
    } finally {
      setPaying(false);
    }
  };

  // Função para verificar pagamento
  const handleVerifyPayment = async () => {
    try {
              const response = await fetch(buildApiUrl(`/api/shared-missions/pix-payment/${paymentId}/verify`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Mostrar tela de sucesso do pagamento
        const costCalculation = await calculateTotalCost();
        setPaymentSuccessData({
          missionTitle: `Missão compartilhada de ${getAirportNameByICAO('SBAU')} para ${getAirportNameByICAO(selectedDestination?.icao || '')}`,
          totalCost: typeof costCalculation === 'object' ? costCalculation.totalCost : 0,
          paymentId: paymentId
        });
        
        // Limpar cache do pagamento pendente
        setPendingPayment(null);
        setShowPixModal(false);
        setShowPaymentSuccess(true);
        
        toast({
          title: "Sucesso",
          description: "✅ Pagamento confirmado! Missão criada com sucesso!",
        });
      } else {
        toast({
          title: "Erro",
          description: data.error || 'Pagamento ainda não foi confirmado',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar pagamento",
        variant: "destructive"
      });
    }
  };

  // Função para copiar código PIX
  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(copiaCola);
      toast({
        title: "Sucesso",
        description: "Código PIX copiado!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao copiar código PIX",
        variant: "destructive"
      });
    }
  };

  // Tela de sucesso do pagamento
  if (showPaymentSuccess && paymentSuccessData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg w-full max-w-md p-6">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Pagamento Confirmado!</h3>
            <p className="text-sm text-gray-600">Sua missão foi criada com sucesso</p>
          </div>

          {/* Detalhes da missão */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-800 mb-3">Detalhes da Missão</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Missão:</span>
                <span className="font-medium text-gray-800">{paymentSuccessData.missionTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor Pago:</span>
                <span className="font-medium text-green-600">
                  R$ {paymentSuccessData.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID do Pagamento:</span>
                <span className="font-medium text-gray-800 text-xs">{paymentSuccessData.paymentId}</span>
              </div>
            </div>
          </div>

          {/* Mensagem de sucesso */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 font-medium">
                Missão criada e disponível para participantes!
              </span>
            </div>
            <p className="text-xs text-green-700 mt-2">
              Você pode gerenciar sua missão na seção "Minhas Missões"
            </p>
          </div>

          {/* Botões */}
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setShowPaymentSuccess(false);
                setPaymentSuccessData(null);
                setCurrentView('main');
                setCurrentStep(1);
                loadMissions();
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              Ver Minhas Missões
            </Button>
            <Button
              onClick={() => {
                setShowPaymentSuccess(false);
                setPaymentSuccessData(null);
                setCurrentView('main');
                setCurrentStep(1);
              }}
              variant="outline"
              className="flex-1"
            >
              Criar Nova Missão
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Modal do QR Code PIX (renderizado globalmente para todas as views)
  if (showPixModal) {
    // console.log('🔍 Renderizando modal PIX real!');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
        <div className="bg-white rounded-lg w-full max-w-sm md:max-w-md p-4 md:p-6">
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Pagamento PIX</h3>
            <p className="text-xs md:text-sm text-gray-600">Escaneie o QR Code ou copie o código PIX</p>
          </div>

          {/* QR Code */}
          {qrCode && (
            <div className="text-center mb-4 md:mb-6">
              <div className="bg-gray-50 p-2 md:p-3 rounded-lg mb-3 md:mb-4">
                <img 
                  src={qrCode} 
                  alt="QR Code PIX" 
                  className="mx-auto w-32 h-32 md:w-40 md:h-40"
                />
              </div>
            </div>
          )}

          {/* Código PIX */}
          {copiaCola && (
            <div className="mb-4 md:mb-6">
              <Label className="text-xs md:text-sm font-medium text-gray-700 mb-2 block">
                Código PIX (Copia e Cola)
              </Label>
              <div className="relative">
                <Textarea
                  value={copiaCola}
                  readOnly
                  className="w-full h-16 md:h-20 text-xs font-mono bg-gray-50 border-gray-300"
                />
                <Button
                  onClick={handleCopyPixCode}
                  size="sm"
                  className="absolute top-1 right-1 md:top-2 md:right-2 h-5 md:h-6 text-xs"
                >
                  Copiar
                </Button>
              </div>
            </div>
          )}

          {/* Status da verificação automática */}
          {autoVerification && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-blue-800 font-medium">
                  Verificando pagamento automaticamente...
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                A verificação acontece a cada 5 segundos. Você pode fechar esta janela.
              </p>
            </div>
          )}

          {/* Botões */}
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setShowPixModal(false);
                setAutoVerification(false); // Parar verificação automática
              }}
              variant="outline"
              className="flex-1"
            >
              Fechar
            </Button>
            <Button
              onClick={handleVerifyPayment}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={autoVerification} // Desabilitar durante verificação automática
            >
              {autoVerification ? 'Verificando...' : 'Verificar Manualmente'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCreateMission = async () => {
    if (!selectedAircraft || !selectedDestination || !departureDate || !returnDate || !departureTime || !returnTime) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      // Criar datas usando a mesma lógica da missão solo
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`);
      const returnDateTime = new Date(`${returnDate}T${returnTime}:00`);

      const costCalculation = await calculateTotalCost();
      if (costCalculation === 0) {
        toast({
          title: "Erro",
          description: "Não foi possível calcular o custo da missão",
          variant: "destructive"
        });
        return;
      }
      
      // Calcular flight_hours baseado na distância e velocidade
      const aircraftSpeed = getAircraftSpeed(selectedAircraft.model);
      
      // Buscar coordenadas dos aeroportos
      const originCoords = await getAirportCoordinatesWithFallback('SBAU');
      const destCoords = await getAirportCoordinatesWithFallback(selectedDestination.icao);
      
      if (!originCoords || !destCoords) {
        throw new Error('Não foi possível obter as coordenadas dos aeroportos');
      }
      
      // Calcular distância usando a função calculateDistance
      const distanceNM = calculateDistance(
        originCoords.lat, originCoords.lon,
        destCoords.lat, destCoords.lon
      );
      
      const flightTimeHours = (distanceNM / aircraftSpeed) * 1.1; // + 10% para tráfego aéreo
      const flightHours = flightTimeHours * 2; // Ida e volta
      
      // console.log(`🔍 FRONTEND FLIGHT HOURS DEBUG:`);
      // console.log(`🔍   Origin coords: ${originCoords.lat}, ${originCoords.lon}`);
      // console.log(`🔍   Dest coords: ${destCoords.lat}, ${destCoords.lon}`);
      // console.log(`🔍   Distance NM: ${distanceNM}`);
      // console.log(`🔍   Aircraft Speed: ${aircraftSpeed}`);
      // console.log(`🔍   Flight Time Hours: ${flightTimeHours}`);
      // console.log(`🔍   Flight Hours: ${flightHours}`);
      

      
      await createSharedMission({
        title: `Missão compartilhada de ${getAirportNameByICAO('SBAU')} para ${getAirportNameByICAO(selectedDestination.icao)}`,
        description: 'Missão compartilhada criada via wizard',
        origin: 'SBAU',
        destination: selectedDestination.icao,
        departure_date: departureDateTime.toISOString(),
        return_date: returnDateTime.toISOString(),
        aircraftId: selectedAircraft.id,
        totalSeats: selectedAircraft.seats,
        availableSeats: parseInt(availableSeats) || 1,
        pricePerSeat: Math.ceil(costCalculation.totalCost / (parseInt(availableSeats) || 1)),
        totalCost: costCalculation.totalCost,
        overnightFee: selectedAircraft.overnightRate,
        flight_hours: flightHours,
      });

      toast({
        title: "Sucesso",
        description: "Missão compartilhada criada com sucesso!",
      });
      setCurrentView('main');
      setCurrentStep(1);
      loadMissions();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar missão compartilhada",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm">Carregando...</span>
      </div>
    );
  }

  // View: Tela principal com os 2 cards
  if (currentView === 'main') {
    return (
      <div className="space-y-4 pb-20 md:pb-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">Missões Compartilhadas</h2>
            <p className="text-xs md:text-sm text-gray-600 mt-1">Crie ou participe de missões compartilhadas</p>
          </div>
          <Button onClick={loadMissions} variant="outline" size="sm" className="text-xs">
            Atualizar
          </Button>
        </div>

        {/* Cards de Opções */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Criar Missão Compartilhada */}
          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-blue-500" onClick={() => setCurrentView('create')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                <Plane className="h-8 w-8 text-blue-500" />
              </div>
              <CardTitle className="text-xl">Criar Missão Compartilhada</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Crie sua própria missão compartilhada e disponibilize poltronas para outros usuários
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="outline" className="text-blue-600 border-blue-600">
                    Você é o proprietário
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  • Defina rota e horários<br/>
                  • Escolha quantas poltronas compartilhar<br/>
                  • Gerencie sua missão
                </div>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Plane className="h-4 w-4 mr-2" />
                Criar Missão
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: Ver Missões Compartilhadas */}
          <Card className="cursor-pointer hover:shadow-lg transition-all border-2 hover:border-green-500" onClick={() => setCurrentView('view')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle className="text-xl">Ver Missões Compartilhadas</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                Encontre missões compartilhadas disponíveis e peça para participar
              </p>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Participe de missões
                  </Badge>
                </div>
                <div className="text-sm text-gray-500">
                  • Filtre por destino e datas<br/>
                  • Peça participação via chat<br/>
                  • Negocie valores diretamente
                </div>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Users className="h-4 w-4 mr-2" />
                Ver Missões
              </Button>
            </CardContent>
          </Card>


        </div>
      </div>
    );
  }

  // View: Tela de criação de missão
  if (currentView === 'create') {
    return (
      <div className="space-y-3 pb-20 md:pb-4">
        {/* Header compacto */}
        <div className="flex items-center justify-between bg-white border-b pb-2">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentView('main');
                setCurrentStep(1);
                setSelectedAircraft(null);
                setSelectedDestination(null);
                setAvailableSeats('');
                setDepartureDate('');
                setReturnDate('');
                setDepartureTime('');
                setReturnTime('');
              }}
              className="text-xs p-1 h-8 w-8"
            >
              ←
            </Button>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Criar Missão</h2>
              <p className="text-xs text-gray-600">Configure sua missão compartilhada</p>
            </div>
          </div>
        </div>

        {/* Progress Bar compacto */}
        <div className="px-3">
          <div className="grid grid-cols-2 gap-2 mb-4 md:flex md:items-center md:justify-between">
            <div className={`flex items-center space-x-1 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 1 ? <Check className="h-2 w-2" /> : '1'}
              </div>
              <span className="font-medium text-xs">Aeronave</span>
            </div>
            <div className={`flex items-center space-x-1 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 2 ? <Check className="h-2 w-2" /> : '2'}
              </div>
              <span className="font-medium text-xs">Destino</span>
            </div>
            <div className={`flex items-center space-x-1 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 3 ? <Check className="h-2 w-2" /> : '3'}
              </div>
              <span className="font-medium text-xs">Horário Ida</span>
            </div>
            <div className={`flex items-center space-x-1 ${currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 4 ? <Check className="h-2 w-2" /> : '4'}
              </div>
              <span className="font-medium text-xs">Horário Retorno</span>
            </div>
            <div className={`flex items-center space-x-1 ${currentStep >= 5 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep >= 5 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 5 ? <Check className="h-2 w-2" /> : '5'}
              </div>
              <span className="font-medium text-xs">Assentos</span>
            </div>
            <div className={`flex items-center space-x-1 ${currentStep >= 6 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep >= 6 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 6 ? <Check className="h-2 w-2" /> : '6'}
              </div>
              <span className="font-medium text-xs">Resumo</span>
            </div>
          </div>
        </div>

        {/* Conteúdo do wizard */}
        <div className="px-3 space-y-4">
          {/* Step 1: Seleção de Aeronave */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="text-center mb-3">
                <Plane className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900">Selecione a Aeronave</h3>
                <p className="text-xs text-gray-600">Escolha a aeronave para ver as taxas</p>
              </div>

              <div className="space-y-2">
                {aircrafts.map((plane) => (
                  <div
                    key={plane.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedAircraft?.id === plane.id
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                    onClick={() => setSelectedAircraft(plane)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <Plane className="h-4 w-4 text-blue-600" />
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{plane.name}</h4>
                            <p className="text-xs text-gray-600">{plane.registration} • {plane.model}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs">
                          <div className="bg-white p-1.5 rounded border">
                            <span className="text-gray-600">Passageiros:</span>
                            <div className="font-semibold text-blue-600">{plane.seats} pessoas</div>
                          </div>
                        </div>
                      </div>
                      {selectedAircraft?.id === plane.id && (
                        <Check className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Seleção de Destino */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="text-center mb-3">
                <MapPin className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900">Defina o Destino</h3>
                <p className="text-xs text-gray-600">Origem: Araçatuba → Selecione o aeroporto de destino</p>
              </div>
              
              {/* Busca de aeroporto de destino */}
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar aeroporto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9 text-xs"
                  />
                </div>
                
                {/* Lista de aeroportos */}
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {loadingAirports ? (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      <Loader2 className="h-4 w-4 mx-auto mb-1 animate-spin" />
                      <p>Carregando aeroportos...</p>
                    </div>
                  ) : airports.length > 0 ? (
                    <>
                      {searchTerm.length < 2 && (
                        <div className="text-xs text-gray-500 mb-2 px-2">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          Aeroportos populares
                        </div>
                      )}
                  {airports.map((airport) => (
                    <div
                      key={airport.icao}
                      className="p-3 border border-gray-200 rounded-lg hover:border-sky-300 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{airport.name}</div>
                          <div className="text-sm text-gray-600">
                            {airport.city}, {airport.state} - {airport.icao}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant={selectedAirports[airport.icao] === 'main' ? 'default' : 'outline'}
                            className={selectedAirports[airport.icao] === 'main' ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'hover:bg-blue-50'}
                            onClick={() => handleAddDestination(airport, 'main')}
                          >
                            {selectedAirports[airport.icao] === 'main' ? '✓ Primeiro' : 'Primeiro Destino'}
                          </Button>
                          <Button
                            size="sm"
                            variant={selectedAirports[airport.icao] === 'secondary' ? 'default' : 'outline'}
                            className={selectedAirports[airport.icao] === 'secondary' ? 'bg-gray-500 hover:bg-gray-600 text-white' : 'hover:bg-gray-50'}
                            onClick={() => handleAddDestination(airport, 'secondary')}
                          >
                            {selectedAirports[airport.icao] === 'secondary' ? '✓ Segundo' : 'Segundo Destino'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-xs">
                      <Search className="h-4 w-4 mx-auto mb-1" />
                      <p>{searchTerm.length > 0 ? 'Nenhum aeroporto encontrado' : 'Carregando aeroportos populares...'}</p>
                    </div>
                  )}
                </div>
              </div>
              



                </div>
              )}

          {/* Step 3: Seleção de Horário de Ida */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="text-center mb-3">
                <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900">Horário de Ida</h3>
                <p className="text-xs text-gray-600">Selecione a data e horário de partida</p>
                </div>
              
              {selectedAircraft && (
                <IntelligentTimeSelectionStep
                  title="Selecione o horário de partida"
                  selectedDate={format(new Date(), 'dd')}
                  currentMonth={new Date()}
                  selectedAircraft={{
                    id: selectedAircraft.id,
                    name: selectedAircraft.name,
                    registration: selectedAircraft.registration,
                    model: selectedAircraft.model,
                    status: selectedAircraft.status
                  }}
                  onTimeSelect={handleDepartureSlotSelect}
                  onBack={() => setCurrentStep(2)}
                  hasSecondaryDestination={!!selectedSecondaryDestination}
                  selectedDestinations={{
                    primary: selectedDestination?.icao,
                    secondary: selectedSecondaryDestination?.icao
                  }}
                  {...(console.log('🚀 DEBUG Step 3 - Passando props:', {
                    hasSecondaryDestination: !!selectedSecondaryDestination,
                    selectedDestination: selectedDestination?.icao,
                    selectedSecondaryDestination: selectedSecondaryDestination?.icao,
                    selectedDestinations: {
                      primary: selectedDestination?.icao,
                      secondary: selectedSecondaryDestination?.icao
                    }
                  }) || {})}
                  onAircraftSelect={(aircraft: CalendarAircraft) => {
                    const fullAircraft = aircrafts.find(a => a.id === aircraft.id);
                    if (fullAircraft) {
                      setSelectedAircraft(fullAircraft);
                    }
                  }}
                />
              )}
                </div>
          )}

          {/* Step 4: Seleção de Horário de Retorno */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="text-center mb-3">
                <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900">Horário de Retorno</h3>
                <p className="text-xs text-gray-600">Selecione a data e horário de retorno</p>
                </div>
              
              {selectedAircraft && selectedDepartureSlot && (
                <IntelligentTimeSelectionStep
                  title="Selecione o horário de retorno"
                  selectedDate={selectedDepartureSlot?.start ? format(selectedDepartureSlot.start, 'dd') : format(new Date(), 'dd')}
                  currentMonth={selectedDepartureSlot?.start || new Date()}
                  selectedAircraft={{
                    id: selectedAircraft.id,
                    name: selectedAircraft.name,
                    registration: selectedAircraft.registration,
                    model: selectedAircraft.model,
                    status: selectedAircraft.status
                  }}
                  onTimeSelect={handleReturnSlotSelect}
                  onBack={() => setCurrentStep(3)}
                  departureDateTime={selectedDepartureSlot.start}
                  isReturnSelection={true}
                  hasSecondaryDestination={!!selectedSecondaryDestination}
                  selectedDestinations={{
                    primary: selectedDestination?.icao,
                    secondary: selectedSecondaryDestination?.icao
                  }}
                  {...(console.log('🚀 DEBUG Step 4 - Passando props:', {
                    hasSecondaryDestination: !!selectedSecondaryDestination,
                    selectedDestination: selectedDestination?.icao,
                    selectedSecondaryDestination: selectedSecondaryDestination?.icao,
                    selectedDestinations: {
                      primary: selectedDestination?.icao,
                      secondary: selectedSecondaryDestination?.icao
                    },
                    isReturnSelection: true
                  }) || {})}
                  onAircraftSelect={(aircraft: CalendarAircraft) => {
                    const fullAircraft = aircrafts.find(a => a.id === aircraft.id);
                    if (fullAircraft) {
                      setSelectedAircraft(fullAircraft);
                    }
                  }}
                />
              )}
            </div>
          )}

          {/* Step 5: Configuração de Assentos */}
          {currentStep === 5 && (
            <div className="space-y-3">
              <div className="text-center mb-3">
                <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900">Configuração de Assentos</h3>
                <p className="text-xs text-gray-600">Configure quantos assentos liberar para outros</p>
              </div>
              
              {/* Campo de assentos disponíveis */}
              <div className="space-y-2">
                <Label htmlFor="availableSeats" className="text-xs font-bold">Quantos assentos você quer liberar para outros?</Label>
                

                <Input
                  id="availableSeats"
                  type="text"
                  placeholder="Digite o número de assentos"
                  value={availableSeats}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir apenas números
                    if (value === '' || /^\d+$/.test(value)) {
                      setAvailableSeats(value);
                    }
                  }}
                  onBlur={(e) => {
                    // Validar quando sair do campo
                    const value = parseInt(e.target.value) || 0;
                    const maxSeats = selectedAircraft ? selectedAircraft.seats - 1 : 1;
                    
                    if (value < 1) {
                      setAvailableSeats('1');
                    } else if (value > maxSeats) {
                      setAvailableSeats(maxSeats.toString());
                    }
                  }}
                  className="mt-1 h-9 text-xs"
                  required
                />
                <div className="text-xs text-gray-500">
                  {selectedAircraft ? (
                    <div className="text-blue-600 font-medium">
                      Capacidade total: {selectedAircraft.seats} passageiros
                    </div>
                  ) : 'Selecione uma aeronave primeiro'}
                </div>
              </div>

              {/* Resumo do horário selecionado */}
              {selectedDepartureSlot && selectedReturnSlot && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 text-xs mb-2">Horário Selecionado</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                      <span className="text-gray-600">Data de Ida:</span>
                      <div className="font-medium">{departureDate}</div>
                </div>
                <div>
                      <span className="text-gray-600">Horário de Ida:</span>
                      <div className="font-medium">{departureTime}</div>
                </div>
                <div>
                      <span className="text-gray-600">Data de Volta:</span>
                      <div className="font-medium">{returnDate}</div>
                </div>
                <div>
                      <span className="text-gray-600">Horário de Volta:</span>
                      <div className="font-medium">{returnTime}</div>
                </div>
              </div>
                  
                  {/* Botão para ir para o resumo */}
                  <div className="mt-3 pt-3 border-t border-blue-200">
                    <Button
                      onClick={() => setCurrentStep(6)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-xs h-8"
                    >
                      Ver Resumo Completo
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 6: Resumo e Confirmação */}
          {currentStep === 6 && (
            <div className="space-y-3">
              <div className="text-center mb-2">
                <Check className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <h3 className="text-sm font-semibold text-gray-900">Resumo da Missão</h3>
                <p className="text-xs text-gray-600">Confirme os dados antes de criar</p>
              </div>
              
              {(() => {
                if (!missionSummary) return <div>Carregando...</div>;
                const summary = missionSummary;
                
                return (
                  <div className="space-y-2">
                    {/* Dados da missão */}
                    <div className="bg-blue-50 p-2 rounded-lg">
                      <h4 className="font-medium text-blue-900 text-xs mb-1">Dados da Missão</h4>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span>Aeronave:</span>
                          <span className="font-medium">{summary.aircraft.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Origem:</span>
                          <span className="font-medium">{getAirportNameByICAO('SBAU')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Destino:</span>
                          <span className="font-medium">{getAirportNameByICAO(summary.destination.icao)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Assentos:</span>
                          <span className="font-medium">{summary.availableSeats}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ida:</span>
                          <span className="font-medium">{summary.departureDate} {summary.departureTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Volta:</span>
                          <span className="font-medium">{summary.returnDate} {summary.returnTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Cálculo de custos */}
                    <div className="bg-green-50 p-2 rounded-lg">
                      <h4 className="font-medium text-green-900 text-xs mb-1">Cálculo de Custos</h4>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span>Distância:</span>
                          <span className="font-medium">{parseFloat(summary.distanceNM).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} NM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tempo de voo total (ida + volta):</span>
                          <span className="font-medium">{summary.flightHours}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Base (ida + volta):</span>
                          <span className="font-medium">R$ {summary.baseCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        {/* Tarifas por aeroporto */}
                        {Object.entries(summary.feeBreakdown).map(([icao, fees]) => {
                          const airportFees = fees as any; // Type assertion para AirportFees
                          return (
                          <div key={icao} className="border-l-2 border-green-300 pl-2 ml-2">
                            <div className="text-xs font-medium text-green-800 mb-1">
                              {icao} ({getAirportNameByICAO(icao)})
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">Tarifa de navegação:</span>
                              <span className="font-medium text-xs">R$ {airportFees.navigation_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-xs">Taxas de aeroporto:</span>
                              <span className="font-medium text-xs">R$ {(airportFees.landing_fee + airportFees.takeoff_fee + airportFees.parking_fee + airportFees.terminal_fee).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold text-green-700 border-t pt-0.5 mt-1">
                              <span>Subtotal {icao}:</span>
                              <span>R$ {airportFees.total_fee.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                          );
                        })}
                        
                        {/* Totais gerais */}
                        <div className="border-t pt-1 mt-2">
                          <div className="flex justify-between">
                            <span>Total tarifas de navegação:</span>
                            <span className="font-medium">R$ {summary.navigationFees?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total taxas de aeroportos:</span>
                            <span className="font-medium">R$ {summary.airportFees.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                        {summary.overnightCost > 0 && (
                          <>
                          <div className="flex justify-between">
                              <span>Pernoites:</span>
                              <span className="font-medium">{summary.overnightDays || 0} noite(s)</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Taxa de pernoite:</span>
                            <span className="font-medium">R$ {summary.overnightCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                          </>
                        )}
                        <div className="flex justify-between font-bold text-green-700 border-t pt-0.5">
                          <span>Total:</span>
                          <span>R$ {summary.totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Horários de Pouso */}
                    <div className="bg-gray-50 p-2 rounded-lg mt-2">
                      <h4 className="font-medium text-gray-900 text-xs mb-1">Horários de Pouso</h4>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span>Pouso no primeiro destino:</span>
                          <span className="font-medium">{summary.mainArrivalTime || 'N/A'}</span>
                        </div>
                        {summary.secondaryArrivalTime && (
                          <div className="flex justify-between">
                            <span>Pouso no segundo destino:</span>
                            <span className="font-medium">{summary.secondaryArrivalTime}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Pouso na origem (volta):</span>
                          <span className="font-medium">{summary.returnArrivalTime || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Detalhes da Rota */}
                    <div className="bg-blue-50 p-2 rounded-lg mt-2">
                      <h4 className="font-medium text-blue-900 text-xs mb-1">Detalhes da Rota</h4>
                      <div className="space-y-0.5 text-xs">
                        <div className="flex justify-between">
                          <span>SBAU (Araçatuba) → {summary.destination.icao} ({getAirportNameByICAO(summary.destination.icao)}):</span>
                          <span className="font-medium">{parseFloat(summary.routeDetails.originToMain.distance).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} NM ({summary.routeDetails.originToMain.time}h)</span>
                        </div>
                        {summary.routeDetails.mainToSecondary && selectedSecondaryDestination && (
                          <div className="flex justify-between">
                            <span>{summary.destination.icao} ({getAirportNameByICAO(summary.destination.icao)}) → {selectedSecondaryDestination.icao} ({getAirportNameByICAO(selectedSecondaryDestination.icao)}):</span>
                            <span className="font-medium">{parseFloat(summary.routeDetails.mainToSecondary.distance).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} NM ({summary.routeDetails.mainToSecondary.time}h)</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>{(selectedSecondaryDestination?.icao || summary.destination.icao)} ({(selectedSecondaryDestination ? getAirportNameByICAO(selectedSecondaryDestination.icao) : getAirportNameByICAO(summary.destination.icao))}) → SBAU (Araçatuba):</span>
                          <span className="font-medium">{parseFloat(summary.routeDetails.return.distance).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} NM ({summary.routeDetails.return.time}h)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Navegação */}
          <div className="flex justify-between pt-3 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-1 text-xs h-8"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Anterior</span>
            </Button>

            <div className="flex space-x-2">
              {currentStep < totalSteps ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                  className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-xs h-8"
                >
                  <span>Seguinte</span>
                  <ArrowRight className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  onClick={handleGeneratePix}
                  disabled={paying}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                >
                  {paying ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Gerando PIX...</span>
                    </>
                  ) : (
                    <>
                  <Check className="h-3 w-3" />
                                        <span>Pagar via PIX</span>
                </>
              )}
                </Button>
            

              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View: Tela de visualização de missões
  if (currentView === 'view') {
    return (
      <div className="space-y-4 pb-20 md:pb-4">
        {/* Header com botão voltar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setCurrentView('main');
                setSelectedAircraft(null);
                setSelectedDestination(null);
                setDepartureDate('');
                setReturnDate('');
                setSearchTerm('');
                setFilteredMissions(missions);
              }}
              className="text-xs"
            >
              ← Voltar
            </Button>
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">Missões Compartilhadas</h2>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Encontre e participe de missões</p>
            </div>
          </div>
          <Button onClick={loadMissions} variant="outline" size="sm" className="text-xs">
            Atualizar
          </Button>
        </div>

        {/* Filtros */}
        <Card className="border border-green-100 shadow-sm">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 p-3">
            <CardTitle className="flex items-center justify-between text-green-900 text-sm md:text-base">
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 md:h-5 md:w-5" />
                <span>Filtrar Missões</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-4">
            <div className="space-y-4">
              {/* Filtro por aeronave */}
              <div>
                <Label className="text-xs font-medium text-gray-700">Aeronave</Label>
                <Select onValueChange={(value) => {
                  if (value === 'all') {
                    setSelectedAircraft(null);
                  } else {
                    setSelectedAircraft(aircrafts.find(a => a.id.toString() === value) || null);
                  }
                }}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Todas as aeronaves" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as aeronaves</SelectItem>
                    {aircrafts.map((plane) => (
                      <SelectItem key={plane.id} value={plane.id.toString()}>
                        {plane.name} ({plane.registration})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por destino */}
              <div>
                <Label className="text-xs font-medium text-gray-700">Destino</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar aeroporto de destino..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-8 text-xs"
                  />
                </div>
                {airports.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                    {airports.map((airport) => (
                      <div
                        key={airport.icao}
                        className={`p-2 rounded border cursor-pointer transition-all text-xs ${
                          selectedDestination?.icao === airport.icao
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleDestinationSelect(airport)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-900">
                              {airport.icao} - {airport.name}
                            </div>
                            <div className="text-gray-600">
                              {airport.city}, {airport.state}
                            </div>
                          </div>
                          {selectedDestination?.icao === airport.icao && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Filtros de data */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Data de Ida</Label>
                  <Input 
                    type="date" 
                    value={departureDate} 
                    onChange={e => setDepartureDate(e.target.value)} 
                    className="h-8 text-xs" 
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Data de Volta</Label>
                  <Input 
                    type="date" 
                    value={returnDate} 
                    onChange={e => setReturnDate(e.target.value)} 
                    className="h-8 text-xs" 
                  />
                </div>
              </div>

              {/* Botões de ação */}
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={() => {
                    applyFilters();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                >
                  <Search className="h-3 w-3 mr-1" />
                  Aplicar Filtros
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAircraft(null);
                    setSelectedDestination(null);
                    setDepartureDate('');
                    setReturnDate('');
                    setSearchTerm('');
                    setFilteredMissions(missions);
                  }}
                  className="text-xs h-8"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Missões */}
        <div className="space-y-3">
          {filteredMissions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Plane className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">Nenhuma missão encontrada</h3>
                <p className="text-xs text-gray-600">Ajuste os filtros para encontrar missões.</p>
              </CardContent>
            </Card>
          ) : (
            filteredMissions.map((mission) => (
              <Card key={mission.id} className="hover:shadow-md transition-all duration-200 border hover:border-blue-200">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center space-x-2">
                        <Plane className="h-4 w-4 text-blue-600" />
                        <span className="text-sm md:text-base">{mission.title}</span>
                        <Badge className={`text-xs ${getStatusColor(mission.status)}`}>
                          {getStatusText(mission.status)}
                        </Badge>
                      </CardTitle>
                      {mission.description && (
                        <p className="text-xs text-gray-600 mt-1">{mission.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-600">
                          {mission.availableSeats} assentos
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">disponíveis</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-100 rounded">
                        <MapPin className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">{getAirportNameByICAO(mission.origin)} → {getAirportNameByICAO(mission.destination)}</p>
                        <p className="text-xs text-gray-500">Rota</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-green-100 rounded">
                        <CalendarIcon className="h-3 w-3 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">
                          {format(new Date(mission.departure_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(mission.departure_date), 'HH:mm', { locale: ptBR })} - Partida
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-purple-100 rounded">
                        <Users className="h-3 w-3 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">
                          {mission.availableSeats}/{mission.totalSeats}
                        </p>
                        <p className="text-xs text-gray-500">Assentos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-red-100 rounded">
                        <CalendarIcon className="h-3 w-3 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">
                          {format(new Date(mission.return_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(mission.return_date), 'HH:mm', { locale: ptBR })} - Retorno
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-orange-100 rounded">
                        <User className="h-3 w-3 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">{mission.creator.name}</p>
                        <p className="text-xs text-gray-500">Organizador</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-gray-100 rounded">
                        <Clock className="h-3 w-3 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">
                          {format(new Date(mission.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-gray-500">
                          {format(new Date(mission.createdAt), 'HH:mm', { locale: ptBR })} - Criada
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex items-center justify-between text-xs text-gray-600">
                      <div className="flex items-center space-x-1">
                        <Plane className="h-3 w-3" />
                        <span className="font-medium">{mission.aircraft.name} ({mission.aircraft.registration})</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center mt-3">
                      <Button
                        onClick={() => openDetailsModal(mission)}
                        variant="outline"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 text-xs h-8 px-3"
                      >
                        <Plane className="h-3 w-3 mr-1" />
                        Ver Detalhes
                      </Button>
                      
                      <div className="flex items-center space-x-2">
                      {mission.creator.id !== user?.id && mission.status === 'active' && mission.availableSeats > 0 ? (
                        hasPendingRequest(mission.id) ? (
                          <Button
                            onClick={() => {
                              const myRequest = getMyRequestForMission(mission.id);
                              if (myRequest) {
                                openChat(myRequest);
                              }
                            }}
                            className="bg-green-600 hover:bg-green-700 text-xs h-8 px-3"
                          >
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Ver Chat
                            {messageCounts && messageCounts.missionCounts[mission.id] && (
                              <Badge 
                                variant="destructive" 
                                className="ml-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center"
                              >
                                {messageCounts.missionCounts[mission.id].unreadCount > 99 ? '99+' : messageCounts.missionCounts[mission.id].unreadCount}
                              </Badge>
                            )}
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleParticipationRequest(mission)}
                            disabled={bookingLoading === mission.id}
                            className="bg-blue-600 hover:bg-blue-700 text-xs h-8 px-3"
                          >
                            {bookingLoading === mission.id ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                Enviando...
                              </>
                            ) : (
                              <>
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Negociar
                              </>
                            )}
                          </Button>
                        )
                      ) : mission.creator.id === user?.id ? (
                        <div className="flex items-center space-x-2">
                          {/* Show request count and unread messages for mission owner */}
                          {(() => {
                            const requests = missionRequests[mission.id] || [];
                            const pendingRequests = requests.filter(r => r.status === 'pending');
                            const acceptedRequests = requests.filter(r => r.status === 'accepted');
                            const rejectedRequests = requests.filter(r => r.status === 'rejected');
                            const unreadCount = messageCounts?.myMissionsCounts[mission.id]?.unreadCount || 0;
                            
                            return (
                              <>
                                <div className="flex items-center space-x-1">
                                  <MessageCircle className="h-3 w-3 text-orange-600" />
                                  <span className="text-xs text-orange-600 font-medium">
                                    {pendingRequests.length} pendentes
                                  </span>
                                  {unreadCount > 0 && (
                                    <Badge 
                                      variant="destructive" 
                                      className="ml-1 h-4 w-4 rounded-full p-0 text-xs flex items-center justify-center"
                                    >
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                {(pendingRequests.length > 0 || unreadCount > 0) && (
                                  <Button
                                    onClick={() => {
                                      const firstPending = pendingRequests[0];
                                      if (firstPending) {
                                        openChat(firstPending);
                                      } else if (requests.length > 0) {
                                        openChat(requests[0]);
                                      }
                                    }}
                                    className="bg-orange-600 hover:bg-orange-700 text-xs h-7 px-2"
                                  >
                                    Ver
                                  </Button>
                                )}
                                {requests.length > 0 && (
                                  <Button
                                    onClick={() => {
                                      if (requests.length > 0) {
                                        openChat(requests[0]);
                                      }
                                    }}
                                    variant="outline"
                                    className="text-purple-600 border-purple-600 hover:bg-purple-50 text-xs h-7 px-2"
                                  >
                                    Todas ({requests.length})
                                  </Button>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      ) : mission.availableSeats === 0 ? (
                        <Badge variant="outline" className="text-red-600 text-xs px-2 py-1">
                          Lotado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600 text-xs px-2 py-1">
                          Indisponível
                        </Badge>
                      )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Chat Modal */}
        {showChat && selectedRequest && selectedRequest.user && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-semibold">Chat - {selectedRequest.sharedMission?.title || 'Missão'}</h3>
                    <p className="text-xs text-gray-600">
                      {selectedRequest.user?.id === user?.id ? 'Você é o solicitante' : `Solicitante: ${selectedRequest.user?.name || 'Usuário'}`}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeChat}
                  className="h-6 w-6 p-0"
                >
                  ✕
                </Button>
              </div>

              {/* Action Buttons for Mission Owner - Moved to top */}
              {selectedRequest.sharedMission?.creator.id === user?.id && selectedRequest.status === 'pending' && (
                <div className="flex space-x-2 p-3 border-b bg-gray-50">
                  <Button
                    onClick={handleAcceptRequest}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                  >
                    ✅ Aceitar
                  </Button>
                  <Button
                    onClick={handleRejectRequest}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50 text-xs h-8"
                  >
                    ❌ Rejeitar
                  </Button>
                </div>
              )}

              {/* Chat Messages */}
              <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-3 space-y-2 max-h-60">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs p-2 rounded-lg text-xs ${
                        msg.senderId === user?.id
                          ? 'bg-blue-600 text-white'
                          : msg.messageType === 'acceptance'
                          ? 'bg-green-100 text-green-800'
                          : msg.messageType === 'rejection'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <div className="font-medium text-xs mb-1">{msg.sender?.name || 'Usuário'}</div>
                      <div>{msg.message}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {format(new Date(msg.createdAt), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-3 border-t">
                <div className="flex space-x-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 h-8 text-xs"
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="h-8 px-3 text-xs"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedMissionForDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold">Detalhes da Missão</h3>
      </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={closeDetailsModal}
                  className="h-6 w-6 p-0"
                >
                  ✕
                </Button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="space-y-3">
                  {/* Title and Status */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900">{selectedMissionForDetails.title}</h4>
                    <Badge className={`text-xs ${getStatusColor(selectedMissionForDetails.status)}`}>
                      {getStatusText(selectedMissionForDetails.status)}
                    </Badge>
                  </div>

                  {/* Description */}
                  {selectedMissionForDetails.description && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedMissionForDetails.description}</p>
                    </div>
                  )}

                  {/* Route */}
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <MapPin className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {getAirportNameByICAO(selectedMissionForDetails.origin)} → {getAirportNameByICAO(selectedMissionForDetails.destination)}
                      </p>
                      <p className="text-sm text-gray-600">Rota da missão</p>
                    </div>
                  </div>

                  {/* Dates and Times */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CalendarIcon className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-800">Partida</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {format(new Date(selectedMissionForDetails.departure_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(selectedMissionForDetails.departure_date), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CalendarIcon className="h-4 w-4 text-red-600" />
                        <span className="font-semibold text-red-800">Retorno</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {format(new Date(selectedMissionForDetails.return_date), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(selectedMissionForDetails.return_date), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>

                  {/* Aircraft Info */}
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Plane className="h-4 w-4 text-purple-600" />
                      <span className="font-semibold text-purple-800">Aeronave</span>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {selectedMissionForDetails.aircraft.name} ({selectedMissionForDetails.aircraft.registration})
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedMissionForDetails.aircraft.model}
                    </p>
                  </div>

                  {/* Flight Info */}
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="h-4 w-4 text-indigo-600" />
                      <span className="font-semibold text-indigo-800">Informações de Voo</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Tempo de Voo:</span>
                        <p className="text-gray-900">{selectedMissionForDetails.flight_hours || 2.0} horas</p>
                      </div>
                      {selectedMissionForDetails.paymentId && (
                        <div>
                          <span className="font-medium text-gray-700">Payment ID:</span>
                          <p className="text-gray-900 text-xs">{selectedMissionForDetails.paymentId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Seats and Pricing */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-orange-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="h-4 w-4 text-orange-600" />
                        <span className="font-semibold text-orange-800">Assentos</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        {selectedMissionForDetails.availableSeats}/{selectedMissionForDetails.totalSeats}
                      </p>
                      <p className="text-sm text-gray-600">disponíveis</p>
                    </div>

                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-yellow-800">💰 Preço</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900">
                        R$ {selectedMissionForDetails.pricePerSeat?.toLocaleString('pt-BR') || '0'}
                      </p>
                      <p className="text-sm text-gray-600">por assento</p>
                    </div>
                  </div>

                  {/* Organizer */}
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="h-4 w-4 text-gray-600" />
                      <span className="font-semibold text-gray-800">Organizador</span>
                    </div>
                    <p className="font-semibold text-gray-900">{selectedMissionForDetails.creator.name}</p>
                  </div>

                  {/* Additional Info */}
                  {selectedMissionForDetails.overnightStays > 0 && (
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-indigo-800">🌙 Pernoites</span>
                      </div>
                      <p className="font-semibold text-gray-900">
                        {selectedMissionForDetails.overnightStays} noite(s)
                      </p>
                      {selectedMissionForDetails.overnightFee > 0 && (
                        <p className="text-sm text-gray-600">
                          Taxa de pernoite: R$ {selectedMissionForDetails.overnightFee?.toLocaleString('pt-BR') || '0'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t bg-gray-50">
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={closeDetailsModal}
                    className="text-gray-600"
                  >
                    Fechar
                  </Button>
                  {selectedMissionForDetails.creator.id !== user?.id && 
                   selectedMissionForDetails.status === 'active' && 
                   selectedMissionForDetails.availableSeats > 0 && (
                    <Button
                      onClick={() => {
                        closeDetailsModal();
                        handleParticipationRequest(selectedMissionForDetails);
                      }}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Participar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


      </div>
    );
  }
}; 
