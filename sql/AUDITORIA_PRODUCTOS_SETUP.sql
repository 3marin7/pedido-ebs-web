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

-- 4. Crear políticas RLS
DROP POLICY IF EXISTS "Allow read all" ON auditoria_productos;
DROP POLICY IF EXISTS "Allow insert all" ON auditoria_productos;

CREATE POLICY "Allow read all" ON auditoria_productos
  FOR SELECT USING (true);

CREATE POLICY "Allow insert all" ON auditoria_productos
  FOR INSERT WITH CHECK (true);

-- 5. Verificar que se creó correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'auditoria_productos'
ORDER BY ordinal_position;
