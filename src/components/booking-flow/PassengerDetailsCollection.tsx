import React, { useState } from 'react';
import { Users, User, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export interface PassengerInfo {
  name: string;
  documentNumber: string;
  documentType: 'rg' | 'passaporte';
}

interface PassengerDetailsCollectionProps {
  passengersCount: number;
  passengersInfo: PassengerInfo[];
  onPassengerInfoChange: (index: number, field: keyof PassengerInfo, value: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const PassengerDetailsCollection: React.FC<PassengerDetailsCollectionProps> = ({
  passengersCount,
  passengersInfo,
  onPassengerInfoChange,
  onContinue,
  onBack
}) => {
  const { toast } = useToast();

  const handleSubmit = () => {
    const incompletePassengers = passengersInfo.some(p => !p.name.trim() || !p.documentNumber.trim());
    
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
    <Card className="aviation-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-aviation-blue" />
          <span>Informações dos Passageiros</span>
        </CardTitle>
        <CardDescription>
          Preencha as informações de todos os {passengersCount} passageiros
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-blue-800">Documentos aceitos:</span>
          </div>
          <p className="text-sm text-blue-700">
            • RG (Registro Geral) - Para voos nacionais<br/>
            • Passaporte - Para voos internacionais ou quando necessário
          </p>
        </div>

        <div className="space-y-6">
          {Array.from({ length: passengersCount }).map((_, index) => {
            const passenger = passengersInfo[index] || { name: '', documentNumber: '', documentType: 'rg' as const };
            
            return (
              <div key={index} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <div className="flex items-center space-x-2 mb-4">
                  <User className="h-5 w-5 text-aviation-blue" />
                  <h3 className="font-medium text-lg">Passageiro {index + 1}</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <Input
                      value={passenger.name}
                      onChange={(e) => onPassengerInfoChange(index, 'name', e.target.value)}
                      placeholder="Digite o nome completo"
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Documento *
                    </label>
                    <Select
                      value={passenger.documentType}
                      onValueChange={(value: 'rg' | 'passaporte') => onPassengerInfoChange(index, 'documentType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rg">RG</SelectItem>
                        <SelectItem value="passaporte">Passaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {passenger.documentType === 'rg' ? 'Número do RG' : 'Número do Passaporte'} *
                    </label>
                    <Input
                      value={passenger.documentNumber}
                      onChange={(e) => onPassengerInfoChange(index, 'documentNumber', e.target.value)}
                      placeholder={passenger.documentType === 'rg' ? 'Ex: 12.345.678-9' : 'Ex: BR123456789'}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex space-x-4">
          <Button 
            onClick={onBack}
            variant="outline"
            className="flex-1"
          >
            Voltar
          </Button>
          <Button 
            onClick={handleSubmit}
            className="flex-1 bg-aviation-gradient hover:opacity-90 text-white"
          >
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PassengerDetailsCollection;
