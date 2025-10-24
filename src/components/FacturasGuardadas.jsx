import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './FacturasGuardadas.css';

const FacturasGuardadas = () => {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [busquedaVendedor, setBusquedaVendedor] = useState('');
  const [vendedores, setVendedores] = useState([]);
  const [orden, setOrden] = useState('recientes');
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(null);
  const [mostrarResumen, setMostrarResumen] = useState(false);
  const [importando, setImportando] = useState(false);
  const [errorImportacion, setErrorImportacion] = useState(null);
  const [mostrarPagadas, setMostrarPagadas] = useState(false);
  // Nuevos estados para la autenticación de eliminación
  const [password, setPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');
  // Nuevos estados para los resúmenes organizados
  const [resumenActivo, setResumenActivo] = useState('general');
  const [busquedaClienteResumen, setBusquedaClienteResumen] = useState('');

  // Cargar facturas y abonos desde Supabase
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        
        // Cargar facturas
        const { data: facturasData, error: facturasError } = await supabase
          .from('facturas')
          .select('*')
          .order('fecha', { ascending: false });
        
        if (facturasError) throw facturasError;
        
        // Cargar abonos
        const { data: abonosData, error: abonosError } = await supabase
          .from('abonos')
          .select('*');
        
        if (abonosError) throw abonosError;
        
        setFacturas(facturasData || []);
        setAbonos(abonosData || []);
        
        // Extraer lista única de vendedores
        const vendedoresUnicos = [...new Set(facturasData
          .filter(f => f.vendedor) // Filtrar vendedores no nulos
          .map(f => f.vendedor)
          .sort())];
        setVendedores(vendedoresUnicos);
        
      } catch (error) {
        console.error("Error cargando datos:", error);
        alert('Error al cargar las facturas y abonos');
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  // Calcular saldos para cada factura
  const calcularSaldos = (facturas, abonos) => {
    return facturas.map(factura => {
      const abonosFactura = abonos.filter(abono => abono.factura_id === factura.id);
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

  // Función para verificar la contraseña
  const verificarPassword = () => {
    return password === 'edwin' || password === '777';
  };

  // Procesar facturas con filtros, orden y saldos - CORREGIDO
  const facturasProcesadas = calcularSaldos(
    facturas.filter(factura => {
      const termino = busqueda.toLowerCase();
      const coincideBusqueda = (
        factura.cliente?.toLowerCase().includes(termino) ||
        factura.id?.toString().includes(busqueda) ||
        factura.fecha?.includes(busqueda)
      );
      
      // Filtrar por vendedor si se ha seleccionado uno
      const coincideVendedor = busquedaVendedor === '' || factura.vendedor === busquedaVendedor;
      
      // Calcular estado para esta factura individualmente
      const abonosFactura = abonos.filter(abono => abono.factura_id === factura.id);
      const totalAbonado = abonosFactura.reduce((sum, abono) => sum + (abono.monto || 0), 0);
      const saldo = factura.total - totalAbonado;
      const estaPagada = saldo <= 0;
      
      // LÓGICA CORREGIDA: 
      // - Si NO mostrarPagadas está activado, mostrar solo las NO pagadas
      // - Si mostrarPagadas está activado, mostrar todas
      // - La búsqueda se aplica independientemente del estado de pago
      const mostrarPorEstado = mostrarPagadas ? true : !estaPagada;
      
      return coincideBusqueda && coincideVendedor && mostrarPorEstado;
    }).sort((a, b) => {
      switch (orden) {
        case 'antiguos': return new Date(a.fecha) - new Date(b.fecha);
        case 'mayor-total': return b.total - a.total;
        case 'menor-total': return a.total - b.total;
        case 'mayor-saldo': return (b.saldo || 0) - (a.saldo || 0);
        case 'menor-saldo': return (a.saldo || 0) - (b.saldo || 0);
        case 'alfabetico-az': return a.cliente?.localeCompare(b.cliente || '');
        case 'alfabetico-za': return b.cliente?.localeCompare(a.cliente || '');
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
      porVendedor: {},
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
      
      // Estadísticas por vendedor
      if (!stats.porVendedor[f.vendedor]) {
        stats.porVendedor[f.vendedor] = {
          cantidad: 0,
          total: 0,
          abonado: 0,
          saldo: 0,
          promedio: 0
        };
      }
      stats.porVendedor[f.vendedor].cantidad++;
      stats.porVendedor[f.vendedor].total += f.total || 0;
      stats.porVendedor[f.vendedor].abonado += f.totalAbonado || 0;
      stats.porVendedor[f.vendedor].saldo += (f.saldo > 0 ? f.saldo : 0) || 0;
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
    
    Object.keys(stats.porVendedor).forEach(vendedor => {
      stats.porVendedor[vendedor].promedio = 
        stats.porVendedor[vendedor].total / stats.porVendedor[vendedor].cantidad;
    });

    return stats;
  };

  const estadisticas = calcularEstadisticas();

  // Función para obtener deuda rápida por cliente
  const obtenerDeudaCliente = (nombreCliente) => {
    const cliente = estadisticas.porCliente[nombreCliente];
    if (!cliente) return null;
    
    return {
      nombre: nombreCliente,
      facturas: cliente.cantidad,
      total: cliente.total,
      abonado: cliente.abonado,
      saldo: cliente.saldo
    };
  };

  // Eliminar factura (y sus abonos asociados)
  const eliminarFactura = async (id) => {
    // Verificar contraseña primero
    if (!verificarPassword()) {
      setErrorPassword('Contraseña incorrecta');
      return;
    }
    
    // Buscar la factura específica
    const facturaAEliminar = facturas.find(f => f.id === id);
    
    // Verificar si tiene saldo pendiente
    const facturasConSaldo = calcularSaldos([facturaAEliminar], abonos);
    const tieneSaldoPendiente = facturasConSaldo[0]?.saldo > 0;
    
    if (tieneSaldoPendiente) {
      if (!window.confirm('¿Estás seguro de eliminar esta factura con saldo pendiente? Esta acción no se puede deshacer.')) return;
    } else {
      // Para facturas pagadas, pedir confirmación adicional
      if (!window.confirm('Esta factura ya está pagada. ¿Realmente deseas eliminarla? Esta acción no se puede deshacer.')) return;
    }
    
    try {
      setCargando(true);
      
      // Eliminar abonos asociados primero
      const { error: abonosError } = await supabase
        .from('abonos')
        .delete()
        .eq('factura_id', id);
      
      if (abonosError) throw abonosError;
      
      // Eliminar factura
      const { error: facturaError } = await supabase
        .from('facturas')
        .delete()
        .eq('id', id);
      
      if (facturaError) throw facturaError;
      
      // Actualizar estado local
      setFacturas(facturas.filter(f => f.id !== id));
      setAbonos(abonos.filter(a => a.factura_id !== id));
      
      // Actualizar lista de vendedores si es necesario
      const vendedoresActualizados = [...new Set(facturas
        .filter(f => f.id !== id && f.vendedor)
        .map(f => f.vendedor)
        .sort())];
      setVendedores(vendedoresActualizados);
      
    } catch (error) {
      console.error("Error eliminando factura:", error);
      alert('Error al eliminar la factura');
    } finally {
      setCargando(false);
      setMostrarConfirmacion(null);
      setPassword('');
      setErrorPassword('');
    }
  };

  // Exportar facturas y abonos
  const exportarDatos = async () => {
    try {
      setCargando(true);
      
      // Obtener todas las facturas y abonos
      const { data: facturasData, error: facturasError } = await supabase
        .from('facturas')
        .select('*');
      
      if (facturasError) throw facturasError;
      
      const { data: abonosData, error: abonosError } = await supabase
        .from('abonos')
        .select('*');
      
      if (abonosError) throw abonosError;
      
      const datosParaExportar = {
        facturas: facturasData,
        abonos: abonosData,
        metadata: {
          exportadoEl: new Date().toISOString(),
          version: '1.0',
          totalFacturas: facturasData.length,
          totalAbonos: abonosData.length
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
      
    } catch (error) {
      console.error("Error exportando datos:", error);
      alert('Error al exportar los datos');
    } finally {
      setCargando(false);
    }
  };

  // Importar facturas y abonos
  const importarDatos = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      setErrorImportacion('No se seleccionó ningún archivo');
      return;
    }

    if (!file.name.endsWith('.json') && !file.type.includes('json')) {
      setErrorImportacion('El archivo debe ser de tipo JSON');
      event.target.value = '';
      return;
    }

    setImportando(true);
    setErrorImportacion(null);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const contenido = e.target.result;
        if (!contenido) throw new Error('El archivo está vacío');

        let datosImportados;
        try {
          datosImportados = JSON.parse(contenido);
        } catch (parseError) {
          throw new Error('El archivo no contiene un JSON válido');
        }

        let facturasImportadas = [];
        let abonosImportados = [];
        
        if (datosImportados.facturas && datosImportados.abonos) {
          facturasImportadas = datosImportados.facturas;
          abonosImportados = datosImportados.abonos;
        } else if (Array.isArray(datosImportados)) {
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
        const camposRequeridosAbonos = ['id', 'factura_id', 'fecha', 'monto'];
        abonosImportados.forEach((abono, index) => {
          camposRequeridosAbonos.forEach(campo => {
            if (!abono.hasOwnProperty(campo)) {
              throw new Error(`Abono en posición ${index} no tiene el campo requerido: ${campo}`);
            }
          });
          
          if (!abono.metodo) {
            abono.metodo = 'No especificado';
          }
        });

        // Insertar facturas en lote
        const { error: facturasError } = await supabase
          .from('facturas')
          .upsert(facturasImportadas, { onConflict: 'id' });
        
        if (facturasError) throw facturasError;
        
        // Insertar abonos en lote
        if (abonosImportados.length > 0) {
          const { error: abonosError } = await supabase
            .from('abonos')
            .upsert(abonosImportados, { onConflict: 'id' });
          
          if (abonosError) throw abonosError;
        }

        // Recargar datos
        const { data: nuevasFacturas } = await supabase
          .from('facturas')
          .select('*');
        
        const { data: nuevosAbonos } = await supabase
          .from('abonos')
          .select('*');
        
        setFacturas(nuevasFacturas || []);
        setAbonos(nuevosAbonos || []);
        
        // Actualizar lista de vendedores
        const vendedoresUnicos = [...new Set(nuevasFacturas
          .filter(f => f.vendedor)
          .map(f => f.vendedor)
          .sort())];
        setVendedores(vendedoresUnicos);
        
        alert('✅ Importación completada con éxito');
        
      } catch (error) {
        console.error("Error en importación:", error);
        setErrorImportacion(error.message);
        alert(`❌ Error al importar: ${error.message}`);
      } finally {
        setImportando(false);
        event.target.value = '';
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error al leer archivo:", error);
      setErrorImportacion('Error al leer el archivo. Intenta nuevamente.');
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

  // Función para truncar texto largo
  const truncarTexto = (texto, longitud = 25) => {
    if (!texto) return '';
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
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
            disabled={importando || cargando}
          >
            <i className="fas fa-plus"></i> Nueva Factura
          </button>
          {(facturas.length > 0 || abonos.length > 0) && (
            <>
              {/* NUEVO BOTÓN: RUTAS DE COBRO */}
              <button 
                className="button primary-button"
                onClick={() => navigate('/rutas-cobro')}
                disabled={importando || cargando}
              >
                <i className="fas fa-route"></i> Rutas de Cobro
              </button>
              
              <button 
                className="button info-button"
                onClick={exportarDatos}
                disabled={importando || cargando}
              >
                <i className="fas fa-file-export"></i> Exportar Todo
              </button>
              <label 
                htmlFor="importar-datos" 
                className={`button warning-button ${importando || cargando ? 'disabled' : ''}`}
              >
                <i className="fas fa-file-import"></i> {importando ? 'Importando...' : 'Importar'}
                <input
                  type="file"
                  id="importar-datos"
                  accept=".json,application/json"
                  style={{ display: 'none' }}
                  onChange={importarDatos}
                  disabled={importando || cargando}
                />
              </label>
              <button 
                className={`button ${mostrarPagadas ? 'success-button' : 'secondary-button'}`}
                onClick={() => setMostrarPagadas(!mostrarPagadas)}
                disabled={importando || cargando}
              >
                <i className={`fas fa-${mostrarPagadas ? 'eye' : 'eye-slash'}`}></i> 
                {mostrarPagadas ? 'Ocultar Pagadas' : 'Mostrar Pagadas'}
              </button>
              <button 
                className="button secondary-button"
                onClick={() => setMostrarResumen(!mostrarResumen)}
                disabled={importando || cargando}
              >
                <i className={`fas fa-${mostrarResumen ? 'eye-slash' : 'eye'}`}></i> {mostrarResumen ? 'Ocultar' : 'Mostrar'} Resúmenes
              </button>
              
              <button 
                className="button report-button"
                onClick={() => navigate('/reportes-cobros')}
                disabled={importando || cargando}
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
            placeholder="🔍 Buscar por cliente, ID o fecha..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            disabled={importando || cargando}
          />
        </div>
        
        <div className="filtros-avanzados">
          <select 
            value={busquedaVendedor} 
            onChange={(e) => setBusquedaVendedor(e.target.value)}
            className="vendedor-select"
            disabled={importando || cargando}
          >
            <option value="">Todos los vendedores</option>
            {vendedores.map(vendedor => (
              <option key={vendedor} value={vendedor}>{vendedor}</option>
            ))}
          </select>
          
          <select 
            value={orden} 
            onChange={(e) => setOrden(e.target.value)}
            className="orden-select"
            disabled={importando || cargando}
          >
            <option value="recientes">Más recientes</option>
            <option value="antiguos">Más antiguos</option>
            <option value="alfabetico-az">A-Z (Cliente)</option>
            <option value="alfabetico-za">Z-A (Cliente)</option>
            <option value="mayor-total">Mayor total</option>
            <option value="menor-total">Menor total</option>
            <option value="mayor-saldo">Mayor saldo</option>
            <option value="menor-saldo">Menor saldo</option>
          </select>
          
          <span className="contador">
            {facturasProcesadas.length} de {facturas.length} facturas
            {!mostrarPagadas && ' (ocultando pagadas)'}
            {busquedaVendedor && ` - Vendedor: ${busquedaVendedor}`}
          </span>
        </div>
      </div>

      {mostrarResumen && (
        <div className="resumen-section">
          <div className="resumen-tabs">
            <button 
              className={resumenActivo === 'general' ? 'tab-active' : ''}
              onClick={() => setResumenActivo('general')}
            >
              <i className="fas fa-chart-pie"></i> General
            </button>
            <button 
              className={resumenActivo === 'vendedor' ? 'tab-active' : ''}
              onClick={() => setResumenActivo('vendedor')}
            >
              <i className="fas fa-user-tie"></i> Por Vendedor
            </button>
            <button 
              className={resumenActivo === 'clientes' ? 'tab-active' : ''}
              onClick={() => setResumenActivo('clientes')}
            >
              <i className="fas fa-users"></i> Por Cliente
            </button>
          </div>

          {resumenActivo === 'general' && (
            <div className="resumen-content">
              <div className="resumen-card">
                <h4><i className="fas fa-chart-pie"></i> Resumen General</h4>
                <div className="resumen-stats grid-3">
                  <div className="stat-item highlight">
                    <span>Total Facturas</span>
                    <strong>{estadisticas.cantidadGeneral}</strong>
                  </div>
                  <div className="stat-item highlight">
                    <span>Valor Total</span>
                    <strong>{formatMoneda(estadisticas.totalGeneral)}</strong>
                  </div>
                  <div className="stat-item highlight">
                    <span>Promedio/Factura</span>
                    <strong>{formatMoneda(estadisticas.promedioGeneral)}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Total Abonado</span>
                    <strong>{formatMoneda(estadisticas.totalAbonado)}</strong>
                  </div>
                  <div className="stat-item saldo">
                    <span>Saldo Pendiente</span>
                    <strong>{formatMoneda(estadisticas.totalSaldoPendiente)}</strong>
                  </div>
                  <div className="stat-item">
                    <span>Total Abonos</span>
                    <strong>{abonos.length}</strong>
                  </div>
                </div>
              </div>

              <div className="resumen-card">
                <h4><i className="fas fa-filter"></i> Resultados Filtrados</h4>
                <div className="resumen-stats grid-2">
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
            </div>
          )}

          {resumenActivo === 'vendedor' && (
            <div className="resumen-content">
              <div className="resumen-card">
                <h4><i className="fas fa-user-tie"></i> Estadísticas por Vendedor</h4>
                <div className="vendedores-list">
                  {Object.entries(estadisticas.porVendedor)
                    .sort((a, b) => b[1].total - a[1].total)
                    .map(([vendedor, datos]) => (
                      <div key={vendedor} className="vendedor-item">
                        <span className="vendedor-nombre">{vendedor}</span>
                        <div className="vendedor-stats">
                          <div className="stat">
                            <span>{datos.cantidad} facturas</span>
                            <strong>{formatMoneda(datos.total)}</strong>
                          </div>
                          <div className="stat">
                            <span>Abonado: {formatMoneda(datos.abonado)}</span>
                            <span>Saldo: {formatMoneda(datos.saldo)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {resumenActivo === 'clientes' && (
            <div className="resumen-content">
              <div className="resumen-header">
                <h4><i className="fas fa-users"></i> Resumen por Cliente</h4>
                <input
                  type="text"
                  placeholder="🔍 Buscar cliente..."
                  value={busquedaClienteResumen}
                  onChange={(e) => setBusquedaClienteResumen(e.target.value)}
                  className="busqueda-cliente"
                />
              </div>
              <div className="clientes-list">
                {Object.entries(estadisticas.porCliente)
                  .filter(([cliente]) => 
                    cliente.toLowerCase().includes(busquedaClienteResumen.toLowerCase())
                  )
                  .sort((a, b) => b[1].saldo - a[1].saldo)
                  .map(([cliente, datos]) => (
                    <div key={cliente} className="cliente-item">
                      <span className="cliente-nombre">{cliente}</span>
                      <div className="cliente-stats">
                        <div className="stat">
                          <span>{datos.cantidad} factura(s)</span>
                          <strong>{formatMoneda(datos.total)}</strong>
                        </div>
                        <div className="stat">
                          <span>Abonado: {formatMoneda(datos.abonado)}</span>
                          <span className={datos.saldo > 0 ? 'saldo-pendiente' : 'saldo-pagado'}>
                            Saldo: {formatMoneda(datos.saldo)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {importando || cargando ? (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>{importando ? 'Importando datos...' : 'Cargando facturas...'}</p>
          {errorImportacion && (
            <p className="error-text">{errorImportacion}</p>
          )}
        </div>
      ) : facturasProcesadas.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-file-excel"></i>
          </div>
          <h3>
            {busqueda || busquedaVendedor
              ? 'No se encontraron facturas con ese criterio' 
              : 'No hay facturas registradas'}
          </h3>
          <p>
            {busqueda || busquedaVendedor
              ? 'Intenta con otro término de búsqueda'
              : 'Crea tu primera factura haciendo clic en "Nueva Factura"'}
          </p>
        </div>
      ) : (
        <div className="facturas-grid">
          {facturasProcesadas.map((factura) => (
            <article key={factura.id} className="factura-card">
              <header className="factura-card-header">
                <div className="factura-header-top">
                  <span className="factura-id">#{factura.id.toString().padStart(6, '0')}</span>
                  <time className="factura-fecha">
                    {formatFecha(factura.fecha)}
                  </time>
                </div>
                {formatEstado(factura.estado)}
              </header>
              
              <div className="factura-card-body">
                <div className="factura-info-cliente-vendedor">
                  <div className="info-line">
                    <strong>CLIENTE:</strong> {factura.cliente}
                  </div>
                  <div className="info-line">
                    <strong>VENDEDOR:</strong> {factura.vendedor}
                  </div>
                  {factura.direccion && (
                    <div className="info-line">
                      <strong>DIRECCIÓN:</strong> {truncarTexto(factura.direccion, 20)}
                    </div>
                  )}
                  {factura.telefono && (
                    <div className="info-line">
                      <strong>TELÉFONO:</strong> {factura.telefono}
                    </div>
                  )}
                </div>
                
                <div className="productos-section">
                  <div className="productos-header">
                    <strong>PRODUCTO</strong>
                    <strong>CANT</strong>
                  </div>
                  <div className="productos-list">
                    {factura.productos?.map((producto, index) => (
                      <div key={index} className="producto-item">
                        <span className="producto-nombre">
                          {truncarTexto(producto.nombre, 30)}
                        </span>
                        <span className="producto-cantidad">
                          {producto.cantidad}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="factura-totales">
                  <div className="total-line">
                    <span>PRODUCTOS:</span>
                    <span>{factura.productos?.length || 0}</span>
                  </div>
                  <div className="total-line">
                    <span>TOTAL:</span>
                    <strong>{formatMoneda(factura.total)}</strong>
                  </div>
                  <div className="total-line">
                    <span>ABONADO:</span>
                    <span>{formatMoneda(factura.totalAbonado)}</span>
                  </div>
                  <div className="total-line saldo">
                    <span>SALDO:</span>
                    <strong className={factura.saldo > 0 ? 'saldo-pendiente' : 'saldo-pagado'}>
                      {formatMoneda(factura.saldo)}
                    </strong>
                  </div>
                </div>
              </div>
              
              <footer className="factura-card-footer">
                <button
                  className="button primary-button"
                  onClick={() => navigate(`/factura/${factura.id}`)}
                  disabled={importando || cargando}
                >
                  <i className="fas fa-eye"></i> Ver Detalle
                </button>
                <button
                  className="button danger-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMostrarConfirmacion(factura.id);
                  }}
                  disabled={importando || cargando}
                >
                  <i className="fas fa-trash"></i> Eliminar
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
      
      {mostrarConfirmacion && (
        <div className="confirmacion-overlay">
          <div className="confirmacion-box">
            <h4>Confirmar eliminación</h4>
            <p>Para eliminar la factura, ingrese la contraseña de autorización:</p>
            
            <div className="password-input-container">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorPassword('');
                }}
                placeholder="Ingrese la contraseña"
                className={errorPassword ? 'input-error' : ''}
              />
              {errorPassword && <span className="error-text">{errorPassword}</span>}
            </div>
            
            <div className="confirmacion-buttons">
              <button 
                className="button danger-button"
                onClick={() => eliminarFactura(mostrarConfirmacion)}
              >
                <i className="fas fa-trash"></i> Eliminar
              </button>
              <button 
                className="button secondary-button"
                onClick={() => {
                  setMostrarConfirmacion(null);
                  setPassword('');
                  setErrorPassword('');
                }}
              >
                <i className="fas fa-times"></i> Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacturasGuardadas;