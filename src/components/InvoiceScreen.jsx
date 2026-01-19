import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import FacturaPreview from './FacturaPreview';
import ClientesScreen from './ClientesScreen';
import { supabase } from './supabaseClient';
import './InvoiceScreen.css';

const InvoiceScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
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
  const [erroresStock, setErroresStock] = useState({});

  const vendedores = ['Edwin Marin', 'Fredy Marin', 'Fabian Marin'];

  // Cargar datos del pedido si vienen desde GestionPedidos
  useEffect(() => {
    if (location.state?.pedidoData) {
      const { pedidoData } = location.state;
      setCliente(pedidoData.cliente || '');
      setTelefono(pedidoData.telefono || '');
      setDireccion(pedidoData.direccion || '');
      setCorreo(pedidoData.correo || '');
      setProductos(pedidoData.productos || []);
      
      // Limpiar el state para que no se recargue al volver
      window.history.replaceState({}, document.title);
      
      // Mostrar mensaje de confirmación
      setTimeout(() => {
        alert('✅ Pedido cargado exitosamente\n\nPuedes modificar los datos antes de guardar la factura.');
      }, 100);
    }
  }, [location.state]);

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

  // Sincronizar productos cargados (desde pedido) con catálogo para obtener producto_id
  useEffect(() => {
    if (!productosCatalogo.length) return;
    const haySinId = productos.some(p => !p.producto_id);
    if (!haySinId) return;

    let huboCambios = false;
    const productosActualizados = productos.map(p => {
      if (p.producto_id) return p;

      const coincidencia = productosCatalogo.find(pc =>
        (pc.nombre || '').trim().toLowerCase() === (p.nombre || '').trim().toLowerCase()
      );

      if (!coincidencia) return p;
      huboCambios = true;
      return {
        ...p,
        producto_id: coincidencia.id,
        codigo: p.codigo || coincidencia.codigo || '',
        precio: p.precio ?? coincidencia.precio ?? 0
      };
    });

    if (huboCambios) {
      setProductos(productosActualizados);
    }
  }, [productosCatalogo, productos]);

  // Función para verificar stock disponible
  const verificarStockDisponible = (productoId, cantidadRequerida) => {
    const producto = productosCatalogo.find(p => p.id === productoId);
    if (!producto) return 0;
    
    // Verificar si hay stock definido (puede ser null/undefined)
    const stockActual = producto.stock !== null && producto.stock !== undefined 
      ? producto.stock 
      : Infinity;
    
    // Retornar la diferencia real; si es < 0 no hay suficiente stock
    return stockActual - cantidadRequerida;
  };

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

    // Buscar el producto en el catálogo para verificar stock
    const productoCatalogo = productosCatalogo.find(p => 
      p.nombre.toLowerCase() === nombreProducto.toLowerCase()
    );

    if (productoCatalogo && productoCatalogo.stock !== null && productoCatalogo.stock !== undefined) {
      const stockDisponible = verificarStockDisponible(productoCatalogo.id, cantidad);
      
      if (stockDisponible < 0) {
        alert(`No hay suficiente stock. Solo quedan ${productoCatalogo.stock} unidades.`);
        return;
      }
    }

    const nuevoProducto = {
      id: Date.now(),
      nombre: nombreProducto,
      cantidad: cantidad,
      precio: precio,
      producto_id: productoCatalogo?.id || null
    };

    setProductos([...productos, nuevoProducto]);
    setNombreProducto('');
    setCantidadProducto('');
    setPrecioProducto('');
    setErroresStock({});
  };

  // Función para agregar desde catálogo
  const agregarProductoDesdeCatalogo = (producto) => {
    if (!producto || !producto.nombre || !producto.precio) {
      console.error('Producto inválido:', producto);
      return;
    }

    // Verificar stock antes de agregar
    if (producto.stock !== null && producto.stock !== undefined && producto.stock <= 0) {
      alert('No hay stock disponible para este producto');
      return;
    }

    setProductos(prevProductos => {
      const existe = prevProductos.find(p => p.producto_id === producto.id);
      
      if (existe) {
        // Verificar si al aumentar la cantidad se supera el stock
        const nuevaCantidad = existe.cantidad + 1;
        const stockDisponible = verificarStockDisponible(producto.id, nuevaCantidad);
        
        if (stockDisponible < 0) {
          alert(`No hay suficiente stock. Solo quedan ${producto.stock} unidades.`);
          return prevProductos;
        }
        
        return prevProductos.map(p => 
          p.producto_id === producto.id 
            ? { ...p, cantidad: nuevaCantidad } 
            : p
        );
      }
      
      // Verificar stock para nuevo producto
      const stockDisponible = verificarStockDisponible(producto.id, 1);
      if (stockDisponible < 0) {
        alert(`No hay suficiente stock. Solo quedan ${producto.stock} unidades.`);
        return prevProductos;
      }
      
      return [
        ...prevProductos,
        {
          id: producto.id || Date.now(),
          nombre: producto.nombre,
          cantidad: 1,
          precio: producto.precio,
          codigo: producto.codigo || '',
          producto_id: producto.id
        }
      ];
    });
    
    setErroresStock({});
    setMostrarCatalogo(false);
  };

  // Función para actualizar inventario después de una venta
  const actualizarInventario = async (productosVendidos) => {
    try {
      for (const producto of productosVendidos) {
        if (producto.producto_id) {
          // Obtener el producto actual de la base de datos
          const { data: productoActual, error } = await supabase
            .from('productos')
            .select('stock, activo')
            .eq('id', producto.producto_id)
            .single();
          
          if (error) throw error;
          
          // Calcular nuevo stock
          const stockActual = productoActual.stock !== null ? productoActual.stock : 0;
          const nuevoStock = Math.max(0, stockActual - producto.cantidad);
          
          // Determinar si debe desactivarse (cuando stock llega a 0)
          const estaraActivo = nuevoStock > 0 ? productoActual.activo : false;
          
          // Actualizar el stock y estado activo en la base de datos
          const { error: updateError } = await supabase
            .from('productos')
            .update({ 
              stock: nuevoStock,
              activo: estaraActivo
            })
            .eq('id', producto.producto_id);
          
          if (updateError) throw updateError;
          
          const desactivado = nuevoStock === 0 ? ' (DESACTIVADO)' : '';
          console.log(`Stock actualizado para ${producto.nombre}: ${stockActual} -> ${nuevoStock}${desactivado}`);
        }
      }
    } catch (error) {
      console.error('Error actualizando inventario:', error);
      throw new Error('No se pudo actualizar el inventario');
    }
  };

  // Funciones para gestión de productos
  const eliminarProducto = (id) => {
    setProductos(productos.filter(p => p.id !== id));
    setErroresStock(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  // Función para actualizar cantidad rápidamente
  const actualizarCantidadRapida = (productoId, incremento) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    const nuevaCantidad = Math.max(1, producto.cantidad + incremento);

    // Verificar stock si es un producto del catálogo
    if (producto.producto_id) {
      const stockDisponible = verificarStockDisponible(producto.producto_id, nuevaCantidad);
      
      if (stockDisponible < 0) {
        const productoCatalogo = productosCatalogo.find(p => p.id === producto.producto_id);
        alert(`No hay suficiente stock. Solo quedan ${productoCatalogo.stock} unidades.`);
        return;
      }
    }

    const productosActualizados = productos.map(p => 
      p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
    );
    
    setProductos(productosActualizados);
    setErroresStock(prev => {
      const newErrors = { ...prev };
      delete newErrors[productoId];
      return newErrors;
    });
  };

  // Función para sumar docenas acumulativamente (+12 y +24)
  const sumarDocenas = (productoId, cantidadASumar) => {
    const producto = productos.find(p => p.id === productoId);
    if (!producto) return;

    // Sumar la cantidad a la cantidad actual (acumulativo)
    const nuevaCantidad = producto.cantidad + cantidadASumar;

    // Verificar stock si es un producto del catálogo
    if (producto.producto_id) {
      const stockDisponible = verificarStockDisponible(producto.producto_id, nuevaCantidad);
      
      if (stockDisponible < 0) {
        const productoCatalogo = productosCatalogo.find(p => p.id === producto.producto_id);
        alert(`No hay suficiente stock. Solo quedan ${productoCatalogo.stock} unidades.`);
        return;
      }
    }

    const productosActualizados = productos.map(p => 
      p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p
    );
    
    setProductos(productosActualizados);
    setErroresStock(prev => {
      const newErrors = { ...prev };
      delete newErrors[productoId];
      return newErrors;
    });
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

    const producto = productos.find(p => p.id === id);
    if (!producto) return;

    // Verificar stock si es un producto del catálogo
    if (producto.producto_id) {
      const stockDisponible = verificarStockDisponible(producto.producto_id, cantidad);
      
      if (stockDisponible < 0) {
        const productoCatalogo = productosCatalogo.find(p => p.id === producto.producto_id);
        alert(`No hay suficiente stock. Solo quedan ${productoCatalogo.stock} unidades.`);
        return;
      }
    }

    const productosActualizados = productos.map(p => 
      p.id === id ? { ...p, cantidad: cantidad } : p
    );
    
    setProductos(productosActualizados);
    setEditandoProductoId(null);
    setCantidadEditada('');
    setErroresStock(prev => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const cancelarEdicion = () => {
    setEditandoProductoId(null);
    setCantidadEditada('');
  };

  // Función para verificar stock antes de mostrar la vista previa
  const verificarStockAntesDeVenta = () => {
    const errores = {};
    
    for (const producto of productos) {
      if (producto.producto_id) {
        const stockDisponible = verificarStockDisponible(producto.producto_id, producto.cantidad);
        
        if (stockDisponible < 0) {
          const productoCatalogo = productosCatalogo.find(p => p.id === producto.producto_id);
          errores[producto.id] = `Solo ${productoCatalogo.stock} disponibles`;
        }
      }
    }
    
    setErroresStock(errores);
    return Object.keys(errores).length === 0;
  };

  // Funciones para factura
  const mostrarPrevia = () => {
    if (!cliente || productos.length === 0 || !vendedorSeleccionado) {
      alert('Complete cliente, vendedor y agregue productos');
      return;
    }
    
    // Verificar stock antes de continuar
    if (!verificarStockAntesDeVenta()) {
      alert('Hay problemas de stock con algunos productos. Revise las cantidades.');
      return;
    }
    
    setMostrarVistaPrevia(true);
  };

  // Función para limpiar el formulario
  const limpiarFormulario = () => {
    setCliente('');
    setDireccion('');
    setTelefono('');
    setCorreo('');
    setProductos([]);
    setVendedorSeleccionado('');
    setErroresStock({});
  };

  // ⭐⭐ MODIFICACIÓN - Función guardarFactura con opción de imprimir ⭐⭐
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

      // Obtener el ID de la factura guardada
      const facturaGuardada = data[0];
      const numeroFactura = facturaGuardada.id;

      // Actualizar inventario después de guardar la factura
      await actualizarInventario(productos);

      // Mostrar diálogo de confirmación con opción de imprimir
      const usuarioQuiereImprimir = window.confirm(
        `✅ Factura guardada exitosamente!\n\nN° Factura: ${numeroFactura}\nCliente: ${cliente}\nTotal: $${facturaData.total.toFixed(2)}\n\n¿Deseas imprimir la factura ahora?`
      );

      setMostrarVistaPrevia(false);
      
      if (usuarioQuiereImprimir) {
        // Navegar a la vista de detalle para imprimir
        navigate(`/factura/${numeroFactura}`);
      } else {
        // Limpiar formulario si no quiere imprimir
        limpiarFormulario();
      }
      
    } catch (error) {
      console.error('Error guardando factura:', error);
      alert('Error al guardar la factura: ' + error.message);
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
                    className={`producto-catalogo-item ${producto.stock === 0 ? 'sin-stock' : ''}`}
                    onClick={() => producto.stock !== 0 && agregarProductoDesdeCatalogo(producto)}
                  >
                    <div className="producto-info">
                      <h4>{producto.nombre}</h4>
                      {producto.codigo && <span className="producto-codigo">#{producto.codigo}</span>}
                    </div>
                    <div className="producto-details">
                      <div className="producto-precio">
                        ${producto.precio?.toFixed(2) || '0.00'}
                      </div>
                      <div className={`producto-stock ${producto.stock === 0 ? 'stock-agotado' : producto.stock < 5 ? 'stock-bajo' : 'stock-disponible'}`}>
                        {producto.stock !== null ? `${producto.stock} disponibles` : 'Stock ilimitado'}
                      </div>
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

          {/* Información del cliente */}
          <div className="customer-info-section">
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
          </div>

          {/* Sección de productos */}
          <div className="products-main-section">
            <div className="add-products-section">
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

            {/* Lista de productos */}
            {productos.length > 0 && (
              <div className="productos-list-expanded">
                <div className="productos-header">
                  <h3>Productos Agregados ({productos.length})</h3>
                  <div className="total-preview">
                    Total: <span className="total-amount">${total.toFixed(2)}</span>
                  </div>
                </div>
                <div className="productos-grid">
                  {productos.map((p) => (
                    <div key={p.id} className={`producto-item-expanded ${erroresStock[p.id] ? 'error-stock' : ''}`}>
                      <div className="producto-main-info">
                        <span className="producto-nombre">{p.nombre}</span>
                        <div className="producto-precio-info">
                          <span className="producto-detalle">
                            {p.cantidad} x ${p.precio.toFixed(2)} = <strong>${(p.cantidad * p.precio).toFixed(2)}</strong>
                          </span>
                          {erroresStock[p.id] && (
                            <span className="error-message"> - {erroresStock[p.id]}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="producto-controls-expanded">
                        <div className="controles-rapidos-supercompactos">
                          <div className="botones-rapidos-linea">
                            <button 
                              className="button micro-button cantidad-rapida-btn"
                              onClick={() => actualizarCantidadRapida(p.id, -1)}
                              title="Reducir 1"
                            >
                              -1
                            </button>
                            <button 
                              className="button micro-button cantidad-rapida-btn"
                              onClick={() => actualizarCantidadRapida(p.id, 1)}
                              title="Agregar 1"
                            >
                              +1
                            </button>
                            <button 
                              className="button micro-button cantidad-rapida-btn suma-docena"
                              onClick={() => sumarDocenas(p.id, 12)}
                              title="Agregar docena (+12)"
                            >
                              +12
                            </button>
                            <button 
                              className="button micro-button cantidad-rapida-btn suma-docena"
                              onClick={() => sumarDocenas(p.id, 24)}
                              title="Agregar 2 docenas (+24)"
                            >
                              +24
                            </button>
                          </div>
                          
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
                                className="button micro-button success-button"
                                onClick={() => guardarEdicionCantidad(p.id)}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button 
                                className="button micro-button danger-button"
                                onClick={cancelarEdicion}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <div className="acciones-principales">
                              <button
                                className="button micro-button info-button"
                                onClick={() => iniciarEdicionCantidad(p)}
                                title="Editar cantidad manualmente"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="button micro-button danger-button"
                                onClick={() => eliminarProducto(p.id)}
                                title="Eliminar producto"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción en la parte inferior */}
          <div className="action-buttons-bottom">
            <button 
              className="button preview-button main-action-button" 
              onClick={mostrarPrevia}
              disabled={productos.length === 0 || !cliente || !vendedorSeleccionado || Object.keys(erroresStock).length > 0}
            >
              <i className="fas fa-eye"></i> Vista Previa y Guardar
            </button>
            
            <div className="secondary-actions-grid">
              <button
                className="button secondary-button"
                onClick={() => navigate('/facturas')}
              >
                <i className="fas fa-file-invoice"></i> Ver Facturas
              </button>
              <button
                className="button info-button"
                onClick={() => navigate('/catalogo')}
              >
                <i className="fas fa-cog"></i> Administrar Catálogo
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
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceScreen;