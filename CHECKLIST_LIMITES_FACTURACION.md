# ✅ CHECKLIST IMPLEMENTACIÓN: LÍMITES DE FACTURACIÓN POR TIPO DE CLIENTE

**Proyecto:** pedido-ebs-web  
**Objetivo:** Colocar topes/límites a usuarios para no poder facturarles según antigüedad de facturas y valor  
**Estado:** 🟢 **LISTA PARA IMPLEMENTAR**

---

## 📦 ARCHIVOS ENTREGADOS

### ✅ Base de Datos (1 archivo)
- [x] `sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql`
  - Crea 5 tipos de clientes predeterminados
  - Crea tabla de límites por tipo
  - Crea tabla de auditoría
  - Agrega columna tipo_cliente_id a clientes

### ✅ Librerías (1 archivo)
- [x] `src/lib/validadorFacturacion.js`
  - 8 funciones de validación
  - Validación de antigüedad
  - Validación de rango de valores
  - Validación de crédito disponible
  - Registro en auditoría

### ✅ Componentes React (4 archivos)
- [x] `src/components/TiposClientesScreen.jsx`
  - Ver tipos de clientes
  - Editar límites por tipo
- [x] `src/components/TiposClientesScreen.css`
- [x] `src/components/AsignarTiposClientesScreen.jsx`
  - Buscar clientes
  - Asignar tipo a cada cliente
- [x] `src/components/AsignarTiposClientesScreen.css`

### ✅ Documentación (4 archivos)
- [x] `GUIA_TIPOS_CLIENTES_Y_LIMITES.md` - Documentación completa
- [x] `EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js` - Código ejemplo
- [x] `RESUMEN_IMPLEMENTACION_LIMITES_FACTURACION.md` - Resumen ejecutivo
- [x] `QUICK_START_LIMITES_FACTURACION.md` - Guía 15 minutos

---

## 🚀 IMPLEMENTACIÓN PASO A PASO

### PASO 1️⃣ : EJECUTAR SQL (5 minutos)
```
[  ] 1. Abrir Supabase (https://app.supabase.com)
[  ] 2. Ir a SQL Editor → New query
[  ] 3. Copiar archivo: sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql
[  ] 4. Pegar en Supabase
[  ] 5. Click RUN
[  ] ✓ Verificar que se crearon las tablas
```

**Tablas creadas:**
- ✓ tipos_clientes (5 tipos)
- ✓ limites_facturacion
- ✓ validaciones_facturacion
- ✓ Vista clientes_con_limites

---

### PASO 2️⃣ : ACTUALIZAR App.jsx (5 minutos)

```
[  ] 1. Abrir src/App.jsx
[  ] 2. Agregar importaciones:
        import TiposClientesScreen from './components/TiposClientesScreen';
        import AsignarTiposClientesScreen from './components/AsignarTiposClientesScreen';

[  ] 3. Agregar rutas en <Routes>:
        <Route path="/tipos-clientes" element={<TiposClientesScreen />} />
        <Route path="/asignar-tipos" element={<AsignarTiposClientesScreen />} />

[  ] 4. Guardar (Ctrl+S)
```

---

### PASO 3️⃣ : ACTUALIZAR Navigation.jsx (5 minutos)

```
[  ] 1. Abrir src/components/Navigation.jsx
[  ] 2. Buscar menú de administrador
[  ] 3. Agregar dos items nuevos:
        { path: '/tipos-clientes', label: '🎯 Gestionar Tipos', icon: '🎯' },
        { path: '/asignar-tipos', label: '👥 Asignar Tipos Clientes', icon: '👥' }

[  ] 4. Guardar (Ctrl+S)
```

---

### PASO 4️⃣ : PROBAR EN NAVEGADOR (3 minutos)

```
[  ] 1. Recargar aplicación (F5)
[  ] 2. Debería ver menús nuevos:
        - 🎯 Gestionar Tipos
        - 👥 Asignar Tipos Clientes
[  ] 3. Click en "Gestionar Tipos"
[  ] ✓ Ver 5 tipos de clientes (MAYORISTA, MINORISTA, etc)
```

---

### PASO 5️⃣ : CONFIGURAR LÍMITES (10 minutos)

```
[  ] 1. Ir a menú "🎯 Gestionar Tipos"
[  ] 2. Para cada tipo, click "Editar Límites"
[  ] 3. Configurar valores:
```

**MAYORISTA** (Clientes grandes)
```
[  ] Antigüedad máxima: 45 días
[  ] Valor mínimo: 500000
[  ] Valor máximo: 50000000
[  ] Puede comprar crédito: ✓ SÍ
[  ] Crédito máximo: 100000000
[  ] Plazo crédito: 30 días
[  ] Click "Guardar Cambios"
```

**MINORISTA** (Tiendas pequeñas)
```
[  ] Antigüedad máxima: 7 días
[  ] Valor mínimo: 50000
[  ] Valor máximo: 1000000
[  ] Puede comprar crédito: ✗ NO
[  ] Crédito máximo: 0
[  ] Click "Guardar Cambios"
```

**DISTRIBUIDOR** (Mayoristas intermedios)
```
[  ] Antigüedad máxima: 30 días
[  ] Valor mínimo: 200000
[  ] Valor máximo: 20000000
[  ] Puede comprar crédito: ✓ SÍ
[  ] Crédito máximo: 50000000
[  ] Plazo crédito: 15 días
[  ] Click "Guardar Cambios"
```

**CONSUMIDOR_FINAL** (Clientes finales)
```
[  ] Antigüedad máxima: 3 días
[  ] Valor mínimo: 0
[  ] Valor máximo: 500000
[  ] Puede comprar crédito: ✗ NO
[  ] Click "Guardar Cambios"
```

**CORPORATIVO** (Empresas grandes)
```
[  ] Antigüedad máxima: 60 días
[  ] Valor mínimo: 1000000
[  ] Valor máximo: 100000000
[  ] Puede comprar crédito: ✓ SÍ
[  ] Crédito máximo: 200000000
[  ] Plazo crédito: 45 días
[  ] Click "Guardar Cambios"
```

---

### PASO 6️⃣ : ASIGNAR TIPOS A CLIENTES (10 minutos)

```
[  ] 1. Ir a menú "👥 Asignar Tipos Clientes"
[  ] 2. Ver tabla de todos los clientes
[  ] 3. Para cada cliente importante:
        - Buscar en buscador
        - Seleccionar tipo en dropdown
        - Se guarda automáticamente
[  ] 4. Prioridad: MAYORISTAS primero
[  ] 5. Asignar a todos los clientes activos
```

**Recomendación de asignación:**
```
Distribuidora/Mayorista → MAYORISTA
Tienda/Minorista → MINORISTA
Distribuidor → DISTRIBUIDOR
Empresa grande → CORPORATIVO
Cliente final → CONSUMIDOR_FINAL
```

---

### PASO 7️⃣ : INTEGRAR EN FACTURACIÓN (20 minutos)

**ARCHIVO:** `src/components/InvoiceScreen.jsx`

```
[  ] 1. Abrir InvoiceScreen.jsx
[  ] 2. Agregar importación al inicio:
        import { validarFacturacionCompleta } from '../lib/validadorFacturacion';

[  ] 3. En función guardarFactura(), ANTES de guardar:

        // Validar límites de facturación
        const validacion = await validarFacturacionCompleta(
          clienteId,
          totalFactura,
          tipoPago
        );

        if (!validacion.permitida) {
          const motivos = validacion.validaciones
            .filter(v => v.resultado === 'BLOQUEADA')
            .map(v => v.motivo)
            .join('\n');
          alert('❌ NO SE PUEDE FACTURAR\n\n' + motivos);
          return;
        }

[  ] 4. Luego continuar con código de guardado existente
[  ] 5. Guardar (Ctrl+S)
[  ] 6. Recargar navegador (F5)
```

**Ver archivo completo:**
```
EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js
```

---

### PASO 8️⃣ : PRUEBAS (10 minutos)

```
Test 1: Factura dentro de límites
[  ] Cliente: MINORISTA
[  ] Monto: $500.000
[  ] Resultado esperado: ✓ PERMITIDA

Test 2: Factura menor al mínimo
[  ] Cliente: MINORISTA (mín: $50k)
[  ] Monto: $20.000
[  ] Resultado esperado: ❌ BLOQUEADA
[  ] Mensaje: "Valor mínimo es $50.000"

Test 3: Factura mayor al máximo
[  ] Cliente: MINORISTA (máx: $1M)
[  ] Monto: $5.000.000
[  ] Resultado esperado: ❌ BLOQUEADA
[  ] Mensaje: "Valor máximo es $1.000.000"

Test 4: Crédito insuficiente
[  ] Cliente: Con deuda y crédito limitado
[  ] Monto: Mayor al disponible
[  ] Resultado esperado: ❌ BLOQUEADA
[  ] Mensaje: "Crédito insuficiente"
```

---

## 🎯 VALIDACIONES ACTIVAS

Una vez implementado, el sistema bloquea automáticamente si:

| Validación | Bloquea | Caso |
|-----------|--------|------|
| 📅 **ANTIGÜEDAD** | SÍ | Cliente tiene factura pendiente >X días sin pagar |
| 💰 **VALOR MÍNIMO** | SÍ | Factura < valor mínimo permitido |
| 💰 **VALOR MÁXIMO** | SÍ | Factura > valor máximo permitido |
| 💳 **CRÉDITO** | SÍ | No tiene crédito disponible (a crédito) |
| 🚫 **SIN CRÉDITO** | SÍ | Tipo de cliente NO permite comprar a crédito |

---

## 📊 EJEMPLO REAL

### Escenario 1: Distribuidora (MAYORISTA)
```
Cliente: Distribuidora ABC
Tipo: MAYORISTA
Límites:
  - Antigüedad máx: 45 días
  - Valor mín: $500k
  - Valor máx: $50M
  - Crédito máx: $100M
  - Permite crédito: SÍ

Factura: $2.500.000 a crédito
RESULTADO: ✓ PERMITIDA ✓
```

### Escenario 2: Tienda (MINORISTA)
```
Cliente: Tienda Juan
Tipo: MINORISTA
Límites:
  - Antigüedad máx: 7 días
  - Valor mín: $50k
  - Valor máx: $1M
  - Permite crédito: NO

Factura 1: $300.000 contado
RESULTADO: ✓ PERMITIDA

Factura 2: $2.000.000 contado
RESULTADO: ❌ BLOQUEADA (excede máximo)

Factura 3: $300.000 a crédito
RESULTADO: ❌ BLOQUEADA (no permite crédito)
```

### Escenario 3: Deuda atrasada
```
Cliente: Empresa XYZ
Tiene factura pendiente desde hace 50 días
Límite de antigüedad: 30 días

Nueva factura: $1.500.000
RESULTADO: ❌ BLOQUEADA
Motivo: "Tiene 1 factura pendiente con más de 30 días"
```

---

## 📁 ARCHIVOS DE REFERENCIA

| Archivo | Para |
|---------|------|
| `GUIA_TIPOS_CLIENTES_Y_LIMITES.md` | Documentación técnica completa |
| `QUICK_START_LIMITES_FACTURACION.md` | Guía paso a paso 15 minutos |
| `EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js` | Código de ejemplo integración |
| `RESUMEN_IMPLEMENTACION_LIMITES_FACTURACION.md` | Resumen ejecutivo |
| `sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql` | Script SQL |
| `src/lib/validadorFacturacion.js` | Funciones de validación |

---

## 🆘 TROUBLESHOOTING

### Problema: Menús no aparecen
```
Solución:
1. Verifica que importaste componentes en App.jsx
2. Verifica que agregaste rutas en App.jsx
3. Verifica que actualizaste Navigation.jsx
4. Recarga navegador (F5)
```

### Problema: Las validaciones no funcionan
```
Solución:
1. Verifica que ejecutaste SQL en Supabase
2. Verifica que importaste validadorFacturacion.js
3. Verifica que llamaste validarFacturacionCompleta() en guardarFactura()
4. Ver: EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js
```

### Problema: Cliente no tiene tipo asignado
```
Solución:
1. Ir a /asignar-tipos
2. Buscar cliente
3. Seleccionar tipo en dropdown
4. Se guarda automáticamente
```

### Problema: Quiero cambiar límites de un cliente específico
```
Solución:
Los límites se configuran por TIPO, no por cliente individual.
Para clientes especiales:
1. Crear nuevo tipo (ej: "CLIENTE_VIP")
2. Configurar sus límites
3. Asignar cliente a ese tipo
```

---

## ✅ CHECKLIST FINAL

```
ANTES DE USAR EN PRODUCCIÓN:

[  ] SQL ejecutado en Supabase
[  ] App.jsx actualizado con rutas
[  ] Navigation.jsx actualizado con menús
[  ] Aplicación recargada (F5)
[  ] Menús aparecen en navegación
[  ] Límites configurados para 5 tipos
[  ] Tipos asignados a todos los clientes activos
[  ] validadorFacturacion.js importado en InvoiceScreen
[  ] Validaciones integradas en guardarFactura()
[  ] Pruebas realizadas:
    [  ] Factura dentro de límites (PERMITIDA)
    [  ] Factura bajo mínimo (BLOQUEADA)
    [  ] Factura sobre máximo (BLOQUEADA)
    [  ] Sin crédito disponible (BLOQUEADA)
[  ] Usuario capacitado sobre nuevas reglas
[  ] ✓ LISTO PARA PRODUCCIÓN
```

---

## 📞 AYUDA

**Para dudas:**
1. Revisar `GUIA_TIPOS_CLIENTES_Y_LIMITES.md`
2. Ver `EJEMPLO_INTEGRACION_LIMITES_FACTURACION.js`
3. Consultar `QUICK_START_LIMITES_FACTURACION.md`

**Para errores:**
1. Verificar SQL en Supabase
2. Verificar importaciones en React
3. Verificar que los componentes se cargan

---

**Implementado:** 26 de junio de 2026  
**Estado:** ✅ COMPLETO Y LISTO  
**Próxima acción:** Ejecutar SQL en Supabase
