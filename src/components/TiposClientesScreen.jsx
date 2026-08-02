import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import './TiposClientesScreen.css';

export default function TiposClientesScreen() {
  const [tiposClientes, setTiposClientes] = useState([]);
  const [limitesEditar, setLimitesEditar] = useState(null);
  const [formLimites, setFormLimites] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);
  const [tab, setTab] = useState('tipos'); // 'tipos' o 'limites'

  // Cargar tipos de clientes y sus límites
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError(null);

      // Obtener tipos de clientes con sus límites
      const { data, error: err } = await supabase
        .from('tipos_clientes')
        .select(`
          id,
          nombre,
          descripcion,
          activo,
          limites_facturacion (*)
        `)
        .eq('activo', true)
        .order('nombre', { ascending: true });

      if (err) throw err;
      setTiposClientes(data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar datos: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Preparar formulario para editar límites
  const abrirEditorLimites = (tipoCliente) => {
    const limites = tipoCliente.limites_facturacion?.[0] || {};
    setFormLimites({
      tipo_cliente_id: tipoCliente.id,
      tipo_cliente_nombre: tipoCliente.nombre,
      dias_antiguedad_minimo: limites.dias_antiguedad_minimo || 0,
      dias_antiguedad_maximo: limites.dias_antiguedad_maximo || 30,
      valor_minimo_factura: limites.valor_minimo_factura || 0,
      valor_maximo_factura: limites.valor_maximo_factura || 100000000,
      valor_maximo_credito: limites.valor_maximo_credito || 0,
      cantidad_maxima_productos: limites.cantidad_maxima_productos || 1000,
      facturas_pendientes_maximas: limites.facturas_pendientes_maximas || 10,
      puede_comprar_credito: limites.puede_comprar_credito || false,
      requiere_aprobacion: limites.requiere_aprobacion || false,
      dias_plazo_credito: limites.dias_plazo_credito || 0,
    });
    setLimitesEditar(tipoCliente.id);
  };

  // Cerrar editor
  const cerrarEditor = () => {
    setLimitesEditar(null);
    setFormLimites({});
    setError(null);
  };

  // Guardar límites de facturación
  const guardarLimites = async () => {
    try {
      setGuardando(true);
      setError(null);

      const datosGuardar = {
        tipo_cliente_id: formLimites.tipo_cliente_id,
        dias_antiguedad_minimo: parseInt(formLimites.dias_antiguedad_minimo),
        dias_antiguedad_maximo: parseInt(formLimites.dias_antiguedad_maximo),
        valor_minimo_factura: parseFloat(formLimites.valor_minimo_factura),
        valor_maximo_factura: parseFloat(formLimites.valor_maximo_factura),
        valor_maximo_credito: parseFloat(formLimites.valor_maximo_credito),
        cantidad_maxima_productos: parseInt(formLimites.cantidad_maxima_productos),
        facturas_pendientes_maximas: parseInt(formLimites.facturas_pendientes_maximas),
        puede_comprar_credito: formLimites.puede_comprar_credito,
        requiere_aprobacion: formLimites.requiere_aprobacion,
        dias_plazo_credito: parseInt(formLimites.dias_plazo_credito),
      };

      // Verificar si ya existe registro
      const { data: existente } = await supabase
        .from('limites_facturacion')
        .select('id')
        .eq('tipo_cliente_id', formLimites.tipo_cliente_id)
        .single();

      let resultado;
      if (existente) {
        // Actualizar
        resultado = await supabase
          .from('limites_facturacion')
          .update(datosGuardar)
          .eq('tipo_cliente_id', formLimites.tipo_cliente_id);
      } else {
        // Insertar
        resultado = await supabase
          .from('limites_facturacion')
          .insert([datosGuardar]);
      }

      if (resultado.error) throw resultado.error;

      setExito('Límites guardados correctamente ✓');
      setTimeout(() => {
        setExito(null);
        cerrarEditor();
        cargarDatos();
      }, 2000);
    } catch (error) {
      console.error('Error guardando límites:', error);
      setError('Error al guardar: ' + error.message);
    } finally {
      setGuardando(false);
    }
  };

  // Cambiar valor en formulario
  const manejarCambio = (campo, valor) => {
    setFormLimites(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  // Formatear moneda
  const formatearMoneda = (valor) => {
    return parseFloat(valor || 0).toLocaleString('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    });
  };

  if (cargando) {
    return <div className="tipos-clientes-screen loading">Cargando...</div>;
  }

  return (
    <div className="tipos-clientes-screen">
      <div className="header">
        <h1>🎯 Gestión de Tipos de Clientes y Límites</h1>
        <p>Configura reglas de facturación por tipo de cliente</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      <div className="tabs">
        <button
          className={`tab-btn ${tab === 'tipos' ? 'active' : ''}`}
          onClick={() => setTab('tipos')}
        >
          📋 Tipos de Clientes
        </button>
        <button
          className={`tab-btn ${tab === 'limites' ? 'active' : ''}`}
          onClick={() => setTab('limites')}
        >
          ⚙️ Configurar Límites
        </button>
      </div>

      {/* TAB: Tipos de Clientes */}
      {tab === 'tipos' && (
        <div className="tab-content">
          <div className="tipos-grid">
            {tiposClientes.map(tipo => (
              <div key={tipo.id} className="tipo-card">
                <h3>{tipo.nombre}</h3>
                <p>{tipo.descripcion}</p>
                <div className="tipo-info">
                  {tipo.limites_facturacion?.[0] && (
                    <>
                      <span className="info-item">
                        💰 Valor mín: {formatearMoneda(tipo.limites_facturacion[0].valor_minimo_factura)}
                      </span>
                      <span className="info-item">
                        💰 Valor máx: {formatearMoneda(tipo.limites_facturacion[0].valor_maximo_factura)}
                      </span>
                      <span className="info-item">
                        📅 Antigüedad máx: {tipo.limites_facturacion[0].dias_antiguedad_maximo} días
                      </span>
                      <span className="info-item">
                        💳 Crédito: {tipo.limites_facturacion[0].puede_comprar_credito ? '✓ Sí' : '✗ No'}
                      </span>
                    </>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => abrirEditorLimites(tipo)}
                >
                  Editar Límites
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Editor de Límites */}
      {tab === 'limites' && (
        <div className="tab-content">
          {limitesEditar ? (
            <div className="editor-limites">
              <h2>Editar Límites: {formLimites.tipo_cliente_nombre}</h2>

              <div className="form-section">
                <h3>📅 Límites de Antigüedad</h3>
                <div className="form-group">
                  <label>Antigüedad máxima (días sin cobro):</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={formLimites.dias_antiguedad_maximo}
                    onChange={(e) => manejarCambio('dias_antiguedad_maximo', e.target.value)}
                  />
                  <small>Si hay facturas pendientes más antiguas que esto, se bloquea la nueva venta</small>
                </div>
              </div>

              <div className="form-section">
                <h3>💰 Límites de Valor por Factura</h3>
                <div className="form-group">
                  <label>Valor mínimo:</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formLimites.valor_minimo_factura}
                    onChange={(e) => manejarCambio('valor_minimo_factura', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Valor máximo:</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    value={formLimites.valor_maximo_factura}
                    onChange={(e) => manejarCambio('valor_maximo_factura', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>💳 Límites de Crédito</h3>
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="puede_credito"
                    checked={formLimites.puede_comprar_credito}
                    onChange={(e) => manejarCambio('puede_comprar_credito', e.target.checked)}
                  />
                  <label htmlFor="puede_credito">¿Puede comprar a crédito?</label>
                </div>

                {formLimites.puede_comprar_credito && (
                  <>
                    <div className="form-group">
                      <label>Crédito máximo permitido:</label>
                      <input
                        type="number"
                        min="0"
                        step="10000"
                        value={formLimites.valor_maximo_credito}
                        onChange={(e) => manejarCambio('valor_maximo_credito', e.target.value)}
                      />
                      <small>Máximo monto acumulado en crédito</small>
                    </div>
                    <div className="form-group">
                      <label>Plazo de crédito (días):</label>
                      <input
                        type="number"
                        min="0"
                        max="180"
                        value={formLimites.dias_plazo_credito}
                        onChange={(e) => manejarCambio('dias_plazo_credito', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="form-section">
                <h3>📦 Límites de Productos</h3>
                <div className="form-group">
                  <label>Cantidad máxima de productos por factura:</label>
                  <input
                    type="number"
                    min="1"
                    value={formLimites.cantidad_maxima_productos}
                    onChange={(e) => manejarCambio('cantidad_maxima_productos', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Máximo de facturas pendientes sin pagar:</label>
                  <input
                    type="number"
                    min="1"
                    value={formLimites.facturas_pendientes_maximas}
                    onChange={(e) => manejarCambio('facturas_pendientes_maximas', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-section">
                <div className="form-group checkbox">
                  <input
                    type="checkbox"
                    id="requiere_aprobacion"
                    checked={formLimites.requiere_aprobacion}
                    onChange={(e) => manejarCambio('requiere_aprobacion', e.target.checked)}
                  />
                  <label htmlFor="requiere_aprobacion">
                    ¿Requiere aprobación antes de facturar?
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  className="btn btn-primary"
                  onClick={guardarLimites}
                  disabled={guardando}
                >
                  {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={cerrarEditor}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <p>Selecciona un tipo de cliente en la pestaña anterior para editar sus límites</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
