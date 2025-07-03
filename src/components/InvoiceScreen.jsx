import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacturaPreview from './FacturaPreview';
import './InvoiceScreen.css';

const InvoiceScreen = () => {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [productos, setProductos] = useState([]);
  const [nombreProducto, setNombreProducto] = useState('');
  const [cantidadProducto, setCantidadProducto] = useState('');
  const [precioProducto, setPrecioProducto] = useState('');
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState('');
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);

  const vendedores = ['Edwin Marin', 'Fredy Marin', 'Fabian Marin'];

  const agregarProducto = () => {
    if (!nombreProducto || !cantidadProducto || !precioProducto) {
      alert('Complete todos los campos del producto');
      return;
    }

    const nuevoProducto = {
      id: Date.now(),
      nombre: nombreProducto,
      cantidad: parseInt(cantidadProducto),
      precio: parseFloat(precioProducto),
    };

    setProductos([...productos, nuevoProducto]);
    setNombreProducto('');
    setCantidadProducto('');
    setPrecioProducto('');
  };

  const eliminarProducto = (id) => {
    setProductos(productos.filter((p) => p.id !== id));
  };

  const mostrarPrevia = () => {
    if (!cliente || productos.length === 0 || !vendedorSeleccionado) {
      alert('Complete cliente, vendedor y agregue productos');
      return;
    }
    setMostrarVistaPrevia(true);
  };

  const guardarFactura = () => {
    const facturas = JSON.parse(localStorage.getItem('facturas')) || [];
    const nuevaFactura = {
      id: Date.now(),
      cliente,
      fecha,
      vendedor: vendedorSeleccionado,
      direccion: direccion || 'No especificado',
      telefono: telefono || 'No especificado',
      correo: correo || 'No especificado',
      productos,
      total: productos.reduce((sum, p) => sum + p.cantidad * p.precio, 0),
    };
    localStorage.setItem('facturas', JSON.stringify([...facturas, nuevaFactura]));
    alert('Factura guardada exitosamente!');
    setMostrarVistaPrevia(false);
    setCliente('');
    setDireccion('');
    setTelefono('');
    setCorreo('');
    setProductos([]);
    setVendedorSeleccionado('');
  };

  return (
    <div className="invoice-container">
      {mostrarVistaPrevia ? (
        <FacturaPreview
          factura={{
            cliente,
            fecha,
            vendedor: vendedorSeleccionado,
            direccion,
            telefono,
            correo,
            productos,
            total: productos.reduce((sum, p) => sum + p.cantidad * p.precio, 0),
          }}
          onVolver={() => setMostrarVistaPrevia(false)}
          onGuardar={guardarFactura}
        />
      ) : (
        <>
          <h1>PEDIDO EBS</h1>

          {/* Primera línea: Campos principales (cliente, fecha, vendedor) */}
          <div className="form-row">
            <div className="form-group">
              <label>Cliente *</label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre del cliente"
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Vendedor *</label>
              <select
                value={vendedorSeleccionado}
                onChange={(e) => setVendedorSeleccionado(e.target.value)}
                required
              >
                <option value="">Seleccione</option>
                {vendedores.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Segunda línea: Campos opcionales (dirección, teléfono, correo) */}
          <div className="form-row">
            <div className="form-group">
              <label>Dirección</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Opcional"
              />
            </div>
            <div className="form-group">
              <label>Correo</label>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Sección de productos */}
          <div className="form-section">
            <h3>Agregar Producto:</h3>
            <div className="product-form-row">
              <input
                type="text"
                value={nombreProducto}
                onChange={(e) => setNombreProducto(e.target.value)}
                placeholder="Nombre *"
              />
              <input
                type="number"
                value={cantidadProducto}
                onChange={(e) => setCantidadProducto(e.target.value)}
                placeholder="Cantidad *"
                min="1"
              />
              <input
                type="number"
                value={precioProducto}
                onChange={(e) => setPrecioProducto(e.target.value)}
                placeholder="Precio *"
                min="0"
                step="0.01"
              />
              <button className="button" onClick={agregarProducto}>
                Agregar
              </button>
            </div>
          </div>

          {/* Lista de productos */}
          {productos.length > 0 && (
            <div className="productos-list">
              <h3>Productos Agregados:</h3>
              {productos.map((p) => (
                <div key={p.id} className="producto-item">
                  <div className="producto-info">
                    <span className="producto-nombre">{p.nombre}</span>
                    <span className="producto-detalle">
                      {p.cantidad} x ${p.precio.toFixed(2)} = ${(p.cantidad * p.precio).toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="button danger-button"
                    onClick={() => eliminarProducto(p.id)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Botones de acción */}
          <div className="action-buttons">
            <button className="button" onClick={mostrarPrevia}>
              Vista Previa
            </button>
            <button
              className="button secondary-button"
              onClick={() => navigate('/facturas')}
            >
              Ver Facturas
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceScreen;