
-- Criar tabela para métodos de pagamento
CREATE TABLE public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'debit_card', 'pix', 'bank_transfer')),
  card_number_last_four TEXT,
  card_brand TEXT,
  card_holder_name TEXT,
  pix_key TEXT,
  bank_account_info JSONB,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Criar tabela para histórico de recargas
CREATE TABLE public.credit_recharges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_method_id UUID REFERENCES public.payment_methods(id),
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transaction_id TEXT,
  external_payment_id TEXT,
  metadata JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_recharges ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para payment_methods
CREATE POLICY "Users can view their own payment methods" 
ON public.payment_methods FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment methods" 
ON public.payment_methods FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment methods" 
ON public.payment_methods FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment methods" 
ON public.payment_methods FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para credit_recharges
CREATE POLICY "Users can view their own recharges" 
ON public.credit_recharges FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recharges" 
ON public.credit_recharges FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Função para processar recarga de crédito
CREATE OR REPLACE FUNCTION public.process_credit_recharge(
  p_amount NUMERIC,
  p_payment_method_id UUID DEFAULT NULL,
  p_payment_method_type TEXT DEFAULT 'balance',
  p_external_payment_id TEXT DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id uuid;
  v_recharge_id uuid;
  v_current_balance numeric;
BEGIN
  -- Get authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'User not authenticated');
  END IF;

  -- Validar valor
  IF p_amount <= 0 THEN
    RETURN json_build_object('error', 'Amount must be greater than 0');
  END IF;

  -- Criar registro de recarga
  INSERT INTO public.credit_recharges (
    user_id, payment_method_id, amount, payment_method_type, 
    status, external_payment_id
  ) VALUES (
    v_user_id, p_payment_method_id, p_amount, p_payment_method_type,
    'completed', p_external_payment_id
  ) RETURNING id INTO v_recharge_id;

  -- Atualizar saldo do usuário
  UPDATE public.profiles
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE id = v_user_id
  RETURNING balance INTO v_current_balance;

  -- Criar transação
  INSERT INTO public.transactions (
    user_id, amount, description, type
  ) VALUES (
    v_user_id, p_amount, 
    'Recarga de crédito - ' || p_payment_method_type, 
    'credit'
  );

  -- Atualizar status da recarga
  UPDATE public.credit_recharges
  SET status = 'completed', processed_at = now()
  WHERE id = v_recharge_id;

  RETURN json_build_object(
    'success', true,
    'recharge_id', v_recharge_id,
    'new_balance', v_current_balance,
    'amount_added', p_amount
  );
END;
$function$;
