import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './GestionPedidos.css';

const GestionPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado]);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      let query = supabase
        .from('pedidos')
        .select('*')
        .order('fecha_creacion', { ascending: false });

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPedidos(data);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setCargando(false);
    }
  };

  const actualizarEstadoPedido = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          estado: nuevoEstado,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      // Recargar la lista de pedidos
      cargarPedidos();
    } catch (error) {
      console.error('Error actualizando pedido:', error);
    }
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CO');
  };

  if (cargando) {
    return <div className="loading">Cargando pedidos...</div>;
  }

  return (
    <div className="gestion-pedidos">
      <h1>Gestión de Pedidos</h1>
      
      <div className="filtros">
        <label>Filtrar por estado:</label>
        <select 
          value={filtroEstado} 
          onChange={(e) => setFiltroEstado(e.target.value)}
        >
          <option value="todos">Todos</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmado">Confirmado</option>
          <option value="en_preparacion">En preparación</option>
          <option value="enviado">Enviado</option>
          <option value="entregado">Entregado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="lista-pedidos">
        {pedidos.length === 0 ? (
          <p>No hay pedidos {filtroEstado !== 'todos' ? `con estado ${filtroEstado}` : ''}</p>
        ) : (
          pedidos.map(pedido => (
            <div key={pedido.id} className={`pedido-card ${pedido.estado}`}>
              <div className="pedido-header">
                <h3>Pedido #{pedido.id}</h3>
                <span className={`estado-badge ${pedido.estado}`}>
                  {pedido.estado}
                </span>
              </div>
              
              <div className="pedido-info">
                <p><strong>Cliente:</strong> {pedido.cliente_nombre}</p>
                <p><strong>Teléfono:</strong> {pedido.cliente_telefono}</p>
                <p><strong>Fecha:</strong> {formatFecha(pedido.fecha_creacion)}</p>
                <p><strong>Total:</strong> {formatPrecio(pedido.total)}</p>
                {pedido.cliente_notas && (
                  <p><strong>Notas:</strong> {pedido.cliente_notas}</p>
                )}
              </div>

              <div className="productos-pedido">
                <h4>Productos:</h4>
                <ul>
                  {pedido.productos.map((producto, index) => (
                    <li key={index}>
                      {producto.cantidad}x {producto.nombre} - {formatPrecio(producto.precio * producto.cantidad)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="acciones-pedido">
                <select 
                  value={pedido.estado} 
                  onChange={(e) => actualizarEstadoPedido(pedido.id, e.target.value)}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="confirmado">Confirmado</option>
                  <option value="en_preparacion">En preparación</option>
                  <option value="enviado">Enviado</option>
                  <option value="entregado">Entregado</option>
                  <option value="cancelado">Cancelado</option>
                </select>
                
                <a 
                  href={`https://wa.me/${pedido.cliente_telefono}?text=Hola ${pedido.cliente_nombre}, soy de Distribuciones EBS Hermanos Marín. Tu pedido #${pedido.id} está en estado: ${pedido.estado}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-whatsapp"
                >
                  Contactar por WhatsApp
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GestionPedidos;