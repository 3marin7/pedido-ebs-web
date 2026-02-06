# 🔐 Credenciales de Acceso para Pruebas

## Usuarios disponibles en el sistema

| # | Usuario | Contraseña | Rol | Descripción | Acceso |
|---|---------|-----------|-----|-------------|--------|
| 1 | **EBS** | **E1** | **admin** | Acceso Total - Administrador del sistema | Todo el sistema |
| 2 | **v** | **v1** | **vendedor** | Crear facturas, gestionar pedidos, ver clientes | Facturación, Inventario, Pedidos |
| 3 | **c** | **c** | **contabilidad** | Ver facturas, reportes de cobros, análisis | Reportes, Facturas, Análisis |
| 4 | **Inv** | **inv123** | **inventario** | Gestionar catálogo, control de stock | Catálogo, Auditoría, Movimientos |

---

## 🎯 Rutas de acceso por rol

### 👨‍💼 Admin (EBS / E1)
```
✅ Dashboard Ventas
✅ Facturación
✅ Nueva Factura
✅ Facturas Guardadas
✅ Dashboard Contabilidad
✅ Reportes de Cobros
✅ Gestión de Gastos
✅ Rutas de Cobro
✅ Gestión de Clientes
✅ Mapa de Locales
✅ Catálogo de Productos
✅ Gestión de Inventario
✅ Historial de Movimientos
✅ Auditoría de Productos
✅ Gestión de Pedidos
```

### 📦 Vendedor (v / v1)
```
✅ Facturación / Nueva Factura
✅ Facturas Guardadas
✅ Dashboard Contabilidad
✅ Reportes de Cobros
✅ Gestión de Gastos
✅ Rutas de Cobro
✅ Gestión de Pedidos
✅ Gestión de Clientes
✅ Gestión de Inventario
✅ Catálogo de Productos
```

### 💰 Contabilidad (c / c)
```
✅ Dashboard Contabilidad
✅ Facturas Guardadas
✅ Reportes de Cobros
✅ Gestión de Gastos
✅ Rutas de Cobro
✅ Gestión de Pedidos
✅ Dashboard Ventas
✅ Catálogo de Productos (Lectura)
✅ Gestión de Clientes
```

### 📋 Inventario (Inv / inv123)
```
✅ Catálogo de Productos
✅ Gestión de Inventario
✅ Historial de Movimientos
✅ Auditoría de Productos
✅ Gestión de Pedidos
```

---

## 🧪 Casos de Prueba Recomendados

### Caso 1: Crear y Editar Producto (como Inventario)
```
1. Login: Inv / inv123
2. Menú → Bodega → Catálogo de Productos
3. Crear un producto nuevo (genera "creacion" en Auditoría)
4. Editar ese producto (cambiar stock, nombre, precio)
5. Ir a Menú → Bodega → Auditoría de Productos
6. Ver los registros con usuario/rol/cambios
```

### Caso 2: Generar Factura (como Vendedor)
```
1. Login: v / v1
2. Menú → Nueva Factura
3. Crear una factura (registra "venta" en Historial Movimientos)
4. Ir a Menú → Bodega → Historial Movimientos
5. Ver los movimientos con usuario/rol/cantidad
```

### Caso 3: Ver Reportes (como Contabilidad)
```
1. Login: c / c
2. Acceder a Dashboard Contabilidad, Reportes de Cobros, etc.
3. Notar que Catálogo es solo lectura
```

### Caso 4: Admin Full Access
```
1. Login: EBS / E1
2. Acceder a cualquier módulo
3. Ver Auditoría de Productos y Historial de Movimientos
4. Verificar que todos los cambios de todos los roles aparecen
```

---

## 📊 Ejemplo de seguimiento en Auditoría de Productos

**Al crear un producto como Inventario:**
- Usuario: `Inv`
- Rol: `inventario`
- Tipo: `creacion`
- Cambios: `Producto creado: "prueba 3" con stock inicial de 400`

**Al editar stock como Inventario:**
- Usuario: `Inv`
- Rol: `inventario`
- Tipo: `edicion`
- Cambios: `Stock: 400 → 350`

---

## 💡 Tips

- **Prueba cambios desde diferentes roles** para ver cómo se registran con usuario/rol diferente
- **Usa filtros en Auditoría** para buscar por usuario, rol, fecha, tipo de acción
- **Exporta a CSV** los registros de auditoría para análisis externos
- **Verifica timestamps** para ver exactamente cuándo se hizo cada cambio
