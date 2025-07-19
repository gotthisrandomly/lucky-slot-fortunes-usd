-- Create payment_records table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.payment_records (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'pending',
  payment_method text,
  stripe_session_id text,
  stripe_payment_intent_id text,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_records
CREATE POLICY "Users can view their own payment records" 
ON public.payment_records 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment records" 
ON public.payment_records 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update payment records" 
ON public.payment_records 
FOR UPDATE 
USING (true);

-- Add foreign key constraint to user_balances if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'user_balances_user_id_fkey' 
    AND table_name = 'user_balances'
  ) THEN
    ALTER TABLE public.user_balances 
    ADD CONSTRAINT user_balances_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint to transactions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'transactions_user_id_fkey' 
    AND table_name = 'transactions'
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add foreign key constraint to game_sessions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'game_sessions_user_id_fkey' 
    AND table_name = 'game_sessions'
  ) THEN
    ALTER TABLE public.game_sessions 
    ADD CONSTRAINT game_sessions_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create function to handle profile creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, new.raw_user_meta_data ->> 'username');
  
  INSERT INTO public.user_balances (user_id, credits)
  VALUES (new.id, 1000); -- Give new users 1000 free credits
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'player');
  
  RETURN new;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();