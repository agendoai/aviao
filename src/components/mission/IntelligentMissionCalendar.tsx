import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, addDays, startOfWeek, endOfWeek, eachHourOfInterval, parseISO, isBefore, isAfter, addHours, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { convertUTCToBrazilianTime, convertWeekStartToBrazilianTimezone } from '@/utils/dateUtils';
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
  onTimeSlotSelect: (start: Date, end: Date, departureSecondaryTime?: Date, departureFromSecondaryTime?: Date, hasSecondaryDestination?: boolean) => void;
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
  
  // Estados para destino secundário
  const [hasSecondaryDestination, setHasSecondaryDestination] = useState(false);
  const [departureSecondaryTime, setDepartureSecondaryTime] = useState<Date | null>(null);
  const [departureFromSecondaryTime, setDepartureFromSecondaryTime] = useState<Date | null>(null);
  const [selectionStep, setSelectionStep] = useState<'primary' | 'secondary' | 'return'>('primary');

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
        // Usar a função para converter para timezone brasileiro antes de enviar para o backend
        const weekStartBrazilian = convertWeekStartToBrazilianTimezone(weekStart);
        const slots = await getTimeSlots(selectedAircraft.id, weekStartBrazilian, undefined, undefined, undefined, false);
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

  // Estado para controlar o modal de seleção de horário secundário
  const [isSecondaryTimeModalOpen, setIsSecondaryTimeModalOpen] = useState(false);
  const [selectedSecondaryTime, setSelectedSecondaryTime] = useState<string>('');
  const [selectedSecondaryDate, setSelectedSecondaryDate] = useState<string>('');
  
  // Lidar com clique em slot
  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status === 'available') {
      // Lógica baseada no passo atual de seleção
      if (selectionStep === 'primary') {
        // Seleção do horário principal (Base → Destino Principal)
        setSelectedSlot(slot);
        
        if (hasSecondaryDestination) {
          // Se tem destino secundário, abrir modal para seleção do horário secundário
          // Configurar data padrão como a data de chegada ao destino principal
          const defaultDate = format(slot.end, 'yyyy-MM-dd', { locale: ptBR });
          // Configurar hora padrão como a hora de chegada ao destino principal + 1 hora
          const defaultTime = format(addHours(slot.end, 1), 'HH:mm', { locale: ptBR });
          
          setSelectedSecondaryDate(defaultDate);
          setSelectedSecondaryTime(defaultTime);
          setIsSecondaryTimeModalOpen(true);
          toast.success(`Horário de partida selecionado: ${format(slot.start, 'dd/MM às HH:mm', { locale: ptBR })}`);
        } else {
          // Se não tem destino secundário, finaliza a seleção
          onTimeSlotSelect(slot.start, slot.end, null, null, false);
        }
      } else if (selectionStep === 'return') {
        // Seleção do horário de retorno (Destino Secundário → Base)
        if (slot.start < departureSecondaryTime!) {
          toast.error('O horário de saída do destino secundário deve ser após a chegada');
          return;
        }
        
        setDepartureFromSecondaryTime(slot.start);
        
        // Finaliza a seleção com todos os horários
        onTimeSlotSelect(
          selectedSlot!.start, 
          selectedSlot!.end, 
          departureSecondaryTime, 
          slot.start, 
          true
        );
        
        // Reseta o passo para uma nova seleção
        setSelectionStep('primary');
        toast.success('Todos os horários da missão foram selecionados!');
      }
    } else {
      // Buscar próximos horários disponíveis
      const slotsDisponiveis = timeSlots.filter(s => s.status === 'available');
      const proximosHorarios = slotsDisponiveis.slice(0, 3).map(s => s.start);
      
      let message = '⛔ Horário indisponível!';
      if (proximosHorarios.length > 0) {
        const sugestoes = proximosHorarios.map(h => format(h, 'HH:mm', { locale: ptBR })).join(', ');
        message += ` 💡 Sugestões: ${sugestoes}`;
      } else if (slot.nextAvailable) {
        message += ` 💡 Próxima disponibilidade: ${format(slot.nextAvailable, 'dd/MM às HH:mm', { locale: ptBR })}`;
      }
      toast.error(message);
    }
  };
  
  // Resetar seleção quando o toggle de destino secundário muda
  const handleSecondaryDestinationToggle = (enabled: boolean) => {
    setHasSecondaryDestination(enabled);
    setSelectionStep('primary');
    setDepartureSecondaryTime(null);
    setDepartureFromSecondaryTime(null);
    setSelectedSlot(null);
    
    if (enabled) {
      toast.info('Destino secundário ativado. Selecione os horários em sequência.');
    } else {
      toast.info('Destino secundário desativado. Selecione apenas o horário principal.');
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

  // Função para confirmar o horário secundário selecionado no modal
  const handleConfirmSecondaryTime = () => {
    if (!selectedSecondaryTime || !selectedSecondaryDate) {
      toast.error('Por favor, selecione um horário válido');
      return;
    }
    
    // Criar um objeto Date a partir da data e hora selecionadas
    const [hours, minutes] = selectedSecondaryTime.split(':').map(Number);
    const secondaryDateTime = new Date(selectedSecondaryDate);
    secondaryDateTime.setHours(hours, minutes);
    
    // Validar se o horário é após a chegada ao destino principal
    if (secondaryDateTime < selectedSlot!.end) {
      toast.error('O horário de saída do destino principal deve ser após a chegada');
      return;
    }
    
    // Definir o horário de partida para o destino secundário
    setDepartureSecondaryTime(secondaryDateTime);
    setIsSecondaryTimeModalOpen(false);
    setSelectionStep('return');
    
    toast.success(`Horário para destino secundário: ${format(secondaryDateTime, 'dd/MM às HH:mm', { locale: ptBR })}`);
    toast.info('Agora selecione o horário de partida do destino secundário para a base', {
      duration: 5000,
      icon: <ArrowRight className="h-4 w-4" />
    });
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Modal para seleção do horário de decolagem do destino principal para o secundário */}
        <Dialog open={isSecondaryTimeModalOpen} onOpenChange={setIsSecondaryTimeModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Horário de Decolagem para Segundo Destino</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="secondary-date">Data de Decolagem</Label>
                <Input
                  id="secondary-date"
                  type="date"
                  value={selectedSecondaryDate}
                  onChange={(e) => setSelectedSecondaryDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-time">Horário de Decolagem</Label>
                <Input
                  id="secondary-time"
                  type="time"
                  value={selectedSecondaryTime}
                  onChange={(e) => setSelectedSecondaryTime(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSecondaryTimeModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleConfirmSecondaryTime}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            
            {/* Toggle para Destino Secundário */}
            <div className="flex items-center space-x-2 mb-4 pb-4 border-b">
              <Switch 
                id="secondary-destination" 
                checked={hasSecondaryDestination}
                onCheckedChange={handleSecondaryDestinationToggle}
              />
              <Label htmlFor="secondary-destination" className="text-sm font-medium cursor-pointer">
                Adicionar segundo destino
              </Label>
              {hasSecondaryDestination && (
                <Badge variant="outline" className="ml-2">
                  Ativado
                </Badge>
              )}
            </div>
            
            {/* Indicador de Etapa de Seleção */}
            {hasSecondaryDestination && (
              <div className="mb-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Etapas de Seleção:</h4>
                <div className="flex items-center text-xs text-blue-700 space-x-2">
                  <Badge variant={selectionStep === 'primary' ? "default" : "outline"} className="text-xs">
                    1. Base → Primeiro Destino
                  </Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant={selectionStep === 'secondary' ? "default" : "outline"} className="text-xs">
                    2. Primeiro → Segundo
                  </Badge>
                  <ArrowRight className="h-3 w-3" />
                  <Badge variant={selectionStep === 'return' ? "default" : "outline"} className="text-xs">
                    3. Segundo → Base
                  </Badge>
                </div>
              </div>
            )}

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
                {Array.from({ length: 24 }, (_, hourIndex) => {
                  const hour = hourIndex; // 0h às 23h
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
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
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
              {hasSecondaryDestination && (
                <>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-blue-500">1</Badge>
                    <span>Base → Principal</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-purple-500">2</Badge>
                    <span>Primeiro → Segundo</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-indigo-500">3</Badge>
                    <span>Segundo → Base</span>
                  </div>
                </>
              )}
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
        
        {/* Visualização da Timeline da Missão */}
        {selectedSlot && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-sky-600" />
                <span>Timeline da Missão</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Etapa 1: Pré-voo */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 text-xs font-medium text-gray-500">Pré-voo</div>
                  <div className="flex-1 h-8 bg-red-100 rounded-md flex items-center justify-center text-xs text-red-700 border border-red-200">
                    {format(selectedSlot.start, 'HH:mm', { locale: ptBR })} - {format(addHours(selectedSlot.start, 3), 'HH:mm', { locale: ptBR })}
                  </div>
                </div>
                
                {/* Etapa 2: Base → Primeiro Destino */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 text-xs font-medium text-gray-500">Base → Primeiro</div>
                  <div className="flex-1 h-8 bg-blue-100 rounded-md flex items-center justify-center text-xs text-blue-700 border border-blue-200">
                    <Badge className="bg-blue-500 mr-2">1</Badge>
                    {format(addHours(selectedSlot.start, 3), 'HH:mm', { locale: ptBR })} - {format(selectedSlot.end, 'HH:mm', { locale: ptBR })}
                  </div>
                </div>
                
                {/* Etapas adicionais para destino secundário */}
                {hasSecondaryDestination && departureSecondaryTime && (
                  <div className="flex items-center space-x-2">
                    <div className="w-16 text-xs font-medium text-gray-500">Primeiro → Segundo</div>
                    <div className="flex-1 h-8 bg-purple-100 rounded-md flex items-center justify-center text-xs text-purple-700 border border-purple-200">
                      <Badge className="bg-purple-500 mr-2">2</Badge>
                      {format(departureSecondaryTime, 'HH:mm', { locale: ptBR })} - {departureFromSecondaryTime ? format(departureFromSecondaryTime, 'HH:mm', { locale: ptBR }) : '...'}
                    </div>
                  </div>
                )}
                
                {hasSecondaryDestination && departureFromSecondaryTime && (
                  <div className="flex items-center space-x-2">
                    <div className="w-16 text-xs font-medium text-gray-500">Segundo → Base</div>
                    <div className="flex-1 h-8 bg-indigo-100 rounded-md flex items-center justify-center text-xs text-indigo-700 border border-indigo-200">
                      <Badge className="bg-indigo-500 mr-2">3</Badge>
                      {format(departureFromSecondaryTime, 'HH:mm', { locale: ptBR })} - {format(addHours(departureFromSecondaryTime, 3), 'HH:mm', { locale: ptBR })}
                    </div>
                  </div>
                )}
                
                {/* Etapa final: Pós-voo */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 text-xs font-medium text-gray-500">Pós-voo</div>
                  <div className="flex-1 h-8 bg-red-100 rounded-md flex items-center justify-center text-xs text-red-700 border border-red-200">
                    {hasSecondaryDestination && departureFromSecondaryTime ? (
                      <>
                        {format(addHours(departureFromSecondaryTime, 3), 'HH:mm', { locale: ptBR })} - {format(addHours(departureFromSecondaryTime, 6), 'HH:mm', { locale: ptBR })}
                      </>
                    ) : (
                      <>
                        {format(selectedSlot.end, 'HH:mm', { locale: ptBR })} - {format(addHours(selectedSlot.end, 3), 'HH:mm', { locale: ptBR })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default IntelligentMissionCalendar;
