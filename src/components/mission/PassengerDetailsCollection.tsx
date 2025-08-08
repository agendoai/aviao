import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Minus, ArrowLeft, ArrowRight, User, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Passenger {
  name: string;
  document: string;
  documentType: 'cpf' | 'passport';
}

interface PassengerError {
  name?: string;
  document?: string;
}

interface PassengerDetailsCollectionProps {
  maxPassengers: number;
  onPassengersSubmitted: (passengers: Passenger[]) => void;
  onBack: () => void;
}

const PassengerDetailsCollection: React.FC<PassengerDetailsCollectionProps> = ({
  maxPassengers,
  onPassengersSubmitted,
  onBack
}) => {
  console.log('👥 PassengerDetailsCollection maxPassengers:', maxPassengers);
  
  const [passengers, setPassengers] = useState<Passenger[]>([
    { name: '', document: '', documentType: 'cpf' }
  ]);
  const [errors, setErrors] = useState<PassengerError[]>([]);

  // Funções de validação
  const validateName = (name: string): string | undefined => {
    if (!name.trim()) {
      return 'Nome é obrigatório';
    }
    if (name.trim().length < 3) {
      return 'Nome deve ter pelo menos 3 caracteres';
    }
    if (name.trim().length > 100) {
      return 'Nome deve ter no máximo 100 caracteres';
    }
    if (!/^[a-zA-ZÀ-ÿ\s]+$/.test(name.trim())) {
      return 'Nome deve conter apenas letras';
    }
    return undefined;
  };

  const validateCPF = (cpf: string): string | undefined => {
    if (!cpf.trim()) {
      return 'CPF é obrigatório';
    }
    // Formato brasileiro: XXX.XXX.XXX-XX
    const cpfPattern = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfPattern.test(cpf.trim())) {
      return 'CPF deve estar no formato XXX.XXX.XXX-XX';
    }
    return undefined;
  };

  const validatePassport = (passport: string): string | undefined => {
    if (!passport.trim()) {
      return 'Passaporte é obrigatório';
    }
    // Formato internacional: letras e números, 6-9 caracteres
    const passportPattern = /^[A-Z0-9]{6,9}$/;
    if (!passportPattern.test(passport.trim().toUpperCase())) {
      return 'Passaporte deve ter 6-9 caracteres (letras e números)';
    }
    return undefined;
  };

  const validateDocument = (document: string, documentType: 'cpf' | 'passport'): string | undefined => {
    if (documentType === 'cpf') {
      return validateCPF(document);
    } else if (documentType === 'passport') {
      return validatePassport(document);
    }
    return undefined;
  };

  const validatePassenger = (passenger: Passenger, index: number): PassengerError => {
    const nameError = validateName(passenger.name);
    const documentError = validateDocument(passenger.document, passenger.documentType);
    
    return {
      name: nameError,
      document: documentError
    };
  };

  const validateAllPassengers = (): boolean => {
    const newErrors = passengers.map((passenger, index) => validatePassenger(passenger, index));
    setErrors(newErrors);
    
    const hasErrors = newErrors.some(error => error.name || error.document);
    return !hasErrors;
  };

  const addPassenger = () => {
    if (passengers.length < maxPassengers) {
      setPassengers([...passengers, { name: '', document: '', documentType: 'cpf' }]);
      setErrors([...errors, {}]);
    }
  };

  const removePassenger = (index: number) => {
    if (passengers.length > 1) {
      setPassengers(passengers.filter((_, i) => i !== index));
      setErrors(errors.filter((_, i) => i !== index));
    }
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string) => {
    const updatedPassengers = [...passengers];
    updatedPassengers[index] = { ...updatedPassengers[index], [field]: value };
    setPassengers(updatedPassengers);

    // Validar em tempo real
    const passenger = updatedPassengers[index];
    const newErrors = [...errors];
    newErrors[index] = validatePassenger(passenger, index);
    setErrors(newErrors);
  };

  const handleContinue = () => {
    if (!validateAllPassengers()) {
      toast.error('Por favor, corrija os erros nos dados dos passageiros');
      return;
    }

    // Validar quantidade mínima
    if (passengers.length < 1) {
      toast.error('É necessário pelo menos 1 passageiro');
      return;
    }

    // Validar quantidade máxima
    if (passengers.length > maxPassengers) {
      toast.error(`Máximo de ${maxPassengers} passageiros permitido`);
      return;
    }

    onPassengersSubmitted(passengers);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dados dos Passageiros</h2>
          <p className="text-sm text-gray-600">Informe os dados de todos os passageiros</p>
        </div>
        <Button variant="outline" size="sm" onClick={onBack} className="flex items-center space-x-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </Button>
      </div>

      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-sky-500" />
              <Label className="text-sm font-medium">Passageiros ({passengers.length}/{maxPassengers})</Label>
            </div>
            {passengers.length < maxPassengers && (
              <Button
                variant="outline"
                size="sm"
                onClick={addPassenger}
                className="flex items-center space-x-1 text-xs"
              >
                <Plus className="h-3 w-3" />
                <span>Adicionar</span>
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {passengers.map((passenger, index) => (
              <div key={index} className="p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-sky-500" />
                    <span className="text-sm font-medium">Passageiro {index + 1}</span>
                  </div>
                  {passengers.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removePassenger(index)}
                      className="text-red-600 hover:text-red-700 p-1 h-6 w-6"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Nome Completo</Label>
                    <Input
                      type="text"
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                      placeholder="Nome completo"
                      className={`h-9 text-sm ${errors[index]?.name ? 'border-red-500' : ''}`}
                    />
                    {errors[index]?.name && (
                      <div className="flex items-center space-x-1 mt-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors[index]?.name}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label className="text-xs">Documento</Label>
                    <div className="flex space-x-2">
                      <select
                        value={passenger.documentType}
                        onChange={(e) => {
                          const updatedPassengers = [...passengers];
                          updatedPassengers[index] = {
                            ...updatedPassengers[index],
                            documentType: e.target.value as 'cpf' | 'passport'
                          };
                          setPassengers(updatedPassengers);
                          const newErrors = [...errors];
                          newErrors[index] = validatePassenger(updatedPassengers[index], index);
                          setErrors(newErrors);
                        }}
                        className="h-9 text-sm border rounded-md px-2"
                      >
                        <option value="cpf">CPF</option>
                        <option value="passport">Passaporte</option>
                      </select>
                      <Input
                        type="text"
                        value={passenger.document}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (passenger.documentType === 'cpf') {
                            value = value.replace(/\D/g, ''); // Remove não-dígitos
                            value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
                          } else if (passenger.documentType === 'passport') {
                            value = value.replace(/[^A-Z0-9]/g, ''); // Remove caracteres não-alfanuméricos
                            value = value.toUpperCase();
                          }
                          updatePassenger(index, 'document', value);
                        }}
                        placeholder={passenger.documentType === 'cpf' ? "XXX.XXX.XXX-XX" : "AAA12345"}
                        className={`h-9 text-sm ${errors[index]?.document ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors[index]?.document && (
                      <div className="flex items-center space-x-1 mt-1 text-xs text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        <span>{errors[index]?.document}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-xs text-gray-500 text-center">
            Máximo de {maxPassengers} passageiros por voo
          </div>
        </div>
      </Card>

      {/* Botão Continuar */}
      <div className="flex justify-end">
        <Button 
          onClick={handleContinue}
          className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 text-sm"
        >
          <span>Continuar</span>
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PassengerDetailsCollection; 