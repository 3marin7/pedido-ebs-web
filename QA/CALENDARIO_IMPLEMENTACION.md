# CALENDARIO DE IMPLEMENTACIÓN
## Plan de Aseguramiento de Calidad - pedido-ebs-web

**Período:** Febrero - Diciembre 2026  
**Duración Total:** 11 meses  
**Intensidad:** 4 semanas iniciales (setup) + operación normal

---

## 📅 RESUMEN EJECUTIVO DEL TIMELINE

```
Mes 1 (Feb)     │ Setup Base           │ ███░░░░░░░░ 30% del esfuerzo total
Mes 2-3 (Mar-Abr) │ Implementación    │ ████░░░░░░░ 40% del esfuerzo total
Mes 4-6 (May-Jul) │ Operación Normal  │ ██░░░░░░░░░ 15% del esfuerzo total
Mes 7-12 (Ago-Dic)│ Sostenimiento     │ █░░░░░░░░░░ 15% del esfuerzo total
```

---

## 🎯 FASE 1: SETUP BASE (Febrero 5-29, 2026)

### Objetivo
Instalar y configurar herramientas fundamentales de QA.

### Semana 1: Distribución y Kickoff (Feb 5-9)

**Lunes 5 de Febrero**
```
📋 Tareas:
├─ [ ] Crear carpeta /QA con toda documentación (HECHO ✅)
├─ [ ] Compartir docs con el equipo
├─ [ ] Crear archivo README.md en /QA
└─ [ ] Agenda kickoff meeting

⏱️ Tiempo: 2 horas
👤 Responsable: QA Lead / Tech Lead
```

**Martes 6 de Febrero**
```
📋 Tareas:
├─ [ ] Reunión kickoff (1 hora)
│  ├─ Presentar visión de QA
│  ├─ Explicar documentos
│  └─ Q&A del equipo
├─ [ ] Asignación de roles
├─ [ ] Capacitación de 30 min en GUIA_RAPIDA_QA.md
└─ [ ] Scheduling de lecturas individuales

⏱️ Tiempo: 3 horas
👤 Responsable: QA Lead
```

**Miércoles 7 - Viernes 9**
```
📋 Tareas Individuales (por rol):

Dev Team (cada desarrollador):
├─ [ ] Lee 00_INDICE_MAESTRO.md (15 min)
├─ [ ] Lee GUIA_RAPIDA_QA.md (30 min)
├─ [ ] Entiende procesos de desarrollo (30 min)
└─ [ ] Hace preguntas (30 min)

QA Lead:
├─ [ ] Lee 01_PLAN_ASEGURAMIENTO_CALIDAD.md (90 min)
├─ [ ] Revisa 03_MATRIZ_EVALUACION_CALIDAD.md (60 min)
└─ [ ] Planifica métricas baseline (45 min)

Tech Lead:
├─ [ ] Lee 02_IMPLEMENTACION_PRACTICA.md (90 min)
├─ [ ] Revisa configuraciones técnicas (45 min)
└─ [ ] Planifica setup de herramientas (45 min)

⏱️ Tiempo: Distribuido (2-3 horas por persona)
```

### Semana 2: Fase 1 de Implementación (Feb 10-16)

**Objetivo:** Instalar y configurar Jest, ESLint, estructura base

```
Lunes 10:
├─ [ ] Tech Lead: Instalar Jest y dependencias
│       Command: npm install --save-dev jest @testing-library/react
├─ [ ] DevOps: Crear jest.config.cjs
├─ [ ] Dev: Crear carpeta __tests__
└─ ⏱️ 2 horas

Martes 11:
├─ [ ] DevOps: Configurar .babelrc
├─ [ ] DevOps: Crear setupTests.js
├─ [ ] Dev: Instalar mocks de archivos
└─ ⏱️ 1.5 horas

Miércoles 12:
├─ [ ] Tech Lead: Mejorar ESLint config
├─ [ ] DevOps: Configurar Prettier
├─ [ ] Dev: npm run lint (verificar)
└─ ⏱️ 2 horas

Jueves 13:
├─ [ ] Tech Lead: Crear scripts npm en package.json
├─ [ ] Dev: Ejecutar tests (npm test)
├─ [ ] QA: Documentar estado en ESTADO_DEL_PROYECTO
└─ ⏱️ 1.5 horas

Viernes 14:
├─ [ ] Reunión de revisión (30 min)
├─ [ ] Demo de herramientas (30 min)
├─ [ ] Actualizar Bitácora (30 min)
└─ ⏱️ 1.5 horas

TOTAL SEMANA 2: ~8 horas
Responsable: Tech Lead + DevOps + Dev Team
```

### Semana 3: Fase 2 de Implementación (Feb 17-23)

**Objetivo:** Pre-commit hooks, validación automática

```
Lunes 17:
├─ [ ] DevOps: Instalar Husky
│       npm install --save-dev husky
├─ [ ] DevOps: npx husky install
├─ [ ] DevOps: Crear .husky/pre-commit
└─ ⏱️ 1.5 horas

Martes 18:
├─ [ ] DevOps: Crear validate-commit-msg.js
├─ [ ] DevOps: Crear .husky/prepare-commit-msg
├─ [ ] Dev: Probar con commits válidos e inválidos
└─ ⏱️ 2 horas

Miércoles 19:
├─ [ ] DevOps: Crear pre-commit hook final
├─ [ ] Dev: Todos prueban commits
├─ [ ] QA Lead: Documentar proceso
└─ ⏱️ 1.5 horas

Jueves 20:
├─ [ ] Tech Lead: Revisar configuración
├─ [ ] Dev: Crear 3 tests de ejemplo
├─ [ ] QA: Validar que pre-commit funciona
└─ ⏱️ 2 horas

Viernes 21:
├─ [ ] Reunión de revisión (30 min)
├─ [ ] Q&A sobre hooks (30 min)
├─ [ ] Actualizar documentación (30 min)
└─ ⏱️ 1.5 horas

TOTAL SEMANA 3: ~8.5 horas
Responsable: DevOps + Tech Lead
```

### Semana 4: Fase 3 de Implementación (Feb 24-29)

**Objetivo:** GitHub Actions CI/CD básico

```
Lunes 24:
├─ [ ] DevOps: Crear .github/workflows/test.yml
├─ [ ] DevOps: Crear .github/workflows/build.yml
├─ [ ] Tech Lead: Revisar configuración
└─ ⏱️ 2 horas

Martes 25:
├─ [ ] DevOps: Test de workflows
├─ [ ] Dev: Hacer push a rama de prueba
├─ [ ] Verificar que GitHub Actions corre
└─ ⏱️ 1.5 horas

Miércoles 26:
├─ [ ] Tech Lead: Configurar branch protection
├─ [ ] DevOps: Bloquear merge sin CI pasado
├─ [ ] QA: Documentar proceso
└─ ⏱️ 2 horas

Jueves 27:
├─ [ ] Dev: Todos hacen un PR de prueba
├─ [ ] Verificar: CI runs automáticamente
├─ [ ] Verificar: Can't merge sin CI pasado
└─ ⏱️ 1.5 horas

Viernes 28:
├─ [ ] Reunión mensual de cierre (1 hora)
├─ [ ] Revisión de progreso
├─ [ ] Lecciones aprendidas de mes 1
└─ ⏱️ 1.5 horas

TOTAL SEMANA 4: ~8.5 horas
Responsable: DevOps + Tech Lead + Dev Team
```

### TOTAL FEBRERO: ~25 horas
**Estado esperado:** 
- ✅ Jest instalado y funcionando
- ✅ ESLint configurado
- ✅ Pre-commit hooks activos
- ✅ GitHub Actions básico
- ✅ Equipo capacitado

---

## 🎯 FASE 2: TESTING BASE (Marzo 1 - Abril 30, 2026)

### Objetivo
Implementar cobertura de tests base y operación normal.

### Semana 1-2 de Marzo (Mar 1-14)

```
Actividad Principal: Escribir Tests

Lunes-Miércoles:
├─ [ ] Dev #1: 5 tests de validadores
├─ [ ] Dev #2: 5 tests de componentes
├─ [ ] QA: Code review de tests
└─ ⏱️ 8 horas desarrollo + 2 horas review

Jueves-Viernes:
├─ [ ] Dev Team: Revisar cobertura
├─ [ ] Target: ≥60% coverage
├─ [ ] Documentar en BITACORA
└─ ⏱️ 2 horas

TOTAL: 12 horas
Resultado esperado: 10+ tests, 60%+ cobertura
```

### Semana 3-4 de Marzo (Mar 15-29)

```
Actividad Principal: Estándares de Equipo

Lunes-Martes:
├─ [ ] Tech Lead: Crear GUIA_CODIFICACION.md
├─ [ ] Tech Lead: Crear CODE_REVIEW_CHECKLIST.md
├─ [ ] Reunión: Alinear estándares (1 hora)
└─ ⏱️ 4 horas

Miércoles-Viernes:
├─ [ ] Dev Team: Aplicar estándares a commits
├─ [ ] Code reviews usando checklist
├─ [ ] First pull requests con nuevo estándar
└─ ⏱️ 2 horas

TOTAL: 6 horas
Resultado esperado: Estándares implementados
```

### Semana 1-2 de Abril (Abr 1-14)

```
Actividad Principal: Ampliación de Testing

Lunes-Miércoles:
├─ [ ] Dev #1: 5 tests de hooks
├─ [ ] Dev #2: 5 tests de integración API
├─ [ ] QA: Review y documentación
└─ ⏱️ 8 horas desarrollo

Jueves-Viernes:
├─ [ ] Alcanzar ≥70% cobertura
├─ [ ] Actualizar ESTADO_DEL_PROYECTO
└─ ⏱️ 2 horas

TOTAL: 10 horas
Resultado esperado: 20+ tests, 70%+ cobertura
```

### Semana 3-4 de Abril (Abr 15-29)

```
Actividad Principal: Primer Informe de QA

Lunes-Miércoles:
├─ [ ] QA Lead: Completar 04_INFORME_EVALUACION
├─ [ ] Recopilar métricas mes 1-2
├─ [ ] Calcular scores de calidad
└─ ⏱️ 6 horas

Jueves:
├─ [ ] Reunión con stakeholders (1 hora)
├─ [ ] Presentar informe de calidad
└─ ⏱️ 1 hora

Viernes:
├─ [ ] Documentar lecciones en BITACORA
├─ [ ] Definir acciones de mejora
└─ ⏱️ 1.5 horas

TOTAL: 8.5 horas
Resultado esperado: Primer informe presentado
```

### TOTAL MARZO-ABRIL: ~36.5 horas
**Estado esperado:**
- ✅ 20+ tests unitarios
- ✅ 70%+ cobertura
- ✅ Estándares de equipo definidos
- ✅ Primer informe de calidad
- ✅ Acciones de mejora identificadas

---

## 🎯 FASE 3: MADURACIÓN (Mayo - Julio 2026)

### Objetivo
Alcanzar 80%+ cobertura y operación sostenible.

### Mayo (3 semanas de pruebas, 1 de revisión)
```
Actividades:
├─ Ampliar tests a 30+ unitarios
├─ Alcanzar 75%+ cobertura
├─ Testing de componentes complejos
├─ E2E testing basic (manual)
└─ ⏱️ ~15 horas

Resultado: 75%+ cobertura, procesos estables
```

### Junio (Operación normal + mejoras)
```
Actividades:
├─ Mantener testing en desarrollo diario
├─ Alcanzar 80%+ cobertura
├─ SonarQube analysis (si aplica)
├─ Security scanning
└─ ⏱️ ~12 horas

Resultado: 80%+ cobertura, equipo autónomo
```

### Julio (Revisión trimestral)
```
Actividades:
├─ Evaluación Q2 completa
├─ Informe trimestral
├─ Lecciones aprendidas revisadas
├─ Plan ajustado para Q3
└─ ⏱️ ~10 horas

Resultado: Sistema maduro, mejoras documentadas
```

### TOTAL MAYO-JULIO: ~37 horas
**Estado esperado:**
- ✅ 80%+ cobertura de tests
- ✅ Operación sin fricción
- ✅ Equipo autónomo
- ✅ Calidad General: 75%+

---

## 🎯 FASE 4: SOSTENIMIENTO (Agosto - Diciembre 2026)

### Actividades Mensuales Regulares

```
CADA SEMANA:
├─ Standup QA (30 min viernes)
├─ Actualizar Bitácora si hay eventos
└─ Total: 2 horas/mes

CADA MES:
├─ Informe de calidad (4 horas)
├─ Reunión stakeholders (1 hora)
├─ Actualizar acciones (1 hora)
└─ Total: 6 horas/mes

CADA TRIMESTRE:
├─ Evaluación completa de calidad (6 horas)
├─ Revisión de lecciones aprendidas (2 horas)
├─ Ajuste de estrategia si necesario (2 horas)
└─ Total: 10 horas/trimestre

ESTIMADO: 10-15 horas/mes en sostenimiento
```

### Agosto-Diciembre: Operación Normal
```
Estado esperado:
├─ ✅ 80%+ cobertura sostenido
├─ ✅ <3 defectos/mes en producción
├─ ✅ Ciclo 7 días
├─ ✅ Calidad General: 80%+
├─ ✅ Equipo muy productivo
└─ ✅ Mejora continua activa
```

---

## 📊 DISTRIBUCIÓN DE ESFUERZO TOTAL

```
FEBRERO (Setup)           : 25 horas
MARZO-ABRIL (Testing)     : 36.5 horas
MAYO-JULIO (Maduración)   : 37 horas
AGOSTO-DICIEMBRE (Oper.)  : 60 horas (5h/mes)
                           ─────────────────
TOTAL 2026                : ~160 horas (~2 semanas persona-mes)

Distribución por rol:
├─ Desarrolladores: 45% (primeras 4 semanas intensa, luego normal)
├─ QA Lead: 30% (constante)
├─ Tech Lead: 15% (más en setup)
└─ DevOps: 10% (más en setup)
```

---

## 📅 HITOS CLAVE

```
Feb 5    │ Documentación entregada
Feb 9    │ Kickoff meeting + plan compartido
Feb 14   │ Jest + ESLint funcionando
Feb 21   │ Pre-commit hooks activos
Feb 28   │ GitHub Actions configurado
Mar 14   │ 10+ tests implementados
Mar 29   │ 60%+ cobertura
Abr 14   │ 20+ tests
Abr 29   │ Primer informe de QA
May 31   │ 75%+ cobertura
Jun 30   │ 80%+ cobertura + Q2 review
Jul 31   │ Sistema maduro + Q3 plan
Dic 31   │ Operación sostenible + reporte anual
```

---

## 🚨 DEPENDENCIAS Y RIESGOS

### Dependencias
```
Jest setup
    ↓
Pre-commit hooks
    ↓
GitHub Actions
    ↓
Tests en desarrollo
    ↓
Estándares de equipo
    ↓
Operación normal
```

### Riesgos Potenciales

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Falta de capacitación | Media | Alta | Reuniones e-mail y wiki |
| Herramientas no funcionar | Baja | Alta | Testing previo en sandbox |
| Cambios de scope | Media | Media | Proteger tiempo inicial |
| Equipo abrumado | Media | Alta | Distribuir carga, feedback loop |
| Procesos olvidados | Alta | Media | Integración en definición de done |

---

## ✅ CRITERIOS DE ÉXITO POR FASE

### Fase 1 (Febrero) - SETUP
```
Técnico:
✅ Jest instalado (npm test funciona)
✅ ESLint configurado (npm run lint funciona)
✅ Pre-commit hooks activos
✅ GitHub Actions ejecutándose
✅ Bloqueador de merge sin CI

Humano:
✅ 100% del equipo capacitado
✅ Todos entienden procesos
✅ Documentación compartida
✅ Roles asignados
```

### Fase 2 (Marzo-Abril) - TESTING
```
Técnico:
✅ 20+ tests implementados
✅ 70%+ cobertura
✅ Todos los tests pasando
✅ Code review checklist en uso
✅ Standards de commit aplicados

Humano:
✅ Desarrolladores escriben tests naturalmente
✅ Code reviews más rápidos
✅ Primer informe generado
✅ Stakeholders entienden avance
```

### Fase 3 (Mayo-Julio) - MADURACIÓN
```
Técnico:
✅ 80%+ cobertura sostenido
✅ Cero defectos críticos en mes
✅ Performance aceptable
✅ Sistema estable

Humano:
✅ Equipo autónomo en QA
✅ Procesos internalizados
✅ Mejoras propuestas por equipo
✅ Calidad General: 75%+
```

### Fase 4 (Agosto-Diciembre) - SOSTENIMIENTO
```
Técnico:
✅ 80%+ cobertura consistente
✅ <3 defectos/mes producción
✅ Ciclo <7 días
✅ Uptime 99.5%+

Humano:
✅ Mejora continua activa
✅ Lecciones capturadas
✅ Equipo muy productivo
✅ Calidad General: 80%+
```

---

## 📋 PRÓXIMAS ACCIONES INMEDIATAS

### Hoy (5 de Febrero)
```
[ ] Docs en /QA/ (HECHO ✅)
[ ] Compartir con equipo
[ ] Agendar kickoff
```

### Mañana (6 de Febrero)
```
[ ] Reunión kickoff
[ ] Asignar roles
[ ] Enviar cronograma
```

### Esta Semana (7-9 de Febrero)
```
[ ] Cada persona lee su documentación
[ ] Tech Lead revisa implementación
[ ] Preguntas aclaradas
[ ] Preparar ambiente
```

### Próxima Semana (10-14 de Febrero)
```
[ ] Instalar Jest
[ ] Configurar ESLint
[ ] Crear estructura __tests__
[ ] Primera ejecución de tests
```

---

## 💡 NOTAS IMPORTANTES

1. **Flexibilidad:** Este calendario puede ajustarse según necesidades
2. **Retrospectivas:** Cada viernes revisar qué funcionó/qué no
3. **Lecciones:** Documentar en BITACORA_LECCIONES_APRENDIDAS
4. **Comunicación:** Mantener visible el progreso (board, dashboard)
5. **Celebración:** Festejar cada hito conseguido

---

**Calendario Creado:** 5 de febrero de 2026  
**Período Cubierto:** Febrero - Diciembre 2026  
**Duración Total:** 11 meses  
**Esfuerzo Estimado:** ~160 horas (~2 semanas persona/mes)

**¡Adelante con la implementación!** 🚀
