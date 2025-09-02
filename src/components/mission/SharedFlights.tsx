import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, MapPin, Clock, Users, ArrowLeft } from 'lucide-react';
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

interface SharedFlightsProps {
  onBack: () => void;
  onSelectFlight: (flight: SharedFlight) => void;
}

const SharedFlights: React.FC<SharedFlightsProps> = ({ onBack, onSelectFlight }) => {
  // Mock data - em produção viria do Supabase
  const [sharedFlights] = useState<SharedFlight[]>([
    {
      id: '1',
      aircraft: 'Baron E55 PR-FOM',
      departure: new Date('2025-01-15T08:00:00'),
      arrival: new Date('2025-01-15T12:30:00'),
      origin: 'Araçatuba-SBAU',
      destination: 'São Paulo-SBMT',
      totalSeats: 6,
      availableSeats: 3,
      
      owner: 'João Silva',
      stops: ['Campo Grande']
    },
    {
      id: '2',
      aircraft: 'Cessna 172 PR-ABC',
      departure: new Date('2025-01-16T14:00:00'),
      arrival: new Date('2025-01-16T16:30:00'),
      origin: 'Araçatuba-SBAU',
      destination: 'Brasília-SBBR',
      totalSeats: 4,
      availableSeats: 2,
      
      owner: 'Maria Santos'
    }
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Voos Compartilhados</h2>
          <p className="text-gray-600">Selecione um voo com poltronas disponíveis</p>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {sharedFlights.map((flight) => (
          <Card key={flight.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Plane className="h-5 w-5 text-aviation-blue" />
                  <span>{flight.aircraft}</span>
                </CardTitle>
                <Badge variant="outline" className="text-aviation-blue border-aviation-blue">
                  {flight.availableSeats} de {flight.totalSeats} poltronas
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <div className="font-medium">{flight.origin}</div>
                    <div className="text-sm text-gray-500">
                      {format(flight.departure, "dd/MM 'às' HH:mm", { locale: ptBR })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Duração</div>
                    <div className="font-medium">
                      {Math.floor((flight.arrival.getTime() - flight.departure.getTime()) / (1000 * 60 * 60))}h 
                      {Math.floor(((flight.arrival.getTime() - flight.departure.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}min
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

              {flight.stops && flight.stops.length > 0 && (
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm font-medium text-gray-700 mb-1">Escalas:</div>
                  <div className="text-sm text-gray-600">{flight.stops.join(', ')}</div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t">
                <div>
                  <div className="text-sm text-gray-500">Proprietário da missão</div>
                  <div className="font-medium">{flight.owner}</div>
                </div>
                
                <Button 
                  className="bg-aviation-gradient hover:opacity-90"
                  onClick={() => onSelectFlight(flight)}
                >
                  Selecionar Poltrona
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {sharedFlights.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum voo compartilhado disponível
              </h3>
              <p className="text-gray-500">
                Não há voos com poltronas disponíveis no momento.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SharedFlights;
