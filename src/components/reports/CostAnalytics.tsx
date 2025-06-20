
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingDown, TrendingUp, CreditCard } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CostAnalyticsProps {
  transactions: any[];
  bookings: any[];
  loading: boolean;
  dateRange?: DateRange;
}

const CostAnalytics: React.FC<CostAnalyticsProps> = ({ transactions, bookings, loading, dateRange }) => {
  const processSpendingData = () => {
    const monthlySpending = transactions
      .filter(t => t.type === 'debit')
      .reduce((acc, transaction) => {
        const month = format(parseISO(transaction.created_at), 'MMM yyyy', { locale: ptBR });
        if (!acc[month]) {
          acc[month] = { month, spending: 0, credits: 0 };
        }
        acc[month].spending += parseFloat(transaction.amount);
        return acc;
      }, {});

    const monthlyCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((acc, transaction) => {
        const month = format(parseISO(transaction.created_at), 'MMM yyyy', { locale: ptBR });
        if (!acc[month]) {
          acc[month] = { month, spending: 0, credits: 0 };
        }
        acc[month].credits += parseFloat(transaction.amount);
        return acc;
      }, {});

    // Combinar dados de gastos e créditos
    const allMonths = new Set([...Object.keys(monthlySpending), ...Object.keys(monthlyCredits)]);
    return Array.from(allMonths).map(month => ({
      month,
      spending: monthlySpending[month]?.spending || 0,
      credits: monthlyCredits[month]?.credits || 0,
      net: (monthlyCredits[month]?.credits || 0) - (monthlySpending[month]?.spending || 0)
    })).sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  };

  const processCostBreakdown = () => {
    const flightCosts = bookings.reduce((sum, booking) => sum + parseFloat(booking.total_cost), 0);
    const credits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    return [
      { name: 'Custos de Voo', value: flightCosts, color: '#ef4444' },
      { name: 'Créditos Adicionados', value: credits, color: '#22c55e' }
    ];
  };

  const calculateStats = () => {
    const totalSpent = transactions
      .filter(t => t.type === 'debit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    const totalCredits = transactions
      .filter(t => t.type === 'credit')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const avgFlightCost = bookings.length > 0 
      ? bookings.reduce((sum, b) => sum + parseFloat(b.total_cost), 0) / bookings.length 
      : 0;

    const netBalance = totalCredits - totalSpent;

    return {
      totalSpent: totalSpent.toFixed(2),
      totalCredits: totalCredits.toFixed(2),
      avgFlightCost: avgFlightCost.toFixed(2),
      netBalance: netBalance.toFixed(2),
      netBalancePositive: netBalance >= 0
    };
  };

  const spendingData = processSpendingData();
  const costBreakdown = processCostBreakdown();
  const stats = calculateStats();

  const chartConfig = {
    spending: {
      label: "Gastos",
      color: "#ef4444",
    },
    credits: {
      label: "Créditos",
      color: "#22c55e",
    },
    net: {
      label: "Líquido",
      color: "#3b82f6",
    },
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas financeiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gasto</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.totalSpent}
            </div>
            <p className="text-xs text-muted-foreground">
              no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Créditos Adicionados</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.totalCredits}
            </div>
            <p className="text-xs text-muted-foreground">
              créditos recebidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Médio por Voo</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.avgFlightCost}
            </div>
            <p className="text-xs text-muted-foreground">
              média por voo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Líquido</CardTitle>
            <CreditCard className={`h-4 w-4 ${stats.netBalancePositive ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netBalancePositive ? 'text-green-600' : 'text-red-600'}`}>
              R$ {stats.netBalance}
            </div>
            <p className="text-xs text-muted-foreground">
              créditos - gastos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos financeiros */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fluxo Financeiro Mensal</CardTitle>
            <CardDescription>
              Gastos, créditos e saldo líquido por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spendingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="credits" 
                    stackId="1"
                    stroke="var(--color-credits)" 
                    fill="var(--color-credits)"
                    fillOpacity={0.6}
                    name="Créditos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="spending" 
                    stackId="2"
                    stroke="var(--color-spending)" 
                    fill="var(--color-spending)"
                    fillOpacity={0.6}
                    name="Gastos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Custos</CardTitle>
            <CardDescription>
              Breakdown dos tipos de transações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costBreakdown}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CostAnalytics;
