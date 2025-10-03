import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './GestionPedidos.css';

const GestionPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [preparaciones, setPreparaciones] = useState({});
  const [modalVerificacion, setModalVerificacion] = useState(null);

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado]);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      let query = supabase.from('pedidos').select('*').order('fecha_creacion', { ascending: false });

      if (filtroEstado !== 'todos') {
        query = query.eq('estado', filtroEstado);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setPedidos(data || []);
      await cargarEstadosPreparacion(data || []);
    } catch (error) {
      console.error('Error cargando pedidos:', error);
    } finally {
      setCargando(false);
    }
  };

  const cargarEstadosPreparacion = async (pedidosData) => {
    if (!pedidosData?.length) {
      setPreparaciones({});
      return;
    }

    try {
      const pedidoIds = pedidosData.map(p => p.id);
      const { data, error } = await supabase
        .from('preparaciones_pedidos')
        .select('*')
        .in('pedido_id', pedidoIds);

      if (error) throw error;

      const preparacionesInicial = {};
      pedidosData.forEach(pedido => {
        const prep = data?.find(p => p.pedido_id === pedido.id);
        const productosPreparados = prep?.productos_preparados || {};
        
        if (pedido.productos && Object.keys(productosPreparados).length === 0) {
          pedido.productos.forEach((_, index) => {
            productosPreparados[index] = false;
          });
        }

        preparacionesInicial[pedido.id] = {
          productos: productosPreparados,
          productos_faltantes: prep?.productos_faltantes || {},
          empaquetado: prep?.empaquetado || false,
          verificado: prep?.verificado || false,
          observaciones_verificacion: prep?.observaciones_verificacion || '',
          fecha_actualizacion: prep?.fecha_actualizacion || null
        };
      });

      setPreparaciones(preparacionesInicial);
    } catch (error) {
      console.error('Error cargando preparaciones:', error);
      const preparacionesInicial = {};
      pedidosData.forEach(pedido => {
        const productosPreparados = {};
        if (pedido.productos) {
          pedido.productos.forEach((_, index) => {
            productosPreparados[index] = false;
          });
        }
        preparacionesInicial[pedido.id] = {
          productos: productosPreparados,
          productos_faltantes: {},
          empaquetado: false,
          verificado: false,
          observaciones_verificacion: '',
          fecha_actualizacion: null
        };
      });
      setPreparaciones(preparacionesInicial);
    }
  };

  const guardarEstadoPreparacion = async (pedidoId, nuevosDatos) => {
    try {
      const { error } = await supabase
        .from('preparaciones_pedidos')
        .upsert({
          pedido_id: pedidoId,
          ...nuevosDatos,
          fecha_actualizacion: new Date().toISOString()
        }, { onConflict: 'pedido_id' });

      if (error) throw error;
    } catch (error) {
      console.error('Error guardando preparación:', error);
    }
  };

  const marcarProductoPreparado = async (pedidoId, productoIndex) => {
    const prepActual = preparaciones[pedidoId] || {
      productos: {}, productos_faltantes: {}, empaquetado: false, verificado: false, observaciones_verificacion: ''
    };

    const nuevosProductos = {
      ...prepActual.productos,
      [productoIndex]: !prepActual.productos[productoIndex]
    };

    const nuevoEstado = {
      ...prepActual,
      productos: nuevosProductos,
      empaquetado: !prepActual.productos[productoIndex] ? false : prepActual.empaquetado,
      verificado: !prepActual.productos[productoIndex] ? false : prepActual.verificado
    };

    setPreparaciones(prev => ({ ...prev, [pedidoId]: nuevoEstado }));
    await guardarEstadoPreparacion(pedidoId, nuevoEstado);
  };

  const marcarEmpaquetado = async (pedidoId) => {
    const prepActual = preparaciones[pedidoId] || {
      productos: {}, productos_faltantes: {}, empaquetado: false, verificado: false, observaciones_verificacion: ''
    };

    const nuevoEstado = {
      ...prepActual,
      empaquetado: !prepActual.empaquetado,
      verificado: !prepActual.empaquetado ? false : prepActual.verificado
    };

    setPreparaciones(prev => ({ ...prev, [pedidoId]: nuevoEstado }));
    await guardarEstadoPreparacion(pedidoId, nuevoEstado);
  };

  const abrirModalVerificacion = (pedidoId) => {
    const tieneFaltantes = cantidadFaltantes(pedidoId) > 0;
    const observacionesActuales = preparaciones[pedidoId]?.observaciones_verificacion || '';
    setModalVerificacion({ 
      pedidoId, 
      tieneFaltantes, 
      observaciones: observacionesActuales 
    });
  };

  const marcarVerificado = async (pedidoId, observaciones = '') => {
    const prepActual = preparaciones[pedidoId] || {
      productos: {}, productos_faltantes: {}, empaquetado: false, verificado: false, observaciones_verificacion: ''
    };

    const nuevoEstado = {
      ...prepActual,
      verificado: !prepActual.verificado,
      observaciones_verificacion: observaciones
    };

    setPreparaciones(prev => ({ ...prev, [pedidoId]: nuevoEstado }));
    await guardarEstadoPreparacion(pedidoId, nuevoEstado);
    setModalVerificacion(null);
  };

  const actualizarEstadoPedido = async (id, nuevoEstado) => {
    try {
      const { error } = await supabase
        .from('pedidos')
        .update({ 
          estado: nuevoEstado,
          fecha_actualizacion: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      if (nuevoEstado === 'entregado') {
        const prepActual = preparaciones[id] || {
          productos: {}, productos_faltantes: {}, empaquetado: false, verificado: false, observaciones_verificacion: ''
        };
        
        const productosCompletados = {};
        Object.keys(prepActual.productos).forEach(key => {
          productosCompletados[key] = true;
        });
        
        const nuevoEstadoPreparacion = {
          productos: productosCompletados,
          empaquetado: true,
          verificado: true
        };
        
        setPreparaciones(prev => ({ ...prev, [id]: nuevoEstadoPreparacion }));
        await guardarEstadoPreparacion(id, nuevoEstadoPreparacion);
      }
      
      cargarPedidos();
    } catch (error) {
      console.error('Error actualizando pedido:', error);
    }
  };

  const calcularProgreso = (pedidoId) => {
    const prep = preparaciones[pedidoId];
    if (!prep?.productos) return 0;
    const total = Object.keys(prep.productos).length;
    if (total === 0) return 0;
    const preparados = Object.values(prep.productos).filter(Boolean).length;
    return (preparados / total) * 100;
  };

  const calcularProgresoGlobal = (pedido) => {
    const progresoPreparacion = calcularProgreso(pedido.id);
    const prep = preparaciones[pedido.id];
    
    if (pedido.estado === 'cancelado') return 0;
    if (pedido.estado === 'entregado') return 100;
    
    let progreso = 0;
    
    // Base según estado del pedido
    switch (pedido.estado) {
      case 'pendiente': progreso = 25; break;
      case 'en_preparacion': progreso = 50; break;
      case 'listo_para_entrega': progreso = 75; break;
      default: progreso = 0;
    }
    
    // Ajustar según preparación real
    if (pedido.estado === 'en_preparacion') {
      progreso = 50 + (progresoPreparacion * 0.3); // 50-80% según preparación
      if (prep?.empaquetado) progreso = 85;
      if (prep?.verificado) progreso = 95;
    }
    
    return Math.min(100, Math.max(0, progreso));
  };

  const getColorProgreso = (pedido) => {
    const progreso = calcularProgresoGlobal(pedido);
    
    if (pedido.estado === 'cancelado') return '#6c757d';
    if (progreso >= 100) return '#28a745';
    if (progreso >= 75) return '#17a2b8';
    if (progreso >= 50) return '#ffc107';
    return '#dc3545';
  };

  const todosProductosProcesados = (pedidoId) => {
    const prep = preparaciones[pedidoId];
    if (!prep?.productos) return false;
    const total = Object.keys(prep.productos).length;
    if (total === 0) return false;
    return Object.values(prep.productos).every(Boolean);
  };

  const cantidadFaltantes = (pedidoId) => {
    const prep = preparaciones[pedidoId];
    return prep?.productos_faltantes ? Object.keys(prep.productos_faltantes).length : 0;
  };

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'No especificada';
    return new Date(fecha).toLocaleString('es-CO');
  };

  const getTextoEstado = (estado) => {
    const estados = {
      pendiente: '⏳ Pendiente',
      en_preparacion: '👨‍🍳 En preparación',
      listo_para_entrega: '📦 Listo para entrega',
      entregado: '🎉 Entregado',
      cancelado: '❌ Cancelado'
    };
    return estados[estado] || estado;
  };

  const ModalVerificacion = () => {
    const [observaciones, setObservaciones] = useState(modalVerificacion?.observaciones || '');
    const pedido = pedidos.find(p => p.id === modalVerificacion?.pedidoId);

    const handleConfirmar = () => {
      if (modalVerificacion.tieneFaltantes && !observaciones.trim()) {
        alert('❌ Debes agregar observaciones cuando hay productos faltantes');
        return;
      }
      
      if (modalVerificacion.tieneFaltantes && observaciones.trim().length < 10) {
        alert('📝 Por favor, describe con más detalle la situación de los productos faltantes (mínimo 10 caracteres)');
        return;
      }
      
      marcarVerificado(modalVerificacion.pedidoId, observaciones.trim());
    };

    if (!modalVerificacion || !pedido) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-verificacion">
          <div className="modal-header">
            <h3>🔍 Verificar Pedido #{pedido.id}</h3>
            <button onClick={() => setModalVerificacion(null)} className="btn-cerrar">×</button>
          </div>
          
          <div className="modal-content">
            <div className="info-pedido-modal">
              <p><strong>Cliente:</strong> {pedido.cliente_nombre}</p>
              <p><strong>Total:</strong> {formatPrecio(pedido.total)}</p>
              <p><strong>Productos:</strong> {pedido.productos?.length || 0} items</p>
            </div>

            {modalVerificacion.tieneFaltantes ? (
              <>
                <div className="alerta-faltantes">
                  <div className="alerta-content">
                    <span>🚨</span>
                    <div>
                      <p>¡Atención! Productos Faltantes</p>
                      <small>Este pedido tiene {cantidadFaltantes(pedido.id)} producto(s) no disponible(s)</small>
                    </div>
                  </div>
                </div>
                
                <div className="campo-observaciones">
                  <label>
                    Observaciones Obligatorias *
                    <span className="requerido"> (mínimo 10 caracteres)</span>
                  </label>
                  <textarea 
                    value={observaciones} 
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Describe detalladamente:
- Qué productos faltan
- Por qué razón
- Cuándo estarán disponibles
- Qué solución propones al cliente"
                    rows="6"
                    className={observaciones.length > 0 && observaciones.length < 10 ? 'incompleto' : ''}
                  />
                  <div className="contador-caracteres">
                    {observaciones.length}/10 caracteres mínimos
                    {observaciones.length >= 10 && <span className="valido"> ✅ Suficiente</span>}
                  </div>
                </div>
              </>
            ) : (
              <div className="confirmacion-normal">
                <div className="alerta-exito">
                  <div className="alerta-content">
                    <span>✅</span>
                    <div>
                      <p>¡Excelente! Todo en orden</p>
                      <small>Todos los productos están disponibles y listos</small>
                    </div>
                  </div>
                </div>
                
                <div className="campo-observaciones">
                  <label>Observaciones Opcionales</label>
                  <textarea 
                    value={observaciones} 
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Puedes agregar observaciones adicionales como:
- Productos con empaque especial
- Instrucciones de entrega
- Comentarios del cliente"
                    rows="4"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button onClick={() => setModalVerificacion(null)} className="btn-cancelar">
              Cancelar
            </button>
            <button 
              onClick={handleConfirmar} 
              className="btn-confirmar"
              disabled={modalVerificacion.tieneFaltantes && observaciones.trim().length < 10}
            >
              {modalVerificacion.tieneFaltantes ? '✅ Verificar con Observaciones' : '✅ Verificar Pedido'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (cargando) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="gestion-pedidos">
      <header className="header-gestion">
        <h1>🏪 Gestión de Pedidos - Distribuciones EBS</h1>
        <p>Sistema de seguimiento y preparación de pedidos</p>
      </header>

      <div className="controles-superiores">
        <div className="filtros">
          <label>Filtrar por estado:</label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todos">📦 Todos los pedidos</option>
            <option value="pendiente">⏳ Pendientes</option>
            <option value="en_preparacion">👨‍🍳 En preparación</option>
            <option value="listo_para_entrega">📦 Listos para entrega</option>
            <option value="entregado">🎉 Entregados</option>
            <option value="cancelado">❌ Cancelados</option>
          </select>
        </div>

        <button onClick={cargarPedidos} className="btn-actualizar">
          🔄 Actualizar
        </button>
      </div>

      <div className="estadisticas-rapidas">
        <div className="estadistica">
          <span className="numero">{pedidos.length}</span>
          <span className="label">Total Pedidos</span>
        </div>
        <div className="estadistica">
          <span className="numero">
            {pedidos.filter(p => p.estado === 'en_preparacion').length}
          </span>
          <span className="label">En Preparación</span>
        </div>
        <div className="estadistica">
          <span className="numero">
            {pedidos.filter(p => p.estado === 'pendiente').length}
          </span>
          <span className="label">Pendientes</span>
        </div>
        <div className="estadistica">
          <span className="numero">
            {pedidos.filter(p => cantidadFaltantes(p.id) > 0).length}
          </span>
          <span className="label">Con Faltantes</span>
        </div>
      </div>

      <div className="lista-pedidos">
        {pedidos.length === 0 ? (
          <div className="no-pedidos">
            <div className="icono-vacio">📭</div>
            <h3>No hay pedidos</h3>
            <p>
              {filtroEstado !== 'todos' 
                ? `No se encontraron pedidos con estado "${getTextoEstado(filtroEstado)}"`
                : 'No hay pedidos registrados en el sistema'
              }
            </p>
          </div>
        ) : (
          pedidos.map(pedido => {
            const progreso = calcularProgresoGlobal(pedido);
            const colorProgreso = getColorProgreso(pedido);
            const progresoPreparacion = calcularProgreso(pedido.id);
            const todosProcesados = todosProductosProcesados(pedido.id);
            const empaquetado = preparaciones[pedido.id]?.empaquetado || false;
            const verificado = preparaciones[pedido.id]?.verificado || false;
            const faltantes = cantidadFaltantes(pedido.id);
            const productosCount = pedido.productos?.length || 0;
            const tieneObservaciones = !!preparaciones[pedido.id]?.observaciones_verificacion;

            return (
              <div key={pedido.id} className={`pedido-card ${pedido.estado} ${verificado ? 'verificado' : ''}`}>
                <div className="pedido-header">
                  <div className="info-principal">
                    <h3>📦 Pedido #{pedido.id}</h3>
                    <span className="fecha-pedido">
                      Creado: {formatFecha(pedido.fecha_creacion)}
                      {pedido.fecha_actualizacion && (
                        <span className="fecha-actualizacion">
                          · Actualizado: {formatFecha(pedido.fecha_actualizacion)}
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <div className="estados-header">
                    <span className={`estado-badge ${pedido.estado}`}>
                      {getTextoEstado(pedido.estado)}
                    </span>
                    <div className="badges-adicionales">
                      {faltantes > 0 && <span className="badge-faltante">🚨 {faltantes} faltante(s)</span>}
                      {tieneObservaciones && <span className="badge-observaciones">📝 Con observaciones</span>}
                    </div>
                  </div>
                </div>

                {/* BARRA DE PROGRESO VISUAL MEJORADA */}
                <div className="progreso-pedido">
                  <div className="progreso-info">
                    <span>Progreso del pedido: <strong>{Math.round(progreso)}%</strong></span>
                    <span className="estado-actual">{getTextoEstado(pedido.estado)}</span>
                  </div>
                  <div className="barra-progreso-container">
                    <div 
                      className="barra-progreso-llenado" 
                      style={{ 
                        width: `${progreso}%`,
                        backgroundColor: colorProgreso
                      }}
                    ></div>
                  </div>
                  <div className="etiquetas-progreso">
                    <span className={`etiqueta ${pedido.estado === 'pendiente' ? 'activa' : ''}`}>
                      Pendiente
                    </span>
                    <span className={`etiqueta ${pedido.estado === 'en_preparacion' ? 'activa' : ''}`}>
                      En Prep.
                    </span>
                    <span className={`etiqueta ${pedido.estado === 'listo_para_entrega' ? 'activa' : ''}`}>
                      Listo
                    </span>
                    <span className={`etiqueta ${pedido.estado === 'entregado' ? 'activa' : ''}`}>
                      Entregado
                    </span>
                  </div>
                  
                  {pedido.estado === 'en_preparacion' && (
                    <div className="progreso-detallado">
                      <div className="progreso-preparacion">
                        <span>Preparación: {Math.round(progresoPreparacion)}%</span>
                        <div className="barra-progreso-preparacion">
                          <div 
                            className="barra-progreso-preparacion-llenado" 
                            style={{ width: `${progresoPreparacion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pedido-info-cliente">
                  <div className="info-cliente">
                    <p><strong>👤 Cliente:</strong> {pedido.cliente_nombre}</p>
                    <p><strong>📞 Teléfono:</strong> {pedido.cliente_telefono}</p>
                    {pedido.direccion_entrega && (
                      <p><strong>📍 Dirección:</strong> {pedido.direccion_entrega}</p>
                    )}
                  </div>
                  <div className="info-total">
                    <span className="total-pedido">{formatPrecio(pedido.total)}</span>
                    {faltantes > 0 && (
                      <span className="info-faltantes-total">Incluye {faltantes} faltante(s)</span>
                    )}
                  </div>
                </div>

                {pedido.cliente_notas && pedido.cliente_notas !== 'Ninguna' && (
                  <div className="notas-cliente">
                    <p><strong>📝 Notas del cliente:</strong> {pedido.cliente_notas}</p>
                  </div>
                )}

                {/* SECCIÓN DE PREPARACIÓN CON BOTONES BONITOS */}
                {pedido.estado === 'en_preparacion' && (
                  <div className="seccion-preparacion">
                    <div className="header-preparacion">
                      <h4>👨‍🍳 Preparación de Productos</h4>
                      <div className="contador-preparacion">
                        <span className="progreso-texto">
                          {Object.values(preparaciones[pedido.id]?.productos || {}).filter(Boolean).length}/{productosCount}
                        </span>
                        <span className="porcentaje-preparacion">{Math.round(progresoPreparacion)}%</span>
                      </div>
                    </div>
                    
                    <div className="barra-progreso-preparacion-global">
                      <div 
                        className="barra-progreso-preparacion-llenado-global"
                        style={{ width: `${progresoPreparacion}%` }}
                      ></div>
                    </div>

                    <div className="productos-pedido">
                      <div className="header-productos">
                        <h5>🛍️ Productos del Pedido ({productosCount})</h5>
                        {faltantes > 0 && (
                          <span className="alert-faltantes-productos">
                            ⚠️ {faltantes} producto(s) faltante(s)
                          </span>
                        )}
                      </div>
                      <div className="lista-productos">
                        {pedido.productos?.map((producto, index) => {
                          const estaPreparado = preparaciones[pedido.id]?.productos?.[index];
                          const esFaltante = preparaciones[pedido.id]?.productos_faltantes?.[index];

                          return (
                            <div 
                              key={index}
                              className={`producto-item ${estaPreparado ? 'preparado' : ''} ${esFaltante ? 'faltante' : ''}`}
                              onClick={() => marcarProductoPreparado(pedido.id, index)}
                            >
                              <div className="producto-info">
                                <span className="cantidad-producto">{producto.cantidad}x</span>
                                <span className="nombre-producto">{producto.nombre}</span>
                                <span className="precio-producto">
                                  {formatPrecio(producto.precio * producto.cantidad)}
                                </span>
                              </div>
                              
                              <div className="estado-producto">
                                {esFaltante ? (
                                  <span className="estado-faltante">🚨 Faltante</span>
                                ) : estaPreparado ? (
                                  <div className="estado-completado">
                                    <span className="check-icon">✓</span>
                                    <span>Listo</span>
                                  </div>
                                ) : (
                                  <div className="estado-pendiente">
                                    <span className="pending-icon">⏳</span>
                                    <span>Pendiente</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* BOTONES BONITOS DE PREPARACIÓN */}
                    <div className="acciones-preparacion-bonitas">
                      <button 
                        className={`btn-preparacion btn-empaquetar ${empaquetado ? 'completado' : ''}`}
                        onClick={() => marcarEmpaquetado(pedido.id)}
                        disabled={!todosProcesados}
                      >
                        <span className="btn-icon">📦</span>
                        <span className="btn-text">
                          {empaquetado ? 'Empaquetado' : 'Marcar como Empaquetado'}
                        </span>
                        {empaquetado && <span className="btn-check">✓</span>}
                      </button>
                      
                      <button 
                        className={`btn-preparacion btn-verificar ${verificado ? 'completado' : ''}`}
                        onClick={() => abrirModalVerificacion(pedido.id)}
                        disabled={!empaquetado}
                      >
                        <span className="btn-icon">🔍</span>
                        <span className="btn-text">
                          {verificado ? 'Verificado' : 'Verificar Pedido'}
                        </span>
                        {verificado && <span className="btn-check">✓</span>}
                      </button>
                    </div>

                    {verificado && tieneObservaciones && (
                      <div className="observaciones-verificacion">
                        <div className="observaciones-header">
                          <span>📝 Observaciones de Verificación</span>
                          <small>{formatFecha(preparaciones[pedido.id]?.fecha_actualizacion)}</small>
                        </div>
                        <div className="observaciones-content">
                          <p>{preparaciones[pedido.id]?.observaciones_verificacion}</p>
                        </div>
                        {faltantes > 0 && (
                          <div className="info-faltantes-verificacion">
                            <span>🚨 Se verificó con {faltantes} producto(s) faltante(s)</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* VISTA SIMPLIFICADA PARA OTROS ESTADOS */}
                {pedido.estado !== 'en_preparacion' && (
                  <div className="productos-pedido">
                    <div className="header-productos">
                      <h4>🛍️ Productos del Pedido ({productosCount})</h4>
                      {faltantes > 0 && (
                        <span className="alert-faltantes-productos">
                          ⚠️ {faltantes} producto(s) faltante(s)
                        </span>
                      )}
                    </div>
                    <div className="lista-productos">
                      {pedido.productos?.map((producto, index) => {
                        const estaPreparado = preparaciones[pedido.id]?.productos?.[index];
                        const esFaltante = preparaciones[pedido.id]?.productos_faltantes?.[index];

                        return (
                          <div 
                            key={index}
                            className={`producto-item-simple ${estaPreparado ? 'preparado' : ''} ${esFaltante ? 'faltante' : ''}`}
                          >
                            <div className="producto-info">
                              <span className="cantidad-producto">{producto.cantidad}x</span>
                              <span className="nombre-producto">{producto.nombre}</span>
                              <span className="precio-producto">
                                {formatPrecio(producto.precio * producto.cantidad)}
                              </span>
                            </div>
                            
                            <div className="estado-producto-simple">
                              {esFaltante ? (
                                <span className="estado-faltante-simple">🚨 Faltante</span>
                              ) : estaPreparado ? (
                                <span className="estado-completado-simple">✅ Listo</span>
                              ) : (
                                <span className="estado-pendiente-simple">⏳ Pendiente</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {(pedido.estado === 'listo_para_entrega' || pedido.estado === 'entregado') && 
                 tieneObservaciones && (
                  <div className="observaciones-verificacion historico">
                    <div className="observaciones-header">
                      <span>📋 Historial de Verificación</span>
                      <small>Verificado el: {formatFecha(preparaciones[pedido.id]?.fecha_actualizacion)}</small>
                    </div>
                    <div className="observaciones-content">
                      <p>{preparaciones[pedido.id]?.observaciones_verificacion}</p>
                    </div>
                    {faltantes > 0 && (
                      <div className="info-faltantes-verificacion">
                        <span>⚠️ Este pedido se entregó con {faltantes} producto(s) faltante(s)</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="panel-control-pedido">
                  <div className="control-estado">
                    <label>Cambiar estado del pedido:</label>
                    <select 
                      value={pedido.estado} 
                      onChange={(e) => actualizarEstadoPedido(pedido.id, e.target.value)}
                    >
                      <option value="pendiente">⏳ Pendiente</option>
                      <option value="en_preparacion">👨‍🍳 En preparación</option>
                      <option 
                        value="listo_para_entrega" 
                        disabled={pedido.estado === 'en_preparacion' && !verificado}
                      >
                        📦 Listo para entrega
                      </option>
                      <option value="entregado">🎉 Entregado</option>
                      <option value="cancelado">❌ Cancelado</option>
                    </select>
                  </div>
                  
                  <div className="acciones-comunicacion">
                    <a 
                      href={`https://wa.me/${pedido.cliente_telefono}?text=Hola ${encodeURIComponent(pedido.cliente_nombre)}, soy de Distribuciones EBS. Tu pedido #${pedido.id} (${formatPrecio(pedido.total)}) está: ${getTextoEstado(pedido.estado)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-whatsapp"
                    >
                      📱 Contactar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {modalVerificacion && <ModalVerificacion />}
    </div>
  );
};

export default GestionPedidos;