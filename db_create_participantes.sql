CREATE TABLE IF NOT EXISTS participantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evento_id INTEGER REFERENCES eventos(id) ON DELETE CASCADE,
    dni VARCHAR(20) NOT NULL,
    nombres VARCHAR(255) NOT NULL,
    correo VARCHAR(255),
    telefono VARCHAR(50),
    asistencia BOOLEAN DEFAULT true,
    certificado_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices para mejorar la velocidad al buscar estudiantes o cargar eventos
CREATE INDEX IF NOT EXISTS idx_participantes_dni ON participantes(dni);
CREATE INDEX IF NOT EXISTS idx_participantes_evento_id ON participantes(evento_id);
