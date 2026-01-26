-- Script SQL para crear tabla de auditoría de inventario
-- Ejecutar en Supabase SQL Editor

CREATE TABLE movimientos_inventario (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  producto_id BIGINT NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  tipo_movimiento VARCHAR(50) NOT NULL, -- 'venta', 'entrada', 'ajuste', 'devolución'
  cantidad INT NOT NULL,
  stock_anterior INT,
  stock_nuevo INT,
  factura_id BIGINT REFERENCES facturas(id) ON DELETE SET NULL,
  descripcion TEXT,
  usuario VARCHAR(255),
  fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para búsquedas rápidas
CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);
CREATE INDEX idx_movimientos_factura ON movimientos_inventario(factura_id);

-- Habilitar Row Level Security (opcional, para seguridad)
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan leer (opcional)
CREATE POLICY "Allow read access to all" ON movimientos_inventario
  FOR SELECT USING (true);
