import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  DollarSign, 
  QrCode,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { convertBrazilianDateToUTCString } from '@/utils/dateUtils';
import { buildApiUrl } from '@/config/api';
import { useAuth } from '@/hooks/use-auth';

interface PaymentStepProps {
  aircraft: any;
  origin: string;
  destination: string;
  departureDate: Date;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  passengers: Array<{name: string, document: string, documentType: 'rg' | 'passport'}>;
  flightHours: number;
  overnightStays: number;
  distance: number;
  airportFees?: number;
  feeBreakdown?: { [icao: string]: any };
  onPaymentCompleted: () => void;
  onBack: () => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  aircraft,
  origin,
  destination,
  departureDate,
  departureTime,
  returnDate,
  returnTime,
  passengers,
  flightHours,
  overnightStays,
  distance,
  airportFees = 0,
  feeBreakdown = {},
  onPaymentCompleted,
  onBack
}) => {
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [showPixModal, setShowPixModal] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [copiaCola, setCopiaCola] = useState<string>('');
  const [paymentId, setPaymentId] = useState<string>('');
  const [paying, setPaying] = useState(false);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<any>(null);



  // Garantir que os valores são números válidos
  const hourlyRate = Number(aircraft.hourly_rate) || 0;
  const overnightFee = Number(aircraft.overnight_fee) || 0;
  const flightHoursNum = Number(flightHours) || 0;
  const overnightStaysNum = Number(overnightStays) || 0;

  const hourlyCost = hourlyRate * flightHoursNum;
  const overnightCost = overnightFee * overnightStaysNum;
  const totalCost = hourlyCost + overnightCost + airportFees;



  // Função para gerar PIX
  const handleGeneratePix = async () => {
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    setPaying(true);
    
    try {
      // Preparar dados da missão
      const departureDateTime = new Date(`${format(departureDate, 'yyyy-MM-dd')}T${departureTime}:00`);
      const returnDateTime = new Date(returnDate ? `${returnDate}T${returnTime}:00` : `${format(departureDate, 'yyyy-MM-dd')}T${returnTime}:00`);
      
      const missionData = {
        aircraftId: aircraft.id,
        origin,
        destination,
        secondaryDestination: null, // Missões solo não têm destino secundário
        departure_date: convertBrazilianDateToUTCString(departureDateTime),
        return_date: convertBrazilianDateToUTCString(returnDateTime),
        passengers: passengers.length,
        flight_hours: flightHours,
        overnight_stays: overnightStays,
        value: totalCost,
        status: 'pendente'
      };

      // Chamar API para criar PIX
      const response = await fetch(buildApiUrl('/api/bookings/pix-payment'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(missionData)
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar PIX');
      }

      const data = await response.json();
      
      setQrCode(data.qrCode);
      setCopiaCola(data.copiaCola);
      setPaymentId(data.paymentId);
      setShowPixModal(true);
      
      toast.success('QR Code PIX gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      toast.error('Erro ao gerar PIX. Tente novamente.');
    } finally {
      setPaying(false);
    }
  };

  // Função para verificar pagamento
  const handleVerifyPayment = async () => {
    if (!paymentId) return;
    
    try {
      const response = await fetch(buildApiUrl(`/api/bookings/pix-payment/${paymentId}/verify`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar pagamento');
      }

      const data = await response.json();
      
      if (data.status === 'confirmada') {
        setPaymentSuccessData(data);
        setShowPaymentSuccess(true);
        setShowPixModal(false);
        toast.success('Pagamento confirmado! Missão criada com sucesso!');
        onPaymentCompleted();
      } else {
        toast.error('Pagamento ainda não foi confirmado');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar pagamento');
    }
  };

  // Função para copiar código PIX
  const handleCopyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(copiaCola);
      toast.success('Código PIX copiado!');
    } catch (error) {
      toast.error('Erro ao copiar código');
    }
  };

  // Verificação automática de pagamento
  useEffect(() => {
    if (showPixModal && paymentId) {
      const interval = setInterval(() => {
        handleVerifyPayment();
      }, 5000); // Verificar a cada 5 segundos

      return () => clearInterval(interval);
    }
  }, [showPixModal, paymentId]);

  const handlePayment = async () => {
    // Agora chama a geração de PIX
    await handleGeneratePix();
  };



  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Pagamento</h2>
          <p className="text-sm text-gray-600">Escolha a forma de pagamento</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      {/* Resumo da Missão */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Plane className="h-4 w-4 text-sky-500" />
            <span className="text-sm font-medium">Resumo da Missão</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <MapPin className="h-3 w-3 text-gray-400" />
              <span><span className="font-medium">Rota:</span> {origin} → {destination}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span><span className="font-medium">Data:</span> {format(departureDate, 'dd/MM/yyyy', { locale: ptBR })}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-gray-400" />
              <span><span className="font-medium">Horário:</span> {departureTime} - {returnTime}</span>
              {overnightStays > 0 && (
                <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                  Pernoite
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-3 w-3 text-gray-400" />
              <span><span className="font-medium">Passageiros:</span> {passengers.length}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Detalhamento de Custos */}
      <Card className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-sky-500" />
            <span className="text-sm font-medium">Detalhamento de Custos</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Distância: {distance.toFixed(1)} NM</span>
            </div>
            
            <div className="flex justify-between">
              <span>Data de Ida: {format(departureDate, 'dd/MM/yyyy')}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Horário de Ida: {departureTime}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Data de Volta: {returnDate && returnDate.trim() !== '' ? format(new Date(`${returnDate}T00:00:00`), 'dd/MM/yyyy') : format(departureDate, 'dd/MM/yyyy')}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Horário de Volta: {returnTime}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Tempo de voo ({Math.floor(flightHoursNum)}h{flightHoursNum % 1 > 0 ? ` ${Math.round((flightHoursNum % 1) * 60)}min` : ''} × R$ {hourlyRate.toLocaleString('pt-BR')})</span>
              <span>R$ {hourlyCost.toLocaleString('pt-BR')}</span>
            </div>
            
            {overnightStaysNum > 0 && (
              <div className="flex justify-between">
                <span>Taxa de pernoite ({overnightStaysNum} {overnightStaysNum > 1 ? 'noites' : 'noite'} × R$ {overnightFee.toLocaleString('pt-BR')})</span>
                <span>R$ {overnightCost.toLocaleString('pt-BR')}</span>
              </div>
            )}
            
                         {airportFees > 0 && (
               <div className="flex justify-between">
                 <span>Taxas aeroportuárias (destinos)</span>
                 <span>R$ {airportFees.toLocaleString('pt-BR')}</span>
               </div>
             )}
            
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>R$ {totalCost.toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Métodos de Pagamento */}
      <Card className="p-4">
        <div className="space-y-3">
          <span className="text-sm font-medium">Forma de Pagamento</span>
          
          <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200">
            <div className="flex items-center space-x-2">
              <QrCode className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">PIX</span>
            </div>
            <p className="text-xs text-green-600 mt-1">Pagamento instantâneo via PIX</p>
            <div className="mt-2">
              <Badge className="text-xs bg-green-600 text-white">
                Disponível
              </Badge>
            </div>
          </div>
          
          <div className="text-xs text-green-600 text-center">
            Pague via PIX e sua missão será criada automaticamente
          </div>
        </div>
      </Card>

      {/* Botão de Pagamento */}
      <div className="flex justify-end">
        <Button 
          onClick={handlePayment}
          disabled={paying}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 text-sm"
        >
          {paying ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando PIX...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              <span>Pagar via PIX</span>
            </>
          )}
        </Button>
      </div>

      {/* Modal PIX */}
      {showPixModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg w-full max-w-sm md:max-w-md p-4 md:p-6">
            <div className="text-center mb-4 md:mb-6">
              <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">Pagamento PIX</h3>
              <p className="text-xs md:text-sm text-gray-600">Escaneie o QR Code ou copie o código PIX</p>
            </div>

            {/* QR Code */}
            {qrCode && (
              <div className="text-center mb-4 md:mb-6">
                <div className="bg-gray-50 p-2 md:p-3 rounded-lg mb-3 md:mb-4">
                  <img 
                    src={qrCode} 
                    alt="QR Code PIX" 
                    className="mx-auto w-32 h-32 md:w-40 md:h-40"
                  />
                </div>
              </div>
            )}

            {/* Código PIX */}
            {copiaCola && (
              <div className="mb-4 md:mb-6">
                <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                  Código PIX (Copie e Cole):
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={copiaCola}
                    readOnly
                    className="flex-1 h-16 md:h-20 px-3 py-2 border border-gray-300 rounded-lg text-xs md:text-sm font-mono bg-gray-50"
                  />
                  <Button
                    onClick={handleCopyPixCode}
                    variant="outline"
                    className="px-3 py-2 h-16 md:h-20"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Botões de ação */}
            <div className="flex space-x-2">
              <Button
                onClick={handleVerifyPayment}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                disabled={paying}
              >
                {paying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar Pagamento'
                )}
              </Button>
              <Button
                onClick={() => setShowPixModal(false)}
                variant="outline"
                className="flex-1"
              >
                Fechar
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center mt-4">
              O pagamento será verificado automaticamente a cada 5 segundos
            </div>
          </div>
        </div>
      )}

      {/* Tela de Sucesso */}
      {showPaymentSuccess && paymentSuccessData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
          <div className="bg-white rounded-lg w-full max-w-sm md:max-w-md p-6 text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              Pagamento Confirmado!
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Sua missão foi criada com sucesso e está confirmada no sistema.
            </p>
            <div className="bg-green-50 p-3 rounded-lg mb-4">
              <div className="text-xs text-green-800">
                <div className="font-medium">Missão #{paymentSuccessData.id}</div>
                <div>Status: Confirmada</div>
                <div>Valor: R$ {paymentSuccessData.value?.toLocaleString('pt-BR')}</div>
              </div>
            </div>
            <Button
              onClick={() => {
                setShowPaymentSuccess(false);
                setPaymentSuccessData(null);
              }}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              Continuar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentStep; 
