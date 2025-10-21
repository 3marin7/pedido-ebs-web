import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './RutasCobro.css';

const RutasCobro = () => {
  const navigate = useNavigate();
  const [clientesConDeuda, setClientesConDeuda] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroZona, setFiltroZona] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('prioridad');
  const [rutaGenerada, setRutaGenerada] = useState([]);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [mostrarRecordatorios, setMostrarRecordatorios] = useState(false);
  const [reporteDiario, setReporteDiario] = useState(null);

  // Nuevos estados para historial
  const [mostrarHistorialVisitas, setMostrarHistorialVisitas] = useState(false);
  const [historialVisitas, setHistorialVisitas] = useState([]);
  const [mostrarClientesMenosVisitados, setMostrarClientesMenosVisitados] = useState(false);
  const [clientesMenosVisitados, setClientesMenosVisitados] = useState([]);

  // Cargar clientes con deuda
  useEffect(() => {
    cargarDatosCompletos();
  }, []);

  const cargarDatosCompletos = async () => {
    try {
      setCargando(true);
      await Promise.all([
        cargarClientesConDeuda(),
        cargarReporteDiario()
      ]);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setCargando(false);
    }
  };

  // Función para cargar historial de visitas
  const cargarHistorialVisitas = async () => {
    try {
      // Intentar cargar desde Supabase
      const { data: visitas, error } = await supabase
        .from('visits_cobro')
        .select('*')
        .order('fecha_visita', { ascending: false })
        .limit(50);

      if (!error && visitas) {
        setHistorialVisitas(visitas);
      } else {
        // Fallback a localStorage
        const visitasStorage = JSON.parse(localStorage.getItem('visitasCobro') || '[]');
        const visitasOrdenadas = visitasStorage
          .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          .slice(0, 50);
        setHistorialVisitas(visitasOrdenadas);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
      // Fallback final
      const visitasStorage = JSON.parse(localStorage.getItem('visitasCobro') || '[]');
      setHistorialVisitas(visitasStorage.slice(0, 50));
    }
  };

  // Función para cargar clientes menos visitados
  const cargarClientesMenosVisitados = async () => {
    try {
      let visitas = [];

      // Intentar cargar desde Supabase
      const { data: visitasData, error } = await supabase
        .from('visits_cobro')
        .select('*');

      if (!error && visitasData) {
        visitas = visitasData;
      } else {
        // Fallback a localStorage
        visitas = JSON.parse(localStorage.getItem('visitasCobro') || '[]');
      }

      // Contar visitas por cliente
      const visitasPorCliente = {};
      
      visitas.forEach(visita => {
        const nombreCliente = visita.cliente_nombre || visita.clienteNombre;
        if (nombreCliente) {
          visitasPorCliente[nombreCliente] = (visitasPorCliente[nombreCliente] || 0) + 1;
        }
      });

      // Convertir a array y ordenar por menos visitados
      const clientesConConteo = Object.entries(visitasPorCliente)
        .map(([nombre, conteo]) => ({
          nombre,
          visitas: conteo,
          ultimaVisita: visitas.find(v => 
            (v.cliente_nombre || v.clienteNombre) === nombre
          )?.fecha_visita || visitas.find(v => 
            (v.cliente_nombre || v.clienteNombre) === nombre
          )?.fecha
        }))
        .sort((a, b) => a.visitas - b.visitas)
        .slice(0, 15);

      setClientesMenosVisitados(clientesConConteo);
      
    } catch (error) {
      console.error('Error cargando clientes menos visitados:', error);
    }
  };

  // Función para calcular días desde última visita
  const calcularDiasDesdeUltimaVisita = (fechaVisita) => {
    if (!fechaVisita) return 'Sin visitas';
    
    const hoy = new Date();
    const ultimaVisita = new Date(fechaVisita);
    const diferenciaMs = hoy - ultimaVisita;
    const dias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));
    
    return dias === 0 ? 'Hoy' : `${dias} día${dias !== 1 ? 's' : ''}`;
  };

  // Función para formatear fecha
  const formatFecha = (fecha) => {
    if (!fecha) return 'Sin fecha';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const cargarClientesConDeuda = async () => {
    try {
      // Cargar facturas
      const { data: facturas, error: facturasError } = await supabase
        .from('facturas')
        .select('*');
      
      if (facturasError) throw facturasError;
      
      // Cargar abonos
      const { data: abonos, error: abonosError } = await supabase
        .from('abonos')
        .select('*');
      
      if (abonosError) throw abonosError;

      // Cargar visitas desde Supabase
      const { data: visitas, error: visitasError } = await supabase
        .from('visits_cobro')
        .select('*');
      
      if (visitasError) {
        console.log('Tabla visits_cobro no encontrada, usando localStorage');
        throw visitasError;
      }

      // Calcular deudas por cliente
      const deudasPorCliente = {};
      
      facturas.forEach(factura => {
        const abonosFactura = abonos.filter(abono => abono.factura_id === factura.id);
        const totalAbonado = abonosFactura.reduce((sum, abono) => sum + (abono.monto || 0), 0);
        const saldo = factura.total - totalAbonado;
        
        if (saldo > 0) {
          if (!deudasPorCliente[factura.cliente]) {
            deudasPorCliente[factura.cliente] = {
              nombre: factura.cliente,
              direccion: factura.direccion || 'Sin dirección',
              telefono: factura.telefono || 'Sin teléfono',
              totalDeuda: 0,
              facturasPendientes: [],
              facturaMasAntigua: factura.fecha,
              ultimaFactura: factura.fecha,
              zona: extraerZona(factura.direccion),
              clienteId: factura.cliente_id || factura.id.toString()
            };
          }
          
          deudasPorCliente[factura.cliente].totalDeuda += saldo;
          deudasPorCliente[factura.cliente].facturasPendientes.push({
            id: factura.id,
            fecha: factura.fecha,
            saldo: saldo,
            vendedor: factura.vendedor
          });
          
          // Actualizar fechas
          if (new Date(factura.fecha) < new Date(deudasPorCliente[factura.cliente].facturaMasAntigua)) {
            deudasPorCliente[factura.cliente].facturaMasAntigua = factura.fecha;
          }
          if (new Date(factura.fecha) > new Date(deudasPorCliente[factura.cliente].ultimaFactura)) {
            deudasPorCliente[factura.cliente].ultimaFactura = factura.fecha;
          }
        }
      });

      // Convertir a array y calcular prioridad
      const clientesArray = Object.values(deudasPorCliente).map(cliente => {
        const diasDesdePrimeraFactura = Math.floor(
          (new Date() - new Date(cliente.facturaMasAntigua)) / (1000 * 60 * 60 * 24)
        );
        const diasDesdeUltimaFactura = Math.floor(
          (new Date() - new Date(cliente.ultimaFactura)) / (1000 * 60 * 60 * 24)
        );

        // Verificar si el cliente fue visitado hoy (desde Supabase)
        const visitadoHoy = visitas?.some(visita => 
          visita.cliente_nombre === cliente.nombre && 
          new Date(visita.fecha_visita).toDateString() === new Date().toDateString()
        );

        // Calcular puntuación de prioridad (mayor = más urgente)
        let puntuacion = 0;
        
        // Factor deuda (40% del total)
        puntuacion += (cliente.totalDeuda / 100000) * 40;
        
        // Factor antigüedad (30% del total)
        if (diasDesdePrimeraFactura > 90) puntuacion += 30;
        else if (diasDesdePrimeraFactura > 60) puntuacion += 20;
        else if (diasDesdePrimeraFactura > 30) puntuacion += 10;
        
        // Factor tiempo sin pago (30% del total)
        if (diasDesdeUltimaFactura > 60) puntuacion += 30;
        else if (diasDesdeUltimaFactura > 30) puntuacion += 20;
        else if (diasDesdeUltimaFactura > 15) puntuacion += 10;

        return {
          ...cliente,
          diasDesdePrimeraFactura,
          diasDesdeUltimaFactura,
          puntuacionPrioridad: Math.min(100, puntuacion),
          nivelPrioridad: calcularNivelPrioridad(puntuacion),
          visitadoHoy: visitadoHoy || false,
          necesitaRecordatorio: diasDesdePrimeraFactura > 60
        };
      });

      setClientesConDeuda(clientesArray);
      
    } catch (error) {
      console.error("Error cargando clientes con deuda:", error);
      // Fallback a localStorage si hay error
      cargarDesdeLocalStorage();
    }
  };

  // Fallback a localStorage
  const cargarDesdeLocalStorage = () => {
    try {
      const clientesBasicos = [];
      const facturasStorage = JSON.parse(localStorage.getItem('facturas') || '[]');
      const abonosStorage = JSON.parse(localStorage.getItem('abonos') || '[]');
      
      // Calcular deudas básicas desde localStorage
      const deudasPorCliente = {};
      
      facturasStorage.forEach(factura => {
        const abonosFactura = abonosStorage.filter(abono => abono.factura_id === factura.id);
        const totalAbonado = abonosFactura.reduce((sum, abono) => sum + (abono.monto || 0), 0);
        const saldo = factura.total - totalAbonado;
        
        if (saldo > 0) {
          if (!deudasPorCliente[factura.cliente]) {
            deudasPorCliente[factura.cliente] = {
              nombre: factura.cliente,
              direccion: factura.direccion || 'Sin dirección',
              telefono: factura.telefono || 'Sin teléfono',
              totalDeuda: 0,
              facturasPendientes: [],
              facturaMasAntigua: factura.fecha,
              ultimaFactura: factura.fecha,
              zona: extraerZona(factura.direccion),
              clienteId: factura.id.toString()
            };
          }
          
          deudasPorCliente[factura.cliente].totalDeuda += saldo;
          deudasPorCliente[factura.cliente].facturasPendientes.push({
            id: factura.id,
            fecha: factura.fecha,
            saldo: saldo,
            vendedor: factura.vendedor
          });
        }
      });

      const clientesArray = Object.values(deudasPorCliente).map(cliente => {
        const diasDesdePrimeraFactura = Math.floor(
          (new Date() - new Date(cliente.facturaMasAntigua)) / (1000 * 60 * 60 * 24)
        );
        const diasDesdeUltimaFactura = Math.floor(
          (new Date() - new Date(cliente.ultimaFactura)) / (1000 * 60 * 60 * 24)
        );

        // Calcular puntuación de prioridad
        let puntuacion = 0;
        puntuacion += (cliente.totalDeuda / 100000) * 40;
        if (diasDesdePrimeraFactura > 90) puntuacion += 30;
        else if (diasDesdePrimeraFactura > 60) puntuacion += 20;
        else if (diasDesdePrimeraFactura > 30) puntuacion += 10;
        if (diasDesdeUltimaFactura > 60) puntuacion += 30;
        else if (diasDesdeUltimaFactura > 30) puntuacion += 20;
        else if (diasDesdeUltimaFactura > 15) puntuacion += 10;

        return {
          ...cliente,
          diasDesdePrimeraFactura,
          diasDesdeUltimaFactura,
          puntuacionPrioridad: Math.min(100, puntuacion),
          nivelPrioridad: calcularNivelPrioridad(puntuacion),
          visitadoHoy: false,
          necesitaRecordatorio: diasDesdePrimeraFactura > 60
        };
      });

      setClientesConDeuda(clientesArray);
      
    } catch (error) {
      console.error('Error cargando desde localStorage:', error);
    }
  };

  // Función para extraer zona de la dirección
  const extraerZona = (direccion) => {
    if (!direccion) return 'Sin zona';
    
    const direccionLower = direccion.toLowerCase();
    const zonas = ['norte', 'sur', 'este', 'oeste', 'centro', 'oriente', 'occidente'];
    
    for (let zona of zonas) {
      if (direccionLower.includes(zona)) {
        return zona.charAt(0).toUpperCase() + zona.slice(1);
      }
    }
    
    return 'Otra zona';
  };

  // Calcular nivel de prioridad
  const calcularNivelPrioridad = (puntuacion) => {
    if (puntuacion >= 80) return 'Alta';
    if (puntuacion >= 60) return 'Media-Alta';
    if (puntuacion >= 40) return 'Media';
    if (puntuacion >= 20) return 'Baja';
    return 'Muy Baja';
  };

  // Función para marcar cliente como visitado
  const marcarComoVisitado = async (cliente) => {
    try {
      // Intentar con Supabase primero
      const { error } = await supabase
        .from('visits_cobro')
        .insert([
          {
            cliente_id: cliente.clienteId,
            cliente_nombre: cliente.nombre,
            direccion: cliente.direccion,
            deuda_pendiente: cliente.totalDeuda,
            resultado: 'visitado',
            observaciones: 'Visita de cobranza realizada'
          }
        ]);

      if (error) throw error;

      // Actualizar estado local
      actualizarEstadoVisita(cliente.nombre, true);
      alert(`✅ ${cliente.nombre} marcado como visitado`);

    } catch (error) {
      console.error('Error al registrar visita en Supabase:', error);
      // Fallback a localStorage
      marcarComoVisitadoLocalStorage(cliente);
    }
  };

  // Fallback a localStorage
  const marcarComoVisitadoLocalStorage = (cliente) => {
    try {
      const visitasHoy = JSON.parse(localStorage.getItem('visitasCobro') || '[]');
      
      const nuevaVisita = {
        id: Date.now(),
        clienteNombre: cliente.nombre,
        fecha: new Date().toISOString(),
        deuda: cliente.totalDeuda,
        direccion: cliente.direccion
      };
      
      visitasHoy.push(nuevaVisita);
      localStorage.setItem('visitasCobro', JSON.stringify(visitasHoy));

      actualizarEstadoVisita(cliente.nombre, true);
      alert(`✅ ${cliente.nombre} marcado como visitado`);

    } catch (error) {
      console.error('Error al registrar visita en localStorage:', error);
      alert('Error al registrar la visita');
    }
  };

  const actualizarEstadoVisita = (nombreCliente, visitado) => {
    setClientesConDeuda(prev => 
      prev.map(c => 
        c.nombre === nombreCliente 
          ? { ...c, visitadoHoy: visitado }
          : c
      )
    );

    if (rutaGenerada.length > 0) {
      setRutaGenerada(prev => 
        prev.map(paso => 
          paso.tipo === 'cliente' && paso.nombre === nombreCliente
            ? { ...paso, visitadoHoy: visitado }
            : paso
        )
      );
    }
  };

  // Cargar reporte diario
  const cargarReporteDiario = async () => {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      const { data: visitasHoy, error } = await supabase
        .from('visits_cobro')
        .select('*')
        .gte('fecha_visita', `${hoy}T00:00:00`)
        .lte('fecha_visita', `${hoy}T23:59:59`);

      if (!error && visitasHoy) {
        setReporteDiario({
          totalVisitas: visitasHoy.length,
          visitas: visitasHoy
        });
      }
    } catch (error) {
      console.error('Error cargando reporte diario:', error);
    }
  };

  // Función para generar recordatorios
  const generarRecordatorios = () => {
    const clientesSinVisitar = clientesConDeuda
      .filter(cliente => !cliente.visitadoHoy && cliente.diasDesdePrimeraFactura > 30)
      .sort((a, b) => b.diasDesdePrimeraFactura - a.diasDesdePrimeraFactura);

    return clientesSinVisitar;
  };

  // Función para generar ruta optimizada
  const generarRutaOptimizada = () => {
    if (clientesFiltrados.length === 0) return;

    // Agrupar por zona
    const clientesPorZona = {};
    
    clientesFiltrados.forEach(cliente => {
      if (!clientesPorZona[cliente.zona]) {
        clientesPorZona[cliente.zona] = [];
      }
      clientesPorZona[cliente.zona].push(cliente);
    });

    // Ordenar zonas por densidad de clientes y prioridad
    const zonasOrdenadas = Object.keys(clientesPorZona).sort((a, b) => {
      const densidadA = clientesPorZona[a].length;
      const densidadB = clientesPorZona[b].length;
      const prioridadA = clientesPorZona[a].reduce((sum, c) => sum + c.puntuacionPrioridad, 0);
      const prioridadB = clientesPorZona[b].reduce((sum, c) => sum + c.puntuacionPrioridad, 0);
      
      // Ponderar: 60% densidad + 40% prioridad
      const scoreA = (densidadA * 0.6) + (prioridadA * 0.4);
      const scoreB = (densidadB * 0.6) + (prioridadB * 0.4);
      
      return scoreB - scoreA;
    });

    // Construir ruta optimizada
    const ruta = [];
    
    zonasOrdenadas.forEach(zona => {
      // Agregar separador de zona
      ruta.push({ 
        tipo: 'zona', 
        nombre: `🚗 ZONA ${zona}`,
        info: `${clientesPorZona[zona].length} clientes`
      });
      
      // Ordenar clientes dentro de la zona por prioridad
      const clientesEnZona = [...clientesPorZona[zona]]
        .sort((a, b) => b.puntuacionPrioridad - a.puntuacionPrioridad);
      
      clientesEnZona.forEach((cliente, index) => {
        ruta.push({ 
          tipo: 'cliente', 
          ...cliente,
          ordenEnRuta: ruta.length
        });
      });
    });

    setRutaGenerada(ruta);
    setMostrarMapa(true);
    
    // Scroll a la sección de ruta
    setTimeout(() => {
      document.querySelector('.ruta-generada-section')?.scrollIntoView({ 
        behavior: 'smooth' 
      });
    }, 500);
  };

  // Función para ver facturas del cliente
  const verFacturasCliente = (cliente) => {
    navigate('/facturas', { 
      state: { 
        filtroCliente: cliente.nombre
      } 
    });
  };

  // Filtrar y ordenar clientes
  const clientesFiltrados = clientesConDeuda
    .filter(cliente => 
      filtroZona === '' || cliente.zona === filtroZona
    )
    .sort((a, b) => {
      switch (ordenamiento) {
        case 'deuda':
          return b.totalDeuda - a.totalDeuda;
        case 'antiguedad':
          return a.diasDesdePrimeraFactura - b.diasDesdePrimeraFactura;
        case 'zona':
          return a.zona.localeCompare(b.zona);
        case 'cliente':
          return a.nombre.localeCompare(b.nombre);
        default: // 'prioridad'
          return b.puntuacionPrioridad - a.puntuacionPrioridad;
      }
    });

  // Formatear moneda
  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  // Obtener zonas únicas
  const zonasUnicas = [...new Set(clientesConDeuda.map(c => c.zona))].sort();

  // Clientes que necesitan recordatorio
  const clientesRecordatorio = generarRecordatorios();

  if (cargando) {
    return (
      <div className="rutas-cobro-container">
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Analizando deudas y generando rutas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rutas-cobro-container">
      <header className="rutas-header">
        <div className="header-main">
          <h1>
            <i className="fas fa-route"></i> Rutas de Cobro Inteligentes
          </h1>
          <button 
            className="button secondary-button"
            onClick={() => navigate('/facturas')}
          >
            <i className="fas fa-arrow-left"></i> Volver a Facturas
          </button>
        </div>
        <p className="header-subtitle">
          Sistema de priorización para visitas de cobranza
        </p>
      </header>

      {/* CONTROLES ADICIONALES */}
      <div className="controles-adicionales">
        <button 
          className="button info-button"
          onClick={async () => {
            await cargarHistorialVisitas();
            setMostrarHistorialVisitas(!mostrarHistorialVisitas);
            setMostrarClientesMenosVisitados(false);
          }}
        >
          <i className="fas fa-history"></i> Ver Historial de Visitas
        </button>
        
        <button 
          className="button warning-button"
          onClick={async () => {
            await cargarClientesMenosVisitados();
            setMostrarClientesMenosVisitados(!mostrarClientesMenosVisitados);
            setMostrarHistorialVisitas(false);
          }}
        >
          <i className="fas fa-chart-line"></i> Clientes Menos Visitados
        </button>
      </div>

      {/* PANEL DE CLIENTES MENOS VISITADOS */}
      {mostrarClientesMenosVisitados && (
        <div className="historial-visitas-panel">
          <div className="panel-header">
            <h3>
              <i className="fas fa-chart-line"></i> Clientes Menos Visitados
            </h3>
            <button 
              className="button secondary-button"
              onClick={() => setMostrarClientesMenosVisitados(false)}
            >
              <i className="fas fa-times"></i> Cerrar
            </button>
          </div>

          {clientesMenosVisitados.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-users"></i>
              <p>No hay suficiente información para el análisis</p>
              <small>Realiza algunas visitas para ver estadísticas</small>
            </div>
          ) : (
            <div className="menos-visitados-list">
              <div className="analisis-header">
                <h4>Top {clientesMenosVisitados.length} Clientes con Menos Visitas</h4>
                <p>Clientes que requieren más atención en cobranza</p>
              </div>
              
              {clientesMenosVisitados.map((cliente, index) => (
                <div key={cliente.nombre} className="cliente-poco-visitado">
                  <div className="cliente-rank">
                    <span className="rank-number">{index + 1}</span>
                  </div>
                  <div className="cliente-info">
                    <div className="cliente-header">
                      <strong>{cliente.nombre}</strong>
                      <span className="visitas-count">
                        {cliente.visitas} visita{cliente.visitas !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="cliente-detalles">
                      <span>
                        Última visita: {calcularDiasDesdeUltimaVisita(cliente.ultimaVisita)}
                      </span>
                      {cliente.ultimaVisita && (
                        <small>
                          {formatFecha(cliente.ultimaVisita)}
                        </small>
                      )}
                    </div>
                  </div>
                  <button 
                    className="button micro-button primary-button"
                    onClick={() => {
                      // Buscar el cliente en la lista principal
                      const clienteEnDeuda = clientesConDeuda.find(c => c.nombre === cliente.nombre);
                      if (clienteEnDeuda) {
                        alert(`Cliente ${cliente.nombre} seleccionado. Deuda: ${formatMoneda(clienteEnDeuda.totalDeuda)}`);
                      } else {
                        alert(`Cliente ${cliente.nombre} seleccionado para visita prioritaria`);
                      }
                    }}
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                </div>
              ))}
              
              <div className="resumen-analisis">
                <h5>Resumen del Análisis</h5>
                <div className="resumen-stats">
                  <div className="resumen-item">
                    <span>Total de clientes analizados:</span>
                    <strong>{new Set(clientesMenosVisitados.map(c => c.nombre)).size}</strong>
                  </div>
                  <div className="resumen-item">
                    <span>Promedio de visitas por cliente:</span>
                    <strong>
                      {(clientesMenosVisitados.reduce((sum, c) => sum + c.visitas, 0) / clientesMenosVisitados.length).toFixed(1)}
                    </strong>
                  </div>
                  <div className="resumen-item">
                    <span>Clientes con solo 1 visita:</span>
                    <strong>
                      {clientesMenosVisitados.filter(c => c.visitas === 1).length}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PANEL DE HISTORIAL DE VISITAS */}
      {mostrarHistorialVisitas && (
        <div className="historial-visitas-panel">
          <div className="panel-header">
            <h3>
              <i className="fas fa-history"></i> Historial de Visitas
            </h3>
            <button 
              className="button secondary-button"
              onClick={() => setMostrarHistorialVisitas(false)}
            >
              <i className="fas fa-times"></i> Cerrar
            </button>
          </div>

          {historialVisitas.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-search"></i>
              <p>No se encontraron visitas registradas</p>
            </div>
          ) : (
            <div className="visitas-list">
              {historialVisitas.map((visita, index) => (
                <div key={visita.id || index} className="visita-item">
                  <div className="visita-info">
                    <div className="visita-cliente">
                      <strong>{visita.cliente_nombre || visita.clienteNombre}</strong>
                      <span className="visita-fecha">
                        {formatFecha(visita.fecha_visita || visita.fecha)}
                      </span>
                    </div>
                    <div className="visita-detalles">
                      <span>Deuda: {formatMoneda(visita.deuda_pendiente || visita.deuda)}</span>
                      <span className="estado visitado">
                        {visita.resultado || 'Visitado'}
                      </span>
                    </div>
                  </div>
                  {visita.observaciones && (
                    <div className="visita-observaciones">
                      <small>{visita.observaciones}</small>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notificaciones de deudas antiguas */}
      {clientesRecordatorio.length > 0 && (
        <div className="notificacion-alerta">
          <div className="alerta-header">
            <i className="fas fa-exclamation-triangle"></i>
            <h4>Recordatorios Importantes</h4>
            <button 
              className="button micro-button"
              onClick={() => setMostrarRecordatorios(!mostrarRecordatorios)}
            >
              <i className={`fas fa-chevron-${mostrarRecordatorios ? 'up' : 'down'}`}></i>
            </button>
          </div>
          {mostrarRecordatorios && (
            <div className="alerta-content">
              <p>{clientesRecordatorio.length} clientes con deudas antiguas necesitan visita urgente:</p>
              <div className="recordatorio-list">
                {clientesRecordatorio.slice(0, 5).map(cliente => (
                  <div key={cliente.nombre} className="recordatorio-item">
                    <span>{cliente.nombre}</span>
                    <span>{cliente.diasDesdePrimeraFactura} días de deuda</span>
                    <span>{formatMoneda(cliente.totalDeuda)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reporte Diario */}
      {reporteDiario && reporteDiario.totalVisitas > 0 && (
        <div className="reporte-diario">
          <h4>
            <i className="fas fa-chart-line"></i> Reporte del Día
          </h4>
          <div className="reporte-stats">
            <div className="reporte-item">
              <span>Visitas Realizadas:</span>
              <strong>{reporteDiario.totalVisitas}</strong>
            </div>
            <div className="reporte-item">
              <span>Clientes Pendientes:</span>
              <strong>{clientesConDeuda.filter(c => !c.visitadoHoy).length}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Estadísticas Rápidas */}
      <div className="estadisticas-rapidas">
        <div className="stat-card">
          <div className="stat-icon alta">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="stat-info">
            <span>Clientes Prioridad Alta</span>
            <strong>
              {clientesConDeuda.filter(c => c.nivelPrioridad === 'Alta').length}
            </strong>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon visitados">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <span>Visitados Hoy</span>
            <strong>
              {clientesConDeuda.filter(c => c.visitadoHoy).length}
            </strong>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon deuda">
            <i className="fas fa-money-bill-wave"></i>
          </div>
          <div className="stat-info">
            <span>Deuda Total Pendiente</span>
            <strong>
              {formatMoneda(clientesConDeuda.reduce((sum, c) => sum + c.totalDeuda, 0))}
            </strong>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon tiempo">
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span>Deuda Más Antigua</span>
            <strong>
              {clientesConDeuda.length > 0 
                ? Math.max(...clientesConDeuda.map(c => c.diasDesdePrimeraFactura)) + ' días'
                : '0 días'
              }
            </strong>
          </div>
        </div>
      </div>

      {/* Controles de Filtro y Ordenamiento */}
      <div className="controles-ruta">
        <div className="filtros-group">
          <div className="filtro-item">
            <label>Filtrar por Zona:</label>
            <select 
              value={filtroZona} 
              onChange={(e) => setFiltroZona(e.target.value)}
            >
              <option value="">Todas las zonas</option>
              {zonasUnicas.map(zona => (
                <option key={zona} value={zona}>{zona}</option>
              ))}
            </select>
          </div>
          
          <div className="filtro-item">
            <label>Ordenar por:</label>
            <select 
              value={ordenamiento} 
              onChange={(e) => setOrdenamiento(e.target.value)}
            >
              <option value="prioridad">Prioridad (Recomendado)</option>
              <option value="deuda">Monto Deuda</option>
              <option value="antiguedad">Antigüedad</option>
              <option value="zona">Zona</option>
              <option value="cliente">Nombre Cliente</option>
            </select>
          </div>
        </div>
        
        <button 
          className="button primary-button generar-ruta-btn"
          onClick={generarRutaOptimizada}
          disabled={clientesFiltrados.length === 0}
        >
          <i className="fas fa-route"></i> Generar Ruta Optimizada
        </button>
      </div>

      {/* Lista de Clientes con Deuda */}
      <div className="clientes-deuda-section">
        <h3>
          <i className="fas fa-list"></i> 
          Clientes con Deuda Pendiente ({clientesFiltrados.length})
          {filtroZona && ` - Zona: ${filtroZona}`}
        </h3>
        
        {clientesFiltrados.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-check-circle"></i>
            <h4>¡Excelente! No hay deudas pendientes</h4>
            <p>No se encontraron clientes con deudas según los filtros aplicados</p>
          </div>
        ) : (
          <div className="clientes-grid">
            {clientesFiltrados.map((cliente, index) => (
              <div key={cliente.nombre} className={`cliente-card prioridad-${cliente.nivelPrioridad.toLowerCase()} ${cliente.visitadoHoy ? 'visitado' : ''}`}>
                <div className="cliente-header">
                  <div className="cliente-info">
                    <h4>{cliente.nombre}</h4>
                    <div className="cliente-badges">
                      <span className="zona-badge">{cliente.zona}</span>
                      {cliente.visitadoHoy && (
                        <span className="visitado-badge">
                          <i className="fas fa-check"></i> Visitado Hoy
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`prioridad-badge ${cliente.nivelPrioridad.toLowerCase()}`}>
                    {cliente.nivelPrioridad}
                  </div>
                </div>
                
                <div className="cliente-details">
                  <div className="detail-item">
                    <i className="fas fa-map-marker-alt"></i>
                    <span>{cliente.direccion}</span>
                  </div>
                  {cliente.telefono !== 'Sin teléfono' && (
                    <div className="detail-item">
                      <i className="fas fa-phone"></i>
                      <span>{cliente.telefono}</span>
                    </div>
                  )}
                </div>
                
                <div className="deuda-info">
                  <div className="deuda-stats">
                    <div className="stat">
                      <span>Deuda Total:</span>
                      <strong>{formatMoneda(cliente.totalDeuda)}</strong>
                    </div>
                    <div className="stat">
                      <span>Facturas Pendientes:</span>
                      <span>{cliente.facturasPendientes.length}</span>
                    </div>
                  </div>
                  
                  <div className="tiempo-info">
                    <div className="tiempo-item">
                      <small>Deuda desde:</small>
                      <span>{cliente.diasDesdePrimeraFactura} días</span>
                    </div>
                    <div className="tiempo-item">
                      <small>Última factura:</small>
                      <span>{cliente.diasDesdeUltimaFactura} días</span>
                    </div>
                  </div>
                </div>
                
                <div className="cliente-actions">
                  <button 
                    className="button info-button"
                    onClick={() => verFacturasCliente(cliente)}
                  >
                    <i className="fas fa-file-invoice"></i> Ver Facturas
                  </button>
                  <button 
                    className={`button ${cliente.visitadoHoy ? 'secondary-button' : 'primary-button'}`}
                    onClick={() => marcarComoVisitado(cliente)}
                    disabled={cliente.visitadoHoy}
                  >
                    <i className={`fas ${cliente.visitadoHoy ? 'fa-check' : 'fa-user-check'}`}></i>
                    {cliente.visitadoHoy ? 'Visitado' : 'Marcar Visitado'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mapa de Ruta Generada */}
      {mostrarMapa && rutaGenerada.length > 0 && (
        <div className="ruta-generada-section">
          <div className="ruta-header">
            <h3>
              <i className="fas fa-route"></i> Ruta de Cobro Optimizada
            </h3>
            <div className="ruta-header-actions">
              <button 
                className="button success-button"
                onClick={() => {
                  // Exportar ruta como texto
                  const rutaTexto = rutaGenerada.map((paso, index) => {
                    if (paso.tipo === 'zona') {
                      return `${index + 1}. ${paso.nombre} - ${paso.info}`;
                    } else {
                      return `${index + 1}. ${paso.nombre} - ${paso.direccion} - Deuda: ${formatMoneda(paso.totalDeuda)}`;
                    }
                  }).join('\n');
                  
                  navigator.clipboard.writeText(rutaTexto);
                  alert('Ruta copiada al portapapeles');
                }}
              >
                <i className="fas fa-copy"></i> Copiar Ruta
              </button>
              <button 
                className="button secondary-button"
                onClick={() => window.print()}
              >
                <i className="fas fa-print"></i> Imprimir
              </button>
            </div>
          </div>
          
          <div className="ruta-steps">
            {rutaGenerada.map((paso, index) => (
              <div key={index} className={`ruta-step ${paso.tipo} ${paso.visitadoHoy ? 'visitado' : ''}`}>
                {paso.tipo === 'zona' ? (
                  <div className="zona-separator">
                    <i className="fas fa-car"></i>
                    <div className="zona-info">
                      <span>{paso.nombre}</span>
                      <small>{paso.info}</small>
                    </div>
                  </div>
                ) : (
                  <div className="cliente-step">
                    <div className="step-number">{index}.</div>
                    <div className="step-info">
                      <h4>
                        {paso.nombre}
                        {paso.visitadoHoy && (
                          <span className="step-visitado">
                            <i className="fas fa-check"></i> Visitado
                          </span>
                        )}
                      </h4>
                      <p>{paso.direccion}</p>
                      <div className="step-details">
                        <span>Deuda: {formatMoneda(paso.totalDeuda)}</span>
                        <span className={`prioridad ${paso.nivelPrioridad.toLowerCase()}`}>
                          {paso.nivelPrioridad}
                        </span>
                        <span>Facturas: {paso.facturasPendientes.length}</span>
                      </div>
                    </div>
                    <div className="step-actions">
                      <button 
                        className="button micro-button info-button"
                        onClick={() => verFacturasCliente(paso)}
                      >
                        <i className="fas fa-file-invoice"></i>
                      </button>
                      <button 
                        className={`button micro-button ${paso.visitadoHoy ? 'secondary-button' : 'primary-button'}`}
                        onClick={() => marcarComoVisitado(paso)}
                        disabled={paso.visitadoHoy}
                      >
                        <i className={`fas ${paso.visitadoHoy ? 'fa-check' : 'fa-user-check'}`}></i>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="ruta-resumen">
            <h4>Resumen de la Ruta</h4>
            <div className="resumen-stats">
              <div className="resumen-item">
                <span>Total Paradas:</span>
                <strong>{rutaGenerada.filter(p => p.tipo === 'cliente').length}</strong>
              </div>
              <div className="resumen-item">
                <span>Deuda a Recuperar:</span>
                <strong>
                  {formatMoneda(
                    rutaGenerada
                      .filter(p => p.tipo === 'cliente')
                      .reduce((sum, c) => sum + c.totalDeuda, 0)
                  )}
                </strong>
              </div>
              <div className="resumen-item">
                <span>Clientes Visitados:</span>
                <strong>
                  {rutaGenerada
                    .filter(p => p.tipo === 'cliente' && p.visitadoHoy)
                    .length}
                </strong>
              </div>
              <div className="resumen-item">
                <span>Zonas a Visitar:</span>
                <strong>
                  {new Set(rutaGenerada.filter(p => p.tipo === 'zona').map(z => z.nombre)).size}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RutasCobro;