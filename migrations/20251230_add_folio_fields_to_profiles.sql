-- Migración para añadir soporte a folios identificables
-- Tabla: perfiles

ALTER TABLE perfiles 
ADD COLUMN IF NOT EXISTS iniciales VARCHAR(5),
ADD COLUMN IF NOT EXISTS codigo_ciudad VARCHAR(5) DEFAULT 'MID';

COMMENT ON COLUMN perfiles.iniciales IS 'Iniciales del ejecutivo para generación de folios (ej. RAM)';
COMMENT ON COLUMN perfiles.codigo_ciudad IS 'Código de la ciudad matriz (ej. MID, CDMX)';
