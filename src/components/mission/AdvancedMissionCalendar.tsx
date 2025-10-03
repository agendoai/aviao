import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronLeft, ChevronRight, Calendar, Clock, Plane, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay, isSameWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getTimeSlots } from '@/utils/api';
import { buildApiUrl } from '@/config/api';
import { convertWeekStartToBrazilianTimezone, convertUTCToBrazilianTime } from '@/utils/dateUtils';
import { toast } from '@/hooks/use-toast';

interface TimeSlot {
  start: Date;
  end: Date;
  status: 'available' | 'booked' | 'blocked' | 'invalid' | 'selected' | 'conflict';
  booking?: any;
  reason?: string;
  nextAvailable?: Date;
  blockType?: 'maintenance' | 'mission' | 'preparation' | 'closure';
}

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  status: string;
}

interface AdvancedMissionCalendarProps {
  aircraftId?: number;
  onTimeSelect?: (startTime: Date, endTime: Date) => void;
  onMissionSummary?: (summary: MissionSummary) => void;
  selectedStart?: Date;
  selectedEnd?: Date;
  missionDuration?: number; // em horas
  className?: string;
}

interface MissionSummary {
  startTime: Date;
  endTime: Date;
  duration: number;
  preparationStart: Date;
  closureEnd: Date;
  nextAvailable: Date;
  isValid: boolean;
  conflicts?: string[];
}

const AdvancedMissionCalendar: React.FC<AdvancedMissionCalendarProps> = ({
  aircraftId,
  onTimeSelect,
  onMissionSummary,
  selectedStart,
  selectedEnd,
  missionDuration = 2,
  className = ''
}) => {
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Iniciar na semana atual, começando na segunda-feira
    const today = new Date();
    return startOfWeek(today, { weekStartsOn: 1 });
  });
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Carregar aeronaves
  useEffect(() => {
    const fetchAircrafts = async () => {
      try {
        const response = await fetch(buildApiUrl('/api/aircrafts'));
        if (response.ok) {
          const data = await response.json();
          setAircrafts(data);
          
          // Selecionar aeronave específica ou primeira disponível
          if (aircraftId) {
            const aircraft = data.find((a: Aircraft) => a.id === aircraftId);
            setSelectedAircraft(aircraft || data[0]);
          } else {
            const available = data.find((a: Aircraft) => a.status === 'available');
            setSelectedAircraft(available || data[0]);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar aeronaves:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar as aeronaves",
          variant: "destructive"
        });
      }
    };

    fetchAircrafts();
  }, [aircraftId]);

  // Carregar slots de tempo
  useEffect(() => {
    if (!selectedAircraft) return;

    // Limpar estados de drag ao carregar novos slots
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);

    const fetchTimeSlots = async () => {
      setLoading(true);
      try {
        // Converter currentWeek para timezone brasileiro antes de enviar para o backend
        const currentWeekBrazilian = convertWeekStartToBrazilianTimezone(currentWeek);
        const slots = await getTimeSlots(
          selectedAircraft.id,
          currentWeekBrazilian,
          selectedStart?.toISOString(),
          selectedEnd?.toISOString(),
          undefined,
          false
        );
        
        // Converter strings para Date objects
        const convertedSlots = slots.map((slot: any) => ({
          ...slot,
            start: convertUTCToBrazilianTime(slot.start),
            end: convertUTCToBrazilianTime(slot.end),
          nextAvailable: slot.nextAvailable ? new Date(slot.nextAvailable) : undefined
        }));
        
        setTimeSlots(convertedSlots);
      } catch (error) {
        console.error('Erro ao carregar slots:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os horários",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTimeSlots();
  }, [selectedAircraft, currentWeek, selectedStart, selectedEnd]);

  // Navegação de semanas
  const goToPreviousWeek = () => {
    // Limpar estados de drag ao navegar
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setCurrentWeek(subWeeks(currentWeek, 1));
  };
  
  const goToNextWeek = () => {
    // Limpar estados de drag ao navegar
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  // Gerar dias da semana
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(currentWeek, i));
    }
    return days;
  }, [currentWeek]);

  // Obter cor do slot baseado no status
  const getSlotColor = (slot: TimeSlot) => {
    if (isDragging && dragStart && dragEnd) {
      // Corrigir lógica para seleção entre dias
      const selectionStart = dragStart < dragEnd ? dragStart : dragEnd;
      const selectionEnd = dragStart < dragEnd ? dragEnd : dragStart;
      
      // Um slot está na seleção se há sobreposição entre o slot e a seleção
      const isInSelection = slot.start < selectionEnd && slot.end > selectionStart;
      
      if (isInSelection) {
        return slot.status === 'available' ? 'bg-yellow-200 border-yellow-400' : 'bg-red-200 border-red-400';
      }
    }

    switch (slot.status) {
      case 'available':
        return 'bg-green-100 border-green-300 hover:bg-green-200';
      case 'booked':
        return 'bg-gray-300 border-gray-500 cursor-not-allowed';
      case 'blocked':
        return 'bg-gray-200 border-gray-400 cursor-not-allowed';
      case 'selected':
        return 'bg-blue-200 border-blue-400';
      case 'conflict':
        return 'bg-red-200 border-red-400';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  // Obter ícone do slot
  const getSlotIcon = (slot: TimeSlot) => {
    if (slot.status === 'selected') return <CheckCircle className="w-4 h-4 text-blue-600" />;
    if (slot.status === 'conflict') return <XCircle className="w-4 h-4 text-red-600" />;
    if (slot.status === 'booked') return <Plane className="w-4 h-4 text-gray-600" />;
    if (slot.status === 'blocked') return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    return null;
  };

  // Obter tooltip do slot
  const getSlotTooltip = (slot: TimeSlot) => {
    if (slot.status === 'available') {
      return `Disponível: ${format(slot.start, 'HH:mm')} - ${format(slot.end, 'HH:mm')}`;
    }
    
    if (slot.status === 'booked' && slot.booking) {
      return `Missão: ${slot.booking.origin} → ${slot.booking.destination}
Partida: ${format(new Date(slot.booking.departure_date), 'dd/MM HH:mm')}
Retorno: ${format(new Date(slot.booking.return_date), 'dd/MM HH:mm')}
Status: ${slot.booking.status}`;
    }
    
    if (slot.status === 'blocked') {
      let reason = slot.reason || 'Bloqueado';
      if (slot.nextAvailable) {
        reason += `\nPróxima disponibilidade: ${format(slot.nextAvailable, 'dd/MM HH:mm')}`;
      }
      return reason;
    }
    
    return slot.reason || 'Indisponível';
  };

  // Manipular clique no slot
  const handleSlotClick = (slot: TimeSlot) => {
    if (slot.status !== 'available') {
      toast({
        title: "Horário Indisponível",
        description: slot.reason || "Este horário não está disponível",
        variant: "destructive"
      });
      return;
    }

    const startTime = slot.start;
    const endTime = new Date(startTime.getTime() + missionDuration * 60 * 60 * 1000);
    
    if (onTimeSelect) {
      onTimeSelect(startTime, endTime);
    }
  };

  // Manipular início do drag
  const handleDragStart = (slot: TimeSlot) => {
    if (slot.status !== 'available') return;
    
    setDragStart(slot.start);
    setIsDragging(true);
  };

  // Manipular drag over
  const handleDragOver = (slot: TimeSlot) => {
    if (!isDragging || !dragStart) return;
    
    setDragEnd(slot.end);
  };

  // Manipular fim do drag
  const handleDragEnd = () => {
    if (!isDragging || !dragStart || !dragEnd) {
      setIsDragging(false);
      setDragStart(null);
      setDragEnd(null);
      return;
    }

    // Verificar se a seleção é válida
    const startTime = dragStart;
    const endTime = dragEnd;
    const duration = (endTime.getTime() - startTime.getTime()) / (60 * 60 * 1000);

    if (duration < missionDuration) {
      toast({
        title: "Seleção Inválida",
        description: `A missão precisa ter pelo menos ${missionDuration} horas`,
        variant: "destructive"
      });
    } else {
      if (onTimeSelect) {
        onTimeSelect(startTime, endTime);
      }
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Calcular resumo da missão
  useEffect(() => {
    if (!selectedStart || !selectedEnd || !onMissionSummary) return;

    const preparationStart = new Date(selectedStart.getTime() - 3 * 60 * 60 * 1000);
    const closureEnd = new Date(selectedEnd.getTime() + 3 * 60 * 60 * 1000);
    const duration = (selectedEnd.getTime() - selectedStart.getTime()) / (60 * 60 * 1000);

    // Verificar conflitos
    const conflicts: string[] = [];
    timeSlots.forEach(slot => {
      if (slot.status !== 'available' && 
          slot.start < selectedEnd && 
          slot.end > selectedStart) {
        conflicts.push(slot.reason || 'Conflito detectado');
      }
    });

    const summary: MissionSummary = {
      startTime: selectedStart,
      endTime: selectedEnd,
      duration,
      preparationStart,
      closureEnd,
      nextAvailable: closureEnd,
      isValid: conflicts.length === 0,
      conflicts
    };

    onMissionSummary(summary);
  }, [selectedStart, selectedEnd, timeSlots, onMissionSummary]);

  if (!selectedAircraft) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            Carregando aeronaves...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendário Inteligente - {selectedAircraft.registration}
          </CardTitle>
          
          {/* Navegação */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
              Semana Anterior
            </Button>
            
            <span className="text-sm font-medium">
              {format(currentWeek, 'dd/MM/yyyy', { locale: ptBR })} - {format(addDays(currentWeek, 6), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
            
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Próxima Semana
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span>Disponível</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-300 border border-gray-500 rounded"></div>
              <span>Missão</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-gray-200 border border-gray-400 rounded"></div>
              <span>Bloqueado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-200 border border-blue-400 rounded"></div>
              <span>Selecionado</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-200 border border-red-400 rounded"></div>
              <span>Conflito</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando horários...</p>
            </div>
          ) : (
            <div className="grid grid-cols-49 gap-1">
              {/* Cabeçalho com horas */}
              <div className="p-2"></div>
              {Array.from({ length: 48 }, (_, slotIndex) => {
                const hour = Math.floor(slotIndex / 2);
                const minute = (slotIndex % 2) * 30;
                return (
                  <div key={slotIndex} className="p-1 text-xs text-center text-gray-600 font-medium">
                    {minute === 0 ? `${hour.toString().padStart(2, '0')}h` : ''}
                  </div>
                );
              })}

              {/* Dias da semana */}
              {weekDays.map((day, dayIndex) => (
                <React.Fragment key={dayIndex}>
                  {/* Nome do dia */}
                  <div className="p-2 text-sm font-medium text-center border-b">
                    <div>{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className="text-xs text-gray-500">{format(day, 'dd/MM')}</div>
                  </div>

                  {/* Slots de 30 minutos */}
                  {Array.from({ length: 48 }, (_, slotIndex) => {
                    const hour = Math.floor(slotIndex / 2);
                    const minute = (slotIndex % 2) * 30;
                    
                    const slot = timeSlots.find(s => 
                      isSameDay(s.start, day) && 
                      s.start.getHours() === hour && 
                      s.start.getMinutes() === minute
                    );

                    if (!slot) return <div key={slotIndex} className="p-1 min-h-[20px]"></div>;

                    return (
                      <Tooltip key={slotIndex}>
                        <TooltipTrigger asChild>
                          <div
                            className={`p-1 min-h-[20px] border rounded cursor-pointer transition-colors ${getSlotColor(slot)}`}
                            onClick={() => handleSlotClick(slot)}
                            onMouseDown={() => handleDragStart(slot)}
                            onMouseEnter={() => handleDragOver(slot)}
                            onMouseUp={handleDragEnd}
                          >
                            <div className="flex items-center justify-center h-full">
                              {getSlotIcon(slot)}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <div className="text-xs whitespace-pre-line">
                            {getSlotTooltip(slot)}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Informações da missão selecionada */}
          {selectedStart && selectedEnd && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Missão Selecionada</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Partida: {format(selectedStart, 'dd/MM/yyyy HH:mm')}</div>
                <div>Retorno: {format(selectedEnd, 'dd/MM/yyyy HH:mm')}</div>
                <div>Duração: {((selectedEnd.getTime() - selectedStart.getTime()) / (60 * 60 * 1000)).toFixed(1)} horas</div>
                <div>Preparação: {format(new Date(selectedStart.getTime() - 3 * 60 * 60 * 1000), 'dd/MM/yyyy HH:mm')}</div>
                <div>Encerramento: {format(new Date(selectedEnd.getTime() + 3 * 60 * 60 * 1000), 'dd/MM/yyyy HH:mm')}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default AdvancedMissionCalendar;
