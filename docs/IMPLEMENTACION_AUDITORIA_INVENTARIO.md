# 📊 SISTEMA DE AUDITORÍA DE MOVIMIENTOS DE INVENTARIO

## 🎯 ¿Qué se hizo?

He implementado un **sistema completo de auditoría y seguimiento de movimientos de inventario** que registra:
- ✅ Cuándo se modificó el stock
- ✅ Quién lo modificó (usuario/vendedor)
- ✅ Cuál fue el cambio exacto (stock anterior → stock nuevo)
- ✅ Por qué se modificó (tipo de movimiento: venta, entrada, ajuste, devolución)
- ✅ Qué factura está relacionada

---

## 📋 PASOS PARA IMPLEMENTAR

### PASO 1: Crear la tabla en Supabase

1. Abre Supabase Dashboard
2. Ve a **SQL Editor**
3. Copia y ejecuta el contenido del archivo: `../sql/SQL_CREAR_TABLA_MOVIMIENTOS.sql`
4. Deberías ver el mensaje: ✅ Success

**Esto crea:**
- Tabla: `movimientos_inventario`
- Índices para búsquedas rápidas
- Seguridad con Row Level Security

### PASO 2: El código ya está actualizado

El archivo `InvoiceScreen.jsx` ya incluye:
```javascript
// Cada vez que se vende un producto, se registra automáticamente:
await registrarMovimientoInventario(
  productoId,
  'venta',
  cantidad,
  stockAnterior,
  nuevoStock,
  numeroFactura,
  descripcion,
  vendedorSeleccionado
)
```

### PASO 3: Agregar la ruta en la navegación

En tu archivo de rutas (probablemente `App.jsx`), agrega:

```jsx
import HistorialMovimientos from './components/HistorialMovimientos';

// En las rutas:
<Route path="/movimientos" element={<HistorialMovimientos />} />
```

### PASO 4: Agregar el enlace en el menú

En `Navigation.jsx` o tu menú principal, agrega:

```jsx
<Link to="/movimientos" className="nav-item">
  📊 Movimientos
</Link>
```

---

## 🔍 ¿Cómo funciona?

### Flujo de una Venta

```
Usuario crea factura en InvoiceScreen
↓
Agrega producto (ej: 10 unidades de "Gigo")
↓
Guarda la factura
↓
InvoiceScreen se conecta a Supabase:
  - Crea registro en tabla "facturas"
  - Obtiene el ID de la factura (#12345)
  - Actualiza stock en tabla "productos" (100 → 90)
  - AUTOMÁTICAMENTE registra en "movimientos_inventario":
    * tipo: 'venta'
    * cantidad: 10
    * stock_anterior: 100
    * stock_nuevo: 90
    * usuario: 'Edwin Marin'
    * factura_id: 12345
↓
El historial ya está registrado para auditoría
```

### Visualizar el Historial

1. Ve a `/movimientos` en tu aplicación
2. Verás una tabla con todos los movimientos
3. Puedes filtrar por:
   - **Producto específico**
   - **Tipo de movimiento** (venta, entrada, ajuste, etc.)
   - **Rango de fechas**
4. Exportar a CSV para reportes

---

## 🎨 Características del Historial

### Dashboard de Resumen
- Total de movimientos
- Número de ventas
- Número de entradas
- Número de ajustes

### Tabla Detallada
| Campo | Descripción |
|-------|-------------|
| Fecha | Cuándo ocurrió el movimiento |
| Producto | Nombre del producto |
| Tipo | Venta, Entrada, Ajuste, Devolución |
| Cantidad | Unidades movidas |
| Stock Anterior | Stock antes del movimiento |
| Stock Nuevo | Stock después del movimiento |
| Usuario | Quién hizo el movimiento |
| Factura | Número de factura asociada (si aplica) |
| Descripción | Detalles del movimiento |

### Filtros Disponibles
- 🔍 Por producto
- 📈 Por tipo de movimiento
- 📅 Por rango de fechas
- 📥 Exportar a CSV

---

## 📊 Ejemplos de Consultas SQL

### Ver todos los movimientos de un producto
```sql
SELECT * FROM movimientos_inventario 
WHERE producto_id = 123
ORDER BY fecha_movimiento DESC;
```

### Ver historial de una factura
```sql
SELECT * FROM movimientos_inventario 
WHERE factura_id = 12345
ORDER BY fecha_movimiento DESC;
```

### Ver movimientos por rango de fechas
```sql
SELECT * FROM movimientos_inventario 
WHERE fecha_movimiento >= '2026-01-01' 
  AND fecha_movimiento <= '2026-01-31'
ORDER BY fecha_movimiento DESC;
```

### Ver movimientos por vendedor
```sql
SELECT * FROM movimientos_inventario 
WHERE usuario = 'Edwin Marin'
ORDER BY fecha_movimiento DESC;
```

### Estadísticas por tipo de movimiento
```sql
SELECT 
  tipo_movimiento,
  COUNT(*) as total_movimientos,
  SUM(cantidad) as cantidad_total
FROM movimientos_inventario
GROUP BY tipo_movimiento;
```

---

## 🔐 Seguridad y Auditoría

El sistema registra automáticamente:
- ✅ **Quién**: El vendedor que hizo la venta
- ✅ **Cuándo**: Timestamp exacto del movimiento
- ✅ **Qué**: Producto y cantidad
- ✅ **Cambio**: Stock antes y después
- ✅ **Por qué**: Tipo de movimiento
- ✅ **Dónde**: Número de factura relacionada

Esto permite:
- 🔍 Auditoría completa
- 📊 Reportes detallados
- 🔔 Detectar discrepancias
- 💼 Cumplimiento normativo

---

## 🧪 Probar el Sistema

1. **Crear una venta** desde InvoiceScreen
2. **Guardar la factura** con un producto
3. **Ir a `/movimientos`**
4. **Deberías ver** un registro nuevo con:
   - Tipo: "venta"
   - El producto vendido
   - La cantidad
   - El stock anterior y nuevo
   - El usuario (vendedor)
   - El número de factura

---

## 📋 Tabla de Campos

```sql
CREATE TABLE movimientos_inventario (
  id                BIGINT PRIMARY KEY GENERATED,
  producto_id       BIGINT NOT NULL REFERENCES productos(id),
  tipo_movimiento   VARCHAR(50) NOT NULL,      -- venta, entrada, ajuste, etc
  cantidad          INT NOT NULL,              -- Cantidad movida
  stock_anterior    INT,                       -- Stock antes del cambio
  stock_nuevo       INT,                       -- Stock después del cambio
  factura_id        BIGINT REFERENCES facturas(id), -- Factura relacionada
  descripcion       TEXT,                      -- Detalle del movimiento
  usuario           VARCHAR(255),              -- Quién hizo el cambio
  fecha_movimiento  TIMESTAMP DEFAULT NOW(),   -- Cuándo ocurrió
  created_at        TIMESTAMP DEFAULT NOW()    -- Cuándo se registró
);
```

---

## ✅ Checklist de Implementación

- [ ] Ejecuté el script SQL en Supabase
- [ ] La tabla `movimientos_inventario` fue creada
- [ ] Agregué la ruta `/movimientos` en App.jsx
- [ ] Importé HistorialMovimientos.jsx
- [ ] Agregué el enlace en Navigation.jsx
- [ ] Hice una venta de prueba
- [ ] Verifiqué que el movimiento se registró
- [ ] Los filtros funcionan correctamente
- [ ] El CSV se exporta sin errores

---

## 🚀 Siguiente Paso

Una vez implementado, tienes acceso a:
1. **Reportes de movimiento** por producto
2. **Historial completo** de cambios de stock
3. **Auditoría de cambios** (quién, cuándo, por qué)
4. **Trazabilidad** de ventas a inventario
5. **Exportación** de datos para análisis

¡El sistema está listo para usar!
