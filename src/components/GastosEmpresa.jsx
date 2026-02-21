import React, { useState, useEffect } from 'react';
import './GastosEmpresa.css';
import { supabase } from '../lib/supabase';

const GastosEmpresa = () => {
  // Estados principales
  const [vistaActual, setVistaActual] = useState('dashboard'); // dashboard, nuevo, historial, reportes
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroEmpleado, setFiltroEmpleado] = useState('todos');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Modal de nuevo gasto
  const [mostrarModal, setMostrarModal] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [formGasto, setFormGasto] = useState({
    fecha: new Date().toISOString().split('T')[0],
    categoria: 'Servicios',
    empleado: 'Edwin Marín',
    descripcion: '',
    monto: '',
    metodo_pago: 'transferencia',
    referencia: '',
    notas: ''
  });

  // Datos de ejemplo
  const datosEjemplo = {
    gastos: [
      {
        id: 1,
        fecha: '2026-02-15',
        categoria: 'Nómina',
        empleado: 'Paola Huertas',
        descripcion: 'Pago nómina febrero',
        monto: 2750000,
        metodo_pago: 'transferencia',
        referencia: 'TRANS-001',
        notas: 'Pago habitual',
        created_at: '2026-02-01'
      },
      {
        id: 2,
        fecha: '2026-02-14',
        categoria: 'Servicios',
        empleado: 'Edwin Marín',
        descripcion: 'Pago internet y teléfono',
        monto: 185000,
        metodo_pago: 'transferencia',
        referencia: 'TRANS-002',
        notas: '',
        created_at: '2026-02-01'
      },
      {
        id: 3,
        fecha: '2026-02-12',
        categoria: 'Transporte',
        empleado: 'Jhon Fredy Marín',
        descripcion: 'Gasolina y mantenimiento vehículo',
        monto: 250000,
        metodo_pago: 'efectivo',
        referencia: 'EFE-001',
        notas: 'Recibo guardado',
        created_at: '2026-02-01'
      },
      {
        id: 4,
        fecha: '2026-02-10',
        categoria: 'Suministros',
        empleado: 'Carolina Bernal',
        descripcion: 'Papel, bolígrafos y otros suministros de oficina',
        monto: 125000,
        metodo_pago: 'transferencia',
        referencia: 'TRANS-003',
        notas: '',
        created_at: '2026-02-01'
      },
      {
        id: 5,
        fecha: '2026-02-08',
        categoria: 'Viáticos',
        empleado: 'Fabian Marín',
        descripcion: 'Viáticos viaje a Medellín',
        monto: 450000,
        metodo_pago: 'efectivo',
        referencia: 'VIA-001',
        notas: 'Hospedaje y comidas',
        created_at: '2026-02-01'
      }
    ]
  };

  // Categorías disponibles
  const categorias = [
    { value: 'todos', label: '📊 Todas las categorías' },
    { value: 'Nómina', label: '👥 Nómina' },
    { value: 'Servicios', label: '🔌 Servicios' },
    { value: 'Transporte', label: '🚗 Transporte' },
    { value: 'Suministros', label: '📦 Suministros' },
    { value: 'Viáticos', label: '✈️ Viáticos' },
    { value: 'Mantenimiento', label: '🔧 Mantenimiento' },
    { value: 'Marketing', label: '📢 Marketing' },
    { value: 'Capacitación', label: '📚 Capacitación' },
    { value: 'Otros', label: '📝 Otros' }
  ];

  const empleados = ['Edwin Marín', 'Jhon Fredy Marín', 'Paola Huertas', 'Carolina Bernal', 'Fabian Marín'];
  const metodosPago = [
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'cheque', label: 'Cheque' }
  ];

  // Cargar gastos desde Supabase
  const cargarGastos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('gastos_empresa')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      
      const gastosFormateados = data.map(g => ({
        id: g.id,
        fecha: g.fecha,
        categoria: g.categoria,
        empleado: g.empleado,
        descripcion: g.descripcion,
        monto: parseFloat(g.monto),
        metodo_pago: g.metodo_pago,
        referencia: g.referencia,
        notas: g.notas,
        created_at: g.created_at
      }));
      
      setGastos(gastosFormateados);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      // Fallback a datos de ejemplo si Supabase no está configurado
      setGastos(datosEjemplo.gastos);
    } finally {
      setCargando(false);
    }
  };

  // Inicializar
  useEffect(() => {
    cargarGastos();
  }, []);

  // Guardar gasto
  const guardarGasto = async () => {
    if (!formGasto.fecha || !formGasto.monto || !formGasto.descripcion) {
      alert('Por favor completa los campos requeridos: fecha, monto y descripción');
      return;
    }

    try {
      const datosGasto = {
        fecha: formGasto.fecha,
        categoria: formGasto.categoria,
        empleado: formGasto.empleado,
        descripcion: formGasto.descripcion,
        monto: parseFloat(formGasto.monto),
        metodo_pago: formGasto.metodo_pago,
        referencia: formGasto.referencia || null,
        notas: formGasto.notas || null
      };

      if (gastoEditando) {
        // Editar
        const { error } = await supabase
          .from('gastos_empresa')
          .update(datosGasto)
          .eq('id', gastoEditando.id);
        
        if (error) throw error;
        alert('Gasto actualizado exitosamente');
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('gastos_empresa')
          .insert([datosGasto]);
        
        if (error) throw error;
        alert('Gasto registrado exitosamente');
      }

      await cargarGastos();
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      alert('Error al guardar gasto: ' + error.message);
    }
  };

  // Eliminar gasto
  const eliminarGasto = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;

    try {
      const { error } = await supabase
        .from('gastos_empresa')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Gasto eliminado exitosamente');
      await cargarGastos();
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      alert('Error al eliminar gasto: ' + error.message);
    }
  };

  // Abrir modal
  const abrirModal = (gasto = null) => {
    if (gasto) {
      setGastoEditando(gasto);
      setFormGasto(gasto);
    } else {
      setGastoEditando(null);
      setFormGasto({
        fecha: new Date().toISOString().split('T')[0],
        categoria: 'Servicios',
        empleado: 'Edwin Marín',
        descripcion: '',
        monto: '',
        metodo_pago: 'transferencia',
        referencia: '',
        notas: ''
      });
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setGastoEditando(null);
  };

  // Funciones de utilidad
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-CO');
  };

  // Filtrar gastos
  const gastosFiltrados = gastos.filter(g => {
    if (filtroCategoria !== 'todos' && g.categoria !== filtroCategoria) return false;
    if (filtroEmpleado !== 'todos' && g.empleado !== filtroEmpleado) return false;
    if (filtroFechaInicio && g.fecha < filtroFechaInicio) return false;
    if (filtroFechaFin && g.fecha > filtroFechaFin) return false;
    if (busqueda && (!g.descripcion.toLowerCase().includes(busqueda.toLowerCase()) && 
                     !g.referencia?.toLowerCase().includes(busqueda.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // Calcular totales
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + g.monto, 0);
  const totalPorCategoria = {};
  categorias.slice(1).forEach(cat => {
    totalPorCategoria[cat.value] = gastos
      .filter(g => g.categoria === cat.value)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  const totalPorEmpleado = {};
  empleados.forEach(emp => {
    totalPorEmpleado[emp] = gastos
      .filter(g => g.empleado === emp)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  // ========================
  // RENDER: DASHBOARD
  // ========================
  if (vistaActual === 'dashboard') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>💰 Gastos de la Empresa</h1>
          <button className="btn-nuevo" onClick={() => { abrirModal(); setVistaActual('nuevo'); }}>
            ➕ Nuevo Gasto
          </button>
        </div>

        {/* Navegación de vistas */}
        <div className="ge-nav">
          <button 
            className={`nav-btn ${vistaActual === 'dashboard' ? 'active' : ''}`}
            onClick={() => setVistaActual('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-btn ${vistaActual === 'nuevo' ? 'active' : ''}`}
            onClick={() => { abrirModal(); setVistaActual('nuevo'); }}
          >
            ➕ Nuevo Gasto
          </button>
          <button 
            className={`nav-btn ${vistaActual === 'historial' ? 'active' : ''}`}
            onClick={() => setVistaActual('historial')}
          >
            📜 Historial
          </button>
          <button 
            className={`nav-btn ${vistaActual === 'reportes' ? 'active' : ''}`}
            onClick={() => setVistaActual('reportes')}
          >
            📈 Reportes
          </button>
        </div>

        {/* Resumen rápido */}
        <div className="ge-resumen-grid">
          <div className="resumen-card">
            <div className="resumen-icon">💸</div>
            <div className="resumen-content">
              <h3>Total Gastos (Mes)</h3>
              <div className="resumen-valor">{formatCurrency(gastos.filter(g => {
                const mes = new Date(g.fecha).getMonth();
                const año = new Date(g.fecha).getFullYear();
                return mes === new Date().getMonth() && año === new Date().getFullYear();
              }).reduce((sum, g) => sum + g.monto, 0))}</div>
            </div>
          </div>

          <div className="resumen-card">
            <div className="resumen-icon">📋</div>
            <div className="resumen-content">
              <h3>Total Registros</h3>
              <div className="resumen-valor">{gastos.length}</div>
            </div>
          </div>

          <div className="resumen-card">
            <div className="resumen-icon">👥</div>
            <div className="resumen-content">
              <h3>Empleados</h3>
              <div className="resumen-valor">{empleados.length}</div>
            </div>
          </div>

          <div className="resumen-card">
            <div className="resumen-icon">📂</div>
            <div className="resumen-content">
              <h3>Categorías</h3>
              <div className="resumen-valor">{categorias.length - 1}</div>
            </div>
          </div>
        </div>

        {/* Top categorías */}
        <div className="ge-top-section">
          <div className="top-box">
            <h3>🏆 Gastos por Categoría</h3>
            <div className="top-list">
              {categorias.slice(1)
                .sort((a, b) => (totalPorCategoria[b.value] || 0) - (totalPorCategoria[a.value] || 0))
                .slice(0, 5)
                .map(cat => (
                  <div key={cat.value} className="top-item">
                    <div className="top-label">{cat.label}</div>
                    <div className="top-valor">{formatCurrency(totalPorCategoria[cat.value] || 0)}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="top-box">
            <h3>👤 Gastos por Empleado</h3>
            <div className="top-list">
              {empleados
                .sort((a, b) => (totalPorEmpleado[b] || 0) - (totalPorEmpleado[a] || 0))
                .slice(0, 5)
                .map(emp => (
                  <div key={emp} className="top-item">
                    <div className="top-label">{emp}</div>
                    <div className="top-valor">{formatCurrency(totalPorEmpleado[emp] || 0)}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // RENDER: NUEVO GASTO
  // ========================
  if (vistaActual === 'nuevo') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>➕ {gastoEditando ? '✏️ Editar Gasto' : 'Nuevo Gasto'}</h1>
          <button className="btn-volver" onClick={() => setVistaActual('dashboard')}>
            ← Volver
          </button>
        </div>

        <div className="ge-form-container">
          <form className="ge-form">
            <div className="form-grid">
              <div className="form-group">
                <label>📅 Fecha *</label>
                <input 
                  type="date"
                  value={formGasto.fecha}
                  onChange={(e) => setFormGasto({...formGasto, fecha: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>📂 Categoría *</label>
                <select 
                  value={formGasto.categoria}
                  onChange={(e) => setFormGasto({...formGasto, categoria: e.target.value})}
                >
                  {categorias.slice(1).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>👤 Empleado Responsable *</label>
                <select 
                  value={formGasto.empleado}
                  onChange={(e) => setFormGasto({...formGasto, empleado: e.target.value})}
                >
                  {empleados.map(emp => (
                    <option key={emp} value={emp}>{emp}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>💰 Monto *</label>
                <input 
                  type="number"
                  value={formGasto.monto}
                  onChange={(e) => setFormGasto({...formGasto, monto: e.target.value})}
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>💳 Método de Pago</label>
                <select 
                  value={formGasto.metodo_pago}
                  onChange={(e) => setFormGasto({...formGasto, metodo_pago: e.target.value})}
                >
                  {metodosPago.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>📌 Referencia</label>
                <input 
                  type="text"
                  value={formGasto.referencia}
                  onChange={(e) => setFormGasto({...formGasto, referencia: e.target.value})}
                  placeholder="Ej: TRANS-001, REC-005"
                />
              </div>
            </div>

            <div className="form-group">
              <label>📝 Descripción *</label>
              <textarea 
                value={formGasto.descripcion}
                onChange={(e) => setFormGasto({...formGasto, descripcion: e.target.value})}
                placeholder="Detalla qué se compró o el concepto del gasto"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>📋 Notas adicionales</label>
              <textarea 
                value={formGasto.notas}
                onChange={(e) => setFormGasto({...formGasto, notas: e.target.value})}
                placeholder="Información adicional (opcional)"
                rows="2"
              />
            </div>

            <div className="form-buttons">
              <button type="button" className="btn-guardar" onClick={guardarGasto}>
                ✅ Guardar Gasto
              </button>
              <button type="button" className="btn-cancelar" onClick={() => { cerrarModal(); setVistaActual('dashboard'); }}>
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ========================
  // RENDER: HISTORIAL
  // ========================
  if (vistaActual === 'historial') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>📜 Historial de Gastos</h1>
          <button className="btn-nuevo" onClick={() => { abrirModal(); setVistaActual('nuevo'); }}>
            ➕ Nuevo Gasto
          </button>
        </div>

        {/* Filtros */}
        <div className="ge-filtros">
          <div className="filtro-grid">
            <div className="filtro-item">
              <label>📂 Categoría</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="filtro-item">
              <label>👤 Empleado</label>
              <select value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)}>
                <option value="todos">Todos los empleados</option>
                {empleados.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            <div className="filtro-item">
              <label>📅 Desde</label>
              <input 
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
              />
            </div>

            <div className="filtro-item">
              <label>📅 Hasta</label>
              <input 
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
              />
            </div>

            <div className="filtro-item">
              <label>🔍 Buscar</label>
              <input 
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Descripción o referencia"
              />
            </div>

            <div className="filtro-item">
              <button 
                className="btn-limpiar"
                onClick={() => {
                  setFiltroCategoria('todos');
                  setFiltroEmpleado('todos');
                  setFiltroFechaInicio('');
                  setFiltroFechaFin('');
                  setBusqueda('');
                }}
              >
                🔄 Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="ge-tabla-wrapper">
          <table className="ge-tabla">
            <thead>
              <tr>
                <th>📅 Fecha</th>
                <th>📂 Categoría</th>
                <th>👤 Empleado</th>
                <th>📝 Descripción</th>
                <th>💰 Monto</th>
                <th>💳 Método</th>
                <th>📌 Referencia</th>
                <th>⚙️ Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="8" className="text-center">⏳ Cargando...</td></tr>
              ) : gastosFiltrados.length === 0 ? (
                <tr><td colSpan="8" className="text-center">No hay gastos registrados</td></tr>
              ) : (
                gastosFiltrados.map(g => (
                  <tr key={g.id}>
                    <td>{formatDate(g.fecha)}</td>
                    <td><span className="categoria-badge">{g.categoria}</span></td>
                    <td>{g.empleado}</td>
                    <td className="descripcion">{g.descripcion}</td>
                    <td className="monto">{formatCurrency(g.monto)}</td>
                    <td><span className="metodo-badge">{g.metodo_pago}</span></td>
                    <td>{g.referencia || '-'}</td>
                    <td className="acciones">
                      <button className="btn-editar" onClick={() => { abrirModal(g); setVistaActual('nuevo'); }}>✏️</button>
                      <button className="btn-eliminar" onClick={() => eliminarGasto(g.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="ge-resumen-tabla">
          <div className="resumen-item">
            <span className="label">Total Gastos:</span>
            <span className="valor">{formatCurrency(totalGastos)}</span>
          </div>
          <div className="resumen-item">
            <span className="label">Registros:</span>
            <span className="valor">{gastosFiltrados.length}</span>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // RENDER: REPORTES
  // ========================
  if (vistaActual === 'reportes') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>📈 Reportes</h1>
        </div>

        <div className="reportes-grid">
          <div className="reporte-box">
            <h3>📊 Gastos por Categoría</h3>
            <div className="reporte-list">
              {categorias.slice(1)
                .sort((a, b) => (totalPorCategoria[b.value] || 0) - (totalPorCategoria[a.value] || 0))
                .map(cat => {
                  const total = totalPorCategoria[cat.value] || 0;
                  const porcentaje = gastos.length > 0 ? (gastos.filter(g => g.categoria === cat.value).length / gastos.length * 100).toFixed(1) : 0;
                  return (
                    <div key={cat.value} className="reporte-item">
                      <div className="reporte-label">{cat.label}</div>
                      <div className="reporte-barra">
                        <div className="barra" style={{width: porcentaje + '%'}}></div>
                      </div>
                      <div className="reporte-datos">
                        <span>{formatCurrency(total)}</span>
                        <span>({porcentaje}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="reporte-box">
            <h3>👥 Gastos por Empleado</h3>
            <div className="reporte-list">
              {empleados
                .sort((a, b) => (totalPorEmpleado[b] || 0) - (totalPorEmpleado[a] || 0))
                .map(emp => {
                  const total = totalPorEmpleado[emp] || 0;
                  const porcentaje = gastos.length > 0 ? (gastos.filter(g => g.empleado === emp).length / gastos.length * 100).toFixed(1) : 0;
                  return (
                    <div key={emp} className="reporte-item">
                      <div className="reporte-label">{emp}</div>
                      <div className="reporte-barra">
                        <div className="barra" style={{width: porcentaje + '%'}}></div>
                      </div>
                      <div className="reporte-datos">
                        <span>{formatCurrency(total)}</span>
                        <span>({porcentaje}%)</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="reporte-totales">
          <h3>📌 Resumen General</h3>
          <div className="totales-grid">
            <div className="total-item">
              <div className="total-label">Total General</div>
              <div className="total-valor">{formatCurrency(gastos.reduce((sum, g) => sum + g.monto, 0))}</div>
            </div>
            <div className="total-item">
              <div className="total-label">Promedio por Gasto</div>
              <div className="total-valor">{formatCurrency(gastos.length > 0 ? gastos.reduce((sum, g) => sum + g.monto, 0) / gastos.length : 0)}</div>
            </div>
            <div className="total-item">
              <div className="total-label">Gasto Mayor</div>
              <div className="total-valor">{formatCurrency(gastos.length > 0 ? Math.max(...gastos.map(g => g.monto)) : 0)}</div>
            </div>
            <div className="total-item">
              <div className="total-label">Gasto Menor</div>
              <div className="total-valor">{formatCurrency(gastos.length > 0 ? Math.min(...gastos.map(g => g.monto)) : 0)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default GastosEmpresa;
