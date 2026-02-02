import { supabase } from './supabase'

// Calcula ventas por producto en un periodo y devuelve score 1-5 y recomendaciones
export async function getProductSalesAndRecommendations({ periodDays = 90, leadTimeDays = 14, safetyDays = 7 } = {}) {
  try {
    const start = new Date()
    start.setDate(start.getDate() - periodDays)
    const fechaInicio = start.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('detalles_factura')
      .select('producto_id, cantidad, facturas(fecha), productos(id, nombre, stock)')

    if (error) throw error

    // Filtrar por fecha del rango (siempre que exista la relación facturas)
    const detalles = (data || []).filter(d => d.facturas && new Date(d.facturas.fecha) >= new Date(fechaInicio))

    // Agregar ventas por producto
    const ventasMap = new Map()
    detalles.forEach(d => {
      const pid = d.producto_id
      const cantidad = parseFloat(d.cantidad) || 0
      const prodInfo = d.productos || null
      if (!ventasMap.has(pid)) ventasMap.set(pid, { producto_id: pid, totalSold: 0, producto: prodInfo })
      ventasMap.get(pid).totalSold += cantidad
    })

    const results = Array.from(ventasMap.values())

    // Calcular avg diario y encontrar máximo para normalizar score
    results.forEach(r => {
      r.avgDaily = r.totalSold / periodDays
    })

    const maxAvg = results.reduce((m, r) => Math.max(m, r.avgDaily), 0)

    // Asignar score 1-5 y calcular puntos de reorden
    results.forEach(r => {
      r.rotation = maxAvg > 0 ? Math.max(1, Math.min(5, Math.ceil((r.avgDaily / maxAvg) * 5))) : 1
      const reorderPoint = Math.ceil(r.avgDaily * leadTimeDays + r.avgDaily * safetyDays)
      const currentStock = r.producto && typeof r.producto.stock === 'number' ? r.producto.stock : null
      r.reorderPoint = reorderPoint
      r.suggestedOrder = currentStock === null ? null : Math.max(0, reorderPoint - currentStock)
    })

    return results
  } catch (err) {
    console.error('Error en getProductSalesAndRecommendations:', err)
    return []
  }
}

// Helper para combinar con lista completa de productos
export function mergeRecommendationsIntoProducts(productos, recs) {
  const map = new Map(recs.map(r => [r.producto_id, r]))
  return productos.map(p => {
    const r = map.get(p.id) || { totalSold: 0, avgDaily: 0, rotation: 1, reorderPoint: 0, suggestedOrder: 0 }
    const suggestedOrder = r.suggestedOrder === null || r.suggestedOrder === undefined ? 0 : r.suggestedOrder
    return { ...p, rotation: r.rotation, totalSold: r.totalSold, avgDaily: r.avgDaily, reorderPoint: r.reorderPoint, suggestedOrder }
  })
}
