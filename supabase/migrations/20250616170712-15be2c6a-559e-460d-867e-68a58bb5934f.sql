
-- Criação dos tipos enum
CREATE TYPE membership_tier AS ENUM ('basic', 'premium', 'vip');
CREATE TYPE monthly_fee_status AS ENUM ('paid', 'pending', 'overdue');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');
CREATE TYPE aircraft_status AS ENUM ('available', 'in_flight', 'maintenance');

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  membership_tier membership_tier NOT NULL DEFAULT 'basic',
  priority_position INTEGER NOT NULL,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,
  monthly_fee_status monthly_fee_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabela de aeronaves
CREATE TABLE public.aircraft (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT NOT NULL,
  registration TEXT NOT NULL UNIQUE,
  hourly_rate DECIMAL(8,2) NOT NULL DEFAULT 2800.00,
  max_passengers INTEGER NOT NULL DEFAULT 8,
  status aircraft_status NOT NULL DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabela de reservas
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  aircraft_id UUID NOT NULL REFERENCES public.aircraft(id) ON DELETE CASCADE,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  return_date DATE NOT NULL,
  return_time TIME NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  passengers INTEGER NOT NULL DEFAULT 1,
  stops TEXT,
  notes TEXT,
  flight_hours DECIMAL(4,1) NOT NULL,
  airport_fees DECIMAL(8,2) NOT NULL,
  overnight_stays INTEGER NOT NULL DEFAULT 0,
  overnight_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  priority_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Tabela de transações financeiras
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'refund', 'penalty')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Inserir aeronaves de exemplo
INSERT INTO public.aircraft (name, model, registration, hourly_rate, max_passengers) VALUES
('Citation CJ3+', 'Cessna Citation CJ3+', 'PR-ECA', 2800.00, 6),
('Phenom 300', 'Embraer Phenom 300', 'PR-ECB', 2800.00, 8),
('King Air 350', 'Beechcraft King Air 350', 'PR-ECC', 2800.00, 9);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Políticas RLS para aircraft (todos podem visualizar)
CREATE POLICY "Anyone can view aircraft" ON public.aircraft
  FOR SELECT TO authenticated USING (true);

-- Políticas RLS para bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas RLS para transactions
CREATE POLICY "Users can view their own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  max_position INTEGER;
BEGIN
  -- Busca a maior posição de prioridade atual
  SELECT COALESCE(MAX(priority_position), 0) INTO max_position FROM public.profiles;
  
  -- Insere novo perfil com próxima posição disponível
  INSERT INTO public.profiles (id, name, email, priority_position)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    max_position + 1
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Função para rotacionar prioridades diariamente
CREATE OR REPLACE FUNCTION public.rotate_priorities()
RETURNS void AS $$
BEGIN
  -- Move o primeiro para o final e todos os outros sobem uma posição
  UPDATE public.profiles
  SET priority_position = CASE
    WHEN priority_position = 1 THEN (SELECT COUNT(*) FROM public.profiles)
    ELSE priority_position - 1
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
