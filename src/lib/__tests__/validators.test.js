// src/lib/__tests__/validators.test.js
import { 
  validateEmail, 
  validateQuantity, 
  validatePrice,
  validateRUC,
  validatePhone,
  validateStock,
  calculateOrderTotal
} from '../validators'

describe('Validators', () => {
  
  // ============================================
  // TESTS DE VALIDATEEMAIL
  // ============================================
  describe('validateEmail', () => {
    test('retorna true para emails válidos', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@company.co.uk')).toBe(true)
      expect(validateEmail('admin@pedidos-ebs.com')).toBe(true)
      expect(validateEmail('contact+spam@example.org')).toBe(true)
    })
    
    test('retorna false para emails inválidos', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user @example.com')).toBe(false) // con espacio
      expect(validateEmail('user@example')).toBe(false) // sin dominio
    })
    
    test('retorna false para valores vacíos o null', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail(null)).toBe(false)
      expect(validateEmail(undefined)).toBe(false)
    })
    
    test('retorna false para tipos no string', () => {
      expect(validateEmail(123)).toBe(false)
      expect(validateEmail({})).toBe(false)
      expect(validateEmail([])).toBe(false)
    })
    
    test('maneja espacios en blanco correctamente', () => {
      expect(validateEmail('  user@example.com  ')).toBe(true) // trim interno
      expect(validateEmail('   ')).toBe(false)
    })
  })
  
  // ============================================
  // TESTS DE VALIDATEQUANTITY
  // ============================================
  describe('validateQuantity', () => {
    test('retorna true para cantidades válidas', () => {
      expect(validateQuantity(1)).toBe(true)
      expect(validateQuantity(100)).toBe(true)
      expect(validateQuantity(5)).toBe(true)
      expect(validateQuantity(9999)).toBe(true)
    })
    
    test('retorna false para cero', () => {
      expect(validateQuantity(0)).toBe(false)
    })
    
    test('retorna false para números negativos', () => {
      expect(validateQuantity(-1)).toBe(false)
      expect(validateQuantity(-100)).toBe(false)
      expect(validateQuantity(-0.5)).toBe(false)
    })
    
    test('retorna false para decimales', () => {
      expect(validateQuantity(1.5)).toBe(false)
      expect(validateQuantity(10.99)).toBe(false)
      expect(validateQuantity(0.1)).toBe(false)
    })
    
    test('retorna false para valores no numéricos', () => {
      expect(validateQuantity('abc')).toBe(false)
      expect(validateQuantity(null)).toBe(false)
      expect(validateQuantity(undefined)).toBe(false)
      expect(validateQuantity({})).toBe(false)
      expect(validateQuantity([])).toBe(false)
    })
    
    test('acepta strings numéricos válidos', () => {
      expect(validateQuantity('5')).toBe(true)
      expect(validateQuantity('100')).toBe(true)
    })
    
    test('rechaza strings numéricos inválidos', () => {
      expect(validateQuantity('0')).toBe(false)
      expect(validateQuantity('-5')).toBe(false)
      expect(validateQuantity('1.5')).toBe(false)
    })
  })
  
  // ============================================
  // TESTS DE VALIDATEPRICE
  // ============================================
  describe('validatePrice', () => {
    test('retorna true para precios válidos', () => {
      expect(validatePrice(0)).toBe(true) // precio puede ser 0
      expect(validatePrice(10)).toBe(true)
      expect(validatePrice(99.99)).toBe(true)
      expect(validatePrice(1000.50)).toBe(true)
    })
    
    test('retorna false para precios negativos', () => {
      expect(validatePrice(-1)).toBe(false)
      expect(validatePrice(-99.99)).toBe(false)
    })
    
    test('acepta strings numéricos', () => {
      expect(validatePrice('100')).toBe(true)
      expect(validatePrice('99.99')).toBe(true)
      expect(validatePrice('0')).toBe(true)
    })
    
    test('retorna false para valores no numéricos', () => {
      expect(validatePrice('abc')).toBe(false)
      expect(validatePrice(null)).toBe(false)
      expect(validatePrice(undefined)).toBe(false)
      expect(validatePrice({})).toBe(false)
    })
  })
  
  // ============================================
  // TESTS DE VALIDATERUC (Ecuador - 13 dígitos)
  // ============================================
  describe('validateRUC', () => {
    test('retorna true para RUC válido de 13 dígitos', () => {
      expect(validateRUC('1234567890001')).toBe(true)
      expect(validateRUC('0987654321001')).toBe(true)
    })
    
    test('retorna false para RUC con longitud incorrecta', () => {
      expect(validateRUC('123456789')).toBe(false) // muy corto
      expect(validateRUC('12345678900011')).toBe(false) // muy largo
      expect(validateRUC('123')).toBe(false)
    })
    
    test('retorna false para RUC con caracteres no numéricos', () => {
      expect(validateRUC('123456789000A')).toBe(false)
      expect(validateRUC('1234-5678-9000')).toBe(false)
      expect(validateRUC('1234 5678 9000')).toBe(false)
    })
    
    test('retorna false para valores vacíos o null', () => {
      expect(validateRUC('')).toBe(false)
      expect(validateRUC(null)).toBe(false)
      expect(validateRUC(undefined)).toBe(false)
    })
    
    test('retorna false para tipos no string', () => {
      expect(validateRUC(1234567890001)).toBe(false)
      expect(validateRUC({})).toBe(false)
    })
    
    test('maneja espacios en blanco', () => {
      expect(validateRUC('  1234567890001  ')).toBe(true) // trim
      expect(validateRUC('   ')).toBe(false)
    })
  })
  
  // ============================================
  // TESTS DE VALIDATEPHONE (Ecuador - 10 dígitos)
  // ============================================
  describe('validatePhone', () => {
    test('retorna true para teléfonos válidos', () => {
      expect(validatePhone('0987654321')).toBe(true)
      expect(validatePhone('0912345678')).toBe(true)
      expect(validatePhone('0223456789')).toBe(true)
    })
    
    test('acepta formato con guiones y paréntesis', () => {
      expect(validatePhone('098-765-4321')).toBe(true)
      expect(validatePhone('(098) 765-4321')).toBe(true)
      expect(validatePhone('098 765 4321')).toBe(true)
    })
    
    test('retorna false para teléfonos que no empiezan con 0', () => {
      expect(validatePhone('1987654321')).toBe(false)
      expect(validatePhone('9876543210')).toBe(false)
    })
    
    test('retorna false para longitud incorrecta', () => {
      expect(validatePhone('098765432')).toBe(false) // 9 dígitos
      expect(validatePhone('09876543211')).toBe(false) // 11 dígitos
      expect(validatePhone('098')).toBe(false)
    })
    
    test('retorna false para valores no numéricos', () => {
      expect(validatePhone('098765432A')).toBe(false)
      expect(validatePhone('abcdefghij')).toBe(false)
    })
    
    test('retorna false para valores vacíos o null', () => {
      expect(validatePhone('')).toBe(false)
      expect(validatePhone(null)).toBe(false)
      expect(validatePhone(undefined)).toBe(false)
    })
  })
  
  // ============================================
  // TESTS DE VALIDATESTOCK
  // ============================================
  describe('validateStock', () => {
    test('retorna true para stock válido', () => {
      expect(validateStock(0)).toBe(true) // stock puede ser 0
      expect(validateStock(10)).toBe(true)
      expect(validateStock(100)).toBe(true)
      expect(validateStock(9999)).toBe(true)
    })
    
    test('retorna false para stock negativo', () => {
      expect(validateStock(-1)).toBe(false)
      expect(validateStock(-100)).toBe(false)
    })
    
    test('retorna false para decimales', () => {
      expect(validateStock(10.5)).toBe(false)
      expect(validateStock(0.99)).toBe(false)
    })
    
    test('acepta strings numéricos válidos', () => {
      expect(validateStock('10')).toBe(true)
      expect(validateStock('0')).toBe(true)
    })
    
    test('retorna false para valores no numéricos', () => {
      expect(validateStock('abc')).toBe(false)
      expect(validateStock(null)).toBe(false)
      expect(validateStock(undefined)).toBe(false)
    })
  })
  
  // ============================================
  // TESTS DE CALCULATEORDERTOTAL
  // ============================================
  describe('calculateOrderTotal', () => {
    test('calcula el total correctamente', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 },
      ]
      
      expect(calculateOrderTotal(items)).toBe(350)
    })
    
    test('retorna 0 para array vacío', () => {
      expect(calculateOrderTotal([])).toBe(0)
    })
    
    test('retorna 0 si no es array', () => {
      expect(calculateOrderTotal(null)).toBe(0)
      expect(calculateOrderTotal(undefined)).toBe(0)
      expect(calculateOrderTotal('not an array')).toBe(0)
      expect(calculateOrderTotal({})).toBe(0)
    })
    
    test('ignora items sin precio o cantidad', () => {
      const items = [
        { price: 100, quantity: 2 }, // 200
        { price: null, quantity: 3 }, // 0
        { price: 50 }, // sin quantity = 0
        { quantity: 5 }, // sin price = 0
      ]
      
      expect(calculateOrderTotal(items)).toBe(200)
    })
    
    test('maneja precios decimales correctamente', () => {
      const items = [
        { price: 10.50, quantity: 2 },
        { price: 5.25, quantity: 4 },
      ]
      
      expect(calculateOrderTotal(items)).toBeCloseTo(42, 2)
    })
    
    test('calcula correctamente con un solo item', () => {
      const items = [{ price: 99.99, quantity: 1 }]
      
      expect(calculateOrderTotal(items)).toBeCloseTo(99.99, 2)
    })
    
    test('maneja cantidades grandes', () => {
      const items = [
        { price: 0.01, quantity: 1000 },
        { price: 100, quantity: 100 },
      ]
      
      expect(calculateOrderTotal(items)).toBe(10010)
    })
    
    test('retorna 0 si todos los precios son 0', () => {
      const items = [
        { price: 0, quantity: 10 },
        { price: 0, quantity: 5 },
      ]
      
      expect(calculateOrderTotal(items)).toBe(0)
    })
  })
})
