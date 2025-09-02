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

const TestValidationExample: React.FC = () => {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  // Simular bookings de teste - CENÁRIO REAL DO USUÁRIO
  const mockBookings = [
    {
      id: 1,
      departure_date: '2024-12-15',
      departure_time: '14:00',
      return_date: '2024-12-15', 
      return_time: '16:00', // Pós-voo termina às 19:00 (16:00 + 3h)
      flight_hours: 2,
      origin: 'São Paulo',
      destination: 'Rio de Janeiro'
    }
  ];

  // Horários de teste - CENÁRIO ESPECÍFICO
  const testTimes = [
    { time: '19:00', description: 'Tentativa às 19:00 (fim do pós-voo)' },
    { time: '19:30', description: 'Tentativa às 19:30 (30min após pós-voo)' },
    { time: '20:00', description: 'Tentativa às 20:00 (1h após pós-voo)' },
    { time: '21:00', description: 'Tentativa às 21:00 (2h após pós-voo)' },
    { time: '22:00', description: 'Tentativa às 22:00 (3h após pós-voo)' }
  ];

  const testValidation = (timeString: string) => {
    const today = new Date('2024-12-15'); // Data fixa para teste
    const [hours, minutes] = timeString.split(':').map(Number);
    const testTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes);
    
    setSelectedTime(testTime);
    
    // Validar o horário
    const result = validarHorarioCalendario(testTime, mockBookings, 2);
    setValidationResult(result);
    
    // console.log('🔍 Teste de validação:');
    // console.log('🔍 Horário testado:', testTime.toLocaleString('pt-BR'));
    // console.log('🔍 Resultado:', result);
    
    // Debug detalhado
    // console.log('🔍 Voo existente: 14:00 - 16:00');
    // console.log('🔍 Pós-voo: 16:00 - 19:00 (3h)');
    // console.log('🔍 Para decolar às', timeString, 'precisa de 3h livres antes');
    // console.log('🔍 Período necessário:', new Date(testTime.getTime() - 3 * 60 * 60 * 1000).toLocaleTimeString('pt-BR'), 'até', testTime.toLocaleTimeString('pt-BR'));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="h-5 w-5 text-blue-600" />
            <span>Teste: Validação das 3 Horas - CENÁRIO REAL</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-800 mb-2">Cenário de Teste (SEU EXEMPLO):</h4>
              <p className="text-sm text-yellow-700">
                <strong>Voo existente:</strong> 14:00 - 16:00 (2h de voo)<br/>
                <strong>Pós-voo:</strong> 16:00 - 19:00 (3h de encerramento)<br/>
                <strong>Próximo voo possível:</strong> 22:00 (3h livres antes)
              </p>
            </div>
            
            <p className="text-gray-600">
              Teste diferentes horários para ver como o sistema valida a regra das 3 horas.
            </p>
            
            {/* Botões de teste */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
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
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Como funciona a validação (SEU CENÁRIO):
              </h4>
              <div className="space-y-2 text-sm text-blue-700">
                <p>• <strong>19:00:</strong> ❌ Indisponível (fim do pós-voo, precisa de 3h livres)</p>
                <p>• <strong>19:30:</strong> ❌ Indisponível (só 30min livre, precisa de 3h)</p>
                <p>• <strong>20:00:</strong> ❌ Indisponível (só 1h livre, precisa de 3h)</p>
                <p>• <strong>21:00:</strong> ❌ Indisponível (só 2h livres, precisa de 3h)</p>
                <p>• <strong>22:00:</strong> ✅ Disponível (3h livres: 19:00-22:00)</p>
              </div>
            </div>

            {/* Fluxo no calendário */}
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                No Calendário Inteligente:
              </h4>
              <div className="space-y-2 text-sm text-green-700">
                <p>• <strong>Slots 19:00, 19:30, 20:00, 21:00:</strong> Aparecem em vermelho com ❌</p>
                <p>• <strong>Tooltip:</strong> "⛔ Indisponível: só pode decolar a partir de 22:00"</p>
                <p>• <strong>Clique bloqueado:</strong> Não consegue selecionar esses horários</p>
                <p>• <strong>Slot 22:00:</strong> Aparece em verde com ✅ e é clicável</p>
              </div>
            </div>

            {/* Debug técnico */}
            <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                Debug Técnico:
              </h4>
              <div className="space-y-2 text-sm text-gray-700">
                <p>• <strong>Pós-voo termina:</strong> 19:00</p>
                <p>• <strong>Para decolar às 20:00:</strong> Precisa de 3h livres (17:00-20:00)</p>
                <p>• <strong>Conflito:</strong> Pós-voo ocupa 16:00-19:00</p>
                <p>• <strong>Resultado:</strong> Só 1h livre (19:00-20:00), precisa de 3h</p>
                <p>• <strong>Solução:</strong> Próximo voo possível às 22:00 (3h livres: 19:00-22:00)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestValidationExample;
