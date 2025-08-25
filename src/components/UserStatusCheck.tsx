import React, { useEffect, useState } from 'react';
import { AlertTriangle, CreditCard, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

interface UserStatusData {
  user: {
    id: number;
    name: string;
    email: string;
    status: string;
  };
  currentMembership: {
    id: number;
    value: number;
    dueDate: string;
    status: string;
    paymentId: string | null;
  } | null;
  needsPayment: boolean;
  paymentMessage: string;
  canAccessFeatures: boolean;
}

const UserStatusCheck: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [statusData, setStatusData] = useState<UserStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiaCola, setCopiaCola] = useState<string | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserStatus();
    }
  }, [user]);

  const checkUserStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/status/${user.id}`);
      const data = await response.json();
      setStatusData(data);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast.error('Erro ao verificar status do usuário');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    if (!user || !statusData?.currentMembership) return;
    
    setPaying(true);
    try {
      let response;
      let data;
      
      // Se tem paymentId, continuar pagamento existente
      if (statusData.currentMembership.paymentId) {
        response = await fetch(`/api/payments/continue/${statusData.currentMembership.paymentId}`, {
          method: 'POST'
        });
        data = await response.json();
        
        if (response.ok) {
          setQrCode(data.pixQrCodeImage);
          setCopiaCola(data.pixCopiaCola);
          toast.success('QR Code PIX gerado!');
        } else {
          toast.error(data.error || 'Erro ao gerar QR Code');
        }
      } else {
        // Se não tem paymentId, gerar nova cobrança
        response = await fetch(`/api/payments/membership/${user.id}`, {
          method: 'POST'
        });
        data = await response.json();
        
        if (response.ok) {
          setQrCode(data.pixQrCodeImage);
          setCopiaCola(data.pixCopiaCola);
          toast.success('Cobrança Pix gerada!');
        } else {
          toast.error(data.error || 'Erro ao gerar cobrança');
        }
      }
    } catch (error) {
      console.error('Erro ao gerar cobrança:', error);
      toast.error('Erro ao gerar cobrança Pix');
    } finally {
      setPaying(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!statusData?.currentMembership?.paymentId) return;
    
    setCheckingPayment(true);
    try {
      const response = await fetch(`/api/payments/status/${statusData.currentMembership.paymentId}`);
      const data = await response.json();
      
      if (data.status === 'CONFIRMED' || data.status === 'RECEIVED') {
        toast.success('Pagamento confirmado! Atualizando status...');
        setShowSuccessModal(true);
        setTimeout(async () => {
          await checkUserStatus(); // Re-verificar status do usuário
          setShowSuccessModal(false);
        }, 2000);
      } else {
        toast.info('Pagamento ainda não foi confirmado. Tente novamente em alguns segundos.');
      }
    } catch (error) {
      console.error('Erro ao verificar pagamento:', error);
      toast.error('Erro ao verificar status do pagamento');
    } finally {
      setCheckingPayment(false);
    }
  };

  const copyToClipboard = async () => {
    if (!copiaCola) return;
    
    try {
      await navigator.clipboard.writeText(copiaCola);
      toast.success('Código PIX copiado!');
    } catch (error) {
      toast.error('Erro ao copiar código PIX');
    }
  };

  const syncPaymentStatus = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const response = await fetch(`/api/payments/sync-user/${user.id}`, {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        toast.success(`Sincronização concluída: ${data.updated} atualizações`);
        await checkUserStatus(); // Re-verificar status do usuário
      } else {
        toast.error(data.error || 'Erro ao sincronizar');
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar status');
    } finally {
      setSyncing(false);
    }
  };

  // Se está carregando, mostrar loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Verificando status...</p>
        </div>
      </div>
    );
  }

  // Se usuário está ativo, mostrar conteúdo normal
  if (statusData?.canAccessFeatures) {
    return <>{children}</>;
  }

  // Se usuário está inativo, mostrar tela de pagamento
  return (
    <>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Acesso Bloqueado</CardTitle>
            <p className="text-gray-600 text-sm">
              Sua mensalidade está em atraso. Faça o pagamento para continuar usando o sistema.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Status da Mensalidade */}
            {statusData?.currentMembership && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Status da Mensalidade</span>
                  <Badge variant="destructive">
                    {statusData.currentMembership.status === 'pendente' ? 'PENDENTE' : 'ATRASADA'}
                  </Badge>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Valor:</span>
                    <span className="font-medium">R$ {statusData.currentMembership.value.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vencimento:</span>
                    <span className="font-medium">
                      {new Date(statusData.currentMembership.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* QR Code PIX */}
            {qrCode ? (
              <div className="space-y-4">
                <div className="text-center">
                  <img 
                    src={qrCode}
                    alt="QR Code PIX" 
                    className="mx-auto w-48 h-48 border rounded-lg"
                  />
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={copyToClipboard}
                    variant="outline" 
                    className="w-full"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Copiar Código PIX
                  </Button>
                  
                  <Button 
                    onClick={checkPaymentStatus}
                    disabled={checkingPayment}
                    className="w-full"
                  >
                    {checkingPayment ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verificar Pagamento
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                onClick={handlePay}
                disabled={paying}
                className="w-full"
              >
                {paying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    {statusData?.currentMembership?.paymentId ? 'Continuar Pagamento' : 'Pagar para Continuar'}
                  </>
                )}
              </Button>
            )}

            {/* Informações */}
            <div className="space-y-2">
              <Button 
                onClick={syncPaymentStatus}
                disabled={syncing}
                variant="outline"
                className="w-full"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Sincronizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sincronizar Status
                  </>
                )}
              </Button>
            </div>

            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>• Pague via PIX para reativar sua conta</p>
              <p>• Após o pagamento, clique em "Verificar Pagamento"</p>
              <p>• Seu acesso será liberado automaticamente</p>
              <p>• Use "Sincronizar Status" para verificar mudanças no Asaas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Sucesso */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center max-w-sm mx-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Pagamento Confirmado!
            </h3>
            <p className="text-gray-600 mb-4">
              Seu pagamento foi processado com sucesso. Redirecionando para o dashboard...
            </p>
            <div className="flex justify-center">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserStatusCheck;
