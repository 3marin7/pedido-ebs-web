-- EJECUTAR ESTE SCRIPT EN SUPABASE SQL EDITOR
-- Para habilitar el tracking de movimientos de inventario

-- 1. Agregar columna rol_usuario si no existe
ALTER TABLE movimientos_inventario ADD COLUMN IF NOT EXISTS rol_usuario VARCHAR(50);

-- 2. Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "Allow read access to all" ON movimientos_inventario;
DROP POLICY IF EXISTS "Allow insert access to all" ON movimientos_inventario;

-- 3. Crear políticas nuevas
CREATE POLICY "Allow read access to all" ON movimientos_inventario
  FOR SELECT USING (true);

CREATE POLICY "Allow insert access to all" ON movimientos_inventario
  FOR INSERT WITH CHECK (true);

-- 4. Verificar que RLS esté habilitado
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- 5. Verificar estructura de la tabla
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'movimientos_inventario';
