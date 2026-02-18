# 🔐 Credenciales de Acceso para Pruebas

**Última actualización:** 16 de febrero de 2026

## Usuarios disponibles en el sistema

| # | Usuario | Contraseña | Rol | Descripción |
|---|---------|-----------|-----|-------------|
| 1 | **Edwin** | **emc** | **admin** | Admin - Acceso Total. Administrador del sistema. |
| 2 | **fredy** | **801551** | **admin** | Admin - Acceso Total. Administrador del sistema. |
| 3 | **fabian** | **0411** | **admin** | Admin - Acceso Total. Administrador del sistema. |
| 4 | **EMC** | **superadmin123** | **superadmin** | SUPERADMIN - Acceso EXCLUSIVO a reportes avanzados. Reporte de clientes por producto, análisis completo. |
| 5 | **paola** | **1v3nt** | **inventario** | Inventario/Bodega - Catálogo, gestión de stock, movimientos, auditoría, pedidos. |
| 6 | **caro** | **caro123** | **contabilidad** | Contabilidad - Facturas, reportes de cobros, análisis de contabilidad. |

---

## 🎯 Rutas de acceso por rol

### 👨‍💼 Admin (Edwin / emc | fredy / 801551 | fabian / 0411)
**Acceso Total - Administrador del sistema**
```
✅ Dashboard Ventas
✅ Dashboard Contabilidad
✅ Facturación / Nueva Factura
✅ Facturas Guardadas
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

### 🔴 Superadmin (EMC / superadmin123)
**Acceso EXCLUSIVO a reportes avanzados**
```
✅ Reporte de Clientes por Producto (EXCLUSIVO)
✅ Análisis completo de datos
✅ Exportación de reportes avanzados
+ Todos los accesos del Admin
```

### 📦 Inventario (paola / 1v3nt)
**Bodega / Gestión de Stock**
```
✅ Catálogo de Productos
✅ Gestión de Inventario
✅ Historial de Movimientos
✅ Auditoría de Productos
✅ Gestión de Pedidos
```

### 💰 Contabilidad (caro / caro123)
**Finanzas y Reportes**
```
✅ Dashboard Contabilidad
✅ Facturas Guardadas
✅ Reportes de Cobros
✅ Gestión de Gastos
✅ Rutas de Cobro
✅ Gestión de Pedidos
✅ Dashboard Ventas (Lectura)
✅ Catálogo de Productos (Lectura)
✅ Gestión de Clientes (Lectura)
```

---

## 🧪 Casos de Prueba Recomendados

### Caso 1: Crear y Editar Producto (como Inventario)
```
1. Login: Inv / inv123
2. Menú → Bodega → Catálogo de Productos
3. Crear un producto nuevo (genera "creacion" en Auditoría)
4. Editar paola / 1v3nt
2. Menú → Bodega → Catálogo de Productos
3. Crear un producto nuevo (genera "creacion" en Auditoría)
4. Editar ese producto (cambiar stock, nombre, precio)
5. Ir a Menú → Bodega → Auditoría de Productos
6. Ver los registros con usuario "paola", rol "inventario"
```

### Caso 2: Ver Reportes (como Contabilidad)
```
1. Login: caro / caro123
2. Menú → Contabilidad → Reportes de Cobros
3. Menú → Contabilidad → Gestión de Gastos
4. Notar acceso a lectura en Catálogo de Productos
5. Intentar crear un producto (debe estar bloqueado)
```

### Caso 3: Admin Full Access
```
1. Login: Edwin / emc (o fredy / 801551, o fabian / 0411)
2. Acceder a cualquier módulo del sistema
3. Ir a Bodega → Auditoría de Productos
4. Verificar que todos los cambios de todos los roles aparecen
```

### Caso 4: Superadmin - Reporte Exclusivo
```
1. Login: EMC / superadmin123
2. Intentar acceder a "Reporte Clientes por Producto"
3. Como Super Admin, debe tener acceso EXCLUSIVO
4. Los otros roles (admin, contabilidad, inventario) NO deberían ver este reporte

## 📊 Ejemplo de seguimiento en Auditoría de Productos

**Al crear upaola`
- Rol: `inventario`
- Tipo: `creacion`
- Cambios: `Producto creado: "Arroz Integral 5kg" con stock inicial de 400`

**Al editar stock como Inventario:**
- Usuario: `paola`
- Rol: `inventario`
- Tipo: `edicion`
- Cambios: `Stock: 400 → 350`

**Verificación por Admin:**
- Usuario Admin (Edwin, fredy, o fabian) ve todos los cambios en Auditoría
- Usuario Contabilidad (caro) puede ver historial pero no puede editar
- Usuario Superadmin (EMC) ve todo además de reportes exclusivos
- Cambios: `Stock: 400 → 350`

---

## 💡 Tips

- **Prueba cambios desde diferentes roles** para ver cómo se registran con usuario/rol diferente
- **Usa filtros en Auditoría** para buscar por usuario, rol, fecha, tipo de acción
- **Exporta a CSV** los registros de auditoría para análisis externos
- **Verifica timestamps** para ver exactamente cuándo se hizo cada cambio
