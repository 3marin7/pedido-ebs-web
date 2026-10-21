# pedido-ebs-web

Aplicación web EBS desarrollada con React 18 y Vite 7. El frontend utiliza React Router y un cliente de Supabase para autenticación y acceso a datos. El repositorio incluye pantallas para facturación comercial, productos, clientes, inventario, pedidos, cartera, reportes y otras herramientas internas.

> La presencia de código no acredita despliegue, configuración de base de datos, permisos RLS, aceptación de usuarios ni integración con facturación electrónica DIAN. Consulta la [documentación de entrega](./docs/DOCUMENTACION_CLIENTE%202/README.md) para ver alcance verificable y pendientes.

## Requisitos

- Node.js/npm compatibles con las versiones declaradas por el proyecto.
- Acceso a un proyecto Supabase configurado para la aplicación.
- Variables de entorno locales:

```dotenv
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<supabase-publishable-or-anon-key>
```

Las variables `VITE_` se incorporan al bundle del navegador. No configures claves `service_role`, contraseñas de base de datos ni otros secretos en ellas.

## Desarrollo y verificación

```bash
npm install
npm run dev
npm run lint
npm test -- --runInBand
npm run build
npm run preview
```

Revisar el lockfile para el gestor de paquetes utilizado en la entrega. La aplicación tiene PWA y almacenamiento local para determinados recursos y pedidos; las operaciones generales requieren conexión con Supabase.

## Documentación

- [Resumen ejecutivo](./docs/DOCUMENTACION_CLIENTE%202/01_EJECUTIVA/01.1_Resumen_Ejecutivo.md)
- [Propuesta comercial no vinculante](./docs/DOCUMENTACION_CLIENTE%202/01_EJECUTIVA/01.2_Propuesta_Comercial.md)
- [Arquitectura técnica](./docs/DOCUMENTACION_CLIENTE%202/02_TECNICA/02.5_Arquitectura_Tecnica.md)
- [Índice del paquete](./docs/DOCUMENTACION_CLIENTE%202/INDICE_GENERAL.md)

Confirma con el responsable del proyecto el ambiente, la versión/tag, el esquema Supabase y los procedimientos de seguridad y respaldo antes de usarlo con datos reales.
