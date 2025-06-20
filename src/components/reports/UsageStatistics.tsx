import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Plane, Users, Clock, Calendar } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface UsageStatisticsProps {
  aircraftUsage: any[];
  bookings: any[];
  loading: boolean;
  dateRange?: DateRange;
}

const UsageStatistics: React.FC<UsageStatisticsProps> = ({ aircraftUsage, bookings, loading, dateRange }) => {
  const processAircraftData = () => {
    const usage = aircraftUsage.reduce((acc, booking) => {
      const aircraftName = booking.aircraft?.name || 'Desconhecida';
      if (!acc[aircraftName]) {
        acc[aircraftName] = {
          name: aircraftName,
          flights: 0,
          hours: 0,
          revenue: 0
        };
      }
      acc[aircraftName].flights += 1;
      acc[aircraftName].hours += Number(booking.flight_hours) || 0;
      acc[aircraftName].revenue += Number(booking.total_cost) || 0;
      return acc;
    }, {});

    return Object.values(usage);
  };

  const processWeeklyUsage = () => {
    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const usage = bookings.reduce((acc, booking) => {
      const dayOfWeek = new Date(booking.departure_date).getDay();
      const dayName = weekdays[dayOfWeek];
      if (!acc[dayName]) {
        acc[dayName] = { day: dayName, flights: 0, hours: 0 };
      }
      acc[dayName].flights += 1;
      acc[dayName].hours += Number(booking.flight_hours) || 0;
      return acc;
    }, {});

    return weekdays.map(day => usage[day] || { day, flights: 0, hours: 0 });
  };

  const processHourlyUsage = () => {
    const hours = Array.from({ length: 24 }, (_, i) => ({
      hour: `${i.toString().padStart(2, '0')}:00`,
      flights: 0
    }));

    bookings.forEach(booking => {
      const hour = parseInt(booking.departure_time?.split(':')[0] || '0');
      if (hour >= 0 && hour < 24) {
        hours[hour].flights += 1;
      }
    });

    return hours.filter(h => h.flights > 0);
  };

  const calculateUsageStats = () => {
    const totalBookings = bookings.length;
    const totalPassengers = bookings.reduce((sum, b) => sum + (Number(b.passengers) || 0), 0);
    const totalHours = bookings.reduce((sum, b) => sum + (Number(b.flight_hours) || 0), 0);
    const avgPassengers = totalBookings > 0 ? totalPassengers / totalBookings : 0;

    const aircraftData = processAircraftData();
    const mostUsedAircraft = aircraftData
      .sort((a: any, b: any) => (b.flights || 0) - (a.flights || 0))[0]?.name || 'N/A';

    return {
      totalBookings,
      totalPassengers,
      totalHours: totalHours.toFixed(1),
      avgPassengers: avgPassengers.toFixed(1),
      mostUsedAircraft
    };
  };

  const aircraftData = processAircraftData();
  const weeklyData = processWeeklyUsage();
  const hourlyData = processHourlyUsage();
  const stats = calculateUsageStats();

  const chartConfig = {
    flights: {
      label: "Voos",
      color: "#3b82f6",
    },
    hours: {
      label: "Horas",
      color: "#10b981",
    },
    revenue: {
      label: "Receita",
      color: "#f59e0b",
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
      {/* Cards de estatísticas de uso */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservas Totais</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Passageiros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPassengers}</div>
            <p className="text-xs text-muted-foreground">
              passageiros transportados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas Totais</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              tempo de voo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Passageiros</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgPassengers}</div>
            <p className="text-xs text-muted-foreground">
              por voo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aeronave Favorita</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{stats.mostUsedAircraft}</div>
            <p className="text-xs text-muted-foreground">
              mais utilizada
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de uso */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Uso por Aeronave</CardTitle>
            <CardDescription>
              Número de voos e horas por aeronave
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aircraftData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="flights" 
                    fill="var(--color-flights)"
                    name="Voos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Uso por Dia da Semana</CardTitle>
            <CardDescription>
              Padrão de uso semanal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={weeklyData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="day" />
                  <PolarRadiusAxis />
                  <Radar 
                    name="Voos" 
                    dataKey="flights" 
                    stroke="var(--color-flights)" 
                    fill="var(--color-flights)" 
                    fillOpacity={0.3} 
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                </RadarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de uso por horário */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Horário</CardTitle>
          <CardDescription>
            Horários preferenciais de partida
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar 
                  dataKey="flights" 
                  fill="var(--color-flights)"
                  name="Voos"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default UsageStatistics;
