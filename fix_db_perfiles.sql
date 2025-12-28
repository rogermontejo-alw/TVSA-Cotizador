-- FIX DATABASE SCHEMA: CRM TELEVISA MID

-- 1. Create Perfiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    nombre_completo TEXT,
    telefono TEXT,
    puesto TEXT DEFAULT 'Asesor Comercial',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure all columns exist in perfiles (in case the table already existed)
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS nombre_completo TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS puesto TEXT DEFAULT 'Asesor Comercial';

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

-- 4. Create Security Policies
-- Allow anyone authenticated to read profiles (needed for user list)
DROP POLICY IF EXISTS "Enable read access for all users" ON public.perfiles;
CREATE POLICY "Enable read access for all users" ON public.perfiles 
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update only their own profile
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.perfiles;
CREATE POLICY "Enable update for users based on id" ON public.perfiles 
FOR UPDATE USING (auth.uid() = id);

-- Allow admins to insert/delete (optional, usually handled via functions)
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.perfiles;
CREATE POLICY "Enable insert for authenticated users" ON public.perfiles 
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 5. Create a function to handle new user registration automatically (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre_completo, puesto)
  VALUES (new.id, new.email, '', 'Asesor Comercial')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7. Grant access to service role for migrations
GRANT ALL ON TABLE public.perfiles TO service_role;
GRANT ALL ON TABLE public.perfiles TO anon;
GRANT ALL ON TABLE public.perfiles TO authenticated;
