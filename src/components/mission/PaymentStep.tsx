import React, { useState } from 'react';
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
  Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { createBooking } from '@/utils/api';

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
  onPaymentCompleted,
  onBack
}) => {
  const [processing, setProcessing] = useState(false);

  console.log('💰 PaymentStep received returnDate:', returnDate);
  console.log('💰 PaymentStep received returnTime:', returnTime);
  console.log('💰 PaymentStep received overnightStays:', overnightStays);
  console.log('💰 PaymentStep returnDate type:', typeof returnDate);
  console.log('💰 PaymentStep returnDate length:', returnDate?.length);
  console.log('💰 PaymentStep returnDate value:', returnDate);
  console.log('💰 PaymentStep aircraft:', aircraft);
  console.log('💰 PaymentStep aircraft hourly_rate:', aircraft.hourly_rate);
  console.log('💰 PaymentStep aircraft overnight_fee:', aircraft.overnight_fee);

  // Garantir que os valores são números válidos
  const hourlyRate = Number(aircraft.hourly_rate) || 0;
  const overnightFee = Number(aircraft.overnight_fee) || 0;
  const flightHoursNum = Number(flightHours) || 0;
  const overnightStaysNum = Number(overnightStays) || 0;

  const hourlyCost = hourlyRate * flightHoursNum;
  const overnightCost = overnightFee * overnightStaysNum;
  const totalCost = hourlyCost + overnightCost;

  console.log('💰 Valores calculados:', {
    hourlyRate,
    overnightFee,
    flightHoursNum,
    overnightStaysNum,
    hourlyCost,
    overnightCost,
    totalCost
  });

  const handlePayment = async () => {
    setProcessing(true);
    
    try {
      // Preparar dados da missão
      const missionData = {
        aircraftId: aircraft.id,
        origin: origin,
        destination: destination,
        departure_date: `${format(departureDate, 'yyyy-MM-dd')}T${departureTime}:00`,
        return_date: returnDate ? `${returnDate}T${returnTime}:00` : `${format(departureDate, 'yyyy-MM-dd')}T${returnTime}:00`,
        passengers: passengers.length,
        flight_hours: flightHours,
        overnight_stays: overnightStays,
        value: totalCost,
        status: 'pendente'
      };

      console.log('🚀 Criando missão com dados:', missionData);

      // Chamar API para criar a missão
      const response = await createBooking(missionData);
      
      console.log('✅ Resposta da API:', response);

      if (response.error) {
        throw new Error(response.error);
      }

      toast.success('Missão criada com sucesso!');
      onPaymentCompleted();
    } catch (error) {
      console.error('❌ Erro ao criar missão:', error);
      toast.error('Erro ao criar missão. Tente novamente.');
    } finally {
      setProcessing(false);
    }
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
              <span>Data de Volta: {(() => {
                console.log('🔍 Formatando data de volta:');
                console.log('🔍 returnDate:', returnDate);
                console.log('🔍 returnDate.trim():', returnDate?.trim());
                console.log('🔍 returnDate.trim() !== "":', returnDate?.trim() !== '');
                if (returnDate && returnDate.trim() !== '') {
                  // Corrigir o problema de fuso horário adicionando T00:00:00
                  const dateWithTime = `${returnDate}T00:00:00`;
                  const formattedDate = format(new Date(dateWithTime), 'dd/MM/yyyy');
                  console.log('🔍 dateWithTime:', dateWithTime);
                  console.log('🔍 new Date(dateWithTime):', new Date(dateWithTime));
                  console.log('🔍 formattedDate:', formattedDate);
                  return formattedDate;
                } else {
                  const fallbackDate = format(departureDate, 'dd/MM/yyyy');
                  console.log('🔍 Usando fallback date:', fallbackDate);
                  return fallbackDate;
                }
              })()}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Horário de Volta: {returnTime}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Taxa horária ({flightHoursNum}h × R$ {hourlyRate.toLocaleString('pt-BR')})</span>
              <span>R$ {hourlyCost.toLocaleString('pt-BR')}</span>
            </div>
            
            {overnightStaysNum > 0 && (
              <div className="flex justify-between">
                <span>Pernoite{overnightStaysNum > 1 ? 's' : ''} ({overnightStaysNum} {overnightStaysNum > 1 ? 'noites' : 'noite'})</span>
                <span>R$ {overnightCost.toLocaleString('pt-BR')}</span>
              </div>
            )}
            
            <div className="border-t pt-2">
              <div className="flex justify-between font-medium">
                <span>Total</span>
                <span>R$ {totalCost.toLocaleString('pt-BR')}</span>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
              Tempo de voo calculado baseado na distância real ({distance.toFixed(1)} NM) e velocidade da {aircraft.model}. 
              <br />
              <span className="font-medium">Inclui ida e volta.</span>
              {overnightStays > 0 && (
                <>
                  <br />
                  <span className="text-orange-600 font-medium">
                    Taxa de pernoite incluída ({overnightStaysNum} {overnightStaysNum > 1 ? 'noites' : 'noite'} × R$ {overnightFee.toLocaleString('pt-BR')}) - após meia-noite ou voo noturno.
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Métodos de Pagamento */}
      <Card className="p-4">
        <div className="space-y-3">
          <span className="text-sm font-medium">Forma de Pagamento</span>
          
          <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="flex items-center space-x-2">
              <QrCode className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-500">PIX</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Pagamento instantâneo (em breve)</p>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Em desenvolvimento
              </Badge>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            Sistema de pagamento será implementado em breve
          </div>
        </div>
      </Card>

      {/* Botão de Pagamento */}
      <div className="flex justify-end">
        <Button 
          onClick={handlePayment}
          disabled={processing}
          className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 text-sm"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <span>Continuar (Sem Pagamento)</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PaymentStep; 