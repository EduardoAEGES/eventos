-- 1. Asegurar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Reforzar tabla ASISTENCIAS
-- ID: Generador automático robusto
ALTER TABLE asistencias ALTER COLUMN id DROP DEFAULT;
ALTER TABLE asistencias ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE asistencias ALTER COLUMN id SET NOT NULL;

-- CREATED_AT: Generador automático de fecha/hora UTC
ALTER TABLE asistencias ALTER COLUMN created_at DROP DEFAULT;
ALTER TABLE asistencias ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
ALTER TABLE asistencias ALTER COLUMN created_at SET NOT NULL;

-- 3. Reforzar tabla PARTICIPANTES
-- ID: Generador automático robusto
ALTER TABLE participantes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE participantes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE participantes ALTER COLUMN id SET NOT NULL;

-- CREATED_AT: Generador automático de fecha/hora UTC
ALTER TABLE participantes ALTER COLUMN created_at DROP DEFAULT;
ALTER TABLE participantes ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());
ALTER TABLE participantes ALTER COLUMN created_at SET NOT NULL;
