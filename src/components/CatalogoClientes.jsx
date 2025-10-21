import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './CatalogoClientes.css';

const CatalogoClientes = () => {
  const [productos, setProductos] = useState([]);
  const [productosSeleccionados, setProductosSeleccionados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [clienteInfo, setClienteInfo] = useState({
    nombre: '',
    telefono: '',
    notas: ''
  });
  const [mostrarCarrito, setMostrarCarrito] = useState(false);
  const [showQuantityNotification, setShowQuantityNotification] = useState(false);
  const [categorias, setCategorias] = useState(['Todas']);
  const [error, setError] = useState(null);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [pedidoEnviado, setPedidoEnviado] = useState(false);
  const [numeroPedido, setNumeroPedido] = useState(null);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [ordenamiento, setOrdenamiento] = useState('nombre-asc');
  const [cantidadesRapidas] = useState([12, 24, 36, 48, 60, 72]);

  const location = useLocation();

  // Cargar productos desde Supabase
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        setError(null);
        
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

        // Extraer categorías únicas
        const categoriasUnicas = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort();
        setCategorias(['Todas', ...categoriasUnicas]);
        setProductos(productos || []);

        // Cargar información del cliente desde URL si existe
        if (location.search) {
          const params = new URLSearchParams(location.search);
          setClienteInfo(prev => ({
            ...prev,
            nombre: params.get('nombre') || '',
            telefono: params.get('telefono') || ''
          }));
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        setError('Error al cargar el catálogo. Intenta nuevamente.');
      } finally {
        setCargando(false);
      }
    };
    
    cargarProductos();
  }, [location.search]);

  // Handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setClienteInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBusquedaChange = (e) => {
    setBusqueda(e.target.value);
  };

  const handleCategoriaChange = (e) => {
    setCategoriaFiltro(e.target.value);
  };

  const handleOrdenamientoChange = (e) => {
    setOrdenamiento(e.target.value);
  };

  const toggleMostrarCarrito = () => {
    setMostrarCarrito(prev => !prev);
  };

  // Función para abrir imagen ampliada
  const abrirImagenAmpliada = (producto, e) => {
    e.stopPropagation();
    setImagenAmpliada(producto);
  };

  // Función para cerrar imagen ampliada
  const cerrarImagenAmpliada = () => {
    setImagenAmpliada(null);
  };

  // Filtrar y ordenar productos
  const productosFiltrados = useCallback(() => {
    let productosFiltrados = productos.filter(producto => {
      const terminoBusqueda = busqueda.toLowerCase();
      const coincideBusqueda = 
        producto.nombre.toLowerCase().includes(terminoBusqueda) || 
        (producto.codigo && producto.codigo.toLowerCase().includes(terminoBusqueda)) ||
        (producto.descripcion && producto.descripcion.toLowerCase().includes(terminoBusqueda));
      
      const coincideCategoria = categoriaFiltro === 'Todas' || producto.categoria === categoriaFiltro;
      
      return coincideBusqueda && coincideCategoria;
    });

    // Aplicar ordenamiento
    productosFiltrados.sort((a, b) => {
      switch (ordenamiento) {
        case 'precio-asc':
          return (a.precio || 0) - (b.precio || 0);
        case 'precio-desc':
          return (b.precio || 0) - (a.precio || 0);
        case 'nombre-asc':
          return a.nombre.localeCompare(b.nombre);
        case 'nombre-desc':
          return b.nombre.localeCompare(a.nombre);
        default:
          return 0;
      }
    });

    return productosFiltrados;
  }, [productos, busqueda, categoriaFiltro, ordenamiento]);

  // Formatear precio
  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio || 0);
  };

  // Manejar selección de productos - AHORA AGREGA AL INICIO
  const toggleProductoSeleccionado = (producto) => {
    const existeIndex = productosSeleccionados.findIndex(p => p.id === producto.id);
    
    if (existeIndex !== -1) {
      setProductosSeleccionados(prev => prev.filter(p => p.id !== producto.id));
    } else {
      const nuevoProducto = { 
        ...producto, 
        cantidad: 1,
        precio: producto.precio || 0,
        fechaAgregado: new Date() // Para mantener el orden
      };
      // Agregar al inicio del array
      setProductosSeleccionados(prev => [nuevoProducto, ...prev]);
      
      // Mostrar notificación
      setShowQuantityNotification(true);
      setTimeout(() => setShowQuantityNotification(false), 2000);
      
      // Mostrar automáticamente el carrito
      if (!mostrarCarrito) {
        setMostrarCarrito(true);
      }
    }
  };

  // Funciones mejoradas para manejar cantidades
  const actualizarCantidad = (id, cantidad, esCantidadRapida = false) => {
    let nuevaCantidad;
    
    if (esCantidadRapida) {
      // Si es una cantidad rápida, sumarla a la cantidad actual
      const cantidadActual = productosSeleccionados.find(p => p.id === id)?.cantidad || 0;
      nuevaCantidad = cantidadActual + cantidad;
    } else {
      // Si es un cambio normal
      nuevaCantidad = Math.max(1, Math.min(parseInt(cantidad) || 1, 999));
    }
    
    // Limitar a 999 como máximo
    nuevaCantidad = Math.min(nuevaCantidad, 999);
    
    setProductosSeleccionados(prev => 
      prev.map(p => p.id === id ? { ...p, cantidad: nuevaCantidad } : p)
    );
  };

  const establecerCantidadExacta = (id, cantidad) => {
    const nuevaCantidad = Math.max(1, Math.min(parseInt(cantidad) || 1, 999));
    
    setProductosSeleccionados(prev => 
      prev.map(p => p.id === id ? { ...p, cantidad: nuevaCantidad } : p)
    );
  };

  // Calcular total
  const calcularTotal = () => {
    return productosSeleccionados.reduce((total, p) => {
      const precio = p.precio || 0;
      const cantidad = p.cantidad || 1;
      return total + (precio * cantidad);
    }, 0);
  };

  // Validar información del cliente
  const validarCliente = () => {
    if (!clienteInfo.nombre.trim()) {
      alert('Por favor ingresa tu nombre completo');
      return false;
    }
    
    if (!clienteInfo.telefono.trim()) {
      alert('Por favor ingresa tu número de teléfono');
      return false;
    }
    
    const telefonoValido = /^[0-9]{10,15}$/.test(clienteInfo.telefono.replace(/\D/g, ''));
    if (!telefonoValido) {
      alert('Por favor ingresa un número de teléfono válido (mínimo 10 dígitos)');
      return false;
    }
    
    return true;
  };

  // Reiniciar para nuevo pedido
  const reiniciarParaNuevoPedido = () => {
    setProductosSeleccionados([]);
    setClienteInfo(prev => ({
      ...prev,
      notas: ''
    }));
    setPedidoEnviado(false);
    setNumeroPedido(null);
    setMostrarCarrito(false);
  };

  // Generar enlace de WhatsApp
  const enviarPedidoWhatsApp = async () => {
    if (enviandoPedido) return;
    
    if (productosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un producto');
      return;
    }

    if (!validarCliente()) {
      return;
    }

    setEnviandoPedido(true);

    try {
      // Guardar el pedido en la base de datos
      const { data: pedido, error } = await supabase
        .from('pedidos')
        .insert([
          {
            cliente_nombre: clienteInfo.nombre.trim(),
            cliente_telefono: clienteInfo.telefono.replace(/\D/g, ''),
            cliente_notas: clienteInfo.notas.trim() || 'Ninguna',
            productos: productosSeleccionados,
            total: calcularTotal(),
            estado: 'pendiente',
            fecha_creacion: new Date().toISOString()
          }
        ])
        .select();

      if (error) throw error;

      setNumeroPedido(pedido[0].id);

      // Preparar mensaje para WhatsApp
      const numeroWhatsApp = '573004583117';
      
      let mensaje = `*¡NUEVO PEDIDO!*%0A%0A`;
      mensaje += `*Cliente:* ${clienteInfo.nombre}%0A`;
      mensaje += `*Teléfono:* ${clienteInfo.telefono}%0A%0A`;
      mensaje += `*📦 PRODUCTOS SELECCIONADOS:*%0A%0A`;
      
      productosSeleccionados.forEach(p => {
        mensaje += `✔️ ${p.nombre}%0A`;
        mensaje += `   Cantidad: ${p.cantidad}%0A`;
        mensaje += `   Precio: ${formatPrecio(p.precio)}%0A`;
        mensaje += `   Subtotal: ${formatPrecio(p.precio * p.cantidad)}%0A%0A`;
      });
      
      mensaje += `*💰 TOTAL: ${formatPrecio(calcularTotal())}*%0A%0A`;
      
      if (clienteInfo.notas.trim()) {
        mensaje += `*📝 NOTAS:*%0A${clienteInfo.notas}%0A%0A`;
      }
      
      mensaje += `*📋 Nº DE PEDIDO:* ${pedido[0].id}%0A`;
      mensaje += `*📅 FECHA:* ${new Date().toLocaleDateString('es-CO')}%0A%0A`;
      mensaje += `_Pedido generado desde Catálogo Digital_`;

      const url = `https://api.whatsapp.com/send?phone=${numeroWhatsApp}&text=${mensaje}`;
      
      setPedidoEnviado(true);
      window.open(url, '_blank');
      
      setTimeout(() => {
        setEnviandoPedido(false);
      }, 2000);

    } catch (error) {
      console.error('Error al guardar el pedido:', error);
      alert('Hubo un error al procesar tu pedido. Por favor, intenta nuevamente.');
      setEnviandoPedido(false);
    }
  };

  // Productos filtrados
  const productosFiltradosLista = productosFiltrados();

  return (
    <div className="catalogo-mobile">
      {/* Barra superior fija */}
      <header className="app-header">
        <div className="header-content">
          <h1><i className="fas fa-store"></i> CATÁLOGO DISTRIBUCIONES-EBS-HERMANOS-MARIN</h1>
          <button className="cart-button" onClick={toggleMostrarCarrito}>
            <i className="fas fa-shopping-cart"></i>
            {productosSeleccionados.length > 0 && (
              <span className="cart-badge">{productosSeleccionados.length}</span>
            )}
          </button>
        </div>
        
        {/* Filtros en barra pegajosa */}
        <div className="sticky-filters">
          <div className="search-container">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Buscar por nombre, código or descripción..."
              value={busqueda}
              onChange={handleBusquedaChange}
            />
            {busqueda && (
              <button 
                className="clear-search"
                onClick={() => setBusqueda('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          
          <div className="filters-row">
            <select 
              value={categoriaFiltro}
              onChange={handleCategoriaChange}
              className="category-selector"
            >
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select 
              value={ordenamiento}
              onChange={handleOrdenamientoChange}
              className="order-selector"
            >
              <option value="nombre-asc">Nombre A-Z</option>
              <option value="nombre-desc">Nombre Z-A</option>
              <option value="precio-asc">Precio: Menor a Mayor</option>
              <option value="precio-desc">Precio: Mayor a Menor</option>
            </select>
          </div>
        </div>
      </header>

      {/* Mensaje de error */}
      {error && (
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      )}

      {/* Lista de productos */}
      {cargando ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando catálogo...</p>
        </div>
      ) : productosFiltradosLista.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <h3>No encontramos productos</h3>
          <p>Prueba con otros términos de búsqueda o selecciona otra categoría</p>
        </div>
      ) : (
        <div className="product-grid-two-columns">
          {productosFiltradosLista.map(producto => {
            const estaSeleccionado = productosSeleccionados.some(p => p.id === producto.id);
            return (
              <div 
                key={producto.id} 
                className={`product-card ${estaSeleccionado ? 'selected' : ''}`}
              >
                <div className="product-image-container">
                  <img 
                    src={producto.imagen_url || 'https://via.placeholder.com/300?text=Producto'} 
                    alt={producto.nombre}
                    loading="lazy"
                    className="product-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/300?text=Imagen+no+disponible';
                    }}
                  />
                  {estaSeleccionado && (
                    <div className="selected-badge">
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                  
                  <button 
                    className="expand-image-btn"
                    onClick={(e) => abrirImagenAmpliada(producto, e)}
                    aria-label="Ampliar imagen"
                  >
                    <i className="fas fa-expand"></i>
                  </button>
                </div>
                
                <div className="product-info">
                  <h3 className="product-name">{producto.nombre}</h3>
                  {producto.codigo && (
                    <p className="product-code">Ref: {producto.codigo}</p>
                  )}
                  {producto.descripcion && (
                    <p className="product-description">{producto.descripcion}</p>
                  )}
                  <p className="product-price">{formatPrecio(producto.precio)}</p>
                  {producto.categoria && (
                    <span className="product-category">{producto.categoria}</span>
                  )}
                  
                  <button 
                    className={`add-to-cart-btn ${estaSeleccionado ? 'added' : ''}`}
                    onClick={() => toggleProductoSeleccionado(producto)}
                  >
                    {estaSeleccionado ? (
                      <>
                        <i className="fas fa-check"></i> Agregado
                      </>
                    ) : (
                      <>
                        <i className="fas fa-cart-plus"></i> Agregar al carrito
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para imagen ampliada */}
      {imagenAmpliada && (
        <div className="image-modal-overlay" onClick={cerrarImagenAmpliada}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={cerrarImagenAmpliada}>
              <i className="fas fa-times"></i>
            </button>
            
            <div className="modal-image-container">
              <img 
                src={imagenAmpliada.imagen_url || 'https://via.placeholder.com/300?text=Producto'} 
                alt={imagenAmpliada.nombre}
                className="modal-image"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/300?text=Imagen+no+disponible';
                }}
              />
            </div>
            
            <div className="modal-product-info">
              <h3>{imagenAmpliada.nombre}</h3>
              {imagenAmpliada.codigo && <p>Ref: {imagenAmpliada.codigo}</p>}
              <p className="modal-price">{formatPrecio(imagenAmpliada.precio)}</p>
              {imagenAmpliada.descripcion && (
                <p className="modal-description">{imagenAmpliada.descripcion}</p>
              )}
            </div>
            
            <button 
              className={`select-product-btn ${productosSeleccionados.some(p => p.id === imagenAmpliada.id) ? 'selected' : ''}`}
              onClick={() => {
                toggleProductoSeleccionado(imagenAmpliada);
                cerrarImagenAmpliada();
              }}
            >
              {productosSeleccionados.some(p => p.id === imagenAmpliada.id) 
                ? '✓ Quitar del pedido' 
                : 'Agregar al pedido'}
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="bottom-nav">
        <button 
          className="whatsapp-button nav-button"
          onClick={toggleMostrarCarrito}
          disabled={productosSeleccionados.length === 0}
        >
          <i className="fab fa-whatsapp"></i>
          <span>Ver Pedido</span>
          {productosSeleccionados.length > 0 && (
            <span className="nav-badge">{productosSeleccionados.length}</span>
          )}
        </button>
        
        <div className="brand-text">
          EBS Hermanos Marin - ING. Edwin Marin 3004583117
        </div>
      </div>

      {/* Notificación de cantidad */}
      {showQuantityNotification && (
        <div className="quantity-notification">
          Producto agregado al carrito ({productosSeleccionados.length})
        </div>
      )}

      {/* Confirmación de pedido enviado */}
      {pedidoEnviado && (
        <div className="confirmation-overlay">
          <div className="confirmation-content">
            <div className="confirmation-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h3>¡Pedido Enviado con Éxito!</h3>
            <p>Tu pedido <strong>#{numeroPedido}</strong> ha sido enviado por WhatsApp.</p>
            <p>En breve nos comunicaremos contigo para confirmarlo.</p>
            <div className="confirmation-buttons">
              <button 
                className="btn-secondary"
                onClick={() => {
                  setPedidoEnviado(false);
                  setMostrarCarrito(true);
                }}
              >
                Ver Detalles
              </button>
              <button 
                className="btn-primary"
                onClick={reiniciarParaNuevoPedido}
              >
                Hacer Otro Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrito mejorado con botones horizontales y orden inverso */}
      {mostrarCarrito && (
        <div className="cart-overlay">
          <div className="cart-content">
            <div className="cart-header">
              <h2>Tu Pedido {numeroPedido && `#${numeroPedido}`}</h2>
              <button className="close-button" onClick={toggleMostrarCarrito}>
                &times;
              </button>
            </div>
            
            <div className="cart-body">
              {productosSeleccionados.length === 0 ? (
                <div className="empty-cart">
                  <i className="fas fa-shopping-basket"></i>
                  <p>No has seleccionado productos</p>
                  <button 
                    className="btn-primary"
                    onClick={toggleMostrarCarrito}
                  >
                    Seguir Comprando
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-items">
                    {/* Los productos se muestran en orden inverso (último agregado primero) */}
                    {productosSeleccionados.map(producto => (
                      <div key={producto.id} className="cart-item" data-id={producto.id}>
                        {/* Badge para cantidades grandes */}
                        {(producto.cantidad || 1) >= 12 && (
                          <div className="large-quantity-badge">
                            <i className="fas fa-bolt"></i> Lote {(producto.cantidad || 1)}u
                          </div>
                        )}
                        
                        {/* Imagen del producto en el carrito */}
                        <div className="cart-item-image-container">
                          <img 
                            src={producto.imagen_url || 'https://via.placeholder.com/100?text=Producto'} 
                            alt={producto.nombre}
                            className="cart-item-image"
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/100?text=Imagen+no+disponible';
                            }}
                          />
                        </div>
                        
                        <div className="item-info">
                          <h4>{producto.nombre}</h4>
                          <span className="item-price">{formatPrecio(producto.precio)} c/u</span>
                          
                          {/* Botones de cantidades rápidas EN HORIZONTAL */}
                          <div className="quick-quantity-buttons">
                            <span className="quick-quantity-label">Agregar:</span>
                            <div className="quick-quantity-grid">
                              {cantidadesRapidas.map(cantidad => (
                                <button
                                  key={cantidad}
                                  className="quick-quantity-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    actualizarCantidad(producto.id, cantidad, true);
                                  }}
                                  title={`Agregar ${cantidad} unidades`}
                                >
                                  +{cantidad}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="quantity-controls">
                          <span className="item-total">
                            {formatPrecio((producto.precio || 0) * (producto.cantidad || 1))}
                          </span>
                          
                          <div className="quantity-selector">
                            <button 
                              className="quantity-btn decrease"
                              onClick={(e) => {
                                e.stopPropagation();
                                actualizarCantidad(producto.id, (producto.cantidad || 1) - 1);
                              }}
                            >
                              −
                            </button>
                            <input
                              type="number"
                              className="quantity-input"
                              value={producto.cantidad || 1}
                              onChange={(e) => {
                                e.stopPropagation();
                                establecerCantidadExacta(producto.id, e.target.value);
                              }}
                              onBlur={(e) => {
                                if (!e.target.value || parseInt(e.target.value) < 1) {
                                  establecerCantidadExacta(producto.id, 1);
                                }
                              }}
                              min="1"
                              max="999"
                            />
                            <button 
                              className="quantity-btn increase"
                              onClick={(e) => {
                                e.stopPropagation();
                                actualizarCantidad(producto.id, (producto.cantidad || 1) + 1);
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
                  
                  {/* Información del cliente */}
                  <div className="cliente-info-cart">
                    <h3>Completa tus datos para enviar el pedido</h3>
                    <div className="cliente-form">
                      <div className="form-group">
                        <label htmlFor="nombre-cliente">Nombre Completo *</label>
                        <input
                          id="nombre-cliente"
                          type="text"
                          name="nombre"
                          value={clienteInfo.nombre}
                          onChange={handleInputChange}
                          placeholder="Ej: María González"
                          className={!clienteInfo.nombre.trim() ? 'input-error' : ''}
                        />
                        {!clienteInfo.nombre.trim() && <span className="error-text">Campo obligatorio</span>}
                      </div>
                      <div className="form-group">
                        <label htmlFor="telefono-cliente">Teléfono *</label>
                        <input
                          id="telefono-cliente"
                          type="tel"
                          name="telefono"
                          value={clienteInfo.telefono}
                          onChange={handleInputChange}
                          placeholder="Ej: 3001234567"
                          className={!clienteInfo.telefono.trim() ? 'input-error' : ''}
                        />
                        {!clienteInfo.telefono.trim() && <span className="error-text">Campo obligatorio</span>}
                        <small>El teléfono debe tener al menos 10 dígitos</small>
                      </div>
                    </div>
                  </div>
                  
                  <div className="order-notes">
                    <label>Notas adicionales (opcional):</label>
                    <textarea
                      name="notas"
                      value={clienteInfo.notas}
                      onChange={handleInputChange}
                      placeholder="Ej: Necesito el pedido para el viernes, local, direccion, etc."
                      rows="3"
                    />
                  </div>
                  
                  <div className="cart-total">
                    <span>Total:</span>
                    <span className="total-amount">{formatPrecio(calcularTotal())}</span>
                  </div>

                  {/* Botones de acción */}
                  <div className="cart-actions">
                    <button 
                      className="continue-shopping-btn"
                      onClick={toggleMostrarCarrito}
                    >
                      <i className="fas fa-arrow-left"></i> Seguir Comprando
                    </button>
                    
                    <div className="send-order-container">
                      <button 
                        className="send-order-button"
                        onClick={enviarPedidoWhatsApp}
                        disabled={enviandoPedido}
                      >
                        {enviandoPedido ? (
                          <>
                            <div className="loading-spinner-small"></div>
                            Enviando...
                          </>
                        ) : (
                          <>
                            <i className="fab fa-whatsapp"></i> 
                            Enviar Pedido por WhatsApp
                          </>
                        )}
                        <span className="total-on-button">{formatPrecio(calcularTotal())}</span>
                      </button>
                    </div>
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