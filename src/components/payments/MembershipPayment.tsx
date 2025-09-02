import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { buildApiUrl } from '@/config/api';
import { toast } from 'sonner';

const MembershipPayment: React.FC = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [creatingSubscription, setCreatingSubscription] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiaCola, setCopiaCola] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    if (user) fetchMemberships();
    // eslint-disable-next-line
  }, [user]);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl(`/api/payments/membership/${user.id}`));
      const data = await res.json();
      setMemberships(data);
    } catch {
      toast.error('Erro ao buscar mensalidades');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async () => {
    setPaying(true);
    try {
      const res = await fetch(buildApiUrl(`/api/payments/membership/${user.id}`), { method: 'POST' });
      const data = await res.json();
      setQrCode(data.pixQrCodeImage);
      setCopiaCola(data.pixCopiaCola);
      setPaymentId(data.paymentId);
      setStatus(data.status);
      toast.success('Cobrança Pix gerada!');
    } catch {
      toast.error('Erro ao gerar cobrança Pix');
    } finally {
      setPaying(false);
    }
  };

  const handleCreateSubscription = async () => {
    setCreatingSubscription(true);
    try {
      const res = await fetch(buildApiUrl(`/api/payments/membership/subscription/${user.id}`), { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Assinatura recorrente criada! Você será cobrado automaticamente todo mês.');
        fetchMemberships();
      } else {
        toast.error(data.error || 'Erro ao criar assinatura');
      }
    } catch {
      toast.error('Erro ao criar assinatura recorrente');
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Tem certeza que deseja cancelar a assinatura recorrente?')) return;
    
    try {
      const res = await fetch(buildApiUrl(`/api/payments/membership/subscription/${subscriptionId}/cancel`), { method: 'POST' });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Assinatura cancelada com sucesso!');
        fetchMemberships();
      } else {
        toast.error(data.error || 'Erro ao cancelar assinatura');
      }
    } catch {
      toast.error('Erro ao cancelar assinatura');
    }
  };

  // Função para verificar se o pagamento foi confirmado
  const isPaymentConfirmed = (status: string) => {
    const confirmedStatuses = [
      'CONFIRMED',
      'RECEIVED', 
      'RECEIVED_IN_CASH',
      'PAID',
      'RECEIVED_IN_CASH_UNDONE'
    ];
    
    // Se o status é RECEIVED_IN_CASH_UNDONE, significa que foi desfeito (não confirmado)
    if (status === 'RECEIVED_IN_CASH_UNDONE') {
      return false;
    }
    
    return confirmedStatuses.includes(status);
  };

  // Função para verificar status do pagamento
  const checkPaymentStatus = async () => {
    if (!paymentId) return;
    
    setCheckingPayment(true);
    try {
      const res = await fetch(buildApiUrl(`/api/payments/membership/status/${paymentId}`));
      const data = await res.json();
      setStatus(data.status);
      
      // // console.log('🔍 Status do pagamento:', data.status);
      
      if (isPaymentConfirmed(data.status)) {
        setPaymentConfirmed(true);
        toast.success('Pagamento confirmado!');
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setCheckingPayment(false);
    }
  };

  // Polling para status do pagamento
  useEffect(() => {
    if (!paymentId || paymentConfirmed) return;
    const interval = setInterval(checkPaymentStatus, 5000); // Verificar a cada 5 segundos
    return () => clearInterval(interval);
  }, [paymentId, paymentConfirmed]);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId]);

  const last = memberships[0];
  const statusColor = last?.status === 'paga' ? 'text-green-600' : last?.status === 'atrasada' ? 'text-red-600' : 'text-yellow-600';
  const statusIcon = last?.status === 'paga' ? <CheckCircle className="h-5 w-5 text-green-600" /> : last?.status === 'atrasada' ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-yellow-600" />;

  const hasActiveSubscription = last?.subscriptionId && last?.status !== 'cancelada';

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-xl shadow space-y-6">
      <div className="flex items-center space-x-3">
        <CreditCard className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold">Mensalidade do Clube</h2>
      </div>
      
      {loading ? (
        <div>Carregando...</div>
      ) : last ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            {statusIcon}
            <span className={`font-bold text-lg ${statusColor}`}>{last.status?.toUpperCase()}</span>
            <span className="text-gray-500 text-sm">Vencimento: {new Date(last.dueDate).toLocaleDateString('pt-BR')}</span>
          </div>
          
          <div className="text-gray-700">Valor: <span className="font-bold">R$ {last.value.toFixed(2)}</span></div>
          
          {hasActiveSubscription && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-blue-600" />
                <span className="text-blue-800 font-medium">Assinatura Recorrente Ativa</span>
              </div>
              <p className="text-blue-600 text-sm mt-1">
                Você será cobrado automaticamente todo mês
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => handleCancelSubscription(last.subscriptionId)}
              >
                Cancelar Assinatura
              </Button>
            </div>
          )}
          
          {!hasActiveSubscription && last.status !== 'paga' && (
            <div className="space-y-2">
              <Button onClick={handlePay} disabled={paying} className="bg-blue-600 text-white w-full">
                {paying ? 'Gerando Pix...' : 'Pagar Mensalidade via Pix'}
              </Button>
              
              <Button 
                onClick={handleCreateSubscription} 
                disabled={creatingSubscription} 
                variant="outline" 
                className="w-full"
              >
                {creatingSubscription ? 'Criando Assinatura...' : 'Criar Assinatura Recorrente'}
              </Button>
            </div>
          )}
          
          {paymentConfirmed ? (
            <div className="mt-4 text-center bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-green-800 mb-2">Pagamento Confirmado!</h3>
              <p className="text-sm text-green-700 mb-3">
                Seu pagamento foi processado com sucesso!
              </p>
              <Button 
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.reload()}
              >
                Continuar
              </Button>
            </div>
          ) : qrCode ? (
            <div className="mt-4 text-center">
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code Pix" className="mx-auto" />
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(copiaCola || '')}
              >
                Copiar código Pix
              </Button>
              <Button
                className="mt-2 bg-blue-600 text-white"
                onClick={checkPaymentStatus}
                disabled={checkingPayment}
              >
                {checkingPayment ? 'Verificando...' : 'Verificar Pagamento'}
              </Button>
              <div className="mt-2 text-xs bg-gray-50 p-2 rounded border max-h-16 overflow-y-auto break-all font-mono">
                {copiaCola}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                O sistema verificará automaticamente o status a cada 5 segundos
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div>Nenhuma mensalidade encontrada.</div>
          <Button onClick={handlePay} disabled={paying} className="bg-blue-600 text-white w-full">
            {paying ? 'Gerando Pix...' : 'Criar Primeira Mensalidade'}
          </Button>
          <Button 
            onClick={handleCreateSubscription} 
            disabled={creatingSubscription} 
            variant="outline" 
            className="w-full"
          >
            {creatingSubscription ? 'Criando Assinatura...' : 'Criar Assinatura Recorrente'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default MembershipPayment; 
