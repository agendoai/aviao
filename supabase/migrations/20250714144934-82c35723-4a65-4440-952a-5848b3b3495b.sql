-- Criar tabela para armazenar informações dos passageiros de pré-reservas
CREATE TABLE public.pre_reservation_passengers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pre_reservation_id UUID NOT NULL,
  name TEXT NOT NULL,
  document_number TEXT NOT NULL,
  document_type TEXT NOT NULL CHECK (document_type IN ('rg', 'passaporte')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar foreign key para pre_reservations
ALTER TABLE public.pre_reservation_passengers 
ADD CONSTRAINT pre_reservation_passengers_pre_reservation_id_fkey 
FOREIGN KEY (pre_reservation_id) REFERENCES public.pre_reservations(id);

-- Habilitar RLS
ALTER TABLE public.pre_reservation_passengers ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Users can view passengers from their pre-reservations" 
ON public.pre_reservation_passengers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.pre_reservations 
  WHERE pre_reservations.id = pre_reservation_passengers.pre_reservation_id 
  AND pre_reservations.user_id = auth.uid()
));

CREATE POLICY "Users can create passengers for their pre-reservations" 
ON public.pre_reservation_passengers 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.pre_reservations 
  WHERE pre_reservations.id = pre_reservation_passengers.pre_reservation_id 
  AND pre_reservations.user_id = auth.uid()
));

CREATE POLICY "Users can update passengers from their pre-reservations" 
ON public.pre_reservation_passengers 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.pre_reservations 
  WHERE pre_reservations.id = pre_reservation_passengers.pre_reservation_id 
  AND pre_reservations.user_id = auth.uid()
));

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_pre_reservation_passengers_updated_at
BEFORE UPDATE ON public.pre_reservation_passengers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();