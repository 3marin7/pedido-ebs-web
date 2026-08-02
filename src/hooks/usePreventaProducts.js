// src/hooks/usePreventaProducts.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gestionar productos en pre-venta
 */
export const usePreventaProducts = () => {
  const [productosPreventa, setProductosPreventa] = useState([]);
  const [productosInventario, setProductosInventario] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Cargar productos en preventa
  const cargarProductosPreventa = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('productos')
        .select('*')
        .eq('es_preventa', true)
        .order('fecha_disponibilidad', { ascending: true });

      if (err) throw err;
      setProductosPreventa(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const cargarProductosInventario = async () => {
    try {
      const { data, error: err } = await supabase
        .from('productos')
        .select('id,nombre,categoria,descripcion,precio_venta,imagen_url,fecha_disponibilidad,descripcion_preventa,activo,es_preventa')
        .eq('activo', false)
        .not('es_preventa', 'eq', true)
        .order('nombre', { ascending: true });
      if (err) throw err;
      setProductosInventario(data || []);
    } catch (err) {
      setError(err.message);
    }
  };

  const sanitizeProductoPayload = (producto) => {
    const payload = {
      ...producto,
      es_preventa: true,
      stock: 0, // Inicialmente sin stock real
    };

    // Si la columna no existe en la tabla, Supabase devolverá error.
    // Para evitar que la app se rompa, descartamos temporalmente ese campo.
    if (payload.descripcion_preventa === undefined || payload.descripcion_preventa === null) {
      delete payload.descripcion_preventa;
    }

    return payload;
  };

  const handlePostgresColumnError = (error, datosGuardar) => {
    const mensaje = error?.message || '';
    if (mensaje.includes("Could not find the 'descripcion_preventa' column")) {
      const datosSinDescripcionPreventa = { ...datosGuardar };
      delete datosSinDescripcionPreventa.descripcion_preventa;
      return datosSinDescripcionPreventa;
    }
    return null;
  };

  // Crear/actualizar producto en preventa
  const guardarProductoPreventa = async (producto) => {
    try {
      let datosGuardar = sanitizeProductoPayload(producto);
      let resultado;

      if (producto.id) {
        // Actualizar
        const { data, error: err } = await supabase
          .from('productos')
          .update(datosGuardar)
          .eq('id', producto.id)
          .select();

        if (err) {
          const retryPayload = handlePostgresColumnError(err, datosGuardar);
          if (retryPayload) {
            const { data: retryData, error: retryErr } = await supabase
              .from('productos')
              .update(retryPayload)
              .eq('id', producto.id)
              .select();
            if (retryErr) throw retryErr;
            resultado = retryData?.[0];
          } else {
            throw err;
          }
        } else {
          resultado = data?.[0];
        }
      } else {
        // Crear nuevo
        const { data, error: err } = await supabase
          .from('productos')
          .insert([datosGuardar])
          .select();

        if (err) {
          const retryPayload = handlePostgresColumnError(err, datosGuardar);
          if (retryPayload) {
            const { data: retryData, error: retryErr } = await supabase
              .from('productos')
              .insert([retryPayload])
              .select();
            if (retryErr) throw retryErr;
            resultado = retryData?.[0];
          } else {
            throw err;
          }
        } else {
          resultado = data?.[0];
        }
      }

      await cargarProductosPreventa();
      await cargarProductosInventario();
      return resultado;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Pasar producto de preventa a disponible (cuando entra stock)
  const activarProductoDelInventario = async (productoId, stockIngreso) => {
    try {
      const { data, error: err } = await supabase
        .from('productos')
        .update({
          es_preventa: false,
          stock: stockIngreso,
        })
        .eq('id', productoId)
        .select();

      if (err) throw err;
      await cargarProductosPreventa();
      return data?.[0];
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  // Obtener pedidos de preventa pendientes de un producto
  const obtenerPedidosPreventa = async (productoId) => {
    try {
      const { data, error: err } = await supabase
        .from('preventa_pedidos')
        .select('*, pedidos(cliente_nombre, cliente_telefono, cliente_direccion)')
        .eq('producto_id', productoId)
        .eq('estado', 'reservado')
        .order('fecha_pedido', { ascending: true });

      if (err) throw err;
      return data || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  };

  useEffect(() => {
    cargarProductosPreventa();
    cargarProductosInventario();
  }, []);

  return {
    productosPreventa,
    productosInventario,
    loading,
    error,
    cargarProductosPreventa,
    cargarProductosInventario,
    guardarProductoPreventa,
    activarProductoDelInventario,
    obtenerPedidosPreventa,
  };
};

export default usePreventaProducts;
