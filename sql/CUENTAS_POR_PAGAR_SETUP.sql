-- =====================================================
-- SISTEMA DE CUENTAS POR PAGAR
-- Tablas para gestión de proveedores, facturas y pagos
-- =====================================================

-- TABLA: proveedores
-- Almacena información de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  nit VARCHAR(50) NOT NULL UNIQUE,
  telefono VARCHAR(50),
  email VARCHAR(255),
  direccion TEXT,
  contacto VARCHAR(255),
  termino_pago INTEGER DEFAULT 30, -- días de plazo para pago
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- TABLA: facturas_proveedores
-- Almacena facturas de proveedores
CREATE TABLE IF NOT EXISTS facturas_proveedores (
  id BIGSERIAL PRIMARY KEY,
  proveedor_id BIGINT NOT NULL REFERENCES proveedores(id) ON DELETE CASCADE,
  numero_factura VARCHAR(100) NOT NULL UNIQUE,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE,
  clase VARCHAR(10) DEFAULT 'FP', -- FP: Factura Proveedor, NC: Nota Crédito, ND: Nota Débito
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  iva DECIMAL(15, 2) NOT NULL DEFAULT 0,
  retencion DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total DECIMAL(15, 2) NOT NULL DEFAULT 0,
  pagado DECIMAL(15, 2) NOT NULL DEFAULT 0,
  saldo DECIMAL(15, 2) NOT NULL DEFAULT 0,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, parcial, pagada, vencida
  descripcion TEXT,
  archivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- TABLA: pagos_proveedores
-- Almacena pagos realizados a facturas
CREATE TABLE IF NOT EXISTS pagos_proveedores (
  id BIGSERIAL PRIMARY KEY,
  factura_id BIGINT NOT NULL REFERENCES facturas_proveedores(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  monto DECIMAL(15, 2) NOT NULL,
  metodo_pago VARCHAR(50) DEFAULT 'transferencia', -- transferencia, efectivo, cheque, tarjeta
  referencia VARCHAR(100),
  banco VARCHAR(100),
  nota TEXT,
  usuario VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ÍNDICES para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_proveedores_activo ON proveedores(activo);
CREATE INDEX IF NOT EXISTS idx_proveedores_nit ON proveedores(nit);
CREATE INDEX IF NOT EXISTS idx_facturas_proveedor ON facturas_proveedores(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_facturas_estado ON facturas_proveedores(estado);
CREATE INDEX IF NOT EXISTS idx_facturas_fecha_vencimiento ON facturas_proveedores(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_pagos_factura ON pagos_proveedores(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON pagos_proveedores(fecha);

-- FUNCIÓN: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGERS para updated_at
DROP TRIGGER IF EXISTS update_proveedores_updated_at ON proveedores;
CREATE TRIGGER update_proveedores_updated_at
  BEFORE UPDATE ON proveedores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_facturas_proveedores_updated_at ON facturas_proveedores;
CREATE TRIGGER update_facturas_proveedores_updated_at
  BEFORE UPDATE ON facturas_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- FUNCIÓN: Actualizar saldo y estado de factura después de un pago
CREATE OR REPLACE FUNCTION actualizar_factura_despues_pago()
RETURNS TRIGGER AS $$
DECLARE
  total_pagado DECIMAL(15, 2);
  factura_total DECIMAL(15, 2);
  nuevo_saldo DECIMAL(15, 2);
  nuevo_estado VARCHAR(20);
BEGIN
  -- Obtener el total de la factura
  SELECT total INTO factura_total
  FROM facturas_proveedores
  WHERE id = NEW.factura_id;
  
  -- Calcular el total pagado
  SELECT COALESCE(SUM(monto), 0) INTO total_pagado
  FROM pagos_proveedores
  WHERE factura_id = NEW.factura_id;
  
  -- Calcular nuevo saldo
  nuevo_saldo := factura_total - total_pagado;
  
  -- Determinar nuevo estado
  IF nuevo_saldo <= 0 THEN
    nuevo_estado := 'pagada';
    nuevo_saldo := 0;
  ELSIF total_pagado > 0 AND nuevo_saldo < factura_total THEN
    nuevo_estado := 'parcial';
  ELSE
    nuevo_estado := 'pendiente';
  END IF;
  
  -- Actualizar factura
  UPDATE facturas_proveedores
  SET 
    pagado = total_pagado,
    saldo = nuevo_saldo,
    estado = nuevo_estado
  WHERE id = NEW.factura_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER: Actualizar factura cuando se registra un pago
DROP TRIGGER IF EXISTS trigger_actualizar_factura_pago ON pagos_proveedores;
CREATE TRIGGER trigger_actualizar_factura_pago
  AFTER INSERT ON pagos_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_factura_despues_pago();

-- FUNCIÓN: Actualizar estado vencido de facturas (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION actualizar_facturas_vencidas()
RETURNS void AS $$
BEGIN
  UPDATE facturas_proveedores
  SET estado = 'vencida'
  WHERE fecha_vencimiento < CURRENT_DATE
    AND saldo > 0
    AND estado != 'pagada';
END;
$$ language 'plpgsql';

-- FUNCIÓN: Calcular saldo inicial al crear factura
CREATE OR REPLACE FUNCTION calcular_saldo_inicial()
RETURNS TRIGGER AS $$
BEGIN
  NEW.saldo := NEW.total;
  NEW.pagado := 0;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER: Calcular saldo al insertar factura
DROP TRIGGER IF EXISTS trigger_calcular_saldo_inicial ON facturas_proveedores;
CREATE TRIGGER trigger_calcular_saldo_inicial
  BEFORE INSERT ON facturas_proveedores
  FOR EACH ROW
  EXECUTE FUNCTION calcular_saldo_inicial();

-- Políticas RLS (Row Level Security) - DESHABILITADOS PARA DESARROLLO
-- Si deseas habilitar RLS más adelante, usa estas políticas:
-- ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE facturas_proveedores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pagos_proveedores ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Permitir todo a usuarios autenticados" ON proveedores
--   FOR ALL USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Permitir todo a usuarios autenticados" ON facturas_proveedores
--   FOR ALL USING (auth.role() = 'authenticated');
--
-- CREATE POLICY "Permitir todo a usuarios autenticados" ON pagos_proveedores
--   FOR ALL USING (auth.role() = 'authenticated');

-- POR AHORA: Mantener RLS deshabilitado para desarrollo
-- En producción, habilitar y configurar políticas apropiadas

-- DATOS DE EJEMPLO (opcional, comentar si no se desean)
-- Insertar proveedores de ejemplo
INSERT INTO proveedores (nombre, nit, telefono, email, direccion, contacto, termino_pago, activo) VALUES
  ('Distribuidora Roma', '900.123.456-7', '601-234-5678', 'ventas@roma.com', 'Cra 10 #20-30, Bogotá', 'Juan Pérez', 30, true),
  ('Distribuidora Axa', '900.234.567-8', '601-345-6789', 'info@axa.com', 'Av 68 #45-12, Bogotá', 'María González', 45, true),
  ('Coopicredito', '900.345.678-9', '601-456-7890', 'atencion@coopicredito.com', 'Calle 100 #15-20, Bogotá', 'Carlos Ramírez', 15, true)
ON CONFLICT (nit) DO NOTHING;

-- Insertar facturas de ejemplo
INSERT INTO facturas_proveedores (proveedor_id, numero_factura, fecha_emision, fecha_vencimiento, clase, subtotal, iva, retencion, total, descripcion) VALUES
  (1, '500787688', '2025-09-23', '2025-11-07', 'FP', 30090410, 5716275, 0, 35806685, 'Compra productos varios'),
  (1, '4400077966', '2025-10-15', NULL, 'NC', -10815420, -2045730, 0, -12861150, 'Nota crédito por devolución'),
  (2, 'AXA-2025-001', '2026-01-15', '2026-02-14', 'FP', 15000000, 2850000, 375000, 17475000, 'Mercancía enero 2026'),
  (3, 'COOP-2025-122', '2025-12-20', '2026-01-04', 'FP', 22731842, 0, 0, 22731842, 'Cuota préstamo diciembre')
ON CONFLICT (numero_factura) DO NOTHING;

-- Insertar pagos de ejemplo
INSERT INTO pagos_proveedores (factura_id, fecha, monto, metodo_pago, referencia, banco, nota, usuario) VALUES
  (1, '2025-10-15', 2000000, 'transferencia', 'TRANS-2025-001', 'Bancolombia', 'Abono parcial', 'Edwin Marín'),
  (1, '2025-11-20', 2380669, 'transferencia', 'TRANS-2025-015', 'Bancolombia', 'Segundo abono', 'Edwin Marín'),
  (4, '2026-01-04', 22731842, 'transferencia', 'TRANS-2026-003', 'Davivienda', 'Pago completo', 'Edwin Marín');

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Copia todo este script
-- 2. Ve a Supabase Dashboard > SQL Editor
-- 3. Pega el script y ejecuta
-- 4. Verifica que las tablas se crearon correctamente
-- 5. El componente React se conectará automáticamente
-- =====================================================

-- QUERIES ÚTILES PARA REPORTES:
-- =====================================================

-- Ver resumen de facturas por proveedor
-- SELECT 
--   p.nombre,
--   COUNT(f.id) as total_facturas,
--   SUM(f.total) as total_facturado,
--   SUM(f.pagado) as total_pagado,
--   SUM(f.saldo) as saldo_pendiente
-- FROM proveedores p
-- LEFT JOIN facturas_proveedores f ON p.id = f.proveedor_id
-- GROUP BY p.id, p.nombre;

-- Ver facturas vencidas
-- SELECT 
--   f.*,
--   p.nombre as proveedor,
--   (CURRENT_DATE - f.fecha_vencimiento) as dias_vencidos
-- FROM facturas_proveedores f
-- JOIN proveedores p ON f.proveedor_id = p.id
-- WHERE f.fecha_vencimiento < CURRENT_DATE
--   AND f.saldo > 0
-- ORDER BY f.fecha_vencimiento;

-- Ver historial de pagos de una factura
-- SELECT * FROM pagos_proveedores
-- WHERE factura_id = 1
-- ORDER BY fecha DESC;
