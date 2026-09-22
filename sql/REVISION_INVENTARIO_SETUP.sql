-- SCRIPT PARA CREAR TABLA DE REVISIÓN DE INVENTARIO
-- Ejecutar en Supabase SQL Editor

-- Columnas necesarias para mostrar la última revisión junto al producto.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS cantidad_sistema INTEGER;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS cantidad_real INTEGER;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS estado_revision VARCHAR(30) DEFAULT 'pendiente';
ALTER TABLE productos ADD COLUMN IF NOT EXISTS fecha_revision TIMESTAMPTZ;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS revisado_por VARCHAR(255);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS observacion TEXT;

CREATE TABLE IF NOT EXISTS inventario_revisiones (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  cantidad_sistema INTEGER DEFAULT 0,
  cantidad_real INTEGER DEFAULT 0,
  diferencia INTEGER DEFAULT 0,
  estado_revision VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  fecha_revision TIMESTAMPTZ DEFAULT NOW(),
  revisado_por VARCHAR(255) DEFAULT 'Sistema',
  rol_usuario VARCHAR(50),
  observacion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revision_producto ON inventario_revisiones(producto_id);
CREATE INDEX IF NOT EXISTS idx_revision_estado ON inventario_revisiones(estado_revision);
CREATE INDEX IF NOT EXISTS idx_revision_fecha ON inventario_revisiones(fecha_revision);

ALTER TABLE inventario_revisiones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read all on inventario_revisiones" ON inventario_revisiones;
DROP POLICY IF EXISTS "Allow insert all on inventario_revisiones" ON inventario_revisiones;

CREATE POLICY "Allow read all on inventario_revisiones" ON inventario_revisiones
  FOR SELECT USING (true);

CREATE POLICY "Allow insert all on inventario_revisiones" ON inventario_revisiones
  FOR INSERT WITH CHECK (true);

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'inventario_revisiones'
ORDER BY ordinal_position;
