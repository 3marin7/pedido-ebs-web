import React, { useState, useEffect } from 'react';
import './ContabilidadScreen.css';

const ContabilidadScreen = () => {
  const [fechaCorte, setFechaCorte] = useState('2025-10-30');
  const [clienteSeleccionado, setClienteSeleccionado] = useState('todos');
  const [tipoReporte, setTipoReporte] = useState('cartera');
  const [datosContabilidad, setDatosContabilidad] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('cartera');
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  
  // Estados para el formulario de nuevo registro
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nuevoRegistro, setNuevoRegistro] = useState({
    distribuidora: '',
    cliente: '',
    nit: '',
    refDoc: '',
    clase: 'Factura',
    fechaBase: '',
    fechaPago: '',
    importe: '',
    descuento: '',
    basePP: ''
  });
  const [editandoRegistro, setEditandoRegistro] = useState(null);

  // Datos de ejemplo expandidos
  const datosEjemplo = {
    reporteCartera: [
      {
        id: 1,
        distribuidora: "DISTRIBUIDORA FARMACEUTICA ROMA",
        cliente: "BERNAL DELGADILLO CAROLINA | SUPER VILLA JAVIER",
        nit: "10231877",
        documentos: [
          {
            id: 1,
            refDoc: "500787688",
            clase: "RV",
            fechaBase: "23/09/2025",
            fechaPago: "07/11/2025",
            demora: -15,
            importe: 35806685,
            basePP: 43806685,
            descuento: 4380669,
            aPagar: 31426017,
            estado: "pendiente"
          },
          {
            id: 2,
            refDoc: "4400077966",
            clase: "NC",
            fechaBase: "",
            fechaPago: "",
            demora: "",
            importe: -12861150,
            basePP: "",
            descuento: "",
            aPagar: -12861150,
            estado: "pagado"
          }
        ],
        total: 18854646
      },
      {
        id: 2,
        distribuidora: "GAIACORP S.A.S.",
        cliente: "GAIACORP S.A.S. SUCURSAL BOGOTA",
        nit: "52469246",
        documentos: [
          {
            id: 3,
            refDoc: "500787689",
            clase: "Factura",
            fechaBase: "20/10/2025",
            fechaPago: "05/11/2025",
            demora: -10,
            importe: 25000000,
            basePP: 25000000,
            descuento: 1250000,
            aPagar: 23750000,
            estado: "pendiente"
          }
        ],
        total: 23750000
      }
    ],
    clientes: [
      { id: 'todos', nombre: 'Todos los clientes' },
      { id: '10231877', nombre: 'DISTRIBUIDORA FARMACEUTICA ROMA' },
      { id: '52469246', nombre: 'GAIACORP S.A.S.' }
    ],
    pagosMensuales: [
      { mes: 0, anio: 2025, totalPagado: 45000000, totalPendiente: 25000000, documentosPagados: 45, documentosPendientes: 12 },
      { mes: 1, anio: 2025, totalPagado: 52000000, totalPendiente: 18000000, documentosPagados: 52, documentosPendientes: 8 },
    ],
    metricasDashboard: {
      carteraTotal: 38681580.66,
      clientesActivos: 12,
      documentosPendientes: 47,
      promedioDemora: -15,
      moraCritica: 8,
      moraAlerta: 12,
      moraNormal: 27,
      eficienciaCobro: 78.5
    }
  };

  useEffect(() => {
    setCargando(true);
    const timer = setTimeout(() => {
      setDatosContabilidad(datosEjemplo);
      setCargando(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Funciones para manejar el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoRegistro(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularAPagar = () => {
    const importe = parseFloat(nuevoRegistro.importe) || 0;
    const descuento = parseFloat(nuevoRegistro.descuento) || 0;
    return importe - descuento;
  };

  const calcularDemora = (fechaBase, fechaPago) => {
    if (!fechaBase || !fechaPago) return 0;
    
    try {
      const [diaBase, mesBase, anioBase] = fechaBase.split('/');
      const [diaPago, mesPago, anioPago] = fechaPago.split('/');
      
      const base = new Date(anioBase, mesBase - 1, diaBase);
      const pago = new Date(anioPago, mesPago - 1, diaPago);
      const hoy = new Date();
      
      const diffTime = pago.getTime() - hoy.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  const validarCamposObligatorios = () => {
    const { distribuidora, cliente, nit, refDoc } = nuevoRegistro;
    return distribuidora.trim() && cliente.trim() && nit.trim() && refDoc.trim();
  };

  const agregarNuevoRegistro = () => {
    if (!validarCamposObligatorios()) {
      alert('Por favor complete los campos obligatorios: Distribuidora, Cliente, NIT y REF DOC');
      return;
    }

    const aPagar = calcularAPagar();
    const fechaBaseFormateada = nuevoRegistro.fechaBase ? 
      new Date(nuevoRegistro.fechaBase).toLocaleDateString('es-CO') : '';
    const fechaPagoFormateada = nuevoRegistro.fechaPago ? 
      new Date(nuevoRegistro.fechaPago).toLocaleDateString('es-CO') : '';
    
    const demora = calcularDemora(fechaBaseFormateada, fechaPagoFormateada);

    // Crear nuevo documento
    const nuevoDocumento = {
      id: Date.now(),
      refDoc: nuevoRegistro.refDoc,
      clase: nuevoRegistro.clase,
      fechaBase: fechaBaseFormateada,
      fechaPago: fechaPagoFormateada,
      demora: demora,
      importe: parseFloat(nuevoRegistro.importe) || 0,
      basePP: nuevoRegistro.basePP ? parseFloat(nuevoRegistro.basePP) : 0,
      descuento: parseFloat(nuevoRegistro.descuento) || 0,
      aPagar: aPagar,
      estado: aPagar > 0 ? 'pendiente' : 'pagado'
    };

    setDatosContabilidad(prev => {
      if (!prev) return prev;
      
      const nuevoEstado = JSON.parse(JSON.stringify(prev));
      
      // Buscar si el cliente ya existe
      const clienteExistente = nuevoEstado.reporteCartera.find(cliente => cliente.nit === nuevoRegistro.nit);
      
      if (clienteExistente) {
        // Agregar documento al cliente existente
        clienteExistente.documentos.push(nuevoDocumento);
        clienteExistente.total += aPagar;
      } else {
        // Crear nuevo cliente
        const nuevoCliente = {
          id: Date.now() + 1,
          distribuidora: nuevoRegistro.distribuidora,
          cliente: nuevoRegistro.cliente,
          nit: nuevoRegistro.nit,
          documentos: [nuevoDocumento],
          total: aPagar
        };
        nuevoEstado.reporteCartera.push(nuevoCliente);
        
        // Agregar a la lista de clientes para filtros
        if (!nuevoEstado.clientes.find(c => c.id === nuevoRegistro.nit)) {
          nuevoEstado.clientes.push({
            id: nuevoRegistro.nit,
            nombre: nuevoRegistro.distribuidora
          });
        }
      }

      return nuevoEstado;
    });

    limpiarFormulario();
    alert('Registro agregado exitosamente!');
  };

  const editarRegistro = (documento, cliente) => {
    setEditandoRegistro({ documento, cliente });
    setNuevoRegistro({
      distribuidora: cliente.distribuidora,
      cliente: cliente.cliente,
      nit: cliente.nit,
      refDoc: documento.refDoc,
      clase: documento.clase,
      fechaBase: convertirFechaParaInput(documento.fechaBase),
      fechaPago: convertirFechaParaInput(documento.fechaPago),
      importe: documento.importe.toString(),
      descuento: documento.descuento.toString(),
      basePP: documento.basePP ? documento.basePP.toString() : ''
    });
    setMostrarFormulario(true);
  };

  const actualizarRegistro = () => {
    if (!editandoRegistro || !datosContabilidad) return;

    const aPagar = calcularAPagar();
    const fechaBaseFormateada = nuevoRegistro.fechaBase ? 
      new Date(nuevoRegistro.fechaBase).toLocaleDateString('es-CO') : '';
    const fechaPagoFormateada = nuevoRegistro.fechaPago ? 
      new Date(nuevoRegistro.fechaPago).toLocaleDateString('es-CO') : '';
    
    const demora = calcularDemora(fechaBaseFormateada, fechaPagoFormateada);

    setDatosContabilidad(prev => {
      const nuevoEstado = JSON.parse(JSON.stringify(prev));
      const cliente = nuevoEstado.reporteCartera.find(c => c.nit === editandoRegistro.cliente.nit);
      
      if (cliente) {
        const documentoIndex = cliente.documentos.findIndex(d => d.id === editandoRegistro.documento.id);
        if (documentoIndex !== -1) {
          // Restar el valor anterior del total
          cliente.total -= cliente.documentos[documentoIndex].aPagar;
          
          // Actualizar documento
          cliente.documentos[documentoIndex] = {
            ...cliente.documentos[documentoIndex],
            refDoc: nuevoRegistro.refDoc,
            clase: nuevoRegistro.clase,
            fechaBase: fechaBaseFormateada,
            fechaPago: fechaPagoFormateada,
            demora: demora,
            importe: parseFloat(nuevoRegistro.importe) || 0,
            basePP: nuevoRegistro.basePP ? parseFloat(nuevoRegistro.basePP) : 0,
            descuento: parseFloat(nuevoRegistro.descuento) || 0,
            aPagar: aPagar,
            estado: aPagar > 0 ? 'pendiente' : 'pagado'
          };
          
          // Sumar el nuevo valor al total
          cliente.total += aPagar;
        }
      }

      return nuevoEstado;
    });

    limpiarFormulario();
    alert('Registro actualizado exitosamente!');
  };

  const eliminarRegistro = (documentoId, clienteNit) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este documento?')) {
      return;
    }

    setDatosContabilidad(prev => {
      if (!prev) return prev;
      
      const nuevoEstado = JSON.parse(JSON.stringify(prev));
      const cliente = nuevoEstado.reporteCartera.find(c => c.nit === clienteNit);
      
      if (cliente) {
        const documentoIndex = cliente.documentos.findIndex(d => d.id === documentoId);
        if (documentoIndex !== -1) {
          // Restar del total
          cliente.total -= cliente.documentos[documentoIndex].aPagar;
          // Eliminar documento
          cliente.documentos.splice(documentoIndex, 1);
          
          // Si el cliente no tiene más documentos, eliminarlo
          if (cliente.documentos.length === 0) {
            nuevoEstado.reporteCartera = nuevoEstado.reporteCartera.filter(c => c.nit !== clienteNit);
            nuevoEstado.clientes = nuevoEstado.clientes.filter(c => c.id !== clienteNit);
          }
        }
      }

      return nuevoEstado;
    });

    alert('Documento eliminado exitosamente!');
  };

  const convertirFechaParaInput = (fechaString) => {
    if (!fechaString) return '';
    const partes = fechaString.split('/');
    if (partes.length === 3) {
      return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }
    return '';
  };

  const limpiarFormulario = () => {
    setNuevoRegistro({
      distribuidora: '',
      cliente: '',
      nit: '',
      refDoc: '',
      clase: 'Factura',
      fechaBase: '',
      fechaPago: '',
      importe: '',
      descuento: '',
      basePP: ''
    });
    setEditandoRegistro(null);
    setMostrarFormulario(false);
  };

  const aplicarFiltros = () => {
    setCargando(true);
    setTimeout(() => setCargando(false), 800);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getColorDemora = (demora) => {
    if (demora === '' || demora === null || demora === undefined) return '';
    if (demora >= 0) return 'demora-positiva';
    if (demora < -30) return 'demora-critica';
    if (demora < -15) return 'demora-alerta';
    return 'demora-normal';
  };

  const getTotalCartera = () => {
    if (!datosContabilidad?.reporteCartera) return 0;
    return datosContabilidad.reporteCartera.reduce((sum, cliente) => sum + cliente.total, 0);
  };

  const getTotalDocumentos = () => {
    if (!datosContabilidad?.reporteCartera) return 0;
    return datosContabilidad.reporteCartera.reduce((sum, cliente) => sum + cliente.documentos.length, 0);
  };

  if (!datosContabilidad) {
    return (
      <div className="contabilidad-container">
        <div className="contabilidad-header">
          <h1>Cargando información contable...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`contabilidad-container ${cargando ? 'loading' : ''}`}>
      {/* Header */}
      <div className="contabilidad-header">
        <h1>📊 Sistema de Gestión de Cartera</h1>
        <p>Dashboard, reportes de cartera y análisis de pagos mensuales</p>
      </div>

      {/* Botones de Acción Principales */}
      <div className="acciones-principales">
        <button 
          className="btn btn-success" 
          onClick={() => {
            setEditandoRegistro(null);
            setMostrarFormulario(true);
          }}
        >
          ➕ Agregar Registro
        </button>
        <button className="btn btn-primary" onClick={aplicarFiltros}>
          🔄 Actualizar Datos
        </button>
      </div>

      {/* Formulario para Nuevo Registro */}
      {mostrarFormulario && (
        <div className="formulario-nuevo-registro">
          <div className="formulario-header">
            <h3>{editandoRegistro ? '✏️ Editar Registro' : '➕ Agregar Nuevo Registro'}</h3>
            <button 
              className="btn-cerrar"
              onClick={limpiarFormulario}
            >
              ×
            </button>
          </div>
          
          <div className="formulario-grid">
            <div className="form-group">
              <label>Distribuidora *</label>
              <input
                type="text"
                name="distribuidora"
                value={nuevoRegistro.distribuidora}
                onChange={handleInputChange}
                placeholder="Ej: DISTRIBUIDORA FARMACEUTICA ROMA"
              />
            </div>
            
            <div className="form-group">
              <label>Cliente *</label>
              <input
                type="text"
                name="cliente"
                value={nuevoRegistro.cliente}
                onChange={handleInputChange}
                placeholder="Ej: BERNAL DELGADILLO CAROLINA"
              />
            </div>
            
            <div className="form-group">
              <label>NIT *</label>
              <input
                type="text"
                name="nit"
                value={nuevoRegistro.nit}
                onChange={handleInputChange}
                placeholder="Ej: 10231877"
              />
            </div>
            
            <div className="form-group">
              <label>REF DOC *</label>
              <input
                type="text"
                name="refDoc"
                value={nuevoRegistro.refDoc}
                onChange={handleInputChange}
                placeholder="Ej: AXBF519986"
              />
            </div>
            
            <div className="form-group">
              <label>Clase</label>
              <select
                name="clase"
                value={nuevoRegistro.clase}
                onChange={handleInputChange}
              >
                <option value="Factura">Factura</option>
                <option value="RV">RV</option>
                <option value="NC">NC</option>
                <option value="ND">ND</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Fecha Base</label>
              <input
                type="date"
                name="fechaBase"
                value={nuevoRegistro.fechaBase}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label>Fecha Pago</label>
              <input
                type="date"
                name="fechaPago"
                value={nuevoRegistro.fechaPago}
                onChange={handleInputChange}
              />
            </div>
            
            <div className="form-group">
              <label>Importe</label>
              <input
                type="number"
                name="importe"
                value={nuevoRegistro.importe}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>Descuento</label>
              <input
                type="number"
                name="descuento"
                value={nuevoRegistro.descuento}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>Base PP</label>
              <input
                type="number"
                name="basePP"
                value={nuevoRegistro.basePP}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>A Pagar (Calculado)</label>
              <input
                type="text"
                value={formatCurrency(calcularAPagar())}
                disabled
                className="campo-calculado"
              />
            </div>
          </div>
          
          <div className="formulario-acciones">
            <button 
              className="btn btn-success" 
              onClick={editandoRegistro ? actualizarRegistro : agregarNuevoRegistro}
            >
              {editandoRegistro ? '💾 Actualizar Registro' : '💾 Guardar Registro'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={limpiarFormulario}
            >
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Navegación entre vistas */}
      <div className="navegacion-vistas">
        <button 
          className={`btn-vista ${vistaActiva === 'dashboard' ? 'active' : ''}`}
          onClick={() => setVistaActiva('dashboard')}
        >
          📈 Dashboard
        </button>
        <button 
          className={`btn-vista ${vistaActiva === 'cartera' ? 'active' : ''}`}
          onClick={() => setVistaActiva('cartera')}
        >
          📋 Estado de Cartera
        </button>
      </div>

      {vistaActiva === 'dashboard' ? (
        <div className="dashboard-container">
          <h2>📊 Dashboard de Cartera</h2>
          <div className="metricas-grid">
            <div className="metrica-card">
              <h3>Total Cartera</h3>
              <p className="metrica-valor">{formatCurrency(getTotalCartera())}</p>
            </div>
            <div className="metrica-card">
              <h3>Clientes Activos</h3>
              <p className="metrica-valor">{datosContabilidad.reporteCartera.length}</p>
            </div>
            <div className="metrica-card">
              <h3>Documentos Totales</h3>
              <p className="metrica-valor">{getTotalDocumentos()}</p>
            </div>
            <div className="metrica-card">
              <h3>Eficiencia de Cobro</h3>
              <p className="metrica-valor">{datosContabilidad.metricasDashboard.eficienciaCobro}%</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Filtros */}
          <div className="filtros-section">
            <h3>Filtrar Reportes</h3>
            <div className="filtros-grid">
              <div className="form-group">
                <label>Fecha de Corte:</label>
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Cliente:</label>
                <select
                  value={clienteSeleccionado}
                  onChange={(e) => setClienteSeleccionado(e.target.value)}
                >
                  {datosContabilidad.clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label>Tipo de Reporte:</label>
                <select
                  value={tipoReporte}
                  onChange={(e) => setTipoReporte(e.target.value)}
                >
                  <option value="cartera">Estado de Cartera</option>
                  <option value="antiguedad">Antigüedad de Saldos</option>
                  <option value="vencidos">Documentos Vencidos</option>
                </select>
              </div>
              
              <button className="btn btn-primary" onClick={aplicarFiltros}>
                🔍 Generar Reporte
              </button>
            </div>
          </div>

          {/* Reportes de Cartera */}
          <div className="reportes-cartera">
            {datosContabilidad.reporteCartera.map((cliente) => (
              <div key={cliente.id} className="cliente-reporte">
                <div className="cliente-header">
                  <div className="cliente-info">
                    <h2>{cliente.distribuidora}</h2>
                    <p>{cliente.cliente}</p>
                  </div>
                  <div className="cliente-nit">
                    <strong>NIT: {cliente.nit}</strong>
                    <span className="total-cliente">{formatCurrency(cliente.total)}</span>
                  </div>
                </div>

                <div className="tabla-container">
                  <table className="data-table cartera-table">
                    <thead>
                      <tr>
                        <th>REF DOC</th>
                        <th>CLASE</th>
                        <th>FH BASE</th>
                        <th>FH PAGO</th>
                        <th>DEMORA</th>
                        <th>IMPORTE</th>
                        <th>BASE PP</th>
                        <th>DESCUENTO</th>
                        <th>A PAGAR</th>
                        <th>ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cliente.documentos.map((doc, index) => (
                        <tr key={doc.id || index}>
                          <td className="ref-doc">{doc.refDoc}</td>
                          <td className="clase-doc">{doc.clase}</td>
                          <td>{doc.fechaBase || '-'}</td>
                          <td>{doc.fechaPago || '-'}</td>
                          <td className={`demora ${getColorDemora(doc.demora)}`}>
                            {doc.demora || doc.demora === 0 ? doc.demora : '-'}
                          </td>
                          <td className={doc.importe < 0 ? 'negative' : 'positive'}>
                            {formatCurrency(doc.importe)}
                          </td>
                          <td>{doc.basePP ? formatCurrency(doc.basePP) : '-'}</td>
                          <td>{doc.descuento ? formatCurrency(doc.descuento) : '-'}</td>
                          <td className={doc.aPagar < 0 ? 'negative' : 'positive'}>
                            {formatCurrency(doc.aPagar)}
                          </td>
                          <td>
                            <div className="acciones-tabla">
                              <button 
                                className="btn-editar"
                                onClick={() => editarRegistro(doc, cliente)}
                                title="Editar documento"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-eliminar"
                                onClick={() => eliminarRegistro(doc.id, cliente.nit)}
                                title="Eliminar documento"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="total-row">
                        <td colSpan="8" className="total-label">
                          <strong>TOTAL CLIENTE</strong>
                        </td>
                        <td className="total-amount">
                          <strong>{formatCurrency(cliente.total)}</strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen General */}
          <div className="resumen-general">
            <div className="resumen-card">
              <h3>Resumen General de Cartera</h3>
              <div className="resumen-stats">
                <div className="resumen-stat">
                  <span className="stat-label">Total Cartera:</span>
                  <span className="stat-value">
                    {formatCurrency(getTotalCartera())}
                  </span>
                </div>
                <div className="resumen-stat">
                  <span className="stat-label">Clientes Activos:</span>
                  <span className="stat-value">{datosContabilidad.reporteCartera.length}</span>
                </div>
                <div className="resumen-stat">
                  <span className="stat-label">Documentos Totales:</span>
                  <span className="stat-value">
                    {getTotalDocumentos()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContabilidadScreen;