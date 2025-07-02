
import React from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PassengerInfo {
  name: string;
  document: string;
  documentType: 'rg' | 'passaporte';
}

interface PassengerCountStepProps {
  passengersCount: string;
  departureDate: string;
  departureTime: string;
  returnDate: string;
  returnTime: string;
  destination: string;
  selectedSeats: number[];
  onPassengersCountChange: (count: string) => void;
  onContinue: () => void;
}

interface PassengerDetailsStepProps {
  passengersInfo: PassengerInfo[];
  onPassengerInfoChange: (index: number, field: keyof PassengerInfo, value: string) => void;
  onContinue: () => void;
}

export const PassengerCountStep: React.FC<PassengerCountStepProps> = ({
  passengersCount,
  departureDate,
  departureTime,
  returnDate,
  returnTime,
  destination,
  selectedSeats,
  onPassengersCountChange,
  onContinue
}) => {
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!passengersCount.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o número de passageiros.",
        variant: "destructive"
      });
      return;
    }
    
    const count = parseInt(passengersCount);
    if (count <= 0) {
      toast({
        title: "Número inválido",
        description: "O número de passageiros deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    onContinue();
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <Users className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Número de passageiros</h2>
        <p className="text-gray-600">Quantas pessoas viajarão?</p>
      </div>
      
      <div className="max-w-md mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <strong>Ida:</strong> {departureDate} às {departureTime}
          </div>
          <div>
            <strong>Volta:</strong> {returnDate} às {returnTime}
          </div>
          <div>
            <strong>Destino:</strong> {destination}
          </div>
          <div>
            <strong>Assentos:</strong> {selectedSeats.join(', ')}
          </div>
        </div>
        
        <Input
          value={passengersCount}
          onChange={(e) => onPassengersCountChange(e.target.value)}
          placeholder="Ex: 2"
          type="number"
          min="1"
          className="text-lg p-4"
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <Button 
          onClick={handleSubmit}
          className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};

export const PassengerDetailsStep: React.FC<PassengerDetailsStepProps> = ({
  passengersInfo,
  onPassengerInfoChange,
  onContinue
}) => {
  const { toast } = useToast();

  const handleSubmit = () => {
    const incompletePassengers = passengersInfo.some(p => !p.name.trim() || !p.document.trim());
    
    if (incompletePassengers) {
      toast({
        title: "Dados incompletos",
        description: "Por favor, preencha nome e documento de todos os passageiros.",
        variant: "destructive"
      });
      return;
    }
    
    onContinue();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <UserPlus className="h-12 w-12 text-aviation-blue mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Dados dos Passageiros</h2>
        <p className="text-gray-600">Preencha as informações de cada passageiro</p>
      </div>
      
      <div className="max-w-2xl mx-auto space-y-6">
        {passengersInfo.map((passenger, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="font-medium text-lg">Passageiro {index + 1}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo
                </label>
                <Input
                  value={passenger.name}
                  onChange={(e) => onPassengerInfoChange(index, 'name', e.target.value)}
                  placeholder="Nome completo"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={passenger.documentType}
                  onChange={(e) => onPassengerInfoChange(index, 'documentType', e.target.value)}
                  className="w-full h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="rg">RG</option>
                  <option value="passaporte">Passaporte</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {passenger.documentType === 'rg' ? 'RG' : 'Passaporte'}
              </label>
              <Input
                value={passenger.document}
                onChange={(e) => onPassengerInfoChange(index, 'document', e.target.value)}
                placeholder={passenger.documentType === 'rg' ? 'Ex: 12.345.678-9' : 'Ex: BR123456'}
                className="w-full"
              />
            </div>
          </div>
        ))}
        
        <Button 
          onClick={handleSubmit}
          className="w-full bg-aviation-gradient hover:opacity-90 text-white text-lg py-3"
        >
          Continuar
        </Button>
      </div>
    </div>
  );
};
