-- CREAR TABLAS PARA TIPOS DE CLIENTES Y LÍMITES DE FACTURACIÓN
-- Ejecutar en Supabase SQL Editor

-- 1. CREAR TABLA DE TIPOS DE CLIENTES
CREATE TABLE IF NOT EXISTS tipos_clientes (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT,
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar tipos de clientes predeterminados
INSERT INTO tipos_clientes (nombre, descripcion) VALUES
  ('MAYORISTA', 'Cliente mayorista - compras en volumen'),
  ('MINORISTA', 'Cliente minorista - compras pequeñas'),
  ('DISTRIBUIDOR', 'Distribuidor autorizado'),
  ('CONSUMIDOR_FINAL', 'Consumidor final - compra directa'),
  ('CORPORATIVO', 'Empresa corporativa - compras frecuentes')
ON CONFLICT (nombre) DO NOTHING;

-- 2. CREAR TABLA DE LÍMITES DE FACTURACIÓN POR TIPO
CREATE TABLE IF NOT EXISTS limites_facturacion (
  id BIGSERIAL PRIMARY KEY,
  tipo_cliente_id BIGINT REFERENCES tipos_clientes(id) ON DELETE CASCADE,
  
  -- LÍMITES DE ANTIGÜEDAD (en días)
  dias_antiguedad_minimo INTEGER DEFAULT 0,      -- Días mínimos antes de poder facturar
  dias_antiguedad_maximo INTEGER DEFAULT 30,     -- Máximo de días sin cobro
  
  -- LÍMITES DE VALOR (en moneda local)
  valor_minimo_factura DECIMAL(12,2) DEFAULT 0,   -- Monto mínimo por factura
  valor_maximo_factura DECIMAL(12,2) DEFAULT 100000000, -- Monto máximo por factura
  valor_maximo_credito DECIMAL(12,2) DEFAULT 0,   -- Máximo crédito acumulado
  
  -- LÍMITES DE CANTIDAD
  cantidad_maxima_productos INTEGER DEFAULT 1000, -- Máx productos por factura
  facturas_pendientes_maximas INTEGER DEFAULT 10, -- Máx facturas sin pagar
  
  -- OTROS LÍMITES
  puede_comprar_credito BOOLEAN DEFAULT false,   -- Puede comprar a crédito
  requiere_aprobacion BOOLEAN DEFAULT false,     -- Requiere aprobación antes de facturar
  dias_plazo_credito INTEGER DEFAULT 0,          -- Días de plazo para pago
  
  activo BOOLEAN DEFAULT true,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(tipo_cliente_id)
);

-- 3. AGREGAR COLUMNA DE TIPO_CLIENTE A LA TABLA CLIENTES (si no existe)
ALTER TABLE clientes 
ADD COLUMN IF NOT EXISTS tipo_cliente_id BIGINT REFERENCES tipos_clientes(id);

-- 4. CREAR TABLA DE AUDITORÍA DE VALIDACIONES
CREATE TABLE IF NOT EXISTS validaciones_facturacion (
  id BIGSERIAL PRIMARY KEY,
  cliente_id BIGINT REFERENCES clientes(id),
  factura_numero VARCHAR(50),
  tipo_validacion VARCHAR(100),  -- 'ANTIGUEDAD', 'VALOR_MINIMO', 'VALOR_MAXIMO', 'CREDITO_EXCEDIDO'
  resultado VARCHAR(20),          -- 'PERMITIDA', 'BLOQUEADA', 'ADVERTENCIA'
  motivo TEXT,
  detalles JSONB,
  creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREAR ÍNDICES PARA MEJOR RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_limites_tipo_cliente ON limites_facturacion(tipo_cliente_id);
CREATE INDEX IF NOT EXISTS idx_clientes_tipo ON clientes(tipo_cliente_id);
CREATE INDEX IF NOT EXISTS idx_validaciones_cliente ON validaciones_facturacion(cliente_id);
CREATE INDEX IF NOT EXISTS idx_validaciones_factura ON validaciones_facturacion(factura_numero);

-- 6. CREAR VISTA ÚTIL DE CLIENTES CON SUS LÍMITES
CREATE OR REPLACE VIEW clientes_con_limites AS
SELECT 
  c.id,
  c.nombre,
  c.identificacion,
  c.correo,
  c.telefono,
  c.clasificacion,
  tc.nombre as tipo_cliente,
  lf.valor_minimo_factura,
  lf.valor_maximo_factura,
  lf.valor_maximo_credito,
  lf.dias_antiguedad_maximo,
  lf.puede_comprar_credito,
  lf.requiere_aprobacion,
  lf.dias_plazo_credito,
  c.activo
FROM clientes c
LEFT JOIN tipos_clientes tc ON c.tipo_cliente_id = tc.id
LEFT JOIN limites_facturacion lf ON tc.id = lf.tipo_cliente_id;

-- 7. HABILITAR RLS SI ES NECESARIO
-- ALTER TABLE tipos_clientes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE limites_facturacion ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE validaciones_facturacion ENABLE ROW LEVEL SECURITY;

-- 8. CREAR POLÍTICAS DE LECTURA PÚBLICAS (ajustar según seguridad requerida)
CREATE POLICY "Allow read tipos_clientes" ON tipos_clientes
  FOR SELECT USING (true);

CREATE POLICY "Allow read limites_facturacion" ON limites_facturacion
  FOR SELECT USING (true);

-- 9. VERIFICAR ESTRUCTURA CREADA
SELECT 'Tipos de Clientes' as tabla, COUNT(*) FROM tipos_clientes
UNION ALL
SELECT 'Límites de Facturación', COUNT(*) FROM limites_facturacion
UNION ALL
SELECT 'Validaciones de Facturación', COUNT(*) FROM validaciones_facturacion;
