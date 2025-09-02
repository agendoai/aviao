
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';
import { deleteAllBookings } from '@/utils/api';
import { toast } from 'sonner';

const SystemSettings: React.FC = () => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAllBookings = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso irá deletar TODAS as missões do sistema. Esta ação não pode ser desfeita. Tem certeza?')) {
      return;
    }

    try {
      setIsDeleting(true);
      const result = await deleteAllBookings();
      
      toast.success(`✅ ${result.message}`);
      // console.log('Missões deletadas:', result);
      
      // Recarregar a página para atualizar o calendário
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao deletar missões:', error);
      toast.error('❌ Erro ao deletar missões');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
      </div>

      {/* Seção de Testes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Área de Testes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h3 className="font-medium text-orange-800 mb-2">⚠️ Limpeza de Dados</h3>
            <p className="text-sm text-orange-700 mb-4">
              Esta seção permite limpar dados para testes. Use com cuidado!
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white border border-orange-200 rounded">
                <div>
                  <h4 className="font-medium text-gray-900">Deletar Todas as Missões</h4>
                  <p className="text-sm text-gray-600">
                    Remove todas as missões do sistema para testar o calendário limpo
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAllBookings}
                  disabled={isDeleting}
                  className="flex items-center gap-2"
                >
                  {isDeleting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  {isDeleting ? 'Deletando...' : 'Deletar Tudo'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Versão</h4>
              <p className="text-sm text-gray-600">1.0.0</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Ambiente</h4>
              <p className="text-sm text-gray-600">Desenvolvimento</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
