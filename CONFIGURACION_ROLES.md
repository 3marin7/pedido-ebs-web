# Configuración de Roles en el Sistema EBS

## 📋 Roles Disponibles

### 1. **SUPERADMIN** 🔐
**El rol más privilegiado del sistema**

**Acceso:**
- ✅ Todas las funcionalidades de Admin
- ✅ **Reporte Exclusivo: "Clientes por Producto"** (solo superadmin)
- ✅ Reportes avanzados
- ✅ Auditoría completa
- ✅ Dashboard de ventas
- ✅ Gestión de gastos
- ✅ Dashboard de contabilidad

**Menú especial:** "Reportes Exclusivos" con acceso a:
- Clientes por Producto
- Auditoría de Productos
- Historial de Movimientos
- Dashboard de Ventas

---

### 2. **ADMIN** 👨‍💼
**Administrador general del sistema**

**Acceso:**
- ✅ Crear facturas
- ✅ Ver facturas guardadas
- ✅ Gestión de clientes
- ✅ Auditoría de productos
- ✅ Reportes de cobros
- ✅ Gestión de gastos
- ✅ Gestión de inventario
- ❌ Reporte "Clientes por Producto" (solo para superadmin)

---

### 3. **CONTABILIDAD** 💰
**Gestión contable y financiera**

**Acceso:**
- ✅ Ver facturas guardadas
- ✅ Reportes de cobros
- ✅ Gestión de gastos
- ✅ Dashboard de contabilidad
- ✅ Rutas de cobro
- ✅ Gestión de pedidos
- ✅ Dashboard de ventas
- ✅ Catálogo (lectura)
- ❌ Crear facturas
- ❌ Reporte "Clientes por Producto"

---

### 4. **INVENTARIO** (inv) 📦
**Gestión de bodega y stock**

**Acceso:**
- ✅ Gestión de inventario
- ✅ Gestión de pedidos
- ✅ Catálogo productos (completo)
- ✅ Auditoría de productos
- ❌ Crear/editar facturas (solo lectura)
- ❌ Gestión de clientes
- ❌ Reportes

---

### 5. **VENDEDOR** 🏪
**Ventas y atención al cliente**

**Acceso:**
- ✅ Crear facturas
- ✅ Ver facturas propias
- ✅ Catálogo (lectura)
- ✅ Reportes de cobros
- ✅ Gestión de pedidos
- ✅ Gestión de gastos
- ❌ Auditoría
- ❌ Gestión de inventario

---

### 6. **CLIENTE** 👥
**Cliente final del sistema (acceso limitado)**

**Acceso:**
- ✅ Ver catálogo de productos
- ❌ Crear facturas
- ❌ Acceso administrativo

---

## 🔧 Cómo Cambiar el Rol de un Usuario

### Método 1: Directamente en Supabase (SQL)

```sql
-- Cambiar a SUPERADMIN
UPDATE auth.users 
SET user_metadata = jsonb_set(user_metadata, '{role}', '"superadmin"')
WHERE email = 'email@usuario.com';

-- Cambiar a ADMIN
UPDATE auth.users 
SET user_metadata = jsonb_set(user_metadata, '{role}', '"admin"')
WHERE email = 'email@usuario.com';

-- Cambiar a CONTABILIDAD
UPDATE auth.users 
SET user_metadata = jsonb_set(user_metadata, '{role}', '"contabilidad"')
WHERE email = 'email@usuario.com';

-- Cambiar a INVENTARIO
UPDATE auth.users 
SET user_metadata = jsonb_set(user_metadata, '{role}', '"inventario"')
WHERE email = 'email@usuario.com';

-- Cambiar a VENDEDOR
UPDATE auth.users 
SET user_metadata = jsonb_set(user_metadata, '{role}', '"vendedor"')
WHERE email = 'email@usuario.com';

-- Ver rol actual de un usuario
SELECT email, user_metadata->>'role' as role
FROM auth.users
WHERE email = 'email@usuario.com';
```

### Método 2: Panel de Administración (si se implementa)

En el futuro, puede crearse una pantalla de administración donde solo SUPERADMIN pueda:
- Ver lista de usuarios
- Cambiar roles
- Activar/desactivar usuarios
- Ver historial de accesos

---

## 📊 Matriz de Acceso por Rol

| Funcionalidad | Superadmin | Admin | Contabilidad | Inventario | Vendedor | Cliente |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Nueva Factura | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Facturas Guardadas | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Clientes por Producto** | **✅** | ❌ | ❌ | ❌ | ❌ | ❌ |
| Auditoría Productos | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Reportes de Cobros | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Gestión de Gastos | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Gestión de Inventario | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Dashboard Ventas | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Dashboard Contabilidad | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Catálogo Completo | ✅ | ✅ | ✅ (lectura) | ✅ | ✅ (lectura) | ✅ (lectura) |
| Gestión Clientes | ✅ | ✅ | ✅ (lectura) | ❌ | ✅ (limitado) | ❌ |

---

## 🚀 Próximos Pasos

Para expandir funcionalidades exclusivas de Superadmin:

1. **Agregar más reportes analíticos** (análisis de ventas, tendencias, etc.)
2. **Panel de control de usuarios** (gestionar roles desde la interfaz)
3. **Auditoría de accesos** (quién accedió, cuándo, qué vio)
4. **Reportes de rentabilidad** por producto/cliente
5. **Análisis predictivos** de demanda
6. **Control de permisos granulares** por módulo

---

## 📝 Notas Importantes

- El rol se almacena en `user_metadata` de Supabase Auth
- Los cambios de rol se aplican en el siguiente login
- Superadmin es el único que puede ver "Clientes por Producto"
- Se recomienda tener máximo 1-2 cuentas de Superadmin por empresa
- Todos los cambios de rol deben ser registrados para auditoría

---

**Última actualización:** 10 de febrero de 2026
