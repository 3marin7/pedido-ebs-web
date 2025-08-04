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
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [archivoCSV, setArchivoCSV] = useState(null);
  const [errorImportacion, setErrorImportacion] = useState('');

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

  // Función auxiliar para generar y descargar el CSV
  const generarCSV = (headers, rows, filename) => {
    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.map(item => `"${item}"`).join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Exportar reporte completo de abonos
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
    
    generarCSV(headers, rows, `reporte_cobros_${new Date().toISOString().slice(0, 10)}`);
  };

  // 2. Exportar reporte por vendedores
  const exportarVendedoresACSV = () => {
    const headers = ['Vendedor', 'Cantidad Abonos', 'Total Recaudado', 'Promedio por Abono', '% del Total'];
    const rows = reportes.porVendedor.map(vendedor => [
      vendedor.vendedor,
      vendedor.cantidad,
      vendedor.total,
      vendedor.cantidad > 0 ? (vendedor.total / vendedor.cantidad).toFixed(2) : 0,
      calcularPorcentaje(vendedor.total)
    ]);
    
    generarCSV(headers, rows, `reporte_vendedores_${new Date().toISOString().slice(0, 10)}`);
  };

  // 3. Exportar reporte diario
  const exportarDiarioACSV = () => {
    const headers = ['Fecha', 'Cantidad Abonos', 'Total Recaudado', 'Promedio por Abono', 'Vendedor Principal'];
    const rows = reportes.porDia.map(dia => [
      dia.fecha,
      dia.cantidad,
      dia.total,
      (dia.total / dia.cantidad).toFixed(2),
      obtenerVendedorPrincipal(dia.abonos)
    ]);
    
    generarCSV(headers, rows, `reporte_diario_${new Date().toISOString().slice(0, 10)}`);
  };

  // 4. Exportar reporte de clientes
  const exportarClientesACSV = () => {
    const headers = ['Cliente', 'Cantidad Abonos', 'Total Abonado', 'Vendedores'];
    const rows = Object.values(reportes.porCliente)
      .sort((a, b) => b.total - a.total)
      .map(cliente => [
        cliente.cliente,
        cliente.cantidad,
        cliente.total,
        [...new Set(cliente.abonos.map(a => a.vendedor))].join(', ')
      ]);
    
    generarCSV(headers, rows, `reporte_clientes_${new Date().toISOString().slice(0, 10)}`);
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

  // Manejar importación de CSV
  const manejarImportacionCSV = (event) => {
    setErrorImportacion('');
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setErrorImportacion('El archivo debe ser un CSV');
      return;
    }
    
    setArchivoCSV(file);
    setMostrarModalImportar(true);
  };

  const procesarArchivoCSV = () => {
    if (!archivoCSV) return;
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target.result;
        const lines = content.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Validar estructura básica del CSV
        const camposRequeridos = ['fecha', 'cliente', 'vendedor', 'monto', 'facturaId'];
        const faltantes = camposRequeridos.filter(campo => !headers.includes(campo));
        
        if (faltantes.length > 0) {
          setErrorImportacion(`Faltan campos requeridos: ${faltantes.join(', ')}`);
          return;
        }
        
        const nuevosAbonos = [];
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const abono = {};
          
          headers.forEach((header, index) => {
            abono[header] = values[index] || '';
          });
          
          // Validar y convertir valores
          if (!abono.fecha || !abono.monto || !abono.facturaId) {
            console.warn(`Fila ${i} ignorada por datos incompletos`);
            continue;
          }
          
          abono.monto = parseFloat(abono.monto) || 0;
          abono.id = Date.now() + i; // ID temporal
          
          nuevosAbonos.push(abono);
        }
        
        if (nuevosAbonos.length === 0) {
          setErrorImportacion('No se encontraron abonos válidos en el archivo');
          return;
        }
        
        // Combinar con abonos existentes
        const abonosActuales = JSON.parse(localStorage.getItem('abonos')) || [];
        const abonosActualizados = [...abonosActuales, ...nuevosAbonos];
        
        // Guardar en localStorage
        localStorage.setItem('abonos', JSON.stringify(abonosActualizados));
        
        // Actualizar estado
        setAbonos(abonosActualizados);
        setMostrarModalImportar(false);
        setArchivoCSV(null);
        
        // Mostrar mensaje de éxito
        alert(`Se importaron ${nuevosAbonos.length} abonos correctamente`);
        
      } catch (error) {
        console.error('Error procesando CSV:', error);
        setErrorImportacion('Error al procesar el archivo CSV');
      }
    };
    
    reader.onerror = () => {
      setErrorImportacion('Error al leer el archivo');
    };
    
    reader.readAsText(archivoCSV);
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
          
          {/* Botón de importar */}
          <label className="button info-button file-import-button">
            <i className="fas fa-file-import"></i> Importar CSV
            <input 
              type="file" 
              accept=".csv, text/csv"
              onChange={manejarImportacionCSV}
              style={{ display: 'none' }}
            />
          </label>
          
          {/* Menú de exportación */}
          <div className="dropdown">
            <button className="button info-button dropdown-toggle">
              <i className="fas fa-file-csv"></i> Exportar Reportes
              <i className="fas fa-caret-down"></i>
            </button>
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={exportarACSV}>
                <i className="fas fa-file-alt"></i> Abonos detallados
              </button>
              <button className="dropdown-item" onClick={exportarVendedoresACSV}>
                <i className="fas fa-user-tie"></i> Por vendedores
              </button>
              <button className="dropdown-item" onClick={exportarDiarioACSV}>
                <i className="fas fa-calendar-day"></i> Diario consolidado
              </button>
              <button className="dropdown-item" onClick={exportarClientesACSV}>
                <i className="fas fa-users"></i> Por clientes
              </button>
            </div>
          </div>
          
          <button 
            className="button toggle-button"
            onClick={() => setMostrarGrafico(!mostrarGrafico)}
          >
            <i className={`fas fa-${mostrarGrafico ? 'chart-bar' : 'chart-pie'}`}></i> 
            {mostrarGrafico ? 'Ver Tabla' : 'Ver Gráfico'}
          </button>
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

      {/* Modal de Importación */}
      {mostrarModalImportar && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Importar Abonos desde CSV</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setMostrarModalImportar(false);
                  setErrorImportacion('');
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <p>Archivo seleccionado: <strong>{archivoCSV?.name}</strong></p>
              
              <div className="import-instructions">
                <h4>Formato requerido:</h4>
                <ul>
                  <li>Columnas: <code>fecha, cliente, vendedor, monto, facturaId, nota</code></li>
                  <li>Fecha formato: <code>YYYY-MM-DD</code></li>
                  <li>Monto debe ser numérico</li>
                  <li>La primera fila debe contener los encabezados</li>
                </ul>
              </div>
              
              {errorImportacion && (
                <div className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {errorImportacion}
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <button
                className="button secondary-button"
                onClick={() => {
                  setMostrarModalImportar(false);
                  setErrorImportacion('');
                }}
              >
                Cancelar
              </button>
              <button
                className="button primary-button"
                onClick={procesarArchivoCSV}
                disabled={!archivoCSV}
              >
                <i className="fas fa-file-import"></i> Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportesCobros;