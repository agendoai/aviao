
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, CreditCard, Wallet, Plane, Users, MapPin, Moon } from 'lucide-react';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createPreReservation, confirmPreReservation } from '@/utils/supabase-functions';
import type { Tables } from '@/integrations/supabase/types';
import type { PreReservationResponse } from '@/types/supabase-extended';

type Aircraft = Tables<'aircraft'>;
type PreReservation = Tables<'pre_reservations'>;

interface PreReservationSystemProps {
  selectedDate?: Date | null;
  onReservationComplete?: () => void;
}

const PreReservationSystem: React.FC<PreReservationSystemProps> = ({
  selectedDate,
  onReservationComplete
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [aircraftList, setAircraftList] = useState<Aircraft[]>([]);
  const [currentPreReservation, setCurrentPreReservation] = useState<PreReservation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card'>('wallet');
  
  // Form state
  const [formData, setFormData] = useState({
    aircraft_id: '',
    departure_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    departure_time: '08:00',
    return_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
    return_time: '18:00',
    origin: 'Aracatuba',
    destination: '',
    passengers: 1,
    flight_hours: 2.0
  });

  useEffect(() => {
    fetchAircraft();
    fetchCurrentPreReservation();
  }, [profile]);

  useEffect(() => {
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        departure_date: format(selectedDate, 'yyyy-MM-dd'),
        return_date: format(selectedDate, 'yyyy-MM-dd')
      }));
    }
  }, [selectedDate]);

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

  const fetchCurrentPreReservation = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('pre_reservations')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (error) throw error;
      if (data && data.length > 0) {
        setCurrentPreReservation(data[0]);
      }
    } catch (error) {
      console.error('Error fetching pre-reservation:', error);
    }
  };

  const calculateCost = () => {
    const selectedAircraft = aircraftList.find(a => a.id === formData.aircraft_id);
    if (!selectedAircraft) return 0;
    
    const baseCost = selectedAircraft.hourly_rate * formData.flight_hours;
    const airportFees = 150; // Taxa padrão de aeroporto
    
    return baseCost + airportFees;
  };

  const calculateOvernightStays = () => {
    const departureTime = formData.departure_time;
    const returnTime = formData.return_time;
    const departureDate = new Date(formData.departure_date);
    const returnDate = new Date(formData.return_date);
    
    // Se a data de retorno é diferente da partida, ou se o horário de retorno é menor que o de partida
    if (returnDate > departureDate || (returnDate.getTime() === departureDate.getTime() && returnTime < departureTime)) {
      const daysDiff = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === 0 && returnTime < departureTime) {
        return 1; // Passou da meia-noite no mesmo dia
      }
      return daysDiff;
    }
    return 0;
  };

  const calculateFinalCost = (baseCost: number, overnightStays: number = 0) => {
    const overnightFee = overnightStays * 1500;
    let finalCost = baseCost + overnightFee;
    
    if (paymentMethod === 'card') {
      finalCost = finalCost * 1.02; // +2% para cartão
    }
    return { finalCost, overnightFee };
  };

  const getExpirationMessage = () => {
    if (!profile) return '';
    
    if (profile.priority_position === 1) {
      return 'Você pode confirmar imediatamente!';
    } else {
      const currentHour = new Date().getHours();
      if (currentHour >= 20) {
        return 'Reserva será confirmada automaticamente à meia-noite se ninguém com prioridade maior reservar.';
      } else {
        return 'Aguarde até 12h para confirmação automática se ninguém com prioridade maior reservar.';
      }
    }
  };

  const handleCreatePreReservation = async () => {
    if (!profile) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para fazer uma reserva.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.aircraft_id || !formData.destination) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    // Validar se há volta obrigatória
    if (!formData.return_date || !formData.return_time) {
      toast({
        title: "Erro",
        description: "Data e horário de retorno são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const totalCost = calculateCost();
      
      const response = await createPreReservation({
        aircraft_id: formData.aircraft_id,
        departure_date: formData.departure_date,
        departure_time: formData.departure_time,
        return_date: formData.return_date,
        return_time: formData.return_time,
        origin: formData.origin,
        destination: formData.destination,
        passengers: formData.passengers,
        flight_hours: formData.flight_hours,
        total_cost: totalCost
      });

      if (response.error) {
        toast({
          title: "Erro",
          description: response.error,
          variant: "destructive"
        });
        return;
      }

      if (response.success) {
        const overnightMsg = response.overnight_stays > 0 
          ? ` (+ R$ ${response.overnight_fee.toFixed(2)} de pernoite)` 
          : '';
          
        toast({
          title: "Pré-reserva criada!",
          description: `Posição ${response.priority_position} na fila. Custo: R$ ${response.final_cost.toFixed(2)}${overnightMsg}. ${
            response.can_confirm_immediately 
              ? 'Você pode confirmar imediatamente!' 
              : getExpirationMessage()
          }`
        });
        
        await fetchCurrentPreReservation();
      }
    } catch (error) {
      console.error('Error creating pre-reservation:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReservation = async () => {
    if (!currentPreReservation) return;
    
    setIsLoading(true);
    
    try {
      const response = await confirmPreReservation({
        pre_reservation_id: currentPreReservation.id,
        payment_method: paymentMethod
      });

      if (response.error) {
        toast({
          title: "Erro",
          description: response.error,
          variant: "destructive"
        });
        return;
      }

      if (response.success) {
        toast({
          title: "Reserva confirmada!",
          description: `Voo confirmado! Custo final: R$ ${response.final_cost?.toFixed(2)}`,
        });
        
        setCurrentPreReservation(null);
        if (onReservationComplete) {
          onReservationComplete();
        }
      }
    } catch (error) {
      console.error('Error confirming reservation:', error);
      toast({
        title: "Erro",
        description: "Erro interno do sistema. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return null;

  const overnightStays = calculateOvernightStays();
  const baseCost = calculateCost();
  const { finalCost, overnightFee } = calculateFinalCost(baseCost, overnightStays);

  return (
    <div className="space-y-6">
      {profile && (
        <Card className="aviation-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Sua Posição na Fila</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-aviation-blue">
                #{profile.priority_position}
              </div>
              <p className="text-gray-600 mt-2">
                {getExpirationMessage()}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentPreReservation ? (
        <Card className="aviation-card border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800">
              Pré-reserva Ativa
            </CardTitle>
            <CardDescription>
              Você tem uma pré-reserva aguardando confirmação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Rota:</span>
                <p>{currentPreReservation.origin} → {currentPreReservation.destination}</p>
              </div>
              <div>
                <span className="font-medium">Data/Hora Ida:</span>
                <p>{format(new Date(currentPreReservation.departure_date), 'dd/MM/yyyy', { locale: ptBR })} às {currentPreReservation.departure_time}</p>
              </div>
              <div>
                <span className="font-medium">Data/Hora Volta:</span>
                <p>{format(new Date(currentPreReservation.return_date), 'dd/MM/yyyy', { locale: ptBR })} às {currentPreReservation.return_time}</p>
              </div>
              <div>
                <span className="font-medium">Posição:</span>
                <Badge variant="outline">#{currentPreReservation.priority_position}</Badge>
              </div>
            </div>

            {(currentPreReservation as any).overnight_stays > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 text-blue-800">
                  <Moon className="h-4 w-4" />
                  <span className="font-medium">Pernoite Detectada</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  {(currentPreReservation as any).overnight_stays} noite(s) × R$ 1.500,00 = R$ {((currentPreReservation as any).overnight_fee || 0).toFixed(2)}
                </p>
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <h4 className="font-medium">Escolha a forma de pagamento:</h4>
              <RadioGroup value={paymentMethod} onValueChange={(value: 'wallet' | 'card') => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="wallet" id="wallet" />
                  <Label htmlFor="wallet" className="flex items-center space-x-2">
                    <Wallet className="h-4 w-4" />
                    <span>Carteira Digital (Sem taxa)</span>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4" />
                    <span>Cartão (+2% taxa)</span>
                  </Label>
                </div>
              </RadioGroup>

              <div className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span>Custo base:</span>
                  <span>R$ {(currentPreReservation.total_cost - ((currentPreReservation as any).overnight_fee || 0)).toFixed(2)}</span>
                </div>
                {(currentPreReservation as any).overnight_fee > 0 && (
                  <div className="flex justify-between items-center text-blue-600">
                    <span>Taxa de pernoite:</span>
                    <span>+R$ {((currentPreReservation as any).overnight_fee || 0).toFixed(2)}</span>
                  </div>
                )}
                {paymentMethod === 'card' && (
                  <div className="flex justify-between items-center text-red-600">
                    <span>Taxa cartão (2%):</span>
                    <span>+R$ {(currentPreReservation.total_cost * 0.02).toFixed(2)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between items-center font-bold">
                  <span>Total final:</span>
                  <span>R$ {(paymentMethod === 'card' ? currentPreReservation.total_cost * 1.02 : currentPreReservation.total_cost).toFixed(2)}</span>
                </div>
              </div>

              <Button 
                onClick={handleConfirmReservation}
                disabled={isLoading}
                className="w-full bg-aviation-gradient hover:opacity-90 text-white"
              >
                {isLoading ? 'Processando...' : 'Confirmar Reserva'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="aviation-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plane className="h-5 w-5" />
              <span>Nova Pré-reserva</span>
            </CardTitle>
            <CardDescription>
              Crie uma pré-reserva com ida e volta obrigatórias
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                <strong>Importante:</strong> Todo voo deve ter ida e volta. Se o retorno for após meia-noite, será cobrada taxa de pernoite de R$ 1.500,00 por noite.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aircraft">Aeronave</Label>
                <Select value={formData.aircraft_id} onValueChange={(value) => setFormData({...formData, aircraft_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma aeronave" />
                  </SelectTrigger>
                  <SelectContent>
                    {aircraftList.map((aircraft) => (
                      <SelectItem key={aircraft.id} value={aircraft.id}>
                        {aircraft.name} - {aircraft.model} ({aircraft.max_passengers} pax)
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
                  placeholder="Ex: São Paulo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure_date">Data de Partida</Label>
                <Input
                  id="departure_date"
                  type="date"
                  value={formData.departure_date}
                  onChange={(e) => setFormData({...formData, departure_date: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="departure_time">Horário de Partida</Label>
                <Input
                  id="departure_time"
                  type="time"
                  value={formData.departure_time}
                  onChange={(e) => setFormData({...formData, departure_time: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_date">Data de Retorno *</Label>
                <Input
                  id="return_date"
                  type="date"
                  value={formData.return_date}
                  onChange={(e) => setFormData({...formData, return_date: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="return_time">Horário de Retorno *</Label>
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
                <Select value={formData.passengers.toString()} onValueChange={(value) => setFormData({...formData, passengers: parseInt(value)})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1,2,3,4,5,6,7,8].map(num => (
                      <SelectItem key={num} value={num.toString()}>{num} passageiro{num > 1 ? 's' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="flight_hours">Horas de Voo</Label>
                <Input
                  id="flight_hours"
                  type="number"
                  step="0.1"
                  value={formData.flight_hours}
                  onChange={(e) => setFormData({...formData, flight_hours: parseFloat(e.target.value)})}
                />
              </div>
            </div>

            {formData.aircraft_id && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Estimativa de Custo</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span>Horas de voo:</span>
                    <span>{formData.flight_hours}h × R$ {aircraftList.find(a => a.id === formData.aircraft_id)?.hourly_rate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxas de aeroporto:</span>
                    <span>R$ 150,00</span>
                  </div>
                  {overnightStays > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Pernoite ({overnightStays} noite{overnightStays > 1 ? 's' : ''}):</span>
                      <span>+R$ {overnightFee.toFixed(2)}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>Total estimado:</span>
                    <span>R$ {(baseCost + overnightFee).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <Button 
              onClick={handleCreatePreReservation}
              disabled={isLoading || !formData.aircraft_id || !formData.destination || !formData.return_date || !formData.return_time}
              className="w-full bg-aviation-gradient hover:opacity-90 text-white"
            >
              {isLoading ? 'Criando...' : 'Criar Pré-reserva'}
            </Button>
          </CardContent>
        </Card>
      )}

      <Alert>
        <Clock className="h-4 w-4" />
        <AlertDescription>
          <strong>Como funciona:</strong> {getExpirationMessage()} A aeronave fica bloqueada por 3h após o retorno para manutenção.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default PreReservationSystem;
