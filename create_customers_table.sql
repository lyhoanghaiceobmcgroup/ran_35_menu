-- Script to create customers table in Supabase
-- Run this in Supabase SQL Editor

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone VARCHAR(15) NOT NULL UNIQUE,
  table_code VARCHAR(10),
  first_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_visit_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visit_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_table_code ON public.customers(table_code);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public insert customers" ON public.customers;
DROP POLICY IF EXISTS "Allow public update customers" ON public.customers;

-- Create RLS policies
CREATE POLICY "Allow public read access to customers" 
ON public.customers 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public insert customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update customers" 
ON public.customers 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_customer_visit()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_customers_updated_at ON public.customers;

-- Create trigger to automatically update timestamps
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_visit();

-- Create function to handle customer visits (upsert)
CREATE OR REPLACE FUNCTION handle_customer_visit(
  customer_phone VARCHAR(15),
  customer_table_code VARCHAR(10)
)
RETURNS UUID AS $$
DECLARE
  customer_id UUID;
BEGIN
  -- Try to update existing customer
  UPDATE public.customers 
  SET 
    last_visit_at = NOW(),
    visit_count = visit_count + 1,
    table_code = customer_table_code
  WHERE phone = customer_phone
  RETURNING id INTO customer_id;
  
  -- If no existing customer, insert new one
  IF customer_id IS NULL THEN
    INSERT INTO public.customers (phone, table_code)
    VALUES (customer_phone, customer_table_code)
    RETURNING id INTO customer_id;
  END IF;
  
  RETURN customer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.customers TO anon;
GRANT ALL ON public.customers TO authenticated;
GRANT EXECUTE ON FUNCTION handle_customer_visit(VARCHAR, VARCHAR) TO anon;
GRANT EXECUTE ON FUNCTION handle_customer_visit(VARCHAR, VARCHAR) TO authenticated;

-- Test the setup
SELECT 'Customers table setup completed successfully!' as status;