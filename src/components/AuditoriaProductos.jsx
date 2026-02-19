import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import './AuditoriaProductos.css';

const AuditoriaProductos = () => {
  const [auditorias, setAuditorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Filtros
  const [filtroProducto, setFiltroProducto] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    cargarDatos();
  }, []);

  // Recargar cuando cambien filtros
  useEffect(() => {
    cargarAuditorias();
  }, [filtroProducto, filtroTipo, filtroRol, filtroFechaInicio, filtroFechaFin]);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      // Cargar productos
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .select('id, nombre')
        .order('nombre', { ascending: true });

      if (productosError) throw productosError;
      setProductos(productosData || []);

      await cargarAuditorias();
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(`Error al cargar: ${err.message || err}`);
    } finally {
      setCargando(false);
    }
  };

  const cargarAuditorias = async () => {
    try {
      let query = supabase
        .from('auditoria_productos')
        .select(`
          *,
          productos:producto_id (id, nombre)
        `)
        .order('created_at', { ascending: false });

      if (filtroProducto) {
        query = query.eq('producto_id', parseInt(filtroProducto));
      }

      if (filtroTipo) {
        query = query.eq('tipo_accion', filtroTipo);
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
      setAuditorias(data || []);
    } catch (err) {
      console.error('Error cargando auditorías:', err);
      setError(`Error: ${err.message || err}`);
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
      creacion: '#8e44ad',
      edicion: '#2c3e50',
      eliminacion: '#c0392b'
    };
    return colores[tipo] || '#95a5a6';
  };

  const obtenerIconoTipo = (tipo) => {
    const iconos = {
      creacion: '🆕',
      edicion: '✏️',
      eliminacion: '🗑️'
    };
    return iconos[tipo] || '•';
  };

  const exportarCSV = () => {
    const headers = ['Fecha', 'Producto', 'Tipo', 'Usuario', 'Rol', 'Cambios'];
    const rows = auditorias.map(a => [
      formatearFecha(a.created_at),
      a.productos?.nombre || 'N/A',
      a.tipo_accion,
      a.usuario || 'N/A',
      a.rol_usuario || 'N/A',
      a.cambios_resumen || '-'
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `auditoria_productos_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const exportarExcel = () => {
    const headers = ['Fecha', 'Producto', 'Tipo', 'Usuario', 'Rol', 'Cambios'];
    const rows = auditorias.map(a => [
      formatearFecha(a.created_at),
      a.productos?.nombre || 'N/A',
      a.tipo_accion,
      a.usuario || 'N/A',
      a.rol_usuario || 'N/A',
      a.cambios_resumen || '-'
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Auditoría');
    
    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 20 }, // Fecha
      { wch: 25 }, // Producto
      { wch: 15 }, // Tipo
      { wch: 15 }, // Usuario
      { wch: 15 }, // Rol
      { wch: 40 }  // Cambios
    ];

    const fileName = `auditoria_productos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  return (
    <div className="auditoria-container">
      <div className="header-auditoria">
        <h1>📋 Auditoría de Cambios en Catálogo</h1>
        <p>Seguimiento de creaciones y modificaciones de productos</p>
      </div>

      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}

      {/* Filtros */}
      <div className="filtros-auditoria">
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
          <label>Tipo de Acción:</label>
          <select 
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-select"
          >
            <option value="">Todas las acciones</option>
            <option value="creacion">Creación</option>
            <option value="edicion">Edición</option>
            <option value="eliminacion">Eliminación</option>
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
            <option value="inventario">Inventario</option>
            <option value="contabilidad">Contabilidad</option>
            <option value="vendedor">Vendedor</option>
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

        <div className="export-buttons-group">
          <button 
            onClick={exportarCSV}
            className="btn-exportar btn-csv"
            disabled={auditorias.length === 0}
          >
            📥 Exportar CSV
          </button>
          <button 
            onClick={exportarExcel}
            className="btn-exportar btn-excel"
            disabled={auditorias.length === 0}
          >
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {/* Tabla de auditorías */}
      {cargando ? (
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando auditorías...</p>
        </div>
      ) : auditorias.length === 0 ? (
        <div className="empty-state">
          <p>No hay auditorías que coincidan con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="auditoria-wrapper">
          <div className="resumen-auditoria">
            <div className="resumen-card">
              <span className="label">Total de Cambios</span>
              <span className="valor">{auditorias.length}</span>
            </div>
            <div className="resumen-card">
              <span className="label">Creaciones</span>
              <span className="valor" style={{ color: '#8e44ad' }}>
                {auditorias.filter(a => a.tipo_accion === 'creacion').length}
              </span>
            </div>
            <div className="resumen-card">
              <span className="label">Ediciones</span>
              <span className="valor" style={{ color: '#2c3e50' }}>
                {auditorias.filter(a => a.tipo_accion === 'edicion').length}
              </span>
            </div>
          </div>

          <div className="tabla-wrapper">
            <table className="tabla-auditoria">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Producto</th>
                  <th>Tipo</th>
                  <th>Cambios</th>
                  <th>Usuario</th>
                  <th>Rol</th>
                </tr>
              </thead>
              <tbody>
                {auditorias.map((auditoria) => (
                  <tr key={auditoria.id} className={`tipo-${auditoria.tipo_accion}`}>
                    <td className="fecha">{formatearFecha(auditoria.created_at)}</td>
                    <td className="producto">{auditoria.productos?.nombre || 'N/A'}</td>
                    <td className="tipo">
                      <span className="badge-tipo" style={{ backgroundColor: obtenerColorTipo(auditoria.tipo_accion) }}>
                        {obtenerIconoTipo(auditoria.tipo_accion)} {auditoria.tipo_accion}
                      </span>
                    </td>
                    <td className="cambios">{auditoria.cambios_resumen || '-'}</td>
                    <td className="usuario">{auditoria.usuario || 'Sistema'}</td>
                    <td className="rol">{auditoria.rol_usuario || 'N/A'}</td>
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

export default AuditoriaProductos;
