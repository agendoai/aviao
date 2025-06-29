import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plane, DollarSign, Calendar, Settings, Users, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';

interface Aircraft {
  id: string;
  name: string;
  model: string;
  registration: string;
  status: 'available' | 'in_flight' | 'maintenance';
  hourly_rate: number;
  max_passengers: number;
}

interface BookingStats {
  totalBookings: number;
  totalRevenue: number;
  hoursFlown: number;
  utilizationRate: number;
}

const OwnerDashboard: React.FC = () => {
  const { profile } = useAuth();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [stats, setStats] = useState<BookingStats>({
    totalBookings: 0,
    totalRevenue: 0,
    hoursFlown: 0,
    utilizationRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerAircraft();
    fetchBookingStats();
  }, [profile?.id]);

  const fetchOwnerAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .eq('owner_id', profile?.id);

      if (error) throw error;
      setAircraft(data || []);
    } catch (error) {
      toast.error("Erro ao carregar aeronaves");
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingStats = async () => {
    try {
      // Buscar estatísticas de reservas das aeronaves do proprietário
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          aircraft!inner(owner_id)
        `)
        .eq('aircraft.owner_id', profile?.id)
        .eq('status', 'confirmed');

      if (error) throw error;

      const totalBookings = bookings?.length || 0;
      const totalRevenue = bookings?.reduce((sum, booking) => sum + Number(booking.total_cost), 0) || 0;
      const hoursFlown = bookings?.reduce((sum, booking) => sum + Number(booking.flight_hours), 0) || 0;

      setStats({
        totalBookings,
        totalRevenue,
        hoursFlown,
        utilizationRate: Math.round((hoursFlown / (aircraft.length * 24 * 30)) * 100) || 0
      });
    } catch (error) {
      toast.error("Erro ao carregar estatísticas");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">Disponível</Badge>;
      case 'in_flight':
        return <Badge variant="destructive">Em Voo</Badge>;
      case 'maintenance':
        return <Badge variant="secondary">Manutenção</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando dashboard do proprietário...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Dashboard do Proprietário
          </h1>
          <p className="text-gray-600">
            Gerencie suas aeronaves e acompanhe a receita
          </p>
        </div>
        <Plane className="h-8 w-8 text-aviation-blue" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Aeronaves</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aircraft.length}</div>
            <p className="text-xs text-muted-foreground">
              {aircraft.filter(a => a.status === 'available').length} disponíveis
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {stats.totalRevenue.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Voadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.hoursFlown}h</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalBookings} reservas
            </p>
          </CardContent>
        </Card>

        <Card className="aviation-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Utilização</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.utilizationRate}%</div>
            <p className="text-xs text-muted-foreground">
              Este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Aircraft Management */}
      <Tabs defaultValue="aircraft" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="aircraft">Minhas Aeronaves</TabsTrigger>
          <TabsTrigger value="bookings">Reservas</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
        </TabsList>

        <TabsContent value="aircraft">
          <Card className="aviation-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Minhas Aeronaves</CardTitle>
                  <CardDescription>
                    Gerencie suas aeronaves e configurações
                  </CardDescription>
                </div>
                <Button className="bg-aviation-gradient hover:opacity-90">
                  <Plane className="h-4 w-4 mr-2" />
                  Cadastrar Aeronave
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aircraft.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {aircraft.map((plane) => (
                    <Card key={plane.id} className="border">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{plane.name}</CardTitle>
                            <CardDescription>{plane.model} - {plane.registration}</CardDescription>
                          </div>
                          {getStatusBadge(plane.status)}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Taxa Horária</p>
                            <p className="font-semibold">R$ {plane.hourly_rate.toLocaleString('pt-BR')}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Passageiros</p>
                            <p className="font-semibold">{plane.max_passengers}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Configurar
                          </Button>
                          <Button variant="outline" size="sm">
                            <Calendar className="h-4 w-4 mr-2" />
                            Manutenção
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Nenhuma aeronave cadastrada</p>
                  <Button className="bg-aviation-gradient hover:opacity-90">
                    Cadastrar Primeira Aeronave
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="aviation-card">
            <CardHeader>
              <CardTitle>Reservas das Minhas Aeronaves</CardTitle>
              <CardDescription>
                Acompanhe o uso das suas aeronaves
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Lista de reservas será implementada aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="aviation-card">
            <CardHeader>
              <CardTitle>Análise de Receita</CardTitle>
              <CardDescription>
                Relatórios financeiros das suas aeronaves
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Relatórios de receita serão implementados aqui</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboard;
