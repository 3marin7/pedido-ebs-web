# 🧪 Guía Completa de Pruebas Unitarias
## pedido-ebs-web - Testing con Jest y React Testing Library

**Fecha:** 5 de febrero de 2026  
**Para:** Desarrolladores del equipo

---

## 📚 ¿QUÉ SON LAS PRUEBAS UNITARIAS?

### Definición Simple
Las **pruebas unitarias** son pequeños programas que verifican que una "unidad" de código (función, método, componente) funciona correctamente.

```
┌─────────────────────────────────────┐
│  CÓDIGO A PROBAR (lo que escribes) │
│                                     │
│  function sumar(a, b) {            │
│    return a + b;                   │
│  }                                 │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  TEST (verifica que funciona)       │
│                                     │
│  test('suma 2 + 3 = 5', () => {    │
│    expect(sumar(2, 3)).toBe(5);    │
│  });                               │
└─────────────────────────────────────┘
```

### ¿Por qué son importantes?

1. ✅ **Detectan errores temprano** - Antes de que lleguen a producción
2. ✅ **Documentan el código** - Los tests explican cómo usar el código
3. ✅ **Facilitan cambios** - Puedes refactorizar con confianza
4. ✅ **Ahorran tiempo** - No necesitas probar manualmente
5. ✅ **Mejoran la calidad** - Código testeado = código confiable

---

## 🎯 ANATOMÍA DE UN TEST

### Estructura básica (AAA Pattern)

```javascript
test('descripción de lo que prueba', () => {
  // 1. ARRANGE (Preparar)
  // Preparar los datos y el contexto
  const numero1 = 5;
  const numero2 = 3;
  
  // 2. ACT (Actuar)
  // Ejecutar la función que queremos probar
  const resultado = sumar(numero1, numero2);
  
  // 3. ASSERT (Verificar)
  // Verificar que el resultado es el esperado
  expect(resultado).toBe(8);
});
```

### Elementos clave

```javascript
describe('Nombre del Grupo de Tests', () => {
  // describe() agrupa tests relacionados
  
  test('primer test', () => {
    // test() o it() definen un test individual
    expect(valor).toBe(esperado); // assertion
  });
  
  it('segundo test', () => {
    // it() es sinónimo de test()
    expect(valor).toEqual(esperado);
  });
});
```

---

## 🛠️ MATCHERS DE JEST (Verificadores)

### Matchers Básicos

```javascript
// Igualdad estricta (para valores primitivos)
expect(2 + 2).toBe(4);
expect('hola').toBe('hola');
expect(true).toBe(true);

// Igualdad de contenido (para objetos/arrays)
expect({ nombre: 'Juan' }).toEqual({ nombre: 'Juan' });
expect([1, 2, 3]).toEqual([1, 2, 3]);

// No igual
expect(5).not.toBe(3);

// Verdadero/Falso
expect(true).toBeTruthy();
expect(false).toBeFalsy();
expect(0).toBeFalsy();
expect('').toBeFalsy();

// Definido/No definido
expect(variable).toBeDefined();
expect(variable).toBeUndefined();
expect(variable).toBeNull();

// Números
expect(5).toBeGreaterThan(3);
expect(3).toBeLessThan(5);
expect(5).toBeGreaterThanOrEqual(5);
expect(3.14).toBeCloseTo(3.14, 2); // con decimales

// Strings
expect('Hola Mundo').toContain('Mundo');
expect('test@example.com').toMatch(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/);

// Arrays
expect([1, 2, 3]).toContain(2);
expect([1, 2, 3]).toHaveLength(3);

// Excepciones
expect(() => funcionQueError()).toThrow();
expect(() => funcionQueError()).toThrow('Mensaje de error');
```

---

## 📝 TIPOS DE PRUEBAS UNITARIAS

### 1. Pruebas de Funciones Puras

**¿Qué son?** Funciones que siempre retornan el mismo resultado para los mismos parámetros.

```javascript
// ✅ Función Pura
function calcularTotal(precio, cantidad) {
  return precio * cantidad;
}

// ✅ Test
test('calcularTotal multiplica precio por cantidad', () => {
  expect(calcularTotal(100, 3)).toBe(300);
  expect(calcularTotal(50, 2)).toBe(100);
  expect(calcularTotal(0, 10)).toBe(0);
});

test('calcularTotal con valores negativos', () => {
  expect(calcularTotal(-10, 5)).toBe(-50);
});
```

### 2. Pruebas de Validadores

```javascript
// ✅ Función Validadora
function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// ✅ Tests
describe('validateEmail', () => {
  test('retorna true para email válido', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.user@company.co.uk')).toBe(true);
  });
  
  test('retorna false para email inválido', () => {
    expect(validateEmail('invalid')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@example.com')).toBe(false);
    expect(validateEmail('')).toBe(false);
  });
});
```

### 3. Pruebas de Componentes React

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button Component', () => {
  test('renderiza correctamente', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });
  
  test('llama onClick cuando se hace click', () => {
    const handleClick = jest.fn(); // función mock
    render(<Button onClick={handleClick}>Click</Button>);
    
    fireEvent.click(screen.getByText('Click'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
  
  test('se deshabilita cuando disabled es true', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### 4. Pruebas de Hooks Personalizados

```javascript
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  test('inicia en 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });
  
  test('incrementa correctamente', () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
  
  test('decrementa correctamente', () => {
    const { result } = renderHook(() => useCounter(5));
    
    act(() => {
      result.current.decrement();
    });
    
    expect(result.current.count).toBe(4);
  });
});
```

---

## 🎓 EJEMPLOS PRÁCTICOS PARA TU PROYECTO

### Ejemplo 1: Validador de Cantidad

```javascript
// src/lib/validators.js
export function validateQuantity(quantity) {
  // Convertir a número si es string
  const num = Number(quantity);
  
  // Validar que es un número válido
  if (isNaN(num)) {
    return false;
  }
  
  // Validar que es mayor que 0
  if (num <= 0) {
    return false;
  }
  
  // Validar que es entero
  if (!Number.isInteger(num)) {
    return false;
  }
  
  return true;
}
```

```javascript
// src/lib/__tests__/validators.test.js
import { validateQuantity } from '../validators';

describe('validateQuantity', () => {
  test('retorna true para números válidos', () => {
    expect(validateQuantity(1)).toBe(true);
    expect(validateQuantity(100)).toBe(true);
    expect(validateQuantity(5)).toBe(true);
  });
  
  test('retorna false para cero', () => {
    expect(validateQuantity(0)).toBe(false);
  });
  
  test('retorna false para números negativos', () => {
    expect(validateQuantity(-1)).toBe(false);
    expect(validateQuantity(-100)).toBe(false);
  });
  
  test('retorna false para decimales', () => {
    expect(validateQuantity(1.5)).toBe(false);
    expect(validateQuantity(10.99)).toBe(false);
  });
  
  test('retorna false para valores no numéricos', () => {
    expect(validateQuantity('abc')).toBe(false);
    expect(validateQuantity(null)).toBe(false);
    expect(validateQuantity(undefined)).toBe(false);
    expect(validateQuantity({})).toBe(false);
  });
  
  test('acepta strings numéricos válidos', () => {
    expect(validateQuantity('5')).toBe(true);
    expect(validateQuantity('100')).toBe(true);
  });
});
```

### Ejemplo 2: Cálculo de Total

```javascript
// src/lib/calculations.js
export function calculateOrderTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0;
  }
  
  return items.reduce((total, item) => {
    const price = item.price || 0;
    const quantity = item.quantity || 0;
    return total + (price * quantity);
  }, 0);
}
```

```javascript
// src/lib/__tests__/calculations.test.js
import { calculateOrderTotal } from '../calculations';

describe('calculateOrderTotal', () => {
  test('calcula el total correctamente', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: 50, quantity: 3 },
    ];
    
    expect(calculateOrderTotal(items)).toBe(350);
  });
  
  test('retorna 0 para array vacío', () => {
    expect(calculateOrderTotal([])).toBe(0);
  });
  
  test('retorna 0 si no es array', () => {
    expect(calculateOrderTotal(null)).toBe(0);
    expect(calculateOrderTotal(undefined)).toBe(0);
    expect(calculateOrderTotal('not an array')).toBe(0);
  });
  
  test('ignora items sin precio o cantidad', () => {
    const items = [
      { price: 100, quantity: 2 },
      { price: null, quantity: 3 },
      { price: 50 }, // sin quantity
    ];
    
    expect(calculateOrderTotal(items)).toBe(200);
  });
  
  test('maneja precios decimales', () => {
    const items = [
      { price: 10.50, quantity: 2 },
      { price: 5.25, quantity: 4 },
    ];
    
    expect(calculateOrderTotal(items)).toBeCloseTo(42, 2);
  });
});
```

### Ejemplo 3: Componente de Formulario

```javascript
// src/components/OrderForm.jsx
import { useState } from 'react';

export default function OrderForm({ onSubmit }) {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!quantity || Number(quantity) <= 0) {
      setError('La cantidad debe ser mayor que 0');
      return;
    }
    
    setError('');
    onSubmit({ quantity: Number(quantity) });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="quantity">Cantidad:</label>
      <input
        id="quantity"
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      {error && <span role="alert">{error}</span>}
      <button type="submit">Enviar</button>
    </form>
  );
}
```

```javascript
// src/components/__tests__/OrderForm.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import OrderForm from '../OrderForm';

describe('OrderForm', () => {
  test('renderiza el formulario', () => {
    render(<OrderForm onSubmit={jest.fn()} />);
    
    expect(screen.getByLabelText(/cantidad/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument();
  });
  
  test('permite ingresar una cantidad', () => {
    render(<OrderForm onSubmit={jest.fn()} />);
    
    const input = screen.getByLabelText(/cantidad/i);
    fireEvent.change(input, { target: { value: '5' } });
    
    expect(input.value).toBe('5');
  });
  
  test('muestra error si cantidad es 0', () => {
    render(<OrderForm onSubmit={jest.fn()} />);
    
    const input = screen.getByLabelText(/cantidad/i);
    const button = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: '0' } });
    fireEvent.click(button);
    
    expect(screen.getByRole('alert')).toHaveTextContent(/debe ser mayor que 0/i);
  });
  
  test('llama onSubmit con datos válidos', () => {
    const handleSubmit = jest.fn();
    render(<OrderForm onSubmit={handleSubmit} />);
    
    const input = screen.getByLabelText(/cantidad/i);
    const button = screen.getByRole('button', { name: /enviar/i });
    
    fireEvent.change(input, { target: { value: '5' } });
    fireEvent.click(button);
    
    expect(handleSubmit).toHaveBeenCalledWith({ quantity: 5 });
  });
  
  test('no llama onSubmit si hay error', () => {
    const handleSubmit = jest.fn();
    render(<OrderForm onSubmit={handleSubmit} />);
    
    const button = screen.getByRole('button', { name: /enviar/i });
    fireEvent.click(button);
    
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
```

---

## 🎯 BUENAS PRÁCTICAS

### ✅ SÍ Hacer

```javascript
// ✅ Tests descriptivos
test('validateEmail retorna false para emails sin @', () => {
  expect(validateEmail('invalidemail.com')).toBe(false);
});

// ✅ Un concepto por test
test('suma números positivos', () => {
  expect(sumar(2, 3)).toBe(5);
});

test('suma números negativos', () => {
  expect(sumar(-2, -3)).toBe(-5);
});

// ✅ Usar describe para agrupar
describe('Validadores de Email', () => {
  test('email válido', () => { /* ... */ });
  test('email inválido', () => { /* ... */ });
});

// ✅ Tests independientes (no dependen unos de otros)
test('test 1', () => {
  const resultado = funcion1();
  expect(resultado).toBe(true);
});

test('test 2', () => {
  const resultado = funcion2(); // no depende del test 1
  expect(resultado).toBe(false);
});
```

### ❌ NO Hacer

```javascript
// ❌ Tests poco descriptivos
test('funciona', () => { /* ¿qué funciona? */ });

// ❌ Múltiples conceptos en un test
test('valida todo', () => {
  expect(validateEmail('test@test.com')).toBe(true);
  expect(validateQuantity(5)).toBe(true);
  expect(calculateTotal(100, 2)).toBe(200);
});

// ❌ Tests que dependen de otros
let resultado; // estado compartido ❌
test('test 1', () => {
  resultado = funcion1();
});

test('test 2', () => {
  expect(resultado).toBe(true); // depende del test 1
});

// ❌ Demasiados asserts sin relación
test('múltiples cosas', () => {
  expect(a).toBe(1);
  expect(b).toBe(2);
  expect(c).toBe(3);
  expect(d).toBe(4); // difícil saber qué falló
});
```

---

## 🚀 CÓMO EJECUTAR LOS TESTS

### Comandos básicos

```bash
# Ejecutar todos los tests
npm test

# Ejecutar tests en modo watch (se re-ejecutan al cambiar código)
npm test -- --watch

# Ejecutar tests con cobertura
npm test -- --coverage

# Ejecutar un archivo específico
npm test -- validators.test.js

# Ejecutar tests que coincidan con un patrón
npm test -- --testNamePattern="validateEmail"
```

### Interpretando resultados

```
PASS  src/lib/__tests__/validators.test.js
  validateEmail
    ✓ retorna true para email válido (3 ms)
    ✓ retorna false para email inválido (1 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.234 s
```

✅ **PASS** = Todos los tests pasaron  
❌ **FAIL** = Algún test falló  
🟡 **SKIP** = Test saltado

---

## 📊 COBERTURA DE TESTS (Coverage)

### ¿Qué mide?

```
----------|---------|----------|---------|---------|
File      | % Stmts | % Branch | % Funcs | % Lines |
----------|---------|----------|---------|---------|
All files |   85.71 |    75.00 |   80.00 |   85.71 |
validators|  100.00 |   100.00 |  100.00 |  100.00 |
----------|---------|----------|---------|---------|
```

- **Stmts (Statements):** % de líneas ejecutadas
- **Branch:** % de ramas (if/else) ejecutadas
- **Funcs (Functions):** % de funciones llamadas
- **Lines:** % de líneas de código ejecutadas

### Meta de cobertura

```
Target: ≥ 80% en todo

┌────────────────────────────┐
│  90-100%  Excelente  🌟    │
│  80-89%   Bueno      ✅    │
│  70-79%   Aceptable  🟡    │
│  <70%     Insuficiente ❌  │
└────────────────────────────┘
```

---

## 🎓 TU PRIMER TEST - PASO A PASO

### Paso 1: Crea la función

```javascript
// src/lib/validators.js
export function validateQuantity(quantity) {
  const num = Number(quantity);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
}
```

### Paso 2: Crea el archivo de test

```javascript
// src/lib/__tests__/validators.test.js
import { validateQuantity } from '../validators';

describe('validateQuantity', () => {
  test('retorna true para cantidad válida', () => {
    expect(validateQuantity(5)).toBe(true);
  });
});
```

### Paso 3: Ejecuta el test

```bash
npm test validators.test.js
```

### Paso 4: Agrega más casos

```javascript
describe('validateQuantity', () => {
  test('retorna true para cantidad válida', () => {
    expect(validateQuantity(5)).toBe(true);
  });
  
  test('retorna false para cantidad negativa', () => {
    expect(validateQuantity(-1)).toBe(false);
  });
  
  test('retorna false para cero', () => {
    expect(validateQuantity(0)).toBe(false);
  });
});
```

---

## 🎯 CHECKLIST DE UN BUEN TEST

```
[ ] Tiene nombre descriptivo
[ ] Prueba un solo concepto
[ ] Es independiente de otros tests
[ ] Es rápido (< 1 segundo)
[ ] Es predecible (siempre mismo resultado)
[ ] Cubre casos normales
[ ] Cubre casos límite (edge cases)
[ ] Cubre casos de error
[ ] Es fácil de entender
[ ] No tiene lógica compleja
```

---

## 📚 RECURSOS ADICIONALES

### Documentación Oficial
- Jest: https://jestjs.io/docs/getting-started
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro
- Jest Matchers: https://jestjs.io/docs/expect

### Guías del Proyecto
- [02_IMPLEMENTACION_PRACTICA.md](../02_IMPLEMENTACION_PRACTICA.md) - Setup completo
- [GUIA_RAPIDA_QA.md](../GUIA_RAPIDA_QA.md) - Referencia rápida

---

## 💡 TIPS FINALES

1. **Empieza simple** - Un test es mejor que ninguno
2. **Escribe tests al desarrollar** - No los dejes para después
3. **Lee tests como documentación** - Explican cómo usar el código
4. **No busques 100% cobertura** - Prioriza código crítico
5. **Mantén tests simples** - Si el test es complejo, el código probablemente también

---

**Creado:** 5 de febrero de 2026  
**Para:** Equipo de desarrollo pedido-ebs-web  
**Próxima actualización:** Conforme se agreguen ejemplos

---

## 🎉 ¡Ahora a practicar!

1. Crea tu primer test siguiendo los ejemplos
2. Ejecuta `npm test`
3. Ve el resultado
4. Agrega más tests
5. Celebra cuando todos pasen ✅

**¿Preguntas?** Consulta GUIA_RAPIDA_QA.md o pregunta al Tech Lead.
