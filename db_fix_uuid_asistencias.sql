-- Asegurar que la extensión para generar UUIDs esté activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Asegurar que la tabla asistencias tenga el valor por defecto correcto para la columna id
-- Si la tabla ya tiene un DEFAULT, esto lo actualizará a uuid_generate_v4()
ALTER TABLE asistencias 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Asegurar que la tabla participantes también tenga el valor por defecto correcto para id
ALTER TABLE participantes 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();
