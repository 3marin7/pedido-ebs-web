import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FacturaPreview from './FacturaPreview';
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
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    correo: '',
    clasificacion: 3
  });
  const [clientes, setClientes] = useState([]);
  const [importandoClientes, setImportandoClientes] = useState(false);
  const [filtroClasificacion, setFiltroClasificacion] = useState(0);
  const [clienteEditando, setClienteEditando] = useState(null);

  const vendedores = ['Edwin Marin', 'Fredy Marin', 'Fabian Marin'];

  // Cargar datos iniciales
  useEffect(() => {
    const productosGuardados = JSON.parse(localStorage.getItem('productos')) || [];
    setProductosCatalogo(productosGuardados);
    
    const clientesGuardados = JSON.parse(localStorage.getItem('clientes')) || [];
    setClientes(clientesGuardados);
  }, []);

  // Función para determinar clasificación automática
  const determinarClasificacionAutomatica = (nombreCliente) => {
    const facturas = JSON.parse(localStorage.getItem('facturas')) || [];
    const facturasCliente = facturas.filter(f => f.cliente === nombreCliente);
    
    if (facturasCliente.length === 0) return 3;
    
    const totalGastado = facturasCliente.reduce((sum, f) => sum + f.total, 0);
    const promedioPorFactura = totalGastado / facturasCliente.length;
    const frecuenciaCompras = facturasCliente.length / (facturas.length || 1);
    
    let puntaje = 3;
    if (totalGastado > 5000000) puntaje += 1;
    if (totalGastado > 10000000) puntaje += 1;
    if (totalGastado < 1000000) puntaje -= 1;
    
    if (promedioPorFactura > 500000) puntaje += 1;
    if (promedioPorFactura < 100000) puntaje -= 1;
    
    if (frecuenciaCompras > 0.5) puntaje += 1;
    if (frecuenciaCompras < 0.1) puntaje -= 1;
    
    return Math.min(Math.max(puntaje, 1), 5);
  };

  // Función para agregar producto manualmente
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
    if (!cantidadEditada || isNaN(cantidadEditada)) {
      alert('Ingrese una cantidad válida');
      return;
    }

    const productosActualizados = productos.map(p => 
      p.id === id ? { ...p, cantidad: parseInt(cantidadEditada) } : p
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
      total: productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0),
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

  // Funciones para gestión de clientes
  const iniciarEdicionCliente = (cliente) => {
    setClienteEditando(cliente);
    setNuevoCliente({
      nombre: cliente.nombre,
      direccion: cliente.direccion,
      telefono: cliente.telefono,
      correo: cliente.correo,
      clasificacion: cliente.clasificacion
    });
  };

  const cancelarEdicionCliente = () => {
    setClienteEditando(null);
    setNuevoCliente({
      nombre: '',
      direccion: '',
      telefono: '',
      correo: '',
      clasificacion: 3
    });
  };

  const guardarCliente = () => {
    if (!nuevoCliente.nombre) {
      alert('El nombre del cliente es obligatorio');
      return;
    }

    const clienteExistente = clientes.find(c => 
      c.nombre.toLowerCase() === nuevoCliente.nombre.toLowerCase()
    );

    if (clienteExistente && !clienteEditando) {
      alert('Ya existe un cliente con ese nombre');
      return;
    }

    if (clienteEditando) {
      // Actualizar cliente existente
      const clientesActualizados = clientes.map(c => 
        c.id === clienteEditando.id ? { ...nuevoCliente, id: clienteEditando.id } : c
      );
      setClientes(clientesActualizados);
      localStorage.setItem('clientes', JSON.stringify(clientesActualizados));
    } else {
      // Crear nuevo cliente
      const clasificacion = nuevoCliente.clasificacion || determinarClasificacionAutomatica(nuevoCliente.nombre);
      const nuevoClienteConId = {
        ...nuevoCliente,
        id: Date.now(),
        clasificacion,
        fechaRegistro: new Date().toISOString()
      };
      const clientesActualizados = [...clientes, nuevoClienteConId];
      setClientes(clientesActualizados);
      localStorage.setItem('clientes', JSON.stringify(clientesActualizados));
    }
    
    setNuevoCliente({
      nombre: '',
      direccion: '',
      telefono: '',
      correo: '',
      clasificacion: 3
    });
    setClienteEditando(null);
    
    alert('Cliente guardado exitosamente!');
  };

  const seleccionarCliente = (cliente) => {
    setCliente(cliente.nombre);
    setDireccion(cliente.direccion || '');
    setTelefono(cliente.telefono || '');
    setCorreo(cliente.correo || '');
    setMostrarClientes(false);
  };

  // Función para exportar clientes mejorada
  const exportarClientes = () => {
    try {
      if (clientes.length === 0) {
        alert('No hay clientes para exportar');
        return;
      }

      // Estructura de exportación mejorada
      const datosExportacion = {
        metadata: {
          sistema: "EBS Facturación",
          version: "1.0",
          fechaExportacion: new Date().toISOString(),
          totalClientes: clientes.length
        },
        clientes: clientes.map(cliente => ({
          id: cliente.id,
          nombre: cliente.nombre,
          direccion: cliente.direccion || '',
          telefono: cliente.telefono || '',
          correo: cliente.correo || '',
          clasificacion: cliente.clasificacion || 3,
          fechaRegistro: cliente.fechaRegistro || new Date().toISOString()
        }))
      };

      const dataStr = JSON.stringify(datosExportacion, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `clientes_ebs_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Liberar memoria
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      alert(`✅ Se exportaron ${clientes.length} clientes correctamente`);
    } catch (error) {
      console.error('Error al exportar clientes:', error);
      alert('❌ Ocurrió un error al exportar los clientes. Verifica la consola para más detalles.');
    }
  };

  // Función para importar clientes mejorada
  const importarClientes = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImportandoClientes(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const contenido = e.target.result;
        const datosImportados = JSON.parse(contenido);
        
        // Validación 1: Estructura básica del archivo
        if (!datosImportados || !Array.isArray(datosImportados.clientes)) {
          throw new Error("El archivo no tiene el formato correcto. Debe contener un array 'clientes'");
        }
        
        const clientesImportados = datosImportados.clientes;
        const clientesActuales = JSON.parse(localStorage.getItem('clientes')) || [];
        
        // Validación 2: Campos obligatorios y normalización
        const clientesValidados = clientesImportados.map((cliente, index) => {
          if (!cliente.nombre) {
            throw new Error(`Cliente en posición ${index} no tiene nombre`);
          }
          
          // Normalizar clasificación (1-5)
          let clasificacion = 3;
          if (cliente.clasificacion !== undefined) {
            clasificacion = Math.max(1, Math.min(5, parseInt(cliente.clasificacion) || 3));
          }
          
          return {
            id: cliente.id || Date.now() + index,
            nombre: cliente.nombre.toString().trim(),
            direccion: cliente.direccion ? cliente.direccion.toString().trim() : '',
            telefono: cliente.telefono ? cliente.telefono.toString().trim() : '',
            correo: cliente.correo ? cliente.correo.toString().trim() : '',
            clasificacion: clasificacion,
            fechaRegistro: cliente.fechaRegistro || new Date().toISOString()
          };
        });
        
        // Detectar duplicados por ID y nombre
        const nombresExistentes = new Set(clientesActuales.map(c => c.nombre.toLowerCase()));
        const nuevosClientes = clientesValidados.filter(c => 
          !nombresExistentes.has(c.nombre.toLowerCase())
        );
        
        if (nuevosClientes.length === 0) {
          alert('⚠️ Todos los clientes en el archivo ya existen en el sistema');
          return;
        }
        
        const confirmacion = window.confirm(
          `📊 Resumen de Importación:\n\n` +
          `• Clientes en archivo: ${clientesImportados.length}\n` +
          `• Nuevos clientes a importar: ${nuevosClientes.length}\n` +
          `• Clientes duplicados (no se importarán): ${clientesImportados.length - nuevosClientes.length}\n\n` +
          `¿Desea continuar con la importación?`
        );
        
        if (confirmacion) {
          const clientesActualizados = [...clientesActuales, ...nuevosClientes];
          localStorage.setItem('clientes', JSON.stringify(clientesActualizados));
          setClientes(clientesActualizados);
          
          alert(`🎉 Importación completada!\n\nSe agregaron ${nuevosClientes.length} nuevos clientes.`);
        }
      } catch (error) {
        console.error("Error importando clientes:", error);
        alert(`❌ Error al importar: ${error.message}\n\nVerifica que el archivo tenga el formato correcto.`);
      } finally {
        setImportandoClientes(false);
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      alert("❌ Error al leer el archivo. Asegúrese de seleccionar un archivo JSON válido.");
      setImportandoClientes(false);
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };

  // Filtros
  const productosFiltrados = productosCatalogo.filter(producto => 
    producto.nombre.toLowerCase().includes(busquedaCatalogo.toLowerCase()) ||
    (producto.codigo && producto.codigo.toLowerCase().includes(busquedaCatalogo.toLowerCase()))
  );

  const clientesFiltrados = clientes.filter(cliente => {
    const coincideNombre = cliente.nombre.toLowerCase().includes(busquedaCliente.toLowerCase());
    const coincideTelefono = cliente.telefono && cliente.telefono.includes(busquedaCliente);
    const coincideCorreo = cliente.correo && cliente.correo.toLowerCase().includes(busquedaCliente.toLowerCase());
    const coincideClasificacion = filtroClasificacion === 0 || cliente.clasificacion === filtroClasificacion;
    
    return (coincideNombre || coincideTelefono || coincideCorreo) && coincideClasificacion;
  });

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
            total: productos.reduce((sum, p) => sum + (p.cantidad * p.precio), 0),
          }}
          onVolver={() => setMostrarVistaPrevia(false)}
          onGuardar={guardarFactura}
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
                      ${producto.precio.toFixed(2)}
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
        <div className="clientes-modal">
          <div className="clientes-content">
            <div className="clientes-header">
              <h2>{clienteEditando ? 'Editar Cliente' : 'Seleccionar Cliente'}</h2>
              <button 
                className="button secondary-button"
                onClick={() => {
                  setMostrarClientes(false);
                  cancelarEdicionCliente();
                }}
              >
                Volver
              </button>
            </div>
            
            <div className="clientes-search">
              <input
                type="text"
                placeholder="🔍 Buscar cliente..."
                value={busquedaCliente}
                onChange={(e) => setBusquedaCliente(e.target.value)}
              />
            </div>

            <div className="clientes-filters">
              <label>Filtrar por clasificación:</label>
              <select 
                value={filtroClasificacion} 
                onChange={(e) => setFiltroClasificacion(Number(e.target.value))}
              >
                <option value={0}>Todas</option>
                <option value={1}>1 ★</option>
                <option value={2}>2 ★★</option>
                <option value={3}>3 ★★★</option>
                <option value={4}>4 ★★★★</option>
                <option value={5}>5 ★★★★★</option>
              </select>
            </div>
            
            <div className="clientes-stats">
              <h4>Estadísticas de Clientes:</h4>
              <div className="stats-grid">
                {[5, 4, 3, 2, 1].map(star => (
                  <div key={star} className="stat-item">
                    <span className={`clasificacion-badge clasificacion-${star}`}>
                      {star} {'★'.repeat(star)}
                    </span>
                    <span>
                      {clientes.filter(c => c.clasificacion === star).length} clientes
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {!clienteEditando && (
              <div className="clientes-list">
                {clientesFiltrados.length > 0 ? (
                  clientesFiltrados.map(cliente => (
                    <div 
                      key={cliente.id} 
                      className="cliente-item"
                    >
                      <div 
                        className="cliente-info"
                        onClick={() => seleccionarCliente(cliente)}
                      >
                        <h4>{cliente.nombre}</h4>
                        <div className={`clasificacion-badge clasificacion-${cliente.clasificacion}`}>
                          {cliente.clasificacion} {'★'.repeat(cliente.clasificacion)}
                        </div>
                        {cliente.telefono && <p>Tel: {cliente.telefono}</p>}
                        {cliente.correo && <p>Email: {cliente.correo}</p>}
                        {cliente.direccion && <p>Dir: {cliente.direccion}</p>}
                      </div>
                      <div className="cliente-acciones">
                        <button
                          className="button info-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            iniciarEdicionCliente(cliente);
                          }}
                        >
                          <i className="fas fa-edit"></i> Editar
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-clientes">
                    <p>No se encontraron clientes</p>
                  </div>
                )}
              </div>
            )}
            
            <div className="nuevo-cliente-form">
              <h3>{clienteEditando ? 'Editar Cliente' : 'Agregar Nuevo Cliente'}</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Nombre *</label>
                  <input
                    type="text"
                    value={nuevoCliente.nombre}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                    placeholder="Nombre completo"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Teléfono</label>
                  <input
                    type="tel"
                    value={nuevoCliente.telefono}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Correo</label>
                  <input
                    type="email"
                    value={nuevoCliente.correo}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, correo: e.target.value})}
                    placeholder="Opcional"
                  />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={nuevoCliente.direccion}
                    onChange={(e) => setNuevoCliente({...nuevoCliente, direccion: e.target.value})}
                    placeholder="Opcional"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Clasificación (1-5)</label>
                  <div className="clasificacion-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`star ${star <= nuevoCliente.clasificacion ? 'filled' : ''}`}
                        onClick={() => setNuevoCliente({...nuevoCliente, clasificacion: star})}
                      >
                        ★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="form-buttons">
                <button 
                  className="button primary-button"
                  onClick={guardarCliente}
                >
                  {clienteEditando ? 'Actualizar Cliente' : 'Guardar Cliente'}
                </button>
                
                {clienteEditando && (
                  <button 
                    className="button secondary-button"
                    onClick={cancelarEdicionCliente}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            <div className="clientes-actions">
              <button 
                className="button info-button"
                onClick={exportarClientes}
                disabled={clientes.length === 0 || importandoClientes}
              >
                <i className="fas fa-file-export"></i> Exportar Clientes
                {clientes.length > 0 && (
                  <span className="badge-count">{clientes.length}</span>
                )}
              </button>
              
              <label 
                htmlFor="importar-clientes" 
                className={`button warning-button ${importandoClientes ? 'disabled' : ''}`}
              >
                <i className="fas fa-file-import"></i> 
                {importandoClientes ? 'Importando...' : 'Importar Clientes'}
              </label>
              
              <input
                type="file"
                id="importar-clientes"
                accept=".json,application/json"
                onChange={importarClientes}
                disabled={importandoClientes}
                style={{ display: 'none' }}
              />
              
              {importandoClientes && (
                <div className="import-progress">
                  <div className="spinner"></div>
                  <span>Procesando archivo...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Formulario Principal */}
      {!mostrarVistaPrevia && !mostrarCatalogo && !mostrarClientes && (
        <>
          <h1>PEDIDO EBS</h1>

          <div className="form-row">
            <div className="form-group cliente-group">
              <label>Cliente *</label>
              <div className="cliente-input-container">
                <input
                  type="text"
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  placeholder="Nombre del cliente"
                  required
                />
                <button 
                  className="button small-button select-button"
                  onClick={() => setMostrarClientes(true)}
                >
                  <i className="fas fa-users"></i> Seleccionar
                </button>
              </div>
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
            <button
              className="button success-button"
              onClick={() => navigate('/catalogo-clientes')}
            >
              <i className="fas fa-share"></i> Enviar Catálogo
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceScreen;