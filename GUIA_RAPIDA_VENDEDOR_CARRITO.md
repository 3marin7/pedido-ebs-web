# ⚡ GUÍA RÁPIDA: Activar Vendedor en Carrito

## 🎯 ¿QUÉ SE HIZO?

Ahora el **carrito de compras** permite seleccionar un **vendedor**, y ese vendedor se importa automáticamente cuando creas la factura.

---

## 📋 PASO 1: Ejecutar SQL en Supabase (⚠️ IMPORTANTE)

1. Abre tu proyecto en [Supabase](https://supabase.com)
2. Ve a **SQL Editor**
3. Copia y ejecuta este SQL:

```sql
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS vendedor VARCHAR(255);
COMMENT ON COLUMN pedidos.vendedor IS 'Nombre del vendedor que gestiona el pedido';
UPDATE pedidos SET vendedor = 'Sin asignar' WHERE vendedor IS NULL;
```

**✅ Listo!** La tabla está actualizada.

---

## 🧪 PASO 2: Prueba la Nueva Funcionalidad

### 📱 Opción A: Crear Pedido Desde Catálogo
1. Ve a **Catálogo de Productos**
2. Agrega algunos productos al carrito
3. Abre el carrito (🛒 botón inferior)
4. **Verás un nuevo campo:**
   ```
   Vendedor * ▼
   ├─ Edwin Marin
   ├─ Fredy Marin
   └─ Fabian Marin
   ```
5. Selecciona un vendedor ⭐ (campo obligatorio)
6. Completa: Nombre, Teléfono, Dirección
7. Envía el pedido por WhatsApp ✅

### 📋 Opción B: Crear Factura Desde Pedido Guardado
1. Ve a **Gestión de Pedidos**
2. Selecciona un pedido existente
3. Haz clic en **🧾 Cargar como Factura**
4. ✅ **El vendedor del pedido se importa automáticamente** en el campo "Vendedor"
5. Puedes cambiar si lo necesitas
6. Guarda la factura ✅

---

## 📊 CAMBIOS VISIBLES

### En el Carrito:
```
ANTES:                        AHORA:
┌──────────────────┐         ┌──────────────────┐
│ Nombre Completo  │         │ Vendedor * ▼     │  ← NUEVO
│ Teléfono *       │         │ Nombre Completo  │
│ Dirección        │         │ Teléfono *       │
│ Notas            │         │ Dirección        │
└──────────────────┘         │ Notas            │
                             └──────────────────┘
```

### En la Factura:
```
Cuando cargas un pedido como factura, el vendedor 
viene pre-llenado automáticamente ✅
```

---

## 🔧 PERSONALIZACIÓN

¿Quieres cambiar los nombres de vendedores?

**Archivo:** `/src/components/CatalogoClientes.jsx`  
**Línea:** Busca `const vendedores = [...]`

```javascript
// Edita estos nombres
const vendedores = ['Edwin Marin', 'Fredy Marin', 'Fabian Marin'];

// Ejemplo: agregar un nuevo vendedor
const vendedores = ['Edwin Marin', 'Fredy Marin', 'Fabian Marin', 'Nuevo Vendedor'];
```

---

## ✅ CHECKLIST FINAL

- [ ] Ejecuté el SQL en Supabase ⚠️ **CRÍTICO**
- [ ] Probé crear un pedido desde catálogo con vendedor
- [ ] El vendedor se guardó correctamente
- [ ] Cargué un pedido como factura
- [ ] El vendedor se importó automáticamente en la factura
- [ ] Todo funciona como esperado ✅

---

## 🐛 TROUBLESHOOTING

### ❌ Problema: "Error en campo vendedor"

**Solución:** Asegúrate de ejecutar el SQL en Supabase primero.

### ❌ Problema: El vendedor no aparece en el carrito

**Verificar:**
1. ¿Ejecutaste el SQL?
2. ¿Reiniciaste la aplicación? (Ctrl+R o Cmd+R)
3. ¿Estás usando la última versión del código?

### ❌ Problema: El vendedor no se importa en la factura

**Verificar:**
1. ¿El pedido tiene vendedor guardado?
2. ¿Estás usando "Cargar como Factura" desde GestionPedidos?
3. No uses el botón "Crear Factura" del menú principal, usa "Cargar como Factura" en el pedido

---

## 📚 DOCUMENTACIÓN COMPLETA

- **Implementación detallada:** `IMPLEMENTACION_VENDEDOR_CARRITO.md`
- **Detalles de código:** `DETALLES_CAMBIOS_VENDEDOR.md`
- **SQL:** `sql/AGREGAR_VENDEDOR_PEDIDOS.sql`

---

## 💡 TIPS

✅ El campo de vendedor es **obligatorio** - no puedes enviar pedido sin seleccionarlo  
✅ Los pedidos antiguos usarán **"Sin asignar"** como vendedor  
✅ Puedes cambiar el vendedor cuando cargas un pedido como factura  
✅ El vendedor se guarda en la base de datos para trazabilidad  

---

**🚀 ¡Listo! Ya puedes usar vendedores en tu carrito de compras.**

