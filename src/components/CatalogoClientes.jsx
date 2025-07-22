import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CatalogoClientes.css';

const CatalogoClientes = () => {
  const [state, setState] = useState({
    productos: [],
    productosSeleccionados: [],
    cargando: true,
    busqueda: '',
    categoriaFiltro: 'Todas',
    clienteInfo: {
      nombre: '',
      telefono: '',
      notas: ''
    },
    mostrarCarrito: false
  });

  const location = useLocation();
  const navigate = useNavigate();

  // Categorías disponibles
  const categorias = ['toallas', 'Bloqueadores', 'pañales', 'Alimentos', 'Desodorantes', 'Otros'];

  // Cargar productos desde localStorage o API
  useEffect(() => {
    const cargarProductos = () => {
      try {
        const productosGuardados = JSON.parse(localStorage.getItem('productos')) || [];
        // Filtrar solo productos activos para clientes
        setState(prev => ({
          ...prev,
          productos: productosGuardados.filter(p => p.activo !== false),
          cargando: false
        }));
        
        // Verificar si hay parámetros en la URL (para pre-llenar datos)
        if (location.search) {
          const params = new URLSearchParams(location.search);
          setState(prev => ({
            ...prev,
            clienteInfo: {
              ...prev.clienteInfo,
              nombre: params.get('nombre') || '',
              telefono: params.get('telefono') || ''
            }
          }));
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        setState(prev => ({ ...prev, cargando: false }));
      }
    };
    
    cargarProductos();
  }, [location.search]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      clienteInfo: {
        ...prev.clienteInfo,
        [name]: value
      }
    }));
  };

  const handleBusquedaChange = (e) => {
    setState(prev => ({ ...prev, busqueda: e.target.value }));
  };

  const handleCategoriaChange = (e) => {
    setState(prev => ({ ...prev, categoriaFiltro: e.target.value }));
  };

  const toggleMostrarCarrito = () => {
    setState(prev => ({ ...prev, mostrarCarrito: !prev.mostrarCarrito }));
  };

  // Filtrar productos
  const productosFiltrados = state.productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(state.busqueda.toLowerCase()) || 
                          (producto.codigo && producto.codigo.toLowerCase().includes(state.busqueda.toLowerCase()));
    const coincideCategoria = state.categoriaFiltro === 'Todas' || producto.categoria === state.categoriaFiltro;
    return coincideBusqueda && coincideCategoria;
  });

  // Formatear precio
  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  // Manejar selección de productos
  const toggleProductoSeleccionado = (producto) => {
    setState(prev => {
      const existe = prev.productosSeleccionados.find(p => p.id === producto.id);
      const nuevosProductos = existe
        ? prev.productosSeleccionados.filter(p => p.id !== producto.id)
        : [...prev.productosSeleccionados, { ...producto, cantidad: 1 }];
      
      return { ...prev, productosSeleccionados: nuevosProductos };
    });
  };

  // Actualizar cantidad de un producto seleccionado
  const actualizarCantidad = (id, cantidad) => {
    if (cantidad < 1) return;
    
    setState(prev => ({
      ...prev,
      productosSeleccionados: prev.productosSeleccionados.map(p => 
        p.id === id ? { ...p, cantidad: Math.min(parseInt(cantidad), 999) } : p
      )
    }));
  };

  // Calcular total
  const calcularTotal = () => {
    return state.productosSeleccionados.reduce((total, p) => total + (p.precio * p.cantidad), 0);
  };

  // Generar enlace de WhatsApp
  const generarEnlaceWhatsApp = () => {
    if (!state.clienteInfo.nombre || !state.clienteInfo.telefono) {
      alert('Por favor ingresa tu nombre y teléfono');
      return;
    }

    if (state.productosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un producto');
      return;
    }

    const numeroWhatsApp = '573042919147'; // Reemplaza con tu número
    const mensaje = `¡Hola! Soy ${state.clienteInfo.nombre} (${state.clienteInfo.telefono}). Quiero hacer el siguiente pedido:\n\n` +
      state.productosSeleccionados.map(p => 
        `- ${p.nombre} (${formatPrecio(p.precio)}): ${p.cantidad} unidad(es)`
      ).join('\n') +
      `\n\nTotal: ${formatPrecio(calcularTotal())}` +
      `\n\nNotas: ${state.clienteInfo.notas || 'Ninguna'}`;
    
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };

  // Generar link para compartir
  const generarLinkCompartir = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    if (state.clienteInfo.nombre) params.append('nombre', state.clienteInfo.nombre);
    if (state.clienteInfo.telefono) params.append('telefono', state.clienteInfo.telefono);
    
    const urlCompleta = `${baseUrl}?${params.toString()}`;
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(urlCompleta);
    alert('¡Link copiado! Puedes compartirlo con el cliente');
  };

  return (
    <div className="catalogo-cliente-container">
      {/* Encabezado */}
      <header className="cliente-header">
        <h1><i className="fas fa-store"></i> Catálogo Digital</h1>
        <div className="cliente-actions">
          <button 
            className="whatsapp-button"
            onClick={toggleMostrarCarrito}
          >
            <i className="fab fa-whatsapp"></i> Ver Pedido ({state.productosSeleccionados.length})
          </button>
        </div>
      </header>

      {/* Información del cliente */}
      <div className="cliente-info-section">
        <h3>Tus Datos</h3>
        <div className="cliente-form">
          <div className="form-group">
            <label>Nombre Completo *</label>
            <input
              type="text"
              name="nombre"
              value={state.clienteInfo.nombre}
              onChange={handleInputChange}
              placeholder="Ej: María González"
              required
            />
          </div>
          <div className="form-group">
            <label>Teléfono *</label>
            <input
              type="tel"
              name="telefono"
              value={state.clienteInfo.telefono}
              onChange={handleInputChange}
              placeholder="Ej: 3001234567"
              required
            />
          </div>
          <button 
            className="button share-button"
            onClick={generarLinkCompartir}
            disabled={!state.clienteInfo.nombre || !state.clienteInfo.telefono}
          >
            <i className="fas fa-share-alt"></i> Guardar y Compartir Link
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar productos..."
            value={state.busqueda}
            onChange={handleBusquedaChange}
          />
        </div>
        <div className="categoria-filter">
          <select 
            value={state.categoriaFiltro} 
            onChange={handleCategoriaChange}
          >
            <option value="Todas">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de productos */}
      {state.cargando ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando catálogo...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <h3>No encontramos productos</h3>
          <p>Prueba con otros términos de búsqueda</p>
        </div>
      ) : (
        <div className="productos-grid">
          {productosFiltrados.map(producto => {
            const estaSeleccionado = state.productosSeleccionados.some(p => p.id === producto.id);
            return (
              <div 
                key={producto.id} 
                className={`producto-card ${estaSeleccionado ? 'seleccionado' : ''}`}
                onClick={() => toggleProductoSeleccionado(producto)}
              >
                {producto.imagenUrl && (
                  <div className="producto-imagen">
                    <img src={producto.imagenUrl} alt={producto.nombre} />
                  </div>
                )}
                
                <div className="producto-header">
                  <h3>{producto.nombre}</h3>
                  {producto.codigo && <span className="codigo">#{producto.codigo}</span>}
                </div>
                
                <div className="producto-body">
                  <div className="producto-precio">
                    {formatPrecio(producto.precio)}
                  </div>
                  
                  {producto.categoria && (
                    <div className="producto-categoria">
                      <i className="fas fa-tag"></i> {producto.categoria}
                    </div>
                  )}
                  
                  {producto.descripcion && (
                    <p className="producto-descripcion">
                      {producto.descripcion}
                    </p>
                  )}
                </div>
                
                {estaSeleccionado && (
                  <div className="producto-seleccionado-badge">
                    <i className="fas fa-check-circle"></i> Seleccionado
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Carrito/Pedido lateral */}
      {state.mostrarCarrito && (
        <div className="carrito-modal">
          <div className="carrito-content">
            <div className="carrito-header">
              <h2>Tu Pedido</h2>
              <button 
                className="close-button"
                onClick={toggleMostrarCarrito}
              >
                &times;
              </button>
            </div>
            
            <div className="carrito-body">
              {state.productosSeleccionados.length === 0 ? (
                <div className="empty-cart">
                  <i className="fas fa-shopping-basket"></i>
                  <p>No has seleccionado productos</p>
                </div>
              ) : (
                <>
                  <div className="productos-list">
                    {state.productosSeleccionados.map(producto => (
                      <div key={producto.id} className="producto-carrito">
                        <div className="producto-info">
                          <h4>{producto.nombre}</h4>
                          <span>{formatPrecio(producto.precio)} c/u</span>
                        </div>
                        <div className="producto-cantidad">
                          <button 
                            onClick={() => actualizarCantidad(producto.id, producto.cantidad - 1)}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={producto.cantidad}
                            onChange={(e) => actualizarCantidad(producto.id, e.target.value)}
                            min="1"
                          />
                          <button 
                            onClick={() => actualizarCantidad(producto.id, producto.cantidad + 1)}
                          >
                            +
                          </button>
                        </div>
                        <div className="producto-subtotal">
                          {formatPrecio(producto.precio * producto.cantidad)}
                        </div>
                        <button 
                          className="eliminar-button"
                          onClick={() => toggleProductoSeleccionado(producto)}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="notas-pedido">
                    <label>Notas adicionales:</label>
                    <textarea
                      name="notas"
                      value={state.clienteInfo.notas}
                      onChange={handleInputChange}
                      placeholder="Ej: Necesito el pedido para el viernes..."
                      rows="3"
                    />
                  </div>
                  
                  <div className="carrito-total">
                    <span>Total:</span>
                    <span className="total-amount">{formatPrecio(calcularTotal())}</span>
                  </div>
                  
                  <button 
                    className="whatsapp-button full-width"
                    onClick={generarEnlaceWhatsApp}
                  >
                    <i className="fab fa-whatsapp"></i> Enviar Pedido por WhatsApp
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogoClientes;