-- MIGRACIÓN 20241231: Roles de Usuario y Desglose de Contratos
-- Ejecutar en el Editor SQL de Supabase

-- 1. Añadir columna de rol a perfiles
ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS rol VARCHAR(20) DEFAULT 'ventas';

COMMENT ON COLUMN public.perfiles.rol IS 'Roles: Gerencia, ventas, admon';

-- 2. Asegurar que los perfiles existentes tengan un rol (por defecto ventas)
UPDATE public.perfiles SET rol = 'ventas' WHERE rol IS NULL;

-- 3. Dar acceso total (Gerencia) a todos los perfiles actuales para evitar bloqueos
-- El usuario podrá cambiar esto manualmente después en la tabla perfiles
UPDATE public.perfiles SET rol = 'Gerencia';

-- 4. Mejorar tabla de contratos_ejecucion para permitir desglose por plaza
ALTER TABLE public.contratos_ejecucion 
ADD COLUMN IF NOT EXISTS plaza VARCHAR(100),
ADD COLUMN IF NOT EXISTS fecha_fin_pauta DATE;

COMMENT ON COLUMN public.contratos_ejecucion.plaza IS 'Plaza específica para este contrato de la cotización';
COMMENT ON COLUMN public.contratos_ejecucion.fecha_fin_pauta IS 'Fecha de fin de la ejecución para reportería';
