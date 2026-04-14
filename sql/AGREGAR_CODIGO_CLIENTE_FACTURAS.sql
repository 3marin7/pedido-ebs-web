-- Agrega columna codigo_cliente a tabla facturas
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columna si no existe
ALTER TABLE public.facturas
ADD COLUMN IF NOT EXISTS codigo_cliente varchar(50) DEFAULT NULL;

-- 2. Rellenar códigos faltantes desde tabla clientes (coincidencia por nombre)
UPDATE public.facturas f
SET codigo_cliente = c.codigo_cliente
FROM public.clientes c
WHERE LOWER(TRIM(f.cliente)) = LOWER(TRIM(c.nombre)) 
  AND (f.codigo_cliente IS NULL OR TRIM(f.codigo_cliente) = '');

-- 3. Crear índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_facturas_codigo_cliente
ON public.facturas (codigo_cliente);

-- 4. Verificar cuántos registros se actualizaron
-- SELECT COUNT(*) as total_con_codigo FROM public.facturas WHERE codigo_cliente IS NOT NULL AND TRIM(codigo_cliente) != '';
