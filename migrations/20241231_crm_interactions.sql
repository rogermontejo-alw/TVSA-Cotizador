-- Create interactions table for CRM
CREATE TABLE IF NOT EXISTS interacciones_cliente (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- 'Llamada', 'Visita', 'WhatsApp', 'Correo', 'Seguimiento'
    comentario TEXT,
    usuario_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_interacciones_cliente_id ON interacciones_cliente(cliente_id);

-- Enable RLS
ALTER TABLE interacciones_cliente ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable all for authenticated users" ON interacciones_cliente
    FOR ALL USING (auth.role() = 'authenticated');

-- Comment on table
COMMENT ON TABLE interacciones_cliente IS 'Historial de seguimiento comercial (CRM) de los clientes.';
