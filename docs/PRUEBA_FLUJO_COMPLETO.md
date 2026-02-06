# 🧪 PRUEBA DEL FLUJO COMPLETO: Factura → Inventario

## 📋 Objetivos de la Prueba
Verificar que el sistema completo funcione correctamente desde:
1. ✅ Creación de factura en InvoiceScreen
2. ✅ Guardado de factura en base de datos
3. ✅ Actualización automática del inventario (stock se reste)
4. ✅ Desactivación de producto cuando stock llega a 0

---

## 🚀 PASOS PARA LA PRUEBA

### PASO 1: Acceder a la Aplicación
- URL: `http://localhost:5175/`
- Deberías ver la pantalla de login
- **Nota:** Si no tiene login, la aplicación debería llevar directo al dashboard

### PASO 2: Revisar Inventario Inicial
1. Ir a **CatalogoProductos** (si existe) o revisar en Supabase
2. Seleccionar un producto para la prueba, por ejemplo:
   - **Nombre:** "Gigo" (o cualquier producto)
   - **Stock Actual:** Anotar el número (ej: 100)
   - **Precio:** Anotar el precio (ej: $29,000)

**Comando para verificar en Supabase:**
```sql
SELECT id, nombre, stock, precio, activo FROM productos WHERE nombre LIKE '%Gigo%' LIMIT 1;
```

### PASO 3: Crear Factura con el Producto
1. Ir a **Crear Factura** (InvoiceScreen)
2. Rellenar datos:
   - **Cliente:** Ingresar un nombre de cliente de prueba
   - **Teléfono:** Ingresar cualquier teléfono (ej: 3215555555)
   - **Vendedor:** Seleccionar "Edwin Marin" (o cualquiera)
3. **Agregar producto:**
   - Click en "Agregar Producto"
   - Buscar "Gigo"
   - Seleccionar cantidad: **10 unidades**
   - Confirmar agregación

### PASO 4: Vista Previa y Guardar
1. Click en **"Vista Previa"** o **"Generar Factura"**
2. Verificar que aparezcan los datos correctamente
3. Click en **"Guardar Factura"**
4. El sistema debería mostrar: `✅ Factura guardada exitosamente!`
   - Anotar el **Número de Factura** que aparece (ej: #12345)

### PASO 5: Verificar Inventario se Actualizó
**Opción A - En Supabase:**
```sql
SELECT id, nombre, stock, activo FROM productos WHERE nombre LIKE '%Gigo%' LIMIT 1;
```
- Stock debería ser: **100 - 10 = 90**
- Activo debería seguir siendo: **true** (porque 90 > 0)

**Opción B - En la aplicación:**
1. Ir a **CatalogoProductos** nuevamente
2. Buscar "Gigo"
3. Verificar que el stock ahora muestre: **90 unidades**

### PASO 6: Prueba Extrema - Stock a 0
Para una prueba más completa, repite los pasos 3-5 pero:
1. Agregar **90 unidades** del mismo producto (para vaciarlo)
2. Guardar factura
3. Verificar en Supabase que:
   - Stock = **0**
   - Activo = **false** (el producto se desactiva automáticamente)

---

## 🔍 VERIFICACIÓN TÉCNICA

### Consultas SQL para Verificar

**1. Ver factura guardada:**
```sql
SELECT id, cliente, fecha, vendedor, total, productos FROM facturas 
WHERE id = [NUMERO_FACTURA_DE_PRUEBA]
LIMIT 1;
```

**2. Ver historial de cambios de stock:**
```sql
SELECT id, nombre, stock, activo, updated_at FROM productos 
WHERE nombre LIKE '%Gigo%'
ORDER BY updated_at DESC;
```

**3. Ver todas las facturas del cliente de prueba:**
```sql
SELECT id, cliente, fecha, total FROM facturas 
WHERE cliente = '[NOMBRE_CLIENTE_PRUEBA]'
ORDER BY fecha DESC;
```

---

## ⚠️ POSIBLES PROBLEMAS Y SOLUCIONES

### Problema 1: Factura no se guarda
**Causa probable:** Error de autenticación o conexión a Supabase
**Solución:**
- Verificar que `supabaseClient.js` tiene las credenciales correctas
- Revisar la consola del navegador (F12 → Console) para ver errores
- Verificar que la tabla `facturas` existe en Supabase

### Problema 2: Stock no se actualiza
**Causa probable:** `actualizarInventario()` no se ejecuta correctamente
**Solución:**
- Verificar en la consola que aparezca el log: `Stock actualizado para Gigo: 100 -> 90`
- Revisar que `producto_id` está correctamente asignado
- Verificar permisos de escritura en la tabla `productos`

### Problema 3: Producto se desactiva cuando no debería
**Causa probable:** Lógica de `estaraActivo` incorrecta
**Solución:**
- Verificar línea 268 en InvoiceScreen.jsx
- Asegurarse que solo se desactiva cuando `nuevoStock === 0`

---

## 📊 RESUMEN DE ESPERADO

| Paso | Acción | Resultado Esperado |
|------|--------|-------------------|
| 1 | Acceder app | ✅ Carga sin errores |
| 2 | Ver stock inicial | ✅ Stock = 100 |
| 3 | Crear factura | ✅ Factura creada |
| 4 | Guardar factura | ✅ Mensaje de éxito |
| 5 | Revisar stock | ✅ Stock = 90 |
| 6 | Producto desactivado (con stock 0) | ✅ Activo = false |

---

## 🎯 CONFIRMACIÓN DE ÉXITO

La prueba es **EXITOSA** si:
1. ✅ Factura se crea sin errores
2. ✅ Se asigna un número de factura
3. ✅ Stock se resta correctamente (100 → 90)
4. ✅ Producto se desactiva cuando stock = 0
5. ✅ No hay errores en la consola del navegador

---

**Última actualización:** 26 de enero de 2026
**Testeado en:** http://localhost:5175/
