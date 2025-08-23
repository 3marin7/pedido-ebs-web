import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './FacturaDetalle.css';

const FacturaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [abonos, setAbonos] = useState([]);
  const [nuevoAbono, setNuevoAbono] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'Efectivo',
    nota: ''
  });
  const [editandoAbono, setEditandoAbono] = useState(null);
  const [mostrarFormAbono, setMostrarFormAbono] = useState(false);

  // Cargar factura y abonos desde Supabase
  useEffect(() => {
    const cargarFacturaYAbonos = async () => {
      try {
        setCargando(true);
        
        // Cargar factura
        const { data: facturaData, error: facturaError } = await supabase
          .from('facturas')
          .select('*')
          .eq('id', id)
          .single();
        
        if (facturaError) throw facturaError;
        setFactura(facturaData);
        
        // Cargar abonos
        const { data: abonosData, error: abonosError } = await supabase
          .from('abonos')
          .select('*')
          .eq('factura_id', id)
          .order('fecha', { ascending: false });
        
        if (abonosError) throw abonosError;
        setAbonos(abonosData || []);
        
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarFacturaYAbonos();
  }, [id]);

  const copiarDatos = () => {
    const datos = `
      Cuenta de Cobro #${factura.id}
      Cliente: ${factura.cliente}
      Fecha: ${new Date(factura.fecha).toLocaleDateString()}
      Total: $${factura.total.toFixed(2)}
      Saldo Pendiente: $${(factura.total - calcularTotalAbonado()).toFixed(2)}
      Productos: ${factura.productos.map(p => `\n  - ${p.nombre} (${p.cantidad} x $${p.precio.toFixed(2)})`).join('')}
      Abonos: ${abonos.length > 0 ? abonos.map(a => `\n  - $${a.monto.toFixed(2)} (${new Date(a.fecha).toLocaleDateString()})`).join('') : ' Ninguno'}
    `;
    navigator.clipboard.writeText(datos);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const imprimirFactura = () => {
    window.print();
  };

  const calcularTotalAbonado = () => {
    return abonos.reduce((total, abono) => total + abono.monto, 0);
  };

  const calcularSaldoPendiente = () => {
    return factura ? factura.total - calcularTotalAbonado() : 0;
  };

  const estaPagada = () => {
    return Math.abs(calcularSaldoPendiente()) < 0.01;
  };

  const handleInputAbonoChange = (e) => {
    const { name, value } = e.target;
    setNuevoAbono(prev => ({
      ...prev,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value
    }));
  };

  const validarAbono = () => {
    if (nuevoAbono.monto <= 0) {
      alert('El monto debe ser positivo');
      return false;
    }
    
    if (nuevoAbono.monto > calcularSaldoPendiente()) {
      alert('El monto no puede ser mayor al saldo pendiente');
      return false;
    }
    
    return true;
  };

  const agregarAbono = async () => {
    if (!validarAbono()) return;

    try {
      setCargando(true);
      
      const abonoData = {
        factura_id: Number(id),
        monto: nuevoAbono.monto,
        fecha: nuevoAbono.fecha || new Date().toISOString().split('T')[0],
        metodo: nuevoAbono.metodo,
        nota: nuevoAbono.nota || null
      };

      const { data, error } = await supabase
        .from('abonos')
        .insert([abonoData])
        .select();
      
      if (error) throw error;

      // Actualizar estado local
      setAbonos([data[0], ...abonos]);
      
      // Resetear formulario
      setNuevoAbono({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Efectivo',
        nota: ''
      });
      setMostrarFormAbono(false);
      
    } catch (error) {
      console.error("Error agregando abono:", error);
      alert('Error al agregar el abono');
    } finally {
      setCargando(false);
    }
  };

  const editarAbono = async () => {
    if (!validarAbono()) return;

    try {
      setCargando(true);
      
      const abonoData = {
        monto: nuevoAbono.monto,
        fecha: nuevoAbono.fecha,
        metodo: nuevoAbono.metodo,
        nota: nuevoAbono.nota || null
      };

      const { data, error } = await supabase
        .from('abonos')
        .update(abonoData)
        .eq('id', editandoAbono.id)
        .select();
      
      if (error) throw error;

      // Actualizar estado local
      setAbonos(abonos.map(abono => 
        abono.id === editandoAbono.id ? data[0] : abono
      ));
      
      // Resetear formulario
      setEditandoAbono(null);
      setNuevoAbono({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Efectivo',
        nota: ''
      });
      setMostrarFormAbono(false);
      
    } catch (error) {
      console.error("Error editando abono:", error);
      alert('Error al editar el abono');
    } finally {
      setCargando(false);
    }
  };

  const eliminarAbono = async (idAbono) => {
    if (!window.confirm('¿Estás seguro de eliminar este abono?')) return;

    try {
      setCargando(true);
      
      const { error } = await supabase
        .from('abonos')
        .delete()
        .eq('id', idAbono);
      
      if (error) throw error;

      // Actualizar estado local
      setAbonos(abonos.filter(abono => abono.id !== idAbono));
      
    } catch (error) {
      console.error("Error eliminando abono:", error);
      alert('Error al eliminar el abono');
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicionAbono = (abono) => {
    setEditandoAbono(abono);
    setNuevoAbono({
      monto: abono.monto,
      fecha: abono.fecha,
      metodo: abono.metodo || 'Efectivo',
      nota: abono.nota || ''
    });
    setMostrarFormAbono(true);
  };

  const cancelarEdicion = () => {
    setEditandoAbono(null);
    setNuevoAbono({
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      metodo: 'Efectivo',
      nota: ''
    });
    setMostrarFormAbono(false);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const metodosPago = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro'];

  if (cargando) {
    return (
      <div className="cargando-detalle">
        <div className="spinner"></div>
        <p>Cargando cuenta de cobro...</p>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="factura-no-encontrada">
        <h2>Cuenta de cobro no encontrada</h2>
        <button 
          className="button primary-button"
          onClick={() => navigate('/facturas')}
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const totalAbonado = calcularTotalAbonado();
  const saldoPendiente = calcularSaldoPendiente();

  return (
    <div className="factura-detalle-container">
      <div className="factura-actions-bar">
        <button 
          className="button secondary-button"
          onClick={() => navigate('/facturas')}
        >
          &larr; Volver
        </button>
        
        <div className="action-buttons">
          <button 
            className="button icon-button"
            onClick={copiarDatos}
            title="Copiar datos"
          >
            {copiado ? '✓ Copiado' : '⎘ Copiar'}
          </button>
          <button 
            className="button icon-button"
            onClick={imprimirFactura}
            title="Imprimir"
          >
            ⎙ Imprimir
          </button>
        </div>
      </div>

      <div className="factura-header">
        <div className="header-info">
          <h1>Cuenta de Cobro #{factura.id.toString().padStart(6, '0')}</h1>
          <p className="fecha-emision">
            Emitida el {new Date(factura.fecha).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="header-total">
          <span>Total Cuenta de Cobro</span>
          <h2>{formatearMoneda(factura.total)}</h2>
        </div>
      </div>

      <div className="factura-info-grid">
        <div className="info-card cliente-info">
          <h3>Cliente</h3>
          <p>{factura.cliente}</p>
          {factura.telefono && <p>Tel: {factura.telefono}</p>}
          {factura.correo && <p>Email: {factura.correo}</p>}
        </div>
        
        <div className="info-card vendedor-info">
          <h3>Vendedor</h3>
          <p>{factura.vendedor}</p>
          {factura.direccion && (
            <div className="direccion-info">
              <h4>Dirección</h4>
              <p>{factura.direccion}</p>
            </div>
          )}
        </div>
      </div>

      <div className="productos-table-container">
        <h3>Productos</h3>
        <table className="productos-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {factura.productos.map((producto, index) => (
              <tr key={index}>
                <td>{producto.nombre}</td>
                <td>{producto.cantidad}</td>
                <td>{formatearMoneda(producto.precio)}</td>
                <td>{formatearMoneda(producto.cantidad * producto.precio)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="total-label">Total</td>
              <td className="total-value">{formatearMoneda(factura.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sección de Abonos */}
      <div className="abonos-section">
        <div className="abonos-header">
          <h3>Abonos</h3>
          <div className="abonos-summary">
            <div className="summary-item">
              <span>Total Abonado:</span>
              <strong>{formatearMoneda(totalAbonado)}</strong>
            </div>
            <div className="summary-item">
              <span>Saldo Pendiente:</span>
              <strong className={saldoPendiente <= 0 ? 'pagado' : 'pendiente'}>
                {formatearMoneda(saldoPendiente)}
                {estaPagada() && <span className="badge-pagado">PAGADO</span>}
              </strong>
            </div>
          </div>
          {!mostrarFormAbono && (
            <button 
              className="button primary-button"
              onClick={() => setMostrarFormAbono(true)}
              disabled={estaPagada()}
            >
              + Agregar Abono
            </button>
          )}
        </div>

        {mostrarFormAbono && (
          <div className="abono-form">
            <h4>{editandoAbono ? 'Editar Abono' : 'Nuevo Abono'}</h4>
            <div className="form-group">
              <label>Monto:</label>
              <input
                type="number"
                name="monto"
                value={nuevoAbono.monto}
                onChange={handleInputAbonoChange}
                min="0.01"
                step="0.01"
                max={saldoPendiente}
              />
            </div>
            <div className="form-group">
              <label>Fecha:</label>
              <input
                type="date"
                name="fecha"
                value={nuevoAbono.fecha}
                onChange={handleInputAbonoChange}
              />
            </div>
            <div className="form-group">
              <label>Método de pago:</label>
              <select
                name="metodo"
                value={nuevoAbono.metodo}
                onChange={handleInputAbonoChange}
              >
                {metodosPago.map(metodo => (
                  <option key={metodo} value={metodo}>{metodo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nota (opcional):</label>
              <textarea
                name="nota"
                value={nuevoAbono.nota}
                onChange={handleInputAbonoChange}
                rows="2"
              />
            </div>
            <div className="form-actions">
              <button 
                className="button secondary-button"
                onClick={cancelarEdicion}
                disabled={cargando}
              >
                Cancelar
              </button>
              <button 
                className="button primary-button"
                onClick={editandoAbono ? editarAbono : agregarAbono}
                disabled={cargando}
              >
                {cargando ? 'Procesando...' : (editandoAbono ? 'Guardar Cambios' : 'Agregar Abono')}
              </button>
            </div>
          </div>
        )}

        {abonos.length > 0 ? (
          <div className="abonos-table-container">
            <table className="abonos-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Nota</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonos.map((abono) => (
                  <tr key={abono.id}>
                    <td>{formatearFecha(abono.fecha)}</td>
                    <td>{formatearMoneda(abono.monto)}</td>
                    <td>{abono.metodo || 'Efectivo'}</td>
                    <td>{abono.nota || '-'}</td>
                    <td className="acciones-cell">
                      <button 
                        className="button icon-button small"
                        onClick={() => iniciarEdicionAbono(abono)}
                        title="Editar"
                        disabled={cargando}
                      >
                        ✏️
                      </button>
                      <button 
                        className="button icon-button small danger"
                        onClick={() => eliminarAbono(abono.id)}
                        title="Eliminar"
                        disabled={cargando}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sin-abonos">
            <p>No se han registrado abonos para esta cuenta de cobro.</p>
          </div>
        )}
      </div>

      <div className="factura-footer">
        <p className="footer-nota">
          Gracias por su preferencia. Para cualquier aclaración, presentar esta cuenta de cobro.
        </p>
        <div className="footer-logo">
          <span>EBS</span>
          <small>Sistema de Ebs-Hermanos Marin</small>
        </div>
      </div>
    </div>
  );
};

export default FacturaDetalle;