import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CatalogoProductos.css';

const CloudinaryUpload = ({ onImageUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo y tamaño de archivo
    if (!file.type.match('image.*')) {
      alert('Por favor, selecciona un archivo de imagen (JPEG, PNG, etc.)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      alert('La imagen es demasiado grande (máximo 5MB)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'catalogo_productos_web'); // Tu Upload Preset

    try {
      setUploading(true);
      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dstnroimw/image/upload', // Tu Cloud Name
        formData,
        {
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setProgress(percentCompleted);
          },
        }
      );

      onImageUpload({
        imagenUrl: response.data.secure_url,
        imagenPublicId: response.data.public_id
      });
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('Error al subir la imagen. Intenta de nuevo.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="cloudinary-upload">
      <label className="upload-button">
        {uploading ? `Subiendo... ${progress}%` : '📤 Subir Imagen'}
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          disabled={uploading}
          style={{ display: 'none' }}
        />
      </label>
    </div>
  );
};

const CatalogoProductos = () => {
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoProducto, setNuevoProducto] = useState({
    codigo: '',
    nombre: '',
    precio: '',
    categoria: '',
    stock: '',
    descripcion: '',
    activo: true,
    imagenUrl: '',
    imagenPublicId: ''
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [editandoId, setEditandoId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('activos');

  const categorias = ['toallas', 'Bloqueadores', 'pañales', 'Alimentos', 'Desodorantes', 'Otros'];

  // Cargar productos desde localStorage
  useEffect(() => {
    const cargarProductos = () => {
      try {
        const productosGuardados = JSON.parse(localStorage.getItem('productos')) || [];
        const productosConEstado = productosGuardados.map(p => ({
          ...p,
          activo: p.activo !== undefined ? p.activo : true,
          imagenUrl: p.imagenUrl || '',
          imagenPublicId: p.imagenPublicId || ''
        }));
        setProductos(productosConEstado);
      } catch (error) {
        console.error("Error cargando productos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarProductos();
  }, []);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoProducto({
      ...nuevoProducto,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Validar datos del producto
  const validarProducto = () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio) {
      alert('⚠️ Nombre y precio son campos obligatorios');
      return false;
    }
    return true;
  };

  // Guardar producto (nuevo o edición)
  const guardarProducto = () => {
    if (!validarProducto()) return;

    let productosActualizados = [...productos];
    
    if (editandoId) {
      productosActualizados = productosActualizados.map(p => 
        p.id === editandoId ? { ...p, ...nuevoProducto } : p
      );
    } else {
      const producto = {
        id: Date.now(),
        ...nuevoProducto,
        precio: parseFloat(nuevoProducto.precio),
        stock: parseInt(nuevoProducto.stock) || 0,
        activo: true
      };
      productosActualizados.push(producto);
    }

    localStorage.setItem('productos', JSON.stringify(productosActualizados));
    setProductos(productosActualizados);
    
    // Resetear formulario
    setNuevoProducto({
      codigo: '',
      nombre: '',
      precio: '',
      categoria: '',
      stock: '',
      descripcion: '',
      activo: true,
      imagenUrl: '',
      imagenPublicId: ''
    });
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  // Eliminar producto
  const eliminarProducto = (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    const productosActualizados = productos.filter(p => p.id !== id);
    localStorage.setItem('productos', JSON.stringify(productosActualizados));
    setProductos(productosActualizados);
  };

  // Activar/Desactivar producto
  const toggleEstadoProducto = (id) => {
    const productosActualizados = productos.map(p => 
      p.id === id ? { ...p, activo: !p.activo } : p
    );
    localStorage.setItem('productos', JSON.stringify(productosActualizados));
    setProductos(productosActualizados);
    
    const producto = productos.find(p => p.id === id);
    alert(`Producto "${producto.nombre}" ha sido ${producto.activo ? 'desactivado' : 'activado'}`);
  };

  // Editar producto
  const editarProducto = (producto) => {
    setNuevoProducto({
      codigo: producto.codigo || '',
      nombre: producto.nombre || '',
      precio: producto.precio.toString() || '',
      categoria: producto.categoria || '',
      stock: producto.stock?.toString() || '',
      descripcion: producto.descripcion || '',
      activo: producto.activo !== undefined ? producto.activo : true,
      imagenUrl: producto.imagenUrl || '',
      imagenPublicId: producto.imagenPublicId || ''
    });
    setEditandoId(producto.id);
    setMostrarFormulario(true);
  };

  // Filtrar productos
  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                            producto.codigo.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCategoria = categoriaFiltro === 'Todas' || producto.categoria === categoriaFiltro;
    
    if (filtroEstado === 'activos') return coincideBusqueda && coincideCategoria && producto.activo;
    if (filtroEstado === 'inactivos') return coincideBusqueda && coincideCategoria && !producto.activo;
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

  return (
    <div className="catalogo-container">
      <header className="catalogo-header">
        <h1><i className="fas fa-boxes"></i> Catálogo de Productos</h1>
        <div className="header-actions">
          <button 
            className="button success-button"
            onClick={() => {
              setMostrarFormulario(true);
              setEditandoId(null);
            }}
          >
            <i className="fas fa-plus"></i> Nuevo Producto
          </button>
          <button 
            className="button secondary-button"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </header>

      {/* Resumen de productos */}
      <div className="resumen-productos">
        <span><i className="fas fa-check-circle"></i> Activos: {productos.filter(p => p.activo).length}</span>
        <span><i className="fas fa-ban"></i> Inactivos: {productos.filter(p => !p.activo).length}</span>
        <span><i className="fas fa-boxes"></i> Total: {productos.length}</span>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="filtros-avanzados">
          <select 
            value={categoriaFiltro} 
            onChange={(e) => setCategoriaFiltro(e.target.value)}
          >
            <option value="Todas">Todas las categorías</option>
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <span>Mostrando {productosFiltrados.length} de {productos.length}</span>
        </div>
      </div>

      {/* Pestañas de estado */}
      <div className="tabs-container">
        <button 
          className={`tab-button ${filtroEstado === 'activos' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('activos')}
        >
          Activos ({productos.filter(p => p.activo).length})
        </button>
        <button 
          className={`tab-button ${filtroEstado === 'inactivos' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('inactivos')}
        >
          Inactivos ({productos.filter(p => !p.activo).length})
        </button>
        <button 
          className={`tab-button ${filtroEstado === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('todos')}
        >
          Todos ({productos.length})
        </button>
      </div>

      {/* Formulario de producto (modal) */}
      {mostrarFormulario && (
        <div className="modal-overlay">
          <div className="producto-form">
            <h2>{editandoId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h2>
            
            <div className="form-group">
              <label>Código (opcional):</label>
              <input
                type="text"
                name="codigo"
                value={nuevoProducto.codigo}
                onChange={handleInputChange}
                placeholder="Código interno"
              />
            </div>
            
            <div className="form-group">
              <label>Nombre *:</label>
              <input
                type="text"
                name="nombre"
                value={nuevoProducto.nombre}
                onChange={handleInputChange}
                placeholder="Nombre del producto"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Precio *:</label>
                <input
                  type="number"
                  name="precio"
                  value={nuevoProducto.precio}
                  onChange={handleInputChange}
                  placeholder="Precio"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Stock:</label>
                <input
                  type="number"
                  name="stock"
                  value={nuevoProducto.stock}
                  onChange={handleInputChange}
                  placeholder="Inventario"
                  min="0"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Categoría:</label>
              <select
                name="categoria"
                value={nuevoProducto.categoria}
                onChange={handleInputChange}
              >
                <option value="">Seleccione...</option>
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Descripción:</label>
              <textarea
                name="descripcion"
                value={nuevoProducto.descripcion}
                onChange={handleInputChange}
                placeholder="Detalles del producto"
                rows="3"
              />
            </div>

            {/* Upload de imagen con Cloudinary */}
            <div className="form-group">
              <label>Imagen:</label>
              <CloudinaryUpload 
                onImageUpload={({imagenUrl, imagenPublicId}) => {
                  setNuevoProducto({
                    ...nuevoProducto,
                    imagenUrl,
                    imagenPublicId
                  });
                }}
              />
              {nuevoProducto.imagenUrl && (
                <div className="image-preview">
                  <img src={nuevoProducto.imagenUrl} alt="Vista previa" />
                  <button 
                    className="button small-button danger-button"
                    onClick={() => setNuevoProducto({
                      ...nuevoProducto,
                      imagenUrl: '',
                      imagenPublicId: ''
                    })}
                  >
                    Eliminar
                  </button>
                </div>
              )}
            </div>
            
            {editandoId && (
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={nuevoProducto.activo}
                    onChange={handleInputChange}
                  />
                  Producto activo
                </label>
              </div>
            )}
            
            <div className="form-actions">
              <button 
                className="button secondary-button"
                onClick={() => {
                  setMostrarFormulario(false);
                  setEditandoId(null);
                }}
              >
                Cancelar
              </button>
              <button 
                className="button primary-button"
                onClick={guardarProducto}
              >
                {editandoId ? 'Guardar Cambios' : 'Agregar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Estados de carga */}
      {cargando ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando productos...</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-box-open"></i>
          <h3>No hay productos</h3>
          <p>Agrega tu primer producto</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-search"></i>
          <h3>No se encontraron resultados</h3>
          <p>Prueba con otros filtros</p>
        </div>
      ) : (
        <div className="productos-grid">
          {productosFiltrados.map(producto => (
            <div key={producto.id} className={`producto-card ${!producto.activo ? 'inactivo' : ''}`}>
              {!producto.activo && <span className="inactive-badge">INACTIVO</span>}
              
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
                
                {producto.stock !== undefined && (
                  <div className="producto-stock">
                    <i className="fas fa-boxes"></i> Stock: {producto.stock}
                  </div>
                )}
                
                {producto.descripcion && (
                  <p className="producto-descripcion">
                    {producto.descripcion}
                  </p>
                )}
              </div>
              
              <div className="producto-actions">
                <button 
                  className="action-button toggle-button"
                  onClick={() => toggleEstadoProducto(producto.id)}
                >
                  <i className={`fas ${producto.activo ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  {producto.activo ? 'Desactivar' : 'Activar'}
                </button>
                
                <button 
                  className="action-button edit-button"
                  onClick={() => editarProducto(producto)}
                >
                  <i className="fas fa-edit"></i> Editar
                </button>
                
                <button 
                  className="action-button delete-button"
                  onClick={() => eliminarProducto(producto.id)}
                >
                  <i className="fas fa-trash"></i> Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogoProductos;