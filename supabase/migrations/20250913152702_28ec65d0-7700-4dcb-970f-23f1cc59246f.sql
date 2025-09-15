-- Fix critical security vulnerability: Add RLS policies to user_roles table

-- First enable RLS on the user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can read their own role data
CREATE POLICY "Users can read own role" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy 2: Admins can read all role data
CREATE POLICY "Admins can read all roles" 
ON public.user_roles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Policy 3: Admins can insert role data
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Policy 4: Admins can update role data (for approvals/rejections)
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);

-- Policy 5: Admins can delete role data (if needed)
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 
    FROM public.admin_users au 
    WHERE au.user_id = auth.uid()
  )
);