-- SCRIPT PARA AGREGAR CAMPO DE VENDEDOR A LA TABLA DE PEDIDOS
-- Ejecutar en Supabase SQL Editor si el campo no existe

-- Verificar si la columna existe, si no, crearla
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS vendedor VARCHAR(255);

-- Agregar comentario a la columna
COMMENT ON COLUMN pedidos.vendedor IS 'Nombre del vendedor que gestiona el pedido';

-- Establecer valor por defecto para registros existentes
UPDATE pedidos SET vendedor = 'Sin asignar' WHERE vendedor IS NULL;

-- Verificar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;
