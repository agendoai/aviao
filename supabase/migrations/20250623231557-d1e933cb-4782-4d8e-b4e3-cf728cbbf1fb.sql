
-- Atualizar a função create_pre_reservation para calcular pernoites automaticamente
CREATE OR REPLACE FUNCTION public.create_pre_reservation(
  p_aircraft_id uuid,
  p_departure_date date,
  p_departure_time time without time zone,
  p_return_date date,
  p_return_time time without time zone,
  p_origin text,
  p_destination text,
  p_passengers integer,
  p_flight_hours numeric,
  p_total_cost numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_pre_reservation_id uuid;
  v_priority_position integer;
  v_expires_at timestamp with time zone;
  v_can_confirm_immediately boolean := false;
  v_overnight_stays integer := 0;
  v_overnight_fee numeric := 0;
  v_final_cost numeric;
  v_departure_datetime timestamp;
  v_return_datetime timestamp;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated');
  END IF;

  -- Input validation
  IF p_flight_hours <= 0 THEN
    RETURN json_build_object('error', 'Flight hours must be greater than 0');
  END IF;

  IF p_passengers <= 0 THEN
    RETURN json_build_object('error', 'Passengers must be greater than 0');
  END IF;

  IF LENGTH(TRIM(p_origin)) = 0 OR LENGTH(TRIM(p_destination)) = 0 THEN
    RETURN json_build_object('error', 'Origin and destination are required');
  END IF;

  -- Calcular timestamps completos
  v_departure_datetime := p_departure_date + p_departure_time;
  v_return_datetime := p_return_date + p_return_time;

  -- Verificar se o retorno é após meia-noite (pernoite)
  IF p_return_time < p_departure_time OR p_return_date > p_departure_date THEN
    v_overnight_stays := (p_return_date - p_departure_date);
    IF v_overnight_stays = 0 AND p_return_time < p_departure_time THEN
      v_overnight_stays := 1; -- Passou da meia-noite no mesmo dia
    END IF;
    v_overnight_fee := v_overnight_stays * 1500;
  END IF;

  -- Recalcular custo total com pernoite
  v_final_cost := p_total_cost + v_overnight_fee;

  -- Get user's current priority position
  SELECT priority_position INTO v_priority_position
  FROM public.profiles
  WHERE id = v_user_id;

  -- Check if user has priority position #1 (can confirm immediately)
  IF v_priority_position = 1 THEN
    v_can_confirm_immediately := true;
    v_expires_at := now() + interval '1 hour'; -- Short expiration for immediate confirmation
  ELSE
    v_can_confirm_immediately := false;
    -- Se for após 20h, expira à meia-noite. Senão, expira em 12h
    IF EXTRACT(HOUR FROM now()) >= 20 THEN
      v_expires_at := date_trunc('day', now()) + interval '1 day'; -- Meia-noite
    ELSE
      v_expires_at := now() + interval '12 hours'; -- 12 hour waiting period
    END IF;
  END IF;

  -- Create pre-reservation
  INSERT INTO public.pre_reservations (
    user_id, aircraft_id, departure_date, departure_time,
    return_date, return_time, origin, destination, passengers,
    flight_hours, total_cost, priority_position, expires_at,
    overnight_stays, overnight_fee
  ) VALUES (
    v_user_id, p_aircraft_id, p_departure_date, p_departure_time,
    p_return_date, p_return_time, p_origin, p_destination, p_passengers,
    p_flight_hours, v_final_cost, v_priority_position, v_expires_at,
    v_overnight_stays, v_overnight_fee
  ) RETURNING id INTO v_pre_reservation_id;

  RETURN json_build_object(
    'success', true,
    'pre_reservation_id', v_pre_reservation_id,
    'priority_position', v_priority_position,
    'expires_at', v_expires_at,
    'can_confirm_immediately', v_can_confirm_immediately,
    'overnight_stays', v_overnight_stays,
    'overnight_fee', v_overnight_fee,
    'final_cost', v_final_cost
  );
END;
$function$;

-- Adicionar colunas para pernoite na tabela pre_reservations se não existirem
ALTER TABLE public.pre_reservations 
ADD COLUMN IF NOT EXISTS overnight_stays integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS overnight_fee numeric DEFAULT 0;

-- Função para confirmar automaticamente reservas expiradas à meia-noite
CREATE OR REPLACE FUNCTION public.auto_confirm_expired_reservations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_reservation record;
  v_user_balance numeric;
  v_booking_id uuid;
  v_blocked_until timestamp with time zone;
BEGIN
  -- Buscar pré-reservas que expiraram e ainda estão esperando
  FOR v_reservation IN 
    SELECT * FROM public.pre_reservations 
    WHERE status = 'waiting' 
    AND expires_at <= now()
    AND priority_position > 1
  LOOP
    -- Verificar saldo do usuário
    SELECT balance INTO v_user_balance
    FROM public.profiles
    WHERE id = v_reservation.user_id;

    -- Se tem saldo suficiente, confirmar automaticamente
    IF v_user_balance >= v_reservation.total_cost THEN
      -- Calcular bloqueio pós-voo (retorno + flight_hours/2 + 3h)
      v_blocked_until := (v_reservation.return_date + v_reservation.return_time) + 
                        ((v_reservation.flight_hours / 2) || ' hours')::interval + 
                        interval '3 hours';

      -- Criar booking confirmado
      INSERT INTO public.bookings (
        user_id, aircraft_id, departure_date, departure_time,
        return_date, return_time, origin, destination, passengers,
        flight_hours, airport_fees, overnight_stays, overnight_fee,
        total_cost, status, blocked_until, maintenance_buffer_hours
      ) VALUES (
        v_reservation.user_id, v_reservation.aircraft_id, v_reservation.departure_date, v_reservation.departure_time,
        v_reservation.return_date, v_reservation.return_time, v_reservation.origin, v_reservation.destination,
        v_reservation.passengers, v_reservation.flight_hours, 0, 
        COALESCE(v_reservation.overnight_stays, 0), COALESCE(v_reservation.overnight_fee, 0),
        v_reservation.total_cost, 'confirmed', v_blocked_until, 3
      ) RETURNING id INTO v_booking_id;

      -- Atualizar pré-reserva como confirmada automaticamente
      UPDATE public.pre_reservations 
      SET status = 'auto_confirmed', updated_at = now()
      WHERE id = v_reservation.id;

      -- Criar transação
      INSERT INTO public.transactions (user_id, booking_id, amount, description, type)
      VALUES (v_reservation.user_id, v_booking_id, v_reservation.total_cost, 
              'Reserva Auto-confirmada: ' || v_reservation.origin || ' → ' || v_reservation.destination, 
              'debit');

      -- Atualizar saldo do usuário
      UPDATE public.profiles
      SET balance = balance - v_reservation.total_cost
      WHERE id = v_reservation.user_id;
    ELSE
      -- Marcar como expirada por saldo insuficiente
      UPDATE public.pre_reservations 
      SET status = 'expired_insufficient_balance', updated_at = now()
      WHERE id = v_reservation.id;
    END IF;
  END LOOP;
END;
$function$;
