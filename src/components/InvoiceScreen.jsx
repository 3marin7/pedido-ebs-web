import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FacturaPreview from './FacturaPreview';
import './InvoiceScreen.css';

const InvoiceScreen = () => {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
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
      precio: parseFloat(precioProducto)
    };

    setProductos([...productos, nuevoProducto]);
    setNombreProducto('');
    setCantidadProducto('');
    setPrecioProducto('');
  };

  const eliminarProducto = (id) => {
    setProductos(productos.filter(p => p.id !== id));
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
      productos,
      total: productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0)
    };
    localStorage.setItem('facturas', JSON.stringify([...facturas, nuevaFactura]));
    alert('Factura guardada exitosamente!');
    setMostrarVistaPrevia(false);
    setCliente('');
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
            productos,
            total: productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0)
          }}
          onVolver={() => setMostrarVistaPrevia(false)}
          onGuardar={guardarFactura}
        />
      ) : (
        <>
          <h1>PEDIDO EBS</h1>
          
          <div className="form-section">
            <input
              type="text"
              className="input-field"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Nombre del cliente"
            />
            <input
              type="date"
              className="input-field"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
            <select
              className="input-field"
              value={vendedorSeleccionado}
              onChange={(e) => setVendedorSeleccionado(e.target.value)}
            >
              <option value="">Seleccione vendedor</option>
              {vendedores.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="form-section">
            <h3>Agregar Producto:</h3>
            <input
              type="text"
              className="input-field"
              value={nombreProducto}
              onChange={(e) => setNombreProducto(e.target.value)}
              placeholder="Nombre del producto"
            />
            <input
              type="number"
              className="input-field"
              value={cantidadProducto}
              onChange={(e) => setCantidadProducto(e.target.value)}
              placeholder="Cantidad"
              min="1"
            />
            <input
              type="number"
              className="input-field"
              value={precioProducto}
              onChange={(e) => setPrecioProducto(e.target.value)}
              placeholder="Precio"
              min="0"
              step="0.01"
            />
            <button className="button" onClick={agregarProducto}>
              Agregar Producto
            </button>
          </div>

          {productos.length > 0 && (
            <div className="productos-list">
              <h3>Productos Agregados:</h3>
              {productos.map(p => (
                <div key={p.id} className="producto-item">
                  <div className="producto-info">
                    <div className="producto-nombre">{p.nombre}</div>
                    <div className="producto-detalle">
                      {p.cantidad} x ${p.precio.toFixed(2)} = ${(p.cantidad * p.precio).toFixed(2)}
                    </div>
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

          <div className="action-buttons">
            <button className="button" onClick={mostrarPrevia}>
              Ver Vista Previa
            </button>
            <button 
              className="button secondary-button" 
              onClick={() => navigate('/facturas')}
            >
              Ver Facturas Guardadas
            </button>
          </div>
        </>
      )}
    </div>    
  );
};

export default InvoiceScreen;