# Bitácora de Lecciones Aprendidas
## Proyecto: pedido-ebs-web

**Período:** Febrero 2026 - Presente  
**Responsable:** QA Lead / Tech Lead  
**Última actualización:** Febrero 5, 2026

---

## INSTRUCCIONES DE USO

Esta bitácora registra **lecciones aprendidas** a partir de:
1. Incidentes en producción
2. Defectos encontrados en testing
3. Mejoras de procesos identificadas
4. Éxitos y buenas prácticas
5. Decisiones arquitectónicas

**Formato de Registro:** Cada entrada sigue la estructura:
- **Fecha:** Cuándo se aprendió
- **Categoría:** Tipo de lección
- **Problema:** Qué salió mal o qué se aprendió
- **Causa Raíz:** Por qué sucedió
- **Solución Implementada:** Qué se hizo
- **Impacto:** Cómo mejoró
- **Acciones Preventivas:** Para evitar recurrencia
- **Aplicable a:** Otros proyectos o equipos

---

## REGISTRO DE LECCIONES APRENDIDAS

### Entrada #001
**Fecha:** 2026-02-05  
**Categoría:** 🔴 Defecto Crítico / ⭐ Buena Práctica / 🔧 Mejora de Proceso / 📚 Decisión Arquitectónica  
**Prioridad:** 🔴 Crítica / 🟠 Alta / 🟡 Media / 🔵 Baja

**Título:** Importancia de Tests Unitarios en Validación de Datos

**Problema:**
```
Se detectó en producción que un formulario de órdenes aceptaba 
valores negativos en cantidad, causando inconsistencias en 
inventario. El defecto se habría detectado inmediatamente con 
tests unitarios.
```

**Causa Raíz (RCA):**
```
1. No había tests para la función de validación
2. Code review pasó sin validar lógica de negocio
3. La lógica de validación estaba en componente React (no aislada)
```

**Solución Implementada:**
```
1. Extraer lógica de validación a módulo utils/validators.js
2. Crear tests para cada función de validación
3. Agregar validación backend en Supabase Functions
4. Requerir ≥80% cobertura de tests antes de merge
```

**Impacto:**
```
✅ Cero defectos de validación posteriores
✅ Mejor mantenibilidad del código
✅ Tests como documentación viva
✅ Confianza en cambios
```

**Acciones Preventivas:**
```
1. Checklist de code review incluye: ¿Hay tests para toda lógica?
2. Pre-commit hook bloquea commits sin tests
3. SonarQube alerta si cobertura < 80%
4. Capacitación en TDD para el equipo
```

**Aplicable a:**
```
- Todos los módulos de validación
- Otros proyectos React del equipo
- Plantilla de proyecto futuro
```

**Responsable de Seguimiento:** _____________  
**Próxima Revisión:** 2026-02-20

---

### Entrada #002
**Fecha:** Febrero, 2026  
**Categoría:** ⭐ Buena Práctica  
**Prioridad:** 🟠 Alta

**Título:** Estandarizar Nombres de Componentes Acelera Code Review

**Problema:**
```
Al revisar componentes con nombres como "Form.jsx", "Item.jsx", 
"Card.jsx", era difícil entender su propósito sin leer el código. 
Los revisores pasaban más tiempo entendiendo que revisando.
```

**Causa Raíz:**
```
1. Sin estándares de naming para componentes
2. Desarrolladores seguían intuición personal
3. Falta de guía de estilos documentada
```

**Solución Implementada:**
```
Estándar: [Contexto][Propósito].jsx
Ejemplos:
- ProductForm.jsx (no Form.jsx)
- OrderItem.jsx (no Item.jsx)
- DashboardCard.jsx (no Card.jsx)
- ReportTable.jsx (no Table.jsx)

Documento: GUIA_CODIFICACION.md
```

**Impacto:**
```
✅ Code review 30% más rápido
✅ Nuevos desarrolladores entienden código al instante
✅ Menos preguntas de clarificación
✅ Mejor documentación implícita
```

**Acciones Preventivas:**
```
1. ESLint rule para validar patrón de naming
2. Commit hook rechaza componentes con mal nombre
3. Template de componente incluye convención
4. Guía visible en Wiki del proyecto
```

**Aplicable a:**
```
- Todas las carpetas de componentes
- Guía para nuevos desarrolladores
- Otros proyectos del equipo
```

**Responsable de Seguimiento:** _____________  
**Próxima Revisión:** 2026-02-20

---

### Entrada #003
**Fecha:** Febrero, 2026  
**Categoría:** 🔧 Mejora de Proceso  
**Prioridad:** 🟡 Media

**Título:** CI/CD Manual de Testing Genera Defectos Que Llegan a Producción

**Problema:**
```
Sin pipeline automático de testing, QA manual saltaba algunos 
casos de prueba por tiempo. Defectos llegaban a producción 
después de release.
```

**Causa Raíz:**
```
1. Testing completamente manual, sin automatización
2. Casos de prueba no están documentados
3. Sin requisito de pruebas antes de merge
4. Procedimiento de release no clear
```

**Solución Implementada:**
```
1. Configurar Jest para tests unitarios automáticos
2. GitHub Actions ejecuta tests en cada push
3. Bloquear merge sin tests pasados
4. E2E tests manuales antes de producción
5. Procedimiento de release documentado

Fases del Pipeline:
- Lint → Build → Unit Tests → SonarQube → Deploy Staging → E2E → Deploy Prod
```

**Impacto:**
```
✅ 95% de defectos detectados antes de producción
✅ Releases más confiables y frecuentes
✅ Tiempo de ciclo reducido 40%
✅ Menos presión en QA manual
```

**Acciones Preventivas:**
```
1. CI/CD como requisito arquitectónico no negociable
2. No se puede ir a producción sin pipeline
3. Monitoreo de pipeline en dashboard
4. Alertas si tests tardan > 30 minutos
```

**Aplicable a:**
```
- Arquitectura de nuevos proyectos
- Upgrade de proyectos existentes
- Best practice para todo equipo
```

**Responsable de Seguimiento:** _____________  
**Próxima Revisión:** 2026-03-05

---

### Entrada #004
**Fecha:** Febrero, 2026  
**Categoría:** 📚 Decisión Arquitectónica  
**Prioridad:** 🟠 Alta

**Título:** Centralizar Lógica de Validación Reduce Duplicación y Defectos

**Problema:**
```
Lógica de validación repetida en:
- Componentes React (cliente)
- APIs REST (servidor)
- Triggers de Supabase

Inconsistencias entre validaciones causaban defectos sutiles.
```

**Causa Raíz:**
```
1. Sin arquitectura clara de dónde validar
2. Copiar-pegar código de validación
3. Sin librerías compartidas de validación
4. Falta de contrato de API clara
```

**Solución Implementada:**
```
Estructura de Validación Centralizada:
/src/lib/validators.js (Validaciones reutilizables)
├─ validateEmail()
├─ validateQuantity()
├─ validateOrderAmount()
└─ validateUserInput()

/src/hooks/useFormValidation.js (Hook para formularios)
/supabase/functions/validate/ (Validación en servidor)

Principio: VALIDAR EN AMBOS LADOS (cliente + servidor)
- Cliente: Feedback rápido al usuario
- Servidor: Seguridad y consistencia de datos
```

**Impacto:**
```
✅ 40% menos código duplicado
✅ Validaciones siempre consistentes
✅ Mantenimiento centralizado
✅ Fácil agregar nuevas validaciones
```

**Acciones Preventivas:**
```
1. Code review check: ¿Reutilizas validadores existentes?
2. ESLint rule: Validadores deben estar en /lib/validators
3. Tests para cada validador
4. Documentación de validadores disponibles
```

**Aplicable a:**
```
- Todos los formularios del proyecto
- APIs y Supabase Functions
- Librerías compartidas del equipo
```

**Responsable de Seguimiento:** _____________  
**Próxima Revisión:** 2026-02-20

---

### Entrada #005
**Fecha:** Febrero, 2026  
**Categoría:** ⭐ Buena Práctica  
**Prioridad:** 🔵 Baja

**Título:** Commits Descriptivos Facilitan RCA de Problemas

**Problema:**
```
Commit con mensaje "fix" no permite saber qué se arregló. 
Al investigar un defecto, costaba mucho encontrar qué cambio 
lo causó.
```

**Causa Raíz:**
```
1. Sin estándar de mensaje de commits
2. Desarrolladores escriben lo que quieren
3. Falta de capacitación en mejores prácticas Git
```

**Solución Implementada:**
```
Formato de Commit:
[TIPO] Descripción corta - Descripción larga (si necesario)

Tipos:
[FEAT]  - Nueva funcionalidad
[FIX]   - Corrección de bug
[REFACTOR] - Cambio de código sin nueva funcionalidad
[TEST]  - Agregar o modificar tests
[DOCS]  - Cambios en documentación
[STYLE] - Cambios de formato, sin cambiar lógica
[PERF]  - Mejora de rendimiento

Ejemplo:
[FIX] Validación de cantidad negativa en órdenes
- Añadir validación de cantidad > 0 en formulario
- Agregar tests unitarios
- Validación también en servidor
```

**Impacto:**
```
✅ Historio de Git es auto-documentado
✅ RCA 50% más rápido
✅ Blame de Git mucho más útil
✅ Mejor traceabilidad
```

**Acciones Preventivas:**
```
1. Pre-commit hook valida formato de mensaje
2. GitHub protege main: rechaza commits mal formateados
3. Template de commit en .gitmessage
4. Guía en CONTRIBUTING.md
```

**Aplicable a:**
```
- Todos los repositorios del equipo
- Estándar corporativo
- Onboarding de nuevos desarrolladores
```

**Responsable de Seguimiento:** _____________  
**Próxima Revisión:** 2026-03-05

---

## PLANTILLA PARA NUEVAS LECCIONES

Copia esta sección para registrar nuevas lecciones aprendidas:

```markdown
### Entrada #[N]
**Fecha:** [DD/MM/YYYY]  
**Categoría:** 🔴 Defecto Crítico / ⭐ Buena Práctica / 🔧 Mejora de Proceso / 📚 Decisión Arquitectónica  
**Prioridad:** 🔴 Crítica / 🟠 Alta / 🟡 Media / 🔵 Baja

**Título:** [Título corto y descriptivo]

**Problema:**
[Descripción clara del problema encontrado]

**Causa Raíz (RCA):**
[Análisis de la causa fundamental]

**Solución Implementada:**
[Qué se hizo para resolver]

**Impacto:**
[Cómo mejoró la situación]

**Acciones Preventivas:**
[Qué se hace para no repetir el problema]

**Aplicable a:**
[Otros componentes, proyectos o equipo]

**Responsable de Seguimiento:** [Nombre]  
**Próxima Revisión:** [Fecha]
```

---

## ESTADÍSTICAS DE LECCIONES

### Por Categoría
```
🔴 Defectos Críticos:        ___ (__)
⭐ Buenas Prácticas:          ___ (__)
🔧 Mejoras de Proceso:        ___ (__)
📚 Decisiones Arquitectónicas: ___ (__)
```

### Por Prioridad
```
🔴 Críticas:      ___ (__)
🟠 Altas:         ___ (__)
🟡 Medias:        ___ (__)
🔵 Bajas:         ___ (__)
```

### Impacto Acumulativo
```
Defectos prevenidos:        ___
Mejora en velocidad:        ___%
Reducción de deuda técnica: ___%
Aumento en cobertura tests: ___%
```

---

## PLANES DE ACCIÓN DERIVADOS

### Capacitación del Equipo
```
Tema                              | Fecha    | Asistentes
----------------------------------|----------|------------------
TDD y Testing en React            | 2026-02-15 | Todos devs
Estándares de Git y Commits       | 2026-02-20 | Todos
Seguridad en Frontend (OWASP)     | 2026-03-05 | Dev + QA
Validación de Datos               | 2026-03-10 | Todos
```

### Cambios a Procesos
```
[ ] Actualizar CONTRIBUTING.md con estándares
[ ] Crear pre-commit hooks
[ ] Agregar validaciones ESLint
[ ] Documentar decisiones arquitectónicas
[ ] Crear guía de buenas prácticas
```

### Cambios a Documentación
```
[ ] Actualizar README.md
[ ] Crear GUIA_CODIFICACION.md
[ ] Crear GUIA_TESTING.md
[ ] Crear GUIA_SEGURIDAD.md
[ ] Crear PROCEDIMIENTO_RELEASE.md
```

---

## REVISIÓN TRIMESTRAL

### Revisión Q1 2026 (próxima)
**Fecha:** Marzo 31, 2026  
**Revisor:** _________________

**Lecciones Implementadas Exitosamente:**
```
1. _________________________________________________
2. _________________________________________________
```

**Lecciones Pendientes de Implementar:**
```
1. _________________________________________________
2. _________________________________________________
```

**Nuevas Lecciones Identificadas:**
```
1. _________________________________________________
2. _________________________________________________
```

**Recomendaciones para Próximo Trimestre:**
```
1. _________________________________________________
2. _________________________________________________
```

---

**Propietario:** QA Lead  
**Revisión Mensual:** [Primer viernes del mes]  
**Revisión Trimestral:** [Fin de trimestre]
