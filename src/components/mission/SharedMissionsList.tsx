import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Plane, 
  MapPin, 
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
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { 
  getSharedMissions, 
  createSharedMission, 
  getAircrafts,
  createParticipationRequest,
  getParticipationRequestsForMission,
  sendParticipationRequestMessage,
  acceptParticipationRequest,
  rejectParticipationRequest
} from '@/utils/api';
import { searchAirports, getPopularAirports, getAirportsByRegion, Airport, calculateDistance as calculateDistanceNM, getAircraftSpeed, getAirportCoordinatesWithFallback } from '@/utils/airport-search';
import { getCalendar } from '@/utils/api';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  seats: number;
  hourlyRate: number;
  overnightRate: number;
}

interface SharedMission {
  id: number;
  title: string;
  description?: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date: string;
  aircraftId: number;
  totalSeats: number;
  availableSeats: number;
  pricePerSeat: number;
  overnightFee: number;
  overnightStays: number;
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

export default function SharedMissionsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<'main' | 'create' | 'view'>('main');
  const [missions, setMissions] = useState<SharedMission[]>([]);
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);

  // Create mission states
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
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
  const [currentStep, setCurrentStep] = useState(1);

  // Filter states
  const [filters, setFilters] = useState({
    aircraft: null as Aircraft | null,
    destination: '',
    departureDate: null as Date | null,
    returnDate: null as Date | null
  });

  // Chat states
  const [showChat, setShowChat] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ParticipationRequest | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [bookingLoading, setBookingLoading] = useState<number | null>(null);

  useEffect(() => {
    loadAircrafts();
    if (currentView === 'view') {
      loadMissions();
    }
  }, [currentView]);

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

    try {
      setBookingLoading(mission.id);
      const request = await createParticipationRequest({
        sharedMissionId: mission.id,
        message: 'Olá! Gostaria de participar da sua missão compartilhada. Podemos conversar sobre os detalhes?'
      });

      // Carregar mensagens do chat
      const messages = await getParticipationRequestsForMission(mission.id);
      const myRequest = messages.find((r: ParticipationRequest) => r.userId === request.userId);
      
      if (myRequest) {
        setSelectedRequest(myRequest);
        setChatMessages(myRequest.chatMessages);
        setShowChat(true);
      }

      toast({
        title: "Sucesso",
        description: "Pedido de participação enviado!",
      });
    } catch (error: any) {
      console.error('Erro ao enviar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao enviar pedido de participação",
        variant: "destructive"
      });
    } finally {
      setBookingLoading(null);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest) return;

    try {
      const message = await sendParticipationRequestMessage(selectedRequest.id, {
        message: newMessage
      });

      setChatMessages(prev => [...prev, message]);
      setNewMessage('');
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
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
      
      // Atualizar mensagens com a mensagem de aceitação
      const acceptanceMessage: ChatMessage = {
        id: Date.now(),
        participationRequestId: selectedRequest.id,
        senderId: selectedRequest.sharedMission.creator.id,
        message: '✅ Pedido aceito! Você foi aprovado para participar da missão.',
        messageType: 'acceptance',
        createdAt: new Date().toISOString(),
        sender: {
          id: selectedRequest.sharedMission.creator.id,
          name: selectedRequest.sharedMission.creator.name
        }
      };

      setChatMessages(prev => [...prev, acceptanceMessage]);
      
      // Atualizar status do pedido
      setSelectedRequest(prev => prev ? { ...prev, status: 'accepted' } : null);

      toast({
        title: "Sucesso",
        description: "Pedido aceito com sucesso!",
      });
    } catch (error: any) {
      console.error('Erro ao aceitar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao aceitar pedido",
        variant: "destructive"
      });
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;

    try {
      await rejectParticipationRequest(selectedRequest.id);
      
      // Atualizar mensagens com a mensagem de rejeição
      const rejectionMessage: ChatMessage = {
        id: Date.now(),
        participationRequestId: selectedRequest.id,
        senderId: selectedRequest.sharedMission.creator.id,
        message: '❌ Pedido rejeitado. Obrigado pelo interesse.',
        messageType: 'rejection',
        createdAt: new Date().toISOString(),
        sender: {
          id: selectedRequest.sharedMission.creator.id,
          name: selectedRequest.sharedMission.creator.name
        }
      };

      setChatMessages(prev => [...prev, rejectionMessage]);
      
      // Atualizar status do pedido
      setSelectedRequest(prev => prev ? { ...prev, status: 'rejected' } : null);

      toast({
        title: "Sucesso",
        description: "Pedido rejeitado",
      });
    } catch (error: any) {
      console.error('Erro ao rejeitar pedido:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao rejeitar pedido",
        variant: "destructive"
      });
    }
  };

  const closeChat = () => {
    setShowChat(false);
    setSelectedRequest(null);
    setChatMessages([]);
    setNewMessage('');
  };

  // Funções de cálculo: usar utilitários globais para consistência
  const calculateFlightTime = (distanceNM: number, cruiseSpeedKT: number) => distanceNM / cruiseSpeedKT;

  // Função para calcular valor total
  const calculateTotalCost = () => {
    if (!selectedAircraft || !selectedDestination) return 0;
    
    // Usar coordenadas reais (local ou AISWEB) via utilitário
    // selectedOrigin é SBAU fixo por enquanto
    const originIcao = selectedOrigin.icao;
    const destIcao = selectedDestination.icao;

    // Usar distância resolvida por AISWEB/local quando disponível
    const distanceNM = resolvedDistanceNM ?? calculateDistanceNM(
      (selectedOrigin as any).latitude || -21.1411,
      (selectedOrigin as any).longitude || -50.4247,
      (selectedDestination as any).latitude,
      (selectedDestination as any).longitude
    );

    const cruiseSpeedKT = getAircraftSpeed(selectedAircraft.model);
    const flightHours = calculateFlightTime(distanceNM, cruiseSpeedKT);
    const baseCost = Math.max(1, Math.ceil(flightHours * 2)) * selectedAircraft.hourlyRate; // ida+volta arredondado como no solo
    
    // Calcular pernoite se necessário
    const overnightDays = departureDate && returnDate ? 
      Math.max(0, Math.floor((new Date(returnDate).getTime() - new Date(departureDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;
    const overnightCost = overnightDays * selectedAircraft.overnightRate;
    
    return {
      distanceNM: distanceNM.toFixed(1),
      flightHours: flightHours.toFixed(1),
      baseCost: baseCost,
      overnightCost: overnightCost,
      totalCost: baseCost + overnightCost
    };
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
      case 3: return selectedAircraft && selectedDestination && departureDate && departureTime && returnDate && returnTime && availableSeats > 0;
      case 4: return true; // sempre pode criar na última etapa
      default: return false;
    }
  };

  // Função para gerar resumo
  const generateSummary = () => {
    if (!selectedAircraft || !selectedDestination) return null;
    
    const costCalculation = calculateTotalCost();
    
    return {
      aircraft: selectedAircraft,
      destination: selectedDestination,
      departureDate,
      departureTime,
      returnDate,
      returnTime,
      availableSeats,
      ...costCalculation
    };
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
  });
  const [selectedDestination, setSelectedDestination] = useState<Airport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loadingAirports, setLoadingAirports] = useState(false);
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [availableSeats, setAvailableSeats] = useState<number>(1);
  const [totalSteps] = useState(4);
  const [missionSummary, setMissionSummary] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<{ start: string; end: string }[]>([]);
  const [resolvedOriginCoords, setResolvedOriginCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [resolvedDestCoords, setResolvedDestCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [resolvedDistanceNM, setResolvedDistanceNM] = useState<number | null>(null);

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
          const nm = calculateDistanceNM(origin.lat, origin.lon, dest.lat, dest.lon);
          setResolvedDistanceNM(nm);
          console.log('🔎 Distância (NM) resolvida via AISWEB/local:', nm.toFixed(1));
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
      if (searchTerm.length < 2) {
        setAirports([]);
        return;
      }

      try {
        setLoadingAirports(true);
        let airportsData: Airport[] = [];

        if (selectedRegion) {
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

  // Atualizar useEffect para exibir todas as missões ao carregar
  useEffect(() => {
    setFilteredMissions(missions);
  }, [missions]);

  const resetFilters = () => {
    setFilters({
      aircraft: null,
      destination: '',
      departureDate: null,
      returnDate: null
    });
    setFilteredMissions(missions);
  };

  const handleCreateMission = async () => {
    if (!selectedAircraft || !selectedDestination || !missionData.departureDate || !missionData.returnDate) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios!",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const departureDateTime = new Date(missionData.departureDate);
      departureDateTime.setHours(parseInt(missionData.departureTime.split(':')[0]));
      departureDateTime.setMinutes(parseInt(missionData.departureTime.split(':')[1]));

      const returnDateTime = new Date(missionData.returnDate);
      returnDateTime.setHours(parseInt(missionData.returnTime.split(':')[0]));
      returnDateTime.setMinutes(parseInt(missionData.returnTime.split(':')[1]));

      const costCalculation = calculateTotalCost();

      await createSharedMission({
        title: `Missão compartilhada de ${missionData.origin} para ${selectedDestination.icao}`,
        description: missionData.description,
        origin: missionData.origin,
        destination: selectedDestination.icao,
        departure_date: departureDateTime.toISOString(),
        return_date: returnDateTime.toISOString(),
        aircraftId: selectedAircraft.id,
        totalSeats: selectedAircraft.seats,
        availableSeats: missionData.availableSeats,
        pricePerSeat: 0,
        overnightFee: selectedAircraft.overnightRate,
        overnightStays: missionData.overnightStays
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
        <div className="grid md:grid-cols-2 gap-4">
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
                setAvailableSeats(1);
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
              <span className="font-medium text-xs">Detalhes</span>
            </div>
            <div className={`flex items-center space-x-1 ${currentStep >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {currentStep > 4 ? <Check className="h-2 w-2" /> : '4'}
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
                <MapPin className="h-6 w-6 text-red-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900">Defina o Destino</h3>
                <p className="text-xs text-gray-600">Selecione o aeroporto de chegada</p>
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
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {airports.map((airport) => (
                    <div
                      key={airport.icao}
                      className={`p-2 rounded border cursor-pointer transition-all text-xs ${
                        selectedDestination?.icao === airport.icao
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
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
                          <div className="w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Campo de assentos disponíveis */}
              {selectedDestination && (
                <div className="mt-4 space-y-2">
                  <Label htmlFor="availableSeats" className="text-xs font-bold">Quantos assentos você quer liberar para outros?</Label>
                  <Input
                    id="availableSeats"
                    type="number"
                    min="1"
                    max={selectedAircraft ? (selectedAircraft.seats || 1) - 1 : 1}
                    value={availableSeats}
                    onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 1)}
                    className="mt-1 h-9 text-xs"
                    required
                  />
                  <div className="text-xs text-gray-500">
                    {selectedAircraft ? `Máximo: ${(selectedAircraft.seats || 1) - 1} assentos` : 'Selecione uma aeronave primeiro'}
                  </div>
                </div>
              )}

              {/* Campos de data e horário */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Data de Ida</Label>
                  <Input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Horário de Ida</Label>
                  <Input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Data de Volta</Label>
                  <Input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Horário de Volta</Label>
                  <Input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} className="h-9 text-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Assentos e Datas */}
          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="text-center mb-3">
                <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-gray-900">Detalhes da Missão</h3>
                <p className="text-xs text-gray-600">Defina assentos e horários</p>
              </div>
              
              {/* Campo de assentos disponíveis */}
              <div className="space-y-2">
                <Label htmlFor="availableSeats" className="text-xs font-bold">Quantos assentos você quer liberar para outros?</Label>
                <Input
                  id="availableSeats"
                  type="number"
                  min="1"
                  max={selectedAircraft ? (selectedAircraft.seats || 1) - 1 : 1}
                  value={availableSeats}
                  onChange={(e) => setAvailableSeats(parseInt(e.target.value) || 1)}
                  className="mt-1 h-9 text-xs"
                  required
                />
                <div className="text-xs text-gray-500">
                  {selectedAircraft ? `Máximo: ${(selectedAircraft.seats || 1) - 1} assentos` : 'Selecione uma aeronave primeiro'}
                </div>
              </div>

              {/* Campos de data e horário */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div>
                  <Label className="text-xs font-medium text-gray-700">Data de Ida</Label>
                  <Input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Horário de Ida</Label>
                  <Input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Data de Volta</Label>
                  <Input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)} className="h-9 text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-medium text-gray-700">Horário de Volta</Label>
                  <Input type="time" value={returnTime} onChange={e => setReturnTime(e.target.value)} className="h-9 text-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Resumo e Confirmação */}
          {currentStep === 4 && (
            <div className="space-y-3">
              <div className="text-center mb-2">
                <Check className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <h3 className="text-sm font-semibold text-gray-900">Resumo da Missão</h3>
                <p className="text-xs text-gray-600">Confirme os dados antes de criar</p>
              </div>
              
              {(() => {
                const summary = generateSummary();
                if (!summary) return <div>Carregando...</div>;
                
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
                          <span>Destino:</span>
                          <span className="font-medium">{summary.destination.icao}</span>
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
                          <span className="font-medium">{summary.distanceNM} NM</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tempo:</span>
                          <span className="font-medium">{summary.flightHours}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Base:</span>
                          <span className="font-medium">R$ {summary.baseCost.toFixed(2)}</span>
                        </div>
                        {summary.overnightCost > 0 && (
                          <div className="flex justify-between">
                            <span>Pernoite:</span>
                            <span className="font-medium">R$ {summary.overnightCost.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-green-700 border-t pt-0.5">
                          <span>Total:</span>
                          <span>R$ {summary.totalCost.toFixed(2)}</span>
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
                  onClick={async () => {
                    if (!canProceed()) {
                      toast({
                        title: "Erro",
                        description: "Preencha todos os campos obrigatórios!",
                        variant: "destructive"
                      });
                      return;
                    }
                    
                    try {
                      await createSharedMission({
                        title: `Missão compartilhada de SBAU para ${selectedDestination!.icao}`,
                        description: 'Missão compartilhada criada via wizard',
                        origin: 'SBAU',
                        destination: selectedDestination!.icao,
                        departure_date: `${departureDate}T${departureTime}`,
                        return_date: `${returnDate}T${returnTime}`,
                        aircraftId: selectedAircraft!.id,
                        totalSeats: availableSeats,
                        pricePerSeat: 0,
                        overnightFee: selectedAircraft!.overnightRate || 0
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
                    }
                  }}
                  className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                >
                  <Check className="h-3 w-3" />
                  <span>Criar Missão</span>
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
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 bg-blue-100 rounded">
                        <MapPin className="h-3 w-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">{mission.origin} → {mission.destination}</p>
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
                        <p className="text-xs text-gray-500">Partida</p>
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
                      <div className="p-1.5 bg-orange-100 rounded">
                        <User className="h-3 w-3 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-xs">{mission.creator.name}</p>
                        <p className="text-xs text-gray-500">Organizador</p>
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
                    
                    <div className="flex justify-end mt-3">
                      {mission.creator.id !== user?.id && mission.status === 'active' && mission.availableSeats > 0 ? (
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
                              Pedir Participação
                            </>
                          )}
                        </Button>
                      ) : mission.creator.id === user?.id ? (
                        <Badge variant="outline" className="text-gray-600 text-xs px-2 py-1">
                          Sua missão
                        </Badge>
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
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Chat Modal */}
        {showChat && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md max-h-[80vh] flex flex-col">
              {/* Chat Header */}
              <div className="flex items-center justify-between p-3 border-b">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                  <div>
                    <h3 className="text-sm font-semibold">Chat - {selectedRequest.sharedMission.title}</h3>
                    <p className="text-xs text-gray-600">
                      {selectedRequest.user.id === user?.id ? 'Você é o solicitante' : `Solicitante: ${selectedRequest.user.name}`}
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

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-60">
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
                      <div className="font-medium text-xs mb-1">{msg.sender.name}</div>
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

                {/* Action Buttons for Mission Owner */}
                {selectedRequest.user.id === user?.id && chatMessages.length > 0 && (
                  <div className="flex space-x-2 mt-2">
                    <Button
                      onClick={handleAcceptRequest}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-7"
                    >
                      ✅ Aceitar
                    </Button>
                    <Button
                      onClick={handleRejectRequest}
                      variant="outline"
                      className="flex-1 text-red-600 border-red-600 hover:bg-red-50 text-xs h-7"
                    >
                      ❌ Rejeitar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}; 