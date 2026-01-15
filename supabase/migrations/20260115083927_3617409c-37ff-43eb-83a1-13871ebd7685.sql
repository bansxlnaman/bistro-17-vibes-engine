-- =====================================================
-- MULTI-TENANT B2B SAAS MIGRATION (FIXED ORDER)
-- =====================================================

-- 1. Create cafes table (tenant table)
CREATE TABLE public.cafes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  tagline TEXT,
  theme JSONB DEFAULT '{"default_mode": "light", "primary_color": "#4f7c5a", "accent_color": "#e0b15a"}'::jsonb,
  address TEXT,
  phone TEXT,
  whatsapp_number TEXT,
  facebook_url TEXT,
  instagram_url TEXT,
  opening_hours TEXT,
  google_maps_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add cafe_id to user_roles FIRST (before any policies reference it)
ALTER TABLE public.user_roles 
ADD COLUMN cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE;

-- 3. Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '🍽️',
  description TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Add cafe_id and category_id to menu_items
ALTER TABLE public.menu_items 
ADD COLUMN cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE;

ALTER TABLE public.menu_items 
ADD COLUMN category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- 5. Add cafe_id to tables
ALTER TABLE public.tables 
ADD COLUMN cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE;

-- 6. Add cafe_id and order tracking fields to orders
ALTER TABLE public.orders 
ADD COLUMN cafe_id UUID REFERENCES public.cafes(id) ON DELETE CASCADE;

ALTER TABLE public.orders 
ADD COLUMN order_number INT;

ALTER TABLE public.orders 
ADD COLUMN order_date DATE DEFAULT CURRENT_DATE;

-- 7. Create function to generate sequential order numbers per cafe per day
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INT;
BEGIN
  SELECT COALESCE(MAX(order_number), 0) + 1 INTO next_number
  FROM public.orders
  WHERE cafe_id = NEW.cafe_id
  AND order_date = CURRENT_DATE;
  
  NEW.order_number := next_number;
  NEW.order_date := CURRENT_DATE;
  RETURN NEW;
END;
$$;

-- Create trigger for order number generation
CREATE TRIGGER set_order_number
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_order_number();

-- 8. Now enable RLS and create policies (after columns exist)

-- Enable RLS on cafes
ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;

-- Anyone can view cafes (needed for tenant resolution)
CREATE POLICY "Anyone can view cafes"
ON public.cafes FOR SELECT
USING (true);

-- Only admins can manage their own cafe
CREATE POLICY "Admins can manage own cafe"
ON public.cafes FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.cafe_id = cafes.id
  )
);

-- Enable RLS on categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Anyone can view categories
CREATE POLICY "Anyone can view categories"
ON public.categories FOR SELECT
USING (true);

-- Admins can manage categories for their cafe
CREATE POLICY "Admins can manage own cafe categories"
ON public.categories FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.cafe_id = categories.cafe_id
  )
);

-- 9. Update RLS policies for multi-tenant isolation

-- Drop existing policies on menu_items that need updating
DROP POLICY IF EXISTS "Admins can manage menu items" ON public.menu_items;

-- Admins can manage their own cafe's menu items
CREATE POLICY "Admins can manage own cafe menu items"
ON public.menu_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.cafe_id = menu_items.cafe_id
  )
);

-- Update tables RLS
DROP POLICY IF EXISTS "Anyone can create tables" ON public.tables;
DROP POLICY IF EXISTS "Anyone can update tables" ON public.tables;

CREATE POLICY "Admins can manage own cafe tables"
ON public.tables FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.cafe_id = tables.cafe_id
  )
);

-- Update orders RLS for cafe isolation
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can view orders" ON public.orders;

-- Anyone can create orders (customers)
CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
WITH CHECK (true);

-- Anyone can view orders (for tracking)
CREATE POLICY "Anyone can view orders"
ON public.orders FOR SELECT
USING (true);

-- Staff/Admin can update orders for their cafe
CREATE POLICY "Staff can update own cafe orders"
ON public.orders FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'staff')
    AND ur.cafe_id = orders.cafe_id
  )
);

-- 10. Update user_roles RLS for cafe-scoped access
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins can manage own cafe roles"
ON public.user_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.cafe_id = user_roles.cafe_id
  )
);

CREATE POLICY "Admins can view own cafe roles"
ON public.user_roles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.cafe_id = user_roles.cafe_id
  )
);

-- 11. Create indexes for performance
CREATE INDEX idx_menu_items_cafe_id ON public.menu_items(cafe_id);
CREATE INDEX idx_categories_cafe_id ON public.categories(cafe_id);
CREATE INDEX idx_orders_cafe_id ON public.orders(cafe_id);
CREATE INDEX idx_orders_order_date ON public.orders(order_date);
CREATE INDEX idx_tables_cafe_id ON public.tables(cafe_id);
CREATE INDEX idx_user_roles_cafe_id ON public.user_roles(cafe_id);
CREATE INDEX idx_cafes_domain ON public.cafes(domain);

-- 12. Enable realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.cafes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.categories;