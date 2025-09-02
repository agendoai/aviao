import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';

import { toast } from 'sonner';
import { Clock, CreditCard, CheckCircle } from 'lucide-react';

interface PendingPayment {
  id: number;
  paymentId: string;
  value: number;
  dueDate: string;
  status: string;
  createdAt: string;
}

export function PendingPayments() {
  const { user } = useAuth();
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [continuingPayment, setContinuingPayment] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiaCola, setCopiaCola] = useState<string | null>(null);

  // Função utilitária para fazer chamadas HTTP
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://72.60.62.143:4000';
    
    const response = await fetch(`${backendUrl}/api${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  };

  useEffect(() => {
    if (user?.id) {
      fetchPendingPayments();
    }
  }, [user?.id]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`/payments/pending/${user?.id}`);
      setPendingPayments(response);
    } catch (error) {
      console.error('Erro ao buscar pagamentos pendentes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContinuePayment = async (paymentId: string) => {
    try {
      setContinuingPayment(paymentId);
      const response = await apiCall(`/payments/continue/${paymentId}`, {
        method: 'POST'
      });
      
      if (response.status === 'confirmada') {
        toast.success('✅ Pagamento já foi confirmado!');
        fetchPendingPayments();
        return;
      }

      setQrCode(response.pixQrCodeImage);
      setCopiaCola(response.pixCopiaCola);
      
      // Iniciar polling para verificar status
      startPaymentPolling(paymentId);
      
    } catch (error) {
      console.error('Erro ao continuar pagamento:', error);
      toast.error('Erro ao continuar pagamento');
    } finally {
      setContinuingPayment(null);
    }
  };

  const startPaymentPolling = (paymentId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await apiCall(`/payments/membership/status/${paymentId}`);
        const status = response.status;
        
        if (status === 'RECEIVED' || status === 'CONFIRMED') {
          clearInterval(interval);
          toast.success('✅ Pagamento confirmado!');
          setQrCode(null);
          setCopiaCola(null);
          fetchPendingPayments();
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000);

    // Limpar intervalo após 5 minutos
    setTimeout(() => {
      clearInterval(interval);
    }, 5 * 60 * 1000);
  };

  const copyToClipboard = () => {
    if (copiaCola) {
      navigator.clipboard.writeText(copiaCola);
      toast.success('Código PIX copiado!');
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

  if (pendingPayments.length === 0) {
    return null;
  }

    return (
    <div className="space-y-2">
      <Card className="border-yellow-200">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-sm">
            <Clock className="h-4 w-4 text-yellow-600" />
            Pagamentos Pendentes
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Alert className="border-yellow-200 bg-yellow-50 mb-3">
            <AlertDescription className="text-yellow-800 text-xs">
              Complete o pagamento para continuar usando o sistema.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            {pendingPayments.map((payment) => {
              const createdAt = new Date(payment.createdAt);
              const now = new Date();
              const hoursElapsed = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60));
              const hoursRemaining = 24 - hoursElapsed;
              
              return (
                <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 border rounded-lg bg-white">
                  <div className="flex-1 min-w-0">
                                         <div className="flex items-center justify-between mb-1">
                       <p className="font-semibold text-sm">R$ {payment.value.toFixed(2)}</p>
                       <div className="flex items-center gap-1">
                         {payment.status === 'processando' && (
                           <span className="text-xs text-blue-600 font-medium">
                             🔄 Processando
                           </span>
                         )}
                         <p className="text-xs text-orange-600 font-medium">
                           ⏰ {hoursRemaining}h restantes
                         </p>
                       </div>
                     </div>
                    <p className="text-xs text-gray-600 mb-1">
                      Venc: {new Date(payment.dueDate).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      Criado: {createdAt.toLocaleDateString('pt-BR')} {createdAt.toLocaleTimeString('pt-BR', {
  hour: '2-digit', 
  minute: '2-digit'
})}
                    </p>
                  </div>
                                     <Button
                     onClick={() => handleContinuePayment(payment.paymentId)}
                     disabled={continuingPayment === payment.paymentId || payment.status === 'processando'}
                     size="sm"
                     className={`mt-2 sm:mt-0 sm:ml-2 text-xs h-8 px-3 ${
                       payment.status === 'processando' 
                         ? 'bg-gray-400 cursor-not-allowed' 
                         : 'bg-blue-600 hover:bg-blue-700'
                     }`}
                   >
                     {continuingPayment === payment.paymentId 
                       ? 'Carregando...' 
                       : payment.status === 'processando' 
                         ? 'Processando...' 
                         : 'Continuar'
                     }
                   </Button>
                </div>
              );
            })}
          </div>

          {/* QR Code Modal */}
          {qrCode && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-center mb-2">
                <h4 className="text-xs font-semibold text-gray-800 mb-2">Complete o Pagamento</h4>
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="QR Code Pix" 
                  className="mx-auto w-20 h-20 border border-gray-300 rounded-lg" 
                />
              </div>
              
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 text-xs h-8"
                  onClick={copyToClipboard}
                >
                  📋 Copiar código Pix
                </Button>
                
                <div className="text-xs text-gray-500 bg-white p-2 rounded border">
                  <div className="font-medium text-gray-700 mb-1 text-xs">Código PIX:</div>
                  <div className="bg-gray-50 p-2 rounded border max-h-16 overflow-y-auto break-all font-mono text-xs">
                    {copiaCola}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
