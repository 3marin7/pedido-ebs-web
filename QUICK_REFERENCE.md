# 🎯 Referencia Rápida - Mejoras de Nóminas

## 📍 Ubicación de Cambios

### Componente: `GastosScreen.jsx` (1253 líneas)

#### 1. Estado (Lines 24-29)
```javascript
const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);
const [nominasEmpleado, setNominasEmpleado] = useState([]);
const [mostrarDetalleNomina, setMostrarDetalleNomina] = useState(false);
const [nominaDetalle, setNominaDetalle] = useState(null);
const [filtroEstado, setFiltroEstado] = useState('todos');
```

#### 2. Funciones Principales (Lines 484-525)
- `obtenerEmpleados()` → Array de empleados únicos
- `obtenerNominasEmpleado(empleado)` → Nóminas del empleado
- `calcularResumenEmpleado(empleado)` → Totales y promedios
- `verDetalleNomina(nomina)` → Abre modal
- `cerrarDetalleNomina()` → Cierra modal

#### 3. Interfaz (Lines 960-1070)
```
📊 Sección "👥 Nóminas y Pagos Personal"
├── Resumen por Empleado (Grid de tarjetas)
├── Detalles del Empleado (Tabla expandible)
└── Lista General (Tabla completa)
```

### Stylesheet: `GastosScreen.css` (1068 líneas)

#### 4. Nuevas Clases CSS (Lines 830+)
```css
.nominas-resumen              /* Contenedor principal */
.empleados-grid               /* Grid responsive */
.empleado-card                /* Tarjeta de empleado */
.empleado-header              /* Parte superior */
.badge-nominas                /* Contador */
.empleado-stats               /* Estadísticas */
.btn-ver-detalles             /* Botón de acción */
.nominas-detalles             /* Sección de detalles */
.detalles-header              /* Header de detalles */
.btn-cerrar-detalles          /* Botón cerrar */
.nomina-row                   /* Fila de tabla */
.nominas-estadisticas         /* Tarjetas de stats */
.stat-card                    /* Tarjeta individual */
.stat-title                   /* Título */
.stat-amount                  /* Valor */
```

---

## 🎮 Cómo Usar

### Para mostrar nóminas de un empleado:

```javascript
// 1. Obtener lista de empleados
const empleados = obtenerEmpleados();
// Resultado: ["Edwin Marín", "Jhon Fredy", ...]

// 2. Calcular resumen de un empleado
const resumen = calcularResumenEmpleado("Edwin Marín");
// Resultado: {
//   empleado: "Edwin Marín",
//   totalNominado: 6200000,
//   cantidadNominas: 3,
//   promedioPorNomina: 2066666.67,
//   nominas: [array de nóminas]
// }

// 3. Abrir detalles
verDetalleNomina(nominaSeleccionada);
// Renderiza tabla con todas las nóminas del empleado
```

---

## 🎨 Paleta de Colores

| Elemento | Color | Código |
|---|---|---|
| Borde tarjeta | Azul | `#3498db` |
| Fondo tarjeta | Blanco | `#ffffff` |
| Badge nómina | Azul claro | `#3498db` |
| Badge prima | Naranja | `#f39c12` |
| Texto principal | Gris oscuro | `#2c3e50` |
| Texto secundario | Gris medio | `#7f8c8d` |
| Hover tarjeta | Sombra | `0 4px 12px rgba(0,0,0,0.15)` |
| Hover fila | Azul muy claro | `#f0f7ff` |
| Botón primario | Gradiente azul | `#3498db → #2980b9` |
| Cerrar | Rojo hover | `#e74c3c` |

---

## 📱 Responsive Breakpoints

```css
/* Desktop */
1024px+ {
  .empleados-grid: 3 columnas
  .nominas-estadisticas: 3 columnas
  .empleado-card: padding 20px
}

/* Tablet */
768px - 1023px {
  .empleados-grid: 2 columnas
  .nominas-estadisticas: 2 columnas
  .empleado-card: padding 20px
}

/* Móvil */
480px - 767px {
  .empleados-grid: 1 columna
  .nominas-estadisticas: 1 columna
  .empleado-card: padding 15px
  .stat-amount: 16px font
}

/* Extra-pequeño */
< 480px {
  Igual a 480px+
}
```

---

## 🔌 Integración con Datos

### Estructura esperada de `datosGastos.nominas`

```javascript
[
  {
    id: 1,
    persona: "Edwin Marín",
    tipo: "nómina",
    cantidad: 2800000,
    mes: 5,              // Junio (0 = Enero)
    anio: 2025,
    fecha: "2025-06-15",
    descripcion: "Nómina junio 2025",
    pagada: false        // Para futuras extensiones
  },
  // ... más nóminas
]
```

### Funciones auxiliares requeridas

```javascript
// Debe existir una función para formatear moneda
formatCurrency(2800000) → "$2,800,000"

// Debe existir una función para obtener nombre del mes
getNombreMes(5) → "Junio"
```

---

## 🚦 Flujo de Renderizado

```
GastosScreen.jsx
├── Carga datosGastos (localStorage)
├── Usuario selecciona filtro tipo = "nomina"
├── Se renderiza sección "👥 Nóminas y Pagos Personal"
│   ├── Llamar: obtenerEmpleados() → lista de empleados
│   ├── Para cada empleado:
│   │   ├── Llamar: calcularResumenEmpleado() → resumen
│   │   ├── Renderizar: <EmpleadoCard resumen={resumen} />
│   │   └── Botón "Ver detalles" → verDetalleNomina()
│   └── Si empleadoSeleccionado != null:
│       ├── Mostrar: <DetallesEmpleado />
│       ├── Renderizar tabla de nóminas
│       ├── Mostrar estadísticas
│       └── Botón cerrar → cerrarDetalleNomina()
└── Si no hay empleadoSeleccionado:
    └── Mostrar: <ListaGeneralNominas />
```

---

## ⚡ Performance Tips

### Optimizaciones Actuales
- ✅ Datos en memoria (localStorage) - acceso rápido
- ✅ Grid CSS Grid - renderizado eficiente
- ✅ Funciones puras (no mutaciones)
- ✅ Sin llamadas a API en tiempo real

### Mejoras Futuras
- [ ] Virtualización si > 1000 nóminas
- [ ] Lazy loading de detalles
- [ ] Memoización de cálculos
- [ ] Caché de resúmenes
- [ ] Paginación en tabla de detalles

---

## 🐛 Debug Helpers

### Para verificar datos en consola:

```javascript
// Ver empleados cargados
console.log(obtenerEmpleados());

// Ver nóminas de un empleado
console.log(obtenerNominasEmpleado("Edwin Marín"));

// Ver resumen completo
console.log(calcularResumenEmpleado("Edwin Marín"));

// Ver estado actual
console.log({
  empleadoSeleccionado,
  nominasEmpleado,
  mostrarDetalleNomina,
  nominaDetalle,
  filtroEstado
});
```

---

## 🔐 Validaciones

### Qué sucede cuando:

| Caso | Resultado |
|---|---|
| No hay nóminas | Se muestra "No hay nóminas registradas" |
| empleadoSeleccionado = null | Se muestra resumen por empleado |
| empleadoSeleccionado = "Edwin" | Se despliegan detalles de Edwin |
| Se hace clic en ✕ | Se cierra detalles, vuelve a resumen |
| Se hace clic en otro empleado | Se actualiza detalles a nuevo empleado |
| Nominasempleado = [] | Se muestra tabla vacía con mensaje |

---

## 📋 Checklist de Integración

- [ ] GastosScreen.jsx tiene todas las funciones
- [ ] GastosScreen.css tiene todos los estilos
- [ ] formatCurrency() está disponible
- [ ] getNombreMes() está disponible
- [ ] datosGastos.nominas existe con datos
- [ ] No hay errores en consola
- [ ] Tarjetas se ven en desktop, tablet y móvil
- [ ] Botones funcionan al hacer clic
- [ ] Cálculos son correctos
- [ ] Responsive design funciona

---

## 📞 Soporte Rápido

### Problema: Las tarjetas no se muestran
**Solución:** Verificar que datosGastos.nominas tiene datos con estructura correcta

### Problema: Los cálculos están mal
**Solución:** Verificar que formatCurrency() está en scope

### Problema: Estilos no se aplican
**Solución:** Verificar que GastosScreen.css está importado correctamente

### Problema: Modal no cierra
**Solución:** Verificar que cerrarDetalleNomina() se está llamando en onClick del botón ✕

---

## 📚 Archivos Relacionados

```
pedido-ebs-web/
├── src/components/
│   ├── GastosScreen.jsx ✅ (MODIFICADO)
│   └── GastosScreen.css ✅ (MODIFICADO)
├── NOMINA_IMPROVEMENTS.md (Documentación completa)
├── TEST_NOMINA_GUIDE.md (Guía de pruebas)
├── IMPLEMENTATION_SUMMARY.md (Resumen de implementación)
└── QUICK_REFERENCE.md (ESTE ARCHIVO)
```

---

**Versión:** 1.0
**Última actualización:** Junio 2025
**Estado:** ✅ LISTO PARA USAR
