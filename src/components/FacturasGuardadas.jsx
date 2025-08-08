import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FacturasGuardadas.css';

const FacturasGuardadas = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [orden, setOrden] = useState('recientes');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [importando, setImportando] = useState(false);
  const [errorImportacion, setErrorImportacion] = useState(null);

  // Cargar facturas y abonos
  useEffect(() => {
    const cargarDatos = () => {
      try {
        const facturasGuardadas = JSON.parse(localStorage.getItem('facturas')) || [];
        const abonosGuardados = JSON.parse(localStorage.getItem('abonos')) || [];
        setFacturas(facturasGuardadas);
        setAbonos(abonosGuardados);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // Calcular saldos para cada factura
  const calcularSaldos = (facturas, abonos) => {
    return facturas.map(factura => {
      const abonosFactura = abonos.filter(abono => abono.facturaId === factura.id);
      const totalAbonado = abonosFactura.reduce((sum, abono) => sum + (abono.monto || 0), 0);
      const saldo = factura.total - totalAbonado;
      
      return {
        ...factura,
        totalAbonado,
        saldo,
        estado: saldo <= 0 ? 'Pagada' : (totalAbonado > 0 ? 'Parcial' : 'Pendiente')
      };
    });
  };

  // Procesar facturas con filtros, orden y saldos
  const facturasProcesadas = calcularSaldos(
    facturas.filter(factura => {
      const termino = busqueda.toLowerCase();
      return (
        factura.cliente?.toLowerCase().includes(termino) ||
        factura.vendedor?.toLowerCase().includes(termino) ||
        factura.id?.toString().includes(busqueda) ||
        factura.fecha?.includes(busqueda)
      );
    }).sort((a, b) => {
      switch (orden) {
        case 'antiguos': return new Date(a.fecha) - new Date(b.fecha);
        case 'mayor-total': return b.total - a.total;
        case 'menor-total': return a.total - b.total;
        case 'mayor-saldo': return (b.saldo || 0) - (a.saldo || 0);
        case 'menor-saldo': return (a.saldo || 0) - (b.saldo || 0);
        default: return new Date(b.fecha) - new Date(a.fecha);
      }
    }),
    abonos
  );

  // Calcular estadísticas
  const calcularEstadisticas = () => {
    const facturasConSaldo = calcularSaldos(facturas, abonos);
    
    const stats = {
      totalGeneral: 0,
      totalFiltrado: 0,
      cantidadGeneral: facturas.length,
      cantidadFiltrada: facturasProcesadas.length,
      porCliente: {},
      promedioGeneral: 0,
      promedioFiltrado: 0,
      totalAbonado: 0,
      totalSaldoPendiente: 0
    };

    facturasConSaldo.forEach(f => {
      stats.totalGeneral += f.total || 0;
      stats.totalAbonado += f.totalAbonado || 0;
      stats.totalSaldoPendiente += (f.saldo > 0 ? f.saldo : 0) || 0;
      
      if (!stats.porCliente[f.cliente]) {
        stats.porCliente[f.cliente] = {
          cantidad: 0,
          total: 0,
          abonado: 0,
          saldo: 0,
          promedio: 0
        };
      }
      stats.porCliente[f.cliente].cantidad++;
      stats.porCliente[f.cliente].total += f.total || 0;
      stats.porCliente[f.cliente].abonado += f.totalAbonado || 0;
      stats.porCliente[f.cliente].saldo += (f.saldo > 0 ? f.saldo : 0) || 0;
    });

    facturasProcesadas.forEach(f => {
      stats.totalFiltrado += f.total || 0;
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

  // Eliminar factura (y sus abonos asociados)
  const eliminarFactura = (id) => {
    if (!window.confirm('¿Eliminar esta factura y todos sus abonos asociados?')) return;
    
    // Eliminar factura
    const nuevasFacturas = facturas.filter(f => f.id !== id);
    localStorage.setItem('facturas', JSON.stringify(nuevasFacturas));
    
    // Eliminar abonos asociados
    const nuevosAbonos = abonos.filter(a => a.facturaId !== id);
    localStorage.setItem('abonos', JSON.stringify(nuevosAbonos));
    
    setFacturas(nuevasFacturas);
    setAbonos(nuevosAbonos);
    setMostrarConfirmacion(null);
  };

  // Exportar facturas y abonos
  const exportarDatos = () => {
    const datosParaExportar = {
      facturas: facturas,
      abonos: abonos,
      metadata: {
        exportadoEl: new Date().toISOString(),
        version: '1.0',
        totalFacturas: facturas.length,
        totalAbonos: abonos.length
      }
    };

    const dataStr = JSON.stringify(datosParaExportar, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `datos-facturacion-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Liberar memoria
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // Importar facturas y abonos - Versión mejorada para Safari Mobile
  const importarDatos = (event) => {
    const file = event.target.files[0];
    if (!file) {
      setErrorImportacion('No se seleccionó ningún archivo');
      return;
    }

    // Verificar tipo de archivo
    if (!file.name.endsWith('.json') && !file.type.includes('json')) {
      setErrorImportacion('El archivo debe ser de tipo JSON');
      event.target.value = '';
      return;
    }

    setImportando(true);
    setErrorImportacion(null);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const contenido = e.target.result;
        if (!contenido) {
          throw new Error('El archivo está vacío');
        }

        // Intenta parsear el contenido
        let datosImportados;
        try {
          datosImportados = JSON.parse(contenido);
        } catch (parseError) {
          console.error('Error al parsear JSON:', parseError);
          throw new Error('El archivo no contiene un JSON válido');
        }

        // Validar estructura básica
        if (!datosImportados) {
          throw new Error('El archivo no contiene datos');
        }

        let facturasImportadas = [];
        let abonosImportados = [];
        
        // Manejar diferentes formatos de archivo
        if (datosImportados.facturas && datosImportados.abonos) {
          facturasImportadas = datosImportados.facturas;
          abonosImportados = datosImportados.abonos;
        } else if (Array.isArray(datosImportados)) {
          // Asumir que es un array de facturas sin abonos
          facturasImportadas = datosImportados;
          abonosImportados = [];
        } else {
          throw new Error("Formato de archivo no reconocido");
        }

        // Validar facturas
        const camposRequeridosFacturas = ['id', 'cliente', 'vendedor', 'fecha', 'productos', 'total'];
        facturasImportadas.forEach((factura, index) => {
          camposRequeridosFacturas.forEach(campo => {
            if (!factura.hasOwnProperty(campo)) {
              throw new Error(`Factura en posición ${index} no tiene el campo requerido: ${campo}`);
            }
          });
        });

        // Validar abonos
        const camposRequeridosAbonos = ['id', 'facturaId', 'fecha', 'monto'];
        abonosImportados.forEach((abono, index) => {
          camposRequeridosAbonos.forEach(campo => {
            if (!abono.hasOwnProperty(campo)) {
              throw new Error(`Abono en posición ${index} no tiene el campo requerido: ${campo}`);
            }
          });
          
          // Asignar método por defecto si no existe
          if (!abono.metodo) {
            abono.metodo = 'No especificado';
          }
        });

        const facturasActuales = JSON.parse(localStorage.getItem('facturas')) || [];
        const abonosActuales = JSON.parse(localStorage.getItem('abonos')) || [];
        
        // Filtrar para evitar duplicados
        const facturasUnidas = [
          ...facturasActuales,
          ...facturasImportadas.filter(
            fi => !facturasActuales.some(fa => fa.id === fi.id)
          )
        ];

        const abonosUnidos = [
          ...abonosActuales,
          ...abonosImportados.filter(
            ai => !abonosActuales.some(aa => aa.id === ai.id)
          )
        ];

        // Ordenar por ID descendente
        facturasUnidas.sort((a, b) => b.id - a.id);
        abonosUnidos.sort((a, b) => b.id - a.id);
        
        const nuevasFacturas = facturasUnidas.length - facturasActuales.length;
        const nuevosAbonos = abonosUnidos.length - abonosActuales.length;
        
        // Mostrar resumen de importación
        const confirmar = window.confirm(
          `Resumen de Importación:\n\n` +
          `- Facturas a importar: ${facturasImportadas.length}\n` +
          `  (${nuevasFacturas} nuevas, ${facturasImportadas.length - nuevasFacturas} existentes)\n` +
          `- Abonos a importar: ${abonosImportados.length}\n` +
          `  (${nuevosAbonos} nuevos, ${abonosImportados.length - nuevosAbonos} existentes)\n\n` +
          `Totales después de importación:\n` +
          `- Facturas: ${facturasUnidas.length}\n` +
          `- Abonos: ${abonosUnidos.length}\n\n` +
          `¿Deseas continuar con la importación?`
        );
        
        if (confirmar) {
          localStorage.setItem('facturas', JSON.stringify(facturasUnidas));
          localStorage.setItem('abonos', JSON.stringify(abonosUnidos));
          setFacturas(facturasUnidas);
          setAbonos(abonosUnidos);
          
          // Mostrar feedback detallado
          alert(
            `✅ Importación completada con éxito\n\n` +
            `Facturas:\n` +
            `- Total: ${facturasUnidas.length}\n` +
            `- Nuevas: ${nuevasFacturas}\n\n` +
            `Abonos:\n` +
            `- Total: ${abonosUnidos.length}\n` +
            `- Nuevos: ${nuevosAbonos}`
          );
        }
      } catch (error) {
        console.error("Error en importación:", error);
        setErrorImportacion(error.message);
        alert(`❌ Error al importar: ${error.message}`);
      } finally {
        setImportando(false);
        event.target.value = ''; // Resetear input para permitir re-selección
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error al leer archivo:", error);
      setErrorImportacion('Error al leer el archivo. Intenta nuevamente.');
      setImportando(false);
      event.target.value = '';
    };
    
    // Manejo especial para Safari Mobile
    try {
      if (file.type === '' || file.type === 'application/octet-stream') {
        // Safari a veces no detecta bien el tipo MIME
        reader.readAsText(file);
      } else {
        reader.readAsText(file);
      }
    } catch (error) {
      console.error("Error en FileReader:", error);
      setErrorImportacion('Error al procesar el archivo. Intenta con otro archivo.');
      setImportando(false);
      event.target.value = '';
    }
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
    }).format(valor || 0);
  };

  // Formatear estado con color
  const formatEstado = (estado) => {
    const clases = {
      'Pagada': 'estado-pagada',
      'Parcial': 'estado-parcial',
      'Pendiente': 'estado-pendiente'
    };
    return <span className={`estado ${clases[estado] || ''}`}>{estado}</span>;
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
          {(facturas.length > 0 || abonos.length > 0) && (
            <>
              <button 
                className="button info-button"
                onClick={exportarDatos}
                disabled={importando}
              >
                <i className="fas fa-file-export"></i> Exportar Todo
              </button>
              <label 
                htmlFor="importar-datos" 
                className={`button warning-button ${importando ? 'disabled' : ''}`}
              >
                <i className="fas fa-file-import"></i> {importando ? 'Importando...' : 'Importar'}
                <input
                  type="file"
                  id="importar-datos"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={importarDatos}
                  disabled={importando}
                />
              </label>
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

      {errorImportacion && (
        <div className="error-message">
          <i className="fas fa-exclamation-circle"></i> {errorImportacion}
        </div>
      )}

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
            <option value="mayor-saldo">Mayor saldo</option>
            <option value="menor-saldo">Menor saldo</option>
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
                <span>Total Abonado</span>
                <strong>{formatMoneda(estadisticas.totalAbonado)}</strong>
              </div>
              <div className="stat-item">
                <span>Saldo Pendiente</span>
                <strong className="saldo-pendiente">{formatMoneda(estadisticas.totalSaldoPendiente)}</strong>
              </div>
              <div className="stat-item">
                <span>Promedio/Factura</span>
                <strong>{formatMoneda(estadisticas.promedioGeneral)}</strong>
              </div>
              <div className="stat-item">
                <span>Total Abonos</span>
                <strong>{abonos.length}</strong>
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
                      <div className="cliente-saldos">
                        <span>Abonado: {formatMoneda(datos.abonado)}</span>
                        <span>Saldo: {formatMoneda(datos.saldo)}</span>
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
          <p>Importando datos...</p>
          {errorImportacion && (
            <p className="error-text">{errorImportacion}</p>
          )}
        </div>
      ) : cargando ? (
        <div className="facturas-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="factura-card skeleton">
              <div className="skeleton-line" style={{ width: '40%' }}></div>
              <div className="skeleton-line" style={{ width: '60%' }}></div>
              <div className="skeleton-line" style={{ width: '80%' }}></div>
              <div className="skeleton-line" style={{ width: '30%' }}></div>
              <div className="skeleton-line" style={{ width: '50%' }}></div>
              <div className="skeleton-line" style={{ width: '50%' }}></div>
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
                    <strong>{factura.productos?.length || 0}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Total</span>
                    <strong className="total-amount">
                      {formatMoneda(factura.total)}
                    </strong>
                  </div>
                  <div className="stat-item">
                    <span>Abonado</span>
                    <strong>{formatMoneda(factura.totalAbonado)}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Saldo</span>
                    <strong className={factura.saldo > 0 ? 'saldo-pendiente' : 'saldo-pagado'}>
                      {formatMoneda(factura.saldo)}
                    </strong>
                  </div>
                  <div className="stat-item">
                    <span>Estado</span>
                    {formatEstado(factura.estado)}
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
                    <p>¿Eliminar esta factura y todos sus abonos asociados?</p>
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