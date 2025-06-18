
-- Função para criar pré-reserva com verificação de prioridade
CREATE OR REPLACE FUNCTION public.create_pre_reservation(
  p_aircraft_id UUID,
  p_departure_date DATE,
  p_departure_time TIME,
  p_return_date DATE,
  p_return_time TIME,
  p_origin TEXT,
  p_destination TEXT,
  p_passengers INTEGER,
  p_flight_hours DECIMAL,
  p_total_cost DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_priority INTEGER;
  v_pre_reservation_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated');
  END IF;

  -- Buscar posição de prioridade do usuário (baseada na menor cota que possui)
  SELECT MIN(slot_number) INTO v_user_priority
  FROM public.priority_slots
  WHERE owner_id = v_user_id;

  IF v_user_priority IS NULL THEN
    RETURN json_build_object('error', 'User does not have any priority slots');
  END IF;

  -- Se é posição 1, pode confirmar imediatamente
  IF v_user_priority = 1 THEN
    v_expires_at := now() + interval '1 hour'; -- 1h para completar pagamento
  ELSE
    v_expires_at := now() + interval '12 hours'; -- 12h de espera
  END IF;

  -- Criar pré-reserva
  INSERT INTO public.pre_reservations (
    user_id, aircraft_id, departure_date, departure_time,
    return_date, return_time, origin, destination, passengers,
    flight_hours, total_cost, priority_position, expires_at
  ) VALUES (
    v_user_id, p_aircraft_id, p_departure_date, p_departure_time,
    p_return_date, p_return_time, p_origin, p_destination, p_passengers,
    p_flight_hours, p_total_cost, v_user_priority, v_expires_at
  ) RETURNING id INTO v_pre_reservation_id;

  RETURN json_build_object(
    'success', true, 
    'pre_reservation_id', v_pre_reservation_id,
    'priority_position', v_user_priority,
    'expires_at', v_expires_at,
    'can_confirm_immediately', v_user_priority = 1
  );
END;
$$;

-- Função para confirmar pré-reserva após pagamento
CREATE OR REPLACE FUNCTION public.confirm_pre_reservation(
  p_pre_reservation_id UUID,
  p_payment_method TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_pre_reservation RECORD;
  v_booking_id UUID;
  v_blocked_until TIMESTAMP WITH TIME ZONE;
  v_card_fee DECIMAL;
  v_final_cost DECIMAL;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated');
  END IF;

  -- Buscar pré-reserva
  SELECT * INTO v_pre_reservation
  FROM public.pre_reservations
  WHERE id = p_pre_reservation_id AND user_id = v_user_id AND status = 'waiting';

  IF v_pre_reservation IS NULL THEN
    RETURN json_build_object('error', 'Pre-reservation not found or already processed');
  END IF;

  -- Verificar se ainda está dentro do prazo
  IF now() > v_pre_reservation.expires_at THEN
    UPDATE public.pre_reservations SET status = 'expired' WHERE id = p_pre_reservation_id;
    RETURN json_build_object('error', 'Pre-reservation has expired');
  END IF;

  -- Calcular custo final (2% taxa para cartão)
  v_final_cost := v_pre_reservation.total_cost;
  IF p_payment_method = 'card' THEN
    v_card_fee := v_pre_reservation.total_cost * 0.02;
    v_final_cost := v_pre_reservation.total_cost + v_card_fee;
  END IF;

  -- Calcular bloqueio pós-voo (duração do voo + 3h)
  v_blocked_until := (v_pre_reservation.return_date + v_pre_reservation.return_time) + interval '3 hours';

  -- Criar booking confirmado
  INSERT INTO public.bookings (
    user_id, aircraft_id, departure_date, departure_time,
    return_date, return_time, origin, destination, passengers,
    flight_hours, airport_fees, total_cost, status, blocked_until,
    notes
  ) VALUES (
    v_user_id, v_pre_reservation.aircraft_id, v_pre_reservation.departure_date, v_pre_reservation.departure_time,
    v_pre_reservation.return_date, v_pre_reservation.return_time, v_pre_reservation.origin, v_pre_reservation.destination,
    v_pre_reservation.passengers, v_pre_reservation.flight_hours, 0, v_final_cost, 'confirmed', v_blocked_until,
    CASE WHEN p_payment_method = 'card' THEN 'Taxa cartão: +2%' ELSE NULL END
  ) RETURNING id INTO v_booking_id;

  -- Atualizar pré-reserva como confirmada
  UPDATE public.pre_reservations 
  SET status = 'confirmed', payment_method = p_payment_method, updated_at = now()
  WHERE id = p_pre_reservation_id;

  -- Criar transação
  INSERT INTO public.transactions (user_id, booking_id, amount, description, type)
  VALUES (v_user_id, v_booking_id, v_final_cost, 
          'Reserva ' || v_pre_reservation.origin || ' → ' || v_pre_reservation.destination || 
          CASE WHEN p_payment_method = 'card' THEN ' (+ 2% taxa cartão)' ELSE '' END, 
          'debit');

  RETURN json_build_object(
    'success', true, 
    'booking_id', v_booking_id,
    'final_cost', v_final_cost,
    'card_fee', COALESCE(v_card_fee, 0),
    'blocked_until', v_blocked_until
  );
END;
$$;
