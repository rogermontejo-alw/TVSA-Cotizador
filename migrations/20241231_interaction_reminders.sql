-- Add reminder date to interactions for CRM alerts
ALTER TABLE interacciones_cliente 
ADD COLUMN IF NOT EXISTS fecha_recordatorio TIMESTAMPTZ;

-- Add index for reminder queries
CREATE INDEX IF NOT EXISTS idx_interacciones_recordatorio ON interacciones_cliente(fecha_recordatorio) 
WHERE fecha_recordatorio IS NOT NULL;

COMMENT ON COLUMN interacciones_cliente.fecha_recordatorio IS 'Fecha y hora programada para un recordatorio o seguimiento proactivo.';
