-- Add Meta CAPI match fields to orders so later server-side Purchase events can use them
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS fbp text,
  ADD COLUMN IF NOT EXISTS fbc text,
  ADD COLUMN IF NOT EXISTS client_user_agent text;
