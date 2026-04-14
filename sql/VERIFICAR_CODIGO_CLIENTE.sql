-- Script de verificación
-- Ejecutar en Supabase SQL Editor para confirmar que se agregaron los códigos

-- 1. Verificar que la columna existe
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'facturas' AND column_name = 'codigo_cliente';

-- 2. Contar cuántas facturas tienen código de cliente
SELECT 
  COUNT(*) as total_facturas,
  COUNT(codigo_cliente) as con_codigo,
  COUNT(*) - COUNT(codigo_cliente) as sin_codigo
FROM public.facturas;

-- 3. Ver ejemplos de facturas con código
SELECT id, cliente, codigo_cliente, fecha 
FROM public.facturas 
WHERE codigo_cliente IS NOT NULL
LIMIT 10;

-- 4. Ver ejemplos de facturas SIN código (para rellenar manualmente si es necesario)
SELECT id, cliente, codigo_cliente, fecha 
FROM public.facturas 
WHERE codigo_cliente IS NULL
LIMIT 10;