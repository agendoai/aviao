
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Download, BarChart3, PieChart, TrendingUp, Calendar } from 'lucide-react';
import FlightAnalytics from './FlightAnalytics';
import CostAnalytics from './CostAnalytics';
import UsageStatistics from './UsageStatistics';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../AuthContext';
import { useToast } from '@/hooks/use-toast';
import { DateRange } from 'react-day-picker';
import { addDays, subDays } from 'date-fns';

interface ReportData {
  bookings: any[];
  transactions: any[];
  aircraftUsage: any[];
}

const ReportsSection: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [reportData, setReportData] = useState<ReportData>({
    bookings: [],
    transactions: [],
    aircraftUsage: []
  });
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [reportType, setReportType] = useState('monthly');

  useEffect(() => {
    fetchReportData();
  }, [dateRange, reportType]);

  const fetchReportData = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const fromDate = dateRange?.from?.toISOString().split('T')[0];
      const toDate = dateRange?.to?.toISOString().split('T')[0];

      // Fetch bookings data
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          aircraft:aircraft_id (name, model, registration)
        `)
        .gte('departure_date', fromDate)
        .lte('departure_date', toDate)
        .eq('user_id', profile.id);

      if (bookingsError) throw bookingsError;

      // Fetch transactions data
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .gte('created_at', fromDate)
        .lte('created_at', toDate)
        .eq('user_id', profile.id);

      if (transError) throw transError;

      // Fetch aircraft usage data (aggregated)
      const { data: aircraftUsage, error: usageError } = await supabase
        .from('bookings')
        .select(`
          aircraft_id,
          flight_hours,
          total_cost,
          aircraft:aircraft_id (name, model)
        `)
        .gte('departure_date', fromDate)
        .lte('departure_date', toDate)
        .eq('status', 'confirmed');

      if (usageError) throw usageError;

      setReportData({
        bookings: bookings || [],
        transactions: transactions || [],
        aircraftUsage: aircraftUsage || []
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados dos relatórios.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format: 'pdf' | 'csv') => {
    toast({
      title: "Exportando Relatório",
      description: `Preparando arquivo ${format.toUpperCase()}...`,
    });
    // TODO: Implement actual export functionality
  };

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-aviation-blue" />
                <span>Relatórios e Analytics</span>
              </CardTitle>
              <CardDescription>
                Análise detalhada de uso, custos e estatísticas de voo
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => exportReport('csv')}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => exportReport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4" />
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
              />
            </div>
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de relatório" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diário</SelectItem>
                <SelectItem value="weekly">Semanal</SelectItem>
                <SelectItem value="monthly">Mensal</SelectItem>
                <SelectItem value="yearly">Anual</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={fetchReportData} disabled={loading}>
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de relatórios */}
      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Analytics de Voo</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Análise de Custos</span>
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Estatísticas de Uso</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analytics">
          <FlightAnalytics 
            bookings={reportData.bookings}
            loading={loading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="costs">
          <CostAnalytics 
            transactions={reportData.transactions}
            bookings={reportData.bookings}
            loading={loading}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="usage">
          <UsageStatistics 
            aircraftUsage={reportData.aircraftUsage}
            bookings={reportData.bookings}
            loading={loading}
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportsSection;
