# 📚 GUÍA VISUAL: Vendedor en Carrito

## PASO 1: Ejecutar SQL en Supabase 🗄️

### Dónde ejecutar:
```
Supabase.com 
  → Tu Proyecto 
    → SQL Editor 
      → Nueva Query
```

### Qué copiar y pegar:

```sql
-- ⚠️ COPIAR Y PEGAR ESTO:
ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS vendedor VARCHAR(255);

UPDATE pedidos SET vendedor = 'Sin asignar' WHERE vendedor IS NULL;
```

### Botón a hacer clic:
```
┌─────────────────────────────┐
│  ▶️  Run  (o Ctrl+Enter)   │
└─────────────────────────────┘
```

**✅ Cuando veas un mensaje de éxito, continúa.**

---

## PASO 2: Probar el Carrito 🛒

### Navegación:
```
1. App Principal
2. Haz clic en "Catálogo de Productos"
3. Agrega 2-3 productos al carrito
4. Haz clic en 🛒 (carrito inferior) o 🛒 (botón superior)
```

### Qué verás (NUEVO):

```
╔═══════════════════════════════════════════╗
║        Tu Pedido                          ║
╠═══════════════════════════════════════════╣
║                                           ║
║  Completa tus datos para enviar el pedido║
║                                           ║
║  ┌─────────────────────────────────────┐ ║
║  │ Vendedor * ▼                        │ ║  ← NUEVO CAMPO
║  │ ├─ Edwin Marin                      │ ║
║  │ ├─ Fredy Marin                      │ ║
║  │ ├─ Fabian Marin                     │ ║
║  │ └─ [Selecciona uno]                 │ ║
║  └─────────────────────────────────────┘ ║
║                                           ║
║  ┌─────────────────────────────────────┐ ║
║  │ Nombre Completo *                   │ ║
║  │ [Juan García]                       │ ║
║  └─────────────────────────────────────┘ ║
║                                           ║
║  ┌─────────────────────────────────────┐ ║
║  │ Teléfono *                          │ ║
║  │ [3001234567]                        │ ║
║  └─────────────────────────────────────┘ ║
║                                           ║
║  ┌─────────────────────────────────────┐ ║
║  │ Dirección (Opcional)                │ ║
║  │ [Calle 10 #25-30]                   │ ║
║  └─────────────────────────────────────┘ ║
║                                           ║
║  Notas adicionales (opcional):            ║
║  [Entregar antes del viernes]             ║
║                                           ║
╠═══════════════════════════════════════════╣
║  Total: $150.000                          ║
╠═══════════════════════════════════════════╣
║ [← Seguir Comprando] [→ Enviar por WA 💬] ║
╚═══════════════════════════════════════════╝
```

### Acción:
1. Selecciona un vendedor en el dropdown
2. Completa los datos
3. Haz clic en "Enviar Pedido por WhatsApp"
4. ✅ Pedido guardado con vendedor

---

## PASO 3: Cargar Pedido en Factura 📋

### Navegación:
```
1. Menú Principal
2. "Gestión de Pedidos"
3. Busca el pedido que acabas de crear
4. Haz clic en "🧾 Cargar como Factura"
```

### Qué pasa:
```
ANTES:
┌─────────────────────┐
│ Vendedor: [vacío] ▼ │  ← Había que seleccionar
└─────────────────────┘

DESPUÉS:
┌─────────────────────┐
│ Vendedor: Edwin... ▼│  ← ✅ Pre-llenado automáticamente
└─────────────────────┘
```

---

## PASO 4: Guardar Factura ✅

```
1. Verifica que el vendedor sea correcto
2. Agrega o modifica productos si lo necesitas
3. Haz clic en "Guardar Factura"
4. ✅ Factura creada con vendedor correcto
```

---

## 🔍 VERIFICATIONS 

### En la BASE DE DATOS (Supabase):

```sql
SELECT * FROM pedidos WHERE vendedor IS NOT NULL LIMIT 5;
```

Debes ver una columna `vendedor` con valores como:
- "Edwin Marin"
- "Fredy Marin"
- "Fabian Marin"
- "Sin asignar" (para pedidos antiguos)

---

## ⚙️ Si Algo No Funciona

### Error 1: Campo no aparece en el carrito
```
✓ Ejecutaste el SQL?
✓ Reiniciaste la app? (F5)
✓ El código está actualizado?
→ Intenta limpiar caché: Ctrl+Shift+Del → Cookies y caché
```

### Error 2: Vendedor no se pre-llena en factura
```
✓ ¿Estás usando "Cargar como Factura"?
  (No "Crear Factura" del menú principal)
✓ ¿El pedido tiene vendedor guardado?
→ Verifica en BD: SELECT vendedor FROM pedidos WHERE id = XXX;
```

### Error 3: SQL no ejecuta
```
✓ ¿Estás en la cuenta correcta de Supabase?
✓ ¿Copió bien el SQL?
✓ ¿Ejecutó el botón ▶️?
→ Copia exactamente desde: /sql/AGREGAR_VENDEDOR_PEDIDOS.sql
```

---

## 📸 Screenshots de la Funcionalidad

### Screenshot 1: Carrito con Vendedor

```
╔════════════════════════════════════════════════════╗
║                 CARRITO (NUEVO)                    ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  📍 PRODUCTOS EN CARRITO:                         ║
║  • Producto A (Cantidad: 5)                       ║
║  • Producto B (Cantidad: 10)                      ║
║                                                    ║
║  📋 DATOS CLIENTE:                                ║
║                                                    ║
║  Vendedor * ▼                                      ║
║  ├─ Edwin Marin         ← NUEVO: OBLIGATORIO     ║
║  ├─ Fredy Marin                                   ║
║  └─ Fabian Marin                                  ║
║                                                    ║
║  Nombre: María González                           ║
║  Tel: 3001234567                                  ║
║  Dir: Calle 10 #25-30                             ║
║  Notas: Entrega rápida                            ║
║                                                    ║
║  💰 TOTAL: $250.000                               ║
║                                                    ║
║  [Seguir Comprando] [Enviar por WhatsApp ✓]      ║
╚════════════════════════════════════════════════════╝
```

### Screenshot 2: Factura Pre-llenada

```
╔════════════════════════════════════════════════════╗
║              CREAR FACTURA                         ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  Cliente: María González                          ║
║  Teléfono: 3001234567                             ║
║  Dirección: Calle 10 #25-30                       ║
║                                                    ║
║  Vendedor: Edwin Marin     ← ✅ PRE-LLENADO      ║
║  Fecha: 2024-01-20                                ║
║                                                    ║
║  PRODUCTOS:                                       ║
║  • Producto A (5) @ $20.000 = $100.000           ║
║  • Producto B (10) @ $15.000 = $150.000          ║
║                                                    ║
║  TOTAL: $250.000                                  ║
║                                                    ║
║  [Cancelar] [Guardar Factura]                    ║
╚════════════════════════════════════════════════════╝
```

---

## 📊 Tabla de Cambios

| Parte | Antes | Ahora |
|-------|-------|-------|
| 🛒 Carrito | Sin vendedor | Vendedor obligatorio ✨ |
| 📋 Pedido (BD) | Sin columna | `vendedor VARCHAR(255)` ✨ |
| 📄 Factura | Vendedor vacío | Pre-llenado del pedido ✨ |
| ⚡ Flujo | 2 acciones | 1 acción (automático) ✨ |

---

## ✨ Tips y Trucos

💡 **Cambiar vendedores disponibles:**
- Edita `/src/components/CatalogoClientes.jsx`
- Busca: `const vendedores = ['Edwin Marin', ...]`
- Cambia los nombres

💡 **Ver todos tus pedidos con vendedor:**
```sql
SELECT cliente_nombre, vendedor, total 
FROM pedidos 
ORDER BY fecha_creacion DESC;
```

💡 **Contar pedidos por vendedor:**
```sql
SELECT vendedor, COUNT(*) as pedidos 
FROM pedidos 
GROUP BY vendedor;
```

---

## 🎯 Resumen Rápido

```
1. ✅ Ejecuta SQL en Supabase
2. ✅ Prueba carrito > Selecciona vendedor > Envía pedido
3. ✅ Ve a GestionPedidos > Cargar como Factura
4. ✅ Verifica que vendedor sea pre-llenado automáticamente
5. ✅ Guarda la factura

¡LISTO! 🎉
```

---

**¿Necesitas ayuda?** Revisa:
- `GUIA_RAPIDA_VENDEDOR_CARRITO.md` - Para ayuda rápida
- `IMPLEMENTACION_VENDEDOR_CARRITO.md` - Para detalles técnicos
- `sql/AGREGAR_VENDEDOR_PEDIDOS.sql` - Para el SQL
