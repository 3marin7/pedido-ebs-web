-- Ejecutar una sola vez en Supabase.
-- evidencia_url conserva el comprobante del pago.
ALTER TABLE public.servicios_publicos
ADD COLUMN IF NOT EXISTS evidencia_recibo_url TEXT;