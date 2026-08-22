// src/hooks/usePreventaProducts.js
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook para gestionar productos en pre-venta
 */
export const usePreventaProducts = () => {
  const [productosPreventa, setProductosPreventa] = useState([]);
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

  // Crear/actualizar producto en preventa
  const guardarProductoPreventa = async (producto) => {
    try {
      const datosGuardar = {
        ...producto,
        es_preventa: true,
        stock: 0, // Inicialmente sin stock real
      };

      let resultado;
      if (producto.id) {
        // Actualizar
        const { data, error: err } = await supabase
          .from('productos')
          .update(datosGuardar)
          .eq('id', producto.id)
          .select();
        if (err) throw err;
        resultado = data?.[0];
      } else {
        // Crear nuevo
        const { data, error: err } = await supabase
          .from('productos')
          .insert([datosGuardar])
          .select();
        if (err) throw err;
        resultado = data?.[0];
      }

      await cargarProductosPreventa();
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
  }, []);

  return {
    productosPreventa,
    loading,
    error,
    cargarProductosPreventa,
    guardarProductoPreventa,
    activarProductoDelInventario,
    obtenerPedidosPreventa,
  };
};

export default usePreventaProducts;
