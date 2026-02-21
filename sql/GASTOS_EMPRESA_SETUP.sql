-- =====================================================
-- GASTOS DE LA EMPRESA
-- Tabla para registro y seguimiento de gastos operacionales
-- =====================================================

-- TABLA: gastos_empresa
CREATE TABLE IF NOT EXISTS gastos_empresa (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  categoria VARCHAR(100) NOT NULL, -- Nómina, Servicios, Transporte, Suministros, Viáticos, etc.
  empleado VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  monto DECIMAL(15, 2) NOT NULL,
  metodo_pago VARCHAR(50) DEFAULT 'transferencia', -- transferencia, efectivo, tarjeta, cheque
  referencia VARCHAR(100),
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ÍNDICES para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_gastos_fecha ON gastos_empresa(fecha);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria ON gastos_empresa(categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_empleado ON gastos_empresa(empleado);
CREATE INDEX IF NOT EXISTS idx_gastos_metodo ON gastos_empresa(metodo_pago);

-- FUNCIÓN: Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_gastos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER: Actualizar updated_at al modificar
DROP TRIGGER IF EXISTS update_gastos_empresa_updated_at ON gastos_empresa;
CREATE TRIGGER update_gastos_empresa_updated_at
  BEFORE UPDATE ON gastos_empresa
  FOR EACH ROW
  EXECUTE FUNCTION update_gastos_updated_at();

-- Habilitar RLS pero solo si quieres (opcional)
-- ALTER TABLE gastos_empresa ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Permitir todo a usuarios autenticados" ON gastos_empresa
--   FOR ALL USING (auth.role() = 'authenticated');

-- DATOS DE EJEMPLO
INSERT INTO gastos_empresa (fecha, categoria, empleado, descripcion, monto, metodo_pago, referencia, notas) VALUES
  ('2026-02-15', 'Nómina', 'Paola Huertas', 'Pago nómina febrero', 2750000, 'transferencia', 'TRANS-001', 'Pago habitual'),
  ('2026-02-14', 'Servicios', 'Edwin Marín', 'Pago internet y teléfono', 185000, 'transferencia', 'TRANS-002', ''),
  ('2026-02-12', 'Transporte', 'Jhon Fredy Marín', 'Gasolina y mantenimiento vehículo', 250000, 'efectivo', 'EFE-001', 'Recibo guardado'),
  ('2026-02-10', 'Suministros', 'Carolina Bernal', 'Papel, bolígrafos y otros suministros de oficina', 125000, 'transferencia', 'TRANS-003', ''),
  ('2026-02-08', 'Viáticos', 'Fabian Marín', 'Viáticos viaje a Medellín', 450000, 'efectivo', 'VIA-001', 'Hospedaje y comidas'),
  ('2026-02-05', 'Nómina', 'Carolina Bernal', 'Pago nómina febrero', 1550000, 'transferencia', 'TRANS-004', 'Pago habitual'),
  ('2026-02-03', 'Mantenimiento', 'Edwin Marín', 'Mantenimiento de oficina', 85000, 'transferencia', 'TRANS-005', ''),
  ('2026-01-30', 'Marketing', 'Jhon Fredy Marín', 'Publicidad digital', 300000, 'transferencia', 'TRANS-006', ''),
  ('2026-01-28', 'Capacitación', 'Paola Huertas', 'Curso online especialización', 200000, 'transferencia', 'TRANS-007', ''),
  ('2026-01-25', 'Nómina', 'Fabian Marín', 'Pago nómina enero', 2200000, 'transferencia', 'TRANS-008', 'Pago habitual')
ON CONFLICT DO NOTHING;

-- =====================================================
-- QUERIES ÚTILES
-- =====================================================

-- Ver resumen de gastos por categoría
-- SELECT 
--   categoria,
--   COUNT(*) as cantidad,
--   SUM(monto) as total,
--   AVG(monto) as promedio
-- FROM gastos_empresa
-- GROUP BY categoria
-- ORDER BY total DESC;

-- Ver gastos por empleado
-- SELECT 
--   empleado,
--   COUNT(*) as cantidad,
--   SUM(monto) as total,
--   AVG(monto) as promedio
-- FROM gastos_empresa
-- GROUP BY empleado
-- ORDER BY total DESC;

-- Ver gastos del mes actual
-- SELECT * FROM gastos_empresa
-- WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', NOW())
-- ORDER BY fecha DESC;

-- Ver gastos por método de pago
-- SELECT 
--   metodo_pago,
--   COUNT(*) as cantidad,
--   SUM(monto) as total
-- FROM gastos_empresa
-- GROUP BY metodo_pago;

-- Gastos de una categoría en un rango de fechas
-- SELECT * FROM gastos_empresa
-- WHERE categoria = 'Nómina'
--   AND fecha BETWEEN '2026-01-01' AND '2026-02-28'
-- ORDER BY fecha DESC;

-- =====================================================
-- INSTRUCCIONES DE USO:
-- =====================================================
-- 1. Copia TODO este script
-- 2. Ve a Supabase Dashboard > SQL Editor
-- 3. Pega el script y ejecuta
-- 4. Verifica que la tabla se creó correctamente
-- 5. La aplicación se conectará automáticamente
-- =====================================================
