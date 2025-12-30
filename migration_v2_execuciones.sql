-- MIGRACIÓN: Sistema de Ejecuciones Financieras (Capacitación de Contratos Individuales)
-- Ejecutar en el Editor SQL de Supabase

-- 1. Crear tabla de ejecuciones (Contratos Individuales)
-- Esta tabla vincula un Master Contract con una Cotización Ganada para representar la venta real.
CREATE TABLE IF NOT EXISTS public.contratos_ejecucion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mc_id UUID REFERENCES public.master_contracts(id) ON DELETE CASCADE,
    cotizacion_id UUID REFERENCES public.cotizaciones(id) ON DELETE SET NULL,
    numero_contrato TEXT NOT NULL UNIQUE,
    monto_ejecucion DECIMAL(14, 2) NOT NULL,
    fecha_inicio_pauta DATE NOT NULL,
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Modificar cobranza para vincularse opcionalmente a ejecuciones
-- La cobranza ahora podrá rastrearse por contrato de ejecución.
ALTER TABLE public.cobranza ADD COLUMN IF NOT EXISTS contrato_ejecucion_id UUID REFERENCES public.contratos_ejecucion(id) ON DELETE SET NULL;

-- 3. Habilitar RLS para la nueva tabla y crear políticas
ALTER TABLE public.contratos_ejecucion ENABLE ROW LEVEL SECURITY;

-- Nota: Si ya tienes políticas configuradas, asegúrate de que un usuario autenticado pueda operar.
DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON public.contratos_ejecucion;
CREATE POLICY "Enable read access for all authenticated users" ON public.contratos_ejecucion
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.contratos_ejecucion;
CREATE POLICY "Enable insert for authenticated users" ON public.contratos_ejecucion
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.contratos_ejecucion;
CREATE POLICY "Enable update for authenticated users" ON public.contratos_ejecucion
FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.contratos_ejecucion;
CREATE POLICY "Enable delete for authenticated users" ON public.contratos_ejecucion
FOR DELETE USING (auth.role() = 'authenticated');

-- 4. Comentario informativo
COMMENT ON TABLE public.contratos_ejecucion IS 'Tabla que registra la ejecución real de una cotización bajo un Master Contract.';
