# 🧪 Guía de Prueba Interactiva - Mejoras de Nóminas

## 🎬 Instrucciones Paso a Paso

### Escenario 1: Verificar Vista General de Nóminas

1. **Navegar a Gestión de Gastos**
   - [ ] Login con credenciales de Contabilidad (c/c) o Admin (a/a)
   - [ ] Hacer clic en "Gestión de Gastos" del menú lateral
   - [ ] Se debe mostrar el header de Gastos en rojo

2. **Filtrar por Nóminas**
   - [ ] En la sección "Tipo de Gasto", seleccionar "Nóminas y Pagos Personal"
   - [ ] Se deben colapsar otras secciones de gastos
   - [ ] Debe aparecer la sección "👥 Nóminas y Pagos Personal"

3. **Verificar Resumen por Empleado**
   - [ ] Debe haber al menos 1 tarjeta de empleado visible
   - [ ] Cada tarjeta debe mostrar:
     - Nombre del empleado con icono 👤
     - Badge con número de nóminas
     - Total Nominado
     - Promedio por nómina
     - Botón "Ver detalles →" en color azul

### Escenario 2: Abrir Detalles de un Empleado

1. **Hacer Clic en "Ver detalles →"**
   - [ ] Se abre sección "Nóminas de [Nombre]" debajo del resumen
   - [ ] El botón debe tener efecto hover (cambiar de tamaño ligeramente)
   - [ ] Debe haber un botón ✕ en la esquina superior derecha

2. **Verificar Contenido de Detalles**
   - [ ] Se muestra tabla con columnas:
     - Mes/Fecha
     - Tipo (badge azul o naranja)
     - Cantidad
     - Descripción
     - Acciones
   - [ ] Al menos una fila de nómina debe ser visible
   - [ ] Las filas deben cambiar de color (azul muy claro) al pasar el mouse

3. **Verificar Estadísticas**
   - [ ] Debajo de la tabla hay 3 tarjetas de estadísticas
   - [ ] Primera tarjeta (azul): "Total Nominado" + cantidad en moneda
   - [ ] Segunda tarjeta (roja): "Cantidad de Registros" + número
   - [ ] Tercera tarjeta (verde): "Promedio" + cantidad en moneda
   - [ ] Las tarjetas tienen bordes izquierdos coloreados

### Escenario 3: Cerrar Detalles

1. **Hacer Clic en Botón ✕**
   - [ ] Se cierra la sección de detalles
   - [ ] Vuelve a mostrarse solo el "Resumen por Empleado"
   - [ ] El estado se limpia correctamente

2. **Verificar que Sigue Funcionando**
   - [ ] Se puede abrir detalles de otro empleado
   - [ ] La funcionalidad se repite sin errores

### Escenario 4: Prueba Responsive en Tablet

1. **Cambiar Tamaño de Ventana a 768px**
   - [ ] Las tarjetas de empleados deben pasar a 1 columna
   - [ ] Las estadísticas deben pasar a 1 columna
   - [ ] Todos los elementos deben ser legibles

2. **Verificar Interactividad**
   - [ ] Los botones siguen siendo clickeables
   - [ ] El texto no se superpone
   - [ ] Las sombras son suaves y no distraen

### Escenario 5: Prueba Responsive en Móvil

1. **Cambiar Tamaño de Ventana a 480px**
   - [ ] Las tarjetas siguen en 1 columna
   - [ ] El padding se reduce apropiadamente (15px en lugar de 25px)
   - [ ] La fuente de números se reduce a 16px

2. **Verificar Usabilidad en Móvil**
   - [ ] Los botones son lo suficientemente grandes para tocar
   - [ ] El scroll horizontal NO es necesario
   - [ ] Todo el contenido es accesible

### Escenario 6: Verificar Cálculos

1. **Contar Nóminas Manualmente**
   - [ ] Abrir detalles de un empleado
   - [ ] Contar las filas de la tabla
   - [ ] Verificar que coincida con el número en "Cantidad de Registros"

2. **Verificar Total Nominado**
   - [ ] Sumar manualmente los montos de la tabla
   - [ ] Verificar que coincida con "Total Nominado" en la tarjeta de estadísticas

3. **Verificar Promedio**
   - [ ] Dividir Total Nominado ÷ Cantidad de Registros
   - [ ] Debe coincidir con el valor en "Promedio"

## 🎨 Checklist de Estilos

### Colores
- [ ] Tarjetas tienen fondo blanco
- [ ] Bordes izquierdos: azul para titular, naranja para prima
- [ ] Badges: azul para nóminas, naranja para prima
- [ ] Botón principal: degradado azul (claro a oscuro)
- [ ] Estadísticas: azul, rojo, verde para las 3 tarjetas

### Espaciado
- [ ] 25px padding en tarjetas grandes (desktop)
- [ ] 15px padding en tarjetas grandes (móvil)
- [ ] 15px gap entre tarjetas en grid
- [ ] 20px margin-bottom entre secciones

### Tipografía
- [ ] Títulos h3: 1.3rem, negrita
- [ ] Valores de estadísticas: 18px, negrita
- [ ] Etiquetas: 12px, uppercase
- [ ] Nombre de empleado: 1.1rem, negrita

### Efectos Hover
- [ ] Tarjeta empleado: sube 2px, sombra más pronunciada
- [ ] Botón "Ver detalles": scale 1.02, sombra azul
- [ ] Fila de tabla: fondo azul muy claro
- [ ] Botón cerrar: fondo gris claro, texto rojo

## 🐛 Checklist de Errores a Evitar

### Errores de Renderizado
- [ ] ❌ Tarjetas vacías (verificar que haya datos)
- [ ] ❌ Texto cortado en bordes
- [ ] ❌ Valores NaN o undefined en cantidades
- [ ] ❌ Detalles se abren pero están vacíos

### Errores de Interactividad
- [ ] ❌ Botones no responden al hacer clic
- [ ] ❌ Detalles no se cierran al hacer clic en ✕
- [ ] ❌ Se puede abrir múltiples detalles a la vez (solo debe haber 1)
- [ ] ❌ Las acciones (editar, eliminar) no funcionan

### Errores de Responsive
- [ ] ❌ Scroll horizontal en móvil
- [ ] ❌ Texto superpuesto
- [ ] ❌ Botones demasiado pequeños en móvil
- [ ] ❌ Grid no se adapta correctamente

### Errores de Datos
- [ ] ❌ Totales no coinciden
- [ ] ❌ Promedios incorrectos
- [ ] ❌ Contadores muestran número equivocado
- [ ] ❌ Empleados duplicados en el resumen

## 📊 Casos de Prueba Específicos

### Caso 1: Nómina Simple
**Datos:**
- Empleado: "Edwin Marín"
- 2 nóminas de $2,800,000 cada una
- 1 prima de $600,000

**Verificar:**
- [ ] Total Nominado: $6,200,000
- [ ] Cantidad de Registros: 3
- [ ] Promedio: $2,066,666.67

### Caso 2: Múltiples Empleados
**Datos:**
- Edwin Marín: 3 nóminas
- Jhon Fredy: 2 nóminas
- Otro: 1 nómina

**Verificar:**
- [ ] Se muestran 3 tarjetas de empleados
- [ ] Cada una con sus respectivos totales
- [ ] Grid se adapta correctamente

### Caso 3: Sin Nóminas
**Datos:**
- 0 nóminas registradas

**Verificar:**
- [ ] Se muestra mensaje "No hay nóminas registradas"
- [ ] No hay tarjetas de empleados
- [ ] No hay sección de detalles

## 🎯 Regresión Testing

**Elementos que NO deben cambiar:**
- [ ] Otras secciones de gastos (Nequi, Específicos, Créditos) funcionan igual
- [ ] Filtros generales de gastos siguen funcionando
- [ ] Acciones de editar/eliminar siguen funcionando
- [ ] Paginación sigue visible (si hay >10 nóminas)
- [ ] El header de Gastos sigue visible y funcional

## 🔍 Verificación Final

Antes de dar por completada la prueba, verificar:

1. **Funcionalidad**
   - [ ] ✅ Se muestran todas las nóminas correctamente
   - [ ] ✅ Los cálculos son exactos
   - [ ] ✅ Los botones funcionan
   - [ ] ✅ No hay errores en consola

2. **Diseño**
   - [ ] ✅ Colores y estilos son consistentes
   - [ ] ✅ Tipografía es clara y legible
   - [ ] ✅ Espaciado es equilibrado
   - [ ] ✅ Efectos hover son sutiles pero notables

3. **Responsive**
   - [ ] ✅ Desktop (1400px+): Layout perfecto
   - [ ] ✅ Tablet (768px): Se adapta bien
   - [ ] ✅ Móvil (480px): Totalmente usable
   - [ ] ✅ Sin scroll horizontal en móvil

4. **Accesibilidad**
   - [ ] ✅ Botones tienen etiquetas claras (title attributes)
   - [ ] ✅ Iconos tienen significado (nómina, prima, etc.)
   - [ ] ✅ Colores tienen suficiente contraste
   - [ ] ✅ Tamaños de fuente son legibles

---

**Tiempo estimado de prueba:** 15-20 minutos
**Navegadores a probar:** Chrome, Firefox, Safari
**Dispositivos a probar:** Desktop (1440px), Tablet (768px), Móvil (375px)
