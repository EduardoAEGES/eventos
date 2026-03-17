-- 1. Asegurar extensión pgcrypto (para gen_random_uuid en versiones antiguas)
-- Aunque en Supabase suele estar activa por defecto.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Actualizar tabla asistencias con un generador más robusto
-- Primero quitamos cualquier default anterior para limpiar
ALTER TABLE asistencias ALTER COLUMN id DROP DEFAULT;
-- Aplicamos gen_random_uuid() que es el estándar moderno
ALTER TABLE asistencias ALTER COLUMN id SET DEFAULT gen_random_uuid();
-- Aseguramos que no permita nulos (lo cual ya debería ser por ser PK, pero reforzamos)
ALTER TABLE asistencias ALTER COLUMN id SET NOT NULL;

-- 3. Lo mismo para participantes por si acaso
ALTER TABLE participantes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE participantes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE participantes ALTER COLUMN id SET NOT NULL;
