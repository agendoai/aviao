import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Plane, Users, MapPin, Calendar, Clock, Share2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SharedMissionData {
  aircraft: {
    id: string;
    name: string;
    registration: string;
    model: string;
    maxPassengers: number;
  };
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  origin: string;
  destination: string;
  stops: string;
  notes: string;
  availableSeats: number;
  totalCost: number;
}

interface SharedMissionConfirmationProps {
  missionData: SharedMissionData;
  onFinish: () => void;
}

const SharedMissionConfirmation: React.FC<SharedMissionConfirmationProps> = ({
  missionData,
  onFinish
}) => {
  const costPerSeat = missionData.totalCost / (missionData.availableSeats + 1);
  const departureDateTime = new Date(`${missionData.departureDate}T${missionData.departureTime}`);
  const returnDateTime = new Date(`${missionData.returnDate}T${missionData.returnTime}`);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Viagem Compartilhada Criada!
        </h2>
        <p className="text-gray-600">
          Sua viagem foi criada com sucesso e já está disponível para outros usuários
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Detalhes da Missão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-aviation-blue" />
              <span>Detalhes da Missão</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Aeronave:</span>
                <span className="font-medium">{missionData.aircraft.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Registro:</span>
                <span className="font-medium">{missionData.aircraft.registration}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Modelo:</span>
                <span className="font-medium">{missionData.aircraft.model}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Rota</span>
              </div>
              <div className="space-y-2">
                <div>
                  <div className="font-medium">{missionData.origin}</div>
                  <div className="text-sm text-gray-500">
                    {format(departureDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="text-center text-gray-400">↓</div>
                <div>
                  <div className="font-medium">{missionData.destination}</div>
                  <div className="text-sm text-gray-500">
                    {format(returnDateTime, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>

            {missionData.stops && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Escalas:</div>
                <div className="text-sm text-gray-600">{missionData.stops}</div>
              </div>
            )}

            {missionData.notes && (
              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-1">Observações:</div>
                <div className="text-sm text-gray-600">{missionData.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações de Compartilhamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-aviation-blue" />
              <span>Compartilhamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Poltronas disponíveis:</span>
                <Badge variant="outline" className="text-aviation-blue">
                  {missionData.availableSeats}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Capacidade total:</span>
                <span className="font-medium">{missionData.aircraft.maxPassengers} passageiros</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Sua poltrona:</span>
                <Badge variant="outline" className="text-green-600">
                  Reservada
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Custos:</div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Custo total:</span>
                  <span>R$ {missionData.totalCost.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Custo por poltrona:</span>
                  <span className="font-medium text-aviation-blue">
                    R$ {costPerSeat.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sua parte:</span>
                  <span className="font-medium">
                    R$ {costPerSeat.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Share2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Status da Viagem</span>
              </div>
              <div className="text-sm text-blue-700">
                Sua viagem está agora disponível para outros usuários. Você receberá notificações 
                quando alguém se interessar em participar.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="text-center">
          <CardContent className="p-4">
            <Calendar className="h-8 w-8 text-aviation-blue mx-auto mb-2" />
            <div className="text-sm font-medium">Próximos Passos</div>
            <div className="text-xs text-gray-500">
              Aguarde interessados na sua viagem
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Users className="h-8 w-8 text-aviation-blue mx-auto mb-2" />
            <div className="text-sm font-medium">Gerenciar</div>
            <div className="text-xs text-gray-500">
              Veja quem se interessou pela viagem
            </div>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardContent className="p-4">
            <Share2 className="h-8 w-8 text-aviation-blue mx-auto mb-2" />
            <div className="text-sm font-medium">Compartilhar</div>
            <div className="text-xs text-gray-500">
              Divulgue sua viagem para amigos
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-4">
        <div className="text-sm text-gray-600">
          Sua viagem compartilhada foi criada com sucesso! Você pode gerenciar esta viagem 
          na seção "Minhas Missões" do painel principal.
        </div>
        
        <Button 
          onClick={onFinish}
          className="bg-aviation-gradient hover:opacity-90 text-white px-8"
        >
          Finalizar
        </Button>
      </div>
    </div>
  );
};

export default SharedMissionConfirmation;