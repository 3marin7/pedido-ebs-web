import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
    nota: ''
  });
  const [editandoAbono, setEditandoAbono] = useState(null);
  const [mostrarFormAbono, setMostrarFormAbono] = useState(false);

  useEffect(() => {
    const cargarFacturaYAbonos = () => {
      try {
        // Cargar factura
        const facturas = JSON.parse(localStorage.getItem('facturas')) || [];
        const encontrada = facturas.find(f => f.id === Number(id));
        
        if (encontrada) {
          setFactura(encontrada);
        }

        // Cargar abonos
        const todosAbonos = JSON.parse(localStorage.getItem('abonos')) || [];
        const abonosFactura = todosAbonos.filter(a => a.facturaId === Number(id));
        setAbonos(abonosFactura);
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
      Factura #${factura.id}
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
    return Math.abs(calcularSaldoPendiente()) < 0.01; // Consideramos pagada si el saldo es menor a 1 centavo
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

  const agregarAbono = () => {
    if (!validarAbono()) return;

    const abono = {
      id: Date.now(),
      facturaId: Number(id),
      ...nuevoAbono,
      fecha: nuevoAbono.fecha || new Date().toISOString().split('T')[0],
      creadoEn: new Date().toISOString()
    };

    const nuevosAbonos = [...abonos, abono];
    setAbonos(nuevosAbonos);
    
    // Actualizar localStorage
    const todosAbonos = JSON.parse(localStorage.getItem('abonos')) || [];
    localStorage.setItem('abonos', JSON.stringify([...todosAbonos, abono]));
    
    // Resetear formulario
    setNuevoAbono({
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      nota: ''
    });
    setMostrarFormAbono(false);
  };

  const editarAbono = () => {
    if (!validarAbono()) return;

    const abonosActualizados = abonos.map(abono => 
      abono.id === editandoAbono.id 
        ? { ...abono, ...nuevoAbono } 
        : abono
    );

    setAbonos(abonosActualizados);
    
    // Actualizar localStorage
    const todosAbonos = JSON.parse(localStorage.getItem('abonos')) || [];
    const nuevosTodosAbonos = todosAbonos.map(abono => 
      abono.id === editandoAbono.id 
        ? { ...abono, ...nuevoAbono } 
        : abono
    );
    localStorage.setItem('abonos', JSON.stringify(nuevosTodosAbonos));
    
    // Resetear formulario
    setEditandoAbono(null);
    setNuevoAbono({
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      nota: ''
    });
    setMostrarFormAbono(false);
  };

  const eliminarAbono = (idAbono) => {
    if (!window.confirm('¿Estás seguro de eliminar este abono?')) return;

    const abonosActualizados = abonos.filter(abono => abono.id !== idAbono);
    setAbonos(abonosActualizados);
    
    // Actualizar localStorage
    const todosAbonos = JSON.parse(localStorage.getItem('abonos')) || [];
    const nuevosTodosAbonos = todosAbonos.filter(abono => abono.id !== idAbono);
    localStorage.setItem('abonos', JSON.stringify(nuevosTodosAbonos));
  };

  const iniciarEdicionAbono = (abono) => {
    setEditandoAbono(abono);
    setNuevoAbono({
      monto: abono.monto,
      fecha: abono.fecha,
      nota: abono.nota || ''
    });
    setMostrarFormAbono(true);
  };

  const cancelarEdicion = () => {
    setEditandoAbono(null);
    setNuevoAbono({
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      nota: ''
    });
    setMostrarFormAbono(false);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-MX', { 
      style: 'currency', 
      currency: 'MXN' 
    }).format(monto);
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (cargando) {
    return (
      <div className="cargando-detalle">
        <div className="spinner"></div>
        <p>Cargando factura...</p>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="factura-no-encontrada">
        <h2>Factura no encontrada</h2>
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
          <h1>Factura #{factura.id.toString().padStart(6, '0')}</h1>
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
          <span>Total Factura</span>
          <h2>{formatearMoneda(factura.total)}</h2>
        </div>
      </div>

      <div className="factura-info-grid">
        <div className="info-card cliente-info">
          <h3>Cliente</h3>
          <p>{factura.cliente}</p>
        </div>
        
        <div className="info-card vendedor-info">
          <h3>Vendedor</h3>
          <p>{factura.vendedor}</p>
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
              >
                Cancelar
              </button>
              <button 
                className="button primary-button"
                onClick={editandoAbono ? editarAbono : agregarAbono}
              >
                {editandoAbono ? 'Guardar Cambios' : 'Agregar Abono'}
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
                  <th>Nota</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).map((abono) => (
                  <tr key={abono.id}>
                    <td>{formatearFecha(abono.fecha)}</td>
                    <td>{formatearMoneda(abono.monto)}</td>
                    <td>{abono.nota || '-'}</td>
                    <td className="acciones-cell">
                      <button 
                        className="button icon-button small"
                        onClick={() => iniciarEdicionAbono(abono)}
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button 
                        className="button icon-button small danger"
                        onClick={() => eliminarAbono(abono.id)}
                        title="Eliminar"
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
            <p>No se han registrado abonos para esta factura.</p>
          </div>
        )}
      </div>

      <div className="factura-footer">
        <p className="footer-nota">
          Gracias por su preferencia. Para cualquier aclaración, presentar esta factura.
        </p>
        <div className="footer-logo">
          <span>EBS</span>
          <small>Sistema de Facturación</small>
        </div>
      </div>
    </div>
  );
};

export default FacturaDetalle;