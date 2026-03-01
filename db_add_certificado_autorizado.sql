-- Agregar columna para autorizar certificados en la tabla participantes
ALTER TABLE participantes 
ADD COLUMN IF NOT EXISTS certificado_autorizado BOOLEAN DEFAULT true;

-- Asegurar que los registros existentes tengan el valor por defecto
UPDATE participantes SET certificado_autorizado = true WHERE certificado_autorizado IS NULL;
