import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Plane, MapPin } from 'lucide-react';
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

interface SharedFlightPassengerInfoProps {
  flight: SharedFlight;
  selectedSeat: number;
  onBack: () => void;
  onPassengerInfoSubmitted: (passengerInfo: PassengerInfo) => void;
}

const SharedFlightPassengerInfo: React.FC<SharedFlightPassengerInfoProps> = ({
  flight,
  selectedSeat,
  onBack,
  onPassengerInfoSubmitted
}) => {
  const { toast } = useToast();
  const [passengerInfo, setPassengerInfo] = useState<PassengerInfo>({
    name: '',
    email: '',
    phone: '',
    document: '',
    documentType: 'cpf'
  });

  const handleInputChange = (field: keyof PassengerInfo, value: string) => {
    setPassengerInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!passengerInfo.name.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Nome completo é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!passengerInfo.email.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Email é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!passengerInfo.phone.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Telefone é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    if (!passengerInfo.document.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Documento é obrigatório",
        variant: "destructive"
      });
      return false;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(passengerInfo.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, digite um email válido",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onPassengerInfoSubmitted(passengerInfo);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Informações do Passageiro</h2>
          <p className="text-gray-600">Preencha os dados do passageiro</p>
        </div>
        <Button variant="outline" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Resumo do Voo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5 text-aviation-blue" />
              <span>Resumo do Voo</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Aeronave:</span>
                <span className="font-medium">{flight.aircraft}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Poltrona:</span>
                <Badge variant="outline" className="text-aviation-blue">
                  {selectedSeat}
                </Badge>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Origem</span>
              </div>
              <div className="ml-6">
                <div className="font-medium">{flight.origin}</div>
                <div className="text-sm text-gray-500">
                  {format(flight.departure, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span className="font-medium">Destino</span>
              </div>
              <div className="ml-6">
                <div className="font-medium">{flight.destination}</div>
                <div className="text-sm text-gray-500">
                  {format(flight.arrival, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
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

        {/* Formulário de Passageiro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5 text-aviation-blue" />
              <span>Dados do Passageiro</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Completo*</Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite o nome completo"
                value={passengerInfo.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                placeholder="Digite o email"
                value={passengerInfo.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone*</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={passengerInfo.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="documentType">Tipo de Documento*</Label>
              <select
                id="documentType"
                value={passengerInfo.documentType}
                onChange={(e) => handleInputChange('documentType', e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-aviation-blue focus:border-aviation-blue"
              >
                <option value="cpf">CPF</option>
                <option value="rg">RG</option>
              </select>
            </div>

            <div>
              <Label htmlFor="document">
                {passengerInfo.documentType === 'cpf' ? 'CPF' : 'RG'}*
              </Label>
              <Input
                id="document"
                type="text"
                placeholder={passengerInfo.documentType === 'cpf' ? '000.000.000-00' : '00.000.000-0'}
                value={passengerInfo.document}
                onChange={(e) => handleInputChange('document', e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="pt-4 text-xs text-gray-500">
              * Campos obrigatórios
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button 
          onClick={handleSubmit}
          className="bg-aviation-gradient hover:opacity-90 text-white text-lg py-3 px-8"
        >
          Confirmar e Continuar
        </Button>
      </div>
    </div>
  );
};

export default SharedFlightPassengerInfo;