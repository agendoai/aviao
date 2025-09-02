import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plane, Users, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface SharedFlightSeatSelectionProps {
  flight: SharedFlight;
  onBack: () => void;
  onSeatSelected: (seatNumber: number) => void;
}

const SharedFlightSeatSelection: React.FC<SharedFlightSeatSelectionProps> = ({
  flight,
  onBack,
  onSeatSelected
}) => {
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  // Mock data - em produção viria do Supabase
  const occupiedSeats = [1, 3, 5]; // Poltronas ocupadas
  const availableSeats = Array.from({ length: flight.totalSeats }, (_, i) => i + 1)
    .filter(seat => !occupiedSeats.includes(seat));

  const handleSeatClick = (seatNumber: number) => {
    if (occupiedSeats.includes(seatNumber)) return;
    setSelectedSeat(seatNumber);
  };

  const handleContinue = () => {
    if (selectedSeat) {
      onSeatSelected(selectedSeat);
    }
  };

  const getSeatStatus = (seatNumber: number) => {
    if (occupiedSeats.includes(seatNumber)) return 'occupied';
    if (selectedSeat === seatNumber) return 'selected';
    return 'available';
  };

  const getSeatColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'bg-red-200 text-red-800 cursor-not-allowed';
      case 'selected': return 'bg-aviation-blue text-white';
      case 'available': return 'bg-gray-100 hover:bg-gray-200 cursor-pointer';
      default: return 'bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Selecionar Poltrona</h2>
          <p className="text-gray-600">Escolha sua poltrona no voo compartilhado</p>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Informações do Voo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-aviation-blue" />
              <span>{flight.aircraft}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{flight.origin}</div>
                  <div className="text-sm text-gray-500">
                    {format(flight.departure, "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <div className="font-medium">{flight.destination}</div>
                  <div className="text-sm text-gray-500">
                    {format(flight.arrival, "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                Duração: {Math.floor((flight.arrival.getTime() - flight.departure.getTime()) / (1000 * 60 * 60))}h 
                {Math.floor(((flight.arrival.getTime() - flight.departure.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}min
              </span>
            </div>

            {flight.stops && flight.stops.length > 0 && (
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700 mb-1">Escalas:</div>
                <div className="text-sm text-gray-600">{flight.stops.join(', ')}</div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="text-sm text-gray-500">Proprietário da missão</div>
              <div className="font-medium">{flight.owner}</div>
            </div>
          </CardContent>
        </Card>

        {/* Mapa de Poltronas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-aviation-blue" />
              <span>Mapa de Poltronas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Legenda */}
              <div className="flex justify-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 rounded border"></div>
                  <span>Disponível</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-aviation-blue rounded border"></div>
                  <span>Selecionada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-red-200 rounded border"></div>
                  <span>Ocupada</span>
                </div>
              </div>

              {/* Mapa de Poltronas */}
              <div className="flex flex-col items-center space-y-2">
                <div className="text-xs text-gray-500 mb-4">Cockpit</div>
                <div className="grid grid-cols-2 gap-4 max-w-xs">
                  {Array.from({ length: flight.totalSeats }, (_, i) => i + 1).map(seatNumber => (
                    <button
                      key={seatNumber}
                      onClick={() => handleSeatClick(seatNumber)}
                      className={`
                        w-12 h-12 rounded-lg border-2 flex items-center justify-center text-sm font-medium transition-colors
                        ${getSeatColor(getSeatStatus(seatNumber))}
                      `}
                      disabled={occupiedSeats.includes(seatNumber)}
                    >
                      {seatNumber}
                    </button>
                  ))}
                </div>
              </div>

              {selectedSeat && (
                <div className="mt-6 p-4 bg-aviation-blue/10 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Poltrona selecionada:</div>
                    <div className="text-lg font-bold text-aviation-blue">
                      Poltrona {selectedSeat}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleContinue}
          disabled={!selectedSeat}
          className="bg-aviation-gradient hover:opacity-90 text-white text-lg py-3 px-8"
        >
          Continuar com Poltrona {selectedSeat}
        </Button>
      </div>
    </div>
  );
};

export default SharedFlightSeatSelection;
