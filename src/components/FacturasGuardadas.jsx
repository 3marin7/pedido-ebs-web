import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacturasGuardadas.css';

const FacturasGuardadas = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);

  // Cargar facturas
  useEffect(() => {
    const cargarFacturas = () => {
      try {
        const facturasGuardadas = JSON.parse(localStorage.getItem('facturas')) || [];
        setFacturas(facturasGuardadas);
      } catch (error) {
        console.error("Error cargando facturas:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarFacturas();
  }, []);

  // Procesar facturas con filtros y orden
  const facturasProcesadas = facturas
    .filter(factura => {
      const termino = busqueda.toLowerCase();
      return (
        factura.cliente.toLowerCase().includes(termino) ||
        factura.vendedor.toLowerCase().includes(termino) ||
        factura.id.toString().includes(busqueda) ||
        factura.fecha.includes(busqueda)
      );
    })
    .sort((a, b) => {
      switch (orden) {
        case 'antiguos': return new Date(a.fecha) - new Date(b.fecha);
        case 'mayor-total': return b.total - a.total;
        case 'menor-total': return a.total - b.total;
        default: return new Date(b.fecha) - new Date(a.fecha);
      }
    });

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const stats = {
      totalGeneral: 0,
      totalFiltrado: 0,
      cantidadGeneral: facturas.length,
      cantidadFiltrada: facturasProcesadas.length,
      porCliente: {},
      promedioGeneral: 0,
      promedioFiltrado: 0
    };

    // Calcular total general y por cliente
    facturas.forEach(f => {
      stats.totalGeneral += f.total;
      
      if (!stats.porCliente[f.cliente]) {
        stats.porCliente[f.cliente] = {
          cantidad: 0,
          total: 0,
          promedio: 0
        };
      }
      stats.porCliente[f.cliente].cantidad++;
      stats.porCliente[f.cliente].total += f.total;
    });

    // Calcular total filtrado
    facturasProcesadas.forEach(f => {
      stats.totalFiltrado += f.total;
    });

    // Calcular promedios
    stats.promedioGeneral = stats.cantidadGeneral > 0 
      ? stats.totalGeneral / stats.cantidadGeneral 
      : 0;
      
    stats.promedioFiltrado = stats.cantidadFiltrada > 0 
      ? stats.totalFiltrado / stats.cantidadFiltrada 
      : 0;

    // Calcular promedios por cliente
    Object.keys(stats.porCliente).forEach(cliente => {
      stats.porCliente[cliente].promedio = 
        stats.porCliente[cliente].total / stats.porCliente[cliente].cantidad;
    });

    return stats;
  };

  const estadisticas = calcularEstadisticas();

  // Eliminar factura
  const eliminarFactura = (id) => {
    const nuevasFacturas = facturas.filter(f => f.id !== id);
    localStorage.setItem('facturas', JSON.stringify(nuevasFacturas));
    setFacturas(nuevasFacturas);
    setMostrarConfirmacion(null);
  };

  // Exportar facturas
  const exportarFacturas = () => {
    const dataStr = JSON.stringify(facturas, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturas-ebs-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
  };

  // Formatear fecha
  const formatFecha = (fechaISO) => {
    const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(fechaISO).toLocaleDateString('es-ES', opciones);
  };

  // Formatear moneda
  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor);
  };

  return (
    <div className="facturas-container">
      <header className="facturas-header">
        <h1>
          <i className="fas fa-file-invoice"></i> Historial de Facturas
        </h1>
        <div className="header-actions">
          <button 
            className="button success-button"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-plus"></i> Nueva Factura
          </button>
          {facturas.length > 0 && (
            <>
              <button 
                className="button info-button"
                onClick={exportarFacturas}
              >
                <i className="fas fa-file-export"></i> Exportar
              </button>
              <button 
                className="button secondary-button"
                onClick={() => setMostrarResumen(!mostrarResumen)}
              >
                <i className={`fas fa-${mostrarResumen ? 'eye-slash' : 'eye'}`}></i> {mostrarResumen ? 'Ocultar' : 'Mostrar'} Resúmenes
              </button>
              
              {/* Botón añadido para Reportes de Cobros */}
              <button 
                className="button report-button"
                onClick={() => navigate('/reportes-cobros')}
              >
                <i className="fas fa-chart-bar"></i> Reportes de Cobros
              </button>
            </>
          )}
        </div>
      </header>

      <div className="filtros-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por cliente, vendedor, ID o fecha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <div className="filtros-avanzados">
          <select 
            value={orden} 
            onChange={(e) => setOrden(e.target.value)}
            className="orden-select"
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="mayor-total">Mayor total</option>
            <option value="menor-total">Menor total</option>
          </select>
          
          <span className="contador">
            {facturasProcesadas.length} de {facturas.length} facturas
          </span>
        </div>
      </div>

      {/* Sección de Estadísticas - Ahora condicional */}
      {mostrarResumen && (
        <div className="resumen-section">
          <div className="resumen-card">
            <h4><i className="fas fa-chart-pie"></i> Resumen General</h4>
            <div className="resumen-stats">
              <div className="stat-item">
                <span>Total Facturas</span>
                <strong>{estadisticas.cantidadGeneral}</strong>
              </div>
              <div className="stat-item">
                <span>Valor Total</span>
                <strong>{formatMoneda(estadisticas.totalGeneral)}</strong>
              </div>
              <div className="stat-item">
                <span>Promedio/Factura</span>
                <strong>{formatMoneda(estadisticas.promedioGeneral)}</strong>
              </div>
            </div>
          </div>

          <div className="resumen-card">
            <h4><i className="fas fa-filter"></i> Resultados Filtrados</h4>
            <div className="resumen-stats">
              <div className="stat-item">
                <span>Facturas</span>
                <strong>{estadisticas.cantidadFiltrada}</strong>
              </div>
              <div className="stat-item">
                <span>Valor Total</span>
                <strong>{formatMoneda(estadisticas.totalFiltrado)}</strong>
              </div>
              <div className="stat-item">
                <span>Promedio/Factura</span>
                <strong>{formatMoneda(estadisticas.promedioFiltrado)}</strong>
              </div>
            </div>
          </div>

          {busqueda && Object.keys(estadisticas.porCliente).length > 0 && (
            <div className="resumen-card clientes-resumen">
              <h4><i className="fas fa-users"></i> Clientes Encontrados</h4>
              <div className="clientes-list">
                {Object.entries(estadisticas.porCliente).map(([cliente, datos]) => (
                  <div key={cliente} className="cliente-item">
                    <span className="cliente-nombre">{cliente}</span>
                    <div className="cliente-stats">
                      <span>{datos.cantidad} factura(s)</span>
                      <div>
                        <strong>{formatMoneda(datos.total)}</strong>
                        <small> ({formatMoneda(datos.promedio)} c/u)</small>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Listado de Facturas */}
      {cargando ? (
        <div className="facturas-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="factura-card skeleton">
              <div className="skeleton-line" style={{ width: '40%' }}></div>
              <div className="skeleton-line" style={{ width: '60%' }}></div>
              <div className="skeleton-line" style={{ width: '80%' }}></div>
              <div className="skeleton-line" style={{ width: '30%' }}></div>
            </div>
          ))}
        </div>
      ) : facturasProcesadas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-file-excel"></i>
          </div>
          <h3>
            {busqueda 
              ? 'No se encontraron facturas con ese criterio' 
              : 'No hay facturas registradas'}
          </h3>
          <p>
            {busqueda
              ? 'Intenta con otro término de búsqueda'
              : 'Crea tu primera factura haciendo clic en "Nueva Factura"'}
          </p>
        </div>
      ) : (
        <div className="facturas-grid">
          {facturasProcesadas.map((factura) => (
            <article key={factura.id} className="factura-card">
              <header className="factura-card-header">
                <span className="factura-id">#{factura.id.toString().padStart(6, '0')}</span>
                <time className="factura-fecha">
                  {formatFecha(factura.fecha)}
                </time>
              </header>
              
              <div className="factura-card-body">
                <h3 className="factura-cliente">{factura.cliente}</h3>
                <p className="factura-vendedor">
                  <span>Vendedor:</span> {factura.vendedor}
                </p>
                
                <div className="factura-stats">
                  <div className="stat-item">
                    <span>Productos</span>
                    <strong>{factura.productos.length}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Total</span>
                    <strong className="total-amount">
                      {formatMoneda(factura.total)}
                    </strong>
                  </div>
                </div>
              </div>
              
              <footer className="factura-card-footer">
                <button
                  className="button primary-button"
                  onClick={() => navigate(`/factura/${factura.id}`)}
                >
                  <i className="fas fa-eye"></i> Ver Detalle
                </button>
                <button
                  className="button danger-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMostrarConfirmacion(factura.id);
                  }}
                >
                  <i className="fas fa-trash"></i> Eliminar
                </button>
              </footer>
              
              {mostrarConfirmacion === factura.id && (
                <div className="confirmacion-overlay">
                  <div className="confirmacion-box">
                    <p>¿Eliminar esta factura permanentemente?</p>
                    <div className="confirmacion-buttons">
                      <button 
                        className="button danger-button"
                        onClick={() => eliminarFactura(factura.id)}
                      >
                        <i className="fas fa-check"></i> Confirmar
                      </button>
                      <button 
                        className="button secondary-button"
                        onClick={() => setMostrarConfirmacion(null)}
                      >
                        <i className="fas fa-times"></i> Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacturasGuardadas;