
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, TrendingUp, Users, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getFinancials } from '@/utils/api';

interface FinancialData {
  summary: {
    totalRevenue: number;
    pendingRevenue: number;
    membershipRevenue: number;
    bookingRevenue: number;
  };
  counts: {
    totalTransactions: number;
    totalMemberships: number;
    totalBookings: number;
    confirmedMemberships: number;
    pendingMemberships: number;
    confirmedBookings: number;
    pendingBookings: number;
  };
  periodStats: Array<{
    period: string;
    label: string;
    totalRevenue: number;
    transactionCount: number;
    membershipCount: number;
    bookingCount: number;
  }>;
  filter: {
    period: string;
    startDate?: string;
    endDate?: string;
  };
}

const FinancialManagement: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const loadFinancials = async (period: string = 'month') => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/admin/financials?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFinancialData(data);
    } catch (error) {
      console.error('Erro ao carregar dados financeiros:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados financeiros',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancials(selectedPeriod);
  }, [selectedPeriod]);

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
  };

  if (loading) {
    return <div className="text-center py-8">Carregando dados financeiros...</div>;
  }

  if (!financialData) {
    return <div className="text-center py-8">Erro ao carregar dados</div>;
  }

  const { summary, counts, periodStats } = financialData;

  return (
    <div className="space-y-6">
      {/* Filtro de Período */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Por Dia (últimos 7 dias)</SelectItem>
                <SelectItem value="week">Por Semana (últimas 4 semanas)</SelectItem>
                <SelectItem value="month">Por Mês (últimos 6 meses)</SelectItem>
                <SelectItem value="year">Por Ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(summary?.totalRevenue || 0).toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Todas as transações
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Mensalidades</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(summary?.membershipRevenue || 0).toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              {counts?.confirmedMemberships || 0} confirmadas
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Reservas</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(summary?.bookingRevenue || 0).toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              {counts?.confirmedBookings || 0} confirmadas
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Todas as transações
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas por Período */}
      {periodStats && periodStats.length > 0 && (
        <Card className="aviation-card">
          <CardHeader>
            <CardTitle>Estatísticas por {selectedPeriod === 'day' ? 'Dia' : selectedPeriod === 'week' ? 'Semana' : selectedPeriod === 'month' ? 'Mês' : 'Ano'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {periodStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{stat.label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {stat.transactionCount || 0} transações • {stat.membershipCount || 0} mensalidades • {stat.bookingCount || 0} reservas
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">R$ {(stat.totalRevenue || 0).toLocaleString('pt-BR')}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialManagement;
