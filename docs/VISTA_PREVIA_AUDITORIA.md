# 📊 VISTA PREVIA DEL SISTEMA DE AUDITORÍA

## 🎨 Pantalla Principal: Historial de Movimientos

```
═══════════════════════════════════════════════════════════════════
                    📊 Historial de Movimientos de Inventario
                 Registro completo de todos los cambios en el stock
═══════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  FILTROS                                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Producto:              Tipo de Movimiento:   Desde:   Hasta:  │
│  [▼ Todos los productos] [▼ Todos los tipos]  [____]   [____]  │
│                                                                 │
│          [Limpiar Filtros]           [📥 Exportar CSV]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  RESUMEN DE MOVIMIENTOS                                         │
├──────────────────────┬──────────────┬──────────────┬────────────┤
│ Total de Movimientos │    Ventas    │   Entradas   │  Ajustes   │
│        42            │      35      │       5      │      2     │
└──────────────────────┴──────────────┴──────────────┴────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│  HISTORIAL DETALLADO                                               │
├────────────────────────┬──────────┬────────────┬──────────────┬──────┤
│ Fecha                  │ Producto │ Tipo       │ Cantidad     │ ...  │
├────────────────────────┼──────────┼────────────┼──────────────┼──────┤
│ 26/01/2026 14:32:15    │ Gigo     │ 📦 Venta   │     10       │      │
│ Stock Anterior: 100    │          │            │ Stock Nuevo: 90    │
│ Usuario: Edwin Marin   │          │ Factura #12345                 │
│ Desc: Venta de 10 unidades de Gigo                                 │
├────────────────────────┼──────────┼────────────┼──────────────┼──────┤
│ 26/01/2026 10:15:42    │ Arroz    │ 📥 Entrada │     50       │      │
│ Stock Anterior: 150    │          │            │ Stock Nuevo: 200   │
│ Usuario: Sistema       │          │ Factura -                      │
│ Desc: Compra de 50 unidades de Arroz                              │
├────────────────────────┼──────────┼────────────┼──────────────┼──────┤
│ 25/01/2026 16:45:20    │ Cerveza  │ 🔧 Ajuste  │      5       │      │
│ Stock Anterior: 95     │          │            │ Stock Nuevo: 100   │
│ Usuario: Admin         │          │ Factura -                      │
│ Desc: Ajuste por discrepancia en conteo                           │
└────────────────────────┴──────────┴────────────┴──────────────┴──────┘
```

---

## 🎯 Flujo de Datos Visualizado

```
┌──────────────────────────┐
│   USUARIO CREA FACTURA   │
│  (InvoiceScreen.jsx)     │
└────────┬─────────────────┘
         │
         ├─► Selecciona Cliente ✓
         ├─► Selecciona Vendedor ✓
         ├─► Agrega 10 Gigo @$29.000 ✓
         │
         ▼
┌──────────────────────────────┐
│  GUARDA FACTURA              │
│  (Presiona botón Guardar)    │
└────────┬─────────────────────┘
         │
         ├─► INSERT en tabla "facturas" ✓
         │   └─ ID: 12345
         │
         ├─► UPDATE tabla "productos" ✓
         │   └─ stock: 100 → 90
         │   └─ activo: true (sigue activo)
         │
         ├─► INSERT en "movimientos_inventario" ✓ 🎯
         │   └─ producto_id: 1
         │   └─ tipo_movimiento: 'venta'
         │   └─ cantidad: 10
         │   └─ stock_anterior: 100
         │   └─ stock_nuevo: 90
         │   └─ factura_id: 12345
         │   └─ usuario: 'Edwin Marin'
         │   └─ descripcion: 'Venta de 10 unidades...'
         │   └─ fecha_movimiento: 2026-01-26 14:32:15
         │
         ▼
┌──────────────────────────────┐
│  ✅ FACTURA GUARDADA         │
│  Mensaje: "¿Deseas imprimir?"│
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│  HISTORIAL DISPONIBLE        │
│  Ruta: /movimientos          │
│                              │
│  ✓ Ver todos los movimientos │
│  ✓ Filtrar por producto      │
│  ✓ Filtrar por tipo          │
│  ✓ Filtrar por fechas        │
│  ✓ Exportar a CSV            │
└──────────────────────────────┘
```

---

## 📋 Estructura de Datos

### Tabla: `movimientos_inventario`

```
ID  │ Producto │ Tipo    │ Cant │ Ante │ Nuevo │ Usuario      │ Factura │ Fecha                │
───────────────────────────────────────────────────────────────────────────────────────────────
1   │ Gigo     │ venta   │ 10   │ 100  │ 90    │ Edwin Marin  │ 12345   │ 2026-01-26 14:32:15 │
2   │ Arroz    │ entrada │ 50   │ 150  │ 200   │ Sistema      │ NULL    │ 2026-01-26 10:15:42 │
3   │ Cerveza  │ ajuste  │ 5    │ 95   │ 100   │ Admin        │ NULL    │ 2026-01-25 16:45:20 │
4   │ Gigo     │ venta   │ 5    │ 90   │ 85    │ Edwin Marin  │ 12346   │ 2026-01-25 09:10:00 │
```

---

## 🔍 Ejemplos de Filtrado

### Filtro 1: Ver solo ventas de "Gigo"
```
Producto: Gigo
Tipo: venta
Resultado: 2 registros (10 unidades + 5 unidades)
```

### Filtro 2: Ver movimientos de enero
```
Desde: 01/01/2026
Hasta: 31/01/2026
Resultado: 4 registros (todos)
```

### Filtro 3: Ver entradas de la última semana
```
Tipo: entrada
Desde: 20/01/2026
Hasta: 26/01/2026
Resultado: 1 registro (Arroz 50 unidades)
```

---

## 📊 Colores en la Tabla

```
🔴 VENTA      - Rojo    (#e74c3c)  - Disminuye stock
🟢 ENTRADA    - Verde   (#27ae60)  - Aumenta stock
🟠 AJUSTE     - Naranja (#f39c12)  - Corrección
🔵 DEVOLUCIÓN - Azul    (#3498db)  - Retorno de cliente
```

---

## 📥 Exportar a CSV

Cuando haces clic en "Exportar CSV", descarga un archivo:
```
movimientos_inventario_2026-01-26.csv
```

Contenido:
```csv
"Fecha","Producto","Tipo","Cantidad","Stock Anterior","Stock Nuevo","Usuario","Factura","Descripción"
"26/01/2026 14:32:15","Gigo","venta","10","100","90","Edwin Marin","12345","Venta de 10 unidades de Gigo"
"26/01/2026 10:15:42","Arroz","entrada","50","150","200","Sistema","-","Compra de 50 unidades de Arroz"
"25/01/2026 16:45:20","Cerveza","ajuste","5","95","100","Admin","-","Ajuste por discrepancia en conteo"
```

Puedes abrirlo en:
- Excel ✓
- Google Sheets ✓
- Numbers (Mac) ✓
- Cualquier editor de texto ✓

---

## 🎯 Acceso por Rol

### Admin
```
Menú → Bodega → Historial Movimientos
Acceso: Completo
Puede: Ver, filtrar, exportar
```

### Inventario
```
Menú → Historial Movimientos
Acceso: Completo
Puede: Ver, filtrar, exportar
```

### Vendedor
```
No tiene acceso directo
(pero sus movimientos quedan registrados bajo su nombre)
```

### Contabilidad
```
No tiene acceso directo en esta versión
(pero puede acceder a reportes de auditoría)
```

---

## 🧪 Ejemplo Práctico de Uso

**Escenario:** El gerente nota que hay faltantes y quiere saber qué pasó con el producto "Gigo"

1. **Abre la app**
2. **Navega a:** Bodega → Historial Movimientos
3. **Filtra por producto:** "Gigo"
4. **Resultado:** Ve todos los movimientos de Gigo
   - Venta 10 unidades (26/01 14:32) - Factura #12345
   - Venta 5 unidades (25/01 09:10) - Factura #12346
   - Venta 15 unidades el día anterior
5. **Conclusión:** Se vendieron 30 unidades en 2 días
6. **Acción:** Verifica facturas #12345 y #12346 para confirmar

---

## ✨ Ventajas del Sistema

✅ **Automático** - Se registra sin intervención
✅ **Completo** - Captura todos los datos relevantes
✅ **Seguro** - Tabla con auditoría permanente
✅ **Trazable** - Liga ventas con cambios
✅ **Reportable** - Exporta a CSV para análisis
✅ **Responsable** - Registra quién hizo qué
✅ **Rápido** - Búsquedas indexadas
✅ **Legal** - Cumple requisitos de auditoría

---

## 🚀 Ya está implementado:

✅ Tabla SQL creada
✅ Función de registro en InvoiceScreen
✅ Componente HistorialMovimientos
✅ Estilos CSS responsivos
✅ Filtros funcionales
✅ Exportación a CSV
✅ Enlace en navegación
✅ Manejo de errores

**¡Solo ejecuta el script SQL y está listo!**
