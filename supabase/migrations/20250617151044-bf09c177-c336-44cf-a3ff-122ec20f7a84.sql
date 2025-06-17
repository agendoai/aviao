
-- Fix the function parameter defaults issue
CREATE OR REPLACE FUNCTION public.create_booking_secure(
  p_aircraft_id uuid,
  p_departure_date date,
  p_departure_time time,
  p_return_date date,
  p_return_time time,
  p_origin text,
  p_destination text,
  p_passengers integer,
  p_flight_hours numeric,
  p_airport_fees numeric,
  p_overnight_stays integer DEFAULT 0,
  p_stops text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_user_balance numeric;
  v_hourly_rate numeric;
  v_overnight_fee numeric;
  v_total_cost numeric;
  v_booking_id uuid;
  v_priority_expires_at timestamp with time zone;
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

  -- Get user balance
  SELECT balance INTO v_user_balance
  FROM public.profiles
  WHERE id = v_user_id;

  -- Get aircraft hourly rate
  SELECT hourly_rate INTO v_hourly_rate
  FROM public.aircraft
  WHERE id = p_aircraft_id AND status = 'available';

  IF v_hourly_rate IS NULL THEN
    RETURN json_build_object('error', 'Aircraft not available');
  END IF;

  -- Calculate costs
  v_overnight_fee := p_overnight_stays * 1500;
  v_total_cost := (v_hourly_rate * p_flight_hours) + p_airport_fees + v_overnight_fee;

  -- Check balance
  IF v_total_cost > v_user_balance THEN
    RETURN json_build_object('error', 'Insufficient balance');
  END IF;

  -- Set priority expiration (24h)
  v_priority_expires_at := now() + interval '24 hours';

  -- Create booking
  INSERT INTO public.bookings (
    user_id, aircraft_id, departure_date, departure_time,
    return_date, return_time, origin, destination, passengers,
    stops, notes, flight_hours, airport_fees, overnight_stays,
    overnight_fee, total_cost, priority_expires_at
  ) VALUES (
    v_user_id, p_aircraft_id, p_departure_date, p_departure_time,
    p_return_date, p_return_time, p_origin, p_destination, p_passengers,
    p_stops, p_notes, p_flight_hours, p_airport_fees, p_overnight_stays,
    v_overnight_fee, v_total_cost, v_priority_expires_at
  ) RETURNING id INTO v_booking_id;

  -- Create transaction
  INSERT INTO public.transactions (user_id, booking_id, amount, description, type)
  VALUES (v_user_id, v_booking_id, v_total_cost, 'Reserva ' || p_origin || ' → ' || p_destination, 'debit');

  -- Update user balance
  UPDATE public.profiles
  SET balance = balance - v_total_cost
  WHERE id = v_user_id;

  RETURN json_build_object('success', true, 'booking_id', v_booking_id);
END;
$$;
