-- =====================================================
-- FIX RLS - Deshabilitar políticas de seguridad
-- =====================================================
-- Ejecuta este script si ya ejecutaste el anterior y tienes errores RLS
-- En Supabase SQL Editor

-- Deshabilitar RLS en las tablas
ALTER TABLE proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE facturas_proveedores DISABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_proveedores DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON proveedores;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON facturas_proveedores;
DROP POLICY IF EXISTS "Permitir todo a usuarios autenticados" ON pagos_proveedores;

-- Ahora puedes usar la aplicación sin problemas de seguridad
-- En producción, habilita RLS con políticas apropiadas
