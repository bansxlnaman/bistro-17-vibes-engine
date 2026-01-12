-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'user');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create menu_items table
CREATE TABLE public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  is_veg BOOLEAN NOT NULL DEFAULT true,
  is_popular BOOLEAN NOT NULL DEFAULT false,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view available menu items
CREATE POLICY "Anyone can view menu items"
ON public.menu_items
FOR SELECT
USING (true);

-- Only admins can manage menu items
CREATE POLICY "Admins can manage menu items"
ON public.menu_items
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger for menu_items updated_at
CREATE TRIGGER update_menu_items_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed menu items from existing data
INSERT INTO public.menu_items (name, description, price, category, is_veg, is_popular) VALUES
-- Starters
('Peri-Peri Fries', 'Crispy golden fries tossed in our signature peri-peri spice blend', 99, 'Starters', true, true),
('Loaded Nachos', 'Tortilla chips topped with cheese, jalapeños, salsa, and sour cream', 149, 'Starters', true, false),
('Garlic Bread', 'Toasted bread with garlic butter and herbs', 79, 'Starters', true, false),
('Cheese Garlic Bread', 'Garlic bread topped with melted mozzarella', 99, 'Starters', true, false),
('Paneer Tikka', 'Marinated cottage cheese grilled to perfection', 179, 'Starters', true, false),
('Chicken Wings', 'Crispy fried wings with choice of sauce', 199, 'Starters', false, false),

-- Burgers
('Classic Veg Burger', 'Crispy veg patty with fresh veggies and special sauce', 129, 'Burgers', true, false),
('Paneer Burger', 'Grilled paneer patty with mint mayo', 149, 'Burgers', true, false),
('Chicken Burger', 'Juicy chicken patty with lettuce and mayo', 169, 'Burgers', false, false),
('Double Chicken Burger', 'Two chicken patties with cheese and special sauce', 219, 'Burgers', false, false),

-- Pizza & Pasta
('Margherita Pizza', 'Classic tomato sauce with fresh mozzarella and basil', 199, 'Pizza & Pasta', true, false),
('Farmhouse Pizza', 'Loaded with fresh vegetables and cheese', 249, 'Pizza & Pasta', true, false),
('Chicken Tikka Pizza', 'Spicy chicken tikka with onions and peppers', 299, 'Pizza & Pasta', false, false),
('White Sauce Pasta', 'Creamy alfredo pasta with garlic and herbs', 179, 'Pizza & Pasta', true, true),
('Red Sauce Pasta', 'Tangy tomato pasta with Italian herbs', 159, 'Pizza & Pasta', true, false),
('Pink Sauce Pasta', 'Perfect blend of white and red sauce', 169, 'Pizza & Pasta', true, false),

-- Chinese
('Veg Hakka Noodles', 'Stir-fried noodles with fresh vegetables', 149, 'Chinese', true, false),
('Chicken Hakka Noodles', 'Stir-fried noodles with chicken and vegetables', 179, 'Chinese', false, false),
('Veg Fried Rice', 'Wok-tossed rice with vegetables', 139, 'Chinese', true, false),
('Chicken Fried Rice', 'Wok-tossed rice with chicken', 169, 'Chinese', false, false),
('Manchurian Dry', 'Crispy vegetable balls in spicy manchurian sauce', 149, 'Chinese', true, false),

-- Beverages
('Cappuccino', 'Rich espresso with steamed milk foam', 99, 'Beverages', true, true),
('Café Latte', 'Smooth espresso with creamy steamed milk', 109, 'Beverages', true, false),
('Cold Coffee', 'Chilled coffee blended with ice cream', 129, 'Beverages', true, false),
('Hot Chocolate', 'Rich and creamy chocolate drink', 99, 'Beverages', true, false),
('Fresh Lime Soda', 'Refreshing lime with soda', 59, 'Beverages', true, false),
('Mojito', 'Mint and lime mocktail', 89, 'Beverages', true, false),

-- Desserts
('Brownie with Ice Cream', 'Warm chocolate brownie served with vanilla ice cream', 149, 'Desserts', true, true),
('Chocolate Lava Cake', 'Molten chocolate cake with gooey center', 169, 'Desserts', true, false),
('Cheesecake', 'Creamy New York style cheesecake', 159, 'Desserts', true, false),
('Ice Cream Sundae', 'Three scoops with toppings and sauce', 129, 'Desserts', true, false);