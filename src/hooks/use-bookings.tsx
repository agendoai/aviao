
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Booking = Tables<'bookings'>;
type PreReservation = Tables<'pre_reservations'>;

export const useBookings = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [preReservations, setPreReservations] = useState<PreReservation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      fetchBookings();
      fetchPreReservations();
    }
  }, [profile?.id]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          aircraft:aircraft_id (name, model, registration)
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar reservas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPreReservations = async () => {
    try {
      const { data, error } = await supabase
        .from('pre_reservations')
        .select(`
          *,
          aircraft:aircraft_id (name, model, registration)
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPreReservations(data || []);
    } catch (error) {
      console.error('Error fetching pre-reservations:', error);
    }
  };

  const createPreReservation = async (reservationData: any) => {
    try {
      const { data, error } = await supabase.rpc('create_pre_reservation', {
        p_aircraft_id: reservationData.aircraftId,
        p_departure_date: reservationData.departureDate,
        p_departure_time: reservationData.departureTime,
        p_return_date: reservationData.returnDate,
        p_return_time: reservationData.returnTime,
        p_origin: reservationData.origin,
        p_destination: reservationData.destination,
        p_passengers: reservationData.passengers,
        p_flight_hours: reservationData.flightHours,
        p_total_cost: reservationData.totalCost
      });

      if (error) throw error;

      toast({
        title: "Pré-reserva Criada",
        description: "Sua pré-reserva foi criada com sucesso",
      });

      fetchPreReservations();
      return data;
    } catch (error) {
      console.error('Error creating pre-reservation:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar pré-reserva",
        variant: "destructive"
      });
      throw error;
    }
  };

  const confirmPreReservation = async (preReservationId: string, paymentMethod: string) => {
    try {
      const { data, error } = await supabase.rpc('confirm_pre_reservation', {
        p_pre_reservation_id: preReservationId,
        p_payment_method: paymentMethod
      });

      if (error) throw error;

      toast({
        title: "Reserva Confirmada",
        description: "Sua reserva foi confirmada com sucesso",
      });

      fetchBookings();
      fetchPreReservations();
      return data;
    } catch (error) {
      console.error('Error confirming pre-reservation:', error);
      toast({
        title: "Erro",
        description: "Erro ao confirmar reserva",
        variant: "destructive"
      });
      throw error;
    }
  };

  return {
    bookings,
    preReservations,
    loading,
    createPreReservation,
    confirmPreReservation,
    fetchBookings,
    fetchPreReservations
  };
};
