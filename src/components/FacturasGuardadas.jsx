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
  const [importando, setImportando] = useState(false);

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

    facturasProcesadas.forEach(f => {
      stats.totalFiltrado += f.total;
    });

    stats.promedioGeneral = stats.cantidadGeneral > 0 
      ? stats.totalGeneral / stats.cantidadGeneral 
      : 0;
      
    stats.promedioFiltrado = stats.cantidadFiltrada > 0 
      ? stats.totalFiltrado / stats.cantidadFiltrada 
      : 0;

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

  // Importar facturas (versión que preserva existentes)
  const importarFacturas = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportando(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const contenido = e.target.result;
        const facturasImportadas = JSON.parse(contenido);
        
        if (!Array.isArray(facturasImportadas)) {
          throw new Error("El archivo no contiene un formato válido de facturas");
        }
        
        const camposRequeridos = ['id', 'cliente', 'vendedor', 'fecha', 'productos', 'total'];
        facturasImportadas.forEach(factura => {
          camposRequeridos.forEach(campo => {
            if (!factura.hasOwnProperty(campo)) {
              throw new Error(`Factura inválida: falta el campo ${campo}`);
            }
          });
        });
        
        const facturasActuales = JSON.parse(localStorage.getItem('facturas')) || [];
        
        // Fusionar facturas evitando duplicados por ID
        const facturasUnidas = [
          ...facturasActuales,
          ...facturasImportadas.filter(
            fi => !facturasActuales.some(fa => fa.id === fi.id)
          )
        ];
        
        // Ordenar por ID descendente
        facturasUnidas.sort((a, b) => b.id - a.id);
        
        const confirmar = window.confirm(
          `Se importarán ${facturasImportadas.length} facturas.\n` +
          `Nuevas facturas a agregar: ${facturasUnidas.length - facturasActuales.length}\n` +
          `Total después de importación: ${facturasUnidas.length}\n\n` +
          `¿Deseas continuar?`
        );
        
        if (confirmar) {
          localStorage.setItem('facturas', JSON.stringify(facturasUnidas));
          setFacturas(facturasUnidas);
          alert(`Importación completada. Ahora tienes ${facturasUnidas.length} facturas.`);
        }
      } catch (error) {
        console.error("Error importando facturas:", error);
        alert(`Error al importar facturas: ${error.message}`);
      } finally {
        setImportando(false);
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      alert("Error al leer el archivo");
      setImportando(false);
      event.target.value = '';
    };
    
    reader.readAsText(file);
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
            disabled={importando}
          >
            <i className="fas fa-plus"></i> Nueva Factura
          </button>
          {facturas.length > 0 && (
            <>
              <button 
                className="button info-button"
                onClick={exportarFacturas}
                disabled={importando}
              >
                <i className="fas fa-file-export"></i> Exportar
              </button>
              <button 
                className="button warning-button"
                onClick={() => document.getElementById('importar-facturas').click()}
                disabled={importando}
              >
                <i className="fas fa-file-import"></i> {importando ? 'Importando...' : 'Importar'}
              </button>
              <input
                type="file"
                id="importar-facturas"
                accept=".json"
                style={{ display: 'none' }}
                onChange={importarFacturas}
                disabled={importando}
              />
              <button 
                className="button secondary-button"
                onClick={() => setMostrarResumen(!mostrarResumen)}
                disabled={importando}
              >
                <i className={`fas fa-${mostrarResumen ? 'eye-slash' : 'eye'}`}></i> {mostrarResumen ? 'Ocultar' : 'Mostrar'} Resúmenes
              </button>
              
              <button 
                className="button report-button"
                onClick={() => navigate('/reportes-cobros')}
                disabled={importando}
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
            disabled={importando}
          />
        </div>
        
        <div className="filtros-avanzados">
          <select 
            value={orden} 
            onChange={(e) => setOrden(e.target.value)}
            className="orden-select"
            disabled={importando}
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

      {importando ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Importando facturas...</p>
        </div>
      ) : cargando ? (
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
                  disabled={importando}
                >
                  <i className="fas fa-eye"></i> Ver Detalle
                </button>
                <button
                  className="button danger-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMostrarConfirmacion(factura.id);
                  }}
                  disabled={importando}
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