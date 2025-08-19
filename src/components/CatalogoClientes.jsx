import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
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
    mostrarCarrito: false,
    showQuantityNotification: false
  });

  const [categorias, setCategorias] = useState(['Todas']);
  const location = useLocation();

  // Cargar productos desde Supabase
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setState(prev => ({ ...prev, cargando: true }));
        
        const { data: productos, error } = await supabase
          .from('productos')
          .select(`
            id,
            codigo,
            nombre,
            precio,
            categoria,
            descripcion,
            imagen_url,
            activo
          `)
          .eq('activo', true)
          .order('nombre', { ascending: true });

        if (error) throw error;

        const categoriasUnicas = [...new Set(productos.map(p => p.categoria))]
          .filter(Boolean)
          .sort();

        setState(prev => ({
          ...prev,
          productos: productos,
          cargando: false
        }));

        setCategorias(['Todas', ...categoriasUnicas]);

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
      
      // Mostrar notificación al agregar
      if (!existe) {
        setTimeout(() => {
          setState(prev => ({ ...prev, showQuantityNotification: false }));
        }, 2000);
        return { 
          ...prev, 
          productosSeleccionados: nuevosProductos, 
          showQuantityNotification: true,
          // Mostrar automáticamente el carrito al agregar cualquier producto
          mostrarCarrito: true
        };
      }
      
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
  const generarEnlaceWhatsApp = async () => {
    if (!state.clienteInfo.nombre || !state.clienteInfo.telefono) {
      alert('Por favor ingresa tu nombre y teléfono');
      return;
    }

    if (state.productosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un producto');
      return;
    }

    try {
      // 1. Primero guardar el pedido en la base de datos
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_nombre: state.clienteInfo.nombre,
            cliente_telefono: state.clienteInfo.telefono,
            cliente_notas: state.clienteInfo.notas || 'Ninguna',
            productos: state.productosSeleccionados,
            total: calcularTotal(),
            estado: 'pendiente', // Estado inicial
            fecha_creacion: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      // 2. Si se guardó correctamente, enviar por WhatsApp
      const numeroWhatsApp = '573042919147';
      const mensaje = `¡Hola! Soy ${state.clienteInfo.nombre} (${state.clienteInfo.telefono}). Quiero hacer el siguiente pedido:\n\n` +
        state.productosSeleccionados.map(p => 
          `- ${p.nombre} (${formatPrecio(p.precio)}): ${p.cantidad} unidad(es)`
        ).join('\n') +
        `\n\nTotal: ${formatPrecio(calcularTotal())}` +
        `\n\nNotas: ${state.clienteInfo.notas || 'Ninguna'}` +
        `\n\nNº de pedido: ${pedido[0].id}`; // Incluimos el ID del pedido
      
      const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');

    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      alert('Hubo un error al procesar tu pedido. Por favor, intenta nuevamente.');
    }
  };

  // Generar link para compartir
  const generarLinkCompartir = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const params = new URLSearchParams();
    if (state.clienteInfo.nombre) params.append('nombre', state.clienteInfo.nombre);
    if (state.clienteInfo.telefono) params.append('telefono', state.clienteInfo.telefono);
    
    const urlCompleta = `${baseUrl}?${params.toString()}`;
    navigator.clipboard.writeText(urlCompleta);
    alert('¡Link copiado! Puedes compartirlo con el cliente');
  };

  return (
    <div className="catalogo-mobile">
      {/* Barra superior fija */}
      <header className="app-header">
        <div className="header-content">
          <h1><i className="fas fa-store"></i> CATÁLOGO DISTRIBUCIONES-EBS-HERMANOS-MARIN</h1>
          <button className="cart-button" onClick={toggleMostrarCarrito}>
            <i className="fas fa-shopping-cart"></i>
            {state.productosSeleccionados.length > 0 && (
              <span className="cart-badge">{state.productosSeleccionados.length}</span>
            )}
          </button>
        </div>
        
        {/* Filtros en barra pegajosa */}
        <div className="sticky-filters">
          <div className="search-container">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, código o descripción..."
              value={state.busqueda}
              onChange={handleBusquedaChange}
            />
            {state.busqueda && (
              <button 
                className="clear-search"
                onClick={() => setState(prev => ({ ...prev, busqueda: '' }))}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          <select 
            value={state.categoriaFiltro}
            onChange={handleCategoriaChange}
            className="category-selector"
          >
            <option value="Todas">Todas</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </header>

      {/* Información del cliente */}
      <div className="cliente-info-section">
        <h3>Tus Datos</h3>
        <div className="cliente-form">
          <div className="form-group">
            <input
              type="text"
              name="nombre"
              value={state.clienteInfo.nombre}
              onChange={handleInputChange}
              placeholder="Nombre Completo (Ej: María González)"
              required
            />
          </div>
          <div className="form-group">
            <input
              type="tel"
              name="telefono"
              value={state.clienteInfo.telefono}
              onChange={handleInputChange}
              placeholder="Teléfono (Ej: 3001234567)"
              required
            />
          </div>
          <button 
            className="share-button"
            onClick={generarLinkCompartir}
            disabled={!state.clienteInfo.nombre || !state.clienteInfo.telefono}
          >
            <i className="fas fa-share-alt"></i> Guardar y Compartir Link
          </button>
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
        <div className="product-list">
          {productosFiltrados.map(producto => {
            const estaSeleccionado = state.productosSeleccionados.some(p => p.id === producto.id);
            return (
              <div 
                key={producto.id} 
                className={`product-card ${estaSeleccionado ? 'selected' : ''}`}
                onClick={() => toggleProductoSeleccionado(producto)}
              >
                <div className="product-image-container">
                  <img 
                    src={producto.imagen_url || 'https://via.placeholder.com/150?text=Producto'} 
                    alt={producto.nombre}
                    loading="lazy"
                    className="product-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150?text=Imagen+no+disponible';
                    }}
                  />
                  {estaSeleccionado && (
                    <div className="selected-badge">
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </div>
                
                <div className="product-info">
                  <h3 className="product-name">{producto.nombre}</h3>
                  {producto.codigo && (
                    <p className="product-code">Ref: {producto.codigo}</p>
                  )}
                  <p className="product-price">{formatPrecio(producto.precio)}</p>
                  {producto.categoria && (
                    <span className="product-category">{producto.categoria}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button 
          className="nav-button" 
          onClick={generarLinkCompartir}
          disabled={!state.clienteInfo.nombre || !state.clienteInfo.telefono}
        >
          <i className="fas fa-share-alt"></i>
          <span>Compartir</span>
        </button>
        <button 
          className="whatsapp-button nav-button"
          onClick={generarEnlaceWhatsApp}
          disabled={state.productosSeleccionados.length === 0}
        >
          <i className="fab fa-whatsapp"></i>
          <span>Pedido</span>
        </button>
      </div>

      {/* Notificación de cantidad */}
      {state.showQuantityNotification && (
        <div className="quantity-notification">
          Producto agregado al carrito ({state.productosSeleccionados.length})
        </div>
      )}

      {/* Carrito mejorado */}
      {state.mostrarCarrito && (
        <div className="cart-overlay">
          <div className="cart-content">
            <div className="cart-header">
              <h2>Tu Pedido</h2>
              <button className="close-button" onClick={toggleMostrarCarrito}>
                &times;
              </button>
            </div>
            
            <div className="cart-body">
              {state.productosSeleccionados.length === 0 ? (
                <div className="empty-cart">
                  <i className="fas fa-shopping-basket"></i>
                  <p>No has seleccionado productos</p>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {state.productosSeleccionados.map(producto => (
                      <div key={producto.id} className="cart-item">
                        <div className="item-info">
                          <h4>{producto.nombre}</h4>
                          <span className="item-price">{formatPrecio(producto.precio)} c/u</span>
                        </div>
                        
                        <div className="quantity-controls">
                          <span className="item-total">
                            {formatPrecio(producto.precio * producto.cantidad)}
                          </span>
                          
                          <div className="quantity-selector">
                            <button 
                              className="quantity-btn decrease"
                              onClick={(e) => {
                                e.stopPropagation();
                                actualizarCantidad(producto.id, producto.cantidad - 1);
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              className="quantity-input"
                              value={producto.cantidad}
                              onChange={(e) => {
                                e.stopPropagation();
                                actualizarCantidad(producto.id, e.target.value);
                              }}
                              min="1"
                            />
                            <button 
                              className="quantity-btn increase"
                              onClick={(e) => {
                                e.stopPropagation();
                                actualizarCantidad(producto.id, producto.cantidad + 1);
                              }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        
                        <button 
                          className="remove-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleProductoSeleccionado(producto);
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="order-notes">
                    <label>Notas adicionales:</label>
                    <textarea
                      name="notas"
                      value={state.clienteInfo.notas}
                      onChange={handleInputChange}
                      placeholder="Ej: Necesito el pedido para el viernes..."
                      rows="3"
                    />
                  </div>
                  
                  <div className="cart-total">
                    <span>Total:</span>
                    <span className="total-amount">{formatPrecio(calcularTotal())}</span>
                  </div>

                  {/* Botón de enviar pedido mejorado */}
                  <div className="send-order-container">
                    <button 
                      className="send-order-button"
                      onClick={generarEnlaceWhatsApp}
                      disabled={state.productosSeleccionados.length === 0}
                    >
                      <i className="fab fa-whatsapp"></i> Enviar Pedido por WhatsApp
                      <span className="total-on-button">{formatPrecio(calcularTotal())}</span>
                    </button>
                  </div>
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