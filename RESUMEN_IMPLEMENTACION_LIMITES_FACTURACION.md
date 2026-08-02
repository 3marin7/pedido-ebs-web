_# 🎯 IMPLEMENTACIÓN: TIPOS DE CLIENTES Y LÍMITES DE FACTURACIÓN
**Estado:** ✅ **LISTA PARA IMPLEMENTAR**

---

## 📌 RESUMEN EJECUTIVO

Se ha implementado un **sistema completo de control de facturación** que permite:

✅ **Validar antigüedad** - Bloquea si hay facturas pendientes atrasadas  
✅ **Validar montos** - Rango mínimo/máximo por factura  
✅ **Validar crédito** - Límite máximo acumulado por cliente  
✅ **Asignar tipos** - MAYORISTA, MINORISTA, DISTRIBUIDOR, CORPORATIVO  
✅ **Auditar** - Registro completo de todas las validaciones  

---

## 📦 ARCHIVOS CREADOS

### 1️⃣ **Base de Datos SQL**
```
sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql
```
- Crea tablas: tipos_clientes, limites_facturacion, validaciones_facturacion
- Agrega columna tipo_cliente_id a tabla clientes
- Crea vista clientes_con_limites
- **Acción:** Ejecutar en Supabase SQL Editor

### 2️⃣ **Librería de Validación**
```
src/lib/validadorFacturacion.js
```
Funciones principales:
- `validarFacturacionCompleta()` ⭐ PRINCIPAL
- `validarAntiguedadFacturas()`
- `validarValorFactura()`
- `validarCreditoDisponible()`
- `registrarValidacionFacturacion()`
- `obtenerLimitesCliente()`
- `reporteClientesConLimites()`
- `actualizarTipoCliente()`

### 3️⃣ **Componentes React**

#### A) Gestionar Tipos de Clientes
```
src/components/TiposClientesScreen.jsx
src/components/TiposClientesScreen.css
```
- Ver tipos de clientes
- Editar límites (antigüedad, valor, crédito)
- Configurar permisos y reglas

#### B) Asignar Tipos a Clientes
```
src/components/AsignarTiposClientesScreen.jsx
src/components/AsignarTiposClientesScreen.css
```
- Buscar clientes
- Selector de tipo por cliente
- Vista de estado

### 4️⃣ **Documentación**
```
GUIA_TIPOS_CLIENTES_Y_LIMITES.md
EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js
RESUMEN_IMPLEMENTACION_LIMITES_FACTURACION.md (este archivo)
```

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### **PASO 1: Base de Datos (5 minutos)**
```sql
-- En Supabase SQL Editor, copiar y ejecutar:
sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql
```

**Verificar que se crearon:**
- ✓ Tabla tipos_clientes (5 tipos predeterminados)
- ✓ Tabla limites_facturacion (vacía inicialmente)
- ✓ Tabla validaciones_facturacion
- ✓ Columna tipo_cliente_id en tabla clientes

---

### **PASO 2: Agregar Rutas (5 minutos)**
En `src/App.jsx`, agregar:

```jsx
import TiposClientesScreen from './components/TiposClientesScreen';
import AsignarTiposClientesScreen from './components/AsignarTiposClientesScreen';

// En la sección <Routes>:
<Route path="/tipos-clientes" element={<TiposClientesScreen />} />
<Route path="/asignar-tipos" element={<AsignarTiposClientesScreen />} />
```

---

### **PASO 3: Agregar Menú (5 minutos)**
En `src/components/Navigation.jsx`, agregar en el menú de administrador:

```jsx
// En la sección de navegación para admin:
{
  path: '/tipos-clientes',
  label: 'Gestionar Tipos',
  icon: '🎯'
},
{
  path: '/asignar-tipos',
  label: 'Asignar Tipos a Clientes',
  icon: '👥'
}
```

---

### **PASO 4: Configurar Límites (10 minutos)**
1. Abrir: `/tipos-clientes` en la aplicación
2. Ver los 5 tipos predeterminados:
   - MAYORISTA
   - MINORISTA
   - DISTRIBUIDOR
   - CONSUMIDOR_FINAL
   - CORPORATIVO
3. Para cada tipo, hacer clic en **"Editar Límites"**
4. Configurar según tu negocio

**Recomendaciones:**
```javascript
MAYORISTA: {
  dias_antiguedad_maximo: 45,
  valor_minimo: $500k,
  valor_maximo: $50M,
  credito_maximo: $100M,
  permite_credito: ✓
}

MINORISTA: {
  dias_antiguedad_maximo: 7,
  valor_minimo: $50k,
  valor_maximo: $1M,
  credito_maximo: $0,
  permite_credito: ✗
}

DISTRIBUIDOR: {
  dias_antiguedad_maximo: 30,
  valor_minimo: $200k,
  valor_maximo: $20M,
  credito_maximo: $50M,
  permite_credito: ✓
}
```

---

### **PASO 5: Asignar Tipos a Clientes (15-30 minutos)**
1. Abrir: `/asignar-tipos` en la aplicación
2. Ver lista de todos los clientes
3. Para cada cliente, seleccionar su tipo:
   - Usar **MAYORISTA** para clientes grandes
   - Usar **MINORISTA** para tiendas pequeñas
   - Usar **DISTRIBUIDOR** para mayoristas intermedios
4. Sistema guarda automáticamente

**Búsqueda rápida:** Filtrar por nombre o identificación

---

### **PASO 6: Integrar Validaciones en Facturación (20 minutos)**

En `src/components/InvoiceScreen.jsx`, modificar función `guardarFactura()`:

```javascript
// 1. Importar librería al inicio:
import { validarFacturacionCompleta } from '../lib/validadorFacturacion';

// 2. Antes de guardar, agregar validación:
const validacion = await validarFacturacionCompleta(
  clienteId,
  totalFactura,
  tipoPago
);

if (!validacion.permitida) {
  // Mostrar motivos de bloqueo
  const motivos = validacion.validaciones
    .filter(v => v.resultado === 'BLOQUEADA')
    .map(v => `• ${v.motivo}`)
    .join('\n');
  alert('❌ No se puede facturar:\n\n' + motivos);
  return;
}

// 3. Si pasa validación, proceder a guardar
// ... código de guardado existente
```

**Ver:** `EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js` para código completo

---

### **PASO 7: Probar Sistema (10 minutos)**
1. Crear una factura test
2. Verificar que se validen límites:
   - ✓ No facturar a cliente con deudas atrasadas
   - ✓ No facturar monto menor al mínimo
   - ✓ No facturar monto mayor al máximo
   - ✓ Bloquear si no hay crédito disponible

---

## ⚙️ CONFIGURACIÓN POR DEFECTO

**Tipos creados automáticamente:**

| Tipo | Descripción | Uso Recomendado |
|------|-------------|-----------------|
| MAYORISTA | Compras en volumen | Distribuidores, tiendas |
| MINORISTA | Compras pequeñas | Tiendas de barrio |
| DISTRIBUIDOR | Distribuidor autorizado | Revendedores |
| CONSUMIDOR_FINAL | Compra directa | Clientes finales |
| CORPORATIVO | Empresa | Empresas grandes |

**Límites iniciales: TODOS EN CERO**
- Debes configurar manualmente en `/tipos-clientes`

---

## 📊 VALIDACIONES IMPLEMENTADAS

### 1. **ANTIGÜEDAD** 📅
Bloquea si hay facturas pendientes más antiguas que el límite configurado.

```
Cliente tiene 1 factura pendiente desde hace 45 días
Límite de cliente: 30 días
❌ RESULTADO: BLOQUEADA
```

### 2. **VALOR MÍNIMO** 💰
Bloquea si la factura es menor al mínimo.

```
Factura: $100.000
Mínimo para este cliente: $500.000
❌ RESULTADO: BLOQUEADA
```

### 3. **VALOR MÁXIMO** 💰
Bloquea si la factura excede el máximo.

```
Factura: $50.000.000
Máximo para este cliente: $10.000.000
❌ RESULTADO: BLOQUEADA
```

### 4. **CRÉDITO DISPONIBLE** 💳
Bloquea si no hay crédito suficiente.

```
Crédito máximo: $50.000.000
Deuda actual: $45.000.000
Crédito disponible: $5.000.000
Nueva factura: $10.000.000
❌ RESULTADO: BLOQUEADA
```

---

## 📋 CHECKLIST FINAL

- [ ] Script SQL ejecutado en Supabase
- [ ] Rutas agregadas en App.jsx
- [ ] Menú actualizado en Navigation.jsx
- [ ] Límites configurados para cada tipo
- [ ] Tipos asignados a clientes existentes
- [ ] Validaciones integradas en InvoiceScreen.jsx
- [ ] Probado flujo completo de facturación
- [ ] Usuarios capacitados sobre nuevas reglas
- [ ] Documentación compartida con equipo

---

## 🔍 AUDITORÍA Y REPORTES

Todas las validaciones rechazadas se registran en:
```sql
SELECT * FROM validaciones_facturacion 
WHERE resultado = 'BLOQUEADA' 
ORDER BY creado_en DESC;
```

**Información guardada:**
- Cliente (id)
- Tipo de validación (antigüedad, valor, crédito)
- Resultado (PERMITIDA, BLOQUEADA)
- Motivo específico
- Detalles JSON
- Fecha y hora

---

## ⚠️ CASOS ESPECIALES

### Cliente sin tipo asignado
- Sistema busca límites por defecto
- Si no hay límites, **PERMITE LA FACTURACIÓN**
- Recomendación: Asignar tipo a todos los clientes

### Cliente nuevo
1. Crear cliente en interfaz normal
2. Ir a `/asignar-tipos`
3. Buscar y asignar tipo
4. Ya aplica límites

### Cambiar límites sobre la marcha
- Ir a `/tipos-clientes`
- Editar límites del tipo
- Cambios aplican inmediatamente a próximas facturas

---

## 💡 EJEMPLOS DE USO

### Ejemplo 1: Mayorista con crédito
```javascript
// Cliente: Distribuidora ABC
Tipo: MAYORISTA
Límites:
  - Antigüedad máxima: 45 días
  - Valor mínimo: $500k
  - Valor máximo: $30M
  - Puede comprar a crédito: SÍ
  - Crédito máximo: $100M

Factura: $2.5M a crédito ✓ PERMITIDA
```

### Ejemplo 2: Minorista sin crédito
```javascript
// Cliente: Tienda Juan
Tipo: MINORISTA
Límites:
  - Antigüedad máxima: 7 días
  - Valor mínimo: $50k
  - Valor máximo: $1M
  - Puede comprar a crédito: NO

Factura: $300k a contado ✓ PERMITIDA
Factura: $2M a contado ❌ BLOQUEADA (excede máximo)
Factura: $500k a crédito ❌ BLOQUEADA (no permite crédito)
```

### Ejemplo 3: Cliente con deudas atrasadas
```javascript
// Cliente: Empresa XYZ
Tiene factura pendiente desde hace 40 días
Límite de antigüedad: 30 días

Nueva factura: $1.5M ❌ BLOQUEADA
Motivo: "Tiene 1 factura pendiente con más de 30 días sin cobrar"
```

---

## 🆘 TROUBLESHOOTING

### P: ¿Qué pasa si un cliente no tiene tipo asignado?
**R:** El sistema permite facturación sin aplicar límites. Recomendación: asignar tipo a todos.

### P: ¿Se puede facturar si hay deuda atrasada?
**R:** NO, si hay facturas pendientes más antiguas que el límite, se bloquea.

### P: ¿Cómo hago que un cliente pueda comprar a crédito?
**R:** 
1. Ir a `/tipos-clientes`
2. Editar tipo del cliente
3. Activar "Puede comprar a crédito"
4. Configurar "Crédito máximo permitido"

### P: ¿Cómo cambio los límites para un cliente específico?
**R:** No se puede por cliente individual. Se configura por TIPO. Si necesitas excepciones:
- Crear nuevo tipo específico (ej: "CLIENTE_ESPECIAL")
- Mover cliente a ese tipo
- Configurar límites especiales

### P: ¿Dónde veo el historial de validaciones rechazadas?
**R:** En tabla `validaciones_facturacion` de Supabase. Puedes crear un reporte.

---

## 📞 SOPORTE Y PREGUNTAS

Referencia rápida:
- Documentación: `GUIA_TIPOS_CLIENTES_Y_LIMITES.md`
- Ejemplo código: `EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js`
- SQL: `sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql`

---

## ✅ PRÓXIMAS MEJORAS (FUTURO)

- [ ] Dashboard con reportes de validaciones
- [ ] Excepciones por cliente
- [ ] Límites horarios/diarios
- [ ] Descuentos según volumen
- [ ] Integración con sistema de cobranza
- [ ] Alertas automáticas para vendedores

---

**Fecha:** 26 de junio de 2026  
**Estado:** ✅ Listo para producción  
**Último actualizado:** 2026-06-26
