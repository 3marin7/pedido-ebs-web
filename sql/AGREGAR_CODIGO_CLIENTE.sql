-- Agrega un codigo legible para clientes con formato C00001
-- Ejecutar en Supabase SQL Editor

ALTER TABLE public.clientes
ADD COLUMN IF NOT EXISTS codigo_cliente text;

-- Rellenar codigos faltantes para clientes existentes
UPDATE public.clientes
SET codigo_cliente = 'C' || lpad(id::text, 5, '0')
WHERE codigo_cliente IS NULL OR btrim(codigo_cliente) = '';

-- Asegurar unicidad (solo valores no nulos)
CREATE UNIQUE INDEX IF NOT EXISTS uq_clientes_codigo_cliente
ON public.clientes (codigo_cliente)
WHERE codigo_cliente IS NOT NULL;

-- Funcion para asignar codigo automaticamente en nuevos clientes
CREATE OR REPLACE FUNCTION public.fn_asignar_codigo_cliente()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.codigo_cliente IS NULL OR btrim(NEW.codigo_cliente) = '' THEN
    NEW.codigo_cliente := 'C' || lpad(NEW.id::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger para autogenerar codigo en INSERT
DROP TRIGGER IF EXISTS trg_clientes_codigo_cliente ON public.clientes;
CREATE TRIGGER trg_clientes_codigo_cliente
BEFORE INSERT ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.fn_asignar_codigo_cliente();
