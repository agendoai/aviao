
-- Create the create_pre_reservation function
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
    v_expires_at := now() + interval '12 hours'; -- 12 hour waiting period
  END IF;

  -- Create pre-reservation
  INSERT INTO public.pre_reservations (
    user_id, aircraft_id, departure_date, departure_time,
    return_date, return_time, origin, destination, passengers,
    flight_hours, total_cost, priority_position, expires_at
  ) VALUES (
    v_user_id, p_aircraft_id, p_departure_date, p_departure_time,
    p_return_date, p_return_time, p_origin, p_destination, p_passengers,
    p_flight_hours, p_total_cost, v_priority_position, v_expires_at
  ) RETURNING id INTO v_pre_reservation_id;

  RETURN json_build_object(
    'success', true,
    'pre_reservation_id', v_pre_reservation_id,
    'priority_position', v_priority_position,
    'expires_at', v_expires_at,
    'can_confirm_immediately', v_can_confirm_immediately
  );
END;
$function$;

-- Create the confirm_pre_reservation function
CREATE OR REPLACE FUNCTION public.confirm_pre_reservation(
  p_pre_reservation_id uuid,
  p_payment_method text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_user_balance numeric;
  v_pre_reservation record;
  v_booking_id uuid;
  v_final_cost numeric;
  v_card_fee numeric := 0;
  v_blocked_until timestamp with time zone;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated');
  END IF;

  -- Get pre-reservation details
  SELECT * INTO v_pre_reservation
  FROM public.pre_reservations
  WHERE id = p_pre_reservation_id AND user_id = v_user_id AND status = 'waiting';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Pre-reservation not found or already processed');
  END IF;

  -- Check if pre-reservation has expired
  IF v_pre_reservation.expires_at < now() THEN
    RETURN json_build_object('error', 'Pre-reservation has expired');
  END IF;

  -- Calculate final cost with card fee if applicable
  v_final_cost := v_pre_reservation.total_cost;
  IF p_payment_method = 'card' THEN
    v_card_fee := v_pre_reservation.total_cost * 0.02; -- 2% card fee
    v_final_cost := v_pre_reservation.total_cost + v_card_fee;
  END IF;

  -- Get user balance
  SELECT balance INTO v_user_balance
  FROM public.profiles
  WHERE id = v_user_id;

  -- Check balance
  IF v_final_cost > v_user_balance THEN
    RETURN json_build_object('error', 'Insufficient balance');
  END IF;

  -- Calculate blocked until time (flight duration + 3 hours maintenance)
  v_blocked_until := (v_pre_reservation.departure_date + v_pre_reservation.departure_time)::timestamp + 
                     (v_pre_reservation.flight_hours || ' hours')::interval + 
                     interval '3 hours';

  -- Create booking
  INSERT INTO public.bookings (
    user_id, aircraft_id, departure_date, departure_time,
    return_date, return_time, origin, destination, passengers,
    flight_hours, airport_fees, overnight_fee, total_cost,
    status, blocked_until, maintenance_buffer_hours
  ) VALUES (
    v_user_id, v_pre_reservation.aircraft_id, v_pre_reservation.departure_date, v_pre_reservation.departure_time,
    v_pre_reservation.return_date, v_pre_reservation.return_time, v_pre_reservation.origin, 
    v_pre_reservation.destination, v_pre_reservation.passengers, v_pre_reservation.flight_hours,
    0, 0, v_final_cost, 'confirmed', v_blocked_until, 3
  ) RETURNING id INTO v_booking_id;

  -- Create transaction
  INSERT INTO public.transactions (user_id, booking_id, amount, description, type)
  VALUES (v_user_id, v_booking_id, v_final_cost, 
          'Reserva ' || v_pre_reservation.origin || ' → ' || v_pre_reservation.destination, 'debit');

  -- Update user balance
  UPDATE public.profiles
  SET balance = balance - v_final_cost
  WHERE id = v_user_id;

  -- Update pre-reservation status
  UPDATE public.pre_reservations
  SET status = 'confirmed', payment_method = p_payment_method
  WHERE id = p_pre_reservation_id;

  RETURN json_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'final_cost', v_final_cost,
    'card_fee', v_card_fee,
    'blocked_until', v_blocked_until
  );
END;
$function$;
