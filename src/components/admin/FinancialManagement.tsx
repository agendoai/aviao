
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFinancials } from '@/utils/api';

const FinancialManagement: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const financials = await getFinancials();
        setTotalRevenue(Number(financials?.totalReceived || 0));
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao carregar receita de reservas confirmadas',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">R$ {totalRevenue.toLocaleString('pt-BR')}</div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialManagement;
