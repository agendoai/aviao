import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plane, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachHourOfInterval, parseISO, isBefore, isAfter, addHours, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { convertUTCToBrazilianTime } from '@/utils/dateUtils';
import { getBookings, getAircrafts, getTimeSlots } from '@/utils/api';
import { toast } from 'sonner';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  status: string;
}

interface Booking {
  id: number;
  aircraftId: number;
  departure_date: string;
  return_date: string;
  blocked_until: string;
  status: string;
  origin: string;
  destination: string;
  user: {
    name: string;
  };
}

interface TimeSlot {
  start: Date;
  end: Date;
  status: 'available' | 'booked' | 'blocked' | 'invalid';
  booking?: Booking;
  reason?: string;
  nextAvailable?: Date;
}

interface IntelligentMissionCalendarProps {
  selectedAircraft?: Aircraft;
  onTimeSlotSelect: (start: Date, end: Date) => void;
  onAircraftSelect: (aircraft: Aircraft) => void;
}

const IntelligentMissionCalendar: React.FC<IntelligentMissionCalendarProps> = ({
  selectedAircraft,
  onTimeSlotSelect,
  onAircraftSelect
}) => {
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentWeek, setCurrentWeek] = useState(() => {
    // SEMPRE usar a data atual real
    const today = new Date();
    console.log('📅 IntelligentMissionCalendar - Data atual real:', today.toLocaleDateString('pt-BR'));
    
    // INICIAR NA SEMANA ATUAL, mas com auto-scroll para o dia atual
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    console.log('📅 IntelligentMissionCalendar - Iniciando na semana atual:', currentWeekStart.toLocaleDateString('pt-BR'));
    
    return currentWeekStart;
  });
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<TimeSlot | null>(null);

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [aircraftsData, bookingsData] = await Promise.all([
          getAircrafts(),
          getBookings()
        ]);
        
        setAircrafts(aircraftsData);
        setBookings(bookingsData);
        
        // Selecionar primeira aeronave disponível se nenhuma estiver selecionada
        if (!selectedAircraft && aircraftsData.length > 0) {
          const availableAircraft = aircraftsData.find(a => a.status === 'available');
          if (availableAircraft) {
            onAircraftSelect(availableAircraft);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados do calendário');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Buscar slots de tempo do backend
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedAircraft) return;

      try {
        setLoadingSlots(true);
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
        const slots = await getTimeSlots(selectedAircraft.id, weekStart.toISOString(), undefined, undefined, undefined, false);
        setTimeSlots(slots);
      } catch (error) {
        console.error('Erro ao buscar slots de tempo:', error);
        toast.error('Erro ao carregar calendário');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchTimeSlots();
  }, [selectedAircraft, currentWeek]);

  // Navegar entre semanas
  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => addDays(prev, direction === 'next' ? 7 : -7));
  };

  // Lidar com clique em slot
  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status === 'available') {
      setSelectedSlot(slot);
      onTimeSlotSelect(slot.start, slot.end);
    } else {
      // Mostrar mensagem de erro
      let message = 'Horário indisponível';
      if (slot.nextAvailable) {
        message += `. Próxima disponibilidade: ${format(slot.nextAvailable, 'dd/MM às HH:mm', { locale: ptBR })}`;
      }
      toast.error(message);
    }
  };

  // Obter cor do slot baseado no status
  const getSlotColor = (status: TimeSlot['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 border-green-300 hover:bg-green-200 cursor-pointer';
      case 'booked':
        return 'bg-gray-200 border-gray-400 cursor-not-allowed';
      case 'blocked':
        return 'bg-red-100 border-red-300 cursor-not-allowed';
      case 'invalid':
        return 'bg-red-200 border-red-400 cursor-not-allowed';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // Obter ícone do slot
  const getSlotIcon = (status: TimeSlot['status']) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'booked':
        return <Plane className="h-4 w-4 text-gray-600" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-700" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading || loadingSlots) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600">Carregando calendário inteligente...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-sky-600" />
              <span>Calendário Inteligente de Missões</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Seletor de Aeronave */}
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Aeronave:
              </label>
              <div className="flex flex-wrap gap-2">
                {aircrafts.map(aircraft => (
                  <Button
                    key={aircraft.id}
                    variant={selectedAircraft?.id === aircraft.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => onAircraftSelect(aircraft)}
                    disabled={aircraft.status !== 'available'}
                    className="flex items-center space-x-2"
                  >
                    <Plane className="h-4 w-4" />
                    <span>{aircraft.registration}</span>
                    {aircraft.status !== 'available' && (
                      <Badge variant="secondary" className="text-xs">
                        {aircraft.status}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>

            {/* Navegação da Semana */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('prev')}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Semana Anterior
              </Button>
              
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  {format(currentWeek, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <p className="text-sm text-gray-600">
                  Semana de {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd/MM', { locale: ptBR })} a{' '}
                  {format(endOfWeek(currentWeek, { weekStartsOn: 1 }), 'dd/MM', { locale: ptBR })}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateWeek('next')}
              >
                Próxima Semana
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calendário */}
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Cabeçalho dos dias */}
                <div className="grid grid-cols-8 gap-1 mb-2">
                  <div className="h-8"></div> {/* Espaço vazio para horários */}
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), i);
                    return (
                      <div key={i} className="text-center text-sm font-medium text-gray-700 p-2 bg-gray-50 rounded">
                        <div>{format(day, 'EEE', { locale: ptBR })}</div>
                        <div className="text-xs text-gray-500">{format(day, 'dd/MM')}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Slots de tempo */}
                {Array.from({ length: 13 }, (_, hourIndex) => {
                  const hour = hourIndex + 6; // 6h às 18h
                  return (
                    <div key={hour} className="grid grid-cols-8 gap-1 mb-1">
                      {/* Horário */}
                      <div className="text-right text-sm text-gray-600 p-2 pr-3 flex items-center justify-end">
                        {format(new Date().setHours(hour), 'HH:mm')}
                      </div>

                      {/* Slots para cada dia */}
                      {Array.from({ length: 7 }, (_, dayIndex) => {
                        const slot = timeSlots.find(s => 
                          s.start.getHours() === hour && 
                          s.start.getDate() === addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), dayIndex).getDate()
                        );

                        if (!slot) return <div key={dayIndex} className="h-10"></div>;

                        return (
                          <Tooltip key={dayIndex}>
                            <TooltipTrigger asChild>
                              <div
                                className={`h-10 border rounded-md flex items-center justify-center transition-colors ${getSlotColor(slot.status)}`}
                                onClick={() => handleSlotClick(slot)}
                                onMouseEnter={() => setHoveredSlot(slot)}
                                onMouseLeave={() => setHoveredSlot(null)}
                              >
                                {getSlotIcon(slot.status)}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {format(slot.start, 'dd/MM às HH:mm', { locale: ptBR })}
                                </div>
                                <div className="text-sm">
                                  {slot.status === 'available' ? (
                                    <span className="text-green-600">✅ Disponível para agendamento</span>
                                  ) : (
                                    <span className="text-red-600">{slot.reason}</span>
                                  )}
                                </div>
                                {slot.nextAvailable && slot.status !== 'available' && (
                                  <div className="text-xs text-blue-600">
                                    ⏰ Próxima disponibilidade: {format(slot.nextAvailable, 'dd/MM às HH:mm', { locale: ptBR })}
                                  </div>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legenda */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Disponível</span>
              </div>
              <div className="flex items-center space-x-2">
                <Plane className="h-4 w-4 text-gray-600" />
                <span>Missão em andamento</span>
              </div>
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span>Bloqueado (preparação/encerramento)</span>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-700" />
                <span>Indisponível</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações da Aeronave Selecionada */}
        {selectedAircraft && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{selectedAircraft.registration}</h4>
                  <p className="text-sm text-gray-600">{selectedAircraft.model}</p>
                </div>
                <Badge variant={selectedAircraft.status === 'available' ? 'default' : 'secondary'}>
                  {selectedAircraft.status === 'available' ? 'Disponível' : selectedAircraft.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default IntelligentMissionCalendar;
