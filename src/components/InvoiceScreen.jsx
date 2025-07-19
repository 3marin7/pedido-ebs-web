import React, { useState, useEffect } from 'react';
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
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const [cantidadEditada, setCantidadEditada] = useState('');

  const vendedores = ['Edwin Marin', 'Fredy Marin', 'Fabian Marin'];

  useEffect(() => {
    const productosGuardados = JSON.parse(localStorage.getItem('productos')) || [];
    setProductosCatalogo(productosGuardados);
  }, []);

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

  const agregarProductoDesdeCatalogo = (producto) => {
    const productoExistente = productos.find(p => p.nombre === producto.nombre);
    
    if (productoExistente) {
      const productosActualizados = productos.map(p => 
        p.nombre === producto.nombre 
          ? { ...p, cantidad: p.cantidad + 1 } 
          : p
      );
      setProductos(productosActualizados);
    } else {
      const nuevoProducto = {
        id: Date.now(),
        nombre: producto.nombre,
        cantidad: 1,
        precio: producto.precio,
      };
      setProductos([...productos, nuevoProducto]);
    }
    
    setMostrarCatalogo(false);
  };

  const eliminarProducto = (id) => {
    setProductos(productos.filter((p) => p.id !== id));
  };

  const iniciarEdicionCantidad = (producto) => {
    setEditandoProductoId(producto.id);
    setCantidadEditada(producto.cantidad.toString());
  };

  const guardarEdicionCantidad = (id) => {
    if (!cantidadEditada || isNaN(cantidadEditada)) {
      alert('Ingrese una cantidad válida');
      return;
    }

    const productosActualizados = productos.map(p => 
      p.id === id 
        ? { ...p, cantidad: parseInt(cantidadEditada) } 
        : p
    );
    setProductos(productosActualizados);
    setEditandoProductoId(null);
    setCantidadEditada('');
  };

  const cancelarEdicion = () => {
    setEditandoProductoId(null);
    setCantidadEditada('');
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

  const productosFiltrados = productosCatalogo.filter(producto => 
    producto.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) ||
    (producto.codigo && producto.codigo.toLowerCase().includes(busquedaCatalogo.toLowerCase()))
  );

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
      ) : mostrarCatalogo ? (
        <div className="catalogo-modal">
          <div className="catalogo-content">
            <div className="catalogo-header">
              <h2>Seleccionar Producto del Catálogo</h2>
              <button 
                className="button secondary-button"
                onClick={() => setMostrarCatalogo(false)}
              >
                Volver
              </button>
            </div>
            
            <div className="catalogo-search">
              <input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
              />
            </div>
            
            <div className="productos-catalogo-list">
              {productosFiltrados.length > 0 ? (
                productosFiltrados.map(producto => (
                  <div 
                    key={producto.id} 
                    className="producto-catalogo-item"
                    onClick={() => agregarProductoDesdeCatalogo(producto)}
                  >
                    <div className="producto-info">
                      <h4>{producto.nombre}</h4>
                      {producto.codigo && <span>#{producto.codigo}</span>}
                    </div>
                    <div className="producto-precio">
                      ${producto.precio.toFixed(2)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-catalogo">
                  <p>No se encontraron productos</p>
                  <button 
                    className="button primary-button"
                    onClick={() => navigate('/catalogo')}
                  >
                    Ir al Catálogo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <h1>PEDIDO EBS</h1>

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
              <button 
                className="button primary-button"
                onClick={() => setMostrarCatalogo(true)}
              >
                <i className="fas fa-book"></i> Catálogo
              </button>
            </div>
          </div>

          {productos.length > 0 && (
            <div className="productos-list">
              <h3>Productos Agregados:</h3>
              {productos.map((p) => (
                <div key={p.id} className="producto-item">
                  <div className="producto-info">
                    <span className="producto-nombre">{p.nombre}</span>
                    {editandoProductoId === p.id ? (
                      <div className="editar-cantidad-container">
                        <input
                          type="number"
                          value={cantidadEditada}
                          onChange={(e) => setCantidadEditada(e.target.value)}
                          min="1"
                          className="editar-cantidad-input"
                        />
                        <button 
                          className="button small-button success-button"
                          onClick={() => guardarEdicionCantidad(p.id)}
                        >
                          <i className="fas fa-check"></i>
                        </button>
                        <button 
                          className="button small-button danger-button"
                          onClick={cancelarEdicion}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    ) : (
                      <span className="producto-detalle">
                        {p.cantidad} x ${p.precio.toFixed(2)} = ${(p.cantidad * p.precio).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="producto-acciones">
                    {editandoProductoId !== p.id && (
                      <button
                        className="button info-button"
                        onClick={() => iniciarEdicionCantidad(p)}
                      >
                        <i className="fas fa-edit"></i> Editar
                      </button>
                    )}
                    <button
                      className="button danger-button"
                      onClick={() => eliminarProducto(p.id)}
                    >
                      <i className="fas fa-trash"></i> Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

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
            <button
              className="button info-button"
              onClick={() => navigate('/catalogo')}
            >
              Administrar Catálogo
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceScreen;