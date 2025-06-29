
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Plus, Trash2, Calculator, Plane, Home } from 'lucide-react';

interface RouteStop {
  id: string;
  destination: string;
  arrivalTime: string;
  departureTime: string;
  stayDuration: number;
}

interface CostSegment {
  from: string;
  to: string;
  flightTime: number;
  flightCost: number;
  airportFees: number;
  distance: number;
  overnightCost: number;
  hasOvernight: boolean;
  total: number;
  estimatedArrival?: string;
  estimatedArrivalDate?: string;
  isReturnToBase?: boolean;
}

interface RouteBuilderProps {
  baseLocation: string;
  onRouteChange: (route: RouteStop[]) => void;
  onCostCalculation: (costs: any) => void;
  onTimingChange: (timing: any) => void;
  selectedAircraftId?: string;
}

const RouteBuilder: React.FC<RouteBuilderProps> = ({
  baseLocation,
  onRouteChange,
  onCostCalculation,
  onTimingChange,
  selectedAircraftId
}) => {
  const [route, setRoute] = useState<RouteStop[]>([]);
  const [newDestination, setNewDestination] = useState('');
  const [newArrivalTime, setNewArrivalTime] = useState('');
  const [newDepartureTime, setNewDepartureTime] = useState('');

  // Distâncias aproximadas entre cidades (em km)
  const cityDistances: { [key: string]: number } = {
    'São Paulo': 500,
    'Rio de Janeiro': 800,
    'Belo Horizonte': 600,
    'Brasília': 700,
    'Mato Grosso': 1200,
    'Cuiabá': 1200,
    'Campo Grande': 800,
    'Goiânia': 650,
    'Ribeirão Preto': 150,
    'Bauru': 100,
    'Presidente Prudente': 200,
  };

  const getDistance = (destination: string): number => {
    return cityDistances[destination] || 500; // Distância padrão
  };

  const calculateFlightTime = (distance: number): number => {
    // Velocidade média de cruzeiro: ~400 km/h
    return Math.round((distance / 400) * 10) / 10;
  };

  const getStayDurationPreview = (arrivalTime: string, departureTime: string): string => {
    if (!arrivalTime || !departureTime) return 'N/A';
    
    try {
      const arrival = new Date(`2024-01-01T${arrivalTime}`);
      const departure = new Date(`2024-01-01T${departureTime}`);
      
      // Se a saída é no dia seguinte (após meia-noite)
      if (departure < arrival) {
        departure.setDate(departure.getDate() + 1);
      }
      
      const diffMs = departure.getTime() - arrival.getTime();
      const diffHours = Math.round(diffMs / (1000 * 60 * 60) * 10) / 10;
      
      return `${diffHours}h`;
    } catch (error) {
      return 'N/A';
    }
  };

  const addStop = () => {
    if (!newDestination || !newArrivalTime || !newDepartureTime) return;

    const newStop: RouteStop = {
      id: Date.now().toString(),
      destination: newDestination,
      arrivalTime: newArrivalTime,
      departureTime: newDepartureTime,
      stayDuration: parseFloat(getStayDurationPreview(newArrivalTime, newDepartureTime).replace('h', '')) || 0
    };

    const updatedRoute = [...route, newStop];
    setRoute(updatedRoute);
    onRouteChange(updatedRoute);

    // Reset form
    setNewDestination('');
    setNewArrivalTime('');
    setNewDepartureTime('');
  };

  const removeStop = (id: string) => {
    const updatedRoute = route.filter(stop => stop.id !== id);
    setRoute(updatedRoute);
    onRouteChange(updatedRoute);
  };

  const calculateCosts = () => {
    if (route.length === 0) return;

    const segments: CostSegment[] = [];
    const hourlyRate = 5000; // R$ 5.000 por hora
    const baseAirportFee = 300; // Taxa base do aeroporto
    let totalCost = 0;
    let totalFlightTime = 0;
    let overnightFee = 0;
    let overnightCount = 0;

    // Primeiro trecho: Base → Primeiro destino
    const firstDestination = route[0];
    const firstDistance = getDistance(firstDestination.destination);
    const firstFlightTime = calculateFlightTime(firstDistance);
    const firstFlightCost = firstFlightTime * hourlyRate;

    segments.push({
      from: baseLocation,
      to: firstDestination.destination,
      flightTime: firstFlightTime,
      flightCost: firstFlightCost,
      airportFees: baseAirportFee,
      distance: firstDistance,
      overnightCost: 0,
      hasOvernight: false,
      total: firstFlightCost + baseAirportFee,
      estimatedArrival: firstDestination.arrivalTime,
      estimatedArrivalDate: new Date().toISOString().split('T')[0]
    });

    totalCost += firstFlightCost + baseAirportFee;
    totalFlightTime += firstFlightTime;

    // Trechos intermediários
    for (let i = 0; i < route.length - 1; i++) {
      const currentStop = route[i];
      const nextStop = route[i + 1];
      const distance = getDistance(nextStop.destination);
      const flightTime = calculateFlightTime(distance);
      const flightCost = flightTime * hourlyRate;

      // Verificar se há pernoite (passagem da meia-noite)
      const departureTime = new Date(`2024-01-01T${currentStop.departureTime}`);
      const arrivalTime = new Date(`2024-01-01T${nextStop.arrivalTime}`);
      
      let hasOvernight = false;
      let segmentOvernightCost = 0;

      if (arrivalTime < departureTime || nextStop.arrivalTime < currentStop.departureTime) {
        hasOvernight = true;
        segmentOvernightCost = 1500;
        overnightFee += segmentOvernightCost;
        overnightCount++;
      }

      segments.push({
        from: currentStop.destination,
        to: nextStop.destination,
        flightTime,
        flightCost,
        airportFees: baseAirportFee,
        distance,
        overnightCost: segmentOvernightCost,
        hasOvernight,
        total: flightCost + baseAirportFee + segmentOvernightCost,
        estimatedArrival: nextStop.arrivalTime,
        estimatedArrivalDate: hasOvernight 
          ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      });

      totalCost += flightCost + baseAirportFee + segmentOvernightCost;
      totalFlightTime += flightTime;
    }

    // Último trecho: Último destino → Base (OBRIGATÓRIO)
    const lastDestination = route[route.length - 1];
    const returnDistance = getDistance(lastDestination.destination);
    const returnFlightTime = calculateFlightTime(returnDistance);
    const returnFlightCost = returnFlightTime * hourlyRate;

    // Calcular horário de retorno estimado (saída da última escala + tempo de voo)
    const lastDeparture = new Date(`2024-01-01T${lastDestination.departureTime}`);
    const returnArrival = new Date(lastDeparture.getTime() + (returnFlightTime * 60 * 60 * 1000));
    const calculatedReturnTime = returnArrival.toTimeString().slice(0, 5);

    segments.push({
      from: lastDestination.destination,
      to: baseLocation,
      flightTime: returnFlightTime,
      flightCost: returnFlightCost,
      airportFees: baseAirportFee,
      distance: returnDistance,
      overnightCost: 0,
      hasOvernight: false,
      total: returnFlightCost + baseAirportFee,
      estimatedArrival: calculatedReturnTime,
      isReturnToBase: true
    });

    totalCost += returnFlightCost + baseAirportFee;
    totalFlightTime += returnFlightTime;

    const costData = {
      segments,
      totalCost,
      totalFlightTime,
      overnightFee,
      overnightCount
    };

    const timingData = {
      calculatedReturnTime,
      totalFlightTime,
      segments: segments.length
    };

    onCostCalculation(costData);
    onTimingChange(timingData);
  };

  useEffect(() => {
    if (route.length > 0) {
      calculateCosts();
    }
  }, [route]);

  return (
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Construtor de Rotas</span>
        </CardTitle>
        <CardDescription>
          Defina sua rota com escalas. Retorno à base é obrigatório e será calculado automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Ponto de Partida */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Home className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Base de Origem</span>
          </div>
          <p className="text-lg font-bold text-blue-600">{baseLocation}</p>
          <p className="text-sm text-blue-600">Ponto de partida e retorno obrigatório</p>
        </div>

        {/* Rota Atual */}
        {route.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Rota Planejada:</h4>
            {route.map((stop, index) => (
              <div key={stop.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">{index + 1}</Badge>
                  <div>
                    <p className="font-medium">{stop.destination}</p>
                    <p className="text-sm text-gray-600">
                      Chegada: {stop.arrivalTime} | Saída: {stop.departureTime}
                    </p>
                    <p className="text-xs text-gray-500">
                      Permanência: {getStayDurationPreview(stop.arrivalTime, stop.departureTime)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeStop(stop.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Separator />

        {/* Adicionar Nova Escala */}
        <div className="space-y-4">
          <h4 className="font-medium">Adicionar Nova Escala:</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                value={newDestination}
                onChange={(e) => setNewDestination(e.target.value)}
                placeholder="Ex: São Paulo"
                list="cities"
              />
              <datalist id="cities">
                {Object.keys(cityDistances).map(city => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            
            <div>
              <Label htmlFor="arrival">Chegada</Label>
              <Input
                id="arrival"
                type="time"
                value={newArrivalTime}
                onChange={(e) => setNewArrivalTime(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="departure">Saída</Label>
              <Input
                id="departure"
                type="time"
                value={newDepartureTime}
                onChange={(e) => setNewDepartureTime(e.target.value)}
              />
            </div>
          </div>

          {newArrivalTime && newDepartureTime && (
            <div className="text-sm text-gray-600">
              <Clock className="h-4 w-4 inline mr-1" />
              Permanência estimada: {getStayDurationPreview(newArrivalTime, newDepartureTime)}
            </div>
          )}

          <Button onClick={addStop} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Escala
          </Button>
        </div>

        {/* Exemplo de Missão */}
        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
          <h5 className="font-medium text-amber-800 mb-2">💡 Exemplo de Missão Completa:</h5>
          <div className="text-sm text-amber-700 space-y-1">
            <p><strong>08:00</strong> - Saída de Araçatuba → São Paulo</p>
            <p><strong>15:00</strong> - Saída de São Paulo → Mato Grosso</p>
            <p><strong>23:00</strong> - Saída de Mato Grosso → Araçatuba (Retorno Obrigatório)</p>
            <p className="mt-2 text-xs">* Custos calculados automaticamente com base na distância e tempo de voo</p>
          </div>
        </div>

        {route.length > 0 && (
          <Button onClick={calculateCosts} className="w-full bg-green-600 hover:bg-green-700">
            <Calculator className="h-4 w-4 mr-2" />
            Recalcular Custos
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteBuilder;
