
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Plane, Clock, MapPin, TrendingUp } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FlightAnalyticsProps {
  bookings: any[];
  loading: boolean;
  dateRange?: DateRange;
}

const FlightAnalytics: React.FC<FlightAnalyticsProps> = ({ bookings, loading, dateRange }) => {
  // Processar dados para gráficos
  const processFlightData = () => {
    const monthlyData = bookings.reduce((acc, booking) => {
      const month = format(parseISO(booking.departure_date), 'MMM yyyy', { locale: ptBR });
      if (!acc[month]) {
        acc[month] = { month, flights: 0, hours: 0, distance: 0 };
      }
      acc[month].flights += 1;
      acc[month].hours += parseFloat(booking.flight_hours);
      return acc;
    }, {});

    return Object.values(monthlyData);
  };

  const processDestinationData = () => {
    const destinations = bookings.reduce((acc, booking) => {
      if (!acc[booking.destination]) {
        acc[booking.destination] = 0;
      }
      acc[booking.destination] += 1;
      return acc;
    }, {});

    return Object.entries(destinations)
      .map(([destination, count]) => ({ destination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  };

  const calculateStats = () => {
    const totalFlights = bookings.length;
    const totalHours = bookings.reduce((sum, booking) => sum + parseFloat(booking.flight_hours), 0);
    const avgFlightTime = totalFlights > 0 ? totalHours / totalFlights : 0;
    const uniqueDestinations = new Set(bookings.map(b => b.destination)).size;

    return {
      totalFlights,
      totalHours: totalHours.toFixed(1),
      avgFlightTime: avgFlightTime.toFixed(1),
      uniqueDestinations
    };
  };

  const flightData = processFlightData();
  const destinationData = processDestinationData();
  const stats = calculateStats();

  const chartConfig = {
    flights: {
      label: "Voos",
      color: "#3b82f6",
    },
    hours: {
      label: "Horas",
      color: "#10b981",
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
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Voos</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalFlights}</div>
            <p className="text-xs text-muted-foreground">
              no período selecionado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Horas de Voo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours}h</div>
            <p className="text-xs text-muted-foreground">
              tempo total voado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgFlightTime}h</div>
            <p className="text-xs text-muted-foreground">
              por voo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destinos</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueDestinations}</div>
            <p className="text-xs text-muted-foreground">
              destinos únicos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Atividade de Voo por Mês</CardTitle>
            <CardDescription>
              Número de voos e horas de voo por mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={flightData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="flights" 
                    stroke="var(--color-flights)" 
                    strokeWidth={2}
                    name="Voos"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="hours" 
                    stroke="var(--color-hours)" 
                    strokeWidth={2}
                    name="Horas"
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Destinos</CardTitle>
            <CardDescription>
              Destinos mais visitados no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={destinationData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="destination" type="category" width={100} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="count" 
                    fill="var(--color-flights)"
                    name="Voos"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FlightAnalytics;
