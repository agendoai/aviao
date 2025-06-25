import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import { MapPin, Plus, X, ArrowRight, Clock, Moon, AlertTriangle, Plane, Play } from 'lucide-react';
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
  
  // Estados do calendário e horários
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [flightDate, setFlightDate] = useState('');
  const [departureFromBase, setDepartureFromBase] = useState('08:00');
  const [desiredReturnTime, setDesiredReturnTime] = useState('18:00');
  const [desiredReturnDate, setDesiredReturnDate] = useState('');
  
  // Estados para disponibilidade da aeronave
  const [occupiedDates, setOccupiedDates] = useState<Date[]>([]);
  const [isLoadingDates, setIsLoadingDates] = useState(false);

  useEffect(() => {
    if (selectedAircraftId) {
      fetchOccupiedDates();
    }
  }, [selectedAircraftId]);

  useEffect(() => {
    if (selectedDate && flightDate) {
      calculateTimingAndNotify();
    }
  }, [departureFromBase, desiredReturnTime, desiredReturnDate, flightDate, route, selectedDate]);

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
    
    if (isDateOccupied(date)) {
      toast({
        title: "Data Indisponível",
        description: "Esta data já possui reserva confirmada para a aeronave selecionada.",
        variant: "destructive"
      });
      return;
    }

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

    toast({
      title: "Data Selecionada",
      description: `${date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })} selecionada com sucesso!`,
    });
  };

  const loadExampleMission = () => {
    // Configurar data para hoje se nenhuma estiver selecionada
    if (!selectedDate) {
      const today = new Date();
      setSelectedDate(today);
      setFlightDate(today.toISOString().split('T')[0]);
    }

    // Configurar horários do exemplo
    setDepartureFromBase('08:00');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDesiredReturnDate(tomorrow.toISOString().split('T')[0]);
    setDesiredReturnTime('07:00');

    // Configurar escalas do exemplo
    const exampleRoute: RouteStop[] = [
      {
        id: 'example-1',
        destination: 'São Paulo (GRU)',
        arrivalTime: '09:30',
        departureTime: '18:00',
        stayDuration: 8.5
      },
      {
        id: 'example-2',
        destination: 'Mato Grosso (VGF)',
        arrivalTime: '20:00',
        departureTime: '06:00',
        stayDuration: 10
      }
    ];

    setRoute(exampleRoute);
    onRouteChange(exampleRoute);
    calculateRouteCosts(exampleRoute);

    toast({
      title: "Exemplo Carregado!",
      description: "Missão de exemplo configurada: Araçatuba → São Paulo → Mato Grosso → Araçatuba",
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
    return {
      time: desiredReturnTime,
      date: desiredReturnDate
    };
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
    if (route.length === 0) return true;
    
    const calculatedReturn = calculateReturnTimeToBase();
    const desiredReturnDateTime = new Date(`${desiredReturnDate}T${desiredReturnTime}`);
    const calculatedReturnDateTime = new Date(`${calculatedReturn.date}T${calculatedReturn.time}`);
    
    return desiredReturnDateTime >= calculatedReturnDateTime;
  };

  const getTimeDifference = (): number => {
    if (route.length === 0) return 0;
    
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
    setDepartureTime('');
    
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
            <span>Planejamento de Voo</span>
          </CardTitle>
          <CardDescription>
            Base: {baseLocation} - Selecione a data e configure sua missão
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">

          {/* EXEMPLO DE MISSÃO */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-green-800">Exemplo de Missão</h3>
                <p className="text-sm text-green-700">
                  Voo saindo de Araçatuba às 8h → São Paulo (9:30-18h) → Mato Grosso (20h-6h) → Retorno às 7h
                </p>
              </div>
              <Button 
                onClick={loadExampleMission}
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="h-4 w-4 mr-2" />
                Carregar Exemplo
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-green-700">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                Araçatuba (08:00)
              </Badge>
              <ArrowRight className="h-4 w-4" />
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                São Paulo (09:30-18:00)
              </Badge>
              <ArrowRight className="h-4 w-4" />
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">
                Mato Grosso (20:00-06:00)
              </Badge>
              <ArrowRight className="h-4 w-4" />
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                Araçatuba (07:00)
              </Badge>
            </div>
          </div>
          
          {/* PASSO 1: Seleção de Data */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
              <h3 className="text-lg font-semibold">Selecione a Data da Missão</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Calendário - Aumentado para ocupar mais espaço */}
              <div className="lg:col-span-3">
                {selectedAircraftId ? (
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    className="rounded-lg border bg-white shadow-sm w-full max-w-none pointer-events-auto text-lg"
                    disabled={(date) => date < new Date() || isDateOccupied(date)}
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
                ) : (
                  <div className="flex items-center justify-center h-80 bg-gray-50 rounded-lg border">
                    <div className="text-center text-gray-500">
                      <Plane className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">Selecione uma aeronave primeiro</p>
                      <p className="text-sm">A aeronave é selecionada no início do fluxo de reserva</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Painel de Status - Reduzido */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-3">Status das Datas</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                      <span>Disponível</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                      <span>Ocupado</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                      <span>Passado</span>
                    </div>
                  </div>
                </div>
                
                {selectedDate && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-sm mb-2 text-green-800">Data Selecionada</h4>
                    <p className="text-sm font-medium text-green-700">
                      {selectedDate.toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                )}
                
                {isLoadingDates && (
                  <div className="text-center text-sm text-gray-600">
                    Carregando disponibilidade...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* PASSO 2: Configuração de Horários */}
          {selectedDate && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <h3 className="text-lg font-semibold">Configure os Horários</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-6 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="departure-time">Saída da Base</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="return-time">Retorno à Base</Label>
                  <div className="relative">
                    <Input
                      id="return-time"
                      type="time"
                      value={desiredReturnTime}
                      onChange={(e) => setDesiredReturnTime(e.target.value)}
                      className="pl-10"
                    />
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="return-date">Data de Retorno</Label>
                  <Input
                    id="return-date"
                    type="date"
                    value={desiredReturnDate}
                    onChange={(e) => setDesiredReturnDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Resumo dos Horários */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-sm mb-3">Resumo da Missão</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Data:</span>
                    <div className="font-medium">{selectedDate.toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Saída:</span>
                    <div className="font-medium">{departureFromBase}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Retorno:</span>
                    <div className="font-medium">{desiredReturnTime}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Escalas:</span>
                    <div className="font-medium">{route.length}</div>
                  </div>
                </div>
              </div>

              {/* Alerta de Pernoite */}
              {checkForOvernight() && (
                <Alert className="border-amber-200 bg-amber-50">
                  <Moon className="h-4 w-4" />
                  <AlertDescription className="text-amber-800">
                    <strong>Pernoite Detectada!</strong> Missão com {calculateOvernightDays()} dia(s) de duração.
                    Taxa adicional: R$ {(calculateOvernightDays() * 1500).toLocaleString('pt-BR')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* PASSO 3: Escalas (Opcional) */}
          {selectedDate && (
            <div className="space-y-4 border-t pt-6">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <h3 className="text-lg font-semibold">Adicionar Escalas (Opcional)</h3>
              </div>

              {/* Visualização da rota atual */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-3">Rota Programada:</h4>
                <div className="flex items-center space-x-2 flex-wrap">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {baseLocation} ({departureFromBase})
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
                    {baseLocation} ({getEffectiveReturnDateTime().time})
                  </Badge>
                </div>
              </div>

              {/* Formulário para nova escala */}
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
                    className="w-full"
                    disabled={!newDestination || !arrivalTime || !departureTime}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </div>
              </div>

              {/* Lista de escalas */}
              {route.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Escalas Confirmadas:</h4>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RouteBuilder;
