-- MIGRACIÓN 20260102: Añadir cliente_id a contratos_ejecucion
-- Esta migración añade el campo cliente_id para normalizar la relación y permitir registrar contratos sin MC o para reporteo rápido.

-- 1. Añadir la columna
ALTER TABLE public.contratos_ejecucion 
ADD COLUMN IF NOT EXISTS cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE;

-- 2. Migrar datos existentes (vincular a través de master_contracts)
UPDATE public.contratos_ejecucion ce
SET cliente_id = mc.cliente_id
FROM public.master_contracts mc
WHERE ce.mc_id = mc.id AND ce.cliente_id IS NULL;

-- 3. Migrar datos existentes (vincular a través de cotizaciones si no hay MC)
UPDATE public.contratos_ejecucion ce
SET cliente_id = q.cliente_id
FROM public.cotizaciones q
WHERE ce.cotizacion_id = q.id AND ce.cliente_id IS NULL;

-- Comentario informativo
COMMENT ON COLUMN public.contratos_ejecucion.cliente_id IS 'ID del cliente propietario del contrato (redundante para MC, necesario para contratos directos)';
