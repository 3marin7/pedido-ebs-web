// src/lib/validators.js
/**
 * Validadores para el sistema de pedidos
 */

/**
 * Valida que un email tenga formato correcto
 * @param {string} email - Email a validar
 * @returns {boolean} - True si es válido
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return false
  }
  
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email.trim())
}

/**
 * Valida que una cantidad sea un número entero positivo
 * @param {number|string} quantity - Cantidad a validar
 * @returns {boolean} - True si es válida
 */
export function validateQuantity(quantity) {
  // Convertir a número si es string
  const num = Number(quantity)
  
  // Validar que es un número válido
  if (isNaN(num)) {
    return false
  }
  
  // Validar que es mayor que 0
  if (num <= 0) {
    return false
  }
  
  // Validar que es entero
  if (!Number.isInteger(num)) {
    return false
  }
  
  return true
}

/**
 * Valida que un precio sea un número positivo
 * @param {number|string} price - Precio a validar
 * @returns {boolean} - True si es válido
 */
export function validatePrice(price) {
  if (price === null || price === undefined) {
    return false
  }
  
  const num = Number(price)
  
  if (isNaN(num)) {
    return false
  }
  
  if (num < 0) {
    return false
  }
  
  return true
}

/**
 * Valida que un RUC tenga formato válido (Ecuador: 13 dígitos)
 * @param {string} ruc - RUC a validar
 * @returns {boolean} - True si es válido
 */
export function validateRUC(ruc) {
  if (!ruc || typeof ruc !== 'string') {
    return false
  }
  
  const cleanRUC = ruc.trim()
  
  // Debe tener exactamente 13 dígitos
  if (cleanRUC.length !== 13) {
    return false
  }
  
  // Debe ser solo números
  if (!/^\d+$/.test(cleanRUC)) {
    return false
  }
  
  return true
}

/**
 * Valida que un teléfono tenga formato válido (Ecuador: 10 dígitos)
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} - True si es válido
 */
export function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') {
    return false
  }
  
  const cleanPhone = phone.replace(/[\s\-()]/g, '')
  
  // Debe tener 10 dígitos
  if (cleanPhone.length !== 10) {
    return false
  }
  
  // Debe ser solo números
  if (!/^\d+$/.test(cleanPhone)) {
    return false
  }
  
  // Debe empezar con 0
  if (!cleanPhone.startsWith('0')) {
    return false
  }
  
  return true
}

/**
 * Valida que un stock no sea negativo
 * @param {number|string} stock - Stock a validar
 * @returns {boolean} - True si es válido
 */
export function validateStock(stock) {
  if (stock === null || stock === undefined) {
    return false
  }
  
  const num = Number(stock)
  
  if (isNaN(num)) {
    return false
  }
  
  if (num < 0) {
    return false
  }
  
  if (!Number.isInteger(num)) {
    return false
  }
  
  return true
}

/**
 * Calcula el total de un pedido
 * @param {Array} items - Items del pedido con precio y cantidad
 * @returns {number} - Total calculado
 */
export function calculateOrderTotal(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return 0
  }
  
  return items.reduce((total, item) => {
    const price = item.price || 0
    const quantity = item.quantity || 0
    return total + (price * quantity)
  }, 0)
}
