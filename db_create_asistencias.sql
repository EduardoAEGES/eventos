-- Crear tabla para registro real de Asistencia (con calificación y comentarios)
CREATE TABLE IF NOT EXISTS asistencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    dni VARCHAR(20) NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    correo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50),
    ciclo VARCHAR(50),
    turno VARCHAR(50),
    es_egresado BOOLEAN DEFAULT false,
    asistencia BOOLEAN DEFAULT true, -- Siempre TRUE en esta tabla
    certificado_autorizado BOOLEAN DEFAULT false,
    certificado_url TEXT,
    calificacion INTEGER DEFAULT 0,
    comentario TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Evitar que una misma persona registre asistencia dos veces en el mismo evento
    UNIQUE(dni, evento_id)
);

-- Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_asistencias_dni ON asistencias(dni);
CREATE INDEX IF NOT EXISTS idx_asistencias_evento_id ON asistencias(evento_id);

-- Habilitar RLS (Row Level Security) - Nota: En Supabase esto permite que el cliente anónimo inserte
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;

-- Política para inserción pública si es necesario
CREATE POLICY "Permitir inserción pública en asistencias" ON asistencias FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir lectura pública en asistencias" ON asistencias FOR SELECT USING (true);
