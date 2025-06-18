
-- First, create the missing passengers table
CREATE TABLE public.passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  rg TEXT,
  cpf TEXT UNIQUE,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the booking_passengers association table
CREATE TABLE public.booking_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.passengers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, passenger_id)
);

-- Now create the priority system tables
CREATE TABLE public.priority_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slot_number INTEGER NOT NULL UNIQUE CHECK (slot_number >= 1 AND slot_number <= 100),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acquired_date TIMESTAMP WITH TIME ZONE,
  price_paid DECIMAL(10,2),
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pre-reservations table
CREATE TABLE public.pre_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id),
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  return_date DATE NOT NULL,
  return_time TIME NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  passengers INTEGER NOT NULL DEFAULT 1,
  flight_hours DECIMAL(4,1) NOT NULL,
  total_cost DECIMAL(10,2) NOT NULL,
  priority_position INTEGER NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'confirmed', 'expired', 'cancelled')),
  payment_method TEXT CHECK (payment_method IN ('wallet', 'card')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat system tables
CREATE TABLE public.chat_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  pre_reservation_id UUID REFERENCES public.pre_reservations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'flight_sharing' CHECK (type IN ('flight_sharing', 'general')),
  created_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chat_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'seat_offer', 'seat_request')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seat sharing table
CREATE TABLE public.seat_sharing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  seat_owner_id UUID NOT NULL REFERENCES public.profiles(id),
  seat_passenger_id UUID REFERENCES public.profiles(id),
  passenger_id UUID REFERENCES public.passengers(id),
  seat_number INTEGER NOT NULL,
  price_per_seat DECIMAL(8,2),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'booked', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing tables
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'client' CHECK (role IN ('admin', 'client', 'support', 'concierge', 'pilot', 'owner'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS blocked_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS maintenance_buffer_hours INTEGER DEFAULT 3;
ALTER TABLE public.aircraft ADD COLUMN IF NOT EXISTS seat_configuration JSONB;
ALTER TABLE public.aircraft ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.aircraft ADD COLUMN IF NOT EXISTS maintenance_status TEXT DEFAULT 'operational' CHECK (maintenance_status IN ('operational', 'maintenance', 'inspection', 'grounded'));
ALTER TABLE public.aircraft ADD COLUMN IF NOT EXISTS last_maintenance DATE;
ALTER TABLE public.aircraft ADD COLUMN IF NOT EXISTS next_maintenance DATE;

-- Enable RLS on all new tables
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.priority_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pre_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_sharing ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view passengers from their bookings" ON public.passengers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.booking_passengers bp
      JOIN public.bookings b ON bp.booking_id = b.id
      WHERE bp.passenger_id = passengers.id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create passengers" ON public.passengers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update passengers from their bookings" ON public.passengers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.booking_passengers bp
      JOIN public.bookings b ON bp.booking_id = b.id
      WHERE bp.passenger_id = passengers.id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their booking passengers" ON public.booking_passengers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create booking passengers" ON public.booking_passengers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.bookings WHERE id = booking_id AND user_id = auth.uid())
  );

CREATE POLICY "Anyone can view priority slots" ON public.priority_slots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can modify priority slots" ON public.priority_slots
  FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can view their own pre-reservations" ON public.pre_reservations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create pre-reservations" ON public.pre_reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pre-reservations" ON public.pre_reservations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Participants can view chat rooms" ON public.chat_rooms
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_participants WHERE room_id = chat_rooms.id AND user_id = auth.uid())
  );

CREATE POLICY "Users can create chat rooms" ON public.chat_rooms
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can view messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
  );

CREATE POLICY "Participants can send messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.chat_participants WHERE room_id = chat_messages.room_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view seat sharing for their bookings" ON public.seat_sharing
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND (user_id = auth.uid() OR seat_owner_id = auth.uid() OR seat_passenger_id = auth.uid())
    )
  );

-- Insert the 100 priority slots
INSERT INTO public.priority_slots (slot_number, is_available)
SELECT generate_series(1, 100), true;

-- Update aircraft with seat configuration
UPDATE public.aircraft SET seat_configuration = jsonb_build_object(
  'total_seats', max_passengers,
  'layout', '2-2',
  'seats', (
    SELECT jsonb_agg(
      jsonb_build_object(
        'number', seat_num,
        'row', ((seat_num - 1) / 4) + 1,
        'position', CASE (seat_num - 1) % 4 
          WHEN 0 THEN 'A' 
          WHEN 1 THEN 'B' 
          WHEN 2 THEN 'C' 
          WHEN 3 THEN 'D' 
        END,
        'type', 'standard'
      )
    )
    FROM generate_series(1, max_passengers) AS seat_num
  )
);
