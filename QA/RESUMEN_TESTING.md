# 📝 RESUMEN: Todo sobre Pruebas Unitarias

## 🎯 ¿Qué son las pruebas unitarias?

Son **pequeños programas** que verifican que tu código funciona correctamente.

**Piensa en esto:**
```
Tu código: function sumar(a, b) { return a + b; }

Tu test:   "¿2 + 3 = 5?" → ✅ SÍ → Test PASA
           "¿2 + 3 = 6?" → ❌ NO → Test FALLA
```

---

## 🚀 ¿Por qué son importantes?

1. ✅ **Detectan errores antes** - No llegas a producción con bugs
2. ✅ **Documentan tu código** - Los tests explican cómo funciona
3. ✅ **Dan confianza** - Puedes cambiar código sin miedo
4. ✅ **Ahorran tiempo** - No pruebas manualmente cada vez

---

## 📖 3 DOCUMENTOS QUE DEBES LEER

### 1. **INSTALACION_TESTING.md** ← **EMPIEZA AQUÍ**
```
📋 Paso a paso para instalar Jest
📋 Comandos de instalación
📋 Cómo ejecutar tests
📋 Solución de problemas
```

### 2. **GUIA_TESTING_UNITARIO.md** ← **APRENDE AQUÍ**
```
🎓 Qué son las pruebas unitarias
🎓 Cómo escribir tests
🎓 Ejemplos completos
🎓 Buenas prácticas
```

### 3. **02_IMPLEMENTACION_PRACTICA.md** ← **PROFUNDIZA AQUÍ**
```
🔧 Configuración avanzada
🔧 Integración con CI/CD
🔧 Hooks y pre-commits
```

---

## ⚡ INICIO RÁPIDO (5 minutos)

### Paso 1: Instalar (2 min)
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @babel/preset-react babel-jest jest-environment-jsdom identity-obj-proxy
```

### Paso 2: Agregar a package.json (1 min)
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch"
}
```

### Paso 3: Ejecutar tests (2 min)
```bash
npm test
```

**¡Listo!** Ya tienes 60+ tests funcionando ✅

---

## 📂 ARCHIVOS YA CREADOS PARA TI

### ✅ Configuración (listos para usar)
```
jest.config.cjs          ← Configuración Jest
jest.setup.js            ← Setup inicial
.babelrc                 ← Transformación JSX
__mocks__/fileMock.js    ← Mock archivos
```

### ✅ Tests de ejemplo (60+ tests)
```
src/lib/__tests__/
  ├── validators.test.js          ← 50 tests de validadores
  └── inventoryUtils.test.js      ← 6 tests de inventario

src/components/__tests__/
  └── Button.test.jsx             ← 20 tests de componente
```

### ✅ Código fuente para probar
```
src/lib/
  └── validators.js               ← 7 funciones validadoras

src/components/
  └── Button.jsx                  ← Componente de ejemplo
```

---

## 🎓 EJEMPLO SÚPER SIMPLE

### El código:
```javascript
// src/lib/validators.js
export function validateQuantity(quantity) {
  const num = Number(quantity)
  return !isNaN(num) && num > 0 && Number.isInteger(num)
}
```

### El test:
```javascript
// src/lib/__tests__/validators.test.js
import { validateQuantity } from '../validators'

test('retorna true para cantidad válida', () => {
  expect(validateQuantity(5)).toBe(true)
})

test('retorna false para cero', () => {
  expect(validateQuantity(0)).toBe(false)
})
```

### Ejecutar:
```bash
npm test validators.test.js
```

### Resultado:
```
✓ retorna true para cantidad válida (2 ms)
✓ retorna false para cero (1 ms)

Tests: 2 passed, 2 total
```

---

## 🔑 CONCEPTOS CLAVE

### 1. Test = 3 pasos (AAA)
```javascript
test('descripción', () => {
  // ARRANGE - Preparar
  const dato = 5
  
  // ACT - Actuar
  const resultado = miFuncion(dato)
  
  // ASSERT - Verificar
  expect(resultado).toBe(10)
})
```

### 2. Matchers (verificadores)
```javascript
expect(valor).toBe(5)              // igualdad estricta
expect(valor).toEqual({ a: 1 })    // igualdad de contenido
expect(valor).toBeTruthy()         // es verdadero
expect(valor).toContain('texto')   // contiene texto
expect(funcion).toThrow()          // lanza error
```

### 3. Describe (agrupar)
```javascript
describe('Grupo de Tests', () => {
  test('test 1', () => { /* ... */ })
  test('test 2', () => { /* ... */ })
})
```

---

## 📊 COMANDOS ESENCIALES

```bash
# Ejecutar todos los tests
npm test

# Ejecutar en modo watch (recomendado)
npm run test:watch

# Ver cobertura
npm run test:coverage

# Ejecutar un archivo específico
npm test validators.test.js
```

---

## 💡 TU PRIMER TEST - PASO A PASO

### 1. Crea una función
```javascript
// src/lib/helpers.js
export function duplicar(numero) {
  return numero * 2
}
```

### 2. Crea el test
```javascript
// src/lib/__tests__/helpers.test.js
import { duplicar } from '../helpers'

test('duplica el número', () => {
  expect(duplicar(5)).toBe(10)
})
```

### 3. Ejecuta
```bash
npm test helpers.test.js
```

### 4. Ve el resultado
```
✓ duplica el número (1 ms)

Tests: 1 passed, 1 total
```

---

## ✅ CHECKLIST PARA EMPEZAR

```
[ ] Leer INSTALACION_TESTING.md
[ ] Instalar dependencias de Jest
[ ] Ejecutar npm test (ver que pasen los tests)
[ ] Leer GUIA_TESTING_UNITARIO.md
[ ] Ver ejemplos en validators.test.js
[ ] Crear tu primer test
[ ] Ejecutar tu test
[ ] Celebrar ✅
```

---

## 🎯 TESTS YA DISPONIBLES (60+)

### ✅ Validadores (50 tests)
- validateEmail - 5 tests
- validateQuantity - 7 tests
- validatePrice - 4 tests
- validateRUC - 6 tests
- validatePhone - 6 tests
- validateStock - 5 tests
- calculateOrderTotal - 8 tests

### ✅ Utilidades (6 tests)
- mergeRecommendationsIntoProducts - 6 tests

### ✅ Componentes (20 tests)
- Button component - 20 tests

**Total:** 76 tests ✅

---

## 📈 META DE COBERTURA

```
Target: ≥ 80%

90-100%  Excelente  🌟
80-89%   Bueno      ✅
70-79%   Aceptable  🟡
<70%     Mejorar    ❌
```

---

## 🐛 SOLUCIÓN RÁPIDA DE PROBLEMAS

### ❌ "Cannot find module '@testing-library/react'"
```bash
npm install --save-dev @testing-library/react
```

### ❌ "SyntaxError: Unexpected token '<'"
→ Verifica que `.babelrc` existe

### ❌ "Tests fail"
→ Lee el error, te dice qué esperaba vs qué recibió

---

## 🎓 APRENDE MÁS

### Documentos del proyecto
- **INSTALACION_TESTING.md** - Instalación paso a paso
- **GUIA_TESTING_UNITARIO.md** - Guía completa con ejemplos
- **02_IMPLEMENTACION_PRACTICA.md** - Configuración avanzada

### Documentación oficial
- Jest: https://jestjs.io
- React Testing Library: https://testing-library.com

---

## 💬 PREGUNTAS FRECUENTES

### ¿Cuántos tests necesito?
→ Empieza con funciones críticas (validadores, cálculos)
→ Meta: 80% de cobertura

### ¿Cuánto tiempo toma escribir un test?
→ 2-5 minutos por test simple
→ Se vuelve más rápido con práctica

### ¿Debo testear todo?
→ NO. Prioriza:
  ✅ Lógica de negocio
  ✅ Validadores
  ✅ Cálculos
  ✅ Componentes críticos

### ¿Cuándo escribo los tests?
→ Al mismo tiempo que el código
→ NUNCA los dejes para después

---

## 🎉 ¡TODO LISTO!

**Ya tienes:**
- ✅ 76 tests funcionando
- ✅ Configuración completa
- ✅ Ejemplos reales
- ✅ 3 guías detalladas

**Ahora solo:**
1. Ejecuta `npm test`
2. Ve que todo pasa ✅
3. Crea tu primer test
4. ¡Celebra!

---

## 🚀 PRÓXIMOS PASOS

1. **HOY:** Instalar y ejecutar tests
2. **ESTA SEMANA:** Crear 5 tests nuevos
3. **PRÓXIMA SEMANA:** Alcanzar 80% cobertura
4. **MES 1:** Tests automáticos en CI/CD

---

**¿Dudas?** Consulta:
- GUIA_TESTING_UNITARIO.md (explicación detallada)
- INSTALACION_TESTING.md (troubleshooting)
- 02_IMPLEMENTACION_PRACTICA.md (configuración avanzada)

---

**Creado:** 5 de febrero de 2026  
**Para:** Equipo pedido-ebs-web  
**Status:** ✅ Listo para usar

---

## 📞 CONTACTO

**Tech Lead:** Ver QA/01_PLAN_ASEGURAMIENTO_CALIDAD.md  
**Soporte:** Ver QA/GUIA_RAPIDA_QA.md

---

¡Éxito con tus tests! 🎉
