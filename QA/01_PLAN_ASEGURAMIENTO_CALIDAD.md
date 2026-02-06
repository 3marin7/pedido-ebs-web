# Plan de Aseguramiento de Calidad de Software
## Proyecto: pedido-ebs-web

**Fecha:** Febrero 5, 2026  
**Versión:** 1.0  
**Estado:** En Implementación

---

## 1. INTRODUCCIÓN

Este documento define la estrategia integral de **Aseguramiento de Calidad (QA)** para el proyecto pedido-ebs-web, alineado con estándares de la industria (ISO/IEC 25010, CMMI, SWEBOK).

### Objetivos Principales
1. **Incorporar actividades de aseguramiento de calidad** según estándares de la industria (ISO/IEC 25010, IEEE 1012)
2. **Verificar calidad del software** de acuerdo con prácticas asociadas en procesos de desarrollo
3. **Realizar mejoras continuas** basadas en resultados de verificación y evaluación

---

## 2. ALCANCE Y CONTEXTO DEL PROYECTO

### Información del Proyecto
- **Nombre:** pedido-ebs-web
- **Tipo:** Aplicación Web Frontend (React + Vite)
- **Backend:** Supabase (PostgreSQL)
- **Stack Tecnológico:**
  - Frontend: React 18.2, Vite 7.0, TypeScript (opcional)
  - Herramientas de QA: ESLint, Jest (por configurar)
  - Base de Datos: PostgreSQL (Supabase)

### Procesos de Desarrollo Identificados
1. **Desarrollo de Componentes:** Componentes React modulares
2. **Integración con API:** Conexiones a Supabase
3. **Gestión de Estado:** Context API y hooks personalizados
4. **Estilos y UI:** CSS Modules y Styled Components
5. **Despliegue:** Build con Vite, deploys automáticos

---

## 3. CARACTERIZACIÓN DE PROCESOS DE DESARROLLO

### 3.1 Proceso de Desarrollo Actual

| Fase | Actividades | Entrada | Salida |
|------|------------|---------|--------|
| **Análisis** | Requerimientos, análisis de necesidades | Requisitos del cliente | Especificación de requisitos |
| **Diseño** | Arquitectura, diseño de componentes | Especificación | Diseño técnico, componentes |
| **Desarrollo** | Codificación, integración | Diseño | Código fuente, componentes |
| **Testing** | Pruebas unitarias, integración, E2E | Código | Reporte de pruebas |
| **Despliegue** | Build, release, deploy | Código verificado | Aplicación en producción |
| **Soporte** | Monitoreo, mantenimiento | Aplicación | Logs, incidencias |

### 3.2 Roles y Responsabilidades en QA

| Rol | Responsabilidades |
|-----|-------------------|
| **QA Lead** | Supervisar estrategia de calidad, definir métricas |
| **QA Engineer** | Diseñar pruebas, ejecutar testing, reportar defectos |
| **Developer** | Escribir código de calidad, pruebas unitarias |
| **Tech Lead** | Revisar código, asegurar estándares |
| **DevOps** | Automatizar testing, CI/CD, monitoreo |

---

## 4. SELECCIÓN DE BUENAS PRÁCTICAS DE CALIDAD

### 4.1 Buenas Prácticas por Área

#### A. Desarrollo Limpio (Clean Code)
- ✅ Nombrado claro y descriptivo de variables, funciones
- ✅ Funciones pequeñas y con responsabilidad única (SRP)
- ✅ Máximo 20 parámetros por función
- ✅ Evitar código duplicado (DRY)
- ✅ Documentación en código compleja

#### B. Arquitectura y Diseño
- ✅ Separación de responsabilidades (MVC/MVVM)
- ✅ Componentes reutilizables
- ✅ Manejo de errores consistente
- ✅ Logging centralizado
- ✅ Configuración de ambiente

#### C. Control de Versiones
- ✅ Commits atómicos y descriptivos
- ✅ Ramas por feature/hotfix (Git Flow)
- ✅ Code review obligatorio antes de merge
- ✅ Mensaje de commit estándar: `[TIPO] Descripción`

#### D. Testing Automático
- ✅ Cobertura de código mínimo: 80%
- ✅ Pruebas unitarias para lógica crítica
- ✅ Pruebas de integración para APIs
- ✅ Pruebas E2E para flujos principales
- ✅ Tests ejecutados en CI/CD

#### E. Calidad de Código
- ✅ ESLint con reglas estrictas
- ✅ Prettier para formateo automático
- ✅ SonarQube para análisis estático
- ✅ Pre-commit hooks para validación

#### F. Documentación
- ✅ README para cada módulo
- ✅ Documentación de API
- ✅ Guía de configuración
- ✅ Changelog versionado

---

## 5. MODELO DE CALIDAD DE SOFTWARE APLICADO

### 5.1 Características de Calidad (ISO/IEC 25010)

```
┌─────────────────────────────────────────────────────────────┐
│           CARACTERÍSTICAS DE CALIDAD (ISO 25010)            │
├─────────────────────────────────────────────────────────────┤
│ 1. FUNCIONALIDAD                                             │
│    ├─ Completitud: Todas las funciones implementadas        │
│    ├─ Corrección: Funciona según especificación             │
│    └─ Aptitud: Cumple con necesidades del usuario           │
│                                                              │
│ 2. CONFIABILIDAD                                             │
│    ├─ Madurez: Pocas fallas en producción                   │
│    ├─ Disponibilidad: Uptime > 99.5%                        │
│    ├─ Tolerancia a fallos: Recuperación automática          │
│    └─ Recuperabilidad: Backup y restauración               │
│                                                              │
│ 3. USABILIDAD                                                │
│    ├─ Aprendibilidad: Fácil de aprender                     │
│    ├─ Operabilidad: Interfaz intuitiva                      │
│    ├─ Accesibilidad: WCAG 2.1 AA                            │
│    └─ Estética: UI/UX atractiva                             │
│                                                              │
│ 4. EFICIENCIA                                                │
│    ├─ Rendimiento temporal: < 2s por operación              │
│    ├─ Uso de recursos: Memoria < 256MB                      │
│    └─ Escalabilidad: 1000+ usuarios simultáneos             │
│                                                              │
│ 5. MANTENIBILIDAD                                            │
│    ├─ Modularidad: Componentes desacoplados                 │
│    ├─ Analizabilidad: Código fácil de entender              │
│    ├─ Modificabilidad: Cambios sin efectos colaterales      │
│    └─ Testabilidad: Código fácil de probar                  │
│                                                              │
│ 6. PORTABILIDAD                                              │
│    ├─ Adaptabilidad: Funciona en navegadores               │
│    ├─ Instalabilidad: Deployment sin problemas              │
│    └─ Reemplazabilidad: Migración de datos posible          │
│                                                              │
│ 7. SEGURIDAD                                                 │
│    ├─ Confidencialidad: Datos encriptados                   │
│    ├─ Integridad: Datos no se corrompen                     │
│    ├─ No repudio: Auditoría de cambios                      │
│    └─ Autenticación: Control de acceso robusto              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Niveles de Madurez Esperados

| Característica | Nivel 1 | Nivel 2 | Nivel 3 | Objetivo |
|---|---|---|---|---|
| Funcionalidad | 70% | 85% | 95% | 95% |
| Confiabilidad | 80% | 90% | 97% | 97% |
| Usabilidad | 60% | 80% | 90% | 90% |
| Eficiencia | 70% | 85% | 95% | 95% |
| Mantenibilidad | 65% | 80% | 90% | 90% |
| Seguridad | 75% | 90% | 98% | 98% |

---

## 6. ACTIVIDADES DE VERIFICACIÓN Y VALIDACIÓN

### 6.1 Actividades de Verificación (¿Lo estamos haciendo bien?)

| Actividad | Frecuencia | Responsable | Criterio |
|-----------|-----------|-------------|----------|
| Code Review | Cada commit | Tech Lead | Aprobación +1 |
| Linting automático | Cada commit | CI/CD | 0 errores |
| Pruebas unitarias | Cada build | Desarrollador | ≥80% cobertura |
| Pruebas de integración | Daily | QA | 100% paso |
| Análisis estático | Weekly | QA Lead | 0 vulnerabilidades |
| Performance testing | Bi-weekly | DevOps | < 2s response |

### 6.2 Actividades de Validación (¿Lo correcto para el usuario?)

| Actividad | Frecuencia | Responsable | Criterio |
|-----------|-----------|-------------|----------|
| Pruebas E2E | Cada release | QA | 100% flujos críticos |
| Testing de usuario | Mensual | Product Owner | Aceptación 90% |
| Pruebas de compatibilidad | Cada release | QA | 95%+ navegadores |
| Pruebas de accesibilidad | Trimestral | QA | WCAG 2.1 AA |
| Pruebas de seguridad | Trimestral | Security | OWASP Top 10 |

---

## 7. MÉTRICAS Y INDICADORES DE CALIDAD

### 7.1 Métricas de Código

```
1. COBERTURA DE CÓDIGO
   Target: ≥ 80%
   Alerta: < 70%
   Fórmula: (Líneas cubiertas / Líneas ejecutables) × 100

2. COMPLEJIDAD CICLOMÁTICA
   Target: ≤ 10 por función
   Alerta: > 15
   Herramienta: ESLint

3. DENSIDAD DE DEFECTOS
   Target: < 3 defectos / 1000 LOC
   Alerta: > 5
   Tracking: Sistema de issues

4. DEUDA TÉCNICA
   Target: < 5% del código
   Alerta: > 10%
   Herramienta: SonarQube
```

### 7.2 Métricas de Proceso

```
1. VELOCIDAD DE ENTREGA
   Target: 2 releases/mes
   Métrica: Features completadas/sprint

2. TIEMPO DE CICLO (Lead Time)
   Target: < 7 días
   Métrica: Desde commit a producción

3. TASA DE DEFECTOS EN PRODUCCIÓN
   Target: < 1 defecto/100k usuarios
   Métrica: Bugs reportados / usuarios activos

4. TIEMPO PARA RECUPERACIÓN (MTTR)
   Target: < 1 hora
   Métrica: Tiempo desde detectado hasta solucionado

5. DISPONIBILIDAD DEL SISTEMA
   Target: 99.5%
   Métrica: Uptime / tiempo total
```

### 7.3 Métricas de Calidad de User Experience

```
1. TASA DE ERROR DE USUARIO
   Target: < 2%
   Métrica: Acciones fallidas / acciones totales

2. TIEMPO DE RESPUESTA PERCIBIDO
   Target: < 2 segundos
   Métrica: P95 latencia

3. SATISFACCIÓN DEL USUARIO (NPS)
   Target: > 50
   Métrica: Encuesta de satisfacción

4. TASA DE ADOPCIÓN
   Target: > 80%
   Métrica: Usuarios activos / usuarios registrados
```

---

## 8. HERRAMIENTAS Y TECNOLOGÍAS DE QA

### 8.1 Stack Recomendado

| Categoría | Herramienta | Propósito |
|-----------|------------|----------|
| **Unit Testing** | Jest | Pruebas unitarias |
| **Component Testing** | React Testing Library | Testing de componentes |
| **E2E Testing** | Cypress o Playwright | Testing end-to-end |
| **Linting** | ESLint | Análisis estático |
| **Formating** | Prettier | Formato automático |
| **Code Quality** | SonarQube | Análisis de calidad |
| **Performance** | Lighthouse | Auditoría de performance |
| **Monitoring** | Sentry | Error tracking |
| **API Testing** | Postman/Insomnia | Testing de APIs |
| **Load Testing** | k6 o Apache JMeter | Testing de carga |

### 8.2 Pipeline CI/CD

```
┌─────────┐
│  Push   │
└────┬────┘
     │
     ├─► [Lint] ESLint
     │   └─► PASS / FAIL
     │
     ├─► [Build] Vite Build
     │   └─► PASS / FAIL
     │
     ├─► [Unit Tests] Jest
     │   ├─ ≥80% coverage?
     │   └─► PASS / FAIL
     │
     ├─► [SonarQube] Code Analysis
     │   ├─ Vulnerabilities = 0?
     │   └─► PASS / FAIL
     │
     ├─► [E2E Tests] Cypress (manual en staging)
     │
     └─► [Deploy] 
         ├─ Dev: automático
         ├─ Staging: automático
         └─ Production: manual con aprobación
```

---

## 9. EVALUACIÓN DE COMPORTAMIENTOS DEL SOFTWARE

Los comportamientos a evaluar se detallan en documento [03_MATRIZ_EVALUACION_CALIDAD.md](03_MATRIZ_EVALUACION_CALIDAD.md)

Aspectos clave:
- ✅ Funcionalidad esperada
- ✅ Manejo de errores
- ✅ Rendimiento
- ✅ Seguridad
- ✅ Compatibilidad
- ✅ Accesibilidad

---

## 10. PLAN DE ACCIÓN INMEDIATO (Próximas 2 semanas)

### Semana 1: Configuración Base
- [ ] Instalar y configurar Jest
- [ ] Configurar React Testing Library
- [ ] Agregar pre-commit hooks
- [ ] Crear estructura de carpetas /tests
- [ ] Escribir 10 tests unitarios iniciales

### Semana 2: Procesos y Documentación
- [ ] Definir estándar de commits
- [ ] Crear código review checklist
- [ ] Documentar procesos de testing
- [ ] Configurar CI/CD básico
- [ ] Capacitar al equipo

---

## 11. REFERENCIAS Y ESTÁNDARES

- **ISO/IEC 25010:** Modelo de Calidad de Software
- **IEEE 1012:** Estándar de Verificación y Validación
- **SWEBOK:** Software Engineering Body of Knowledge
- **CMMI:** Capability Maturity Model Integration
- **OWASP:** Seguridad en Aplicaciones Web
- **WCAG 2.1:** Accesibilidad Web

---

**Documento creado:** 2026-02-05  
**Próxima revisión:** 2026-03-05  
**Propietario:** QA Lead / Tech Lead
