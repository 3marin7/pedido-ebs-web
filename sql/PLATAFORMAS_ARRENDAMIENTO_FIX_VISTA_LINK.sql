-- La pantalla consulta esta vista, no la tabla directamente.
-- Ejecutar en Supabase SQL Editor para exponer el proveedor y link de despliegue.

CREATE OR REPLACE VIEW public.vista_control_plataformas_arriendo AS
SELECT
  p.id_plataforma,
  p.numero_contrato,
  p.nombre_plataforma,
  p.estado,
  p.fecha_inicio_arriendo,
  p.fecha_fin_arriendo,
  p.dia_corte,
  p.valor_mensual AS canon_pago,
  c.nombre_contacto,
  c.telefono_contacto,
  c.correo_contacto,
  concat_ws(', ',
    CASE WHEN p.servicio_supabase THEN 'Supabase (BD/Auth)' END,
    CASE WHEN p.servicio_cloudinary THEN 'Cloudinary (Media)' END,
    CASE WHEN p.servicio_github THEN 'GitHub (Repo/CI)' END,
    CASE WHEN p.servicio_correo THEN 'Correo electrónico' END
  ) AS servicios_infraestructura,
  p.proveedor_despliegue,
  p.url_produccion
FROM public.plataformas_arriendo p
JOIN public.clientes_plataforma c
  ON c.id_cliente_plataforma = p.id_cliente_plataforma;

-- Verificación opcional.
SELECT numero_contrato, proveedor_despliegue, url_produccion
FROM public.vista_control_plataformas_arriendo
WHERE numero_contrato = 'CTR-2026-3';
