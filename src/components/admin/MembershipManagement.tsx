import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Trash2, RefreshCw, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function MembershipManagement() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleAdminAction = async (action: string, endpoint: string) => {
    setLoading(action);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${backendUrl}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error || 'Erro ao executar ação');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro de conexão');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Gestão de Mensalidades</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Geração Automática
            </CardTitle>
            <CardDescription>
              Gerenciar mensalidades e cobranças automáticas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full"
              onClick={() => handleAdminAction('generate', 'generate-monthly-charges')}
              disabled={loading === 'generate'}
            >
              {loading === 'generate' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Gerar Mensalidades
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => handleAdminAction('clean', 'clean-duplicate-memberships')}
              disabled={loading === 'clean'}
            >
              {loading === 'clean' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Limpando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Duplicatas
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status do Sistema
            </CardTitle>
            <CardDescription>
              Informações sobre automação e cron jobs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Automação ativa</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Próxima execução: 09:00</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Limpeza: Domingos 02:00</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">🤖 Sistema Inteligente de Mensalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
              <div>
                <strong>Geração Automática:</strong> Mensalidades criadas todos os dias às 9h
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
              <div>
                <strong>Limpeza Automática:</strong> Duplicatas removidas todo domingo às 2h
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
              <div>
                <strong>PIX Inteligente:</strong> Cobranças geradas apenas quando usuário solicita
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 text-green-600" />
              <div>
                <strong>Timing Correto:</strong> Mensalidades aparecem no mês correto
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">📋 Como Funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-yellow-700">
            <p><strong>1.</strong> Usuário se registra → Mensalidade do mês atual criada</p>
            <p><strong>2.</strong> Usuário paga → Status atualizado para "confirmada"</p>
            <p><strong>3.</strong> Script diário → Verifica se precisa criar nova mensalidade</p>
            <p><strong>4.</strong> Usuário clica "Pagar" → PIX gerado na hora (24h válido)</p>
            <p><strong>5.</strong> Limpeza semanal → Remove duplicatas automaticamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}




