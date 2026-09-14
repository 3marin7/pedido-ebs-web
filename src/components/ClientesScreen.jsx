import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientesScreen.css';
import { supabase } from './supabaseClient.js';
import * as XLSX from 'xlsx';
import { formatInputDateLocal } from '../lib/dateUtils';

const ClientesScreen = ({ 
  onSeleccionarCliente, 
  onVolver,
  clientes: initialClientes 
}) => {
  const navigate = useNavigate();
  // Estados para clientes
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    correo: '',
    clasificacion: 3,
    centro_comercial: ''
  });
  const [clientes, setClientes] = useState(initialClientes || []);
  const [importandoClientes, setImportandoClientes] = useState(false);
  const [filtroClasificacion, setFiltroClasificacion] = useState(0);
  const [filtroCentroComercial, setFiltroCentroComercial] = useState('');
  const [clienteEditando, setClienteEditando] = useState(null);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [vistaClientes, setVistaClientes] = useState('tarjetas');
  const [mostrarReporteDatos, setMostrarReporteDatos] = useState(false);

  // Cargar clientes al montar el componente
  useEffect(() => {
    cargarClientes();
  }, []);

  // Función para determinar clasificación automática
  const determinarClasificacionAutomatica = async (nombreCliente) => {
    try {
      const { data: facturas, error: facturasError } = await supabase
        .from('facturas')
        .select('*')
        .eq('cliente', nombreCliente);
      
      if (facturasError) {
        console.error('Error al obtener facturas:', facturasError);
        return 3;
      }
      
      if (!facturas || facturas.length === 0) return 3;
      
      const totalGastado = facturas.reduce((sum, f) => sum + (f.total || 0), 0);
      const promedioPorFactura = totalGastado / facturas.length;
      
      // Obtener todas las facturas para calcular frecuencia
      const { data: todasFacturas, error: todasFacturasError } = await supabase
        .from('facturas')
        .select('*');
      
      if (todasFacturasError) {
        console.error('Error al obtener todas las facturas:', todasFacturasError);
        return 3;
      }
      
      const frecuenciaCompras = facturas.length / (todasFacturas?.length || 1);
      
      let puntaje = 3;
      if (totalGastado > 5000000) puntaje += 1;
      if (totalGastado > 10000000) puntaje += 1;
      if (totalGastado < 1000000) puntaje -= 1;
      
      if (promedioPorFactura > 500000) puntaje += 1;
      if (promedioPorFactura < 100000) puntaje -= 1;
      
      if (frecuenciaCompras > 0.5) puntaje += 1;
      if (frecuenciaCompras < 0.1) puntaje -= 1;
      
      return Math.min(Math.max(puntaje, 1), 5);
    } catch (error) {
      console.error('Error calculando clasificación:', error);
      return 3;
    }
  };

  // Cargar clientes desde Supabase
  const cargarClientes = async () => {
    setCargandoClientes(true);
    setError(null);
    try {
      const { data, error: supabaseError } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (supabaseError) {
        throw supabaseError;
      }
      
      setClientes(data || []);
    } catch (error) {
      console.error('Error completo al cargar clientes:', {
        message: error.message,
        details: error.details,
        code: error.code
      });
      setError('Error al cargar clientes. Por favor revisa la consola para más detalles.');
    } finally {
      setCargandoClientes(false);
    }
  };

  // Validar formato de email
  const validarEmail = (email) => {
    if (!email) return true;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  // Validar formato de teléfono
  const validarTelefono = (telefono) => {
    if (!telefono) return true;
    const re = /^[0-9+\- ]+$/;
    return re.test(telefono);
  };

  const limpiarTelefono = (telefono) => {
    if (!telefono) return '';
    return String(telefono).replace(/\D/g, '');
  };

  // Funciones para gestión de clientes
  const iniciarEdicionCliente = (cliente) => {
    setClienteEditando(cliente);
    setNuevoCliente({
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      correo: cliente.correo,
      clasificacion: cliente.clasificacion,
      centro_comercial: cliente.centro_comercial || ''
    });
  };

  const cancelarEdicionCliente = () => {
    setClienteEditando(null);
    setNuevoCliente({
      nombre: '',
      direccion: '',
      telefono: '',
      correo: '',
      clasificacion: 3,
      centro_comercial: ''
    });
    setError(null);
  };

  const guardarCliente = async () => {
    if (!nuevoCliente.nombre) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    // Validaciones
    if (nuevoCliente.correo && !validarEmail(nuevoCliente.correo)) {
      alert('Por favor ingresa un email válido');
      return;
    }

    if (nuevoCliente.telefono && !validarTelefono(nuevoCliente.telefono)) {
      alert('Por favor ingresa un teléfono válido');
      return;
    }

    const telefonoLimpio = limpiarTelefono(nuevoCliente.telefono);

    try {
      if (clienteEditando) {
        // Actualizar cliente existente
        const { error: updateError } = await supabase
          .from('clientes')
          .update({
            nombre: nuevoCliente.nombre,
            direccion: nuevoCliente.direccion,
            telefono: telefonoLimpio,
            correo: nuevoCliente.correo,
            clasificacion: nuevoCliente.clasificacion,
            centro_comercial: nuevoCliente.centro_comercial,
            actualizado_en: new Date().toISOString()
          })
          .eq('id', clienteEditando.id);
        
        if (updateError) throw updateError;
      } else {
        // Verificar si el cliente ya existe
        const { data: clienteExistente, error: searchError } = await supabase
          .from('clientes')
          .select('nombre')
          .ilike('nombre', nuevoCliente.nombre)
          .single();
        
        if (clienteExistente) {
          alert('Ya existe un cliente con ese nombre');
          return;
        }

        // Crear nuevo cliente
        const clasificacion = nuevoCliente.clasificacion || 
          await determinarClasificacionAutomatica(nuevoCliente.nombre);
        
        const { error: insertError } = await supabase
          .from('clientes')
          .insert([{
            nombre: nuevoCliente.nombre,
            direccion: nuevoCliente.direccion,
            telefono: telefonoLimpio,
            correo: nuevoCliente.correo,
            clasificacion: clasificacion,
            centro_comercial: nuevoCliente.centro_comercial
          }]);
        
        if (insertError) throw insertError;
      }
      
      // Actualizar la lista de clientes
      await cargarClientes();
      
      setNuevoCliente({
        nombre: '',
        direccion: '',
        telefono: '',
        correo: '',
        clasificacion: 3
      });
      setClienteEditando(null);
      
      alert('Cliente guardado exitosamente!');
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      alert('Error al guardar cliente: ' + error.message);
    }
  };

  const seleccionarCliente = async (cliente) => {
    // Si ya tiene centro_comercial, pásalo directo
    if (cliente.centro_comercial) {
      onSeleccionarCliente(cliente);
      return;
    }
    // Si no, consulta a la base de datos por código_cliente
    if (cliente.codigo_cliente) {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('codigo_cliente', cliente.codigo_cliente)
        .maybeSingle();
      if (data) {
        onSeleccionarCliente({ ...cliente, ...data });
      } else {
        onSeleccionarCliente(cliente);
      }
    } else {
      onSeleccionarCliente(cliente);
    }
  };

  // Función para manejar el volver
  const manejarVolver = () => {
    // Si está editando un cliente, cancelar la edición primero
    if (clienteEditando) {
      cancelarEdicionCliente();
    } else {
      // Si no está editando, volver directamente
      onVolver();
    }
  };

  // Función para exportar clientes en Excel
  const exportarClientes = () => {
    setError(null);
    try {
      const clientesAExportar = clientesFiltrados.length > 0 ? clientesFiltrados : clientes;

      if (!clientesAExportar || clientesAExportar.length === 0) {
        setError('No hay clientes para exportar');
        return;
      }

      const filasExcel = clientesAExportar.map(cliente => ({
        ID: cliente.id,
        Codigo_Cliente: cliente.codigo_cliente || '',
        Nombre: cliente.nombre || '',
        Telefono: cliente.telefono || '',
        Centro_Comercial: cliente.centro_comercial || '',
        Correo: cliente.correo || '',
        Direccion: cliente.direccion || '',
        Clasificacion: cliente.clasificacion || 3,
        Fecha_Registro: cliente.fecha_registro || '',
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(filasExcel);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

      const fechaArchivo = formatInputDateLocal(new Date());
      XLSX.writeFile(workbook, `clientes_tabla_excel_${fechaArchivo}.xlsx`, {
        bookType: 'xlsx',
      });

      alert(`✅ Se exportaron ${filasExcel.length} clientes a Excel`);
    } catch (error) {
      console.error('Error al exportar clientes:', error);
      setError(`Error al exportar clientes: ${error.message}`);
    }
  };

  // Función para importar clientes
  const importarClientes = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportandoClientes(true);
    setError(null);
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const contenido = e.target.result;
        const datosImportados = JSON.parse(contenido);
        
        if (!datosImportados || !Array.isArray(datosImportados.clientes)) {
          throw new Error("El archivo no tiene el formato correcto. Debe contener un array 'clientes'");
        }
        
        const clientesImportados = datosImportados.clientes;
        
        // Validar y normalizar clientes
        const clientesValidados = clientesImportados.map((cliente, index) => {
          if (!cliente.nombre || !cliente.nombre.toString().trim()) {
            throw new Error(`Cliente en posición ${index} no tiene nombre válido`);
          }
          
          // Validar email si existe
          if (cliente.correo && !validarEmail(cliente.correo.toString())) {
            throw new Error(`Cliente "${cliente.nombre}" tiene un email inválido`);
          }
          
          // Validar teléfono si existe
          if (cliente.telefono && !validarTelefono(cliente.telefono.toString())) {
            throw new Error(`Cliente "${cliente.nombre}" tiene un teléfono inválido`);
          }
          
          let clasificacion = 3;
          if (cliente.clasificacion !== undefined) {
            clasificacion = Math.max(1, Math.min(5, parseInt(cliente.clasificacion) || 3));
          }
          
          return {
            nombre: cliente.nombre.toString().trim(),
            direccion: cliente.direccion ? cliente.direccion.toString().trim() : '',
            telefono: cliente.telefono ? cliente.telefono.toString().trim() : '',
            correo: cliente.correo ? cliente.correo.toString().trim() : '',
            clasificacion: clasificacion,
            centro_comercial: cliente.centro_comercial ? cliente.centro_comercial.toString().trim() : ''
          };
        });
        
        // Verificar duplicados
        const { data: clientesExistentes, error: clientesError } = await supabase
          .from('clientes')
          .select('nombre');
          
        if (clientesError) throw clientesError;
          
        const nombresExistentes = new Set(clientesExistentes.map(c => c.nombre.toLowerCase()));
        const nuevosClientes = clientesValidados.filter(c => 
          !nombresExistentes.has(c.nombre.toLowerCase())
        );
        
        if (nuevosClientes.length === 0) {
          setError('⚠️ Todos los clientes en el archivo ya existen en el sistema');
          return;
        }
        
        const confirmacion = window.confirm(
          `📊 Resumen de Importación:\n\n` +
          `• Clientes en archivo: ${clientesImportados.length}\n` +
          `• Nuevos clientes a importar: ${nuevosClientes.length}\n` +
          `• Clientes duplicados (no se importarán): ${clientesImportados.length - nuevosClientes.length}\n\n` +
          `¿Desea continuar con la importación?`
        );
        
        if (confirmacion) {
          const { error: insertError } = await supabase
            .from('clientes')
            .insert(nuevosClientes);
          
          if (insertError) throw insertError;
          
          await cargarClientes();
          alert(`🎉 Importación completada!\n\nSe agregaron ${nuevosClientes.length} nuevos clientes.`);
        }
      } catch (error) {
        console.error("Error importando clientes:", error);
        setError(`Error al importar: ${error.message}`);
      } finally {
        setImportandoClientes(false);
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      setError("Error al leer el archivo. Asegúrese de seleccionar un archivo JSON válido.");
      setImportandoClientes(false);
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  // Filtros
  const clientesFiltrados = clientes.filter(cliente => {
    const coincideNombre = cliente.nombre.toLowerCase().includes(busquedaCliente.toLowerCase());
    const coincideTelefono = cliente.telefono && cliente.telefono.includes(busquedaCliente);
    const coincideCorreo = cliente.correo && cliente.correo.toLowerCase().includes(busquedaCliente.toLowerCase());
    const coincideCodigo = cliente.codigo_cliente && cliente.codigo_cliente.toLowerCase().includes(busquedaCliente.toLowerCase());
    const coincideClasificacion = filtroClasificacion === 0 || cliente.clasificacion === filtroClasificacion;
    const coincideCentro = !filtroCentroComercial || (cliente.centro_comercial && cliente.centro_comercial === filtroCentroComercial);
    return (coincideNombre || coincideTelefono || coincideCorreo || coincideCodigo) && coincideClasificacion && coincideCentro;
  });

  const reporteDatos = clientes.map((cliente) => {
    const faltantes = [
      !String(cliente.telefono || '').trim() && 'Teléfono',
      !String(cliente.centro_comercial || '').trim() && 'Centro comercial',
      !String(cliente.direccion || '').trim() && 'Dirección',
      !String(cliente.correo || '').trim() && 'Correo'
    ].filter(Boolean);

    return {
      ...cliente,
      faltantes,
      datosCompletos: faltantes.length === 0
    };
  });

  const clientesConDatosFaltantes = reporteDatos.filter((cliente) => !cliente.datosCompletos);

  const exportarReporteDatos = () => {
    if (clientes.length === 0) {
      setError('No hay clientes para generar el reporte');
      return;
    }

    const filasReporte = reporteDatos.map((cliente) => ({
      ID: cliente.id,
      Codigo_Cliente: cliente.codigo_cliente || '',
      Nombre: cliente.nombre || '',
      Telefono: cliente.telefono || '',
      Centro_Comercial: cliente.centro_comercial || '',
      Direccion: cliente.direccion || '',
      Correo: cliente.correo || '',
      Clasificacion: cliente.clasificacion || 3,
      Datos_Completos: cliente.datosCompletos ? 'Sí' : 'No',
      Informacion_Faltante: cliente.faltantes.join(', ')
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(filasReporte);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos faltantes');
    XLSX.writeFile(workbook, `reporte_datos_clientes_${formatInputDateLocal(new Date())}.xlsx`, {
      bookType: 'xlsx'
    });
    alert(`✅ Se generó el reporte de ${filasReporte.length} clientes`);
  };

  const imprimirFormatoActualizacion = () => {
    if (clientes.length === 0) {
      setError('No hay clientes para imprimir');
      return;
    }

    const clientesAImprimir = clientesConDatosFaltantes.length > 0
      ? clientesConDatosFaltantes
      : reporteDatos;
    const escaparHtml = (valor) => String(valor || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    const filas = clientesAImprimir.map((cliente) => `
      <tr>
        <td><strong>${escaparHtml(cliente.nombre)}</strong><br><small>Código: ${escaparHtml(cliente.codigo_cliente || 'Sin código')}</small></td>
        <td>${escaparHtml(cliente.telefono)}</td>
        <td>${escaparHtml(cliente.centro_comercial)}</td>
        <td>${escaparHtml(cliente.direccion)}</td>
        <td>${escaparHtml(cliente.correo)}</td>
        <td class="check"></td>
      </tr>
    `).join('');
    const ventana = window.open('', '_blank', 'noopener,noreferrer');

    if (!ventana) {
      setError('El navegador bloqueó la ventana de impresión. Permite ventanas emergentes e inténtalo nuevamente.');
      return;
    }

    ventana.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Formato de actualización de clientes</title><style>
      @page { size: landscape; margin: 12mm; }
      * { box-sizing: border-box; }
      body { font-family: Arial, sans-serif; color: #172b4d; margin: 0; }
      h1 { font-size: 20px; margin: 0 0 4px; }
      p { margin: 0 0 12px; color: #526581; font-size: 11px; }
      .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #9aa9bc; padding: 7px; vertical-align: top; font-size: 10px; height: 34px; word-wrap: break-word; }
      th { background: #e8eef7; text-align: left; font-size: 10px; }
      th:nth-child(1) { width: 21%; } th:nth-child(2) { width: 14%; } th:nth-child(3) { width: 15%; } th:nth-child(4) { width: 22%; } th:nth-child(5) { width: 20%; } th:nth-child(6) { width: 8%; }
      .check { height: 34px; }
      .footer { margin-top: 10px; font-size: 10px; color: #526581; }
    </style></head><body>
      <h1>Formato de actualización de clientes</h1>
      <p>Completar manualmente los datos faltantes y entregar para actualizar el sistema.</p>
      <div class="meta"><span>Total de registros: ${clientesAImprimir.length}</span><span>Fecha: ${formatInputDateLocal(new Date())}</span></div>
      <table><thead><tr><th>Cliente / código</th><th>Teléfono</th><th>Centro comercial</th><th>Dirección</th><th>Correo</th><th>Revisado</th></tr></thead><tbody>${filas}</tbody></table>
      <div class="footer">Marque “Revisado” cuando la información haya sido confirmada.</div>
    </body></html>`);
    ventana.document.close();
    ventana.focus();
    ventana.print();
  };

  return (
    <div className="clientes-modal">
      <div className="clientes-content">
        <div className="clientes-header">
          <h2>{clienteEditando ? 'Editar Cliente' : 'Seleccionar Cliente'}</h2>
          <button 
            className="button secondary-button"
            onClick={manejarVolver}
          >
            Volver
          </button>
        </div>
        
        {/* Mostrar mensajes de error */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}
        
        <div className="clientes-search">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, código, tel o email..."
            value={busquedaCliente}
            onChange={(e) => setBusquedaCliente(e.target.value)}
          />
        </div>

        <div className="clientes-filters" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <div>
            <label>Filtrar por clasificación:</label>
            <select 
              value={filtroClasificacion} 
              onChange={(e) => setFiltroClasificacion(Number(e.target.value))}
            >
              <option value={0}>Todas</option>
              <option value={1}>1 ★</option>
              <option value={2}>2 ★★</option>
              <option value={3}>3 ★★★</option>
              <option value={4}>4 ★★★★</option>
              <option value={5}>5 ★★★★★</option>
            </select>
          </div>
          <div>
            <label>Filtrar por centro comercial:</label>
            <select
              value={filtroCentroComercial}
              onChange={e => setFiltroCentroComercial(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="CC ferrocarril">CC ferrocarril</option>
              <option value="CC sabana">CC sabana</option>
              <option value="CC parque españa">CC parque españa</option>
              <option value="T&T">T&T</option>
              <option value="Droguerias">Droguerias</option>
            </select>
          </div>
          <div className="clientes-view-toggle" role="group" aria-label="Vista de clientes">
            <button
              type="button"
              className={vistaClientes === 'tarjetas' ? 'active' : ''}
              onClick={() => setVistaClientes('tarjetas')}
              aria-label="Vista de tarjetas"
              aria-pressed={vistaClientes === 'tarjetas'}
            >
              <i className="fas fa-th-large"></i>
              <span>Tarjetas</span>
            </button>
            <button
              type="button"
              className={vistaClientes === 'lista' ? 'active' : ''}
              onClick={() => setVistaClientes('lista')}
              aria-label="Vista de lista"
              aria-pressed={vistaClientes === 'lista'}
            >
              <i className="fas fa-list"></i>
              <span>Lista</span>
            </button>
          </div>
        </div>
        
        {cargandoClientes ? (
          <div className="loading-clientes">
            <p>Cargando clientes...</p>
          </div>
        ) : (
          <>
            {/* Estadísticas en Acordeón */}
            <div className="clientes-stats-collapsible">
              <div 
                className="stats-header"
                onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
              >
                <h4>📊 Estadísticas de Clientes</h4>
                <span className={`toggle-arrow ${mostrarEstadisticas ? 'expanded' : ''}`}>
                  ▼
                </span>
              </div>
              
              {mostrarEstadisticas && (
                <div className="stats-grid">
                  {[5, 4, 3, 2, 1].map(star => (
                    <div key={star} className="stat-item">
                      <span className={`clasificacion-badge clasificacion-${star}`}>
                        {star} {'★'.repeat(star)}
                      </span>
                      <span>
                        {clientes.filter(c => c.clasificacion === star).length} clientes
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {!clienteEditando && (
              <div className={`clientes-list clientes-list--${vistaClientes}`}>
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map(cliente => (
                    <div key={cliente.id} className="clientes-screen-item">
                      <div 
                        className="clientes-screen-info"
                        onClick={() => seleccionarCliente(cliente)}
                      >
                        <h4>{cliente.nombre}</h4>
                        {cliente.codigo_cliente && (
                          <p style={{ fontWeight: 'bold', color: '#555', fontSize: '0.9rem' }}>🆔 Código: {cliente.codigo_cliente}</p>
                        )}
                        <div className={`clasificacion-badge clasificacion-${cliente.clasificacion}`}>
                          {cliente.clasificacion} {'★'.repeat(cliente.clasificacion)}
                        </div>
                        {cliente.telefono && <p>📞 Tel: {cliente.telefono}</p>}
                        {cliente.centro_comercial && <p>🏬 CC: {cliente.centro_comercial}</p>}
                        {cliente.correo && <p>📧 Email: {cliente.correo}</p>}
                        {cliente.direccion && <p>📍 Dir: {cliente.direccion}</p>}
                      </div>
                      <div className="clientes-screen-actions">
                        <button
                          className="button info-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            iniciarEdicionCliente(cliente);
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="button success-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Navegar a CatalogoClientes con datos del cliente
                            navigate(`/catalogo-clientes?cliente=${encodeURIComponent(cliente.nombre)}&telefono=${encodeURIComponent(cliente.telefono || '')}&direccion=${encodeURIComponent(cliente.direccion || '')}&clienteId=${cliente.id}`);
                          }}
                        >
                          🛒 Hacer Pedido
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-clientes">
                    <p>No se encontraron clientes</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
        
        <div className="nuevo-cliente-form">
          <h3>{clienteEditando ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Nombre *</label>
              <input
                type="text"
                value={nuevoCliente.nombre}
                onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={nuevoCliente.telefono}
                onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                placeholder="Ej: +57 1234567890"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Correo</label>
              <input
                type="email"
                value={nuevoCliente.correo}
                onChange={(e) => setNuevoCliente({...nuevoCliente, correo: e.target.value})}
                placeholder="Ej: cliente@ejemplo.com"
              />
            </div>
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={nuevoCliente.direccion}
                onChange={(e) => setNuevoCliente({...nuevoCliente, direccion: e.target.value})}
                placeholder="Opcional"
              />
            </div>
            <div className="form-group">
              <label>Centro Comercial</label>
              <select
                value={nuevoCliente.centro_comercial}
                onChange={e => setNuevoCliente({ ...nuevoCliente, centro_comercial: e.target.value })}
              >
                <option value="">Selecciona una opción</option>
                <option value="CC ferrocarril">CC ferrocarril</option>
                <option value="CC sabana">CC sabana</option>
                <option value="CC parque españa">CC parque españa</option>
                <option value="T&T">T&T</option>
                <option value="Droguerias">Droguerias</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Clasificación (1-5)</label>
              <div className="clasificacion-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star ${star <= nuevoCliente.clasificacion ? 'filled' : ''}`}
                    onClick={() => setNuevoCliente({...nuevoCliente, clasificacion: star})}
                  >
                    ★
                  </span>
                ))}
              </div>
              <div style={{ marginTop: '8px', fontSize: '0.9rem', color: '#666' }}>
                Clasificación seleccionada: {nuevoCliente.clasificacion} estrellas
              </div>
            </div>
          </div>
          
          <div className="form-buttons">
            <button 
              className="button primary-button"
              onClick={guardarCliente}
              disabled={cargandoClientes}
            >
              {clienteEditando ? 'Actualizar Cliente' : 'Guardar Cliente'}
            </button>
            
            {clienteEditando && (
              <button 
                className="button secondary-button"
                onClick={cancelarEdicionCliente}
              >
                Cancelar
              </button>
            )}
          </div>
        </div>

        <div className="clientes-actions">
          <button 
            className="button info-button"
            onClick={exportarClientes}
            disabled={clientes.length === 0 || importandoClientes || cargandoClientes}
          >
            📤 Exportar Clientes (Excel)
            {clientes.length > 0 && (
              <span className="badge-count">{clientes.length}</span>
            )}
          </button>

          <button
            className="button primary-button"
            onClick={() => setMostrarReporteDatos((prev) => !prev)}
            disabled={clientes.length === 0 || importandoClientes || cargandoClientes}
          >
            📋 {mostrarReporteDatos ? 'Ocultar reporte' : 'Reporte datos faltantes'}
          </button>

          <button
            className="button info-button"
            onClick={exportarReporteDatos}
            disabled={clientes.length === 0 || importandoClientes || cargandoClientes}
          >
            📥 Descargar reporte Excel
          </button>

          <button
            className="button secondary-button"
            onClick={imprimirFormatoActualizacion}
            disabled={clientes.length === 0 || importandoClientes || cargandoClientes}
          >
            🖨️ Imprimir formato manual
          </button>
          
          <label 
            htmlFor="importar-clientes" 
            className={`button warning-button ${importandoClientes || cargandoClientes ? 'disabled' : ''}`}
          >
            📥 Importar Clientes
          </label>
          
          <input
            type="file"
            id="importar-clientes"
            accept=".json,application/json"
            onChange={importarClientes}
            disabled={importandoClientes || cargandoClientes}
            style={{ display: 'none' }}
          />
          
          {importandoClientes && (
            <div className="import-progress">
              <div className="spinner"></div>
              <span>Procesando archivo...</span>
            </div>
          )}
        </div>

        {mostrarReporteDatos && (
          <section className="clientes-data-report" aria-label="Reporte de datos faltantes">
            <div className="clientes-data-report-header">
              <div>
                <h3>Reporte de información faltante</h3>
                <p>{clientesConDatosFaltantes.length} de {clientes.length} clientes necesitan actualización.</p>
              </div>
              <div className="clientes-data-report-summary">
                <span>Teléfono: {reporteDatos.filter((cliente) => cliente.faltantes.includes('Teléfono')).length}</span>
                <span>Centro comercial: {reporteDatos.filter((cliente) => cliente.faltantes.includes('Centro comercial')).length}</span>
                <span>Dirección: {reporteDatos.filter((cliente) => cliente.faltantes.includes('Dirección')).length}</span>
                <span>Correo: {reporteDatos.filter((cliente) => cliente.faltantes.includes('Correo')).length}</span>
              </div>
            </div>
            <div className="clientes-data-report-list">
              {clientesConDatosFaltantes.length === 0 ? (
                <p className="clientes-data-report-complete">Todos los clientes tienen la información principal completa.</p>
              ) : (
                clientesConDatosFaltantes.map((cliente) => (
                  <div key={cliente.id} className="clientes-data-report-row">
                    <strong>{cliente.nombre}</strong>
                    <span>{cliente.centro_comercial || 'Sin centro comercial'}</span>
                    <span className="clientes-data-report-missing">Falta: {cliente.faltantes.join(', ')}</span>
                    <button className="button info-button" onClick={() => iniciarEdicionCliente(cliente)}>
                      Editar
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ClientesScreen;