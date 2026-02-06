# 🚀 INSTRUCCIONES DE INSTALACIÓN Y EJECUCIÓN
## Configurar Testing en pedido-ebs-web

**Fecha:** 5 de febrero de 2026

---

## 📋 PASO 1: INSTALAR DEPENDENCIAS

Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
npm install --save-dev jest@29.7.0 \
  @testing-library/react@14.0.0 \
  @testing-library/jest-dom@6.1.4 \
  @testing-library/user-event@14.5.1 \
  @babel/core@7.23.2 \
  @babel/preset-env@7.23.2 \
  @babel/preset-react@7.22.15 \
  babel-jest@29.7.0 \
  jest-environment-jsdom@29.7.0 \
  identity-obj-proxy@3.0.0
```

**¿Qué instala?**
- `jest` - Framework de testing
- `@testing-library/react` - Utilidades para testear React
- `@testing-library/jest-dom` - Matchers adicionales
- `@babel/preset-*` - Para transformar JSX en tests
- `jest-environment-jsdom` - Simula el DOM del navegador
- `identity-obj-proxy` - Mock para archivos CSS

---

## 📋 PASO 2: VERIFICAR ARCHIVOS DE CONFIGURACIÓN

Ya creamos estos archivos automáticamente:

✅ **jest.config.cjs** - Configuración de Jest  
✅ **jest.setup.js** - Setup inicial de tests  
✅ **.babelrc** - Transformación de JSX  
✅ **__mocks__/fileMock.js** - Mock de archivos estáticos  

---

## 📋 PASO 3: ACTUALIZAR PACKAGE.JSON

Abre `package.json` y agrega estos scripts en la sección `"scripts"`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:verbose": "jest --verbose"
  }
}
```

---

## 📋 PASO 4: EJECUTAR TUS PRIMEROS TESTS

### Opción 1: Ejecutar todos los tests
```bash
npm test
```

### Opción 2: Ejecutar tests en modo watch (recomendado para desarrollo)
```bash
npm run test:watch
```

### Opción 3: Ver cobertura de tests
```bash
npm run test:coverage
```

### Opción 4: Ejecutar un archivo específico
```bash
npm test validators.test.js
```

---

## 📊 INTERPRETANDO LOS RESULTADOS

### ✅ Resultado exitoso:
```
 PASS  src/lib/__tests__/validators.test.js
  Validators
    validateEmail
      ✓ retorna true para emails válidos (3 ms)
      ✓ retorna false para emails inválidos (1 ms)
    validateQuantity
      ✓ retorna true para cantidades válidas (2 ms)
      ✓ retorna false para cero (1 ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total
Snapshots:   0 total
Time:        2.345 s
```

### ❌ Resultado con error:
```
 FAIL  src/lib/__tests__/validators.test.js
  Validators
    validateEmail
      ✕ retorna true para emails válidos (5 ms)

  ● Validators › validateEmail › retorna true para emails válidos

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: false

      8 |   test('retorna true para emails válidos', () => {
      9 |     expect(validateEmail('user@example.com')).toBe(true)
    > 10 |     expect(validateEmail('test@company.com')).toBe(true)
         |                                               ^
      11 |   })
```

**Esto significa:** 
- ❌ El test esperaba `true` pero recibió `false`
- 🔍 Línea 10 del archivo de test
- 🐛 La función `validateEmail()` no está funcionando correctamente

---

## 🎯 ARCHIVOS DE TEST YA CREADOS

### ✅ Tests Funcionales
- **src/lib/__tests__/validators.test.js**
  - 50+ tests para validadores
  - Cubre: email, cantidad, precio, RUC, teléfono, stock
  - Incluye cálculo de totales

### ✅ Tests de Utilidades
- **src/lib/__tests__/inventoryUtils.test.js**
  - Tests para funciones de inventario
  - Cubre: merge de recomendaciones con productos

### ✅ Tests de Componentes
- **src/components/__tests__/Button.test.jsx**
  - Tests para componente Button
  - Cubre: renderizado, eventos, props, variantes

---

## 🎓 CREAR TU PRIMER TEST

### 1. Crea una función en tu código

```javascript
// src/lib/helpers.js
export function formatPrice(price) {
  return `$${Number(price).toFixed(2)}`
}
```

### 2. Crea el archivo de test

```javascript
// src/lib/__tests__/helpers.test.js
import { formatPrice } from '../helpers'

describe('formatPrice', () => {
  test('formatea precio correctamente', () => {
    expect(formatPrice(100)).toBe('$100.00')
    expect(formatPrice(99.99)).toBe('$99.99')
  })
  
  test('redondea a 2 decimales', () => {
    expect(formatPrice(10.555)).toBe('$10.56')
  })
})
```

### 3. Ejecuta el test

```bash
npm test helpers.test.js
```

---

## 📈 VER COBERTURA DE TESTS

```bash
npm run test:coverage
```

**Resultado:**
```
---------------------------------|---------|----------|---------|---------|
File                             | % Stmts | % Branch | % Funcs | % Lines |
---------------------------------|---------|----------|---------|---------|
All files                        |   85.71 |    75.00 |   80.00 |   85.71 |
 lib                             |     100 |      100 |     100 |     100 |
  validators.js                  |     100 |      100 |     100 |     100 |
  inventoryUtils.js              |      80 |       75 |      85 |      82 |
 components                      |      90 |       85 |      95 |      91 |
  Button.jsx                     |     100 |      100 |     100 |     100 |
---------------------------------|---------|----------|---------|---------|
```

**Meta:** ≥ 80% en todo

---

## ⚡ COMANDOS ÚTILES

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (auto-reload)
npm run test:watch

# Ver cobertura
npm run test:coverage

# Ejecutar un archivo específico
npm test validators.test.js

# Ejecutar tests que coincidan con un patrón
npm test -- --testNamePattern="validateEmail"

# Modo verbose (más detalles)
npm run test:verbose

# Actualizar snapshots
npm test -- -u

# Solo tests que fallaron la última vez
npm test -- --onlyFailures
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ Error: "Cannot find module '@testing-library/react'"

**Solución:**
```bash
npm install --save-dev @testing-library/react@14.0.0
```

### ❌ Error: "SyntaxError: Unexpected token '<'"

**Solución:** Verifica que `.babelrc` existe y tiene:
```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

### ❌ Error: "Jest encountered an unexpected token"

**Solución:** Verifica `jest.config.cjs` tiene:
```javascript
transform: {
  '^.+\\.jsx?$': 'babel-jest',
}
```

### ❌ Tests pasan localmente pero fallan en CI/CD

**Solución:** Agrega en `jest.config.cjs`:
```javascript
testEnvironment: 'jsdom',
```

---

## 📚 ESTRUCTURA DE ARCHIVOS

```
pedido-ebs-web/
├── jest.config.cjs          ← Configuración de Jest
├── jest.setup.js            ← Setup inicial
├── .babelrc                 ← Transformación JSX
├── __mocks__/
│   └── fileMock.js         ← Mock archivos estáticos
├── src/
│   ├── lib/
│   │   ├── validators.js            ← Código fuente
│   │   └── __tests__/
│   │       └── validators.test.js   ← Tests
│   ├── components/
│   │   ├── Button.jsx              ← Componente
│   │   └── __tests__/
│   │       └── Button.test.jsx     ← Tests componente
└── coverage/                ← Reporte de cobertura (auto-generado)
```

---

## ✅ CHECKLIST DE INSTALACIÓN

```
[ ] Instalar dependencias de Jest
[ ] Verificar jest.config.cjs existe
[ ] Verificar jest.setup.js existe
[ ] Verificar .babelrc existe
[ ] Agregar scripts a package.json
[ ] Ejecutar npm test
[ ] Ver que los tests pasen ✅
[ ] Ejecutar npm run test:coverage
[ ] Verificar cobertura ≥ 80%
```

---

## 🎉 ¡LISTO PARA EMPEZAR!

1. **Instala dependencias:** `npm install` (de las del paso 1)
2. **Ejecuta tests:** `npm test`
3. **Ve resultados:** Todos los tests deben pasar ✅
4. **Explora:** Abre los archivos de test para ver ejemplos
5. **Crea tu primer test:** Sigue la guía en GUIA_TESTING_UNITARIO.md

---

## 🔗 RECURSOS ADICIONALES

- **Guía Completa:** [QA/GUIA_TESTING_UNITARIO.md](./GUIA_TESTING_UNITARIO.md)
- **Implementación Práctica:** [QA/02_IMPLEMENTACION_PRACTICA.md](./02_IMPLEMENTACION_PRACTICA.md)
- **Documentación Jest:** https://jestjs.io
- **React Testing Library:** https://testing-library.com

---

**¿Preguntas?** Consulta GUIA_TESTING_UNITARIO.md o contacta al Tech Lead.

---

**Última actualización:** 5 de febrero de 2026
