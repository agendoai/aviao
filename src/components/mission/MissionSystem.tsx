
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign, 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  Globe,
  Check
} from 'lucide-react';
import { format, addDays, startOfDay, endOfDay, eachHourOfInterval, parseISO, isBefore, isAfter } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { convertBrazilianTimeToUTC, convertBrazilianDateToUTCString, convertUTCToBrazilianTime, formatBrazilTime } from '@/utils/dateUtils';
import WeeklySchedule from './WeeklySchedule';
import MissionCreation from './MissionCreation';
import TripTypeSelection from './TripTypeSelection';

import PassengerDetailsCollection from './PassengerDetailsCollection';
import PaymentStep from './PaymentStep';
import SharedFlightOptions from './SharedFlightOptions';
import SharedFlights from './SharedFlights';
import CreateSharedMission from './CreateSharedMission';
import SharedFlightSeatSelection from './SharedFlightSeatSelection';
import SharedFlightPassengerInfo from './SharedFlightPassengerInfo';
import SharedFlightBookingConfirmation from './SharedFlightBookingConfirmation';
import FinancialVerification from './FinancialVerification';
import MissionConfirmation from './MissionConfirmation';
import SharedMissionConfirmation from './SharedMissionConfirmation';
import CreateSharedMissionForm from './CreateSharedMissionForm';
import SharedMissionsList from './SharedMissionsList';
import SimpleCalendar from '../SimpleCalendar';
import BaseDestinationFlow from './BaseDestinationFlow';
import { getAircrafts, getBookings, createBooking } from '@/utils/api';
import { useAuth } from '@/hooks/use-auth';
import { useNavigation } from '@/hooks/use-navigation';
import { toast } from 'sonner';
import AirportStats from './AirportStats';
import OvernightExample from './OvernightExample';
import IntelligentTimeSelectionStep from '../booking-flow/IntelligentTimeSelectionStep';
// merged into the main dateUtils import above
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { getAirportCoordinatesWithFallback, testAISWEBConnection, calculateDistance, verifyDistances, getAircraftSpeed, verifySBAUtoSBSV } from '@/utils/airport-search';

interface SharedFlight {
  id: string;
  aircraft: string;
  departure: Date;
  arrival: Date;
  origin: string;
  destination: string;
  totalSeats: number;
  availableSeats: number;
  owner: string;
  stops?: string[];
}

interface PassengerInfo {
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'cpf' | 'rg';
}

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  status: string;
  max_passengers: number;
  hourly_rate: number;
  overnight_fee: number;
}

interface Booking {
  id: number;
  aircraftId: number;
  userId: number;
  departure_date: string;
  return_date: string;
  status: string;
  value: number;
  blocked_until?: string; // Campo para bloqueio de manutenção
  user: {
    name: string;
    email: string;
  };
}

interface CalendarEntry {
  id: number;
  aircraftId: number;
  departure_date: string;
  return_date: string;
  status: string; // 'available' | 'blocked' | 'pendente' | 'confirmada' | 'paga'
}

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflictingBooking?: Booking;
}

const MissionSystem: React.FC = () => {
  const [currentView, setCurrentView] = useState<'trip-type' | 'schedule' | 'base-destination-flow' | 'passengers' | 'payment' | 'confirmation' | 'shared-flights' | 'create-shared' | 'seat-selection' | 'passenger-info' | 'booking-confirmation' | 'shared-booking-confirmation' | 'creation' | 'financial' | 'shared-confirmation' | 'shared-missions-list'>('trip-type');
  const [tripType, setTripType] = useState<'solo' | null>(null);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [missionData, setMissionData] = useState<any>(null);
  const [selectedSharedFlight, setSelectedSharedFlight] = useState<SharedFlight | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo | null>(null);
  
  // Estados para aeronaves da API
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAircraftForSchedule, setSelectedAircraftForSchedule] = useState<Aircraft | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Estados para missão
  const [origin, setOrigin] = useState('SBAU'); // Araçatuba como padrão
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [returnDate, setReturnDate] = useState(''); // Adicionar estado para data de retorno
  const [passengers, setPassengers] = useState<Array<{name: string, document: string, documentType: 'rg' | 'passport'}>>([]);
  const [flightHours, setFlightHours] = useState(2);
  const [overnightStays, setOvernightStays] = useState(0);
  const [distance, setDistance] = useState(0);
  
  const { user } = useAuth();
  const { pendingNavigation } = useNavigation();

  // Mock user data - em produção viria do contexto/Supabase
  const [userBalance] = useState(15000);
  const [userPriority] = useState(3);

  // Monitorar mudanças no currentView para debug
  useEffect(() => {
    // Debug removido para produção
  }, [currentView]);

  // Handle pending navigation to open specific chat
  useEffect(() => {
    if (pendingNavigation?.tab === 'missions' && pendingNavigation.missionId && pendingNavigation.requestId) {
      setCurrentView('shared-missions-list');
    }
  }, [pendingNavigation]);

  // Monitorar mudanças no returnDate para debug
  useEffect(() => {
    // Debug removido para produção
  }, [returnDate]);

  // Verificar se usuário está logado
  useEffect(() => {
    const token = localStorage.getItem('token');
    // Debug removido para produção
  }, [user]);

  // Buscar aeronaves e reservas da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Verificar distâncias conhecidas
        verifyDistances();
        verifySBAUtoSBSV(); // Adicionado para verificar a distância de SBAU para SBSV
        
        // Testar conectividade da API AISWEB
        const isAISWEBAvailable = await testAISWEBConnection();
        if (!isAISWEBAvailable) {
          // Debug removido para produção
        }

        const [aircraftData, bookingsData, calendarData] = await Promise.all([
          getAircrafts(),
          getBookings(),
          (async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/calendar`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            });
            return res.json();
          })()
        ]);
        
        // Filtrar apenas aeronaves disponíveis
        const availableAircraft = aircraftData.filter((a: Aircraft) => a.status === 'available');
        setAircraft(availableAircraft);
        setBookings(bookingsData);
        setCalendarEntries(calendarData);
        // Debug removido para produção
        
        // Log detalhado das reservas com bloqueios
        bookingsData.forEach((booking: any) => {
          if (booking.blocked_until) {
            // Debug removido para produção
          }
        });
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calcular slots de tempo disponíveis para uma aeronave
  const calculateAvailableTimeSlots = (aircraftId: number, selectedDate: Date) => {
    const slots: TimeSlot[] = [];
    const startHour = 6; // 6h
    const endHour = 24; // 24h (incluindo slots noturnos até 23:30)
    
    // Entradas de calendário (agenda admin) para a aeronave e data
    const dayEntries = calendarEntries.filter(e => {
      if (e.aircraftId !== aircraftId) return false;
      const d = format(parseISO(e.departure_date), 'yyyy-MM-dd');
      return d === format(selectedDate, 'yyyy-MM-dd');
    });

    // Reservas/bloqueios efetivos (que ocupam o horário)
    const busyEntries = dayEntries.filter(e => e.status !== 'available');

    // Slots considerados disponíveis pelo admin
    const adminAvailableSlots = dayEntries.filter(e => e.status === 'available');

    // Buscar reservas que podem ter bloqueio de manutenção
    const bookingsForAircraft = bookings.filter(b => b.aircraftId === aircraftId);

    for (let hour = startHour; hour < endHour; hour++) {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // precisa existir um slot 'available' que cubra este intervalo
      const hasAdminSlot = adminAvailableSlots.some(e => {
        const s = parseISO(e.departure_date);
        const r = parseISO(e.return_date);
        return s < slotEnd && r > slotStart;
      });

      // verificar conflito com busyEntries (calendário admin)
      const conflictingCalendar = busyEntries.find(e => {
        const s = parseISO(e.departure_date);
        const r = parseISO(e.return_date);
        return (s < slotEnd && r > slotStart);
      });

      // verificar conflito com reservas
      const conflictingBooking = bookingsForAircraft.find(b => {
        const departureDate = convertUTCToBrazilianTime(b.departure_date);
        const returnDate = convertUTCToBrazilianTime(b.return_date);
        
        // Conflito direto de horário
        const directConflict = departureDate < slotEnd && returnDate > slotStart;
        return directConflict;
      });

      const conflicting = conflictingCalendar || conflictingBooking;

             // Log de debug para slots conflitantes
       if (conflicting) {
         // Debug removido para produção
       }

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: hasAdminSlot && !conflicting,
        conflictingBooking: conflicting as any,
      });
    }

    return slots;
  };

  // Função para calcular velocidade baseada no tipo de aeronave


  // Cálculo de custos baseado em dados reais de voo
  const calculateFlightCosts = (dest: string, returnTime: string, distance: number, returnDate?: string, selectedDate?: Date) => {
    // Debug removido para produção
    
    setDistance(distance);
    
    // Verificar se departureTime está definido
    if (!departureTime) {
      // Debug removido para produção
      setFlightHours(1); // Valor padrão
      setOvernightStays(0);
      return;
    }

    // Calcular tempo de voo usando a fórmula correta: Tempo (H) = Distância (NM) / Velocidade Cruzeiro (KT)
    const aircraftSpeed = selectedAircraft ? getAircraftSpeed(selectedAircraft.model) : 185; // Velocidade em nós (KT)
    const flightTimeHours = (distance / aircraftSpeed) * 1.1; // Tempo em horas + 10% para tráfego aéreo
    
    // Debug removido para produção

    // Calcular tempo total (ida + volta)
    const flightHours = Math.max(1, Math.ceil(flightTimeHours * 2)); // Multiplicar por 2 para ida e volta
    // Debug removido para produção
    setFlightHours(flightHours);

    // Calcular pernoite baseado no horário de retorno e data
    const departureHour = parseInt(departureTime.split(':')[0]);
    const departureMinute = parseInt(departureTime.split(':')[1]);
    const returnHour = parseInt(returnTime.split(':')[0]);
    const returnMinute = parseInt(returnTime.split(':')[1]);
    
    // Debug removido para produção
    
    let overnight = 0;
    
    // Calcular pernoite baseado em passar da meia-noite (00:00)
    if (returnDate && returnDate !== format(selectedDate || new Date(), 'yyyy-MM-dd')) {
      // Datas diferentes - calcular número de pernoites
      const departureDateObj = new Date(selectedDate || new Date());
      const returnDateObj = new Date(`${returnDate}T00:00:00`); // Adicionar horário para evitar conversão UTC
      
      // Debug removido para produção
      
      // Calcular diferença em dias
      const timeDiff = returnDateObj.getTime() - departureDateObj.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      // Número de pernoites = dias de diferença
      // Exemplo: dia 2 → dia 4 = 2 dias de diferença = 2 pernoites
      overnight = daysDiff;
      // Debug removido para produção
    } else {
      // Mesmo dia, verificar se passa da meia-noite
      if (returnHour >= 0 && returnHour < 6) {
        // Entre 00:00 e 05:59 = pernoite
        overnight = 1;
        // Debug removido para produção
      } else if (returnHour >= 22) {
        // Após 22:00 = pernoite (voo noturno)
        overnight = 1;
        // Debug removido para produção
      }
    }
    
    // Debug removido para produção
    setOvernightStays(overnight);
    
    // Debug removido para produção
    
    // Exemplo de cálculo para SBAU → SBAR (259 NM)
    if (Math.abs(distance - 259) < 1) {
      // Debug removido para produção
    }
  };

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate);
    if (selectedAircraftForSchedule) {
      const slots = calculateAvailableTimeSlots(selectedAircraftForSchedule.id, newDate);
      setAvailableTimeSlots(slots);
    }
  };

  const handleSelectSharedFlight = (flight: SharedFlight) => {
    setSelectedSharedFlight(flight);
    setCurrentView('seat-selection');
  };

  const handleSeatSelected = (seatNumber: number) => {
    setSelectedSeat(seatNumber);
    setCurrentView('passenger-info');
  };

  const handlePassengerInfoSubmitted = (info: PassengerInfo) => {
    setPassengerInfo(info);
    setCurrentView('booking-confirmation');
  };

  const handleBookingConfirmed = () => {
    setCurrentView('shared-booking-confirmation');
  };



  const handleViewExistingFlights = () => {
    setCurrentView('shared-flights');
  };

  const handleSharedMissionCreated = (data: any) => {
    setMissionData(data);
    setCurrentView('shared-confirmation');
  };

  const handleShowSharedMissions = () => {
    setCurrentView('shared-missions');
  };

  const handleCreateSharedMission = () => {
    setCurrentView('create-shared-mission');
  };

  const handleBookSharedMission = (mission: any) => {
    // Implementar lógica de reserva
    // Debug removido para produção
    toast.success('Funcionalidade de reserva em desenvolvimento');
  };

  const handleSharedMissionFormSuccess = () => {
    setCurrentView('shared-missions');
    toast.success('Missão compartilhada criada com sucesso!');
  };

  const handleSharedMissionFormCancel = () => {
    setCurrentView('shared-missions');
  };

  const resetFlow = () => {
    setCurrentView('trip-type');
    setTripType(null);
    setSelectedAircraft(null);
    setSelectedTimeSlot(null);
    setMissionData(null);
    setSelectedSharedFlight(null);
    setSelectedSeat(null);
    setPassengerInfo(null);
    setSelectedAircraftForSchedule(null);
    setAvailableTimeSlots([]);
    setOrigin('SBAU');
    setDestination('');
    setDepartureTime('');
    setReturnTime('');
    setReturnDate(''); // Resetar data de retorno
    setPassengers([]);
    setFlightHours(2);
    setOvernightStays(0);
    setDistance(0);
  };

  const handleTripTypeSelection = (type: 'solo' | 'shared-missions') => {
    // Debug removido para produção
    setTripType(type);
    
    if (type === 'solo') {
      setCurrentView('schedule');
    } else if (type === 'shared-missions') {
      setCurrentView('shared-missions-list');
    }
  };

  const handleAircraftSelection = (aircraftItem: Aircraft) => {
    // Debug removido para produção
    setSelectedAircraftForSchedule(aircraftItem);
    
    // Calcular slots disponíveis para a data selecionada
    const slots = calculateAvailableTimeSlots(aircraftItem.id, selectedDate);
    setAvailableTimeSlots(slots);
  };

  const handleTimeSlotSelection = (slot: TimeSlot) => {
    // Debug removido para produção
    setSelectedTimeSlot(slot);
    setSelectedAircraft(selectedAircraftForSchedule);
    // Debug removido para produção
    // Exibir horário de partida em fuso do Brasil
    setDepartureTime(formatBrazilTime(slot.start));
    setSelectedDate(slot.start);
    // Ir para o novo fluxo base-destino
    setCurrentView('base-destination-flow');
  };

  const handleBaseDestinationFlowCompleted = (missionData: any) => {
    // Debug removido para produção
    
    // Extrair dados da missão
    setOrigin(missionData.origin);
    setDestination(missionData.destinations[0]?.airport.icao || '');
    // Debug removido para produção
    const formattedReturnDate = format(missionData.returnDate, 'yyyy-MM-dd', { locale: ptBR });
    // Debug removido para produção
    setReturnDate(formattedReturnDate);
    setReturnTime(missionData.returnTime);
    setDistance(missionData.totalFlightTime * 108); // Aproximação: 108 NM/hora
    setFlightHours(missionData.totalFlightTime);
    
    // Definir overnightStays baseado nos dados da missão
    setOvernightStays(missionData.overnightStays || 0);
    
    // Salvar dados da missão para uso posterior
    setMissionData(missionData);
    
    // Ir para a próxima etapa (passageiros)
    setCurrentView('passengers');
  };

  const handlePassengersSubmitted = (passengerList: Array<{name: string, document: string, documentType: 'rg' | 'passport'}>) => {
    // Debug removido para produção
    setPassengers(passengerList);
    setCurrentView('payment');
  };

  const handlePaymentCompleted = () => {
    // Debug removido para produção
    setCurrentView('confirmation');
  };

  // Adicionar handlers para as novas opções do menu
  const handleGoToCreateSharedMission = () => {
    setCurrentView('create-shared-mission');
  };
  const handleGoToSharedMissionsList = () => {
    setCurrentView('shared-missions-list');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {currentView === 'trip-type' && (
          <TripTypeSelection onSelect={handleTripTypeSelection} />
        )}
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-sky-500 mx-auto mb-4" />
            <p className="text-gray-600">Carregando aeronaves...</p>
          </div>
        </div>
      </div>
    );
  }

  if (aircraft.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        {currentView === 'trip-type' && (
          <TripTypeSelection onSelect={handleTripTypeSelection} />
        )}
        {currentView === 'schedule' && (
          <div className="text-center py-8">
            <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma aeronave disponível</h3>
            <p className="text-gray-600">Não há aeronaves disponíveis no momento.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {currentView === 'trip-type' && (
        <TripTypeSelection onSelect={handleTripTypeSelection} />
      )}

      {/* Schedule View - Escolha de Aeronave e Calendário */}
      {currentView === 'schedule' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Escolha a Aeronave</h2>
              <p className="text-sm text-gray-600">Selecione uma aeronave e data disponível</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentView('trip-type')} className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </div>

          {/* Lista de Aeronaves */}
          <Card className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Aeronaves Disponíveis</Label>
              <div className="grid grid-cols-1 gap-3">
                {aircraft.map((aircraftItem) => (
                  <div
                    key={aircraftItem.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedAircraftForSchedule?.id === aircraftItem.id
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-gray-200 hover:border-sky-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleAircraftSelection(aircraftItem)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{aircraftItem.name}</div>
                        <div className="text-xs text-gray-600">{aircraftItem.registration}</div>
                        <div className="text-xs text-gray-500">{aircraftItem.model}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {Number(aircraftItem.max_passengers) || 0} passageiros
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Calendário Inteligente */}
          {selectedAircraftForSchedule && (
            <Card className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Calendário Inteligente</Label>
                <p className="text-xs text-gray-600 mb-4">
                  Visualize a disponibilidade da aeronave e selecione data e horário
                </p>
                <IntelligentTimeSelectionStep
                  title="Selecione o horário de partida"
                  selectedDate={format(selectedDate || new Date(), 'dd')}
                  currentMonth={selectedDate || new Date()}
                  selectedAircraft={selectedAircraftForSchedule}
                  onTimeSelect={(timeSlot) => {
                    // Debug removido para produção
                    
                    if (typeof timeSlot === 'object' && timeSlot.start) {
                      // Exibir horário em fuso do Brasil
                      const timeString = formatBrazilTime(timeSlot.start);
                      setDepartureTime(timeString);
                      handleTimeSlotSelection(timeSlot);
                    } else {
                      const time = timeSlot.toString();
                      setDepartureTime(time);
                      
                      // Criar um TimeSlot para compatibilidade
                      const newTimeSlot: TimeSlot = {
                        start: new Date(`${format(selectedDate || new Date(), 'yyyy-MM-dd')}T${time}:00`),
                        end: new Date(`${format(selectedDate || new Date(), 'yyyy-MM-dd')}T${time}:00`),
                        available: true
                      };
                      handleTimeSlotSelection(newTimeSlot);
                    }
                  }}
                  onBack={() => setSelectedAircraftForSchedule(null)}
                  onAircraftSelect={(aircraft) => setSelectedAircraftForSchedule(aircraft)}
                />
              </div>
            </Card>
          )}

          {/* Resumo da Seleção */}
          {selectedAircraftForSchedule && selectedTimeSlot && (
            <Card className="p-4 bg-sky-50 border-sky-200">
              <div className="space-y-2">
                <div className="font-medium text-sm text-sky-800">Resumo da Seleção</div>
                <div className="text-xs space-y-1">
                  <div><span className="font-medium">Aeronave:</span> {selectedAircraftForSchedule.name}</div>
                  <div><span className="font-medium">Data:</span> {format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}</div>
                  <div><span className="font-medium">Horário:</span> {format(selectedTimeSlot.start, 'HH:mm')} - {format(selectedTimeSlot.end, 'HH:mm')}</div>
                </div>
                <Button 
                  onClick={() => setCurrentView('destination')}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white text-sm"
                >
                  Continuar para Destino
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {currentView === 'shared-flights' && (
        <SharedFlights 
          onBack={() => setCurrentView('trip-type')}
          onSelectFlight={handleSelectSharedFlight}
        />
      )}

      {currentView === 'seat-selection' && selectedSharedFlight && (
        <SharedFlightSeatSelection
          flight={selectedSharedFlight}
          onBack={() => setCurrentView('shared-flights')}
          onSeatSelected={handleSeatSelected}
        />
      )}

      {currentView === 'passenger-info' && selectedSharedFlight && selectedSeat && (
        <SharedFlightPassengerInfo
          flight={selectedSharedFlight}
          selectedSeat={selectedSeat}
          onBack={() => setCurrentView('seat-selection')}
          onPassengerInfoSubmitted={handlePassengerInfoSubmitted}
        />
      )}

      {currentView === 'booking-confirmation' && selectedSharedFlight && selectedSeat && passengerInfo && (
        <SharedFlightBookingConfirmation
          flight={selectedSharedFlight}
          selectedSeat={selectedSeat}
          passengerInfo={passengerInfo}
          onBack={() => setCurrentView('passenger-info')}
          onBookingConfirmed={handleBookingConfirmed}
        />
      )}

      {currentView === 'creation' && selectedAircraft && selectedTimeSlot && (
        <MissionCreation
          aircraft={selectedAircraft}
          initialTimeSlot={selectedTimeSlot}
          onBack={() => setCurrentView('schedule')}
          onMissionCreated={handleMissionCreated}
        />
      )}

      {currentView === 'financial' && missionData && (
        <FinancialVerification
          totalCost={missionData.totalCost}
          userBalance={userBalance}
          userPriority={userPriority}
          onConfirm={handleFinancialConfirm}
          onPaymentOption={handlePaymentOption}
        />
      )}

      {currentView === 'base-destination-flow' && selectedAircraft && (
        <BaseDestinationFlow
          selectedAircraft={selectedAircraft}
          departureDate={selectedDate}
          departureTime={departureTime}
          onFlowCompleted={handleBaseDestinationFlowCompleted}
          onBack={() => setCurrentView('schedule')}
        />
      )}

      {currentView === 'passengers' && selectedAircraft && (
        <div>

          <PassengerDetailsCollection
            maxPassengers={selectedAircraft.max_passengers}
            onPassengersSubmitted={handlePassengersSubmitted}
            onBack={() => setCurrentView('base-destination-flow')}
          />
        </div>
      )}

      {currentView === 'payment' && selectedAircraft && (
        <>

          <PaymentStep
            aircraft={selectedAircraft}
            origin={origin}
            destination={destination}
            departureDate={selectedDate}
            departureTime={departureTime}
            returnDate={returnDate}
            returnTime={returnTime}
            passengers={passengers}
            flightHours={flightHours}
            overnightStays={overnightStays}
            distance={distance}
            airportFees={missionData?.airportFees || 0}
            feeBreakdown={missionData?.feeBreakdown || {}}
            onPaymentCompleted={handlePaymentCompleted}
            onBack={() => setCurrentView('passengers')}
          />
        </>
      )}

      {currentView === 'confirmation' && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Missão Confirmada!</h2>
            <p className="text-gray-600 mb-6">
              Sua missão foi criada e paga com sucesso
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Detalhes da Missão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Aeronave:</span>
                  <div className="font-medium">{selectedAircraft?.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Rota:</span>
                  <div className="font-medium">{origin} → {destination}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Data de Ida:</span>
                  <div className="font-medium">{format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })}</div>
                </div>
                <div>
                  <span className="text-gray-600">Data de Volta:</span>
                  <div className="font-medium">{returnDate ? (() => {
                    // Debug removido para produção
                    const dateWithTime = `${returnDate}T00:00:00`;
                    // Debug removido para produção
                    const dateObj = new Date(dateWithTime);
                    // Debug removido para produção
                    const formatted = format(dateObj, 'dd/MM/yyyy', { locale: ptBR });
                    // Debug removido para produção
                    return formatted;
                  })() : 'N/A'}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Horário de Ida:</span>
                  <div className="font-medium">{departureTime}</div>
                </div>
                <div>
                  <span className="text-gray-600">Horário de Volta:</span>
                  <div className="font-medium">{returnTime}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Horário de Pouso no Destino:</span>
                  <div className="font-medium">
                    {(() => {
                      try {
                        // Calcular horário de pouso no destino
                        // actual_departure_date + (tempo total de voo ÷ 2)
                        const departureDateTime = new Date(selectedDate);
                        departureDateTime.setHours(parseInt(departureTime.split(':')[0]), parseInt(departureTime.split(':')[1]), 0, 0);
                        const flightTimeHours = parseFloat(flightHours || '0');
                        const arrivalTime = new Date(departureDateTime.getTime() + (flightTimeHours / 2) * 60 * 60 * 1000);
                        return format(arrivalTime, 'HH:mm', { locale: ptBR });
                      } catch (error) {
                        console.error('Erro ao calcular horário de pouso no destino:', error);
                        return 'N/A';
                      }
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Horário de Pouso Retorno:</span>
                  <div className="font-medium">
                    {(() => {
                      try {
                        // Calcular horário de pouso retorno
                        // CORRIGIDO: return_date já inclui tempo de voo de volta + 3h de pós-voo
                        if (missionData?.return_date) {
                          const returnDate = new Date(missionData.return_date);
                          return format(returnDate, 'HH:mm', { locale: ptBR });
                        }
                        // Fallback: usar horário de retorno + tempo de voo de volta + 3h (pós-voo)
                        const returnDateToUse = returnDate ? new Date(returnDate + 'T00:00:00') : selectedDate;
                        const returnDateTime = new Date(returnDateToUse);
                        returnDateTime.setHours(parseInt(returnTime.split(':')[0]), parseInt(returnTime.split(':')[1]), 0, 0);
                        const flightTimeHours = parseFloat(flightHours || '0');
                        const returnArrivalTime = new Date(returnDateTime.getTime() + (flightTimeHours / 2) * 60 * 60 * 1000 + (3 * 60 * 60 * 1000)); // + 3h pós-voo
                        return format(returnArrivalTime, 'HH:mm', { locale: ptBR });
                      } catch (error) {
                        console.error('Erro ao calcular horário de pouso retorno:', error);
                        return 'N/A';
                      }
                    })()}
                  </div>
                </div>
              </div>
              
              <div>
                <span className="text-gray-600">Passageiros:</span>
                <div className="font-medium">{passengers.length} pessoa(s)</div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <Button onClick={resetFlow} className="bg-sky-500 hover:bg-sky-600 text-white">
              Nova Missão
            </Button>
          </div>
        </div>
      )}

      {currentView === 'shared-booking-confirmation' && selectedSharedFlight && selectedSeat && passengerInfo && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reserva Confirmada!</h2>
            <p className="text-gray-600 mb-6">
              Sua poltrona foi reservada com sucesso no voo compartilhado
            </p>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Detalhes da Reserva</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Aeronave:</span>
                  <div className="font-medium">{selectedSharedFlight.aircraft}</div>
                </div>
                <div>
                  <span className="text-gray-600">Poltrona:</span>
                  <div className="font-medium">{selectedSeat}</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Rota:</span>
                  <span className="font-medium">{selectedSharedFlight.origin} → {selectedSharedFlight.destination}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {format(selectedSharedFlight.departure, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="text-gray-600 mb-2">Passageiro:</div>
                <div className="font-medium">{passengerInfo.name}</div>
                <div className="text-sm text-gray-500">{passengerInfo.email}</div>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-center">
            <Button onClick={resetFlow} className="bg-sky-500 hover:bg-sky-600 text-white">
              Voltar ao Início
            </Button>
          </div>
        </div>
      )}

      {currentView === 'shared-confirmation' && missionData && (
        <SharedMissionConfirmation
          missionData={missionData}
          onFinish={resetFlow}
        />
      )}

      {currentView === 'shared-missions-list' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-lg md:text-xl font-bold text-gray-900">Missões Compartilhadas</h1>
              <p className="text-xs md:text-sm text-gray-600 mt-1">Participar de missões compartilhadas</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setCurrentView('trip-type')} variant="outline" className="text-xs h-8">
                Voltar
              </Button>
            </div>
          </div>
          <SharedMissionsList 
            onBookMission={handleBookSharedMission} 
            pendingNavigation={pendingNavigation}
          />
        </div>
      )}
    </div>
  );
};

export default MissionSystem;
