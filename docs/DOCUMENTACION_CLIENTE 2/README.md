# Documentación del sistema EBS

**Revisión del paquete:** 21 de octubre de 2026

Este paquete acompaña el repositorio `pedido-ebs-web`. La documentación ejecutiva y técnica se contrastó con el código fuente disponible. Esa revisión acredita funciones visibles en el repositorio, pero no certifica un despliegue, datos reales, configuración de Supabase, aceptación del cliente ni compromisos comerciales.

## Empezar aquí

- **Gerencia:** [Resumen ejecutivo](./01_EJECUTIVA/01.1_Resumen_Ejecutivo.md) y [base para propuesta comercial](./01_EJECUTIVA/01.2_Propuesta_Comercial.md).
- **Equipo técnico:** [Análisis y supuestos](./02_TECNICA/02.1_Analisis_Problema.md), [ERS](./02_TECNICA/02.0_ERS_IEEE830_Sistema_EBS.md), [requerimientos funcionales](./02_TECNICA/02.2_Requerimientos_Funcionales.md), [diagramas](./02_TECNICA/02.4_Diagramas_Sistema.md) y [arquitectura técnica](./02_TECNICA/02.5_Arquitectura_Tecnica.md).
- **Instalación, migración y respaldo:** los archivos de la sección técnica son borradores/procedimientos propuestos hasta que se validen contra los servicios y datos reales.

## Contenido

### 01 — Ejecutiva

- `01.1_Resumen_Ejecutivo.md`: alcance presente en el código y límites de lo que la revisión puede confirmar.
- `01.2_Propuesta_Comercial.md`: base no vinculante; precios, soporte, hosting y cronograma quedan pendientes de acuerdo.

### 02 — Técnica

- `02.0_ERS_IEEE830_Sistema_EBS.md`
- `02.1_Analisis_Problema.md`
- `02.2_Requerimientos_Funcionales.md`
- `02.3_Plan_Migracion_Datos.md`
- `02.3_Guia_Estudiantes_Migracion_Datos.md` (material didáctico, no caso real)
- `02.4_Diagramas_Sistema.md`
- `02.5_Arquitectura_Tecnica.md`
- `02.6_Plan_Respaldo_Datos.md` y `02.6.1_Resumen_Plan_Respaldo.md`
- `02.7_Plan_Instalacion.md` y `02.7.1_Resumen_Plan_Instalacion.md`
- `02.8_Proceso_Migracion_Respaldo.md` (validar contenido antes de usar)

### 03 — Legal y 04 — Operativa

Los documentos [contrato](./03_LEGAL/03.1_Contrato_Servicios.md), [política de seguridad](./03_LEGAL/03.2_Politica_Seguridad.md) y [SLA](./03_LEGAL/03.3_SLA_Soporte.md) se dejaron como plantillas de negociación con datos y obligaciones pendientes. No son asesoría legal, no están aprobados ni firmados y requieren revisión de abogado colombiano y de las partes.

### 05 — Presentación

El guion y las notas Markdown se actualizaron. `Presentacion_EBS.pptx` y `generar_pptx.py` conservan cifras y compromisos anteriores no verificados; no distribuir ni regenerar hasta actualizarlos. El archivo `DOCUMENTACION_CLIENTE 2.zip` también es una copia anterior y no contiene las revisiones actuales.

## Hechos que requieren validación externa

El repositorio no acredita proveedor/URL de producción, región o plan Supabase, esquema completo, políticas RLS, backups y restauraciones, dominio, titularidad de servicios, cumplimiento DIAN, resultados financieros, usuarios capacitados, SLA, precios ni firma de aceptación. Consultar la arquitectura y la propuesta antes de comunicar estos puntos como compromisos.

## Control del paquete

Actualizar esta documentación junto con la versión/tag que se entregue. Antes de la entrega final, registrar ambiente, pruebas ejecutadas, resultados, responsables y aprobaciones. No distribuir una copia comprimida antigua si no refleja estos cambios.
