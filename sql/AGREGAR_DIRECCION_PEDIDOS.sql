-- SCRIPT PARA AGREGAR CAMPO DE DIRECCIÓN A LA TABLA DE PEDIDOS
-- Ejecutar en Supabase SQL Editor si el campo no existe

-- Verificar si la columna existe, si no, crearla
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS direccion_entrega VARCHAR(255);

-- Agregar comentario a la columna
COMMENT ON COLUMN pedidos.direccion_entrega IS 'Dirección de entrega del cliente';

-- Verificar la estructura actual de la tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pedidos'
ORDER BY ordinal_position;
