-- ================================================
-- SCRIPT: Agregar sistema de PRE-VENTA a productos
-- Ejecutar en Supabase SQL Editor
-- ================================================

-- 1. Agregar campos a tabla productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS es_preventa BOOLEAN DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS fecha_disponibilidad DATE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock_preventa INTEGER DEFAULT 0;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS descripcion_preventa TEXT;

-- Comentarios
COMMENT ON COLUMN productos.es_preventa IS 'Indica si el producto está en modo pre-venta';
COMMENT ON COLUMN productos.fecha_disponibilidad IS 'Fecha cuando el producto entra al inventario real';
COMMENT ON COLUMN productos.stock_preventa IS 'Cantidad de unidades en pre-venta acumuladas';
COMMENT ON COLUMN productos.descripcion_preventa IS 'Descripción adicional para la pre-venta (características, fotos de muestra, etc.)';

-- 2. Crear tabla de pedidos en preventa
CREATE TABLE IF NOT EXISTS preventa_pedidos (
  id BIGSERIAL PRIMARY KEY,
  pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id BIGINT REFERENCES productos(id) ON DELETE RESTRICT,
  cantidad INTEGER NOT NULL CHECK (cantidad > 0),
  precio_unitario NUMERIC(10,2) NOT NULL,
  estado VARCHAR(50) DEFAULT 'reservado', -- 'reservado', 'cumplido', 'cancelado'
  fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fecha_cumplimiento_automatico TIMESTAMP, -- cuando se cumpla automáticamente
  notas TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_preventa_pedidos_pedido ON preventa_pedidos(pedido_id);
CREATE INDEX IF NOT EXISTS idx_preventa_pedidos_producto ON preventa_pedidos(producto_id);
CREATE INDEX IF NOT EXISTS idx_preventa_pedidos_estado ON preventa_pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_preventa_pedidos_fecha ON preventa_pedidos(fecha_pedido DESC);

-- 3. Agregar campo a tabla pedidos para marcar si es preventa
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS es_preventa BOOLEAN DEFAULT false;
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_cumplimiento_preventa DATE;

COMMENT ON COLUMN pedidos.es_preventa IS 'Indica si el pedido es en modo pre-venta';
COMMENT ON COLUMN pedidos.fecha_cumplimiento_preventa IS 'Fecha cuando se cumple automáticamente (calculada)';

-- 4. TRIGGER: Función para cumplir automáticamente pedidos de preventa
CREATE OR REPLACE FUNCTION cumplir_preventa_automaticamente()
RETURNS TRIGGER AS $$
DECLARE
  pedidos_afectados RECORD;
  cantidad_pendiente INTEGER;
  stock_disponible INTEGER;
BEGIN
  -- Si es preventa y el nuevo stock es mayor que cero, cumplir pedidos pendientes
  IF NEW.es_preventa = false AND NEW.stock > 0 THEN
    stock_disponible := NEW.stock;
    
    -- Iterar sobre pedidos de preventa de este producto
    FOR pedidos_afectados IN 
      SELECT pp.id, pp.pedido_id, pp.cantidad, p.cliente_nombre
      FROM preventa_pedidos pp
      JOIN pedidos p ON pp.pedido_id = p.id
      WHERE pp.producto_id = NEW.id 
        AND pp.estado = 'reservado'
      ORDER BY pp.fecha_pedido ASC
    LOOP
      -- Si tenemos stock disponible
      IF stock_disponible >= pedidos_afectados.cantidad THEN
        -- Marcar como cumplido
        UPDATE preventa_pedidos 
        SET estado = 'cumplido', 
            fecha_cumplimiento_automatico = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = pedidos_afectados.id;
        
        -- Restar del stock
        stock_disponible := stock_disponible - pedidos_afectados.cantidad;
      ELSE
        -- Si no hay suficiente stock, detener
        EXIT;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trigger_cumplir_preventa ON productos;
CREATE TRIGGER trigger_cumplir_preventa
BEFORE UPDATE ON productos
FOR EACH ROW
WHEN (OLD.es_preventa = true AND NEW.es_preventa = false)
EXECUTE FUNCTION cumplir_preventa_automaticamente();

-- 5. Crear tabla de historial de preventas (auditoría)
CREATE TABLE IF NOT EXISTS historial_preventa (
  id BIGSERIAL PRIMARY KEY,
  preventa_pedido_id BIGINT REFERENCES preventa_pedidos(id) ON DELETE SET NULL,
  producto_id BIGINT REFERENCES productos(id),
  accion VARCHAR(50), -- 'creada', 'cumplida', 'cancelada'
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50),
  notas TEXT,
  usuario VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_historial_preventa_fecha ON historial_preventa(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_historial_preventa_producto ON historial_preventa(producto_id);
