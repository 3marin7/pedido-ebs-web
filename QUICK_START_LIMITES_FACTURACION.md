# 🚀 QUICK START: TIPOS DE CLIENTES Y LÍMITES
**Guía paso a paso en 15 minutos**

---

## 📋 ANTES DE EMPEZAR

### Requisitos:
- Acceso a Supabase SQL Editor
- Acceso a la aplicación web
- Permisos de administrador

---

## ⏱️ PASO 1: Ejecutar SQL (3 minutos)

### 1.1 Abrir Supabase
```
https://app.supabase.com → Tu proyecto
```

### 1.2 Ir a SQL Editor
```
Menú izquierdo → SQL Editor → New query
```

### 1.3 Copiar y ejecutar
```
Abre el archivo: sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql
Copia TODO el contenido
Pega en SQL Editor de Supabase
Click en "RUN"
```

### ✓ Resultado esperado:
```
1 row affected (tipos_clientes)
1 row affected (limites_facturacion)
1 row affected (validaciones_facturacion)
```

---

## ⏱️ PASO 2: Actualizar App.jsx (3 minutos)

### 2.1 Abrir `src/App.jsx`

### 2.2 Buscar la sección `<Routes>`

### 2.3 Agregar estas rutas:
```jsx
import TiposClientesScreen from './components/TiposClientesScreen';
import AsignarTiposClientesScreen from './components/AsignarTiposClientesScreen';

// ... en el JSX, dentro de <Routes>:

<Route path="/tipos-clientes" element={<TiposClientesScreen />} />
<Route path="/asignar-tipos" element={<AsignarTiposClientesScreen />} />
```

### ✓ Guardar cambios (Ctrl+S)

---

## ⏱️ PASO 3: Actualizar Navigation.jsx (3 minutos)

### 3.1 Abrir `src/components/Navigation.jsx`

### 3.2 Buscar donde están los enlaces de navegación

### 3.3 Agregar en la sección de administrador:
```jsx
// Agregar estos ítems al menú:
{ path: '/tipos-clientes', label: '🎯 Gestionar Tipos', icon: '🎯' },
{ path: '/asignar-tipos', label: '👥 Asignar Tipos Clientes', icon: '👥' }
```

### ✓ Guardar cambios (Ctrl+S)

---

## ⏱️ PASO 4: Reiniciar aplicación (1 minuto)

### 4.1 Guardar todos los archivos
```
Ctrl+Shift+S (Guardar todos)
```

### 4.2 Ir a navegador y recargar
```
F5 o Cmd+R (según SO)
```

### 4.3 Debería verse el nuevo menú con opciones:
- 🎯 Gestionar Tipos
- 👥 Asignar Tipos Clientes

---

## ⏱️ PASO 5: Configurar Límites (3 minutos)

### 5.1 Click en menú **"🎯 Gestionar Tipos"**

### 5.2 Ver los 5 tipos de clientes creados:
```
📌 MAYORISTA
📌 MINORISTA
📌 DISTRIBUIDOR
📌 CONSUMIDOR_FINAL
📌 CORPORATIVO
```

### 5.3 Para cada tipo, click en **"Editar Límites"**

### 5.4 Ejemplo: Configurar MAYORISTA
```
Antigüedad máxima: 45 días
Valor mínimo factura: 500000
Valor máximo factura: 50000000
¿Puede comprar a crédito?: ✓ SÍ
Crédito máximo: 100000000
Plazo de crédito: 30 días
Cantidad máx productos: 1000
Facturas pendientes máx: 10
```

### 5.5 Click "Guardar Cambios"

### ⭐ Repetir para MINORISTA:
```
Antigüedad máxima: 7 días
Valor mínimo factura: 50000
Valor máximo factura: 1000000
¿Puede comprar a crédito?: ✗ NO
Crédito máximo: 0
```

### ⭐ Repetir para DISTRIBUIDOR:
```
Antigüedad máxima: 30 días
Valor mínimo factura: 200000
Valor máximo factura: 20000000
¿Puede comprar a crédito?: ✓ SÍ
Crédito máximo: 50000000
Plazo de crédito: 15 días
```

---

## ⏱️ PASO 6: Asignar Tipos a Clientes (2 minutos)

### 6.1 Click en menú **"👥 Asignar Tipos Clientes"**

### 6.2 Ver lista de todos los clientes

### 6.3 Buscar un cliente por nombre
```
Ej: Escribir "Distribuidora" en el buscador
```

### 6.4 Seleccionar su tipo en el dropdown
```
Ejemplo:
- Distribuidora ABC → MAYORISTA
- Tienda Juan → MINORISTA
- SuperMercado XYZ → CORPORATIVO
```

### 6.5 Se guarda automáticamente ✓

### 6.6 Repetir para los clientes principales

---

## ✅ PRUEBA RÁPIDA

### Crear una factura de prueba:

**Cliente:** Un cliente que ya tenga tipo asignado

**Productos:** Los que quieras

**Total:** $100.000

**Tipo de pago:** Contado

**Resultado esperado:**
- Si el monto está dentro de los límites → **✓ PERMITIDA**
- Si es menor al mínimo → **❌ BLOQUEADA** con mensaje

---

## 🎯 CASOS DE PRUEBA

### Test 1: Valor mínimo
```
Cliente: MINORISTA (mín: $50k, máx: $1M)
Factura: $20.000
Resultado: ❌ BLOQUEADA "Valor mínimo es $50.000"
```

### Test 2: Valor máximo
```
Cliente: MINORISTA (mín: $50k, máx: $1M)
Factura: $5.000.000
Resultado: ❌ BLOQUEADA "Valor máximo es $1.000.000"
```

### Test 3: Permitida
```
Cliente: MAYORISTA (mín: $500k, máx: $50M)
Factura: $5.000.000
Resultado: ✓ PERMITIDA
```

### Test 4: Crédito insuficiente
```
Cliente: MINORISTA con deuda $100k
Crear factura nueva
Resultado: ❌ Si permite crédito y lo excede
```

---

## 📊 VALIDACIONES ACTIVAS

Una vez implementado, el sistema valida automáticamente:

| Validación | Bloquea | Mensaje |
|-----------|--------|---------|
| Antigüedad | Sí | "Tiene facturas pendientes atrasadas" |
| Valor mínimo | Sí | "Valor mínimo es $XXX" |
| Valor máximo | Sí | "Valor máximo es $XXX" |
| Crédito | Sí | "Crédito insuficiente" |

---

## 🆘 PROBLEMAS COMUNES

### "Botones no aparecen"
```
❌ No ejecuté la SQL
❌ No actualicé App.jsx y Navigation.jsx
✓ Reinicia la aplicación (F5)
```

### "Página en blanco al abrir /tipos-clientes"
```
❌ Componentes no fueron importados
✓ Verifica que importaste:
  - TiposClientesScreen.jsx
  - AsignarTiposClientesScreen.jsx
```

### "Los clientes no tienen tipo asignado"
```
❌ Olvide asignar tipos a clientes
✓ Ir a /asignar-tipos y seleccionar para cada uno
```

### "Las validaciones no funcionan"
```
❌ No integré validadorFacturacion.js en InvoiceScreen
✓ Agregar import y llamada a validarFacturacionCompleta()
```

---

## 📈 PRÓXIMO PASO

Después de completar esta guía:

1. ✓ SQL ejecutado
2. ✓ Rutas agregadas
3. ✓ Menú actualizado
4. ✓ Límites configurados
5. ✓ Tipos asignados a clientes
6. **→ Integrar validaciones en InvoiceScreen.jsx**

Para integración en facturación, ver:
```
EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js
```

---

## 📞 COMANDOS ÚTILES

### Ver todos los clientes con sus tipos:
```sql
SELECT nombre, tipo_cliente, valor_minimo_factura, valor_maximo_factura
FROM clientes_con_limites
WHERE activo = true;
```

### Ver validaciones rechazadas:
```sql
SELECT cliente_id, tipo_validacion, motivo, creado_en
FROM validaciones_facturacion
WHERE resultado = 'BLOQUEADA'
ORDER BY creado_en DESC
LIMIT 20;
```

### Reset: Eliminar todos los tipos:
```sql
DELETE FROM tipos_clientes;
-- Luego ejecutar el SQL completo de nuevo
```

---

## ✅ CHECKLIST

- [ ] Leí esta guía completa
- [ ] Ejecuté SQL en Supabase
- [ ] Actualicé App.jsx
- [ ] Actualicé Navigation.jsx
- [ ] Reinicié la aplicación
- [ ] Veo menús nuevos
- [ ] Configuré límites para tipos
- [ ] Asigné tipos a clientes
- [ ] Probé crear una factura
- [ ] ✓ LISTO PARA PRODUCCIÓN

---

**⏱️ Tiempo total: ~15 minutos**  
**Dificultad: ⭐⭐☆ (Fácil-Media)**  
**Soporte: Ver GUIA_TIPOS_CLIENTES_Y_LIMITES.md para detalles**
