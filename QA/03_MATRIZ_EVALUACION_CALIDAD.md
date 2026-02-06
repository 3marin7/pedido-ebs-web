# Matriz de Evaluación de Calidad del Software
## Proyecto: pedido-ebs-web

**Versión:** 1.0  
**Fecha:** Febrero 5, 2026

---

## 1. INTRODUCCIÓN

Esta matriz define los criterios específicos para **evaluar comportamientos del software** en cada característica de calidad, con métricas medibles y rangos de aceptación.

---

## 2. MATRIZ DE EVALUACIÓN POR CARACTERÍSTICA

### 2.1 FUNCIONALIDAD

#### Objetivo: Verificar que el software cumple con los requisitos especificados

| Comportamiento | Criterio de Aceptación | Método Evaluación | Métrica | Rango Aceptable |
|---|---|---|---|---|
| **Completitud funcional** | Todas las funciones están implementadas | Checklist de requisitos vs código | % Features implementadas | ≥ 95% |
| **Corrección de resultados** | Cálculos y lógica son correctos | Unit tests + prueba manual | % Tests pasados | ≥ 98% |
| **Validación de entrada** | Valida todos los datos de entrada | Pruebas de casos límite | % Validaciones | ≥ 100% |
| **Manejo de excepciones** | Maneja errores sin crashes | Exception tests | % Excepciones controladas | ≥ 100% |
| **Integridad de datos** | Los datos se persisten correctamente | BD tests + E2E | % Operaciones exitosas | ≥ 99% |

**Evaluación Funcionalidad:** `(Features implementadas × 0.3) + (Tests pasados × 0.3) + (Validaciones × 0.2) + (Excepciones × 0.1) + (Integridad × 0.1)`

---

### 2.2 CONFIABILIDAD

#### Objetivo: El software funciona sin fallas durante tiempo prolongado

| Comportamiento | Criterio de Aceptación | Método Evaluación | Métrica | Rango Aceptable |
|---|---|---|---|---|
| **Disponibilidad** | Sistema está disponible cuando se necesita | Monitoreo 24/7 | % Uptime | ≥ 99.5% |
| **Recuperación de fallos** | Se recupera automáticamente | Chaos engineering tests | Tiempo recuperación | < 5 min |
| **Consistencia de datos** | Datos no se corrompen | Integrity checks en DB | % Integridad | ≥ 99.9% |
| **Tolerancia a fallos** | Continúa funcionando con degradación | Failure scenario tests | % Funcionamiento | ≥ 80% |
| **Backup y restauración** | Backups funcionan y se pueden restaurar | Test restore mensual | % Éxito restore | ≥ 100% |

**Evaluación Confiabilidad:** `(Uptime × 0.4) + (Recuperación × 0.2) + (Integridad datos × 0.2) + (Tolerancia × 0.1) + (Backup × 0.1)`

---

### 2.3 USABILIDAD

#### Objetivo: El software es fácil de usar y aprender

| Comportamiento | Criterio de Aceptación | Método Evaluación | Métrica | Rango Aceptable |
|---|---|---|---|---|
| **Aprendibilidad** | Usuario nuevo aprende en < 30 min | Prueba con usuario nuevo | Min para completar tarea | < 30 min |
| **Navegación intuitiva** | Interfaz clara y fácil de navegar | Usability testing | % Usuarios sin confusión | ≥ 90% |
| **Consistencia de UI** | Elementos visuales consistentes | Auditoría visual + heurística | % Consistencia | ≥ 95% |
| **Accesibilidad** | Cumple con WCAG 2.1 AA | axe DevTools + testing | # Issues accesibilidad | 0 críticos |
| **Feedback al usuario** | Siempre muestra estado de operaciones | Pruebas de UX | % Operaciones con feedback | ≥ 100% |

**Evaluación Usabilidad:** `(Aprendibilidad × 0.2) + (Navegación × 0.3) + (Consistencia × 0.2) + (Accesibilidad × 0.2) + (Feedback × 0.1)`

---

### 2.4 EFICIENCIA

#### Objetivo: El software usa recursos eficientemente

| Comportamiento | Criterio de Aceptación | Método Evaluación | Métrica | Rango Aceptable |
|---|---|---|---|---|
| **Tiempo de respuesta** | Operaciones responden rápido | Performance testing + Lighthouse | P95 latencia | < 2 seg |
| **Rendimiento bajo carga** | Maneja picos de tráfico | Load testing con k6/JMeter | % Disponible bajo carga | ≥ 95% |
| **Memoria utilizada** | No consume memoria excesiva | Memory profiling | Heap size | < 256 MB |
| **CPU utilizado** | Uso moderado de CPU | Performance monitoring | % CPU | < 70% |
| **Ancho de banda** | Transferencias de datos optimizadas | Network inspection | Tamaño promedio request | < 500 KB |

**Evaluación Eficiencia:** `(Tiempo respuesta × 0.3) + (Rendimiento carga × 0.3) + (Memoria × 0.2) + (CPU × 0.1) + (Ancho banda × 0.1)`

---

### 2.5 MANTENIBILIDAD

#### Objetivo: El software es fácil de mantener y modificar

| Comportamiento | Criterio de Aceptación | Método Evaluación | Métrica | Rango Aceptable |
|---|---|---|---|---|
| **Modularidad** | Código está dividido en módulos reutilizables | Análisis arquitectura | # Componentes/features reutilizables | ≥ 80% |
| **Legibilidad** | Código es fácil de entender | Code review + linting | ESLint warnings | < 5 |
| **Documentación** | Código y procesos documentados | Auditoría documentación | % Código documentado | ≥ 80% |
| **Testabilidad** | Código fácil de probar | Coverage analysis | Cobertura pruebas | ≥ 80% |
| **Deuda técnica** | Mínima deuda técnica acumulada | SonarQube analysis | Deuda técnica (días) | < 10 |

**Evaluación Mantenibilidad:** `(Modularidad × 0.25) + (Legibilidad × 0.25) + (Documentación × 0.2) + (Testabilidad × 0.2) + (Deuda técnica × 0.1)`

---

### 2.6 PORTABILIDAD

#### Objetivo: El software funciona en múltiples plataformas y entornos

| Comportamiento | Criterio de Aceptación | Método Evaluación | Métrica | Rango Aceptable |
|---|---|---|---|---|
| **Compatibilidad navegadores** | Funciona en navegadores modernos | Cross-browser testing | % Navegadores soportados | ≥ 95% |
| **Compatibilidad dispositivos** | Responsive en mobile/tablet/desktop | Device testing | % Dispositivos soportados | ≥ 95% |
| **Instalación sin problemas** | Deploy sin fallos | Deployment testing | % Deploys exitosos | ≥ 99% |
| **Migración de datos** | Datos se migran correctamente | Migration testing | % Datos migrados correctamente | ≥ 100% |
| **Independencia tecnológica** | Bajo acoplamiento a tecnologías específicas | Architecture review | # Dependencias críticas | < 3 |

**Evaluación Portabilidad:** `(Navegadores × 0.3) + (Dispositivos × 0.3) + (Instalación × 0.2) + (Migración × 0.1) + (Independencia × 0.1)`

---

### 2.7 SEGURIDAD

#### Objetivo: El software protege datos y funcionalidad

| Comportamiento | Criterio de Aceptación | Método Evaluación | Métrica | Rango Aceptable |
|---|---|---|---|---|
| **Autenticación** | Solo usuarios autorizados acceden | Pruebas de autenticación | % Tests autenticación pasados | ≥ 100% |
| **Autorización** | Control de acceso basado en roles | Pruebas de autorización | # Escaladas de privilegios | 0 |
| **Encriptación de datos** | Datos sensibles encriptados | Security scanning | % Datos sensibles encriptados | ≥ 100% |
| **Prevención inyección SQL** | Protegido contra SQL injection | OWASP scanning + penetration | # Vulnerabilidades inyección | 0 |
| **Protección XSS** | Protegido contra XSS attacks | Static analysis + dynamic testing | # Vulnerabilidades XSS | 0 |
| **Auditoría de cambios** | Todos los cambios se registran | Audit log review | % Operaciones auditadas | ≥ 100% |

**Evaluación Seguridad:** `(Autenticación × 0.2) + (Autorización × 0.2) + (Encriptación × 0.2) + (Anti-inyección × 0.2) + (Anti-XSS × 0.1) + (Auditoría × 0.1)`

---

## 3. FORMULARIO DE EVALUACIÓN PERIÓDICA

### Evaluación Mensual de Calidad

```
Período: _______ a _______

Evaluador: ____________________________  Fecha: _________

PUNTAJES (0-100):

Funcionalidad:    _____ × 0.15 = _____
Confiabilidad:    _____ × 0.20 = _____
Usabilidad:       _____ × 0.15 = _____
Eficiencia:       _____ × 0.15 = _____
Mantenibilidad:   _____ × 0.15 = _____
Portabilidad:     _____ × 0.10 = _____
Seguridad:        _____ × 0.10 = _____
                               ________
CALIDAD TOTAL:                _____/100

CLASIFICACIÓN:
  90-100: Excelente
   80-89: Bueno
   70-79: Aceptable
   60-69: Deficiente
     <60: Crítico

HALLAZGOS PRINCIPALES:
_________________________________________________________________

ACCIONES A TOMAR:
_________________________________________________________________

PRÓXIMA REVISIÓN: ________________
```

---

## 4. HERRAMIENTAS PARA MEDIR CADA CARACTERÍSTICA

### Mapeo Herramienta → Característica

| Característica | Herramientas Primarias | Herramientas Secundarias |
|---|---|---|
| **Funcionalidad** | Jest, React Testing Library, E2E tests | Manual testing, Postman |
| **Confiabilidad** | Uptime monitoring, Sentry, Error tracking | Chaos engineering, Load tests |
| **Usabilidad** | Usability tests, axe DevTools, heatmaps | Google Lighthouse, WAVE |
| **Eficiencia** | Lighthouse, WebPageTest, k6 load tests | New Relic, DataDog |
| **Mantenibilidad** | SonarQube, ESLint, Code coverage (Jest) | Code review, Architecture analysis |
| **Portabilidad** | BrowserStack, Responsively, Jest mocks | Lambda Testing, Sauce Labs |
| **Seguridad** | OWASP ZAP, Burp Suite Community, Snyk | npm audit, Dependabot |

---

## 5. RÚBRICA INTEGRADA DE CALIDAD

### Interpretación de Resultados

```
EXCELENTE (90-100)
├─ Cumple todos los criterios de aceptación
├─ Cero defectos críticos
├─ Todas las métricas dentro de rango óptimo
└─ Listo para producción sin reservas

BUENO (80-89)
├─ Cumple la mayoría de criterios
├─ Pocos defectos menores
├─ Métricas aceptables con mejoras posibles
└─ Listo para producción con vigilancia

ACEPTABLE (70-79)
├─ Cumple requisitos mínimos
├─ Algunos defectos que no afectan funcionalidad crítica
├─ Métricas en límite mínimo
└─ Producción condicional, mejoras requeridas

DEFICIENTE (60-69)
├─ Falla en algunos criterios
├─ Defectos que afectan user experience
├─ Métricas por debajo de aceptable
└─ NO listo para producción, remediación urgente

CRÍTICO (<60)
├─ Falla en criterios críticos
├─ Defectos graves en funcionalidad/seguridad
├─ Métricas críticas fuera de rango
└─ BLOQUEADO - No puede ir a producción
```

---

## 6. PLAN DE MEJORA POR CARACTERÍSTICA

### Si alguna característica cae por debajo de objetivo:

| Característica | Si < 80% | Si < 70% |
|---|---|---|
| **Funcionalidad** | Code review + testing reforzado | PARAR - Revisar especificación |
| **Confiabilidad** | Análisis RCA + mejora de logs | PARAR - Investigación profunda |
| **Usabilidad** | Usability testing con usuarios | PARAR - Rediseño necesario |
| **Eficiencia** | Profiling + optimización | PARAR - Arquitectura review |
| **Mantenibilidad** | Refactoring + documentación | PARAR - Technical debt urgente |
| **Portabilidad** | Testing en todos navegadores | PARAR - Incompatibilidad crítica |
| **Seguridad** | Pentesting + code audit | PARAR - Vulnerabilidades críticas |

---

**Documento creado:** 2026-02-05  
**Próxima revisión:** 2026-03-05  
**Responsable:** QA Lead
