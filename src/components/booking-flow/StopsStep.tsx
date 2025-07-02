
import React from 'react';
import { Route } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface StopsStepProps {
  stops: string;
  departureDate: string;
  departureTime: string;
  destination: string;
  currentMonth: Date;
  onStopsChange: (stops: string) => void;
  onContinue: () => void;
}

const StopsStep: React.FC<StopsStepProps> = ({
  stops,
  departureDate,
  departureTime,
  destination,
  currentMonth,
  onStopsChange,
  onContinue
}) => {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <Route className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Escalas (opcional)</h2>
        <p className="text-gray-600">Adicione escalas ao seu voo se necessário</p>
      </div>
      
      <div className="max-w-md mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
          <div>
            <strong>Ida:</strong> {departureDate}/{currentMonth.getFullYear()} às {departureTime}
          </div>
          <div>
            <strong>Destino:</strong> {destination}
          </div>
        </div>
        
        <Input
          value={stops}
          onChange={(e) => onStopsChange(e.target.value)}
          placeholder="Ex: Madrid, Londres (opcional)"
          className="text-lg p-4"
          onKeyPress={(e) => e.key === 'Enter' && onContinue()}
        />
        <Button 
          onClick={onContinue}
          className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export default StopsStep;
