-- First, create a function to get user's cafe IDs without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_cafe_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT cafe_id FROM public.user_roles WHERE user_id = _user_id
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view cafe roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert cafe roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update cafe roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete cafe roles" ON public.user_roles;

-- Recreate simple non-recursive policies
-- Users can view their own roles (simple, non-recursive)
CREATE POLICY "Users can view own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Admins can manage roles for their cafe (using security definer functions)
CREATE POLICY "Admins can insert cafe roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
  AND cafe_id IN (SELECT get_user_cafe_ids(auth.uid()))
);

CREATE POLICY "Admins can update cafe roles" 
ON public.user_roles 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND cafe_id IN (SELECT get_user_cafe_ids(auth.uid()))
);

CREATE POLICY "Admins can delete cafe roles" 
ON public.user_roles 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::app_role)
  AND cafe_id IN (SELECT get_user_cafe_ids(auth.uid()))
);