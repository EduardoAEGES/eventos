-- 1. Eliminar políticas actuales para limpiar conflictos
DROP POLICY IF EXISTS "Permitir inserción pública en asistencias" ON asistencias;
DROP POLICY IF EXISTS "Permitir selección pública en asistencias" ON asistencias;
DROP POLICY IF EXISTS "Permitir actualización pública en asistencias" ON asistencias;
DROP POLICY IF EXISTS "Permitir lectura pública en asistencias" ON asistencias;
DROP POLICY IF EXISTS "Permitir eliminación pública en asistencias" ON asistencias;

-- 2. Crear políticas ROBUSTAS para ASISTENCIAS
-- IMPORTANTE: Para que 'upsert' funcione con registros existentes, la política de UPDATE
-- necesita la cláusula 'USING (true)' para permitir encontrar la fila a actualizar.
CREATE POLICY "asistencias_public_insert" ON asistencias FOR INSERT WITH CHECK (true);
CREATE POLICY "asistencias_public_select" ON asistencias FOR SELECT USING (true);
CREATE POLICY "asistencias_public_update" ON asistencias FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "asistencias_public_delete" ON asistencias FOR DELETE USING (true);

-- 3. Limpiar y reforzar PARTICIPANTES también
DROP POLICY IF EXISTS "Permitir inserción pública en participantes" ON participantes;
DROP POLICY IF EXISTS "Permitir selección pública en participantes" ON participantes;
DROP POLICY IF EXISTS "Permitir actualización pública en participantes" ON participantes;

CREATE POLICY "participantes_public_insert" ON participantes FOR INSERT WITH CHECK (true);
CREATE POLICY "participantes_public_select" ON participantes FOR SELECT USING (true);
CREATE POLICY "participantes_public_update" ON participantes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "participantes_public_delete" ON participantes FOR DELETE USING (true);
