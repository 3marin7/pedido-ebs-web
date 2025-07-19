import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReportesCobros.css';

const ReportesCobros = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [abonos, setAbonos] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroVendedor, setFiltroVendedor] = useState('Todos');
  const [mostrarGrafico, setMostrarGrafico] = useState(true);
  
  // Obtener vendedores únicos de las facturas
  const obtenerVendedores = () => {
    const vendedoresSet = new Set();
    facturas.forEach(factura => {
      if (factura.vendedor) {
        vendedoresSet.add(factura.vendedor);
      }
    });
    return Array.from(vendedoresSet).sort();
  };

  const vendedores = obtenerVendedores();

  // Cargar datos desde localStorage
  useEffect(() => {
    const cargarDatos = () => {
      try {
        // Cargar abonos y enriquecerlos con información de facturas
        const abonosGuardados = JSON.parse(localStorage.getItem('abonos')) || [];
        
        // Cargar facturas para obtener información adicional
        const facturasGuardadas = JSON.parse(localStorage.getItem('facturas')) || [];
        setFacturas(facturasGuardadas);
        
        // Enriquecer abonos con información de la factura (vendedor, cliente)
        const abonosEnriquecidos = abonosGuardados.map(abono => {
          const facturaRelacionada = facturasGuardadas.find(f => f.id === abono.facturaId);
          return {
            ...abono,
            vendedor: facturaRelacionada?.vendedor || 'Sin asignar',
            cliente: facturaRelacionada?.cliente || 'Cliente desconocido'
          };
        });
        
        setAbonos(abonosEnriquecidos);
        
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
    
    // Establecer fechas por defecto (últimos 30 días)
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hoy.getDate() - 30);
    
    setFechaInicio(hace30Dias.toISOString().split('T')[0]);
    setFechaFin(hoy.toISOString().split('T')[0]);
  }, []);

  // Procesar abonos para reportes
  const procesarAbonos = () => {
    let abonosFiltrados = [...abonos];
    
    // Filtrar por vendedor si no es "Todos"
    if (filtroVendedor !== 'Todos') {
      abonosFiltrados = abonosFiltrados.filter(
        abono => abono.vendedor === filtroVendedor
      );
    }
    
    // Filtrar por rango de fechas
    abonosFiltrados = abonosFiltrados.filter(abono => {
      const fechaAbono = new Date(abono.fecha);
      const fechaInicioObj = fechaInicio ? new Date(fechaInicio) : null;
      const fechaFinObj = fechaFin ? new Date(fechaFin) : null;
      
      return (!fechaInicioObj || fechaAbono >= fechaInicioObj) && 
             (!fechaFinObj || fechaAbono <= fechaFinObj);
    });
    
    // Abonos por día
    const abonosPorDia = abonosFiltrados.reduce((acum, abono) => {
      const fecha = abono.fecha;
      if (!acum[fecha]) {
        acum[fecha] = {
          fecha,
          total: 0,
          cantidad: 0,
          abonos: []
        };
      }
      acum[fecha].total += parseFloat(abono.monto);
      acum[fecha].cantidad += 1;
      acum[fecha].abonos.push(abono);
      return acum;
    }, {});
    
    // Abonos por vendedor
    const abonosPorVendedor = abonosFiltrados.reduce((acum, abono) => {
      const vendedor = abono.vendedor;
      if (!acum[vendedor]) {
        acum[vendedor] = {
          vendedor,
          total: 0,
          cantidad: 0,
          abonos: []
        };
      }
      acum[vendedor].total += parseFloat(abono.monto);
      acum[vendedor].cantidad += 1;
      acum[vendedor].abonos.push(abono);
      return acum;
    }, {});
    
    // Calcular totales para cada vendedor (incluso si no tienen abonos en el filtro)
    const vendedoresConTotales = vendedores.map(vendedor => {
      return abonosPorVendedor[vendedor] || {
        vendedor,
        total: 0,
        cantidad: 0,
        abonos: []
      };
    });
    
    return {
      porDia: Object.values(abonosPorDia).sort((a, b) => new Date(a.fecha) - new Date(b.fecha)),
      porVendedor: vendedoresConTotales.sort((a, b) => b.total - a.total),
      porCliente: abonosFiltrados.reduce((acum, abono) => {
        const cliente = abono.cliente;
        if (!acum[cliente]) {
          acum[cliente] = {
            cliente,
            total: 0,
            cantidad: 0,
            abonos: []
          };
        }
        acum[cliente].total += parseFloat(abono.monto);
        acum[cliente].cantidad += 1;
        acum[cliente].abonos.push(abono);
        return acum;
      }, {}),
      totalGeneral: abonosFiltrados.reduce((sum, abono) => sum + parseFloat(abono.monto), 0),
      cantidadGeneral: abonosFiltrados.length,
      abonosFiltrados
    };
  };

  const reportes = procesarAbonos();

  // Formatear moneda
  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  // Formatear fecha
  const formatFechaLegible = (fecha) => {
    const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
  };

  // Exportar reporte a CSV
  const exportarACSV = () => {
    const headers = ['Fecha', 'Cliente', 'Vendedor', 'Monto', 'Nota', 'Factura ID'];
    const rows = reportes.abonosFiltrados.map(abono => [
      abono.fecha,
      abono.cliente,
      abono.vendedor,
      abono.monto,
      abono.nota || '',
      abono.facturaId
    ]);
    
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(item => `"${item}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_cobros_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calcular porcentaje para gráfico circular
  const calcularPorcentaje = (valor) => {
    return reportes.totalGeneral > 0 
      ? ((valor / reportes.totalGeneral) * 100).toFixed(1) 
      : '0';
  };

  // Obtener color para cada vendedor
  const obtenerColorVendedor = (vendedor) => {
    const colores = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];
    const index = vendedores.indexOf(vendedor) % colores.length;
    return colores[index];
  };

  // Obtener vendedor principal para un día
  const obtenerVendedorPrincipal = (abonosDia) => {
    const conteoVendedores = abonosDia.reduce((acc, abono) => {
      acc[abono.vendedor] = (acc[abono.vendedor] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(conteoVendedores)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  };

  return (
    <div className="reportes-container">
      <header className="reportes-header">
        <h1>
          <i className="fas fa-chart-line"></i> Reportes de Cobros
        </h1>
        <div className="header-actions">
          <button 
            className="button secondary-button"
            onClick={() => navigate('/facturas')}
          >
            <i className="fas fa-arrow-left"></i> Volver a Facturas
          </button>
          
          {abonos.length > 0 && (
            <>
              <button 
                className="button info-button"
                onClick={exportarACSV}
              >
                <i className="fas fa-file-csv"></i> Exportar CSV
              </button>
              <button 
                className="button toggle-button"
                onClick={() => setMostrarGrafico(!mostrarGrafico)}
              >
                <i className={`fas fa-${mostrarGrafico ? 'chart-bar' : 'chart-pie'}`}></i> 
                {mostrarGrafico ? 'Ver Tabla' : 'Ver Gráfico'}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtro-row">
          <div className="filtro-group">
            <label>
              <i className="fas fa-calendar-alt"></i> Fecha Inicio:
              <input 
                type="date" 
                value={fechaInicio}
                onChange={e => setFechaInicio(e.target.value)}
                max={fechaFin || new Date().toISOString().split('T')[0]}
              />
            </label>
            
            <label>
              Fecha Fin:
              <input 
                type="date" 
                value={fechaFin}
                onChange={e => setFechaFin(e.target.value)}
                min={fechaInicio}
                max={new Date().toISOString().split('T')[0]}
              />
            </label>
          </div>
          
          <div className="filtro-group">
            <label>
              <i className="fas fa-user-tie"></i> Vendedor:
              <select
                value={filtroVendedor}
                onChange={e => setFiltroVendedor(e.target.value)}
              >
                <option value="Todos">Todos los vendedores</option>
                {vendedores.map(vendedor => (
                  <option key={vendedor} value={vendedor}>
                    {vendedor}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        
        <div className="resumen-filtros">
          <div className="resumen-card">
            <div className="resumen-icon">
              <i className="fas fa-money-bill-wave"></i>
            </div>
            <div className="resumen-content">
              <span>Total abonos</span>
              <strong>{formatMoneda(reportes.totalGeneral)}</strong>
            </div>
          </div>
          
          <div className="resumen-card">
            <div className="resumen-icon">
              <i className="fas fa-list-ol"></i>
            </div>
            <div className="resumen-content">
              <span>Cantidad de abonos</span>
              <strong>{reportes.cantidadGeneral}</strong>
            </div>
          </div>
          
          <div className="resumen-card">
            <div className="resumen-icon">
              <i className="fas fa-calculator"></i>
            </div>
            <div className="resumen-content">
              <span>Promedio por abono</span>
              <strong>
                {reportes.cantidadGeneral > 0 
                  ? formatMoneda(reportes.totalGeneral / reportes.cantidadGeneral) 
                  : formatMoneda(0)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por Vendedor */}
      <div className="resumen-vendedores">
        <h2>
          <i className="fas fa-users"></i> Resumen por Vendedor
          <small className="subtitle">
            {filtroVendedor !== 'Todos' ? `Filtrado por: ${filtroVendedor}` : 'Todos los vendedores'}
          </small>
        </h2>
        
        {mostrarGrafico ? (
          <div className="vendedores-grid">
            {reportes.porVendedor.map((vendedor, index) => (
              <div 
                key={index} 
                className="vendedor-card"
                style={{ borderLeft: `5px solid ${obtenerColorVendedor(vendedor.vendedor)}` }}
              >
                <div className="vendedor-header">
                  <h3>{vendedor.vendedor}</h3>
                  <span className="porcentaje">
                    {calcularPorcentaje(vendedor.total)}%
                  </span>
                </div>
                <div className="vendedor-stats">
                  <div className="stat-item">
                    <span>Total:</span>
                    <strong>{formatMoneda(vendedor.total)}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Abonos:</span>
                    <strong>{vendedor.cantidad}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Promedio:</span>
                    <strong>
                      {vendedor.cantidad > 0 
                        ? formatMoneda(vendedor.total / vendedor.cantidad) 
                        : formatMoneda(0)}
                    </strong>
                  </div>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ 
                      width: `${calcularPorcentaje(vendedor.total)}%`,
                      backgroundColor: obtenerColorVendedor(vendedor.vendedor)
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tabla-container">
            <table className="tabla-vendedores">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Promedio</th>
                  <th>% del Total</th>
                </tr>
              </thead>
              <tbody>
                {reportes.porVendedor.map((vendedor, index) => (
                  <tr key={index}>
                    <td>
                      <span 
                        className="vendedor-tag" 
                        style={{ backgroundColor: obtenerColorVendedor(vendedor.vendedor) }}
                      >
                        {vendedor.vendedor}
                      </span>
                    </td>
                    <td>{vendedor.cantidad}</td>
                    <td className="total">{formatMoneda(vendedor.total)}</td>
                    <td>
                      {vendedor.cantidad > 0 
                        ? formatMoneda(vendedor.total / vendedor.cantidad) 
                        : formatMoneda(0)}
                    </td>
                    <td>
                      <div className="porcentaje-container">
                        <div className="porcentaje-bar">
                          <div 
                            className="bar-fill" 
                            style={{ 
                              width: `${calcularPorcentaje(vendedor.total)}%`,
                              backgroundColor: obtenerColorVendedor(vendedor.vendedor)
                            }}
                          ></div>
                        </div>
                        <span className="porcentaje-text">
                          {calcularPorcentaje(vendedor.total)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reporte de Abonos por Día */}
      <div className="reporte-diario">
        <h2>
          <i className="fas fa-calendar-day"></i> Abonos por Día
          <small className="subtitle">
            {fechaInicio && fechaFin 
              ? `Desde ${formatFechaLegible(fechaInicio)} hasta ${formatFechaLegible(fechaFin)}` 
              : 'Todos los abonos'}
          </small>
        </h2>
        
        {cargando ? (
          <div className="loading-placeholder">
            <div className="spinner"></div>
            <p>Cargando datos de abonos...</p>
          </div>
        ) : reportes.porDia.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-calendar-times"></i>
            <p>No hay abonos registrados en este período</p>
          </div>
        ) : (
          <div className="tabla-container">
            <table className="tabla-abonos">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cantidad</th>
                  <th>Total</th>
                  <th>Promedio</th>
                  <th>Vendedor Principal</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reportes.porDia.map((dia, index) => {
                  const vendedorPrincipal = obtenerVendedorPrincipal(dia.abonos);
                  
                  return (
                    <tr key={index}>
                      <td>{formatFechaLegible(dia.fecha)}</td>
                      <td>{dia.cantidad}</td>
                      <td className="total">{formatMoneda(dia.total)}</td>
                      <td>{formatMoneda(dia.total / dia.cantidad)}</td>
                      <td>
                        <span 
                          className="vendedor-tag" 
                          style={{ backgroundColor: obtenerColorVendedor(vendedorPrincipal) }}
                        >
                          {vendedorPrincipal}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="button small-button"
                          onClick={() => {
                            setFechaInicio(dia.fecha);
                            setFechaFin(dia.fecha);
                          }}
                          title="Filtrar por esta fecha"
                        >
                          <i className="fas fa-filter"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Top Clientes */}
      <div className="top-clientes">
        <h2>
          <i className="fas fa-user-tag"></i> Top Clientes
          <small className="subtitle">Clientes con más abonos</small>
        </h2>
        
        {Object.keys(reportes.porCliente).length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-user-slash"></i>
            <p>No hay datos de clientes</p>
          </div>
        ) : (
          <div className="clientes-grid">
            {Object.values(reportes.porCliente)
              .sort((a, b) => b.total - a.total)
              .slice(0, 5)
              .map((cliente, index) => (
                <div key={index} className="cliente-card">
                  <div className="cliente-header">
                    <h3>{cliente.cliente}</h3>
                    <span className="ranking">#{index + 1}</span>
                  </div>
                  <div className="cliente-stats">
                    <div className="stat-item">
                      <span>Total abonado:</span>
                      <strong>{formatMoneda(cliente.total)}</strong>
                    </div>
                    <div className="stat-item">
                      <span>Abonos:</span>
                      <strong>{cliente.cantidad}</strong>
                    </div>
                  </div>
                  <div className="cliente-vendedores">
                    <span>Vendedores:</span>
                    <div className="vendedores-tags">
                      {[...new Set(cliente.abonos.map(a => a.vendedor))]
                        .slice(0, 3)
                        .map((vendedor, i) => (
                          <span 
                            key={i} 
                            className="vendedor-tag small"
                            style={{ backgroundColor: obtenerColorVendedor(vendedor) }}
                          >
                            {vendedor}
                          </span>
                        ))}
                      {[...new Set(cliente.abonos.map(a => a.vendedor))].length > 3 && (
                        <span className="vendedor-tag small more">
                          +{[...new Set(cliente.abonos.map(a => a.vendedor))].length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportesCobros;