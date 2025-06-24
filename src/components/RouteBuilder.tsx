import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Plus, X, ArrowRight, Clock, Moon, AlertTriangle, Plane } from 'lucide-react';

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
  onTimingChange?: (timing: { departureFromBase: string; returnToBase: string; hasOvernight: boolean; overnightCount: number; calculatedReturnTime: string }) => void;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({
  baseLocation = "Araçatuba (ABC)",
  onRouteChange,
  onCostCalculation,
  onTimingChange
}) => {
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [newDestination, setNewDestination] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  
  // Novos campos para controle de horários
  const [departureFromBase, setDepartureFromBase] = useState('08:00');
  const [returnToBase, setReturnToBase] = useState('18:00');
  const [flightDate, setFlightDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    calculateTimingAndNotify();
  }, [departureFromBase, returnToBase, flightDate, route]);

  const calculateReturnTimeToBase = (): string => {
    if (route.length === 0) return returnToBase;
    
    // Pegar a última escala
    const lastStop = route[route.length - 1];
    const lastDepartureTime = new Date(`2024-01-01T${lastStop.departureTime}`);
    
    // Assumir 2 horas de voo de volta à base
    const estimatedFlightDuration = 2; // horas
    const returnTime = new Date(lastDepartureTime.getTime() + (estimatedFlightDuration * 60 * 60 * 1000));
    
    return returnTime.toTimeString().slice(0, 5);
  };

  const calculateTimingAndNotify = () => {
    const calculatedReturnTime = calculateReturnTimeToBase();
    const hasOvernight = checkForOvernight(calculatedReturnTime);
    const overnightCount = calculateOvernightDays(calculatedReturnTime);
    
    if (onTimingChange) {
      onTimingChange({
        departureFromBase,
        returnToBase: calculatedReturnTime,
        hasOvernight,
        overnightCount,
        calculatedReturnTime
      });
    }
  };

  const checkForOvernight = (calculatedReturn?: string): boolean => {
    const returnTime = calculatedReturn || calculateReturnTimeToBase();
    // Se o horário de retorno calculado é menor que o de saída, passou da meia-noite
    return returnTime < departureFromBase;
  };

  const calculateOvernightDays = (calculatedReturn?: string): number => {
    if (!checkForOvernight(calculatedReturn)) return 0;
    
    // Cálculo simples: se passou da meia-noite, conta como 1 pernoite
    // Em uma implementação mais complexa, você poderia calcular com base nas datas
    return 1;
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
    const calculatedReturnTime = calculateReturnTimeToBase();
    const overnightCount = calculateOvernightDays(calculatedReturnTime);
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
        estimatedArrival: calculatedReturnTime
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
      calculatedReturnTime
    });
  };

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Definição da Rota e Horários</span>
          </CardTitle>
          <CardDescription>
            Base: {baseLocation} (saída e retorno obrigatórios)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controle de Horários da Base */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-4 flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Horários da Missão</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="flight-date">Data do Voo</Label>
                <Input
                  id="flight-date"
                  type="date"
                  value={flightDate}
                  onChange={(e) => setFlightDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure-base">Saída da Base</Label>
                <Input
                  id="departure-base"
                  type="time"
                  value={departureFromBase}
                  onChange={(e) => setDepartureFromBase(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="return-base">Retorno Estimado à Base</Label>
                <div className="relative">
                  <Input
                    id="return-base"
                    type="time"
                    value={calculateReturnTimeToBase()}
                    readOnly
                    className="bg-gray-100 cursor-not-allowed"
                  />
                  <Plane className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
                <p className="text-xs text-gray-600">
                  Calculado automaticamente (+2h da última escala)
                </p>
              </div>
            </div>
            
            {/* Alerta de Pernoite */}
            {checkForOvernight() && (
              <Alert className="mt-4 border-amber-200 bg-amber-50">
                <Moon className="h-4 w-4" />
                <AlertDescription className="text-amber-800">
                  <strong>Pernoite Detectada!</strong> O retorno após meia-noite gera taxa adicional de R$ 1.500,00 por noite.
                  {calculateOvernightDays() > 0 && (
                    <span className="block mt-1">
                      Noites: {calculateOvernightDays()} × R$ 1.500,00 = R$ {(calculateOvernightDays() * 1500).toFixed(2)}
                    </span>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Visualização da rota atual */}
          {route.length > 0 && (
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
                  {baseLocation} ({calculateReturnTimeToBase()})
                </Badge>
              </div>
            </div>
          )}

          {/* Formulário para adicionar parada */}
          <div className="space-y-4">
            <h4 className="font-medium">Adicionar Escala:</h4>
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
