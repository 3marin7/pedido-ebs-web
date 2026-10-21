# Estado de revisión de la documentación EBS

**Fecha:** 21 de octubre de 2026
**Alcance:** carpeta `DOCUMENTACION_CLIENTE 2` y contraste con el repositorio `pedido-ebs-web`

## Cambios realizados

- Se reescribieron el resumen ejecutivo y la propuesta comercial para describir el producto visible en el código sin inventar pérdidas, ROI, tarifas, cronogramas, soporte o garantías.
- Se reemplazó la arquitectura técnica por una descripción de React/Vite, Supabase, roles, integraciones y modo offline parcial, separando hechos del repositorio de datos pendientes del entorno.
- Se actualizaron análisis, diagramas, ERS, requerimientos, plan de migración, instalación y respaldo para identificar hipótesis, borradores y verificaciones no realizadas.
- Se reescribieron contrato, política de seguridad y SLA como plantillas no vinculantes: se retiraron multas, importes, horarios, disponibilidad y controles no sustentados, dejando los campos sujetos a negociación y revisión jurídica.
- Se corrigió el índice y la guía del paquete para no presentar archivos inexistentes como pendientes ni afirmar aprobación, producción o pruebas que no constan en la evidencia disponible.
- La guía estudiantil de migración quedó identificada como ejercicio didáctico, no como historia real del proyecto.

## Conclusiones de la comparación

El repositorio contiene una aplicación React 18/Vite 7, rutas y componentes para distintos procesos comerciales, cliente Supabase, configuración PWA y una cola offline limitada a pedidos. La autenticación consulta perfiles y las rutas internas se protegen en el frontend.

No se pudo confirmar con los archivos revisados el proveedor/URL de producción, región/plan de Supabase, esquema completo, RLS, ejecución de migraciones, backup/restauración, dominio, cuenta de Cloudinary, integración DIAN, pruebas de aceptación, capacitación, soporte contratado, ROI ni costos. Por eso esos elementos se dejan pendientes, no como hechos.

## Pendientes antes de llamar al paquete “entrega final”

1. Identificar el commit/tag y el build exactos que se entregan.
2. Verificar la configuración y permisos reales de Supabase, hosting e imágenes.
3. Ejecutar y conservar resultados de pruebas funcionales, de permisos y de restauración.
4. Validar la guía de usuario, los documentos legales y la versión DOCX de la guía de migración.
5. Completar datos del cliente y aprobar precio, responsabilidades, SLA, soporte y tratamiento de datos por escrito.
6. Firmar acta de aceptación solo después de validar el ambiente y los criterios acordados.
7. Actualizar `Presentacion_EBS.pptx`, `generar_pptx.py`, la versión DOCX de la guía y el ZIP antes de distribuir el paquete completo.

## Limitación de alcance

La revisión se basa en archivos del repositorio; no incluye acceso a consolas de servicios, entrevistas con usuarios, pruebas en un ambiente productivo ni asesoría legal/tributaria. La carpeta contiene además documentos operativos y legales que requieren revisión especializada antes de su distribución.
