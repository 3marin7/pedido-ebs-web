# 📋 SISTEMA DE TIPOS DE CLIENTES Y LÍMITES DE FACTURACIÓN

## 🎯 Descripción General

Sistema completo de control de facturación por tipo de cliente que permite:
- ✅ Validar **antigüedad de facturas previas** (no facturar si hay deudas atrasadas)
- ✅ Validar **límites de valor** (mínimo y máximo por factura)
- ✅ Validar **límites de crédito** (máximo acumulado a crédito)
- ✅ Asignar **tipos de clientes** (MAYORISTA, MINORISTA, DISTRIBUIDOR, CORPORATIVO)
- ✅ **Auditar** todas las validaciones realizadas

---

## 📊 ESTRUCTURA DE BASE DE DATOS

### 1. **tipos_clientes**
Define las categorías de clientes:
```sql
id | nombre | descripcion | activo
1  | MAYORISTA | Cliente mayorista | true
2  | MINORISTA | Cliente minorista | true
3  | DISTRIBUIDOR | Distribuidor autorizado | true
```

### 2. **limites_facturacion**
Define límites específicos por tipo de cliente:
```sql
tipo_cliente_id | valor_minimo_factura | valor_maximo_factura | dias_antiguedad_maximo | puede_comprar_credito | valor_maximo_credito
1               | 500000              | 10000000            | 30                    | true                | 50000000
2               | 50000               | 1000000             | 15                    | false               | 0
```

### 3. **clientes** (ACTUALIZADO)
Se agregó columna `tipo_cliente_id`:
```sql
ALTER TABLE clientes ADD COLUMN tipo_cliente_id BIGINT REFERENCES tipos_clientes(id);
```

### 4. **validaciones_facturacion**
Auditoría de todas las validaciones:
```sql
id | cliente_id | factura_numero | tipo_validacion | resultado | motivo | detalles
```

---

## 🚀 SETUP INICIAL

### Paso 1: Ejecutar Script SQL
En **Supabase SQL Editor**, copiar y ejecutar:
```bash
Archivo: sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql
```

Esto crea:
- Tabla `tipos_clientes` con 5 tipos predeterminados
- Tabla `limites_facturacion` con límites por tipo
- Vista `clientes_con_limites` para consultas fáciles
- Tabla `validaciones_facturacion` para auditoría

### Paso 2: Asignar Tipos a Clientes Existentes
Usar componente: `AsignarTiposClientesScreen.jsx`
- Abre interfaz para seleccionar tipo de cada cliente
- Guardará automáticamente en la BD

---

## 💻 COMPONENTES REACT CREADOS

### 1. **TiposClientesScreen.jsx** 
Gestionar tipos de clientes y editar límites
- Ver todos los tipos de clientes
- Editar límites por tipo
- Configurar reglas de antigüedad, valor, crédito

**Ubicación:** `src/components/TiposClientesScreen.jsx`

**Cómo agregar al menú:**
```jsx
// En Navigation.jsx
{ path: '/tipos-clientes', label: 'Gestionar Tipos de Clientes', icon: '🎯' }

// En App.jsx
import TiposClientesScreen from './components/TiposClientesScreen';
<Route path="/tipos-clientes" element={<TiposClientesScreen />} />
```

### 2. **AsignarTiposClientesScreen.jsx**
Asignar tipos a clientes existentes
- Buscar y filtrar clientes
- Seleccionar tipo para cada cliente
- Ver estado de asignación

**Ubicación:** `src/components/AsignarTiposClientesScreen.jsx`

**Cómo agregar al menú:**
```jsx
// En Navigation.jsx
{ path: '/asignar-tipos', label: 'Asignar Tipos Clientes', icon: '👥' }

// En App.jsx
import AsignarTiposClientesScreen from './components/AsignarTiposClientesScreen';
<Route path="/asignar-tipos" element={<AsignarTiposClientesScreen />} />
```

---

## ✅ FUNCIONES DE VALIDACIÓN

**Ubicación:** `src/lib/validadorFacturacion.js`

### Función Principal: `validarFacturacionCompleta()`
Ejecuta TODAS las validaciones y retorna si está permitida la facturación.

```javascript
import { validarFacturacionCompleta } from '../lib/validadorFacturacion';

// Uso en componente de facturación:
const clienteId = 123;
const totalFactura = 1500000;
const tipoPago = 'credito'; // o 'contado'

const resultado = await validarFacturacionCompleta(
  clienteId,
  totalFactura,
  tipoPago
);

// resultado = {
//   permitida: true/false,
//   validaciones: [
//     { tipo: 'ANTIGUEDAD', resultado: 'PERMITIDA', motivo: '...' },
//     { tipo: 'VALOR', resultado: 'PERMITIDA', motivo: '...' },
//     { tipo: 'CREDITO', resultado: 'BLOQUEADA', motivo: 'Crédito insuficiente' }
//   ],
//   resumen: 'Facturación permitida ✓' o 'Facturación bloqueada: ...'
// }

if (!resultado.permitida) {
  alert('No se puede facturar: ' + resultado.resumen);
  return;
}
```

### Otras Funciones Disponibles:

1. **`validarAntiguedadFacturas(clienteId, diasMaximos)`**
   - Verifica si hay facturas pendientes más antiguas que X días
   - Si las hay, bloquea la nueva factura

2. **`validarValorFactura(totalFactura, limites)`**
   - Verifica si el valor está dentro del rango permitido
   - Retorna error si es menor al mínimo o mayor al máximo

3. **`validarCreditoDisponible(clienteId, montoNuevaFactura, limites)`**
   - Verifica si el cliente tiene crédito disponible
   - Suma deudas actuales + nueva factura
   - Bloquea si excede el límite

4. **`registrarValidacionFacturacion(clienteId, numeroFactura, validaciones)`**
   - Guarda en auditoría cada validación realizada

5. **`obtenerLimitesCliente(clienteId)`**
   - Obtiene los límites específicos del cliente

6. **`reporteClientesConLimites()`**
   - Retorna lista completa de clientes con sus límites

---

## 🔧 INTEGRACIÓN EN InvoiceScreen.jsx

Modificar la función `guardarFactura()` para incluir validaciones:

```javascript
import { validarFacturacionCompleta } from '../lib/validadorFacturacion';

const guardarFactura = async () => {
  try {
    // PRIMERO: Validar límites de facturación
    const validacion = await validarFacturacionCompleta(
      clienteId,
      totalFactura,
      tipoPago
    );

    if (!validacion.permitida) {
      // Mostrar razones de bloqueo al usuario
      const motivos = validacion.validaciones
        .filter(v => v.resultado !== 'PERMITIDA')
        .map(v => `• ${v.motivo}`)
        .join('\n');
      
      alert('❌ FACTURACIÓN BLOQUEADA\n\n' + motivos);
      return;
    }

    // LUEGO: Proceder con validaciones existentes
    if (!codigoClienteFinal) {
      alert('No se encontró código para este cliente...');
      return;
    }

    // ... resto del código de guardado
    
    // Guardar factura
    const numeroFactura = generarNumeroFactura();
    const { error } = await supabase.from('facturas').insert([{
      numero_factura: numeroFactura,
      cliente_id: clienteId,
      total: totalFactura,
      tipo_pago: tipoPago,
      // ... otros campos
    }]);

    if (error) throw error;

    alert('✓ Factura guardada correctamente');
  } catch (error) {
    console.error('Error:', error);
    alert('Error al guardar: ' + error.message);
  }
};
```

---

## 📋 TIPOS DE VALIDACIONES

### 1. **ANTIGÜEDAD**
- Bloquea si el cliente tiene facturas pendientes más antiguas que el límite
- Configuración: `dias_antiguedad_maximo`
- Motivo: "Cliente tiene X factura(s) pendiente(s) con más de 30 días"

### 2. **VALOR_MINIMO**
- Bloquea si la factura es menor al valor mínimo
- Configuración: `valor_minimo_factura`
- Motivo: "El valor mínimo de factura es $500.000"

### 3. **VALOR_MAXIMO**
- Bloquea si la factura excede el valor máximo
- Configuración: `valor_maximo_factura`
- Motivo: "El valor máximo de factura es $10.000.000"

### 4. **CREDITO_NO_PERMITIDO**
- Bloquea si el cliente no puede comprar a crédito
- Configuración: `puede_comprar_credito`
- Motivo: "Este tipo de cliente no puede comprar a crédito"

### 5. **CREDITO_EXCEDIDO**
- Bloquea si el crédito disponible es insuficiente
- Configuración: `valor_maximo_credito`
- Motivo: "Crédito insuficiente. Límite: $50M, Deuda: $30M, Nueva: $25M"

---

## 📊 EJEMPLO DE CONFIGURACIÓN

### Mayorista (Alto volumen, bajo riesgo)
```javascript
{
  dias_antiguedad_maximo: 45,           // Más tiempo para pagar
  valor_minimo_factura: 500000,         // Compras grandes
  valor_maximo_factura: 50000000,       // Límite alto
  valor_maximo_credito: 100000000,      // Mucho crédito
  puede_comprar_credito: true,
  dias_plazo_credito: 30
}
```

### Minorista (Bajo volumen, contado)
```javascript
{
  dias_antiguedad_maximo: 7,            // Poco tiempo para atrasar
  valor_minimo_factura: 50000,          // Compras pequeñas
  valor_maximo_factura: 1000000,        // Límite bajo
  valor_maximo_credito: 0,              // No hay crédito
  puede_comprar_credito: false
}
```

### Distribuidor (Volumen medio, confiable)
```javascript
{
  dias_antiguedad_maximo: 30,
  valor_minimo_factura: 200000,
  valor_maximo_factura: 20000000,
  valor_maximo_credito: 50000000,
  puede_comprar_credito: true,
  dias_plazo_credito: 15
}
```

---

## 🔍 AUDITORÍA Y REPORTES

### Ver validaciones rechazadas:
```javascript
import { supabase } from '../lib/supabaseConfig';

const { data } = await supabase
  .from('validaciones_facturacion')
  .select('*')
  .eq('resultado', 'BLOQUEADA')
  .order('creado_en', { ascending: false })
  .limit(100);

// Muestra todas las facturaciones rechazadas
```

### Reporte de clientes por tipo:
```javascript
import { reporteClientesConLimites } from '../lib/validadorFacturacion';

const reporte = await reporteClientesConLimites();
// Retorna todos los clientes con sus tipos y límites actuales
```

---

## 🎨 INTERFAZ DE USUARIO

### Tres componentes principales:

1. **TiposClientesScreen** - Administración de tipos y límites
   - Vista de tarjetas con cada tipo
   - Editor de límites con formulario completo
   - Validación de rangos y valores

2. **AsignarTiposClientesScreen** - Asignar tipos a clientes
   - Tabla de clientes con búsqueda
   - Selector dropdown para tipo
   - Indicador visual de estado

3. **InvoiceScreen (MODIFICADO)** - Validación en facturación
   - Muestra advertencias si hay restricciones
   - Bloquea facturación si no cumple límites
   - Muestra detalles de límites disponibles

---

## 🚨 MENSAJES DE ERROR COMUNES

| Error | Solución |
|-------|----------|
| "Cliente tiene X factura(s) con más de 30 días" | Cobrar las deudas atrasadas |
| "Valor mínimo de factura es $500k" | Agrupar productos para alcanzar mínimo |
| "Valor máximo de factura es $10M" | Dividir en varias facturas |
| "Crédito insuficiente. Límite: $50M, Deuda: $45M" | Esperar pagos o comprar a contado |
| "Este cliente no puede comprar a crédito" | Cambiar tipo de cliente o pagar contado |

---

## 📝 CHECKLIST DE IMPLEMENTACIÓN

- [ ] Ejecutar script SQL: `CREAR_TIPOS_CLIENTES_Y_LIMITES.sql`
- [ ] Importar `TiposClientesScreen.jsx` y `TiposClientesScreen.css`
- [ ] Importar `AsignarTiposClientesScreen.jsx` y `AsignarTiposClientesScreen.css`
- [ ] Crear librería: `src/lib/validadorFacturacion.js`
- [ ] Agregar rutas en `App.jsx`
- [ ] Agregar menú en `Navigation.jsx`
- [ ] Asignar tipos a clientes existentes vía UI
- [ ] Configurar límites específicos por tipo
- [ ] Integrar validaciones en `InvoiceScreen.jsx`
- [ ] Probar flujo completo de facturación
- [ ] Capacitar a usuarios sobre nuevas reglas

---

## 🔐 NOTAS DE SEGURIDAD

1. **RLS Policies**: Las políticas de seguridad están habilitadas pero permiten lectura pública. Ajustar según necesidad.

2. **Auditoría**: Todas las validaciones se registran en `validaciones_facturacion`.

3. **Campos calculados**: Antigüedad y crédito se calculan en tiempo real, no se cachean.

---

## 📞 SOPORTE

Para preguntas sobre configuración o uso del sistema, revisar:
- Documentación SQL: `sql/CREAR_TIPOS_CLIENTES_Y_LIMITES.sql`
- Funciones: `src/lib/validadorFacturacion.js`
- Componentes: `src/components/TiposClientesScreen.jsx`
