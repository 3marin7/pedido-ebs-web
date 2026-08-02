// src/lib/preventaUtils.js
/**
 * Utilidades para gestionar pre-ventas
 * Funciones auxiliares para checkout y carrito
 */

import { supabase } from './supabase';

/**
 * Procesar un pedido que contiene productos en preventa
 * @param {Array} productosCarrito - Productos en el carrito
 * @param {Object} datosCliente - Info del cliente (nombre, telefono, direccion)
 * @returns {Object} - {pedidoId, prevPedidosCreados, totalNormal}
 */
export async function procesarCarritoConPreventa(productosCarrito, datosCliente) {
  try {
    // 1. Separar productos normales vs preventa
    const productosNormales = productosCarrito.filter(p => !p.es_preventa);
    const productosPreventa = productosCarrito.filter(p => p.es_preventa);

    let pedidoId = null;
    const prevPedidosCreados = [];

    // 2. Si hay productos normales, crear pedido normal
    if (productosNormales.length > 0) {
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_nombre: datosCliente.nombre,
            cliente_telefono: datosCliente.telefono,
            cliente_direccion: datosCliente.direccion,
            cliente_notas: datosCliente.notas || '',
            productos: productosNormales.map(p => ({
              id: p.id,
              nombre: p.nombre,
              cantidad: p.cantidad,
              precio_unitario: p.precio_venta,
              total: p.cantidad * p.precio_venta,
            })),
            total: productosNormales.reduce((sum, p) => sum + (p.cantidad * p.precio_venta), 0),
            estado: 'pendiente',
            es_preventa: false,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      pedidoId = pedido.id;
    }

    // 3. Si hay productos en preventa, crear un pedido especial
    if (productosPreventa.length > 0) {
      // Crear pedido de preventa
      const { data: pedidoPreventa, error: errPreventa } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_nombre: datosCliente.nombre,
            cliente_telefono: datosCliente.telefono,
            cliente_direccion: datosCliente.direccion,
            cliente_notas: datosCliente.notas || '',
            productos: productosPreventa.map(p => ({
              id: p.id,
              nombre: p.nombre,
              cantidad: p.cantidad,
              precio_unitario: p.precio_venta,
              total: p.cantidad * p.precio_venta,
            })),
            total: productosPreventa.reduce((sum, p) => sum + (p.cantidad * p.precio_venta), 0),
            estado: 'reservado',
            es_preventa: true,
          }
        ])
        .select()
        .single();

      if (errPreventa) throw errPreventa;

      // 4. Crear registros individuales en preventa_pedidos
      const prevPedidosInsert = [];
      for (const producto of productosPreventa) {
        prevPedidosInsert.push({
          pedido_id: pedidoPreventa.id,
          producto_id: producto.id,
          cantidad: producto.cantidad,
          precio_unitario: producto.precio_venta,
          estado: 'reservado',
          notas: `Reserva de ${datosCliente.nombre}`,
        });
      }

      const { data: prevCreados, error: errPrevCreados } = await supabase
        .from('preventa_pedidos')
        .insert(prevPedidosInsert)
        .select();

      if (errPrevCreados) throw errPrevCreados;
      prevPedidosCreados.push(...prevCreados);

      // 5. Actualizar stock_preventa de productos
      for (const producto of productosPreventa) {
        const { error: errUpdate } = await supabase
          .rpc('incrementar_stock_preventa', {
            producto_id: producto.id,
            cantidad: producto.cantidad,
          });

        if (errUpdate) console.warn('Error actualizando stock_preventa:', errUpdate);
      }
    }

    return {
      pedidoId,
      prevPedidosCreados,
      totalProductosNormales: productosNormales.length,
      totalProductosPreventa: productosPreventa.length,
      exitoso: true,
    };
  } catch (error) {
    console.error('Error procesando carrito con preventa:', error);
    return {
      exitoso: false,
      error: error.message,
    };
  }
}

/**
 * Obtener información de preventa de un producto
 */
export async function obtenerInfoPreventa(productoId) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('es_preventa, fecha_disponibilidad, stock_preventa, descripcion_preventa')
      .eq('id', productoId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obteniendo info preventa:', error);
    return null;
  }
}

/**
 * Calcular días hasta disponibilidad
 */
export function calcularDiasRestantes(fechaDisponibilidad) {
  const hoy = new Date();
  const fecha = new Date(fechaDisponibilidad);
  const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

/**
 * Función RPC para incrementar stock_preventa
 * NOTA: Esta función debe crearse en Supabase
 */
export async function crearFuncionIncrementarStockPreventa() {
  const sql = `
    CREATE OR REPLACE FUNCTION incrementar_stock_preventa(
      producto_id BIGINT, 
      cantidad INTEGER
    )
    RETURNS TABLE(producto_id BIGINT, nuevo_stock INTEGER) AS $$
    BEGIN
      UPDATE productos 
      SET stock_preventa = stock_preventa + cantidad,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = producto_id;
      
      RETURN QUERY
      SELECT productos.id, productos.stock_preventa
      FROM productos
      WHERE productos.id = producto_id;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  return sql;
}

/**
 * Verificar si hay conflicto: ¿se puede cumplir un pedido de preventa?
 */
export async function verificarCumplimientoPreventa(productoId, cantidadRequerida) {
  try {
    const { data, error } = await supabase
      .from('productos')
      .select('stock, stock_preventa')
      .eq('id', productoId)
      .single();

    if (error) throw error;

    const stockDisponible = data.stock - data.stock_preventa;
    return {
      puedeComprarse: stockDisponible >= cantidadRequerida,
      stockDisponible,
      stockPreventaAcumulado: data.stock_preventa,
    };
  } catch (error) {
    console.error('Error verificando cumplimiento:', error);
    return { puedeComprarse: false, error: error.message };
  }
}

/**
 * Obtener historial de una pre-venta
 */
export async function obtenerHistorialPreventa(prevPedidoId) {
  try {
    const { data, error } = await supabase
      .from('historial_preventa')
      .select('*')
      .eq('preventa_pedido_id', prevPedidoId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
}

/**
 * Formatear resumen de carrito con preventa
 */
export function formatearResumenCarrito(productosCarrito) {
  const normales = productosCarrito.filter(p => !p.es_preventa);
  const preventa = productosCarrito.filter(p => p.es_preventa);

  return {
    total: productosCarrito.length,
    normales: normales.length,
    preventa: preventa.length,
    totalPrecio: productosCarrito.reduce((sum, p) => sum + (p.cantidad * p.precio_venta), 0),
    totalPrecioNormales: normales.reduce((sum, p) => sum + (p.cantidad * p.precio_venta), 0),
    totalPrecioPreventa: preventa.reduce((sum, p) => sum + (p.cantidad * p.precio_venta), 0),
    productosPreventa: preventa.map(p => ({
      nombre: p.nombre,
      cantidad: p.cantidad,
      fechaDisponibilidad: p.fecha_disponibilidad,
      diasRestantes: calcularDiasRestantes(p.fecha_disponibilidad),
    })),
  };
}

/**
 * Template de email para notificar cumplimiento de preventa
 */
export function generarEmailCumplimientoPreventa(cliente, productos) {
  return {
    subject: `¡Tu pre-venta de ${productos[0].nombre} está disponible!`,
    html: `
      <h2>¡Buenas noticias ${cliente.nombre}!</h2>
      <p>Tu pre-venta ha sido cumplida. El producto ya está disponible:</p>
      <ul>
        ${productos.map(p => `<li>${p.nombre} x${p.cantidad}</li>`).join('')}
      </ul>
      <p>Tu pedido se procesará automáticamente.</p>
    `,
  };
}

export default {
  procesarCarritoConPreventa,
  obtenerInfoPreventa,
  calcularDiasRestantes,
  verificarCumplimientoPreventa,
  obtenerHistorialPreventa,
  formatearResumenCarrito,
  generarEmailCumplimientoPreventa,
};
