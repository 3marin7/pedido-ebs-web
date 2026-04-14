--- Actualizar vendedor_id en facturas existentes que tienen NULL
-- Cruza por el nombre del vendedor con la tabla usuarios
-- Ejecutar en Supabase SQL Editor

-- 1. Ver cuántas facturas tienen vendedor_id en NULL antes de actualizar
SELECT COUNT(*) as facturas_sin_vendedor_id
FROM public.facturas
WHERE vendedor_id IS NULL;

-- 2. Actualizar vendedor_id usando los nombres exactos de cada vendedor
UPDATE public.facturas
SET vendedor_id = (SELECT id FROM public.usuarios WHERE nombre = 'Edwin Marin' LIMIT 1)
WHERE TRIM(vendedor) = 'Edwin Marin' AND vendedor_id IS NULL;

UPDATE public.facturas
SET vendedor_id = (SELECT id FROM public.usuarios WHERE nombre = 'Fredy Marin' LIMIT 1)
WHERE TRIM(vendedor) = 'Fredy Marin' AND vendedor_id IS NULL;

UPDATE public.facturas
SET vendedor_id = (SELECT id FROM public.usuarios WHERE nombre = 'Fabian Marin' LIMIT 1)
WHERE TRIM(vendedor) = 'Fabian Marin' AND vendedor_id IS NULL;

-- 3. Verificar cuántas quedaron actualizadas y cuántas siguen en NULL
SELECT 
  COUNT(*) as total_facturas,
  COUNT(vendedor_id) as con_vendedor_id,
  COUNT(*) - COUNT(vendedor_id) as sin_vendedor_id
FROM public.facturas;

-- 4. Ver las facturas que aún tienen vendedor_id NULL (si quedan, es porque
--    el nombre del vendedor no coincide exactamente con usuarios.nombre)
-- SELECT id, cliente, vendedor, vendedor_id, fecha
-- FROM public.facturas
-- WHERE vendedor_id IS NULL
-- ORDER BY fecha DESC
-- LIMIT 20;
