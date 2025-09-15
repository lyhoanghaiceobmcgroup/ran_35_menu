import { supabase } from '@/integrations/supabase/client';

// Function to create customers table and related database objects
export const createCustomersTable = async () => {
  try {
    // Create customers table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create customers table to store customer information
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
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
        CREATE INDEX IF NOT EXISTS idx_customers_table_code ON public.customers(table_code);
        
        -- Enable RLS
        ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
      `
    });

    if (tableError) {
      console.error('Error creating table:', tableError);
      return { success: false, error: tableError };
    }

    // Create RLS policies
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow public read access to customers" ON public.customers;
        DROP POLICY IF EXISTS "Allow public insert customers" ON public.customers;
        DROP POLICY IF EXISTS "Allow public update customers" ON public.customers;
        
        -- Create new policies
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
      `
    });

    if (policyError) {
      console.error('Error creating policies:', policyError);
      return { success: false, error: policyError };
    }

    // Create function and trigger
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        -- Create trigger
        CREATE TRIGGER update_customers_updated_at
          BEFORE UPDATE ON public.customers
          FOR EACH ROW
          EXECUTE FUNCTION update_customer_visit();
        
        -- Create upsert function
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
      `
    });

    if (functionError) {
      console.error('Error creating function:', functionError);
      return { success: false, error: functionError };
    }

    console.log('Customers table and related objects created successfully');
    return { success: true };

  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
};

// Function to handle customer visit (fallback if RPC doesn't work)
export const handleCustomerVisit = async (phone: string, tableCode: string) => {
  try {
    // First, try to find existing customer
    const { data: existingCustomer, error: selectError } = await supabase
      .from('customers')
      .select('id, visit_count')
      .eq('phone', phone)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new customers
      throw selectError;
    }

    if (existingCustomer) {
      // Update existing customer
      const { data, error } = await supabase
        .from('customers')
        .update({
          last_visit_at: new Date().toISOString(),
          visit_count: existingCustomer.visit_count + 1,
          table_code: tableCode
        })
        .eq('id', existingCustomer.id)
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, customerId: data.id, isNewCustomer: false };
    } else {
      // Insert new customer
      const { data, error } = await supabase
        .from('customers')
        .insert({
          phone,
          table_code: tableCode
        })
        .select('id')
        .single();

      if (error) throw error;
      return { success: true, customerId: data.id, isNewCustomer: true };
    }
  } catch (error) {
    console.error('Error handling customer visit:', error);
    return { success: false, error };
  }
};