# Índice general de documentación EBS

**Revisión:** 21 de octubre de 2026
**Estado:** paquete en revisión; consultar los límites de cada documento

La descripción de la aplicación se contrastó con el código fuente del repositorio. No se certifican con esta revisión un ambiente productivo, datos reales, backups, RLS, aceptación, cumplimiento normativo ni términos comerciales.

## 01. Ejecutiva

- [Resumen ejecutivo](./01_EJECUTIVA/01.1_Resumen_Ejecutivo.md) — capacidades identificables y pendientes de validación.
- [Propuesta comercial](./01_EJECUTIVA/01.2_Propuesta_Comercial.md) — base para cotización; no vinculante ni con precios aprobados.

## 02. Técnica

- [ERS IEEE 830](./02_TECNICA/02.0_ERS_IEEE830_Sistema_EBS.md) — requerimientos a validar y aceptar.
- [Análisis del problema](./02_TECNICA/02.1_Analisis_Problema.md) — hipótesis; requiere levantamiento con el cliente.
- [Requerimientos funcionales](./02_TECNICA/02.2_Requerimientos_Funcionales.md) — especificación, no evidencia de aceptación.
- [Plan de migración](./02_TECNICA/02.3_Plan_Migracion_Datos.md) — borrador no ejecutado.
- [Guía didáctica de migración](./02_TECNICA/02.3_Guia_Estudiantes_Migracion_Datos.md) — escenario de práctica, no caso real.
- [Diagramas](./02_TECNICA/02.4_Diagramas_Sistema.md) — vista lógica; validar esquema y despliegue.
- [Arquitectura técnica](./02_TECNICA/02.5_Arquitectura_Tecnica.md) — repositorio verificable y dependencias por confirmar.
- [Plan de respaldo](./02_TECNICA/02.6_Plan_Respaldo_Datos.md) y [resumen](./02_TECNICA/02.6.1_Resumen_Plan_Respaldo.md) — propuesta, no prueba de backups vigentes.
- [Plan de instalación](./02_TECNICA/02.7_Plan_Instalacion.md) y [resumen](./02_TECNICA/02.7.1_Resumen_Plan_Instalacion.md) — borrador, no evidencia de despliegue.
- `02.8_Proceso_Migracion_Respaldo.md` — completar y revisar antes de su uso.
- `02.3_Guia_Estudiantes_Migracion_Datos.docx` — versión editable de la guía; verificar que coincida con la versión Markdown antes de distribuir.

## 03. Legal

- [Borrador de contrato de servicios](./03_LEGAL/03.1_Contrato_Servicios.md)
- [Borrador de política de seguridad](./03_LEGAL/03.2_Politica_Seguridad.md)
- [Borrador de SLA](./03_LEGAL/03.3_SLA_Soporte.md)

Son plantillas para revisión jurídica y negociación; no están aprobadas ni firmadas, y no deben tratarse como obligaciones vigentes.

## 04. Operativa

Manual, guía rápida, preguntas frecuentes, mantenimiento, capacitación, pruebas de aceptación y acta de entrega requieren revisión contra el build y el ambiente realmente entregados. La existencia de estos archivos no significa que se hayan ejecutado pruebas o capacitación.

## 05. Presentación

- [Guion para presentación](./05_PRESENTACION/05.1_Presentacion_Cliente.md)
- [Notas del presentador](./05_PRESENTACION/05.2_Notas_Presentador.md)
- `Presentacion_EBS.pptx` y `generar_pptx.py` son versiones históricas con cifras no verificadas; no distribuir ni regenerar todavía.

El ZIP del paquete es una copia anterior y no refleja estas revisiones.

## Orden recomendado

1. Leer el [README del paquete](./README.md) y el [resumen ejecutivo](./01_EJECUTIVA/01.1_Resumen_Ejecutivo.md).
2. Confirmar alcance y condiciones con la [base comercial](./01_EJECUTIVA/01.2_Propuesta_Comercial.md).
3. Identificar versión/ambiente y revisar la [arquitectura](./02_TECNICA/02.5_Arquitectura_Tecnica.md).
4. Ejecutar y documentar aceptación, seguridad, configuración y operación antes de firmar acta de entrega.
