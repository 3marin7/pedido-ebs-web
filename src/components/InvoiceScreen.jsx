import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacturaPreview from './FacturaPreview';
import ClientesScreen from './ClientesScreen';
import { supabase } from './supabaseClient';
import './InvoiceScreen.css';

const InvoiceScreen = () => {
  const navigate = useNavigate();
  
  // Estados principales
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
  
  // Estados para vistas modales
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false);
  const [mostrarCatalogo, setMostrarCatalogo] = useState(false);
  const [mostrarClientes, setMostrarClientes] = useState(false);
  
  // Estados para catálogo
  const [productosCatalogo, setProductosCatalogo] = useState([]);
  const [busquedaCatalogo, setBusquedaCatalogo] = useState('');
  
  // Estados para edición
  const [editandoProductoId, setEditandoProductoId] = useState(null);
  const [cantidadEditada, setCantidadEditada] = useState('');
  
  // Estados para clientes
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(false);

  const vendedores = ['Edwin Marin', 'Fredy Marin', 'Fabian Marin'];

  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      try {
        setCargando(true);
        
        // Cargar productos del catálogo
        const { data: productosData, error: productosError } = await supabase
          .from('productos')
          .select('*')
          .order('nombre', { ascending: true });
        
        if (productosError) throw productosError;
        setProductosCatalogo(productosData || []);
        
        // Cargar clientes
        const { data: clientesData, error: clientesError } = await supabase
          .from('clientes')
          .select('*')
          .order('nombre', { ascending: true });
        
        if (clientesError) throw clientesError;
        setClientes(clientesData || []);
        
      } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        alert('Error al cargar datos iniciales');
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatosIniciales();
  }, []);

  // Función para agregar producto manualmente
  const agregarProducto = () => {
    if (!nombreProducto || !cantidadProducto || !precioProducto) {
      alert('Complete todos los campos del producto');
      return;
    }

    const cantidad = parseInt(cantidadProducto);
    const precio = parseFloat(precioProducto);

    if (isNaN(cantidad) || cantidad <= 0) {
      alert('Ingrese una cantidad válida');
      return;
    }

    if (isNaN(precio) || precio <= 0) {
      alert('Ingrese un precio válido');
      return;
    }

    const nuevoProducto = {
      id: Date.now(),
      nombre: nombreProducto,
      cantidad: cantidad,
      precio: precio,
    };

    setProductos([...productos, nuevoProducto]);
    setNombreProducto('');
    setCantidadProducto('');
    setPrecioProducto('');
  };

  // Función para agregar desde catálogo
  const agregarProductoDesdeCatalogo = (producto) => {
    if (!producto || !producto.nombre || !producto.precio) {
      console.error('Producto inválido:', producto);
      return;
    }

    setProductos(prevProductos => {
      const existe = prevProductos.find(p => p.nombre === producto.nombre);
      if (existe) {
        return prevProductos.map(p => 
          p.nombre === producto.nombre 
            ? { ...p, cantidad: p.cantidad + 1 } 
            : p
        );
      }
      return [
        ...prevProductos,
        {
          id: producto.id || Date.now(),
          nombre: producto.nombre,
          cantidad: 1,
          precio: producto.precio,
          codigo: producto.codigo || ''
        }
      ];
    });
    setMostrarCatalogo(false);
  };

  // Funciones para gestión de productos
  const eliminarProducto = (id) => {
    setProductos(productos.filter(p => p.id !== id));
  };

  const iniciarEdicionCantidad = (producto) => {
    setEditandoProductoId(producto.id);
    setCantidadEditada(producto.cantidad.toString());
  };

  const guardarEdicionCantidad = (id) => {
    const cantidad = parseInt(cantidadEditada);
    if (isNaN(cantidad) || cantidad <= 0) {
      alert('Ingrese una cantidad válida');
      return;
    }

    const productosActualizados = productos.map(p => 
      p.id === id ? { ...p, cantidad: cantidad } : p
    );
    setProductos(productosActualizados);
    setEditandoProductoId(null);
    setCantidadEditada('');
  };

  const cancelarEdicion = () => {
    setEditandoProductoId(null);
    setCantidadEditada('');
  };

  // Funciones para factura
  const mostrarPrevia = () => {
    if (!cliente || productos.length === 0 || !vendedorSeleccionado) {
      alert('Complete cliente, vendedor y agregue productos');
      return;
    }
    setMostrarVistaPrevia(true);
  };

  const guardarFactura = async () => {
    try {
      setCargando(true);
      
      const facturaData = {
        cliente,
        fecha,
        vendedor: vendedorSeleccionado,
        direccion: direccion || null,
        telefono: telefono || null,
        correo: correo || null,
        productos,
        total: productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0),
      };

      const { data, error } = await supabase
        .from('facturas')
        .insert([{
          cliente: facturaData.cliente,
          fecha: facturaData.fecha,
          vendedor: facturaData.vendedor,
          direccion: facturaData.direccion,
          telefono: facturaData.telefono,
          correo: facturaData.correo,
          productos: facturaData.productos,
          total: facturaData.total
        }])
        .select();

      if (error) throw error;

      alert('Factura guardada exitosamente!');
      setMostrarVistaPrevia(false);
      
      // Limpiar formulario
      setCliente('');
      setDireccion('');
      setTelefono('');
      setCorreo('');
      setProductos([]);
      setVendedorSeleccionado('');
      
    } catch (error) {
      console.error('Error guardando factura:', error);
      alert('Error al guardar la factura');
    } finally {
      setCargando(false);
    }
  };

  // Función para seleccionar cliente
  const seleccionarCliente = (cliente) => {
    setCliente(cliente.nombre);
    setDireccion(cliente.direccion || '');
    setTelefono(cliente.telefono || '');
    setCorreo(cliente.correo || '');
    setMostrarClientes(false);
  };

  // Filtros
  const productosFiltrados = productosCatalogo.filter(producto => 
    producto.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) ||
    (producto.codigo && producto.codigo.toLowerCase().includes(busquedaCatalogo.toLowerCase()))
  );

  // Calcular total
  const total = productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0);

  return (
    <div className="invoice-container">
      {/* Vista Previa de Factura */}
      {mostrarVistaPrevia && (
        <FacturaPreview
          factura={{
            cliente,
            fecha,
            vendedor: vendedorSeleccionado,
            direccion,
            telefono,
            correo,
            productos,
            total: total,
          }}
          onVolver={() => setMostrarVistaPrevia(false)}
          onGuardar={guardarFactura}
          cargando={cargando}
        />
      )}

      {/* Modal de Catálogo */}
      {mostrarCatalogo && (
        <div className="catalogo-modal">
          <div className="catalogo-content">
            <div className="catalogo-header">
              <h2>Catálogo de Productos</h2>
              <button 
                className="button secondary-button"
                onClick={() => setMostrarCatalogo(false)}
              >
                Cerrar
              </button>
            </div>
            
            <div className="catalogo-search">
              <input
                type="text"
                placeholder="🔍 Buscar producto..."
                value={busquedaCatalogo}
                onChange={(e) => setBusquedaCatalogo(e.target.value)}
                className="search-input"
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
                      {producto.codigo && <span className="producto-codigo">#{producto.codigo}</span>}
                    </div>
                    <div className="producto-precio">
                      ${producto.precio?.toFixed(2) || '0.00'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-catalogo">
                  <p>No se encontraron productos</p>
                  <button 
                    className="button primary-button"
                    onClick={() => {
                      setMostrarCatalogo(false);
                      navigate('/catalogo');
                    }}
                  >
                    Administrar Catálogo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Clientes */}
      {mostrarClientes && (
        <ClientesScreen 
          onSeleccionarCliente={seleccionarCliente}
          onVolver={() => setMostrarClientes(false)}
          clientes={clientes}
        />
      )}

      {/* Formulario Principal */}
      {!mostrarVistaPrevia && !mostrarCatalogo && !mostrarClientes && (
        <>
          <h1>PEDIDO EBS</h1>

          {/* Botón de seleccionar cliente */}
          <div className="form-row">
            <div className="form-group">
              <button 
                className="button info-button"
                onClick={() => setMostrarClientes(true)}
              >
                <i className="fas fa-users"></i> Seleccionar Cliente
              </button>
            </div>
          </div>

          {/* Línea 1: Nombre del cliente y Fecha */}
          <div className="form-row">
            <div className="form-group cliente-group" style={{flex: 2}}>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Nombre del cliente *"
                required
                className={!cliente ? 'input-error' : ''}
              />
            </div>
            <div className="form-group" style={{flex: 1}}>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="date-input"
              />
            </div>
          </div>

          {/* Línea 2: Dirección y Teléfono */}
          <div className="form-row">
            <div className="form-group" style={{flex: 2}}>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Dirección Opcional"
              />
            </div>
            <div className="form-group" style={{flex: 1}}>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Teléfono Opcional"
              />
            </div>
          </div>

          {/* Línea 3: Email y Vendedor */}
          <div className="form-row">
            <div className="form-group" style={{flex: 1}}>
              <input
                type="email"
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="Email Opcional"
              />
            </div>
            <div className="form-group" style={{flex: 1}}>
              <select
                value={vendedorSeleccionado}
                onChange={(e) => setVendedorSeleccionado(e.target.value)}
                required
                className={!vendedorSeleccionado ? 'input-error' : ''}
              >
                <option value="">Seleccione vendedor *</option>
                {vendedores.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
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
                className="product-input"
              />
              <input
                type="number"
                value={cantidadProducto}
                onChange={(e) => setCantidadProducto(e.target.value)}
                placeholder="Cantidad *"
                min="1"
                className="product-input"
              />
              <input
                type="number"
                value={precioProducto}
                onChange={(e) => setPrecioProducto(e.target.value)}
                placeholder="Precio *"
                min="0"
                step="0.01"
                className="product-input"
              />
              <button className="button add-product-button" onClick={agregarProducto}>
                Agregar
              </button>
              <button 
                className="button primary-button catalog-button"
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
                          autoFocus
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
                        className="button info-button small-button"
                        onClick={() => iniciarEdicionCantidad(p)}
                        title="Editar cantidad"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                    <button
                      className="button danger-button small-button"
                      onClick={() => eliminarProducto(p.id)}
                      title="Eliminar producto"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
              <div className="total-container">
                <h3>Total: ${total.toFixed(2)}</h3>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button 
              className="button preview-button" 
              onClick={mostrarPrevia}
              disabled={productos.length === 0 || !cliente || !vendedorSeleccionado}
            >
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
            <button
              className="button success-button"
              onClick={() => navigate('/catalogo-clientes')}
            >
              <i className="fas fa-share"></i> Enviar Catálogo
            </button>
            <button
              className="button warning-button"
              onClick={() => navigate('/gestion-pedidos')}
            >
              <i className="fas fa-clipboard-list"></i> Gestión Pedidos
            </button>
            <button
              className="button primary-button"
              onClick={() => window.open('https://mercagi.com/login/', '_blank')}
            >
              <i className="fas fa-external-link-alt"></i> Mercagi
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceScreen;