import React, { useEffect, useState } from 'react';
import { CreditCard, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

const MembershipPayment: React.FC = () => {
  const { user } = useAuth();
  const [memberships, setMemberships] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [copiaCola, setCopiaCola] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);

  useEffect(() => {
    if (user) fetchMemberships();
    // eslint-disable-next-line
  }, [user]);

  const fetchMemberships = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/payments/membership/${user.id}`);
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
      const res = await fetch(`/payments/membership/${user.id}`, { method: 'POST' });
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

  // Polling para status do pagamento
  useEffect(() => {
    if (!paymentId) return;
    const interval = setInterval(async () => {
      const res = await fetch(`/payments/membership/status/${paymentId}`);
      const data = await res.json();
      setStatus(data.status);
      if (data.status === 'RECEIVED') {
        clearInterval(interval);
        toast.success('Mensalidade paga!');
        fetchMemberships();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [paymentId]);

  const last = memberships[0];
  const statusColor = last?.status === 'paga' ? 'text-green-600' : last?.status === 'atrasada' ? 'text-red-600' : 'text-yellow-600';
  const statusIcon = last?.status === 'paga' ? <CheckCircle className="h-5 w-5 text-green-600" /> : last?.status === 'atrasada' ? <AlertTriangle className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-yellow-600" />;

  return (
    <div className="max-w-lg mx-auto mt-8 p-6 bg-white rounded-xl shadow space-y-6">
      <div className="flex items-center space-x-3">
        <CreditCard className="h-8 w-8 text-blue-600" />
        <h2 className="text-2xl font-bold">Mensalidade do Clube</h2>
      </div>
      {loading ? (
        <div>Carregando...</div>
      ) : last ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            {statusIcon}
            <span className={`font-bold text-lg ${statusColor}`}>{last.status?.toUpperCase()}</span>
            <span className="text-gray-500 text-sm">Vencimento: {new Date(last.dueDate).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="text-gray-700">Valor: <span className="font-bold">R$ {last.value.toFixed(2)}</span></div>
          {last.status !== 'paga' && (
            <Button onClick={handlePay} disabled={paying} className="bg-blue-600 text-white mt-2">
              {paying ? 'Gerando Pix...' : 'Pagar Mensalidade via Pix'}
            </Button>
          )}
          {qrCode && (
            <div className="mt-4 text-center">
              <img src={`data:image/png;base64,${qrCode}`} alt="QR Code Pix" className="mx-auto" />
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => navigator.clipboard.writeText(copiaCola || '')}
              >
                Copiar código Pix
              </Button>
              <div className="mt-2 text-xs break-all">{copiaCola}</div>
            </div>
          )}
        </div>
      ) : (
        <div>Nenhuma mensalidade encontrada.</div>
      )}
      <div className="mt-6">
        <h3 className="font-bold mb-2">Histórico de Mensalidades</h3>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {memberships.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm p-2 rounded-lg border">
              <span>{new Date(m.dueDate).toLocaleDateString('pt-BR')}</span>
              <span className="font-medium">R$ {m.value.toFixed(2)}</span>
              <span className={
                m.status === 'paga' ? 'text-green-600' :
                m.status === 'atrasada' ? 'text-red-600' : 'text-yellow-600'
              }>{m.status?.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MembershipPayment; 