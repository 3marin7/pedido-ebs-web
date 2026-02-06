# Acciones Correctivas, Preventivas y de Mejoramiento
## Proyecto: pedido-ebs-web

**Versión:** 1.0  
**Fecha de Creación:** Febrero 5, 2026  
**Última Actualización:** Febrero 5, 2026

---

## INTRODUCCIÓN

Este documento define el proceso para **identificar, clasificar, ejecutar y dar seguimiento** a tres tipos de acciones de mejora:

1. **Acciones Correctivas (AC):** Cierran un problema identificado (remedia el presente)
2. **Acciones Preventivas (AP):** Previenen que un problema vuelva a ocurrir (protege el presente)
3. **Acciones de Mejoramiento (AM):** Mejoran procesos o calidad aunque no haya problema (mejora el futuro)

---

## TIPOS DE ACCIONES

### Acciones Correctivas (AC)
**Cuándo se usan:** Cuando se detecta un defecto, falla o no conformidad.  
**Objetivo:** Eliminar la causa raíz del problema.  
**Ejemplo:** Un defecto en producción requiere corrección de código + test.

```
Problema Detectado
        ↓
Análisis RCA (Causa Raíz)
        ↓
Acción Correctiva (Remediar)
        ↓
Verificación (Test)
        ↓
Cierre
```

### Acciones Preventivas (AP)
**Cuándo se usan:** Cuando se identifica un riesgo potencial de defecto.  
**Objetivo:** Prevenir que el problema ocurra en el futuro.  
**Ejemplo:** Un patrón de código riesgoso identifica la necesidad de automatización.

```
Riesgo Identificado
        ↓
Análisis de Causa Potencial
        ↓
Acción Preventiva (Automatización/Control)
        ↓
Implementación
        ↓
Monitoreo
```

### Acciones de Mejoramiento (AM)
**Cuándo se usan:** Para mejorar procesos, rendimiento o calidad continua.  
**Objetivo:** Aumentar la eficiencia, calidad o satisfacción.  
**Ejemplo:** Mejorar el pipeline CI/CD aunque actualmente funciona.

```
Oportunidad Identificada
        ↓
Análisis de Beneficio
        ↓
Acción de Mejora (Optimizar)
        ↓
Implementación
        ↓
Medición de Impacto
```

---

## REGISTRO INTEGRAL DE ACCIONES

### AC-001: DEFECTOS CRÍTICOS EN VALIDACIÓN

**Tipo:** 🔴 Acción Correctiva  
**Severidad:** 🔴 Crítica  
**Fecha Detección:** 2026-02-05  
**Detección por:** QA / Producción / Code Review

**Problema Identificado:**
```
Formulario de órdenes acepta cantidades negativas, 
causando inconsistencias en inventario.
Defecto causa pérdida de datos en reportes.
```

**Causa Raíz (RCA):**
```
1. Sin validación en lado cliente
2. Sin validación en lado servidor
3. Sin tests unitarios para validadores
4. Lógica de validación está mezclada en componentes
```

**Impacto:**
```
Severidad: 🔴 Crítica
Usuarios Afectados: 100% (todos los usuarios)
Datos Perdidos: ~5 órdenes con datos inconsistentes
Costo de Solucion: 4 horas desarrollo + 2 horas testing
```

**Acción Correctiva Definida:**
```
AC-1.1: Extraer validadores a /src/lib/validators.js
AC-1.2: Crear tests unitarios (cobertura 100%)
AC-1.3: Agregar validación en Supabase Functions
AC-1.4: Auditar otros formularios con mismo patrón
AC-1.5: Hotfix a producción
```

**Plan de Ejecución:**

| Acción | Responsable | Inicio | Fin | Estado |
|--------|------------|--------|-----|--------|
| AC-1.1 | Dev #1 | 2026-02-05 | 2026-02-06 | 🟢 En progreso |
| AC-1.2 | Dev #2 | 2026-02-05 | 2026-02-07 | 🟢 En progreso |
| AC-1.3 | Backend | 2026-02-06 | 2026-02-08 | 🔵 Pendiente |
| AC-1.4 | QA Lead | 2026-02-08 | 2026-02-10 | 🔵 Pendiente |
| AC-1.5 | DevOps | 2026-02-10 | 2026-02-10 | 🔵 Pendiente |

**Verificación:**
```
✅ Tests pasen 100%
✅ SonarQube: 0 issues críticos
✅ Code review aprobado
✅ E2E testing en staging
✅ Deploy a producción exitoso
```

**Cierre:**
```
Fecha Cierre Prevista: 2026-02-10
Responsable Validación: QA Lead
Criterio Cierre: AC-1.1 a AC-1.5 completadas + verificadas
```

**Lecciones Aprendidas:**
→ Entrada en [05_BITACORA_LECCIONES_APRENDIDAS.md](#001)

---

### AP-001: AUTOMATIZAR TESTING DE VALIDACIÓN

**Tipo:** 🟠 Acción Preventiva  
**Severidad:** 🟠 Alta  
**Fecha Identificación:** 2026-02-05  
**Identificada por:** Análisis de Riesgos / Lección Aprendida

**Riesgo Identificado:**
```
Sin automatización de tests, problemas de validación 
similar pueden pasar a QA/producción.

Probabilidad: Alta (sin tests actuales)
Impacto: Crítico (afecta datos)
Criticidad: Alta
```

**Causa Potencial:**
```
1. Proceso de testing manual y sin automatización
2. Sin CI/CD que bloquee commits sin tests
3. Sin requisito de cobertura de tests
4. Falta de herramientas (Jest no configurado)
```

**Acción Preventiva:**
```
AP-1.1: Configurar Jest + React Testing Library
AP-1.2: Crear tests para todos los validadores
AP-1.3: Establecer requisito: ≥80% cobertura
AP-1.4: Crear pre-commit hook que bloquea sin tests
AP-1.5: Integrar tests en CI/CD (GitHub Actions)
```

**Plan de Implementación:**

| Acción | Responsable | Inicio | Fin | Estado |
|--------|------------|--------|-----|--------|
| AP-1.1 | DevOps | 2026-02-08 | 2026-02-12 | 🔵 Pendiente |
| AP-1.2 | QA Lead | 2026-02-10 | 2026-02-20 | 🔵 Pendiente |
| AP-1.3 | Tech Lead | 2026-02-12 | 2026-02-13 | 🔵 Pendiente |
| AP-1.4 | DevOps | 2026-02-13 | 2026-02-15 | 🔵 Pendiente |
| AP-1.5 | DevOps | 2026-02-15 | 2026-02-20 | 🔵 Pendiente |

**Beneficios Esperados:**
```
✅ Previene 95% de defectos de validación
✅ Feedback inmediato en desarrollo
✅ Cobertura medible de código
✅ Confianza en cambios
✅ Reducción de ciclo de desarrollo
```

**Métricas de Éxito:**
```
- 0 defectos de validación en siguiente mes
- ≥80% cobertura de tests
- Tiempo de ciclo < 7 días
- Release frequency: 2/mes
```

**Monitoreo:**
```
Frecuencia: Diaria en Sprint, Semanal en Monitoring
Métrica: % Tests pasados, Cobertura, Defectos escapados
Escalación: Si cobertura < 70% o defectos > 1/mes
```

---

### AM-001: MEJORAR PIPELINE CI/CD

**Tipo:** 🟢 Acción de Mejoramiento  
**Impacto Esperado:** 🟠 Alto  
**Fecha Propuesta:** 2026-02-20  
**Propuesta por:** Tech Lead / DevOps

**Oportunidad de Mejora:**
```
Actual: Deployments manuales, testing no automatizado
Deseado: Pipeline automático end-to-end
Beneficio: Reducir tiempo ciclo 50%, defectos en prod 80%
```

**Mejoras Identificadas:**

| # | Mejora | Beneficio | Esfuerzo | ROI |
|---|--------|-----------|----------|-----|
| 1 | Linting automático en cada commit | Mejor código | 4h | Alto |
| 2 | Unit tests automáticos | Menos bugs | 8h | Muy Alto |
| 3 | SonarQube en CI | Quality gate | 4h | Alto |
| 4 | E2E tests en staging | Confianza | 12h | Muy Alto |
| 5 | Auto-deploy a dev | Feedback rápido | 4h | Medio |
| 6 | Manual approve para prod | Control | 2h | Alto |

**Implementación:**

| Fase | Actividades | Timeline | Responsable |
|------|-------------|----------|-------------|
| 1 | Configurar GitHub Actions | 2026-02-20 a 02-24 | DevOps |
| 2 | Agregar linting + build | 2026-02-25 a 02-27 | DevOps + Dev |
| 3 | Integrar Jest tests | 2026-02-28 a 03-05 | QA Lead |
| 4 | Agregar SonarQube | 2026-03-06 a 03-10 | Tech Lead |
| 5 | E2E tests básicos | 2026-03-11 a 03-15 | QA |
| 6 | Documentar y entrenar | 2026-03-16 a 03-20 | Tech Lead |

**Métricas de Éxito:**
```
Before (Actual):
- Tiempo ciclo: 14 días
- Defectos en prod/mes: ~5
- Cobertura tests: 20%
- Release frecuencia: 1/mes

After (Esperado):
- Tiempo ciclo: 7 días (50% reducción)
- Defectos en prod/mes: ~1 (80% reducción)
- Cobertura tests: 80% (4x mejora)
- Release frecuencia: 2/mes (2x mejora)
```

**Inversión vs Beneficio:**
```
Esfuerzo: 34 horas (4-5 días)
Beneficio Anual: 
  - Menos defectos: $5,000 (evitados)
  - Productividad: $10,000 (menos manual)
  - Confianza: No cuantificable pero crítico
  
ROI: > 200%
```

**Plan de Seguimiento:**
```
Semanal: Revisión de progreso en standup
Bi-weekly: Revisión con stakeholders
Mensual: Medición de métricas vs baseline
```

---

## MATRIZ RESUMEN DE ACCIONES

### Todas las Acciones Activas (2026-02)

| ID | Tipo | Descripción | Severidad | Responsable | Estado | Fin Prevista |
|----|------|-------------|-----------|-------------|--------|-------------|
| AC-001 | 🔴 Correctiva | Validación defectuosa | 🔴 Crítica | Dev #1 | 🟢 En progreso | 2026-02-10 |
| AP-001 | 🟠 Preventiva | Automatizar testing | 🟠 Alta | QA Lead | 🔵 Pendiente | 2026-02-20 |
| AP-002 | 🟠 Preventiva | Estándares de código | 🟠 Alta | Tech Lead | 🔵 Pendiente | 2026-02-20 |
| AM-001 | 🟢 Mejora | Mejorar CI/CD | 🟠 Alto | DevOps | 🔵 Pendiente | 2026-03-20 |
| AM-002 | 🟢 Mejora | Monitoreo en prod | 🟡 Medio | DevOps | 🔵 Pendiente | 2026-03-10 |

**Leyenda Estados:**
- 🔵 Pendiente (No iniciada)
- 🟢 En progreso (En ejecución)
- 🟡 En revisión (Esperando aprobación)
- 🟠 Bloqueada (Esperando dependencia)
- ✅ Cerrada (Completada)

---

## PROCESO DE GESTIÓN DE ACCIONES

### 1. Identificación

**Fuentes:**
- ✅ Defectos en producción
- ✅ Hallazgos en code review
- ✅ Resultados de testing
- ✅ Auditorías de proceso
- ✅ Análisis de tendencias
- ✅ Feedback de usuarios
- ✅ Reuniones de retrospectiva

**Quién puede proponer:**
- Cualquier miembro del equipo
- QA Lead
- Tech Lead
- Product Owner
- Stakeholders

### 2. Análisis y Clasificación

```
Problema → ¿Hay defecto actual?
             ├─ Sí  → Acción CORRECTIVA
             └─ No  → ¿Es un riesgo?
                       ├─ Sí  → Acción PREVENTIVA
                       └─ No  → Acción de MEJORA
```

### 3. Planificación

Para cada acción:
- [ ] Definir causa raíz (RCA si correctiva)
- [ ] Detallar plan de ejecución
- [ ] Asignar responsable
- [ ] Estimar esfuerzo
- [ ] Establecer criterios de cierre
- [ ] Documentar beneficios esperados

### 4. Ejecución

- [ ] Crear tickets en sistema (GitHub Issues / Jira)
- [ ] Asignar a responsables
- [ ] Dar seguimiento en standup
- [ ] Registrar progreso
- [ ] Comunicar bloqueadores

### 5. Verificación y Cierre

- [ ] Validar criterios de cierre
- [ ] Código review si aplica
- [ ] Testing de cambios
- [ ] Aprobación de stakeholder
- [ ] Cierre formal

### 6. Lecciones Aprendidas

- [ ] Documentar en bitácora
- [ ] Compartir conocimiento
- [ ] Actualizar procesos si necesario
- [ ] Mejorar controles preventivos

---

## PLANTILLA PARA NUEVA ACCIÓN

Copia y completa para registrar nuevas acciones:

```markdown
### [AC/AP/AM]-[###]: [TÍTULO DESCRIPTIVO]

**Tipo:** 🔴 Correctiva / 🟠 Preventiva / 🟢 Mejora  
**Severidad:** 🔴 Crítica / 🟠 Alta / 🟡 Media / 🔵 Baja  
**Fecha:** [DD/MM/YYYY]  
**Identificado por:** [Nombre]

**Descripción del Problema/Oportunidad:**
[Descripción clara del problema o mejora]

**Causa Raíz / Análisis:**
[Por qué ocurre o por qué es una oportunidad]

**Impacto:**
[Qué consecuencias tiene]

**Acciones Definidas:**
- [AC/AP/AM-#.#: Descripción]
- [AC/AP/AM-#.#: Descripción]

**Plan de Ejecución:**

| Acción | Responsable | Inicio | Fin | Estado |
|--------|------------|--------|-----|--------|
| | | | | |

**Criterios de Cierre:**
- [ ] 
- [ ] 

**Beneficios Esperados:**
```

---

## TABLERO DE CONTROL

### Estado Actual (Febrero 2026)

```
ACCIONES CORRECTIVAS
├─ Total: 1
├─ Abiertas: 1 (100%)
├─ En progreso: 1
├─ Criticidad Promedio: 🔴 Crítica
└─ Tiempo Promedio Cierre: 5 días

ACCIONES PREVENTIVAS
├─ Total: 2
├─ Pendientes: 2 (100%)
├─ Beneficio de Implementación: 95% reducción defectos
└─ Timeline: 2 semanas

ACCIONES DE MEJORA
├─ Total: 2
├─ Pendientes: 2 (100%)
├─ Impacto Esperado: Tiempo ciclo -50%
└─ Inversión: 34 horas

TOTAL EN CARTERA: 5 acciones
CRITICIDAD: 1 Crítica, 2 Altas, 2 Medias
VENCIMIENTO PRÓXIMO: 2026-02-10 (AC-001)
```

---

## RESPONSABILIDADES Y ESCALACIÓN

### Propietarios por Tipo

| Tipo | Propietario | Revisor | Escalación |
|------|------------|---------|-----------|
| Correctiva | QA Lead + Dev | Tech Lead | CTO (si > 5 días) |
| Preventiva | Tech Lead | QA Lead | Tech Lead |
| Mejora | Propositor | Tech Lead | Product Owner |

### Comité de Revisión

- **Frecuencia:** Semanal (viernes)
- **Participantes:** QA Lead, Tech Lead, Product Owner
- **Duración:** 30 minutos
- **Agenda:**
  1. Estado de acciones en progreso
  2. Bloqueadores y escalaciones
  3. Acciones nuevas para priorización
  4. Cierre de acciones completadas

---

## MÉTRICAS DE GESTIÓN DE ACCIONES

### Indicadores Clave (KPIs)

```
1. CAPACIDAD DE CIERRE
   Target: 90% acciones cierren en tiempo planeado
   Actual: ____%
   Trend: ↑ ↓ →

2. EFECTIVIDAD CORRECTIVAS
   Target: 0 re-apertura de AC por mismo motivo
   Actual: ___
   Trend: ↑ ↓ →

3. EFECTIVIDAD PREVENTIVAS
   Target: 0 incidentes de tipo identificado
   Actual: ___
   Trend: ↑ ↓ →

4. IMPACTO DE MEJORAS
   Target: Beneficios realizados ≥ 80% planeado
   Actual: ____%
   Trend: ↑ ↓ →
```

---

**Responsable:** QA Lead  
**Revisión:** Semanal (viernes)  
**Próxima Actualización:** 2026-02-12
