# 📋 Instrucciones: Integración Cuentas por Pagar con Supabase

## 🚀 Pasos para Activar la Base de Datos

### 1. Ejecutar Script SQL en Supabase

1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Ve a **SQL Editor** (icono de base de datos en el menú lateral)
3. Abre el archivo: `sql/CUENTAS_POR_PAGAR_SETUP.sql`
4. Copia **TODO** el contenido del archivo
5. Pégalo en el editor SQL de Supabase
6. Haz clic en **Run** o presiona `Ctrl+Enter`
7. Espera el mensaje: ✅ **Success. No rows returned**

### 2. Verificar Tablas Creadas

Ve a **Table Editor** y verifica que se crearon estas 3 tablas:
- ✅ `proveedores`
- ✅ `facturas_proveedores`
- ✅ `pagos_proveedores`

### 3. Verificar Datos de Ejemplo

El script incluye datos de ejemplo. Verifica en cada tabla:

**proveedores** (3 registros):
- Distribuidora Roma
- Distribuidora Axa
- Coopicredito

**facturas_proveedores** (4 registros):
- Factura 500787688 (Roma)
- Nota crédito 4400077966 (Roma)
- Factura AXA-2025-001 (Axa)
- Factura COOP-2025-122 (Coopicredito)

**pagos_proveedores** (3 registros):
- 2 pagos a factura 500787688
- 1 pago a factura COOP-2025-122

---

## ✅ Funcionalidades Implementadas

### 🗄️ Persistencia Automática
- Todos los datos se guardan automáticamente en Supabase
- Los cambios persisten al recargar la página
- No se pierden datos al cerrar el navegador

### 🔄 Actualizaciones Automáticas
Un **trigger** en Supabase actualiza automáticamente:
- El **saldo** de la factura cuando registras un pago
- El **estado** de la factura (pendiente → parcial → pagada)
- El **total pagado** acumulado

### 📊 Cálculos Automáticos
El sistema calcula automáticamente:
- Saldo pendiente por factura
- Total por pagar general
- Facturas vencidas
- Monto total vencido
- Días de vencimiento

### 🔐 Seguridad (RLS)
Las tablas tienen **Row Level Security** habilitado:
- Solo usuarios autenticados pueden acceder
- Las políticas están configuradas para roles de Supabase

---

## 🛠️ Estructura de Tablas

### Tabla: `proveedores`
```sql
- id (bigserial)
- nombre (varchar)
- nit (varchar) UNIQUE
- telefono (varchar)
- email (varchar)
- direccion (text)
- contacto (varchar)
- termino_pago (integer) → días de plazo
- activo (boolean)
- created_at, updated_at
```

### Tabla: `facturas_proveedores`
```sql
- id (bigserial)
- proveedor_id (bigint) → referencia a proveedores
- numero_factura (varchar) UNIQUE
- fecha_emision, fecha_vencimiento (date)
- clase (varchar) → FP, NC, ND
- subtotal, iva, retencion, total (decimal)
- pagado, saldo (decimal) → actualizado por trigger
- estado (varchar) → pendiente, parcial, pagada, vencida
- descripcion (text)
- archivo_url (text)
- created_at, updated_at
```

### Tabla: `pagos_proveedores`
```sql
- id (bigserial)
- factura_id (bigint) → referencia a facturas_proveedores
- fecha (date)
- monto (decimal)
- metodo_pago (varchar) → transferencia, efectivo, cheque, tarjeta
- referencia (varchar)
- banco (varchar)
- nota (text)
- usuario (varchar)
- created_at
```

---

## 🔍 Queries Útiles

### Ver resumen por proveedor
```sql
SELECT 
  p.nombre,
  COUNT(f.id) as total_facturas,
  SUM(f.total) as total_facturado,
  SUM(f.pagado) as total_pagado,
  SUM(f.saldo) as saldo_pendiente
FROM proveedores p
LEFT JOIN facturas_proveedores f ON p.id = f.proveedor_id
GROUP BY p.id, p.nombre;
```

### Ver facturas vencidas
```sql
SELECT 
  f.*,
  p.nombre as proveedor,
  (CURRENT_DATE - f.fecha_vencimiento) as dias_vencidos
FROM facturas_proveedores f
JOIN proveedores p ON f.proveedor_id = p.id
WHERE f.fecha_vencimiento < CURRENT_DATE
  AND f.saldo > 0
ORDER BY f.fecha_vencimiento;
```

### Actualizar facturas vencidas manualmente
```sql
SELECT actualizar_facturas_vencidas();
```

---

## 🎯 Próximos Pasos (Opcional)

### 1. Configurar Cron Job
Para actualizar facturas vencidas automáticamente:
1. Ve a **Database** → **Cron Jobs**
2. Crea nuevo job:
   - Nombre: `Actualizar facturas vencidas`
   - Schedule: `0 0 * * *` (diario a medianoche)
   - Query: `SELECT actualizar_facturas_vencidas();`

### 2. Subir Archivos (opcional)
Para adjuntar PDFs de facturas:
1. Ve a **Storage** → **Create bucket**
2. Nombre: `facturas`
3. Public: `false`
4. Configura políticas de acceso
5. Modifica el componente para subir archivos

### 3. Obtener Usuario Actual
En lugar de hardcodear "Edwin Marín":
```javascript
// TODO: Implementar
import { useAuth } from '../context/AuthContext';
const { user } = useAuth();
// Usar user.email o user.nombre en los pagos
```

---

## ❓ Solución de Problemas

### Error: "relation does not exist"
- ✅ Ejecuta nuevamente el script SQL completo
- ✅ Verifica que estás en el proyecto correcto de Supabase

### Error: "duplicate key value violates unique constraint"
- ✅ Ya existe un registro con ese NIT o número de factura
- ✅ Usa otro valor único o edita el existente

### Los datos no se cargan
- ✅ Verifica la conexión en `src/lib/supabase.js`
- ✅ Revisa la consola del navegador (F12) para errores
- ✅ Verifica que las políticas RLS permiten el acceso

### Los pagos no actualizan la factura
- ✅ Verifica que el trigger está creado correctamente
- ✅ Ejecuta: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_actualizar_factura_pago';`

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Verifica los logs de Supabase
3. Consulta la documentación: https://supabase.com/docs
