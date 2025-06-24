import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { MapPin, Plus, X, ArrowRight, Clock, Moon, AlertTriangle, Plane, Calculator, Calendar as CalendarIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RouteStop {
  id: string;
  destination: string;
  arrivalTime: string;
  departureTime: string;
  stayDuration: number;
}

interface RouteBuilderProps {
  baseLocation: string;
  onRouteChange: (route: RouteStop[]) => void;
  onCostCalculation: (costs: any) => void;
  onTimingChange?: (timing: { 
    departureFromBase: string; 
    returnToBase: string; 
    returnDate: string;
    flightDate: string;
    hasOvernight: boolean; 
    overnightCount: number; 
    calculatedReturnTime: string; 
    calculatedReturnDate: string;
    desiredReturnTime: string;
    desiredReturnDate: string;
  }) => void;
  selectedAircraftId?: string;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({
  baseLocation = "Araçatuba (ABC)",
  onRouteChange,
  onCostCalculation,
  onTimingChange,
  selectedAircraftId
}) => {
  const { toast } = useToast();
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [newDestination, setNewDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  
  // Controles de horários da missão
  const [departureFromBase, setDepartureFromBase] = useState('08:00');
  const [desiredReturnTime, setDesiredReturnTime] = useState('18:00');
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split('T')[0]);
  const [desiredReturnDate, setDesiredReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [useCalculatedReturn, setUseCalculatedReturn] = useState(true);

  // Estados para o calendário simplificado
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [showTimeConfiguration, setShowTimeConfiguration] = useState(false);

  useEffect(() => {
    calculateTimingAndNotify();
  }, [departureFromBase, desiredReturnTime, desiredReturnDate, flightDate, route, useCalculatedReturn]);

  useEffect(() => {
    if (selectedAircraftId) {
      fetchOccupiedDates();
    }
  }, [selectedAircraftId]);

  const fetchOccupiedDates = async () => {
    if (!selectedAircraftId) return;
    
    setIsLoadingDates(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('departure_date, return_date')
        .eq('aircraft_id', selectedAircraftId)
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;

      const dates: Date[] = [];
      if (data) {
        data.forEach(booking => {
          const start = new Date(booking.departure_date);
          const end = new Date(booking.return_date);
          
          for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
            dates.push(new Date(date));
          }
        });
      }
      
      setOccupiedDates(dates);
    } catch (error) {
      console.error('Erro ao buscar datas ocupadas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar disponibilidade da aeronave.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingDates(false);
    }
  };

  const isDateOccupied = (date: Date) => {
    return occupiedDates.some(occupiedDate => 
      occupiedDate.toDateString() === date.toDateString()
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    // Verificar se a data está ocupada
    if (isDateOccupied(date)) {
      toast({
        title: "Data Indisponível",
        description: "Esta data já possui reserva confirmada para a aeronave selecionada.",
        variant: "destructive"
      });
      return;
    }

    // Verificar se é data passada
    if (date < new Date()) {
      toast({
        title: "Data Inválida",
        description: "Não é possível selecionar datas passadas.",
        variant: "destructive"
      });
      return;
    }

    setSelectedDate(date);
    setFlightDate(date.toISOString().split('T')[0]);
    setDesiredReturnDate(date.toISOString().split('T')[0]);
    setShowTimeConfiguration(true);

    toast({
      title: "Data Selecionada",
      description: `${date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} selecionada com sucesso!`,
      variant: "default"
    });
  };

  const calculateReturnTimeToBase = (): { time: string; date: string } => {
    if (route.length === 0) return { 
      time: desiredReturnTime, 
      date: flightDate 
    };
    
    // Pegar a última escala
    const lastStop = route[route.length - 1];
    const lastDepartureTime = new Date(`${flightDate}T${lastStop.departureTime}`);
    
    // Assumir 2 horas de voo de volta à base
    const estimatedFlightDuration = 2; // horas
    const returnDateTime = new Date(lastDepartureTime.getTime() + (estimatedFlightDuration * 60 * 60 * 1000));
    
    return {
      time: returnDateTime.toTimeString().slice(0, 5),
      date: returnDateTime.toISOString().split('T')[0]
    };
  };

  const getEffectiveReturnDateTime = (): { time: string; date: string } => {
    if (useCalculatedReturn) {
      return calculateReturnTimeToBase();
    } else {
      return {
        time: desiredReturnTime,
        date: desiredReturnDate
      };
    }
  };

  const calculateTimingAndNotify = () => {
    const calculatedReturn = calculateReturnTimeToBase();
    const effectiveReturn = getEffectiveReturnDateTime();
    const hasOvernight = checkForOvernight(effectiveReturn.time, effectiveReturn.date);
    const overnightCount = calculateOvernightDays(effectiveReturn.date);
    
    if (onTimingChange) {
      onTimingChange({
        departureFromBase,
        returnToBase: effectiveReturn.time,
        returnDate: effectiveReturn.date,
        flightDate,
        hasOvernight,
        overnightCount,
        calculatedReturnTime: calculatedReturn.time,
        calculatedReturnDate: calculatedReturn.date,
        desiredReturnTime,
        desiredReturnDate
      });
    }
  };

  const checkForOvernight = (returnTime?: string, returnDate?: string): boolean => {
    const checkTime = returnTime || getEffectiveReturnDateTime().time;
    const checkDate = returnDate || getEffectiveReturnDateTime().date;
    
    // Se a data de retorno é diferente da data de saída, é pernoite
    if (checkDate !== flightDate) return true;
    
    // Se mesmo dia, mas horário de retorno é menor que o de saída, passou da meia-noite
    return checkTime < departureFromBase;
  };

  const calculateOvernightDays = (returnDate?: string): number => {
    const checkDate = returnDate || getEffectiveReturnDateTime().date;
    
    const departure = new Date(flightDate);
    const returnDay = new Date(checkDate);
    
    const timeDiff = returnDay.getTime() - departure.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return Math.max(0, daysDiff);
  };

  const isReturnTimeFeasible = (): boolean => {
    if (route.length === 0 || useCalculatedReturn) return true;
    
    const calculatedReturn = calculateReturnTimeToBase();
    const desiredReturnDateTime = new Date(`${desiredReturnDate}T${desiredReturnTime}`);
    const calculatedReturnDateTime = new Date(`${calculatedReturn.date}T${calculatedReturn.time}`);
    
    return desiredReturnDateTime >= calculatedReturnDateTime;
  };

  const getTimeDifference = (): number => {
    if (route.length === 0 || useCalculatedReturn) return 0;
    
    const calculatedReturn = calculateReturnTimeToBase();
    const desiredReturnDateTime = new Date(`${desiredReturnDate}T${desiredReturnTime}`);
    const calculatedReturnDateTime = new Date(`${calculatedReturn.date}T${calculatedReturn.time}`);
    
    return (desiredReturnDateTime.getTime() - calculatedReturnDateTime.getTime()) / (1000 * 60); // em minutos
  };

  const formatDateTime = (date: string, time: string): string => {
    const dateObj = new Date(`${date}T${time}`);
    return dateObj.toLocaleDateString('pt-BR') + ' às ' + time;
  };

  const addStop = () => {
    if (!newDestination || !arrivalTime || !departureTime) return;
    
    const stayDuration = calculateStayDuration(arrivalTime, departureTime);
    const newStop: RouteStop = {
      id: Date.now().toString(),
      destination: newDestination,
      arrivalTime,
      departureTime,
      stayDuration
    };

    const updatedRoute = [...route, newStop];
    setRoute(updatedRoute);
    onRouteChange(updatedRoute);
    
    // Reset form
    setNewDestination('');
    setArrivalTime('');
    setDepartureTime(''); // Corrigido: removido parênteses vazios
    
    // Calculate costs
    calculateRouteCosts(updatedRoute);
  };

  const removeStop = (stopId: string) => {
    const updatedRoute = route.filter(stop => stop.id !== stopId);
    setRoute(updatedRoute);
    onRouteChange(updatedRoute);
    calculateRouteCosts(updatedRoute);
  };

  const calculateStayDuration = (arrival: string, departure: string): number => {
    const arrivalTime = new Date(`2024-01-01T${arrival}`);
    let departureTime = new Date(`2024-01-01T${departure}`);
    
    if (departureTime < arrivalTime) {
      departureTime.setDate(departureTime.getDate() + 1);
    }
    
    return (departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60 * 60);
  };

  const calculateRouteCosts = (routeStops: RouteStop[]) => {
    const hourlyRate = 5000;
    let totalCost = 0;
    const segments = [];
    const effectiveReturn = getEffectiveReturnDateTime();
    const overnightCount = calculateOvernightDays(effectiveReturn.date);
    const overnightFee = overnightCount * 1500;

    // Adicionar segmentos da rota
    let previousLocation = baseLocation;
    
    routeStops.forEach((stop, index) => {
      const flightTime = 2;
      const flightCost = flightTime * hourlyRate;
      const airportFees = 1000;
      
      const segmentCost = flightCost + airportFees;
      totalCost += segmentCost;
      
      segments.push({
        from: previousLocation,
        to: stop.destination,
        flightTime,
        flightCost,
        airportFees,
        overnightCost: 0,
        hasOvernight: false,
        total: segmentCost
      });
      
      previousLocation = stop.destination;
    });

    // Adicionar trecho de retorno à base
    if (routeStops.length > 0) {
      const returnFlightTime = 2;
      const returnFlightCost = returnFlightTime * hourlyRate;
      const returnAirportFees = 600;
      const returnSegmentCost = returnFlightCost + returnAirportFees;
      
      totalCost += returnSegmentCost;
      
      segments.push({
        from: previousLocation,
        to: baseLocation,
        flightTime: returnFlightTime,
        flightCost: returnFlightCost,
        airportFees: returnAirportFees,
        overnightCost: 0,
        hasOvernight: false,
        total: returnSegmentCost,
        estimatedArrival: effectiveReturn.time,
        estimatedArrivalDate: effectiveReturn.date
      });
    }

    // Adicionar taxa de pernoite ao total
    totalCost += overnightFee;

    onCostCalculation({
      segments,
      totalCost,
      overnightFee,
      overnightCount,
      totalFlightTime: segments.reduce((acc, seg) => acc + seg.flightTime, 0),
      calculatedReturnTime: effectiveReturn.time,
      calculatedReturnDate: effectiveReturn.date
    });
  };

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Definição da Rota e Horários da Missão</span>
          </CardTitle>
          <CardDescription>
            Base: {baseLocation} (saída e retorno obrigatórios)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Seção de Seleção de Data */}
          {selectedAircraftId && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-4 flex items-center space-x-2 text-blue-800">
                <CalendarIcon className="h-5 w-5" />
                <span>1. Selecione a Data da Missão</span>
              </h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Calendário */}
                <div>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-md border bg-white shadow-sm w-fit mx-auto"
                    disabled={(date) => date < new Date()}
                    modifiers={{
                      occupied: occupiedDates,
                      available: (date) => !isDateOccupied(date) && date >= new Date()
                    }}
                    modifiersStyles={{
                      occupied: {
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        textDecoration: 'line-through',
                        fontWeight: 'bold'
                      },
                      available: {
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                  
                  {isLoadingDates && (
                    <div className="text-center mt-4 text-sm text-gray-600">
                      Carregando disponibilidade...
                    </div>
                  )}
                </div>
                
                {/* Painel de Informações */}
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <h5 className="font-medium text-sm mb-3 text-gray-700">Legenda:</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                        <span>Indisponível (reservado)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                        <span>Disponível para reserva</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                        <span>Datas passadas</span>
                      </div>
                    </div>
                  </div>
                  
                  {selectedDate && (
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <h5 className="font-medium text-sm mb-2 text-gray-700">Data Selecionada:</h5>
                      <p className="text-sm font-medium text-blue-600">
                        {selectedDate.toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                        <p className="text-xs text-green-600">
                          ✓ Data disponível - Configure os horários abaixo
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Configuração de Horários */}
          {showTimeConfiguration && selectedDate && (
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h4 className="font-semibold mb-4 flex items-center space-x-2 text-green-800">
                <Clock className="h-5 w-5" />
                <span>2. Configure os Horários da Missão</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Horário de Saída */}
                <div className="space-y-2">
                  <Label htmlFor="departure-time">Horário de Saída da Base</Label>
                  <div className="relative">
                    <Input
                      id="departure-time"
                      type="time"
                      value={departureFromBase}
                      onChange={(e) => setDepartureFromBase(e.target.value)}
                      className="pl-10"
                    />
                    <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>

                {/* Modo de Retorno */}
                <div className="space-y-2">
                  <Label>Modo de Retorno</Label>
                  <div className="flex space-x-2">
                    <Button
                      variant={useCalculatedReturn ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseCalculatedReturn(true)}
                      className="flex-1"
                    >
                      <Calculator className="h-3 w-3 mr-1" />
                      Automático
                    </Button>
                    <Button
                      variant={!useCalculatedReturn ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUseCalculatedReturn(false)}
                      className="flex-1"
                    >
                      <CalendarIcon className="h-3 w-3 mr-1" />
                      Manual
                    </Button>
                  </div>
                </div>

                {/* Horário de Retorno Manual */}
                {!useCalculatedReturn && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="return-date">Data de Retorno Desejada</Label>
                      <Input
                        id="return-date"
                        type="date"
                        value={desiredReturnDate}
                        onChange={(e) => setDesiredReturnDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="return-time">Horário de Retorno Desejado</Label>
                      <div className="relative">
                        <Input
                          id="return-time"
                          type="time"
                          value={desiredReturnTime}
                          onChange={(e) => setDesiredReturnTime(e.target.value)}
                        />
                        <Plane className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Resumo da Configuração */}
              <div className="mt-6 bg-white p-4 rounded border">
                <h5 className="font-medium text-sm mb-3">Resumo da Missão:</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Data:</span>
                    <div className="font-medium">
                      {selectedDate.toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Saída:</span>
                    <div className="font-medium">{departureFromBase}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Retorno:</span>
                    <div className="font-medium">
                      {useCalculatedReturn ? "Automático" : `${desiredReturnTime} (${new Date(desiredReturnDate).toLocaleDateString('pt-BR')})`}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Escalas:</span>
                    <div className="font-medium">{route.length}</div>
                  </div>
                </div>
              </div>

              {/* Alerta de Pernoite */}
              {checkForOvernight() && (
                <Alert className="mt-4 border-amber-200 bg-amber-50">
                  <Moon className="h-4 w-4" />
                  <AlertDescription className="text-amber-800">
                    <strong>Pernoite Detectada!</strong> A missão se estende por {calculateOvernightDays()} dia(s).
                    Taxa de pernoite: R$ {(calculateOvernightDays() * 1500).toLocaleString('pt-BR')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Visualização da rota atual */}
          {route.length > 0 && selectedDate && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Rota Programada:</h4>
              <div className="flex items-center space-x-2 flex-wrap">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {baseLocation} ({selectedDate.toLocaleDateString('pt-BR')} {departureFromBase})
                </Badge>
                {route.map((stop, index) => (
                  <React.Fragment key={stop.id}>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                    <Badge variant="outline" className="relative group">
                      {stop.destination} ({stop.arrivalTime}-{stop.departureTime})
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeStop(stop.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  </React.Fragment>
                ))}
                <ArrowRight className="h-4 w-4 text-gray-400" />
                <Badge variant="outline" className="text-blue-600 border-blue-600">
                  {baseLocation} ({new Date(getEffectiveReturnDateTime().date).toLocaleDateString('pt-BR')} {getEffectiveReturnDateTime().time})
                </Badge>
              </div>
            </div>
          )}

          {/* Formulário para adicionar parada */}
          {showTimeConfiguration && (
            <div className="space-y-4">
              <h4 className="font-medium">3. Adicionar Escalas (Opcional):</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input
                    id="destination"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    placeholder="Ex: São Paulo (GRU)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrival">Chegada</Label>
                  <Input
                    id="arrival"
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departure">Saída</Label>
                  <Input
                    id="departure"
                    type="time"
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={addStop} 
                    className="w-full bg-aviation-gradient hover:opacity-90"
                    disabled={!newDestination || !arrivalTime || !departureTime}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de escalas */}
          {route.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Escalas Programadas:</h4>
              {route.map((stop, index) => (
                <div key={stop.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{stop.destination}</p>
                      <p className="text-sm text-gray-600">
                        {stop.arrivalTime} - {stop.departureTime} 
                        ({stop.stayDuration.toFixed(1)}h de permanência)
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStop(stop.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteBuilder;
