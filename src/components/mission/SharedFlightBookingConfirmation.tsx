import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, CreditCard, Banknote, Plane, User, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

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

interface PassengerInfo {
  name: string;
  email: string;
  phone: string;
  document: string;
  documentType: 'cpf' | 'rg';
}

interface SharedFlightBookingConfirmationProps {
  flight: SharedFlight;
  selectedSeat: number;
  passengerInfo: PassengerInfo;
  onBack: () => void;
  onBookingConfirmed: () => void;
}

const SharedFlightBookingConfirmation: React.FC<SharedFlightBookingConfirmationProps> = ({
  flight,
  selectedSeat,
  passengerInfo,
  onBack,
  onBookingConfirmed
}) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'balance' | 'card'>('balance');
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock data - em produção viria do contexto/Supabase
  const userBalance = 5000;
  const seatPrice = 850; // Preço da poltrona compartilhada
  const cardFee = paymentMethod === 'card' ? seatPrice * 0.02 : 0;
  const totalCost = seatPrice + cardFee;

  const handleConfirmBooking = async () => {
    if (paymentMethod === 'balance' && userBalance < totalCost) {
      toast({
        title: "Saldo insuficiente",
        description: "Você não tem saldo suficiente para esta reserva",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simular processamento do pagamento
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onBookingConfirmed();
    } catch (error) {
      toast({
        title: "Erro na reserva",
        description: "Ocorreu um erro ao processar sua reserva",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Confirmar Reserva</h2>
          <p className="text-gray-600">Revise os detalhes e confirme sua reserva</p>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Resumo da Reserva */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-aviation-blue" />
              <span>Resumo da Reserva</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Aeronave:</span>
                <span className="font-medium">{flight.aircraft}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Poltrona:</span>
                <Badge variant="outline" className="text-aviation-blue">
                  {selectedSeat}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Rota</span>
              </div>
              <div className="ml-6 space-y-2">
                <div>
                  <div className="font-medium">{flight.origin}</div>
                  <div className="text-sm text-gray-500">
                    {format(flight.departure, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
                <div className="text-center text-gray-400">↓</div>
                <div>
                  <div className="font-medium">{flight.destination}</div>
                  <div className="text-sm text-gray-500">
                    {format(flight.arrival, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Passageiro</span>
              </div>
              <div className="ml-6 space-y-1">
                <div className="font-medium">{passengerInfo.name}</div>
                <div className="text-sm text-gray-500">{passengerInfo.email}</div>
                <div className="text-sm text-gray-500">{passengerInfo.phone}</div>
                <div className="text-sm text-gray-500">
                  {passengerInfo.documentType.toUpperCase()}: {passengerInfo.document}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Duração</span>
              </div>
              <div className="ml-6">
                <span className="text-sm text-gray-600">
                  {Math.floor((flight.arrival.getTime() - flight.departure.getTime()) / (1000 * 60 * 60))}h 
                  {Math.floor(((flight.arrival.getTime() - flight.departure.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}min
                </span>
              </div>
            </div>

            {flight.stops && flight.stops.length > 0 && (
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm font-medium text-gray-700 mb-1">Escalas:</div>
                <div className="text-sm text-gray-600">{flight.stops.join(', ')}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5 text-aviation-blue" />
              <span>Pagamento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor da poltrona:</span>
                <span className="font-medium">R$ {seatPrice.toLocaleString('pt-BR')}</span>
              </div>
              
              {cardFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa do cartão (2%):</span>
                  <span className="font-medium">R$ {cardFee.toLocaleString('pt-BR')}</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-aviation-blue">R$ {totalCost.toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-700">Método de pagamento:</div>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="balance"
                    checked={paymentMethod === 'balance'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'balance' | 'card')}
                    className="text-aviation-blue focus:ring-aviation-blue"
                  />
                  <Banknote className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium">Saldo da conta</div>
                    <div className="text-sm text-gray-500">
                      Disponível: R$ {userBalance.toLocaleString('pt-BR')}
                    </div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value as 'balance' | 'card')}
                    className="text-aviation-blue focus:ring-aviation-blue"
                  />
                  <CreditCard className="h-4 w-4 text-gray-500" />
                  <div className="flex-1">
                    <div className="font-medium">Cartão de crédito</div>
                    <div className="text-sm text-gray-500">
                      Taxa adicional de 2%
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {paymentMethod === 'balance' && userBalance < totalCost && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="text-sm text-red-700">
                  Saldo insuficiente. Você precisa de mais R$ {(totalCost - userBalance).toLocaleString('pt-BR')}.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleConfirmBooking}
          disabled={isProcessing || (paymentMethod === 'balance' && userBalance < totalCost)}
          className="bg-aviation-gradient hover:opacity-90 text-white text-lg py-3 px-8"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Processando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Confirmar Reserva
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SharedFlightBookingConfirmation;