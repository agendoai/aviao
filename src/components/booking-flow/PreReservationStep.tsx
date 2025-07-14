
import React from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface PreReservationStepProps {
  selectedAircraft: Aircraft;
  destination: string;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  passengersCount: string;
  stops: string;
  currentMonth: Date;
  priorityPosition?: number;
  isProcessing: boolean;
  onCreatePreReservation: () => void;
}

const PreReservationStep: React.FC<PreReservationStepProps> = ({
  selectedAircraft,
  destination,
  departureDate,
  departureTime,
  returnDate,
  returnTime,
  passengersCount,
  stops,
  currentMonth,
  priorityPosition,
  isProcessing,
  onCreatePreReservation
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Clock className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Criar Pré-reserva</h2>
        <p className="text-gray-600">
          Sua posição na fila de prioridades: #{priorityPosition}
        </p>
      </div>
      
      <div className="max-w-lg mx-auto bg-gray-50 rounded-lg p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <span className="text-gray-600">Aeronave:</span>
            <p className="font-medium">{selectedAircraft.name}</p>
          </div>
          <div>
            <span className="text-gray-600">Destino:</span>
            <p className="font-medium">{destination}</p>
          </div>
          <div>
            <span className="text-gray-600">Ida:</span>
            <p className="font-medium">{departureDate} às {departureTime}</p>
          </div>
          <div>
            <span className="text-gray-600">Volta:</span>
            <p className="font-medium">{returnDate} às {returnTime}</p>
          </div>
          <div>
            <span className="text-gray-600">Passageiros:</span>
            <p className="font-medium">{passengersCount}</p>
          </div>
          <div>
            <span className="text-gray-600">Aeronave completa:</span>
            <p className="font-medium">Reserva integral</p>
          </div>
        </div>
        
        {stops && (
          <div>
            <span className="text-gray-600">Escalas:</span>
            <p className="font-medium">{stops}</p>
          </div>
        )}
        
        <div className="border-t pt-4">
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-blue-900 mb-2">🎯 Sistema de Prioridades</h4>
            <p className="text-sm text-blue-700">
              {priorityPosition === 1 
                ? "🎉 Você está em 1º lugar! Confirmação imediata após pagamento."
                : `⏰ Posição #${priorityPosition} - Aguarde 12h para confirmação automática após o pagamento.`
              }
            </p>
          </div>
          
          <Button 
            onClick={onCreatePreReservation}
            className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
            disabled={isProcessing}
          >
            {isProcessing ? 'Criando Pré-reserva...' : '📋 Criar Pré-reserva'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PreReservationStep;
