# Plan de Implementación Práctica de QA
## Proyecto: pedido-ebs-web

**Versión:** 1.0  
**Fecha:** Febrero 5, 2026  
**Estado:** Listo para Implementar

---

## 📋 TABLA DE CONTENIDOS

1. [Setup Inicial de Jest](#setup-inicial-de-jest)
2. [Configuración de ESLint Mejorada](#configuración-de-eslint-mejorada)
3. [Pre-commit Hooks](#pre-commit-hooks)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [Estructura de Carpetas de Testing](#estructura-de-carpetas-de-testing)
6. [Script NPM de QA](#script-npm-de-qa)
7. [Primeros Tests Unitarios](#primeros-tests-unitarios)
8. [Checklist de Implementación](#checklist-de-implementación)

---

## 🚀 SETUP INICIAL DE JEST

### Paso 1: Instalar Dependencias

```bash
# Instalar Jest y sus dependencias
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Instalar babel para transpilación de JSX
npm install --save-dev @babel/preset-env @babel/preset-react babel-jest

# Instalar coverage tools
npm install --save-dev jest-coverage
```

### Paso 2: Crear archivo `jest.config.cjs`

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': 
      '<rootDir>/src/__mocks__/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/main.jsx',
    '!src/index.js',
    '!src/**/*.test.{js,jsx}',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Paso 3: Crear archivo `.babelrc`

```json
{
  "presets": [
    ["@babel/preset-env", { "targets": { "node": "current" } }],
    ["@babel/preset-react", { "runtime": "automatic" }]
  ]
}
```

### Paso 4: Crear `src/setupTests.js`

```javascript
import '@testing-library/jest-dom';

// Mock de Supabase si es necesario
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(),
    auth: { signIn: jest.fn(), signOut: jest.fn() },
  })),
}));

// Mock de variables de ambiente
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-key';
```

### Paso 5: Crear mock para archivos estáticos

```bash
mkdir -p src/__mocks__
```

Crear `src/__mocks__/fileMock.js`:
```javascript
module.exports = 'test-file-stub';
```

---

## ⚙️ CONFIGURACIÓN DE ESLINT MEJORADA

### Paso 1: Extender ESLint Config

Actualizar `eslint.config.js`:

```javascript
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist', 'node_modules', 'coverage'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.2' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // JavaScript
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'curly': ['error', 'all'],
      
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'warn',
      'react/display-name': 'warn',
      'react/jsx-key': 'error',
      
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      
      // React Refresh
      'react-refresh/only-export-components': 'warn',
    },
  },
];
```

### Paso 2: Agregar scripts de linting

En `package.json`:

```json
{
  "scripts": {
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "format": "prettier --write \"src/**/*.{js,jsx,css,md}\"",
    "qa": "npm run lint && npm run test:coverage"
  }
}
```

---

## 🔒 PRE-COMMIT HOOKS

### Paso 1: Instalar Husky

```bash
npm install --save-dev husky
npx husky install
```

### Paso 2: Crear Hook de Pre-commit

```bash
npx husky add .husky/pre-commit "npm run lint && npm test"
```

Editar `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Ejecutando ESLint..."
npm run lint

if [ $? -ne 0 ]; then
  echo "❌ ESLint falló. Por favor corrige los errores."
  exit 1
fi

echo "✅ ESLint pasó"

echo "🧪 Ejecutando tests..."
npm test -- --bail

if [ $? -ne 0 ]; then
  echo "❌ Tests fallaron. Por favor corrige los tests."
  exit 1
fi

echo "✅ Tests pasaron"
echo "✨ Código listo para commit!"
```

### Paso 3: Crear Hook de Prepare-commit-msg

```bash
npx husky add .husky/prepare-commit-msg "exec < /dev/tty && node scripts/validate-commit-msg.js"
```

Crear `scripts/validate-commit-msg.js`:

```javascript
#!/usr/bin/env node

const fs = require('fs');
const messageFile = process.argv[2];
const message = fs.readFileSync(messageFile, 'utf-8').trim();

const validPattern = /^\[(FEAT|FIX|REFACTOR|TEST|DOCS|STYLE|PERF)\] .+/;

if (!validPattern.test(message)) {
  console.error(
    '❌ Formato de commit incorrecto.\n\n' +
    'El mensaje debe seguir:\n' +
    '[TIPO] Descripción\n\n' +
    'Tipos válidos: FEAT, FIX, REFACTOR, TEST, DOCS, STYLE, PERF\n\n' +
    'Ejemplo: [FIX] Corregir validación en formulario'
  );
  process.exit(1);
}

console.log('✅ Formato de commit válido!');
```

Hacer ejecutable:
```bash
chmod +x scripts/validate-commit-msg.js
```

---

## 🔄 GITHUB ACTIONS CI/CD

### Paso 1: Crear workflow de testing

Crear `.github/workflows/test.yml`:

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Usar Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'

      - name: Instalar dependencias
        run: npm ci

      - name: Ejecutar ESLint
        run: npm run lint

      - name: Ejecutar tests
        run: npm test -- --coverage

      - name: Subir coverage a Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: unittests
          fail_ci_if_error: true
```

### Paso 2: Crear workflow de build

Crear `.github/workflows/build.yml`:

```yaml
name: Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Usar Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Instalar dependencias
        run: npm ci

      - name: Hacer build
        run: npm run build

      - name: Verificar dist
        run: test -d dist && echo "✅ Build exitoso" || (echo "❌ Build falló"; exit 1)
```

### Paso 3: Configurar branch protection en GitHub

En Settings > Branches > main:
- ✅ Require status checks to pass before merging
- ✅ Require ESLint to pass
- ✅ Require tests to pass
- ✅ Require 1 code review

---

## 📁 ESTRUCTURA DE CARPETAS DE TESTING

```bash
mkdir -p src/__tests__/components
mkdir -p src/__tests__/hooks
mkdir -p src/__tests__/lib
mkdir -p src/__mocks__
mkdir -p src/__fixtures__
```

Estructura completa esperada:

```
src/
├─ components/
│  ├─ OrderForm.jsx
│  └─ __tests__/
│     └─ OrderForm.test.jsx
├─ hooks/
│  ├─ useFormValidation.js
│  └─ __tests__/
│     └─ useFormValidation.test.js
├─ lib/
│  ├─ validators.js
│  └─ __tests__/
│     └─ validators.test.js
├─ __tests__/
│  ├─ components/
│  ├─ hooks/
│  └─ lib/
├─ __mocks__/
│  ├─ supabase.js
│  └─ fileMock.js
├─ __fixtures__/
│  ├─ mockData.js
│  └─ testUtils.js
└─ setupTests.js
```

---

## 🎯 SCRIPT NPM DE QA

Actualizar `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:unit": "jest --testPathPattern=__tests__",
    
    "format": "prettier --write \"src/**/*.{js,jsx,css,md}\"",
    
    "qa": "npm run lint && npm run test:coverage",
    "qa:full": "npm run lint && npm run build && npm run test:coverage"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "husky": "^8.0.0",
    "eslint": "^9.29.0",
    "prettier": "^3.0.0"
  }
}
```

---

## 🧪 PRIMEROS TESTS UNITARIOS

### Test 1: Validadores

Crear `src/lib/__tests__/validators.test.js`:

```javascript
import {
  validateEmail,
  validateQuantity,
  validateAmount,
} from '../validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('debe retornar true para email válido', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('debe retornar false para email inválido', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validateQuantity', () => {
    it('debe retornar true para cantidad > 0', () => {
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(100)).toBe(true);
    });

    it('debe retornar false para cantidad <= 0', () => {
      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-1)).toBe(false);
    });

    it('debe retornar false para valores no numéricos', () => {
      expect(validateQuantity('abc')).toBe(false);
      expect(validateQuantity(null)).toBe(false);
    });
  });

  describe('validateAmount', () => {
    it('debe retornar true para monto > 0', () => {
      expect(validateAmount(10.5)).toBe(true);
      expect(validateAmount(1000)).toBe(true);
    });

    it('debe retornar false para monto <= 0', () => {
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-50)).toBe(false);
    });

    it('debe validar máximo 2 decimales', () => {
      expect(validateAmount(10.99)).toBe(true);
      expect(validateAmount(10.999)).toBe(false);
    });
  });
});
```

### Test 2: Hook de Validación

Crear `src/hooks/__tests__/useFormValidation.test.js`:

```javascript
import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';

const mockValidator = {
  email: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
  quantity: (val) => val > 0,
};

describe('useFormValidation', () => {
  it('debe inicializar con values vacíos', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        { email: '', quantity: '' },
        mockValidator
      )
    );

    expect(result.current.values.email).toBe('');
    expect(result.current.values.quantity).toBe('');
  });

  it('debe actualizar values al hacer onChange', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        { email: '', quantity: '' },
        mockValidator
      )
    );

    act(() => {
      result.current.handleChange('email', 'test@example.com');
    });

    expect(result.current.values.email).toBe('test@example.com');
  });

  it('debe validar al hacer onBlur', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        { email: '', quantity: '' },
        mockValidator
      )
    );

    act(() => {
      result.current.handleBlur('email');
    });

    expect(result.current.errors.email).toBeDefined();
  });

  it('debe retornar isFormValid false si hay errores', () => {
    const { result } = renderHook(() =>
      useFormValidation(
        { email: 'invalid', quantity: -1 },
        mockValidator
      )
    );

    expect(result.current.isFormValid).toBe(false);
  });
});
```

### Test 3: Componente

Crear `src/components/__tests__/OrderForm.test.jsx`:

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import OrderForm from '../OrderForm';

describe('OrderForm', () => {
  it('debe renderizar el formulario', () => {
    render(<OrderForm />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('debe mostrar error si cantidad es inválida', async () => {
    render(<OrderForm />);
    
    const quantityInput = screen.getByLabelText(/cantidad/i);
    fireEvent.change(quantityInput, { target: { value: '-1' } });
    fireEvent.blur(quantityInput);

    expect(await screen.findByText(/cantidad debe ser mayor/i)).toBeInTheDocument();
  });

  it('debe permitir submit con datos válidos', async () => {
    const onSubmit = jest.fn();
    render(<OrderForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/cantidad/i), {
      target: { value: '5' },
    });

    fireEvent.click(screen.getByRole('button', { name: /enviar/i }));

    expect(onSubmit).toHaveBeenCalled();
  });
});
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Setup Inicial (Día 1-2)
```
[ ] Instalar Jest y React Testing Library
[ ] Configurar jest.config.cjs
[ ] Crear setupTests.js
[ ] Actualizar ESLint config
[ ] Crear carpeta __tests__
[ ] Agregar scripts npm
[ ] Verificar que npm test funciona
```

### Fase 2: Automatización (Día 3-4)
```
[ ] Instalar Husky
[ ] Crear pre-commit hooks
[ ] Crear validador de commits
[ ] Probar commit con mensaje incorrecto
[ ] Probar commit exitoso
```

### Fase 3: CI/CD (Día 5-6)
```
[ ] Crear workflows en GitHub Actions
[ ] Configurar branch protection
[ ] Hacer push y verificar que CI corre
[ ] Configurar rule: bloquear merge sin CI pasado
[ ] Verificar todo está protegido
```

### Fase 4: Testing Base (Día 7)
```
[ ] Crear 3-5 tests de validadores
[ ] Crear 2-3 tests de hooks
[ ] Crear 2-3 tests de componentes
[ ] Lograr ≥70% cobertura en módulos críticos
[ ] Actualizar documentación
```

### Fase 5: Lanzamiento (Día 8-10)
```
[ ] Capacitar al equipo en procesos
[ ] Documentar estándares
[ ] Hacer primer PR con nuevo proceso
[ ] Recolectar feedback
[ ] Ajustar según feedback
[ ] Celebrar 🎉
```

---

## 🚨 TROUBLESHOOTING

### Error: "Cannot find module '@testing-library/jest-dom'"

```bash
npm install --save-dev @testing-library/jest-dom
```

### Error: "ESLint no encuentra archivo"

```bash
npm run lint -- --debug
# Verificar que eslint.config.js existe
```

### Tests no corren con JSX

```bash
# Instalar babel
npm install --save-dev babel-jest @babel/preset-env @babel/preset-react
# Crear .babelrc
```

### Pre-commit hook no funciona

```bash
# Dar permisos
chmod +x .husky/pre-commit
chmod +x .husky/prepare-commit-msg

# Reiniciar husky
npx husky install
```

---

**Próxima actualización:** Cuando se complete Fase 1  
**Responsable:** QA Lead / DevOps  
**Contacto:** [email QA Lead]
