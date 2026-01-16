-- Drop the global unique constraint on table_number
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_table_number_key;

-- Add a composite unique constraint for table_number per cafe
ALTER TABLE public.tables ADD CONSTRAINT tables_cafe_table_unique UNIQUE (cafe_id, table_number);