import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import AdvancedMissionCalendar from './AdvancedMissionCalendar';
import { toast } from '@/hooks/use-toast';

interface MissionSummary {
  startTime: Date;
  endTime: Date;
  duration: number;
  preparationStart: Date;
  closureEnd: Date;
  nextAvailable: Date;
  isValid: boolean;
  conflicts?: string[];
}

const AdvancedCalendarDemo: React.FC = () => {
  const [selectedStart, setSelectedStart] = useState<Date | null>(null);
  const [selectedEnd, setSelectedEnd] = useState<Date | null>(null);
  const [missionSummary, setMissionSummary] = useState<MissionSummary | null>(null);
  const [missionDuration, setMissionDuration] = useState(2);

  const handleTimeSelect = (startTime: Date, endTime: Date) => {
    setSelectedStart(startTime);
    setSelectedEnd(endTime);
    
    toast({
      title: "Horários Selecionados",
      description: `Partida: ${format(startTime, 'dd/MM/yyyy HH:mm')} - Retorno: ${format(endTime, 'dd/MM/yyyy HH:mm')}`,
    });
  };

  const handleMissionSummary = (summary: MissionSummary) => {
    setMissionSummary(summary);
  };

  const handleCreateMission = () => {
    if (!missionSummary || !missionSummary.isValid) {
      toast({
        title: "Missão Inválida",
        description: "Corrija os conflitos antes de criar a missão",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Missão Criada!",
      description: `Missão agendada com sucesso para ${format(missionSummary.startTime, 'dd/MM/yyyy HH:mm')}`,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚁 Calendário Inteligente de Missões - Demonstração
          </CardTitle>
          <p className="text-sm text-gray-600">
            Sistema avançado de agendamento com validação inteligente, feedback visual e prevenção de conflitos
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duração da Missão (horas)</label>
              <select 
                value={missionDuration}
                onChange={(e) => setMissionDuration(Number(e.target.value))}
                className="w-full p-2 border rounded"
              >
                <option value={0.5}>30 minutos</option>
                <option value={1}>1 hora</option>
                <option value={2}>2 horas</option>
                <option value={4}>4 horas</option>
                <option value={8}>8 horas</option>
                <option value={12}>12 horas</option>
                <option value={24}>24 horas</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Disponível
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  Ocupado
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Selecionado
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Ações</label>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={() => {
                    setSelectedStart(null);
                    setSelectedEnd(null);
                    setMissionSummary(null);
                  }}
                >
                  Limpar Seleção
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    const now = new Date();
                    const start = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h daqui
                    const end = new Date(start.getTime() + missionDuration * 60 * 60 * 1000);
                    handleTimeSelect(start, end);
                  }}
                >
                  Sugerir Horário
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendário Principal */}
        <div className="lg:col-span-2">
          <AdvancedMissionCalendar
            onTimeSelect={handleTimeSelect}
            onMissionSummary={handleMissionSummary}
            selectedStart={selectedStart || undefined}
            selectedEnd={selectedEnd || undefined}
            missionDuration={missionDuration}
          />
        </div>

        {/* Painel de Informações */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">📋 Resumo da Missão</CardTitle>
            </CardHeader>
            <CardContent>
              {missionSummary ? (
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Detalhes da Missão</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div><strong>Partida:</strong> {format(missionSummary.startTime, 'dd/MM/yyyy HH:mm')}</div>
                      <div><strong>Retorno:</strong> {format(missionSummary.endTime, 'dd/MM/yyyy HH:mm')}</div>
                      <div><strong>Duração:</strong> {missionSummary.duration.toFixed(1)} horas</div>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">Janelas de Bloqueio</h4>
                    <div className="text-sm text-yellow-800 space-y-1">
                      <div><strong>Preparação:</strong> {format(missionSummary.preparationStart, 'dd/MM/yyyy HH:mm')}</div>
                      <div><strong>Encerramento:</strong> {format(missionSummary.closureEnd, 'dd/MM/yyyy HH:mm')}</div>
                      <div><strong>Próxima disponibilidade:</strong> {format(missionSummary.nextAvailable, 'dd/MM/yyyy HH:mm')}</div>
                    </div>
                  </div>

                  {missionSummary.conflicts && missionSummary.conflicts.length > 0 ? (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-900 mb-2">⚠️ Conflitos Detectados</h4>
                      <div className="text-sm text-red-800 space-y-1">
                        {missionSummary.conflicts.map((conflict, index) => (
                          <div key={index}>• {conflict}</div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">✅ Missão Válida</h4>
                      <div className="text-sm text-green-800">
                        Nenhum conflito detectado. A missão pode ser criada.
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={handleCreateMission}
                    disabled={!missionSummary.isValid}
                  >
                    {missionSummary.isValid ? 'Criar Missão' : 'Corrigir Conflitos'}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-2">📅</div>
                  <p>Selecione um horário no calendário para ver o resumo da missão</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">ℹ️ Como Usar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Verde:</strong> Horários disponíveis para agendamento
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Cinza:</strong> Missões existentes ou períodos bloqueados
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Azul:</strong> Sua seleção atual
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <strong>Vermelho:</strong> Conflitos detectados
                  </div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div><strong>Clique:</strong> Selecionar horário de partida</div>
                <div><strong>Arraste:</strong> Selecionar intervalo de tempo</div>
                <div><strong>Hover:</strong> Ver detalhes do slot</div>
                <div><strong>Navegação:</strong> Usar setas para mudar semana</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">🔧 Funcionalidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Validação inteligente de conflitos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Feedback visual em tempo real</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Tooltips informativos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Prevenção de agendamentos impossíveis</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Sugestões automáticas de horários</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Cálculo automático de buffers</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdvancedCalendarDemo;




