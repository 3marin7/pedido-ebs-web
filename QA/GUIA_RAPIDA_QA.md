# Guía Rápida de Aseguramiento de Calidad
## Proyecto: pedido-ebs-web

**Versión:** 1.0  
**Última Actualización:** Febrero 5, 2026

---

## 📋 ESTRUCTURA DE DOCUMENTOS DE QA

```
/QA/
├─ 01_PLAN_ASEGURAMIENTO_CALIDAD.md
│  └─ 🎯 Estrategia completa y marcos de referencia
│
├─ 02_CARACTERIZACION_PROCESOS.md (próxima creación)
│  └─ 🔄 Cómo funciona el desarrollo actualmente
│
├─ 03_MATRIZ_EVALUACION_CALIDAD.md
│  └─ 📊 Métricas específicas para cada característica
│
├─ 04_INFORME_EVALUACION_CALIDAD_PLANTILLA.md
│  └─ 📝 Plantilla para reportar evaluaciones
│
├─ 05_BITACORA_LECCIONES_APRENDIDAS.md
│  └─ 📚 Histórico de aprendizajes del proyecto
│
├─ 06_ACCIONES_CORRECTIVAS_PREVENTIVAS_MEJORA.md
│  └─ ✅ Gestión de acciones de mejora
│
└─ GUIA_RAPIDA_QA.md (este documento)
   └─ ⚡ Referencia rápida para todos
```

---

## ⚡ REFERENCIA RÁPIDA

### Si encontraste un DEFECTO...

```
1. Registra el problema:
   - ¿Qué pasó? (descripción clara)
   - ¿Dónde? (componente, página, función)
   - ¿Cuándo? (siempre, a veces, en condiciones X)
   - ¿Reproducible? (pasos para reproducir)

2. Evalúa severidad:
   🔴 Crítica    = Bloquea funcionalidad, peligro de datos
   🟠 Alta       = Afecta funcionalidad importante
   🟡 Media      = Funcionalidad secundaria afectada
   🔵 Baja       = Problemas de UI/UX menores

3. Abre un Issue en GitHub:
   Título: [COMPONENTE] Descripción del defecto
   Descripción: Pasos para reproducir + evidencia
   Label: bug, severity/[crítica|alta|media|baja]

4. Notifica:
   - Si 🔴 Crítica: Slack #urgentes + @tech-lead
   - Si 🟠 Alta: Email a tech-lead
   - Si 🟡 Media/🔵 Baja: Agregar a backlog

5. Registra en AC-### en [06_ACCIONES_CORRECTIVAS_PREVENTIVAS_MEJORA.md](06_ACCIONES_CORRECTIVAS_PREVENTIVAS_MEJORA.md)
```

### Si MODIFICAS código...

```
ANTES DE HACER PUSH:

1. ¿Escribiste tests? (mínimo tests unitarios)
   Verificar: npm run test
   Target: ≥80% cobertura

2. ¿Cumples estándares de código?
   Verificar: npm run lint
   Objetivo: 0 errores

3. ¿Mensaje de commit descriptivo?
   Formato: [TIPO] Descripción
   Ejemplo: [FEAT] Validación cantidad negativa en órdenes

4. ¿Code review?
   GitHub: Crear Pull Request
   Requerimiento: +1 aprovación Tech Lead
   Incluir: Link a issue, cambios principales

5. ¿Los tests pasaron en CI?
   GitHub Actions debe mostrar ✅ PASS
   Si ❌ FAIL: Arreglá antes de mergear
```

### Si PLANEAS una CARACTERÍSTICA nueva...

```
1. Análisis de Calidad (Planificación):
   ☐ ¿Cómo se verifica que funciona?
   ☐ ¿Cuáles son los casos límite?
   ☐ ¿Qué validaciones se necesitan?
   ☐ ¿Cómo afecta la seguridad?
   ☐ ¿Qué métricas miden éxito?

2. Desarrollo enfocado en Calidad:
   ☐ Escribe test PRIMERO (TDD)
   ☐ Implementa la función
   ☐ Refactoriza si necesario
   ☐ Todos los tests pasan

3. Testing completo:
   ☐ Tests unitarios (cobertura ≥80%)
   ☐ Tests de integración con APIs
   ☐ Tests E2E del flujo completo
   ☐ Testing manual en staging

4. Documentación:
   ☐ Comenta código complejo
   ☐ Actualiza README si necesario
   ☐ Documenta validaciones especiales
   ☐ Actualiza guía de usuario si aplica
```

### Si HACES CODE REVIEW...

```
CHECKLIST DEL REVIEWER:

FUNCIONALIDAD:
☐ ¿Cumple con el requirement?
☐ ¿Hay tests cubriendo todos los casos?
☐ ¿La lógica es correcta?
☐ ¿Maneja excepciones adecuadamente?

CÓDIGO:
☐ ¿Es legible y fácil de entender?
☐ ¿Sigue naming conventions?
☐ ¿Reutiliza código existente?
☐ ¿Sin duplicación?

ARQUITECTURA:
☐ ¿Respeta separación de responsabilidades?
☐ ¿Componentes modulares y reutilizables?
☐ ¿Integración API segura?

SEGURIDAD:
☐ ¿Valida entrada del usuario?
☐ ¿Protegido contra SQL injection?
☐ ¿Protegido contra XSS?
☐ ¿Autenticación/autorización correcta?

PERFORMANCE:
☐ ¿Queries optimizadas?
☐ ¿Sin loops ineficientes?
☐ ¿Rendimiento aceptable?

CALIDAD:
☐ ¿ESLint pasa (0 warnings)?
☐ ☐ ¿Cobertura tests ≥80%?
☐ ¿Commit message descriptivo?
☐ ¿Documentación actualizada?

APROBACIÓN:
Si TODO está bien: APRUEBA
Si hay problemas menores: REQUEST CHANGES con observaciones
Si hay problemas críticos: RECHAZA con explicación
```

---

## 📊 MÉTRICAS CLAVE A MONITOREAR

### Diariamente en Desarrollo
```
✓ Build Status:  ¿Green o Red en GitHub Actions?
✓ Test Results:  ¿% de tests pasando?
✓ Coverage:      ¿≥80% líneas cubiertas?
✓ Lint Issues:   ¿ESLint warnings < 5?
```

### Semanalmente en Standup
```
✓ Defectos abiertos:      ¿Cuántos y de qué severidad?
✓ Código en review:        ¿Esperando revisión?
✓ Actions pendientes:      ¿Acciones correctivas en tiempo?
✓ Mejoras en progreso:     ¿Avanzo esperado?
```

### Mensualmente en Revisión
```
✓ Calidad General (1-100):     Target 80+
✓ Uptime:                      Target 99.5%+
✓ Defectos en Producción:      Target <3 por mes
✓ Tiempo de Ciclo:             Target <7 días
✓ Cobertura de Tests:          Target ≥80%
```

---

## 🛠️ HERRAMIENTAS ESENCIALES

### Testing
```
Jest                → npm test              (Pruebas unitarias)
React Testing Lib   → npm test              (Testing de componentes)
Cypress (futuro)    → npm run cy:open       (Testing E2E)
```

### Análisis de Código
```
ESLint              → npm run lint          (Linting)
Prettier            → npm run format        (Formato automático)
SonarQube (futuro)  → En CI/CD              (Análisis estático)
```

### Monitoreo
```
GitHub Actions      → Autom. en cada push   (CI/CD básico)
Sentry (futuro)     → Error tracking        (Errores en prod)
Lighthouse (futuro) → Browser tools         (Performance audit)
```

---

## 📈 MEJORAS PRIORIZADAS (Próximas 4 semanas)

### Semana 1: Configuración Base
- [ ] Instalar y configurar Jest
- [ ] Crear primeros 10 tests unitarios
- [ ] Setup React Testing Library
- [ ] Documentar estándares de testing

### Semana 2: Procesos
- [ ] Crear pre-commit hooks
- [ ] Estándar de commits en equipo
- [ ] Checklist de code review
- [ ] Capacitar a desarrolladores

### Semana 3: Automatización
- [ ] GitHub Actions con linting
- [ ] GitHub Actions con tests
- [ ] Bloquear merge sin tests pasados
- [ ] Dashboard de métricas

### Semana 4: Consolidación
- [ ] Documentación completa
- [ ] Revisión y ajustes
- [ ] Lecciones aprendidas
- [ ] Plan Q2 2026

---

## 📞 CONTACTOS Y ESCALACIÓN

| Rol | Nombre | Cuando contactar | Urgencia |
|-----|--------|-----------------|----------|
| **QA Lead** | _ | Defectos críticos, métricas bajas | 🔴 Inmediata |
| **Tech Lead** | _ | Code quality, arquitectura | 🟠 Alta |
| **DevOps** | _ | CI/CD, deployment issues | 🔴 Inmediata |
| **Product Owner** | _ | Impacto en features | 🟡 Media |

---

## ✅ CHECKLIST PRE-DEPLOYMENT

### Antes de ir a STAGING:
```
☐ Todos los tests pasan (npm test)
☐ ESLint sin errors críticos (npm run lint)
☐ Code review aprobado (+1)
☐ Cobertura ≥80%
☐ Changelog actualizado
```

### Antes de ir a PRODUCCIÓN:
```
☐ Testeado en staging por 24h
☐ E2E testing en principales flujos
☐ Security check realizado
☐ Performance aceptable
☐ Rollback plan documentado
☐ Aprobación Product Owner
☐ Notificación a usuarios si aplica
```

---

## 🎓 RECURSOS DE APRENDIZAJE

### Estándares de Calidad
- ISO/IEC 25010: Modelos de Calidad
- OWASP: Seguridad en Aplicaciones Web
- WCAG 2.1: Accesibilidad
- Clean Code (Robert Martin)

### Herramientas
- Jest Documentation: https://jestjs.io
- React Testing Library: https://testing-library.com
- ESLint: https://eslint.org
- GitHub Actions: https://github.com/features/actions

### Prácticas
- Test-Driven Development (TDD)
- Continuous Integration / Continuous Deployment (CI/CD)
- Code Review Best Practices
- Agile Testing

---

## 📝 PLANTILLAS RÁPIDAS

### Título para Issue (GitHub)
```
[TIPO] [COMPONENTE] - Descripción breve

Tipos: DEFECTO | MEJORA | PREGUNTA
Ejemplo: [DEFECTO] [OrderForm] - Acepta cantidades negativas
```

### Título para Commit
```
[TIPO] Descripción de cambio

[FEAT] Agregar validación de cantidad
[FIX] Corregir cálculo de total
[REFACTOR] Extraer validadores a módulo
[TEST] Agregar tests para OrderForm
[DOCS] Actualizar README
```

### Título para Pull Request
```
[#ISSUE] [TIPO] Descripción clara del cambio

Describe brevemente qué cambió y por qué.
Incluye: Tests agregados, validaciones, impacto esperado.
```

---

## 🎯 OBJETIVOS DE CALIDAD 2026

### Q1 2026 (Actual)
```
🎯 Configurar base de QA
  ├─ Jest + React Testing Library
  ├─ ESLint con reglas estrictas
  ├─ Pre-commit hooks
  └─ Documentación de procesos

Target: Establecer fundamentos
```

### Q2 2026
```
🎯 Automatizar testing
  ├─ 80% cobertura de tests
  ├─ CI/CD pipeline completo
  ├─ Monitoreo en producción
  └─ Capacitación de equipo

Target: Calidad General ≥75%
```

### Q3 2026
```
🎯 Escalar la calidad
  ├─ E2E testing automatizado
  ├─ Security scanning
  ├─ Performance testing
  └─ Accesibilidad WCAG 2.1 AA

Target: Calidad General ≥85%
```

### Q4 2026
```
🎯 Optimizar y mantener
  ├─ Mejora continua
  ├─ Proceso maduro
  ├─ Equipo capacitado
  └─ Lecciones documentadas

Target: Calidad General ≥90%
```

---

## 🚨 ESCALACIÓN RÁPIDA

### Si encuentras un DEFECTO CRÍTICO:

```
INMEDIATAMENTE:
1. NO mergees a main (si está en rama)
2. Documenta paso a paso cómo reproducir
3. Notifica en Slack #urgentes con @tech-lead
4. Abre un GitHub Issue con [CRÍTICA]
5. Crea una rama hotfix/ si aplica

EN 2 HORAS:
1. Tech Lead revisa y prioriza
2. Si es en prod: Plan de roll-back
3. Si es en dev: Bloquea otros cambios hasta solucionar

EN 4 HORAS:
1. Fix implementado y testeado
2. Code review rápido
3. Deploy a staging
4. Validación completa

EN 24 HORAS:
1. Análisis de causa raíz
2. Acción correctiva documentada
3. Deploy a producción si aplica
4. Lección aprendida registrada
```

---

## 📞 PREGUNTAS FRECUENTES

### ¿Cuántos tests necesito escribir?
```
Respuesta: Cobertura ≥80% de lineas
Esto significa: Toda lógica está probada
Orientación: Mínimo 1 test por función, +tests para casos límite
```

### ¿Cuánto demora un code review?
```
Respuesta: Target 24-48 horas
Crítica: < 4 horas
Alta: < 24 horas
Media/Baja: < 48 horas
Si no se cumple: Escalada al Tech Lead
```

### ¿Qué si rompo los tests?
```
Respuesta: Es normal en desarrollo
Solución:
1. Asegúrate que el TEST es correcto
2. Arregla el código para que test pase
3. Si el test está mal: Actualiza el test
4. NO deshabilites tests para "pasar"
```

### ¿Debo escribir tests en TODO?
```
Respuesta: En lo que PUEDAS
Prioridad:
1. 🔴 Lógica crítica / Validación (SIEMPRE)
2. 🟠 APIs y Hooks (SIEMPRE)
3. 🟡 Componentes complejos (SIEMPRE)
4. 🔵 UI simple / Storybook (Después)
```

### ¿Qué si SonarQube marca código rojo?
```
Respuesta: Debe corregirse
Opciones:
1. Refactorizar código (preferido)
2. Comentario de False Positive (documentado)
3. Hablo con Tech Lead si es complexo
4. NUNCA ignores advertencias de seguridad
```

---

**Última actualización:** 5 de febrero de 2026  
**Próxima revisión:** 19 de febrero de 2026  
**Propietario:** QA Lead / Tech Lead

---

## 🔗 REFERENCIAS RÁPIDAS

| Documento | Cuándo leer |
|-----------|------------|
| [01_PLAN_ASEGURAMIENTO_CALIDAD](01_PLAN_ASEGURAMIENTO_CALIDAD.md) | Entender estrategia general |
| [03_MATRIZ_EVALUACION_CALIDAD](03_MATRIZ_EVALUACION_CALIDAD.md) | Medir calidad del software |
| [05_BITACORA_LECCIONES_APRENDIDAS](05_BITACORA_LECCIONES_APRENDIDAS.md) | Aprender de errores pasados |
| [06_ACCIONES_CORRECTIVAS_PREVENTIVAS_MEJORA](06_ACCIONES_CORRECTIVAS_PREVENTIVAS_MEJORA.md) | Registrar/seguir mejoras |

---

**¡Preguntas? Contacta a QA Lead o Tech Lead** 📧
