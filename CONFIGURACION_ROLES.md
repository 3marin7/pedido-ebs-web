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

### Método 1: Agregar Usuario en Login.jsx (LOCAL)

Editar `/src/components/Login.jsx` y agregar un nuevo objeto a la lista `users`:

```jsx
const users = [
  // ... otros usuarios
  { 
    id: 8,
    username: 'nuevouser',
    password: 'contraseña123',
    role: 'superadmin',  // o 'admin', 'contabilidad', 'inventario', 'vendedor'
    descripcion: 'Descripción del usuario'
  },
];
```

**Usuarios disponibles actualmente:**

| Usuario | Contraseña | Rol | 
|---------|-----------|-----|
| `Edwin` | `emc` | admin |
| `fredy` | `801551` | admin |
| `EMC` | `superadmin123` | **superadmin** 🔐 |
| `paola` | `1v3nt` | inventario |
| `caro` | `caro123` | contabilidad |
| `fabian` | `0411` | admin |

---

### Método 2: Directamente en Supabase (si usas base de datos)

Si tu aplicación está conectada a Supabase, ejecuta estos comandos en la tabla apropiada:

**Opción A - Si los roles están en tabla `public.usuarios` o `public.perfiles`:**
```sql
UPDATE public.usuarios 
SET rol = 'superadmin'
WHERE email = 'usuario@email.com';
```

**Opción B - Si los roles están en `auth.users` (raw_user_meta_data):**
```sql
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', '"superadmin"')
WHERE email = 'usuario@email.com';
```

**Verificar rol actual:**
```sql
SELECT username, rol FROM public.usuarios WHERE email = 'usuario@email.com';
```

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
