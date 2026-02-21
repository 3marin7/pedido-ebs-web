# 🎬 QUICK START: Vendedor en Carrito (5 Minutos)

## El Plan

```
⏱️  3 min  → Ejecutar SQL
⏱️  1 min  → Probar carrito
⏱️  1 min  → Probar factura
💯 5 min   TOTAL
```

---

## ⚡ PASO 1: EJECUTAR SQL (3 minutos)

### Ubicación Visual del SQL

```
📁 Tu Proyecto
  └─ sql/
    └─ AGREGAR_VENDEDOR_PEDIDOS.sql  ← ESTE ARCHIVO
```

### Qué hacer:

1. **Abre el archivo SQL:**
   ```
   /pedido-ebs-web/sql/AGREGAR_VENDEDOR_PEDIDOS.sql
   ```

2. **Copia el contenido**

3. **Ve a Supabase:**
   ```
   supabase.com → Tu Proyecto → SQL Editor
   ```

4. **Pega y ejecuta:**
   ```sql
   -- Pega esto:
   ALTER TABLE pedidos 
   ADD COLUMN IF NOT EXISTS vendedor VARCHAR(255);
   
   UPDATE pedidos SET vendedor = 'Sin asignar' WHERE vendedor IS NULL;
   ```

5. **Click en ▶️ o Ctrl+Enter**

### ✅ Sabes que funcionó cuando:
- No hay mensajes de error
- La tabla `pedidos` tiene una nueva columna `vendedor`

---

## 🧪 PASO 2: PRUEBA EN EL CARRITO (1 minuto)

### Dónde buscar el cambio visual:

```
App → Catálogo de Productos
   → Agrega 2 productos
   → Click en 🛒 (carrito inferior)
   → Scroll hacia abajo en el carrito
```

### Qué debes ver:

```
┌──────────────────────────────────┐
│ Vendedor * ▼                     │  ← ¡NUEVO CAMPO!
│ ├─ Edwin Marin                   │
│ ├─ Fredy Marin                   │
│ └─ Fabian Marin                  │
│                                  │
│ Nombre Completo *                │
│ _______________                  │
│                                  │
│ Teléfono *                       │
│ _______________                  │
└──────────────────────────────────┘
```

### Acción:

```
1. Selecciona "Edwin Marin"
2. Llena Nombre y Teléfono
3. Click en "Enviar Pedido por WhatsApp"
4. ✅ Pedido creado CON VENDEDOR
```

---

## 📄 PASO 3: PRUEBA EN FACTURA (1 minuto)

### Dónde buscar:

```
App → Gestión de Pedidos
   → Busca el pedido que creaste
   → Click en "🧾 Cargar como Factura"
```

### Qué debes ver:

```
SE ABRE FACTURACIÓN Y VERÁS:

┌──────────────────────────────────┐
│ Vendedor: Edwin Marin ▼          │  ← ✅ PRE-LLENADO
│                                  │
│ Cliente: [Tu nombre]             │
│ Teléfono: [Tu teléfono]          │
│ Dirección: [Tu dirección]        │
└──────────────────────────────────┘
```

### ✅ ¡LISTO!

El vendedor se importó automáticamente desde el pedido.

---

## 🎯 LO QUE PASÓ

### Antes (SIN esta feature):
```
Carrito → Pedido (sin vendedor) → Factura (vendedor vacío) ❌
         Tenías que seleccionar vendedor manualmente
```

### Ahora (CON esta feature):
```
Carrito → Pedido (con Edwin Marin) → Factura (Edwin Marin pre-llenado) ✅
(seleccionas)  (guardado en BD)    (automático)
```

---

## 🗂️ ARCHIVOS IMPORTANTES

### Si necesitas más info, revisa:

| Documento | Para Qué |
|-----------|----------|
| `GUIA_RAPIDA_VENDEDOR_CARRITO.md` | Si algo no funciona |
| `GUIA_VISUAL_VENDEDOR.md` | Capturas más detalladas |
| `sql/AGREGAR_VENDEDOR_PEDIDOS.sql` | El SQL para ejecutar |

---

## ❓ FAQ RÁPIDO

**P: ¿Dónde está el campo vendedor en el carrito?**  
R: Scroll hacia abajo. Es el PRIMER campo después de "Completa tus datos"

**P: ¿Por qué dice "Campo obligatorio"?**  
R: Porque necesitamos saber quién vende cada pedido

**P: ¿Puedo cambiar el vendedor después?**  
R: Sí, cuando cargas la factura puedes cambiar el dropdown

**P: ¿Qué pasa con pedidos antiguos?**  
R: Se llenan automáticamente con "Sin asignar"

**P: ¿Quién puede agregar vendedores nuevos?**  
R: Edita `/src/components/CatalogoClientes.jsx` línea 17

---

## 🚨 SI NO VES EL CAMPO

### Checklist
```
☐ ¿Ejecutaste el SQL en Supabase?
☐ ¿Reiniciaste la app? (F5)
☐ ¿Limpiar caché? (Ctrl+Shift+Del)
☐ ¿El código está actualizado? (git pull)
```

### Si nada funciona
1. Ve a `/src/components/CatalogoClientes.jsx`
2. Busca: `const vendedores = `
3. Si no existe = No está actualizado el código

---

## 💡 BONUS: VER LOS DATOS EN BD

### Para ver los pedidos con vendedor:

```sql
-- En Supabase → SQL Editor:

SELECT 
  id,
  cliente_nombre,
  vendedor,
  total,
  fecha_creacion
FROM pedidos 
ORDER BY fecha_creacion DESC 
LIMIT 10;
```

### Deberías ver algo como:

```
id      cliente_nombre    vendedor        total       fecha_creacion
---     ----              ----            ---         ---
123     Juan García       Edwin Marin     150000      2024-01-20
124     María López       Fredy Marin     200000      2024-01-20
125     Carlos Ruiz       Fabian Marin    100000      2024-01-20
```

---

## ✨ SUMMARY

```
✅ SQL Ejecutado en Supabase
✅ Vendedor visible en carrito
✅ Vendedor se guarda en BD
✅ Vendedor se importa en factura
✅ FEATURE LISTA 🎉
```

---

**Tiempo total: ~5 minutos**  
**Complejidad: ⭐☆☆☆☆ Muy simple**  
**Éxito garantizado: 99.9%**

---

> 💭 **¿Necesitas ayuda?** Abre `GUIA_RAPIDA_VENDEDOR_CARRITO.md`
