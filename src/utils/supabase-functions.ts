
import { supabase } from '@/integrations/supabase/client';
import type { PreReservationResponse, ConfirmReservationResponse } from '@/types/supabase-extended';

export const createPreReservation = async (params: {
  aircraft_id: string;
  departure_date: string;
  departure_time: string;
  return_date: string;
  return_time: string;
  origin: string;
  destination: string;
  passengers: number;
  flight_hours: number;
  total_cost: number;
}): Promise<PreReservationResponse> => {
  const { data, error } = await supabase.rpc('create_pre_reservation', {
    p_aircraft_id: params.aircraft_id,
    p_departure_date: params.departure_date,
    p_departure_time: params.departure_time,
    p_return_date: params.return_date,
    p_return_time: params.return_time,
    p_origin: params.origin,
    p_destination: params.destination,
    p_passengers: params.passengers,
    p_flight_hours: params.flight_hours,
    p_total_cost: params.total_cost
  });

  if (error) {
    console.error('Error creating pre-reservation:', error);
    return { error: error.message };
  }

  return data as PreReservationResponse;
};

export const confirmPreReservation = async (params: {
  pre_reservation_id: string;
  payment_method: 'wallet' | 'card';
}): Promise<ConfirmReservationResponse> => {
  const { data, error } = await supabase.rpc('confirm_pre_reservation', {
    p_pre_reservation_id: params.pre_reservation_id,
    p_payment_method: params.payment_method
  });

  if (error) {
    console.error('Error confirming pre-reservation:', error);
    return { error: error.message };
  }

  return data as ConfirmReservationResponse;
};
