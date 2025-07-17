-- Add currency column to user_balances if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'user_balances' AND column_name = 'currency'
  ) THEN
    ALTER TABLE public.user_balances ADD COLUMN currency TEXT NOT NULL DEFAULT 'credits';
  END IF;
END $$;