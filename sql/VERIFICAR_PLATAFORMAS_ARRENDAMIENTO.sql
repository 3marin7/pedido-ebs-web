-- Verificacion de la vista de plataformas arrendadas.
-- Ejecutar en Supabase SQL Editor. No modifica datos.

-- 1. Confirmar que la vista existe.
SELECT table_schema, table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name = 'vista_control_plataformas_arriendo';

-- 2. Confirmar columnas esperadas y su orden.
SELECT ordinal_position, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'vista_control_plataformas_arriendo'
ORDER BY ordinal_position;

-- 3. Revisar el contrato especifico y su enlace.
SELECT
  numero_contrato,
  nombre_plataforma,
  estado,
  proveedor_despliegue,
  url_produccion,
  servicios_infraestructura
FROM public.vista_control_plataformas_arriendo
WHERE numero_contrato = 'CTR-2026-3';

-- 4. Buscar plataformas sin cliente relacionado.
SELECT p.id_plataforma, p.numero_contrato, p.nombre_plataforma
FROM public.plataformas_arriendo p
LEFT JOIN public.clientes_plataforma c
  ON c.id_cliente_plataforma = p.id_cliente_plataforma
WHERE c.id_cliente_plataforma IS NULL;

-- 5. Buscar contratos duplicados.
SELECT numero_contrato, COUNT(*) AS cantidad
FROM public.plataformas_arriendo
GROUP BY numero_contrato
HAVING COUNT(*) > 1;

-- 6. Buscar enlaces de produccion invalidos o faltantes.
SELECT numero_contrato, nombre_plataforma, proveedor_despliegue, url_produccion
FROM public.plataformas_arriendo
WHERE url_produccion IS NULL
   OR btrim(url_produccion) = ''
   OR url_produccion !~* '^https?://';

-- 7. Buscar dias de corte y valores mensuales invalidos.
SELECT numero_contrato, dia_corte, valor_mensual
FROM public.plataformas_arriendo
WHERE dia_corte NOT BETWEEN 1 AND 31
   OR valor_mensual < 0;

-- 8. Buscar pagos sin rango de cobertura o con rango invertido.
SELECT id_pago, id_plataforma, periodo, periodo_hasta, frecuencia
FROM public.pagos_plataforma
WHERE periodo_hasta IS NULL
   OR periodo_hasta < periodo
   OR frecuencia NOT IN ('MENSUAL', 'SEMESTRAL', 'ANUAL');

-- 9. Confirmar que la vista conserva todas las plataformas.
SELECT
  (SELECT COUNT(*) FROM public.plataformas_arriendo) AS plataformas_tabla,
  (SELECT COUNT(*) FROM public.vista_control_plataformas_arriendo) AS plataformas_vista;

-- Interpretacion rapida:
-- Las consultas 4, 5, 6, 7 y 8 deben devolver cero filas.
-- En la consulta 9 ambos conteos deben coincidir.
