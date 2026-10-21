# Estado y alcance de la documentación del sistema EBS

**Revisión:** 21 de octubre de 2026

Este archivo sirve como índice del paquete. La revisión se realizó contra el repositorio fuente, no contra un ambiente de producción ni acuerdos firmados. No presentar el paquete como “100% completo”, “aprobado” o listo para firmar sin validar los pendientes.

## Documentos principales

- Ejecutiva: `01_EJECUTIVA/01.1_Resumen_Ejecutivo.md` y `01_EJECUTIVA/01.2_Propuesta_Comercial.md`.
- Técnica: documentos `02_TECNICA/02.0` a `02.8`; requisitos, arquitectura y procesos deben revisarse con cliente y administrador del ambiente.
- Legal: `03_LEGAL/`; requiere revisión legal, partes y aprobación.
- Operativa: `04_OPERATIVA/`; contrastar pasos con la versión y ambiente entregados antes de capacitación.
- Presentación: `05_PRESENTACION/`; el PowerPoint y su generador conservan cifras y promesas anteriores no verificadas. **No distribuir ni volver a generar hasta actualizarlos.**

## Qué se verificó

El código fuente incluye una aplicación React 18/Vite 7, cliente Supabase, rutas con protección frontend, módulos comerciales diversos y soporte offline parcial para recursos y pedidos. La arquitectura documenta los límites de esta evidencia.

## Qué no se verificó

No se confirmó despliegue/URL, proveedor, configuración del proyecto Supabase, esquema completo, políticas RLS, backups o restauraciones, DIAN, resultados comerciales, pruebas de aceptación, capacitación, costos, soporte/SLA o firmas.

## Antes de distribuir

1. Identificar versión/tag y ambiente exactos.
2. Validar configuración y permisos con el administrador de servicios.
3. Aprobar alcance y condiciones comerciales por escrito.
4. Ejecutar pruebas y registrar resultados/aceptación.
5. Actualizar DOCX, PowerPoint, generador de diapositivas y archivo ZIP; no usar copias históricas como material de entrega.
