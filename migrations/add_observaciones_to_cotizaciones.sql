-- Migración para añadir columna de observaciones a cotizaciones
ALTER TABLE cotizaciones ADD COLUMN IF NOT EXISTS observaciones TEXT;
