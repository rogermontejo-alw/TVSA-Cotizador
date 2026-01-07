-- FIX SECURITY AUDIT ISSUES

-- 1. Enable RLS on Tables (CRITICAL)
-- "Policy Exists RLS Disabled" & "RLS Disabled in Public"
-- Fixes the issue where policies existed but were ignored.
ALTER TABLE public.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.descuentos_volumen ENABLE ROW LEVEL SECURITY;

-- 2. Fix Security Definer View
-- "Security Definer View"
-- Force the view to check permissions based on the user calling it, not the view owner.
-- This ensures RLS policies on underlying tables are respected for the user running the query.
ALTER VIEW public.vista_resumen_mc SET (security_invoker = true);

-- 3. Clean up Duplicate Policies in metas_comerciales
-- Dropping the duplicate policy to clear the confusion/warning.
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON public.metas_comerciales;

-- 4. Move pg_net extension (SKIPPED)
-- "Extension in Public"
-- ERROR: extension "pg_net" does not support SET SCHEMA
-- We are skipping this step because Postgres does not allow moving this specific extension 
-- easily without dropping and re-creating it, which carries risk of data loss or configuration loss.
-- It is safe to keep it in public for now as it is just a Warning.
-- CREATE SCHEMA IF NOT EXISTS extensions;
-- ALTER EXTENSION pg_net SET SCHEMA extensions;


-- 5. Enable Leaked Password Protection (Recommendation)
-- This cannot be done via SQL standard command easily as it is a project config.
-- Go to Supabase Dashboard -> Authentication -> Security -> Enable "Detect leaked passwords"

-- NOTE: The "RLS Policy Always True" warnings for 'Acceso Total Autenticados' 
-- remain active. This is acceptable for an internal CRM where all authenticated 
-- users are trusted. To silence them, you would need to implement stricter role-based policies.
