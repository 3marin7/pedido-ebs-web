// src/lib/__tests__/inventoryUtils.test.js
import { mergeRecommendationsIntoProducts } from '../inventoryUtils'

describe('inventoryUtils', () => {
  describe('mergeRecommendationsIntoProducts', () => {
    test('combina productos con recomendaciones correctamente', () => {
      // ARRANGE - Preparar datos de prueba
      const productos = [
        { id: 1, nombre: 'Producto A', stock: 10 },
        { id: 2, nombre: 'Producto B', stock: 5 }
      ]
      
      const recomendaciones = [
        { 
          producto_id: 1, 
          rotation: 5, 
          totalSold: 100, 
          avgDaily: 10, 
          reorderPoint: 50, 
          suggestedOrder: 40 
        }
      ]
      
      // ACT - Ejecutar la función
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      // ASSERT - Verificar resultados
      expect(resultado).toHaveLength(2)
      
      // Producto 1 debe tener las recomendaciones
      expect(resultado[0]).toMatchObject({
        id: 1,
        nombre: 'Producto A',
        stock: 10,
        rotation: 5,
        totalSold: 100,
        avgDaily: 10,
        reorderPoint: 50,
        suggestedOrder: 40
      })
      
      // Producto 2 debe tener valores por defecto
      expect(resultado[1]).toMatchObject({
        id: 2,
        nombre: 'Producto B',
        stock: 5,
        rotation: 1,
        totalSold: 0,
        avgDaily: 0,
        reorderPoint: 0,
        suggestedOrder: 0
      })
    })
    
    test('maneja array de productos vacío', () => {
      const productos = []
      const recomendaciones = []
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado).toEqual([])
    })
    
    test('maneja array de recomendaciones vacío', () => {
      const productos = [
        { id: 1, nombre: 'Producto A', stock: 10 }
      ]
      const recomendaciones = []
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado).toHaveLength(1)
      expect(resultado[0].rotation).toBe(1)
      expect(resultado[0].totalSold).toBe(0)
    })
    
    test('maneja suggestedOrder null o undefined', () => {
      const productos = [
        { id: 1, nombre: 'Producto A', stock: 10 }
      ]
      
      const recomendaciones = [
        { 
          producto_id: 1, 
          rotation: 3, 
          totalSold: 50, 
          avgDaily: 5, 
          reorderPoint: 25, 
          suggestedOrder: null // valor null
        }
      ]
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado[0].suggestedOrder).toBe(0) // debe convertir null a 0
    })
    
    test('preserva propiedades adicionales de productos', () => {
      const productos = [
        { 
          id: 1, 
          nombre: 'Producto A', 
          stock: 10, 
          precio: 100, 
          categoria: 'Electrónica' 
        }
      ]
      
      const recomendaciones = [
        { producto_id: 1, rotation: 4, totalSold: 80, avgDaily: 8, reorderPoint: 40, suggestedOrder: 30 }
      ]
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado[0].precio).toBe(100)
      expect(resultado[0].categoria).toBe('Electrónica')
    })
    
    test('maneja múltiples productos con algunas recomendaciones', () => {
      const productos = [
        { id: 1, nombre: 'Producto A', stock: 10 },
        { id: 2, nombre: 'Producto B', stock: 5 },
        { id: 3, nombre: 'Producto C', stock: 15 }
      ]
      
      const recomendaciones = [
        { producto_id: 1, rotation: 5, totalSold: 100, avgDaily: 10, reorderPoint: 50, suggestedOrder: 40 },
        { producto_id: 3, rotation: 3, totalSold: 60, avgDaily: 6, reorderPoint: 30, suggestedOrder: 15 }
      ]
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado).toHaveLength(3)
      expect(resultado[0].rotation).toBe(5) // A tiene recomendación
      expect(resultado[1].rotation).toBe(1) // B usa valor por defecto
      expect(resultado[2].rotation).toBe(3) // C tiene recomendación
    })
  })
})

describe('inventoryUtils', () => {
  describe('mergeRecommendationsIntoProducts', () => {
    test('combina productos con recomendaciones correctamente', () => {
      // ARRANGE - Preparar datos de prueba
      const productos = [
        { id: 1, nombre: 'Producto A', stock: 10 },
        { id: 2, nombre: 'Producto B', stock: 5 }
      ]
      
      const recomendaciones = [
        { 
          producto_id: 1, 
          rotation: 5, 
          totalSold: 100, 
          avgDaily: 10, 
          reorderPoint: 50, 
          suggestedOrder: 40 
        }
      ]
      
      // ACT - Ejecutar la función
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      // ASSERT - Verificar resultados
      expect(resultado).toHaveLength(2)
      
      // Producto 1 debe tener las recomendaciones
      expect(resultado[0]).toMatchObject({
        id: 1,
        nombre: 'Producto A',
        stock: 10,
        rotation: 5,
        totalSold: 100,
        avgDaily: 10,
        reorderPoint: 50,
        suggestedOrder: 40
      })
      
      // Producto 2 debe tener valores por defecto
      expect(resultado[1]).toMatchObject({
        id: 2,
        nombre: 'Producto B',
        stock: 5,
        rotation: 1,
        totalSold: 0,
        avgDaily: 0,
        reorderPoint: 0,
        suggestedOrder: 0
      })
    })
    
    test('maneja array de productos vacío', () => {
      const productos = []
      const recomendaciones = []
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado).toEqual([])
    })
    
    test('maneja array de recomendaciones vacío', () => {
      const productos = [
        { id: 1, nombre: 'Producto A', stock: 10 }
      ]
      const recomendaciones = []
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado).toHaveLength(1)
      expect(resultado[0].rotation).toBe(1)
      expect(resultado[0].totalSold).toBe(0)
    })
    
    test('maneja suggestedOrder null o undefined', () => {
      const productos = [
        { id: 1, nombre: 'Producto A', stock: 10 }
      ]
      
      const recomendaciones = [
        { 
          producto_id: 1, 
          rotation: 3, 
          totalSold: 50, 
          avgDaily: 5, 
          reorderPoint: 25, 
          suggestedOrder: null // valor null
        }
      ]
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado[0].suggestedOrder).toBe(0) // debe convertir null a 0
    })
    
    test('preserva propiedades adicionales de productos', () => {
      const productos = [
        { 
          id: 1, 
          nombre: 'Producto A', 
          stock: 10, 
          precio: 100, 
          categoria: 'Electrónica' 
        }
      ]
      
      const recomendaciones = [
        { producto_id: 1, rotation: 4, totalSold: 80, avgDaily: 8, reorderPoint: 40, suggestedOrder: 30 }
      ]
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado[0].precio).toBe(100)
      expect(resultado[0].categoria).toBe('Electrónica')
    })
    
    test('maneja múltiples productos con algunas recomendaciones', () => {
      const productos = [
        { id: 1, nombre: 'Producto A', stock: 10 },
        { id: 2, nombre: 'Producto B', stock: 5 },
        { id: 3, nombre: 'Producto C', stock: 15 }
      ]
      
      const recomendaciones = [
        { producto_id: 1, rotation: 5, totalSold: 100, avgDaily: 10, reorderPoint: 50, suggestedOrder: 40 },
        { producto_id: 3, rotation: 3, totalSold: 60, avgDaily: 6, reorderPoint: 30, suggestedOrder: 15 }
      ]
      
      const resultado = mergeRecommendationsIntoProducts(productos, recomendaciones)
      
      expect(resultado).toHaveLength(3)
      expect(resultado[0].rotation).toBe(5) // A tiene recomendación
      expect(resultado[1].rotation).toBe(1) // B usa valor por defecto
      expect(resultado[2].rotation).toBe(3) // C tiene recomendación
    })
  })
})
