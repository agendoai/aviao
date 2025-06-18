
import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, Clock, CreditCard, Plane, Users, Timer, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Aircraft = Tables<'aircraft'>;
type PreReservation = Tables<'pre_reservations'>;

interface PreReservationSystemProps {
  selectedDate?: Date;
  onReservationComplete?: () => void;
}

const PreReservationSystem: React.FC<PreReservationSystemProps> = ({
  selectedDate,
  onReservationComplete
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [userPriorityPosition, setUserPriorityPosition] = useState<number | null>(null);
  const [pendingReservations, setPendingReservations] = useState<PreReservation[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  const [formData, setFormData] = useState({
    aircraft_id: '',
    departure_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    departure_time: '',
    return_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    return_time: '',
    origin: 'Aracatuba',
    destination: '',
    passengers: 1,
    flight_hours: 0,
    total_cost: 0
  });

  useEffect(() => {
    if (profile) {
      fetchUserPriority();
      fetchAircraft();
      fetchPendingReservations();
    }
  }, [profile]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        departure_date: selectedDate.toISOString().split('T')[0],
        return_date: selectedDate.toISOString().split('T')[0]
      }));
    }
  }, [selectedDate]);

  useEffect(() => {
    // Timer para atualizar tempo restante
    const interval = setInterval(() => {
      updateTimeRemaining();
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingReservations]);

  const fetchUserPriority = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('priority_slots')
        .select('slot_number')
        .eq('owner_id', profile.id)
        .order('slot_number', { ascending: true })
        .limit(1);

      if (error) throw error;
      if (data && data.length > 0) {
        setUserPriorityPosition(data[0].slot_number);
      }
    } catch (error) {
      console.error('Error fetching user priority:', error);
    }
  };

  const fetchAircraft = async () => {
    try {
      const { data, error } = await supabase
        .from('aircraft')
        .select('*')
        .eq('status', 'available');
      
      if (error) throw error;
      if (data) {
        setAircraftList(data);
      }
    } catch (error) {
      console.error('Error fetching aircraft:', error);
    }
  };

  const fetchPendingReservations = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('pre_reservations')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setPendingReservations(data);
      }
    } catch (error) {
      console.error('Error fetching pending reservations:', error);
    }
  };

  const updateTimeRemaining = () => {
    if (pendingReservations.length === 0) return;

    const reservation = pendingReservations[0];
    const expiresAt = new Date(reservation.expires_at);
    const now = new Date();
    const diff = expiresAt.getTime() - now.getTime();

    if (diff <= 0) {
      setTimeRemaining('Expirado');
      fetchPendingReservations(); // Recarregar para atualizar status
    } else {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }
  };

  const calculateCosts = () => {
    const selectedAircraft = aircraftList.find(a => a.id === formData.aircraft_id);
    if (!selectedAircraft || !formData.flight_hours) return 0;

    return selectedAircraft.hourly_rate * formData.flight_hours;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;
    if (userPriorityPosition === null) {
      toast({
        title: "Erro",
        description: "Você precisa ter pelo menos uma cota de prioridade para fazer reservas.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const totalCost = calculateCosts();
      
      const { data, error } = await supabase.rpc('create_pre_reservation', {
        p_aircraft_id: formData.aircraft_id,
        p_departure_date: formData.departure_date,
        p_departure_time: formData.departure_time,
        p_return_date: formData.return_date,
        p_return_time: formData.return_time,
        p_origin: formData.origin,
        p_destination: formData.destination,
        p_passengers: formData.passengers,
        p_flight_hours: formData.flight_hours,
        p_total_cost: totalCost
      });

      if (error) throw error;
      
      const result = data as any;
      if (result?.error) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      if (result?.success) {
        toast({
          title: result.can_confirm_immediately ? "Pré-reserva Criada - Confirme Imediatamente!" : "Pré-reserva Criada!",
          description: result.can_confirm_immediately 
            ? "Você está em 1º lugar! Complete o pagamento em até 1 hora."
            : `Aguarde 12h ou até que seja sua vez. Posição: ${result.priority_position}`,
        });

        await fetchPendingReservations();
        
        // Reset form
        setFormData({
          aircraft_id: '',
          departure_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
          departure_time: '',
          return_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
          return_time: '',
          origin: 'Aracatuba',
          destination: '',
          passengers: 1,
          flight_hours: 0,
          total_cost: 0
        });

        if (onReservationComplete) {
          onReservationComplete();
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar pré-reserva. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!profile) return null;

  const isPriorityOne = userPriorityPosition === 1;
  const selectedAircraft = aircraftList.find(a => a.id === formData.aircraft_id);
  const estimatedCost = calculateCosts();

  return (
    <div className="space-y-6">
      {/* Status da Prioridade */}
      <Card className={`aviation-card ${isPriorityOne ? 'border-gold-500 bg-gradient-to-r from-yellow-50 to-amber-50' : ''}`}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            {isPriorityOne ? <Crown className="h-5 w-5 text-yellow-600" /> : <Users className="h-5 w-5" />}
            <span>Sua Posição na Fila de Prioridades</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-aviation-blue">
                #{userPriorityPosition || 'N/A'}
              </div>
              <p className="text-sm text-gray-600">
                {isPriorityOne ? 'Confirmação imediata!' : 'Aguarda 12h para confirmação'}
              </p>
            </div>
            {isPriorityOne && (
              <Badge className="bg-yellow-500 text-white">
                <Crown className="h-3 w-3 mr-1" />
                Prioridade Máxima
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pré-reservas Pendentes */}
      {pendingReservations.length > 0 && (
        <Card className="aviation-card border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Timer className="h-5 w-5" />
              <span>Pré-reserva Pendente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingReservations.map((reservation) => (
              <div key={reservation.id} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-orange-900">
                      {reservation.origin} → {reservation.destination}
                    </h4>
                    <p className="text-sm text-orange-700">
                      {new Date(reservation.departure_date).toLocaleDateString('pt-BR')} às {reservation.departure_time}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-orange-600 border-orange-600">
                    Posição #{reservation.priority_position}
                  </Badge>
                </div>
                
                <div className="bg-white p-3 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Tempo restante:</span>
                    <span className="text-sm font-mono text-orange-600">{timeRemaining}</span>
                  </div>
                  <Progress 
                    value={Math.max(0, Math.min(100, (new Date(reservation.expires_at).getTime() - Date.now()) / (12 * 60 * 60 * 1000) * 100))} 
                    className="h-2"
                  />
                </div>

                {reservation.priority_position === 1 && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => {
                      // TODO: Implementar confirmação de pagamento
                      toast({
                        title: "Confirmar Pagamento",
                        description: "Funcionalidade de pagamento será implementada em breve.",
                      });
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Confirmar e Pagar - R$ {reservation.total_cost.toLocaleString('pt-BR')}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Formulário de Nova Pré-reserva */}
      <Card className="aviation-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5" />
            <span>Nova Pré-reserva</span>
          </CardTitle>
          <CardDescription>
            {isPriorityOne 
              ? "Como você está em 1º lugar, sua reserva será confirmada imediatamente após pagamento!"
              : `Posição ${userPriorityPosition}: Aguarde 12h para confirmação ou até que seja sua vez.`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aircraft">Aeronave</Label>
                <Select value={formData.aircraft_id} onValueChange={(value) => setFormData({...formData, aircraft_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a aeronave" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraftList.map((plane) => (
                      <SelectItem key={plane.id} value={plane.id}>
                        {plane.name} - {plane.model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="destination">Destino</Label>
                <Input
                  id="destination"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  placeholder="Ex: São Paulo, Rio de Janeiro"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure_date">Data de Partida</Label>
                <Input
                  id="departure_date"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.departure_date}
                  onChange={(e) => setFormData({...formData, departure_date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure_time">Horário de Partida</Label>
                <Input
                  id="departure_time"
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({...formData, departure_time: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_date">Data de Retorno</Label>
                <Input
                  id="return_date"
                  type="date"
                  min={formData.departure_date || new Date().toISOString().split('T')[0]}
                  value={formData.return_date}
                  onChange={(e) => setFormData({...formData, return_date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_time">Horário de Retorno</Label>
                <Input
                  id="return_time"
                  type="time"
                  value={formData.return_time}
                  onChange={(e) => setFormData({...formData, return_time: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="passengers">Passageiros</Label>
                <Input
                  id="passengers"
                  type="number"
                  min="1"
                  max={selectedAircraft?.max_passengers || 8}
                  value={formData.passengers}
                  onChange={(e) => setFormData({...formData, passengers: parseInt(e.target.value) || 1})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="flight_hours">Horas de Voo</Label>
                <Input
                  id="flight_hours"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.flight_hours}
                  onChange={(e) => setFormData({...formData, flight_hours: parseFloat(e.target.value) || 0})}
                  required
                />
              </div>
            </div>

            {estimatedCost > 0 && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Custo Estimado:</span>
                    <span className="text-xl font-bold text-blue-600">
                      R$ {estimatedCost.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Taxa de 2% será aplicada para pagamento com cartão
                  </p>
                </CardContent>
              </Card>
            )}

            <Button 
              type="submit" 
              className="w-full bg-aviation-gradient hover:opacity-90 text-white"
              disabled={!formData.aircraft_id || !formData.destination || formData.flight_hours <= 0 || isSubmitting}
            >
              <Plane className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Criando Pré-reserva...' : 
               isPriorityOne ? 'Criar e Confirmar Reserva' : 'Criar Pré-reserva'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreReservationSystem;
