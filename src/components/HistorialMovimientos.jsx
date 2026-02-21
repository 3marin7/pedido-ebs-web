import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import './HistorialMovimientos.css';

const HistorialMovimientos = () => {
  const [movimientos, setMovimientos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar cuando cambien los filtros
  useEffect(() => {
    cargarMovimientos();
  }, [filtroProducto, filtroTipo, filtroRol, filtroFechaInicio, filtroFechaFin]);

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
      setError(`Error al cargar los datos: ${err.message || err}`);
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
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filtroProducto) {
        query = query.eq('producto_id', parseInt(filtroProducto));
      }

      if (filtroTipo) {
        query = query.eq('tipo_movimiento', filtroTipo);
      }

      if (filtroRol) {
        query = query.eq('rol_usuario', filtroRol);
      }

      if (filtroFechaInicio) {
        query = query.gte('created_at', new Date(filtroFechaInicio).toISOString());
      }

      if (filtroFechaFin) {
        const fechaFin = new Date(filtroFechaFin);
        fechaFin.setHours(23, 59, 59, 999);
        query = query.lte('created_at', fechaFin.toISOString());
      }

      const { data, error: err } = await query.limit(500);

      if (err) throw err;
      setMovimientos(data || []);
      setCargando(false);
    } catch (err) {
      console.error('Error cargando movimientos:', err);
      setError(`Error al cargar los movimientos: ${err.message || err}`);
      setCargando(false);
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

  const obtenerFechaMovimiento = (m) => m.fecha_movimiento || m.created_at;

  const obtenerColorTipo = (tipo) => {
    const colores = {
      venta: '#e74c3c',
      entrada: '#27ae60',
      ajuste: '#f39c12',
      devolución: '#3498db',
      creacion: '#8e44ad',
      edicion: '#2c3e50'
    };
    return colores[tipo] || '#95a5a6';
  };

  const obtenerIconoTipo = (tipo) => {
    const iconos = {
      venta: '📦',
      entrada: '📥',
      ajuste: '🔧',
      devolución: '↩️',
      creacion: '🆕',
      edicion: '✏️'
    };
    return iconos[tipo] || '•';
  };

  const obtenerNombreUsuario = (usuario) => {
    if (!usuario) return 'Sistema';
    
    // Mapeo de usernames a nombres completos (con variaciones)
    const nombresUsuarios = {
      'Edwin': 'Edwin Marín',
      'edwin': 'Edwin Marín',
      'EDWIN': 'Edwin Marín',
      'fredy': 'Fredy',
      'Fredy': 'Fredy',
      'FREDY': 'Fredy',
      'paola': 'Paola',
      'Paola': 'Paola',
      'PAOLA': 'Paola',
      'caro': 'Caro', 
      'Caro': 'Caro',
      'CARO': 'Caro',
      'fabian': 'Fabian',
      'Fabian': 'Fabian',
      'FABIAN': 'Fabian',
      'EMC': 'Edwin M. C.',
      'emc': 'Edwin M. C.'
    };
    
    return nombresUsuarios[usuario] || usuario;
  };

  const exportarCSV = () => {
    const headers = ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Usuario', 'Rol', 'Factura', 'Descripción'];
    const rows = movimientos.map(m => [
      formatearFecha(obtenerFechaMovimiento(m)),
      m.productos?.nombre || 'N/A',
      m.tipo_movimiento,
      m.cantidad,
      m.stock_anterior,
      m.stock_nuevo,
      obtenerNombreUsuario(m.usuario),
      m.rol_usuario || 'N/A',
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

  const exportarExcel = () => {
    const headers = ['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Usuario', 'Rol', 'Factura', 'Descripción'];
    const rows = movimientos.map(m => [
      formatearFecha(obtenerFechaMovimiento(m)),
      m.productos?.nombre || 'N/A',
      m.tipo_movimiento,
      m.cantidad,
      m.stock_anterior,
      m.stock_nuevo,
      obtenerNombreUsuario(m.usuario),
      m.rol_usuario || 'N/A',
      m.factura_id || '-',
      m.descripcion || '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Movimientos');
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 20 }, // Fecha
      { wch: 20 }, // Producto
      { wch: 15 }, // Tipo
      { wch: 12 }, // Cantidad
      { wch: 15 }, // Stock Anterior
      { wch: 15 }, // Stock Nuevo
      { wch: 15 }, // Usuario
      { wch: 15 }, // Rol
      { wch: 12 }, // Factura
      { wch: 30 }  // Descripción
    ];

    const fileName = `movimientos_inventario_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="historial-container">
      <div className="header-historial">
        <h1>📊 Historial de Movimientos de Inventario</h1>
        <p>Registro completo de todos los cambios en el stock</p>
        <button 
          className="hamburger-menu-btn"
          onClick={() => setMenuAbierto(!menuAbierto)}
          title="Opciones de exportación"
        >
          <i className="fas fa-bars"></i>
        </button>
      </div>

      {/* Overlay y menú lateral */}
      {menuAbierto && (
        <>
          <div 
            className="menu-overlay"
            onClick={() => setMenuAbierto(false)}
          />
          <div className="menu-side-panel">
            <div className="menu-header">
              <h3>Opciones de Exportación</h3>
              <button 
                className="menu-close-btn"
                onClick={() => setMenuAbierto(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="menu-actions">
              <button 
                onClick={() => {
                  exportarCSV();
                  setMenuAbierto(false);
                }}
                className="menu-action-btn btn-csv"
                disabled={movimientos.length === 0}
              >
                <i className="fas fa-file-csv"></i>
                <span>Exportar CSV</span>
              </button>
              <button 
                onClick={() => {
                  exportarExcel();
                  setMenuAbierto(false);
                }}
                className="menu-action-btn btn-excel"
                disabled={movimientos.length === 0}
              >
                <i className="fas fa-file-excel"></i>
                <span>Exportar Excel</span>
              </button>
            </div>
          </div>
        </>
      )}

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
            <option value="creacion">Creación</option>
            <option value="edicion">Edición</option>
          </select>
        </div>

        <div className="filtro-grupo">
          <label>Rol:</label>
          <select 
            value={filtroRol}
            onChange={(e) => setFiltroRol(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Admin</option>
            <option value="vendedor">Vendedor</option>
            <option value="inventario">Inventario</option>
            <option value="contabilidad">Contabilidad</option>
            <option value="N/A">N/A</option>
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
            setFiltroRol('');
            setFiltroFechaInicio('');
            setFiltroFechaFin('');
          }}
          className="btn-limpiar"
        >
          Limpiar Filtros
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
                  <th>Rol</th>
                  <th>Factura</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                {movimientos.map((movimiento) => (
                  <tr key={movimiento.id} className={`tipo-${movimiento.tipo_movimiento}`}>
                    <td className="fecha">{formatearFecha(obtenerFechaMovimiento(movimiento))}</td>
                    <td className="producto">{movimiento.productos?.nombre || 'N/A'}</td>
                    <td className="tipo">
                      <span className="badge-tipo" style={{ backgroundColor: obtenerColorTipo(movimiento.tipo_movimiento) }}>
                        {obtenerIconoTipo(movimiento.tipo_movimiento)} {movimiento.tipo_movimiento}
                      </span>
                    </td>
                    <td className="cantidad">{movimiento.cantidad}</td>
                    <td className="stock-anterior">{movimiento.stock_anterior}</td>
                    <td className="stock-nuevo">{movimiento.stock_nuevo}</td>
                    <td className="usuario">{obtenerNombreUsuario(movimiento.usuario)}</td>
                    <td className="rol">{movimiento.rol_usuario || 'N/A'}</td>
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
