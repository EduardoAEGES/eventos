-- Habilitar permisos de UPDATE y DELETE para la tabla asistencias
-- Esto permite que el admin (o cualquier usuario anon con la key) pueda confirmar/actualizar registros
CREATE POLICY "Permitir inserción pública en asistencias" ON asistencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir selección pública en asistencias" ON asistencias FOR SELECT USING (true);
CREATE POLICY "Permitir actualización pública en asistencias" ON asistencias FOR UPDATE WITH CHECK (true);
CREATE POLICY "Permitir eliminación pública en asistencias" ON asistencias FOR DELETE USING (true);
