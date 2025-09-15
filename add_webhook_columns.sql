-- Add missing columns for webhook functionality
-- Run this SQL script in Supabase SQL Editor

-- Add payment_confirmed_at column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS payment_confirmed_at TIMESTAMP WITH TIME ZONE;

-- Add sepay_transaction_id column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS sepay_transaction_id VARCHAR(50);

-- Add sepay_reference_code column
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS sepay_reference_code VARCHAR(50);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_sepay_transaction_id ON public.orders(sepay_transaction_id);
CREATE INDEX IF NOT EXISTS idx_orders_sepay_reference_code ON public.orders(sepay_reference_code);
CREATE INDEX IF NOT EXISTS idx_orders_payment_confirmed_at ON public.orders(payment_confirmed_at);

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND table_schema = 'public'
AND column_name IN ('payment_confirmed_at', 'sepay_transaction_id', 'sepay_reference_code')
ORDER BY column_name;

SELECT 'Webhook columns added successfully!' as status;