-- 1. Añadir la columna de fecha de última modificación si no existe
ALTER TABLE eventos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 2. Crear una función genérica que actualiza el 'updated_at' a la fecha y hora actual
CREATE OR REPLACE FUNCTION update_moddatetime_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Crear el Trigger que observará la tabla 'eventos'
-- Importante: Si lo ejecutas dos veces puede dar error de "trigger already exists",
-- en ese caso puedes ignorarlo o usar DROP TRIGGER IF EXISTS primero.
DROP TRIGGER IF EXISTS trg_eventos_updated_at ON eventos;
CREATE TRIGGER trg_eventos_updated_at
BEFORE UPDATE ON eventos
FOR EACH ROW EXECUTE PROCEDURE update_moddatetime_column();

-- Opcional: Para inicializar todos los eventos antiguos con la fecha de hoy 
-- (así no dan error al tratar de compararlos por primera vez):
-- UPDATE eventos SET updated_at = NOW() WHERE updated_at IS NULL;
