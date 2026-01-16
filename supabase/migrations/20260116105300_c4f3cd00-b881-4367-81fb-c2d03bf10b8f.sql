-- Fix user_roles RLS policies to prevent infinite recursion
-- Drop all existing policies on user_roles
DROP POLICY IF EXISTS "Admins can manage own cafe roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view own cafe roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

-- Recreate policies using the security definer function
-- Users can view their own roles
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can view all roles for their cafe (using security definer function)
CREATE POLICY "Admins can view cafe roles" 
ON public.user_roles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND cafe_id IN (
    SELECT ur.cafe_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

-- Admins can manage roles for their cafe
CREATE POLICY "Admins can insert cafe roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND cafe_id IN (
    SELECT ur.cafe_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can update cafe roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND cafe_id IN (
    SELECT ur.cafe_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can delete cafe roles" 
ON public.user_roles 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND cafe_id IN (
    SELECT ur.cafe_id FROM public.user_roles ur WHERE ur.user_id = auth.uid()
  )
);