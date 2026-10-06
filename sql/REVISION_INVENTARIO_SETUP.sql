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

-- Ejecutar AUTENTICACION_SUPABASE_SETUP.sql primero para configurar perfiles y roles.
DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'inventario_revisiones'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.inventario_revisiones', existing_policy.policyname);
  END LOOP;
END
$$;

REVOKE ALL PRIVILEGES ON TABLE public.inventario_revisiones FROM public, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.inventario_revisiones TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.inventario_revisiones_id_seq TO authenticated;

CREATE POLICY "authorized staff can read inventory revisions"
  ON public.inventario_revisiones
  FOR SELECT TO authenticated
  USING (public.has_app_role(array['admin', 'superadmin', 'inventario']));

CREATE POLICY "authorized staff can create inventory revisions"
  ON public.inventario_revisiones
  FOR INSERT TO authenticated
  WITH CHECK (public.has_app_role(array['admin', 'superadmin', 'inventario']));

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'inventario_revisiones'
ORDER BY ordinal_position;
