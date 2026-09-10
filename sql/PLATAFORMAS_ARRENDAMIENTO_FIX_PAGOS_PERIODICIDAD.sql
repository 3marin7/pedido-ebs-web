-- Ejecutar si pagos_plataforma ya existia.
ALTER TABLE public.pagos_plataforma
  ADD COLUMN IF NOT EXISTS periodo_hasta date,
  ADD COLUMN IF NOT EXISTS frecuencia varchar(20) NOT NULL DEFAULT 'MENSUAL';

UPDATE public.pagos_plataforma
SET periodo_hasta = (periodo + interval '1 month' - interval '1 day')::date
WHERE periodo_hasta IS NULL;

ALTER TABLE public.pagos_plataforma
  DROP CONSTRAINT IF EXISTS pagos_plataforma_frecuencia_check;
ALTER TABLE public.pagos_plataforma
  ADD CONSTRAINT pagos_plataforma_frecuencia_check
  CHECK (frecuencia IN ('MENSUAL', 'SEMESTRAL', 'ANUAL'));