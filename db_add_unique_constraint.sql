-- Este script añade una regla única a la base de datos
-- Es obligatorio para que el sistema sepa cuándo actualizar un estudiante existente
-- o cuándo debe crear uno nuevo sin causar conflictos o duplicados.

ALTER TABLE participantes ADD CONSTRAINT unique_dni_evento UNIQUE (dni, evento_id);
