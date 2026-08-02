# ✅ CHECKLIST: Implementación Sistema de Pre-venta

## 📋 Prerequisitos
- [ ] Acceso a Supabase
- [ ] Acceso al código React
- [ ] Usuario Admin en la aplicación

---

## 🔧 PASO 1: Base de Datos (10 min)

### Ejecutar Script SQL
- [ ] Abre Supabase
- [ ] Ve a SQL Editor
- [ ] Copia contenido de: `sql/AGREGAR_PREVENTA_PRODUCTOS.sql`
- [ ] Pega en SQL Editor
- [ ] Ejecuta
- [ ] Verifica:
  - [ ] Tablas creadas: `preventa_pedidos`, `historial_preventa`
  - [ ] Campos en `productos`: `es_preventa`, `fecha_disponibilidad`, etc.
  - [ ] Campos en `pedidos`: `es_preventa`, `fecha_cumplimiento_preventa`
  - [ ] Trigger creado: `trigger_cumplir_preventa`

### Crear Función RPC (opcional pero recomendado)
```sql
-- En Supabase SQL Editor:
CREATE OR REPLACE FUNCTION incrementar_stock_preventa(
  producto_id BIGINT, 
  cantidad INTEGER
)
RETURNS TABLE(producto_id BIGINT, nuevo_stock INTEGER) AS $$
BEGIN
  UPDATE productos 
  SET stock_preventa = stock_preventa + cantidad,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = producto_id;
  
  RETURN QUERY
  SELECT productos.id, productos.stock_preventa
  FROM productos
  WHERE productos.id = producto_id;
END;
$$ LANGUAGE plpgsql;
```

- [ ] Función RPC creada

---

## 🎨 PASO 2: Copiar Archivos React (5 min)

### Verificar que los archivos existan:
- [ ] `src/hooks/usePreventaProducts.js`
- [ ] `src/components/ProductoPreventa.jsx`
- [ ] `src/components/ProductoPreventa.css`
- [ ] `src/components/SeccionProductosNuevos.jsx`
- [ ] `src/components/SeccionProductosNuevos.css`
- [ ] `src/components/AdminProductosPreventa.jsx`
- [ ] `src/components/AdminProductosPreventa.css`
- [ ] `src/lib/preventaUtils.js`

Si no existen, crearlos manualmente o copiar desde la documentación.

---

## 🔗 PASO 3: Integrar en CatalogoProductos (10 min)

### Abrir `src/components/CatalogoProductos.jsx`

### Agregar imports:
```jsx
import { usePreventaProducts } from '../hooks/usePreventaProducts';
import SeccionProductosNuevos from './SeccionProductosNuevos';
```

- [ ] Imports agregados

### En el componente, añadir hook:
```jsx
function CatalogoProductos() {
  const { productosPreventa, loading: loadingPreventa } = usePreventaProducts();
  const [carrito, setCarrito] = useState([]);
  // ... resto del código
```

- [ ] Hook `usePreventaProducts` usado

### Agregar función para manejar carrito con preventa:
```jsx
const handleAgregarAlCarrito = (producto) => {
  const itemCarrito = {
    ...producto,
    id_temporal: Date.now(),
  };
  
  setCarrito([...carrito, itemCarrito]);
  // Mostrar notificación
  if (producto.es_preventa) {
    alert(`✅ Reserva agregada al carrito. Se confirmará cuando esté disponible.`);
  }
};
```

- [ ] Función manejadora agregada

### En el JSX, agregar sección ANTES de otros productos:
```jsx
return (
  <div className="catalogo">
    {/* NUEVO: Sección de productos nuevos */}
    <SeccionProductosNuevos 
      productosPreventa={productosPreventa}
      onAgregarAlCarrito={handleAgregarAlCarrito}
      loading={loadingPreventa}
    />

    {/* Resto del catálogo */}
    {/* ... */}
  </div>
);
```

- [ ] `SeccionProductosNuevos` integrada
- [ ] Testear cargando CatalogoProductos en el navegador
- [ ] Verificar que aparezca sección de nuevos productos

---

## 👨‍💼 PASO 4: Integrar Admin (5 min) - OPCIONAL

### Si tienes panel admin:

```jsx
// En tu archivo de Admin/Dashboard
import AdminProductosPreventa from './components/AdminProductosPreventa';

// Agregar en rutas o navegación:
<Route path="/admin/preventa" element={<AdminProductosPreventa />} />

// O si usa tabs:
{activeTab === 'preventa' && <AdminProductosPreventa />}
```

- [ ] `AdminProductosPreventa` integrada en admin
- [ ] Navegar a admin y verificar que aparezca sección

---

## 🛒 PASO 5: Integrar en Carrito/Checkout (15 min)

### Abrir tu componente de Carrito o Checkout

### Importar utilidades:
```jsx
import { procesarCarritoConPreventa, formatearResumenCarrito } from '../lib/preventaUtils';
```

- [ ] Imports agregados

### Modificar función de checkout:
```jsx
const handleComprar = async (datosCliente) => {
  const resultado = await procesarCarritoConPreventa(
    carrito,
    {
      nombre: datosCliente.nombre,
      telefono: datosCliente.telefono,
      direccion: datosCliente.direccion,
    }
  );

  if (resultado.exitoso) {
    alert('✅ Compra procesada correctamente');
    setCarrito([]);
    // Redirigir a confirmación
  } else {
    alert('Error: ' + resultado.error);
  }
};
```

- [ ] Checkout actualizado
- [ ] Testear crear una pre-venta hasta el final

### Mostrar resumen con info de preventa:
```jsx
const resumen = formatearResumenCarrito(carrito);

// En el JSX:
{resumen.preventa > 0 && (
  <div className="advertencia-preventa">
    <p>ℹ️ {resumen.preventa} producto(s) en pre-venta se confirmarán automáticamente</p>
  </div>
)}
```

- [ ] Resumen integrado
- [ ] Verificar que se muestre info de preventa en checkout

---

## 🧪 PASO 6: Testing (20 min)

### Test 1: Crear Producto de Preventa
- [ ] Ir a Admin → "Crear Nuevo"
- [ ] Llenar datos:
  - Nombre: "Test Producto"
  - Precio: 1000
  - Fecha: Mañana (+1 día)
- [ ] Guardar
- [ ] ✅ Verificar que aparezca en lista

### Test 2: Ver en Catálogo
- [ ] Ir a Catálogo
- [ ] ✅ Verificar que aparezca sección "🎁 Productos Nuevos"
- [ ] ✅ Ver el producto con badge PRE-VENTA
- [ ] ✅ Ver fecha disponibilidad y días

### Test 3: Hacer Reserva
- [ ] Click "🛒 Reservar Ahora"
- [ ] Seleccionar cantidad
- [ ] ✅ Se agrega al carrito como preventa
- [ ] Ir a checkout
- [ ] ✅ Ver en resumen como preventa

### Test 4: Procesar Checkout
- [ ] Completar datos cliente
- [ ] Click "✅ Completar Compra"
- [ ] ✅ Se crea pedido de preventa
- [ ] ✅ Se ve en admin como reservado

### Test 5: Activar Automáticamente
- [ ] En Admin, ver detalles del producto
- [ ] ✅ Ver "Reservas recibidas: X unidades"
- [ ] Click "✅ Activar del Inventario"
- [ ] Ingresar stock: 50
- [ ] ✅ Se ejecuta trigger
- [ ] ✅ Pedidos se marcan como cumplidos
- [ ] ✅ Stock se decrementa correctamente

### Test 6: Verificar en pedidos
- [ ] Ver tabla pedidos
- [ ] ✅ El pedido cambió de "RESERVADO" a "CUMPLIDO"
- [ ] ✅ Mantiene fecha y precio original

---

## 📊 PASO 7: Verificación Final (10 min)

### Base de Datos:
- [ ] Ejecutar query:
```sql
SELECT * FROM productos WHERE es_preventa = true;
```
✅ Debería mostrar al menos el producto de test

- [ ] Ejecutar query:
```sql
SELECT * FROM preventa_pedidos;
```
✅ Debería mostrar la reserva que hicimos

### Aplicación:
- [ ] Refrescar página → Sección de nuevos productos sigue visible
- [ ] Ordenamientos funcionan (Próximamente, Recientes, Precio)
- [ ] Filtros por categoría funcionan (si aplica)

### Admin:
- [ ] Panel admin muestra lista de pre-ventas
- [ ] Puedo ver detalles de cada una
- [ ] Puedo activar del inventario

---

## 🎉 PASO 8: Go Live

### Antes de producción:
- [ ] Revisar guía: `GUIA_SISTEMA_PREVENTA.md`
- [ ] Revisar ejemplos: `EJEMPLO_INTEGRACION_PREVENTA.md`
- [ ] Testing completo en producción
- [ ] Capacitar a equipo admin

### En producción:
- [ ] Crear primer producto de preventa real
- [ ] Hacer test con cliente real (si es posible)
- [ ] Monitorear trigger automático
- [ ] Recolectar feedback

---

## ⚠️ Troubleshooting

### Problema: No aparece sección de productos nuevos
**Solución:**
- [ ] Verificar que `usePreventaProducts` está importado
- [ ] Verificar que `SeccionProductosNuevos` está importado
- [ ] Verificar en DevTools > Network que datos se cargan
- [ ] Abrir consola y buscar errores

### Problema: Trigger no se ejecuta
**Solución:**
- [ ] Verificar que trigger existe: `SELECT * FROM pg_trigger WHERE tgname = 'trigger_cumplir_preventa';`
- [ ] Verificar que se actualiza `es_preventa` a `false`
- [ ] Verificar logs de Supabase

### Problema: Stock incorrecto después de cumplir
**Solución:**
- [ ] Verificar que se restó `stock_preventa` del total
- [ ] Verificar lógica del trigger en SQL

### Problema: Carrito no muestra preventa diferente
**Solución:**
- [ ] Verificar que `es_preventa` se pasa al agregar
- [ ] Verificar CSS de items de preventa
- [ ] Revisar Developer Tools para ver estructura de datos

---

## 📞 Soporte

Si tienes dudas:
1. Revisar: `GUIA_SISTEMA_PREVENTA.md`
2. Revisar: `EJEMPLO_INTEGRACION_PREVENTA.md`
3. Ver archivos comentados (tienen explicaciones)
4. Revisar este checklist

---

## ✅ CHECKLIST FINAL

- [ ] SQL ejecutado ✅
- [ ] Archivos React copiados ✅
- [ ] Integrado en Catálogo ✅
- [ ] Integrado en Admin (opcional) ✅
- [ ] Integrado en Checkout ✅
- [ ] Tests completados ✅
- [ ] Base de datos verificada ✅
- [ ] Documentación leída ✅
- [ ] Listo para go live ✅

---

## 🚀 ¡LISTO!

Ahora tienes un sistema de pre-venta completamente funcional.

**¿Próximo paso?** Crear el primer producto de preventa en admin y empezar a vender. 🎉
