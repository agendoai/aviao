
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Calendar, MapPin, Plane, DollarSign, Activity, CalendarIcon } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getAllAircrafts } from '@/utils/api';
import UserManagement from './UserManagement';
import BookingManagement from './BookingManagement';
import AircraftManagement from './AircraftManagement';
import FinancialManagement from './FinancialManagement';
import ScheduleManagement from './ScheduleManagement';
import { toast } from 'sonner';
import { useLocation } from 'react-router-dom';

interface Stats {
  totalUsers: number;
  totalAircraft: number;
  monthlyRevenue: number;
  activeBookings: number;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAircraft: 0,
    monthlyRevenue: 0,
    activeBookings: 0
  });
  const location = useLocation();

  useEffect(() => {
    // Ler parâmetro tab da URL
    const urlParams = new URLSearchParams(location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
      // Se tab for 'settings' (removido), redireciona para 'dashboard'
      const normalized = tabParam === 'settings' ? 'dashboard' : tabParam;
      setActiveTab(normalized);
      if (normalized !== tabParam) {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', normalized);
        window.history.replaceState({}, '', url.toString());
      }
    }
  }, [location]);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    const onRefresh = () => fetchStats();
    window.addEventListener('dashboard:refresh', onRefresh);
    return () => window.removeEventListener('dashboard:refresh', onRefresh);
  }, []);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Atualizar URL com o novo tab
    const url = new URL(window.location.href);
    url.searchParams.set('tab', value);
    window.history.pushState({}, '', url.toString());
  };

  const fetchStats = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api';
      const token = localStorage.getItem('token');
      
      const [usersRes, aircraftRes, bookingsRes, financialsRes, sharedMissionsRes] = await Promise.all([
        fetch(`${backendUrl}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }),
        getAllAircrafts(),
        fetch(`${backendUrl}/bookings`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }),
        fetch(`${backendUrl}/admin/financials`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }),
        fetch(`${backendUrl}/shared-missions`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        })
      ]);

      const users = await usersRes.json();
      const aircraft = await aircraftRes;
      const bookings = await bookingsRes.json();
      const financials = await financialsRes.json();
      const sharedMissions = await sharedMissionsRes.json();

      // Receita total baseada apenas em status 'confirmada' (somando reservas e missões)
      const totalRevenue = Number(financials.totalReceived || 0);

      // Contar reservas confirmadas (reservas diretas + bookings confirmados em missões)
      const directConfirmed = bookings.filter((b: any) => b.status === 'confirmada').length;
      const missionConfirmed = (sharedMissions || []).reduce((sum: number, m: any) => {
        const confirmedSeats = (m.bookings || []).filter((bk: any) => ['confirmada', 'confirmed'].includes(bk.status)).length;
        return sum + confirmedSeats;
      }, 0);
      const totalConfirmedCount = directConfirmed + missionConfirmed;

      const newStats = {
        totalUsers: users.length || 0,
        totalAircraft: aircraft.length || 0,
        monthlyRevenue: totalRevenue,
        activeBookings: totalConfirmedCount
      };

      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error("Erro ao carregar estatísticas", {
        description: "Tente novamente mais tarde"
      });
    }
  };

  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-sky-600 to-sky-800 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Painel Admin</h1>
            <p className="text-xs sm:text-sm text-gray-600">Gestão do sistema</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex justify-center">
          <div className="w-full max-w-md">
            <TabsList className="flex w-full h-auto p-1 bg-gray-100 rounded-xl overflow-x-auto whitespace-nowrap text-xs md:text-sm gap-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              <TabsTrigger value="dashboard" className="flex flex-col items-center space-y-0.5 p-1 md:p-2 min-w-[60px] md:min-w-[80px] truncate text-[11px] md:text-xs">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[11px] md:text-xs font-semibold">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="users" className="flex flex-col items-center space-y-0.5 p-1 md:p-2 min-w-[60px] md:min-w-[80px] truncate text-[11px] md:text-xs">
                <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[11px] md:text-xs font-semibold">Usuários</span>
              </TabsTrigger>
              <TabsTrigger value="bookings" className="flex flex-col items-center space-y-0.5 p-1 md:p-2 min-w-[60px] md:min-w-[80px] truncate text-[11px] md:text-xs">
                <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[11px] md:text-xs font-semibold">Reservas</span>
              </TabsTrigger>
              <TabsTrigger value="aircraft" className="flex flex-col items-center space-y-0.5 p-1 md:p-2 min-w-[60px] md:min-w-[80px] truncate text-[11px] md:text-xs">
                <Plane className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[11px] md:text-xs font-semibold">Aeronaves</span>
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex flex-col items-center space-y-0.5 p-1 md:p-2 min-w-[60px] md:min-w-[80px] truncate text-[11px] md:text-xs">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[11px] md:text-xs font-semibold">Financeiro</span>
              </TabsTrigger>
              <TabsTrigger value="schedule" className="flex flex-col items-center space-y-0.5 p-1 md:p-2 min-w-[60px] md:min-w-[80px] truncate text-[11px] md:text-xs">
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-[11px] md:text-xs font-semibold">Agenda</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="dashboard" className="space-y-3">
          {/* Stats Cards - Mobile First */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 rounded-lg shadow-sm border border-sky-500/20 bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-xs font-semibold text-sky-500">Usuários</CardTitle>
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-sky-500" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-base sm:text-lg font-bold text-gray-900">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card className="p-3 rounded-lg shadow-sm border border-sky-500/20 bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-xs font-semibold text-sky-500">Aeronaves</CardTitle>
                <Plane className="h-3 w-3 sm:h-4 sm:w-4 text-sky-500" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-base sm:text-lg font-bold text-gray-900">{stats.totalAircraft}</div>
              </CardContent>
            </Card>

            <Card className="p-3 rounded-lg shadow-sm border border-sky-500/20 bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-xs font-semibold text-sky-500">Receita</CardTitle>
                <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-sky-500" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-base sm:text-lg font-bold text-gray-900">R$ {stats.monthlyRevenue.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>

            <Card className="p-3 rounded-lg shadow-sm border border-sky-500/20 bg-white/90">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-0">
                <CardTitle className="text-xs font-semibold text-sky-500">Reservas</CardTitle>
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-sky-500" />
              </CardHeader>
              <CardContent className="p-0">
                <div className="text-base sm:text-lg font-bold text-gray-900">{stats.activeBookings}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div>
            <UserManagement />
          </div>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-4">
          <BookingManagement />
        </TabsContent>



        <TabsContent value="aircraft" className="space-y-4">
          <AircraftManagement />
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <FinancialManagement />
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <ScheduleManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
