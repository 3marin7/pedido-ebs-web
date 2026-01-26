import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './HistorialMovimientos.css';

const HistorialMovimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    cargarMovimientos();
  }, [filtroProducto, filtroTipo, filtroFechaInicio, filtroFechaFin]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      // Cargar lista de productos
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (productosError) throw productosError;
      setProductos(productosData || []);

      await cargarMovimientos();
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  const cargarMovimientos = async () => {
    try {
      let query = supabase
        .from('movimientos_inventario')
        .select(`
          *,
          productos:producto_id (id, nombre)
        `)
        .order('fecha_movimiento', { ascending: false });

      // Aplicar filtros
      if (filtroProducto) {
        query = query.eq('producto_id', parseInt(filtroProducto));
      }

      if (filtroTipo) {
        query = query.eq('tipo_movimiento', filtroTipo);
      }

      if (filtroFechaInicio) {
        query = query.gte('fecha_movimiento', new Date(filtroFechaInicio).toISOString());
      }

      if (filtroFechaFin) {
        const fechaFin = new Date(filtroFechaFin);
        fechaFin.setHours(23, 59, 59, 999);
        query = query.lte('fecha_movimiento', fechaFin.toISOString());
      }

      const { data, error: err } = await query.limit(500);

      if (err) throw err;
      setMovimientos(data || []);
    } catch (err) {
      console.error('Error cargando movimientos:', err);
      setError('Error al cargar los movimientos');
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const obtenerColorTipo = (tipo) => {
    const colores = {
      venta: '#e74c3c',
      entrada: '#27ae60',
      ajuste: '#f39c12',
      devolución: '#3498db'
    };
    return colores[tipo] || '#95a5a6';
  };

  const obtenerIconoTipo = (tipo) => {
    const iconos = {
      venta: '📦',
      entrada: '📥',
      ajuste: '🔧',
      devolución: '↩️'
    };
    return iconos[tipo] || '•';
  };

  const exportarCSV = () => {
    const headers = ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Usuario', 'Factura', 'Descripción'];
    const rows = movimientos.map(m => [
      formatearFecha(m.fecha_movimiento),
      m.productos?.nombre || 'N/A',
      m.tipo_movimiento,
      m.cantidad,
      m.stock_anterior,
      m.stock_nuevo,
      m.usuario,
      m.factura_id || '-',
      m.descripcion || '-'
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `movimientos_inventario_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="historial-container">
      <div className="header-historial">
        <h1>📊 Historial de Movimientos de Inventario</h1>
        <p>Registro completo de todos los cambios en el stock</p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-historial">
        <div className="filtro-grupo">
          <label>Producto:</label>
          <select 
            value={filtroProducto}
            onChange={(e) => setFiltroProducto(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos los productos</option>
            {productos.map(p => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filtro-grupo">
          <label>Tipo de Movimiento:</label>
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos los tipos</option>
            <option value="venta">Venta</option>
            <option value="entrada">Entrada</option>
            <option value="ajuste">Ajuste</option>
            <option value="devolución">Devolución</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label>Desde:</label>
          <input 
            type="date"
            value={filtroFechaInicio}
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
            className="filtro-input"
          />
        </div>

        <div className="filtro-grupo">
          <label>Hasta:</label>
          <input 
            type="date"
            value={filtroFechaFin}
            onChange={(e) => setFiltroFechaFin(e.target.value)}
            className="filtro-input"
          />
        </div>

        <button 
          onClick={() => {
            setFiltroProducto('');
            setFiltroTipo('');
            setFiltroFechaInicio('');
            setFiltroFechaFin('');
          }}
          className="btn-limpiar"
        >
          Limpiar Filtros
        </button>

        <button 
          onClick={exportarCSV}
          className="btn-exportar"
          disabled={movimientos.length === 0}
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Tabla de movimientos */}
      {cargando ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando movimientos...</p>
        </div>
      ) : movimientos.length === 0 ? (
        <div className="empty-state">
          <p>No hay movimientos que coincidan con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="movimientos-wrapper">
          <div className="resumen-movimientos">
            <div className="resumen-card">
              <span className="label">Total de Movimientos</span>
              <span className="valor">{movimientos.length}</span>
            </div>
            <div className="resumen-card">
              <span className="label">Ventas</span>
              <span className="valor" style={{ color: '#e74c3c' }}>
                {movimientos.filter(m => m.tipo_movimiento === 'venta').length}
              </span>
            </div>
            <div className="resumen-card">
              <span className="label">Entradas</span>
              <span className="valor" style={{ color: '#27ae60' }}>
                {movimientos.filter(m => m.tipo_movimiento === 'entrada').length}
              </span>
            </div>
            <div className="resumen-card">
              <span className="label">Ajustes</span>
              <span className="valor" style={{ color: '#f39c12' }}>
                {movimientos.filter(m => m.tipo_movimiento === 'ajuste').length}
              </span>
            </div>
          </div>

          <div className="tabla-wrapper">
            <table className="tabla-movimientos">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Stock Anterior</th>
                  <th>Stock Nuevo</th>
                  <th>Usuario</th>
                  <th>Factura</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((movimiento) => (
                  <tr key={movimiento.id} className={`tipo-${movimiento.tipo_movimiento}`}>
                    <td className="fecha">{formatearFecha(movimiento.fecha_movimiento)}</td>
                    <td className="producto">{movimiento.productos?.nombre || 'N/A'}</td>
                    <td className="tipo">
                      <span className="badge-tipo" style={{ backgroundColor: obtenerColorTipo(movimiento.tipo_movimiento) }}>
                        {obtenerIconoTipo(movimiento.tipo_movimiento)} {movimiento.tipo_movimiento}
                      </span>
                    </td>
                    <td className="cantidad">{movimiento.cantidad}</td>
                    <td className="stock-anterior">{movimiento.stock_anterior}</td>
                    <td className="stock-nuevo">{movimiento.stock_nuevo}</td>
                    <td className="usuario">{movimiento.usuario || 'Sistema'}</td>
                    <td className="factura">
                      {movimiento.factura_id ? (
                        <a href={`/factura/${movimiento.factura_id}`} className="link-factura">
                          #{movimiento.factura_id}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="descripcion">{movimiento.descripcion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistorialMovimientos;
