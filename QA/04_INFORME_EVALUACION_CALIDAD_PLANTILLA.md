# Plantilla: Informe de Evaluación de Calidad del Software
## Proyecto: pedido-ebs-web

---

## INFORMACIÓN GENERAL

| Campo | Valor |
|-------|-------|
| **Período de Evaluación** | _____ a _____ |
| **Versión del Software** | v_______ |
| **Evaluador(es)** | _________________________ |
| **Fecha de Informe** | _________________________ |
| **Aprobado por** | _________________________ |

---

## RESUMEN EJECUTIVO

### Calificación General
```
┌──────────────────────────────────────────────────┐
│          CALIDAD GENERAL DEL SOFTWARE            │
│                                                  │
│              [███████░░░░░░░░] 74%               │
│                                                  │
│  Estado: ACEPTABLE - Mejoras Requeridas         │
└──────────────────────────────────────────────────┘
```

### Puntos Clave
✅ **Fortalezas:**
- 
- 

⚠️ **Áreas de Mejora:**
- 
- 

🔴 **Problemas Críticos:**
- 

---

## 1. EVALUACIÓN POR CARACTERÍSTICA DE CALIDAD

### 1.1 FUNCIONALIDAD
**Porcentaje:** _____ / 100  
**Peso:** 15% → Contribución: _____

#### Detalle de Evaluación

| Criterio | Cumple | Evidencia | Comentarios |
|----------|--------|-----------|------------|
| Completitud funcional | ☐ Sí ☐ No | | |
| Corrección de resultados | ☐ Sí ☐ No | | |
| Validación de entrada | ☐ Sí ☐ No | | |
| Manejo de excepciones | ☐ Sí ☐ No | | |
| Integridad de datos | ☐ Sí ☐ No | | |

#### Defectos Identificados
| ID | Descripción | Severidad | Estado |
|----|-------------|-----------|--------|
| F-001 | | 🔴 / 🟠 / 🟡 | Abierto |

#### Acciones Correctivas
```
1. _________________________________________________
2. _________________________________________________
```

---

### 1.2 CONFIABILIDAD
**Porcentaje:** _____ / 100  
**Peso:** 20% → Contribución: _____

#### Detalle de Evaluación

| Criterio | Métrica | Target | Actual | Cumple |
|----------|---------|--------|--------|--------|
| Disponibilidad (Uptime) | % | ≥99.5% | ______% | ☐ |
| Tiempo Recuperación | min | <5 | ______ | ☐ |
| Integridad de Datos | % | ≥99.9% | ______% | ☐ |
| Tolerancia a Fallos | % | ≥80% | ______% | ☐ |
| Backup & Restore | % | ≥100% | ______% | ☐ |

#### Incidentes Registrados (último período)
```
Fecha          | Descripción              | Duración | RCA
_______________|__________________________|__________|_______________________
               |                          |          |
               |                          |          |
```

#### Acciones Correctivas
```
1. _________________________________________________
2. _________________________________________________
```

---

### 1.3 USABILIDAD
**Porcentaje:** _____ / 100  
**Peso:** 15% → Contribución: _____

#### Detalle de Evaluación

| Criterio | Métrica | Target | Actual | Cumple |
|----------|---------|--------|--------|--------|
| Aprendibilidad | min | <30 | ______ | ☐ |
| Navegación Intuitiva | % usuarios satisfechos | ≥90% | ______% | ☐ |
| Consistencia UI | % | ≥95% | ______% | ☐ |
| Accesibilidad (WCAG 2.1) | # issues críticos | 0 | ______ | ☐ |
| Feedback al Usuario | % | ≥100% | ______% | ☐ |

#### Feedback de Usuarios
```
Comentarios positivos:
- _________________________________________________
- _________________________________________________

Comentarios negativos:
- _________________________________________________
- _________________________________________________
```

#### Acciones Correctivas
```
1. _________________________________________________
2. _________________________________________________
```

---

### 1.4 EFICIENCIA
**Porcentaje:** _____ / 100  
**Peso:** 15% → Contribución: _____

#### Detalle de Evaluación

| Criterio | Métrica | Target | Actual | Cumple |
|----------|---------|--------|--------|--------|
| Tiempo de Respuesta (P95) | seg | <2 | ______ | ☐ |
| Rendimiento bajo Carga | % disponible | ≥95% | ______% | ☐ |
| Uso de Memoria | MB | <256 | ______ | ☐ |
| Uso de CPU | % | <70% | ______% | ☐ |
| Ancho de Banda | KB | <500 | ______ | ☐ |

#### Resultados de Performance Testing
```
Test: ___________________________
Configuración: ___________________________
Resultados: ___________________________
```

#### Acciones Correctivas
```
1. _________________________________________________
2. _________________________________________________
```

---

### 1.5 MANTENIBILIDAD
**Porcentaje:** _____ / 100  
**Peso:** 15% → Contribución: _____

#### Detalle de Evaluación

| Criterio | Métrica | Target | Actual | Cumple |
|----------|---------|--------|--------|--------|
| Modularidad | % reutilización | ≥80% | ______% | ☐ |
| Legibilidad | ESLint warnings | <5 | ______ | ☐ |
| Documentación | % código documentado | ≥80% | ______% | ☐ |
| Testabilidad (Coverage) | % | ≥80% | ______% | ☐ |
| Deuda Técnica | días | <10 | ______ | ☐ |

#### Análisis SonarQube / Code Review
```
Hotspots identificados:
- _________________________________________________
- _________________________________________________

Refactoring requerido:
- _________________________________________________
- _________________________________________________
```

#### Acciones Correctivas
```
1. _________________________________________________
2. _________________________________________________
```

---

### 1.6 PORTABILIDAD
**Porcentaje:** _____ / 100  
**Peso:** 10% → Contribución: _____

#### Detalle de Evaluación

| Criterio | Métrica | Target | Actual | Cumple |
|----------|---------|--------|--------|--------|
| Compatibilidad Navegadores | % | ≥95% | ______% | ☐ |
| Compatibilidad Dispositivos | % | ≥95% | ______% | ☐ |
| Instalación Exitosa | % deploys | ≥99% | ______% | ☐ |
| Migración de Datos | % corrección | ≥100% | ______% | ☐ |
| Independencia Tecnológica | # dependencias críticas | <3 | ______ | ☐ |

#### Browsers Testeados
```
✅ Chrome 120+
✅ Firefox 121+
✅ Safari 17+
✅ Edge 120+
☐ Opera
```

#### Dispositivos Testeados
```
✅ Desktop 1920x1080
✅ Laptop 1366x768
✅ Tablet iPad (1024x768)
✅ Mobile iPhone 14 (390x844)
☐ Otros
```

#### Acciones Correctivas
```
1. _________________________________________________
2. _________________________________________________
```

---

### 1.7 SEGURIDAD
**Porcentaje:** _____ / 100  
**Peso:** 10% → Contribución: _____

#### Detalle de Evaluación

| Criterio | Test Realizado | Resultado | Cumple |
|----------|---|---|---|
| Autenticación | Pruebas de login | ______ | ☐ |
| Autorización | Pruebas RBAC | ______ | ☐ |
| Encriptación de Datos | Datos en tránsito y reposo | ______ | ☐ |
| Protección SQL Injection | OWASP scanning | ______ | ☐ |
| Protección XSS | Dynamic testing | ______ | ☐ |
| Auditoría de Cambios | Audit log review | ______ | ☐ |

#### Vulnerabilidades Encontradas

| ID | Tipo | Severidad | Descripción | Estado |
|----|------|-----------|-------------|--------|
| SEC-001 | | 🔴 Crítica | | |
| SEC-002 | | 🟠 Alta | | |
| SEC-003 | | 🟡 Media | | |

#### Pentesting Results (si aplica)
```
Fecha del test: _________________
Testeador: _________________
Vulnerabilidades encontradas: _________________
Recomendaciones: _________________
```

#### Acciones Correctivas
```
1. _________________________________________________
2. _________________________________________________
```

---

## 2. RESUMEN DE MÉTRICAS GLOBALES

### Tabla Comparativa Período Actual vs Anterior

| Característica | Período Anterior | Período Actual | Cambio | Tendencia |
|---|---|---|---|---|
| Funcionalidad | ____% | ____% | +/- ____% | ↑↓→ |
| Confiabilidad | ____% | ____% | +/- ____% | ↑↓→ |
| Usabilidad | ____% | ____% | +/- ____% | ↑↓→ |
| Eficiencia | ____% | ____% | +/- ____% | ↑↓→ |
| Mantenibilidad | ____% | ____% | +/- ____% | ↑↓→ |
| Portabilidad | ____% | ____% | +/- ____% | ↑↓→ |
| Seguridad | ____% | ____% | +/- ____% | ↑↓→ |
| **TOTAL** | **____%** | **____%** | **+/- ____%** | **↑↓→** |

---

## 3. ANÁLISIS DE DEFECTOS

### Defectos por Severidad
```
Críticos:      🔴 _____ (bloqueadores)
Altos:         🟠 _____ (funcionalidad importante)
Medios:        🟡 _____ (feature menor)
Bajos:         🔵 _____ (cosméticos)
```

### Defectos por Etapa Detectada
```
Desarrollo:    _____ (_____%)
QA:            _____ (_____%)
Producción:    _____ (_____%)
```

### Tasa de Defectos
```
Densidad de defectos: _____ defectos / 1000 LOC
Tasa de escape:       _____ % (defectos en producción / total)
MTBF (Mean Time Between Failures): _____ horas
MTTR (Mean Time To Repair): _____ minutos
```

---

## 4. CONFORMIDAD CON ESTÁNDARES

- ☐ ISO/IEC 25010 (Características de Calidad)
- ☐ OWASP Top 10 (Seguridad)
- ☐ WCAG 2.1 AA (Accesibilidad)
- ☐ GDPR (Privacidad de datos)
- ☐ Estándares internos del proyecto

**Observaciones:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 5. HALLAZGOS PRINCIPALES

### 🎯 Top 5 Fortalezas
```
1. _________________________________________________________
2. _________________________________________________________
3. _________________________________________________________
4. _________________________________________________________
5. _________________________________________________________
```

### ⚠️ Top 5 Áreas de Mejora
```
1. _________________________________________________________
2. _________________________________________________________
3. _________________________________________________________
4. _________________________________________________________
5. _________________________________________________________
```

### 🔴 Problemas Críticos Requieren Acción Inmediata
```
1. _________________________________________________________
2. _________________________________________________________
```

---

## 6. RECOMENDACIONES Y PLAN DE ACCIÓN

### Inmediatas (Esta semana)
```
[ ] _________________________________________________________
[ ] _________________________________________________________
[ ] _________________________________________________________
```

### Corto Plazo (Este mes)
```
[ ] _________________________________________________________
[ ] _________________________________________________________
[ ] _________________________________________________________
```

### Mediano Plazo (Este trimestre)
```
[ ] _________________________________________________________
[ ] _________________________________________________________
[ ] _________________________________________________________
```

### Largo Plazo (Este año)
```
[ ] _________________________________________________________
[ ] _________________________________________________________
[ ] _________________________________________________________
```

---

## 7. CRITERIO DE LIBERACIÓN A PRODUCCIÓN

| Criterio | Requerido | Cumple | Observaciones |
|----------|-----------|--------|---------------|
| Calidad General ≥ 80% | ✅ Sí | ☐ | |
| Cero defectos críticos | ✅ Sí | ☐ | |
| Cobertura de tests ≥ 80% | ✅ Sí | ☐ | |
| Cero vulnerabilidades críticas | ✅ Sí | ☐ | |
| Aprobación de stakeholders | ✅ Sí | ☐ | |

### Decisión Final
```
☐ APROBADO - Listo para producción
☐ APROBADO CONDICIONAL - Ir a producción con vigilancia
☐ RECHAZADO - Requiere mejoras antes de producción
```

**Justificación:**
```
_________________________________________________________________
_________________________________________________________________
```

---

## 8. SEGUIMIENTO Y PRÓXIMAS ACCIONES

### Responsables de Acciones
```
QA Lead:         _________________________
Tech Lead:       _________________________
Product Owner:   _________________________
```

### Fechas Importantes
- **Próxima Evaluación:** _________________
- **Deadline Acciones Críticas:** _________________
- **Review Plan de Mejora:** _________________

### Contacto para Preguntas
```
Nombre: _________________________
Teléfono: _________________________
Email: _________________________
```

---

**Informe preparado por:** _________________________ **Fecha:** _________  
**Revisado por:** _________________________ **Fecha:** _________  
**Aprobado por:** _________________________ **Fecha:** _________

---

## APÉNDICE A: EVIDENCIA DE TESTING

### A.1 Pruebas Unitarias
```
Total tests: _____
Pasados: _____
Fallidos: _____
Coverage: _____%
```

### A.2 Pruebas de Integración
```
APIs testeadas: _____
Pasadas: _____
Fallidas: _____
```

### A.3 Pruebas E2E
```
Flujos testeados: _____
Exitosos: _____
Fallidos: _____
```

### A.4 Pruebas de Seguridad
```
OWASP TOP 10 items testeados: 10
Vulnerabilidades encontradas: _____
Solucionadas: _____
```

---

**Fin del Informe**
