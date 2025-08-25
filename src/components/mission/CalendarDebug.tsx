import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getAircrafts, getBookings } from '@/utils/api';

interface Booking {
  id: number;
  aircraftId: number;
  userId: number;
  departure_date: string;
  return_date: string;
  status: string;
  value: number;
  blocked_until?: string;
  user: {
    name: string;
    email: string;
  };
}

interface Aircraft {
  id: number;
  name: string;
  registration: string;
  model: string;
  status: string;
}

const CalendarDebug: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados como o MissionSystem faz
        const [aircraftData, bookingsData, calendarData] = await Promise.all([
          getAircrafts(),
          getBookings(),
          (async () => {
            const token = localStorage.getItem('token');
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000/api'}/calendar`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              }
            });
            return res.json();
          })()
        ]);
        
        setAircraft(aircraftData);
        setBookings(bookingsData);
        setCalendarData(calendarData);
        
        console.log('🔍 DEBUG - Dados carregados no frontend:');
        console.log('🔍 Aircraft:', aircraftData);
        console.log('🔍 Bookings:', bookingsData);
        console.log('🔍 Calendar:', calendarData);
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const testSlotCalculation = () => {
    const aircraftId = 2; // PR-FOM
    const selectedDate = new Date('2025-08-21');
    
    console.log('🧪 Testando cálculo de slots no frontend...');
    console.log('🧪 Aircraft ID:', aircraftId);
    console.log('🧪 Selected Date:', selectedDate);
    
    // Filtrar reservas para a aeronave
    const bookingsForAircraft = bookings.filter(b => b.aircraftId === aircraftId);
    console.log('🧪 Bookings for aircraft:', bookingsForAircraft);
    
    // Testar cada hora
    for (let hour = 6; hour < 20; hour++) {
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(selectedDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Verificar conflito com reservas
      const conflictingBooking = bookingsForAircraft.find(b => {
        const departureDate = new Date(b.departure_date);
        const returnDate = new Date(b.return_date);
        const blockedUntil = b.blocked_until ? new Date(b.blocked_until) : null;
        
        // Conflito direto de horário
        const directConflict = departureDate < slotEnd && returnDate > slotStart;
        
        // Conflito com período de bloqueio (manutenção)
        const maintenanceConflict = blockedUntil && blockedUntil > slotStart;
        
        return directConflict || maintenanceConflict;
      });

      const status = conflictingBooking ? '❌ BLOQUEADO' : '✅ DISPONÍVEL';
      const reason = conflictingBooking ? 
        `(Conflito: ${conflictingBooking.origin} → ${conflictingBooking.destination}, bloqueado até: ${conflictingBooking.blocked_until || 'N/A'})` : 
        '';

      console.log(`   ${hour.toString().padStart(2, '0')}:00 - ${status} ${reason}`);
    }
  };

  if (loading) {
    return <div>Carregando dados de debug...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Debug do Calendário</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">📊 Dados Carregados:</h3>
            <p>Aeronaves: {aircraft.length}</p>
            <p>Reservas: {bookings.length}</p>
            <p>Entradas do Calendário: {calendarData.length}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">📋 Reservas com Bloqueio:</h3>
            {bookings.filter(b => b.blocked_until).map((booking, index) => (
              <div key={booking.id} className="p-2 bg-yellow-50 border rounded mb-2">
                <p><strong>ID:</strong> {booking.id}</p>
                <p><strong>Status:</strong> {booking.status}</p>
                <p><strong>Aeronave:</strong> {booking.aircraftId}</p>
                <p><strong>Partida:</strong> {new Date(booking.departure_date).toLocaleString()}</p>
                <p><strong>Retorno:</strong> {new Date(booking.return_date).toLocaleString()}</p>
                <p><strong>Bloqueado até:</strong> {booking.blocked_until ? new Date(booking.blocked_until).toLocaleString() : 'N/A'}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-semibold mb-2">📋 Todas as Reservas:</h3>
            {bookings.map((booking, index) => (
              <div key={booking.id} className="p-2 bg-gray-50 border rounded mb-2">
                <p><strong>ID:</strong> {booking.id}</p>
                <p><strong>Status:</strong> {booking.status}</p>
                <p><strong>Aeronave:</strong> {booking.aircraftId}</p>
                <p><strong>Usuário:</strong> {booking.user.name}</p>
                <p><strong>Partida:</strong> {new Date(booking.departure_date).toLocaleString()}</p>
                <p><strong>Retorno:</strong> {new Date(booking.return_date).toLocaleString()}</p>
                <p><strong>Bloqueado até:</strong> {booking.blocked_until ? new Date(booking.blocked_until).toLocaleString() : 'N/A'}</p>
              </div>
            ))}
          </div>

          <Button onClick={testSlotCalculation} className="w-full">
            🧪 Testar Cálculo de Slots
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarDebug;


