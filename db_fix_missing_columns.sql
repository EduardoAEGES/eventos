-- Arreglar columnas faltantes en la tabla participantes
ALTER TABLE participantes 
ADD COLUMN IF NOT EXISTS apellidos VARCHAR(255),
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- Asegurar que la asistencia sea false por defecto
ALTER TABLE participantes 
ALTER COLUMN asistencia SET DEFAULT false;

-- Actualizar registros existentes si es necesario
UPDATE participantes SET asistencia = false WHERE asistencia IS NULL;
