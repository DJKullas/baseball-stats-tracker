-- This script adds the missing 'stripe_price_id' column to the 'profiles' table.
-- This is required to store which subscription plan the user is on.

ALTER TABLE public.profiles
ADD COLUMN stripe_price_id TEXT;

-- This command tells Supabase to refresh its internal schema cache immediately,
-- which can help prevent "column not found" errors after a migration.
NOTIFY pgrst, 'reload schema';
