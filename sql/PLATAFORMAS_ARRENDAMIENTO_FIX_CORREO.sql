-- Ejecutar si la tabla ya existia antes de agregar el servicio de correo.
ALTER TYPE public.tipo_proveedor_cloud ADD VALUE IF NOT EXISTS 'CORREO';
ALTER TABLE public.plataformas_arriendo
  ADD COLUMN IF NOT EXISTS servicio_correo boolean NOT NULL DEFAULT false;