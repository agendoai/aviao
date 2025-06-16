import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, MapPin, Users, Clock, Calculator, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;

interface FlightCost {
  flightHours: number;
  airportFees: number;
  overnightStays: number;
  overnightFee: number;
  total: number;
}

const BookingSystem: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [formData, setFormData] = useState({
    aircraft_id: '',
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    origin: '',
    destination: '',
    passengers: 1,
    stops: '',
    notes: ''
  });

  const [flightCost, setFlightCost] = useState<FlightCost | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  useEffect(() => {
    fetchAircraft();
  }, []);

  const fetchAircraft = async () => {
    const { data, error } = await supabase
      .from('aircraft')
      .select('*')
      .eq('status', 'available');
    
    if (data && !error) {
      setAircraft(data);
    }
  };

  const calculateCost = async () => {
    setIsCalculating(true);
    
    // Simulate cost calculation with more realistic logic
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Calculate flight time based on distance estimation
    const mockFlightHours = Math.random() * 6 + 1; // 1-7 hours
    const baseAirportFees = 800 + (Math.random() * 1200); // R$ 800-2000
    
    // Calculate overnight stays
    const departureDate = new Date(formData.departureDate);
    const returnDate = new Date(formData.returnDate);
    const daysDiff = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 3600 * 24));
    const overnightStays = Math.max(0, daysDiff - 1);
    const overnightFee = overnightStays * 9500;
    
    // Get selected aircraft hourly rate
    const selectedAircraft = aircraft.find(a => a.id === formData.aircraft_id);
    const hourlyRate = selectedAircraft?.hourly_rate || 2800;
    
    const cost: FlightCost = {
      flightHours: mockFlightHours,
      airportFees: baseAirportFees,
      overnightStays,
      overnightFee,
      total: (mockFlightHours * hourlyRate) + baseAirportFees + overnightFee
    };
    
    setFlightCost(cost);
    setIsCalculating(false);
  };

  const handleReservation = async () => {
    if (!profile || !flightCost) return;
    
    if (profile.balance < flightCost.total) {
      toast({
        title: "Saldo Insuficiente",
        description: "Você precisa adicionar créditos para completar esta reserva.",
        variant: "destructive"
      });
      return;
    }

    setShowPayment(true);
  };

  const confirmPayment = async () => {
    if (!profile || !flightCost) return;
    
    try {
      // Create booking
      const bookingData = {
        user_id: profile.id,
        aircraft_id: formData.aircraft_id,
        departure_date: formData.departureDate,
        departure_time: formData.departureTime,
        return_date: formData.returnDate,
        return_time: formData.returnTime,
        origin: formData.origin,
        destination: formData.destination,
        passengers: formData.passengers,
        stops: formData.stops || null,
        notes: formData.notes || null,
        flight_hours: flightCost.flightHours,
        airport_fees: flightCost.airportFees,
        overnight_stays: flightCost.overnightStays,
        overnight_fee: flightCost.overnightFee,
        total_cost: flightCost.total,
        status: profile.priority_position === 1 ? 'confirmed' : 'pending',
        priority_expires_at: profile.priority_position === 1 ? null : 
          new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() // 12 hours from now
      };

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingData)
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: profile.id,
          booking_id: booking.id,
          amount: flightCost.total,
          description: `Reserva de voo: ${formData.origin} → ${formData.destination}`,
          type: 'debit'
        });

      if (transactionError) throw transactionError;

      // Update user balance
      await updateProfile({ balance: profile.balance - flightCost.total });
      
      toast({
        title: profile.priority_position === 1 ? "Reserva Confirmada!" : "Reserva Pendente",
        description: profile.priority_position === 1 
          ? "Sua reserva foi confirmada imediatamente." 
          : "Sua reserva está pendente por 12 horas para validação de prioridade.",
      });
      
      // Reset form
      setShowPayment(false);
      setFlightCost(null);
      setFormData({
        aircraft_id: '',
        departureDate: '',
        departureTime: '',
        returnDate: '',
        returnTime: '',
        origin: '',
        destination: '',
        passengers: 1,
        stops: '',
        notes: ''
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao processar reserva",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const selectedAircraft = aircraft.find(a => a.id === formData.aircraft_id);

  return (
    <div className="space-y-6">
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Nova Reserva de Voo</span>
          </CardTitle>
          <CardDescription>
            Planeje sua missão e calcule os custos automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="aircraft">Aeronave</Label>
              <Select value={formData.aircraft_id} onValueChange={(value) => setFormData({...formData, aircraft_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar aeronave" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map((plane) => (
                    <SelectItem key={plane.id} value={plane.id}>
                      {plane.name} ({plane.registration})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passengers">Passageiros</Label>
              <Select 
                value={formData.passengers.toString()} 
                onValueChange={(value) => setFormData({...formData, passengers: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: selectedAircraft?.max_passengers || 8 }, (_, i) => i + 1).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} passageiro{num > 1 ? 's' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="origin">Origem</Label>
              <Input
                id="origin"
                placeholder="Ex: SBGR - Guarulhos"
                value={formData.origin}
                onChange={(e) => setFormData({...formData, origin: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="destination">Destino</Label>
              <Input
                id="destination"
                placeholder="Ex: SBGL - Galeão"
                value={formData.destination}
                onChange={(e) => setFormData({...formData, destination: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="departureDate">Data de Partida</Label>
                <Input
                  id="departureDate"
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({...formData, departureDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departureTime">Hora de Partida</Label>
                <Input
                  id="departureTime"
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData({...formData, departureTime: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="returnDate">Data de Retorno</Label>
                <Input
                  id="returnDate"
                  type="date"
                  value={formData.returnDate}
                  onChange={(e) => setFormData({...formData, returnDate: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="returnTime">Hora Máxima de Retorno</Label>
                <Input
                  id="returnTime"
                  type="time"
                  value={formData.returnTime}
                  onChange={(e) => setFormData({...formData, returnTime: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="stops">Paradas Intermediárias (opcional)</Label>
            <Input
              id="stops"
              placeholder="Ex: SBPA - Porto Alegre"
              value={formData.stops}
              onChange={(e) => setFormData({...formData, stops: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre o voo..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
            />
          </div>

          <Button 
            onClick={calculateCost}
            disabled={isCalculating || !formData.aircraft_id || !formData.origin || !formData.destination}
            className="w-full bg-aviation-gradient hover:opacity-90 text-white"
          >
            <Calculator className="h-4 w-4 mr-2" />
            {isCalculating ? 'Calculando...' : 'Calcular Custo da Missão'}
          </Button>
        </CardContent>
      </Card>

      {flightCost && (
        <Card className="aviation-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5" />
              <span>Detalhamento de Custos</span>
            </CardTitle>
            <CardDescription>
              Cálculo automático baseado na missão planejada
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Horas de voo:</span>
                  <span>{flightCost.flightHours.toFixed(1)}h</span>
                </div>
                <div className="flex justify-between">
                  <span>Custo por hora (R$ {selectedAircraft?.hourly_rate || 2800}):</span>
                  <span>R$ {(flightCost.flightHours * (selectedAircraft?.hourly_rate || 2800)).toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxas aeroportuárias:</span>
                  <span>R$ {flightCost.airportFees.toLocaleString('pt-BR')}</span>
                </div>
                {flightCost.overnightStays > 0 && (
                  <div className="flex justify-between">
                    <span>Pernoites ({flightCost.overnightStays}x R$ 9.500):</span>
                    <span>R$ {flightCost.overnightFee.toLocaleString('pt-BR')}</span>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-aviation-blue">
                    R$ {flightCost.total.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Seu saldo: R$ {profile?.balance.toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Status da Prioridade</span>
              </div>
              <div className={`p-3 rounded-lg ${
                profile?.priority_position === 1 
                  ? 'bg-green-100 border border-green-300' 
                  : 'bg-yellow-100 border border-yellow-300'
              }`}>
                {profile?.priority_position === 1 ? (
                  <p className="text-green-800 text-sm">
                    ✅ Você está em 1º lugar! Sua reserva será confirmada imediatamente após o pagamento.
                  </p>
                ) : (
                  <p className="text-yellow-800 text-sm">
                    ⏰ Você está na posição #{profile?.priority_position}. Sua reserva ficará pendente por 12 horas para validação de prioridade.
                  </p>
                )}
              </div>
            </div>

            <Button 
              onClick={handleReservation}
              className="w-full bg-aviation-gradient hover:opacity-90 text-white"
              disabled={!profile || profile.balance < flightCost.total}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Efetuar Reserva
            </Button>
          </CardContent>
        </Card>
      )}

      {showPayment && flightCost && (
        <Card className="aviation-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="h-5 w-5" />
              <span>Confirmação de Pagamento</span>
            </CardTitle>
            <CardDescription>
              Confirme os detalhes da sua reserva
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Resumo da Missão</h4>
              <div className="space-y-1 text-sm">
                <p><strong>Rota:</strong> {formData.origin} → {formData.destination}</p>
                <p><strong>Data:</strong> {formData.departureDate} às {formData.departureTime}</p>
                <p><strong>Retorno:</strong> {formData.returnDate} até {formData.returnTime}</p>
                <p><strong>Aeronave:</strong> {selectedAircraft?.name}</p>
                <p><strong>Passageiros:</strong> {formData.passengers}</p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Total:</span>
                <span className="text-xl font-bold text-aviation-blue">
                  R$ {flightCost.total.toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2 text-sm">
                <span>Saldo após pagamento:</span>
                <span>R$ {(profile!.balance - flightCost.total).toLocaleString('pt-BR')}</span>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => setShowPayment(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmPayment}
                className="flex-1 bg-aviation-gradient hover:opacity-90 text-white"
              >
                Confirmar Pagamento
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingSystem;
