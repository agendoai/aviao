import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/utils/api';

interface UserStatus {
  user: {
    id: number;
    name: string;
    email: string;
    status: string;
  };
  memberships: Array<{
    id: number;
    value: number;
    dueDate: string;
    status: string;
    paymentId?: string;
  }>;
  needsPayment: boolean;
  paymentMessage: string;
  canAccessFeatures: boolean;
}

export function UserStatusCheck() {
  const { user } = useAuth();
  const [status, setStatus] = useState<UserStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserStatus();
    }
  }, [user?.id]);

  const fetchUserStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/users/status/${user?.id}`);
      setStatus(response.data);
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user?.id) return;

    try {
      setProcessingPayment(true);
      const response = await api.post(`/payments/membership/${user.id}`);
      
      // Aqui você pode abrir o QR Code em um modal ou nova página
      // console.log('QR Code gerado:', response.data);
      
      // Recarregar status após alguns segundos
      setTimeout(() => {
        fetchUserStatus();
      }, 2000);
      
    } catch (error) {
      console.error('Erro ao gerar pagamento:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!status) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMembershipStatusColor = (status: string) => {
    switch (status) {
      case 'confirmada': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'atrasada': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Status da Conta
            <Badge className={getStatusColor(status.user.status)}>
              {status.user.status === 'active' ? 'Ativo' : 'Inativo'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Nome:</strong> {status.user.name}</p>
            <p><strong>Email:</strong> {status.user.email}</p>
            <p><strong>Acesso às funcionalidades:</strong> 
              <Badge className={status.canAccessFeatures ? 'bg-green-100 text-green-800 ml-2' : 'bg-red-100 text-red-800 ml-2'}>
                {status.canAccessFeatures ? 'Liberado' : 'Bloqueado'}
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      {status.needsPayment && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            <div className="flex items-center justify-between">
              <span>{status.paymentMessage}</span>
              <Button 
                onClick={handlePayment}
                disabled={processingPayment}
                className="bg-red-600 hover:bg-red-700"
              >
                {processingPayment ? 'Processando...' : 'Pagar Mensalidade'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Mensalidades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {status.memberships.map((membership) => (
              <div key={membership.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">R$ {membership.value.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">
                    Vencimento: {new Date(membership.dueDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <Badge className={getMembershipStatusColor(membership.status)}>
                  {membership.status === 'confirmada' ? 'Confirmada' : 
                   membership.status === 'pendente' ? 'Pendente' : 
                   membership.status === 'atrasada' ? 'Atrasada' : membership.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
