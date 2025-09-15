-- Run this SQL script in Supabase SQL Editor to fix payment columns
-- This fixes the error: Could not find the 'payment_amount' column of 'orders' in the schema cache

-- Add payment_amount column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10,2);

-- Add payment_method column if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20);

-- Add payment_status column if it doesn't exist
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON public.orders(payment_method);

-- Update existing orders to have default payment status
UPDATE public.orders 
SET payment_status = 'pending' 
WHERE payment_status IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
ORDER BY ordinal_position;