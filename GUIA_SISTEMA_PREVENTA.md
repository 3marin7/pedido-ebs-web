# 📋 Guía de Implementación: Sistema de Pre-venta

## Resumen de la Solución

Se ha implementado un **sistema completo de pre-venta** que permite:
- ✅ Crear productos nuevos con fecha de disponibilidad
- ✅ Mostrar sección separada de productos nuevos en el catálogo
- ✅ Permitir reservas automáticas antes de que entren al inventario
- ✅ Cumplir automáticamente pedidos cuando el producto entra al stock
- ✅ Gestionar pre-ventas desde admin

---

## 📦 Componentes Creados

### 1. **Hook: `usePreventaProducts.js`**
- Gestiona toda la lógica de productos en pre-venta
- Carga, crea, actualiza productos
- Obtiene pedidos de preventa pendientes
- Activa productos del inventario

### 2. **Componente: `ProductoPreventa.jsx`**
- Tarjeta individual de producto en pre-venta
- Muestra días hasta disponibilidad
- Selector de cantidad
- Botón "Reservar Ahora"
- Badge visual de pre-venta

### 3. **Componente: `SeccionProductosNuevos.jsx`**
- Sección completa para mostrar productos en preventa
- Filtrado por categoría
- Ordenamiento (próximamente, recientes, precio)
- Banner informativo

### 4. **Componente: `AdminProductosPreventa.jsx`**
- Panel admin para gestionar pre-ventas
- Crear productos en preventa
- Ver detalles y reservas
- Activar productos del inventario

---

## 🗄️ Cambios en Base de Datos

**Archivo SQL:** `sql/AGREGAR_PREVENTA_PRODUCTOS.sql`

### Nuevas columnas en `productos`:
- `es_preventa` (BOOLEAN) - marca si está en preventa
- `fecha_disponibilidad` (DATE) - cuándo entra al inventario
- `stock_preventa` (INTEGER) - cantidad de reservas
- `descripcion_preventa` (TEXT) - descripción especial

### Nueva tabla: `preventa_pedidos`
Relaciona pedidos con productos en preventa, rastreando:
- Estado (reservado, cumplido, cancelado)
- Cantidad y precio
- Fecha de pedido
- Fecha de cumplimiento automático

### Trigger automático
Cuando un producto cambia de `es_preventa = true` a `es_preventa = false`:
1. Se cumplen automáticamente los pedidos pendientes
2. Se decrementa el stock según la cantidad de reservas
3. Se registra el cumplimiento en auditoría

---

## 🔧 Instalación

### Paso 1: Ejecutar SQL
```sql
-- Ejecutar en Supabase > SQL Editor
-- Archivo: sql/AGREGAR_PREVENTA_PRODUCTOS.sql
```

### Paso 2: Integrar en CatalogoProductos.jsx

```jsx
import { usePreventaProducts } from '../hooks/usePreventaProducts';
import SeccionProductosNuevos from './SeccionProductosNuevos';

export default function CatalogoProductos() {
  const { productosPreventa, loading: loadingPreventa } = usePreventaProducts();
  const [carrito, setCarrito] = useState([]);

  const handleAgregarAlCarrito = (producto) => {
    // Lógica para agregar al carrito
    setCarrito([...carrito, {
      ...producto,
      id_temporal: Date.now()
    }]);
  };

  return (
    <div className="catalogo">
      {/* Mostrar sección de productos nuevos ANTES de productos normales */}
      <SeccionProductosNuevos 
        productosPreventa={productosPreventa}
        onAgregarAlCarrito={handleAgregarAlCarrito}
        loading={loadingPreventa}
      />

      {/* Resto del catálogo con productos normales */}
      {/* ... */}
    </div>
  );
}
```

### Paso 3: Integrar Admin (opcional)

```jsx
// En el panel de administración
import AdminProductosPreventa from './components/AdminProductosPreventa';

// Agregar ruta o tab en admin
<AdminProductosPreventa />
```

---

## 📊 Flujo de Pre-venta

```
┌─────────────────────────────────┐
│  1. CREAR PRODUCTO PREVENTA     │
│  - Nombre, descripción          │
│  - Fecha disponibilidad         │
│  - Precio especial              │
│  - Foto/características         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  2. MOSTRAR EN CATALOGO         │
│  - Sección "Productos Nuevos"   │
│  - Badge "PRE-VENTA"            │
│  - Días hasta disponibilidad    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  3. CLIENTE RESERVA             │
│  - Selecciona cantidad          │
│  - Crea pedido en preventa      │
│  - Se guarda en tabla           │
│    preventa_pedidos             │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  4. INGRESA STOCK AL INVENTARIO │
│  - Admin actualiza producto     │
│  - es_preventa = false          │
│  - Ingresa cantidad de stock    │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  5. TRIGGER AUTOMÁTICO          │
│  - Cumple pedidos en orden FIFO │
│  - Decrementa stock             │
│  - Notifica clientes (opcional) │
└─────────────────────────────────┘
```

---

## 💡 Uso: Cliente Realizando Pre-venta

### Desde el catálogo:
1. Ver sección "Productos Nuevos"
2. Ver producto con badge 🔔 PRE-VENTA
3. Ver fecha "Disponible en X días"
4. Seleccionar cantidad
5. Clic en "🛒 Reservar Ahora"
6. Se agrega al carrito como preventa
7. Al checkout, se crea un `preventa_pedido`

---

## 🛠️ Uso: Admin Gestionar Pre-ventas

### Panel Admin:
1. Ir a "Productos Nuevos (Pre-venta)"
2. **Crear Nuevo:**
   - Nombre, categoría, descripción
   - Descripción especial (características)
   - Precio de preventa
   - Imagen
   - Fecha de disponibilidad

3. **Ver Detalles:**
   - Cantidad de reservas recibidas
   - Lista de clientes que reservaron
   - Cantidades reservadas

4. **Activar del Inventario:**
   - Botón ✅ "Activar"
   - Ingresar cantidad de stock
   - ¡El trigger cumple automáticamente!

---

## 🎨 Personalización

### Cambiar colores de pre-venta:
```css
/* En ProductoPreventa.css y SeccionProductosNuevos.css */
.badge-preventa {
  background: linear-gradient(135deg, #c084fc 0%, #a855f7 100%);
}
```

### Cambiar textos:
- Búscar "PRE-VENTA" en los componentes
- Cambiar el texto del badge, botones, etc.

### Agregar notificaciones:
- Integrar con servicio de email/SMS
- Modificar el trigger para enviar notificaciones

---

## 🔔 Consideraciones Importantes

### Auditoría
Se registra en `historial_preventa`:
- Cuándo se creó la preventa
- Cuándo se cumplió
- Qué pasó en cada etapa

### Rollback/Cancelación
Si necesitas cancelar una preventa:
```sql
UPDATE preventa_pedidos 
SET estado = 'cancelado'
WHERE id = ?;
```

### Límite de stock en preventa
Puedes agregar validación:
```sql
-- No permitir más reservas que un límite
MAX_PREVENTA = 100
```

---

## 🚀 Próximos Pasos (Opcionales)

1. **Notificaciones:**
   - Email cuando producto está disponible
   - SMS a cliente
   - Push notification en app

2. **Promociones:**
   - Descuentos adicionales en preventa
   - "Buy 2 Get 1 Free" en preventa
   - Ofertas por cantidad

3. **Seguimiento:**
   - Dashboard de pre-ventas más vendidas
   - Gráficos de tendencias
   - Reportes de ROI en preventa

4. **Integración de Pagos:**
   - Pago de depósito en preventa
   - Balance = stock real - preventa

---

## ❓ FAQ

**P: ¿Qué pasa si el stock ingresado es menor que las reservas?**
R: El trigger cumple en orden FIFO (primero en llegar, primero en cumplirse) hasta agotar stock.

**P: ¿Se pueden modificar precios después de reservar?**
R: El precio está guardado en `preventa_pedidos`, así que cada cliente conserva su precio.

**P: ¿Cómo cancelar una pre-venta?**
R: Cambiar `estado = 'cancelado'` en `preventa_pedidos` y procesar reembolso.

**P: ¿Se puede vender a precio diferente en preventa?**
R: Sí, guardas `precio_unitario` en `preventa_pedidos` separado del producto.

---

## 📞 Soporte

Para dudas sobre:
- **Base de datos:** Ver archivo `sql/AGREGAR_PREVENTA_PRODUCTOS.sql`
- **Componentes React:** Ver comentarios en cada archivo
- **Trigger automático:** Ver función `cumplir_preventa_automaticamente()`
