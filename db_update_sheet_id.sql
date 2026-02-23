-- 1. Agregar columna para sincronización con Google Sheets
ALTER TABLE eventos ADD COLUMN sheet_id varchar UNIQUE;

-- En caso de tener eventos pasados sin ID o por si necesitas una vista
-- de tu base de datos actual con sus nuevos IDs generados, 
-- no es obligatorio modificar datos previos, pero si lo necesitaras:
-- UPDATE eventos SET sheet_id = id::varchar WHERE sheet_id IS NULL;
