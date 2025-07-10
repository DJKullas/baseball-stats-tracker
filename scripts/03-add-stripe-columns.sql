-- This script adds the necessary columns to your 'profiles' table
-- to store Stripe customer and subscription information.

alter table public.profiles
  add column stripe_customer_id text,
  add column stripe_subscription_id text,
  add column stripe_subscription_status text;

-- Add a unique constraint to stripe_customer_id for easier lookups from webhooks
alter table public.profiles
  add constraint unique_stripe_customer_id unique (stripe_customer_id);
