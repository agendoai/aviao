import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { validarHorarioCalendario } from '@/services/missionValidator';

interface IntelligentTimeSelectionExampleProps {
  bookings: any[];
}

const IntelligentTimeSelectionExample: React.FC<IntelligentTimeSelectionExampleProps> = ({ bookings }) => {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Horários de exemplo para testar
  const testTimes = [
    { time: '08:00', description: 'Horário cedo - pode ter conflito com voo anterior' },
    { time: '12:00', description: 'Horário meio-dia - geralmente disponível' },
    { time: '15:00', description: 'Horário tarde - pode ter conflito com voo posterior' },
    { time: '18:00', description: 'Horário noite - pode ter restrições' }
  ];

  const testValidation = (timeString: string) => {
    const today = new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const testTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    setSelectedTime(testTime);
    
    // Validar o horário
    const result = validarHorarioCalendario(testTime, bookings, 2);
    setValidationResult(result);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span>Exemplo: Validação Inteligente no Calendário</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Este exemplo demonstra como o sistema valida horários no calendário inteligente, 
              verificando se há 3 horas livres antes do horário selecionado.
            </p>
            
            {/* Botões de teste */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {testTimes.map((test, index) => (
                <Button
                  key={index}
                  variant="outline"
                  onClick={() => testValidation(test.time)}
                  className="flex flex-col items-center space-y-1 h-auto py-3"
                >
                  <span className="font-medium">{test.time}</span>
                  <span className="text-xs text-gray-500 text-center">{test.description}</span>
                </Button>
              ))}
            </div>

            {/* Resultado da validação */}
            {selectedTime && validationResult && (
              <div className={`mt-4 p-4 rounded-lg border ${
                validationResult.valido 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {validationResult.valido ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium mb-2">
                      Teste: {format(selectedTime, 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
                    </h4>
                    <p className="text-sm mb-2">{validationResult.mensagem}</p>
                    
                    {!validationResult.valido && validationResult.sugerido && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <p className="text-sm font-medium text-blue-800 mb-2">
                          💡 Sugestão do Sistema:
                        </p>
                        <p className="text-sm text-blue-700">
                          Próximo horário disponível: {format(validationResult.sugerido, 'dd/MM/yyyy às HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Explicação da regra */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Como funciona no calendário:
              </h4>
              <div className="space-y-2 text-sm text-yellow-700">
                <p>• <strong>Clique em um horário:</strong> Sistema verifica automaticamente se há 3h livres antes</p>
                <p>• <strong>Horário válido:</strong> Fica azul selecionado e pode prosseguir</p>
                <p>• <strong>Horário inválido:</strong> Mostra mensagem vermelha com explicação</p>
                <p>• <strong>Sugestões automáticas:</strong> Sistema oferece próximos horários disponíveis</p>
                <p>• <strong>Botões de sugestão:</strong> Clique para selecionar automaticamente</p>
              </div>
            </div>

            {/* Fluxo de uso */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Fluxo de Uso no Calendário:
              </h4>
              <div className="space-y-2 text-sm text-blue-700">
                <p>1. <strong>Selecione uma aeronave</strong> no topo do calendário</p>
                <p>2. <strong>Navegue pelas semanas</strong> usando as setas</p>
                <p>3. <strong>Clique em um horário verde</strong> (disponível)</p>
                <p>4. <strong>Sistema valida automaticamente</strong> as 3 horas necessárias</p>
                <p>5. <strong>Se válido:</strong> Horário fica azul selecionado</p>
                <p>6. <strong>Se inválido:</strong> Aparece mensagem com sugestões</p>
                <p>7. <strong>Clique em uma sugestão</strong> para selecionar automaticamente</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentTimeSelectionExample;

