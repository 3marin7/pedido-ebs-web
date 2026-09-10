-- Ejecutar si la tabla ya existia antes de agregar el enlace de despliegue.
ALTER TABLE public.plataformas_arriendo
  ADD COLUMN IF NOT EXISTS proveedor_despliegue varchar(80),
  ADD COLUMN IF NOT EXISTS url_produccion varchar(500);