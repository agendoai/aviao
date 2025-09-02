import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plane, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Settings
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, addHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import IntelligentMissionCalendar from './IntelligentMissionCalendar';
import { toast } from 'sonner';

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  status: string;
}

const IntelligentCalendarDemo: React.FC = () => {
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | undefined>();
  const [selectedStartTime, setSelectedStartTime] = useState<Date | null>(null);
  const [selectedEndTime, setSelectedEndTime] = useState<Date | null>(null);

  const handleAircraftSelect = (aircraft: Aircraft) => {
    setSelectedAircraft(aircraft);
    toast.success(`Aeronave selecionada: ${aircraft.registration}`);
  };

  const handleTimeSlotSelect = (start: Date, end: Date) => {
    setSelectedStartTime(start);
    setSelectedEndTime(end);
    toast.success(`Horário selecionado: ${format(start, 'dd/MM às HH:mm', { locale: ptBR })}`);
  };

  const handleCreateMission = () => {
    if (!selectedAircraft || !selectedStartTime || !selectedEndTime) {
      toast.error('Selecione uma aeronave e um horário primeiro');
      return;
    }

    toast.success(`Missão criada para ${selectedAircraft.registration} em ${format(selectedStartTime, 'dd/MM às HH:mm', { locale: ptBR })}`);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-sky-600" />
            <span>Calendário Inteligente de Missões - Demonstração</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">🎯 Funcionalidades</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Validação em tempo real de conflitos</li>
                <li>• Bloqueio automático 3h antes e após missões</li>
                <li>• Tooltips informativos em cada slot</li>
                <li>• Mensagens claras de erro e próximas disponibilidades</li>
                <li>• Interface visual intuitiva com cores e ícones</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">🎨 Cores e Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Verde: Disponível</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Plane className="h-4 w-4 text-gray-600" />
                  <span>Cinza: Missão em andamento</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span>Vermelho: Bloqueado (preparação/encerramento)</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário Inteligente */}
      <IntelligentMissionCalendar
        selectedAircraft={selectedAircraft}
        onTimeSlotSelect={handleTimeSlotSelect}
        onAircraftSelect={handleAircraftSelect}
      />

      {/* Resumo da Seleção */}
      {(selectedAircraft || selectedStartTime) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-blue-600" />
              <span>Resumo da Seleção</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {selectedAircraft && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Aeronave Selecionada</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Plane className="h-4 w-4 text-sky-600" />
                      <span className="font-medium">{selectedAircraft.registration}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{selectedAircraft.model}</p>
                    <Badge variant={selectedAircraft.status === 'available' ? 'default' : 'secondary'} className="mt-2">
                      {selectedAircraft.status === 'available' ? 'Disponível' : selectedAircraft.status}
                    </Badge>
                  </div>
                </div>
              )}

              {selectedStartTime && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Horário de Partida</h4>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="font-medium">
                        {format(selectedStartTime, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 mt-1">
                      {format(selectedStartTime, 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}

              {selectedEndTime && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Horário de Retorno</h4>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-purple-600" />
                      <span className="font-medium">
                        {format(selectedEndTime, 'dd/MM/yyyy', { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 mt-1">
                      {format(selectedEndTime, 'HH:mm', { locale: ptBR })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedAircraft && selectedStartTime && selectedEndTime && (
              <div className="mt-4 pt-4 border-t">
                <Button 
                  onClick={handleCreateMission}
                  className="w-full"
                  size="lg"
                >
                  <Plane className="h-4 w-4 mr-2" />
                  Criar Missão
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Informações Técnicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <span>Informações Técnicas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">🔧 Validações do Backend</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Verificação de conflitos em tempo real</li>
                <li>• Validação de período de funcionamento (6h-19h)</li>
                <li>• Cálculo automático de bloqueios (3h antes/depois)</li>
                <li>• Prevenção de missões muito longas (>12h)</li>
                <li>• Mensagens detalhadas de erro</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">🎨 Interface do Frontend</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Tooltips informativos em cada slot</li>
                <li>• Cores intuitivas para diferentes status</li>
                <li>• Navegação semanal fluida</li>
                <li>• Seleção de aeronave integrada</li>
                <li>• Feedback visual imediato</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default IntelligentCalendarDemo;

