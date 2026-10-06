-- SCRIPT PARA CREAR TABLA DE AUDITORÍA DE PRODUCTOS
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla dedicada para auditar cambios de productos
CREATE TABLE IF NOT EXISTS auditoria_productos (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo_accion VARCHAR(50) NOT NULL, -- 'creacion', 'edicion', 'eliminacion'
  campos_modificados JSONB, -- guarda los cambios: {campo: {antes, despues}}
  cambios_resumen TEXT, -- resumen legible de los cambios
  usuario VARCHAR(255),
  rol_usuario VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_auditoria_producto ON auditoria_productos(producto_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_productos(created_at);
CREATE INDEX IF NOT EXISTS idx_auditoria_tipo ON auditoria_productos(tipo_accion);
CREATE INDEX IF NOT EXISTS idx_auditoria_rol ON auditoria_productos(rol_usuario);

-- 3. Habilitar Row Level Security
ALTER TABLE auditoria_productos ENABLE ROW LEVEL SECURITY;

-- Ejecutar AUTENTICACION_SUPABASE_SETUP.sql primero para configurar perfiles y roles.
DO $$
DECLARE
  existing_policy record;
BEGIN
  FOR existing_policy IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'auditoria_productos'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.auditoria_productos', existing_policy.policyname);
  END LOOP;
END
$$;

REVOKE ALL PRIVILEGES ON TABLE public.auditoria_productos FROM public, anon, authenticated;
GRANT SELECT, INSERT ON TABLE public.auditoria_productos TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.auditoria_productos_id_seq TO authenticated;

CREATE POLICY "authorized staff can read product audit"
  ON public.auditoria_productos
  FOR SELECT TO authenticated
  USING (public.has_app_role(array['admin', 'superadmin', 'inventario']));

CREATE POLICY "authorized staff can create product audit"
  ON public.auditoria_productos
  FOR INSERT TO authenticated
  WITH CHECK (public.has_app_role(array['admin', 'superadmin', 'inventario']));

-- 5. Verificar que se creó correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'auditoria_productos'
ORDER BY ordinal_position;
