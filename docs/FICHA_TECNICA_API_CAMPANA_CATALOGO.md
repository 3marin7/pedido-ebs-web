# Ficha Tecnica de Software - Campana Catalogo API

## 1. Informacion general del software

- Nombre del software: Campana Catalogo API (modulo del sistema pedido-ebs-web)
- Tipo de software: Aplicacion web empresarial (frontend React + integracion con API REST)
- Nivel TRL: TRL 7 (estimado), prototipo funcional validado en entorno operativo

## 2. Proyecto de investigacion relacionado

- Titulo del proyecto: Digitalizacion de procesos comerciales para EBS  (facturacion, cartera, inventario y campanas de catalogo)
- Codigo del proyecto: Pendiente por definir (coming 17 mayo 2026)
- Ano: 2026
- Objetivo general del api en el proyecto : Disenar e implementar en la  plataforma web una vista para optimizar la gestion de clientes, ventas, cartera y distribucion digital de catalogos mediante criterios de negocio y automatizacion de comunicaciones.

## 3. Desarrolladores

| Nombre completo | CC y lugar de expedicion | Correo | Grupo de investigacion |
|-ebs--|-manager--|--ebs@gmail.com-|--sistemas-|
| 
\
## 4. Descripcion del producto

### Problema o necesidad que soluciona

El proceso de seleccion de clientes para envio de catalogos y seguimiento comercial suele hacerse de forma manual, con riesgo de errores, baja trazabilidad y poca consistencia en reglas de cartera. El modulo Campana Catalogo API centraliza datos de clientes, facturas, abonos e historial para priorizar clientes aptos y ejecutar envios por WhatsApp con criterios objetivos.

### Descripcion tecnica del software

- Componente principal: src/components/CampanaCatalogoApi.jsx
- Framework: React 18 + Vite 7
- Integracion API REST configurable por Base URL (localStorage)
- Endpoints consumidos:
  - /campanas/catalogo/dashboard
  - /clientes
  - /facturas
  - /abonos
  - /campanas/catalogo/historial
  - /config/public-url
  - /campanas/catalogo/enviar-whatsapp
- Logica funcional:
  - Normalizacion de datos de clientes/facturas/abonos
  - Calculo local de elegibilidad por reglas de negocio
  - Scoring de prioridad de campana
  - Fallback operativo cuando API no responde (modo demo / WhatsApp directo)

### Usuarios objetivo

- Administrador
- Superadministrador
- Vendedor
- Equipo comercial y de cartera

## 5. Caracteristicas novedosas y valor agregado

- Calculo local de elegibilidad con datos de API para mantener consistencia de negocio.
- Reglas parametrizables (saldo, facturas pendientes, atraso, clasificacion, dias de reenvio).
- Integracion directa con flujo de WhatsApp para accion comercial inmediata.
- Capacidad de operar en modo de respaldo cuando el backend no esta disponible.
- Vista de comparacion para validar resultados de API frente a logica de negocio existente.

## 6. Pertinencia e impacto

### Impacto academico

- Caso aplicable de ingenieria de software orientada a procesos reales de negocio.
- Evidencia de aplicacion de arquitectura cliente-API, validacion de reglas y trazabilidad de decisiones.

### Impacto social/economico

- Mejora la productividad comercial al priorizar clientes con mayor probabilidad de conversion.
- Reduce reprocesos y riesgos de envio no pertinente por cartera.
- Favorece control de cobranza y comunicacion segmentada.

## 7. Interfaz de usuario

### Descripcion de interfaces y experiencia de uso

- Ruta de acceso: /campana-catalogo-api
- Pantallas principales:
  - Configuracion de Base URL de API
  - Configuracion de URL publica para compartir
  - Panel de reglas de negocio y filtros
  - Listado de clientes aptos/no aptos con justificacion
  - Acciones por cliente: enviar por WhatsApp, copiar enlace
- Enfoque UX: vista operacional para decisiones rapidas, con mensajes de estado, retroalimentacion de acciones y degradacion controlada ante fallos.

## 8. Instalacion y despliegue

### Requisitos de instalacion (hardware/software)

- Node.js 18+ (recomendado)
- npm 9+ (o equivalente)
- Navegador moderno (Chrome, Edge, Firefox)
- Variables de entorno para integraciones (Supabase/Cloudinary segun modulo)

### Pasos de instalacion

1. Clonar el repositorio.
2. Instalar dependencias:
   - npm install
3. Configurar variables de entorno en archivo .env (segun guia del proyecto).
4. Ejecutar en desarrollo:
   - npm run dev
5. Compilar para produccion:
   - npm run build
6. Desplegar frontend (ej. Vercel) y publicar API backend.
7. En la interfaz Campana Catalogo API, guardar:
   - Base URL de API
   - URL publica final del catalogo

## 9. Software previo o relacionado

- CampanaCatalogo (vista previa/base sin enfoque API configurable)
- Supabase REST API (auto-generada) para datos transaccionales
- Integracion WhatsApp (enlace wa.me y endpoint enviar-whatsapp)

## 10. Documentacion y evidencias

| Documento / Evidencia | Disponible (Si/No) | Ruta o enlace |
|---|---|---|
| Manual de usuario | Si | docs/DOCUMENTACION_CLIENTE 2/04_OPERATIVA |
| Manual tecnico | Si | docs/DOCUMENTACION_CLIENTE 2/02_TECNICA |
| Repositorio de codigo | Si | README.md |
| Evidencias de pruebas | Si | QA/ |

## 11. Etapas de desarrollo (resumen)

### Analisis

Identificacion de inconsistencia entre vistas y necesidad de una version orientada a API con reglas uniformes de seleccion comercial.

### Disenio

Diseno de arquitectura cliente-API con normalizacion de payloads heterogeneos y calculo local de elegibilidad/scoring.

### Implementacion

Desarrollo del componente CampanaCatalogoApi con configuracion dinamica de endpoints, filtros, reglas editables, historico y acciones de envio.

### Validacion

Pruebas funcionales en entorno web, revision de resultados comparables con vista anterior y validacion de degradacion controlada (modo demo/fallback).

## 12. Firmas

- Firma responsable del proyecto: ______________________________
- Firma coordinacion / reviso: ______________________________

---

## Anexo de campos pendientes por completar

- Codigo formal del proyecto de investigacion
- Listado oficial de desarrolladores (nombre, CC, correo, grupo)
- Confirmacion institucional del nivel TRL
- Enlaces publicos finales (produccion) de frontend y backend
