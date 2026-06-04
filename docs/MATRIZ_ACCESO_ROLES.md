# Matriz Oficial de Acceso por Roles

Fuente:
- Rutas y roles definidos en src/App.jsx
- Regla de autorizacion en ProtectedRoute

Fecha de corte:
- 2026-06-02

## Regla importante

- El rol admin tiene acceso a todas las rutas protegidas.
- Esto ocurre por la condicion de autorizacion que omite validacion de requiredRoles cuando el rol es admin.

## Matriz de vistas protegidas

| Ruta | superadmin | admin | vendedor | contabilidad | inventario | cliente |
|---|---|---|---|---|---|---|
| /dashboard | Si | Si | Si | Si | Si | Si |
| /facturacion | Si | Si | Si | No | Si | No |
| /nueva-factura | Si | Si | Si | No | Si | No |
| /facturas | Si | Si | Si | Si | Si | No |
| /factura/:id | Si | Si | Si | Si | Si | No |
| /rutas-cobro | Si | Si | Si | Si | No | No |
| /dashboard-ventas | Si | Si | No | Si | No | No |
| /reportes-ventas | Si | Si | Si | Si | No | No |
| /reportes-cobros | Si | Si | Si | Si | No | No |
| /plan-seguimiento-ventas | Si | Si | Si | Si | No | No |
| /calculador-sueldo-vendedor | Si | Si | Si | Si | No | No |
| /reporte-clientes-producto | Si | Si | Si | No | No | No |
| /mapa-locales | Si | Si | No | No | No | No |
| /gastos | Si | Si | Si | Si | No | No |
| /cuentas-por-pagar | Si | Si | No | Si | No | No |
| /gastos-empresa | Si | Si | No | Si | No | No |
| /dashboard-contabilidad | Si | Si | Si | Si | No | No |
| /catalogo | Si | Si | Si | Si | Si | No |
| /movimientos | Si | Si | No | No | Si | No |
| /auditoria-productos | Si | Si | No | No | Si | No |
| /gestion-inventario | Si | Si | No | No | Si | No |
| /gestion-pedidos | Si | Si | Si | Si | Si | No |
| /clientes | Si | Si | Si | Si | Si | No |
| /campana-catalogo | Si | Si | Si | Si | No | No |
| /campana-catalogo-api | Si | Si | Si | Si | No | No |
| /consulta-coopidrogas | Si | Si | Si | Si | Si | No |
| /catalogo-cliente | No | Si | No | No | No | Si |

## Rutas publicas (sin autenticacion)

| Ruta | Acceso |
|---|---|
| / | Publico |
| /catalogo-clientes | Publico |
| /catalogo-detalle | Publico |
| /login | Publico |

## Recomendacion de mantenimiento

- Actualizar este documento cada vez que se cambien rutas o requiredRoles en src/App.jsx.
- Incluir en revision de despliegue para validar permisos antes de publicar.
