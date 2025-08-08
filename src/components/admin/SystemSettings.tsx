
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const SystemSettings: React.FC = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    defaultHourlyRate: 2800,
    maxPassengers: 8,
    priorityRotationEnabled: true,
    automaticRotationHours: 24,
    overnightFee: 1500,
    cardProcessingFee: 0.02,
    maintenanceBufferHours: 3,
    allowSeatSharing: true,
    requireApproval: false
  });

  const handleSave = async () => {
    try {
      // Simular salvamento das configurações
      // Em um sistema real, isso salvaria no banco de dados
      toast({
        title: "Sucesso",
        description: "Configurações salvas com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    }
  };

  const handleRotatePriorities = async () => {
    try {
      const { error } = await supabase.rpc('rotate_priorities');
      
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Prioridades rotacionadas com sucesso"
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao rotacionar prioridades",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
              <CardDescription>
                Configure os parâmetros gerais do clube de aviação
              </CardDescription>
            </div>
            <Button onClick={handleSave} className="bg-aviation-gradient hover:opacity-90">
              <Save className="h-4 w-4 mr-2" />
              Salvar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sistema de Prioridades */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Sistema de Prioridades</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="priorityRotation">Rotação Automática de Prioridades</Label>
                  <p className="text-sm text-gray-500">Ativar rotação automática das posições de prioridade</p>
                </div>
                <Switch
                  id="priorityRotation"
                  checked={settings.priorityRotationEnabled}
                  onCheckedChange={(checked) => setSettings({...settings, priorityRotationEnabled: checked})}
                />
              </div>
              {settings.priorityRotationEnabled && (
                <div>
                  <Label htmlFor="rotationHours">Intervalo de Rotação (horas)</Label>
                  <Input
                    id="rotationHours"
                    type="number"
                    value={settings.automaticRotationHours}
                    onChange={(e) => setSettings({...settings, automaticRotationHours: parseInt(e.target.value)})}
                  />
                </div>
              )}
              <div className="pt-4">
                <Button 
                  onClick={handleRotatePriorities}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Rotacionar Prioridades Manualmente
                </Button>
              </div>
            </div>
          </div>
          <Separator />
          {/* Configurações Gerais */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Configurações Gerais</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="seatSharing">Permitir Compartilhamento de Assentos</Label>
                  <p className="text-sm text-gray-500">Permite que usuários compartilhem assentos em voos</p>
                </div>
                <Switch
                  id="seatSharing"
                  checked={settings.allowSeatSharing}
                  onCheckedChange={(checked) => setSettings({...settings, allowSeatSharing: checked})}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="requireApproval">Exigir Aprovação Manual</Label>
                  <p className="text-sm text-gray-500">Todas as reservas precisam de aprovação manual</p>
                </div>
                <Switch
                  id="requireApproval"
                  checked={settings.requireApproval}
                  onCheckedChange={(checked) => setSettings({...settings, requireApproval: checked})}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
