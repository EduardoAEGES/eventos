-- Agregar nuevas columnas solicitadas por el usuario para la tabla participantes
ALTER TABLE participantes 
ADD COLUMN IF NOT EXISTS turno VARCHAR(50),
ADD COLUMN IF NOT EXISTS ciclo VARCHAR(50),
ADD COLUMN IF NOT EXISTS es_egresado BOOLEAN DEFAULT false;
