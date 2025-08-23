import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient'; // Asegúrate de que la ruta sea correcta
import './CatalogoProductos.css';

const CloudinaryUpload = ({ onImageUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.match('image.*')) {
      alert('Por favor, selecciona un archivo de imagen (JPEG, PNG, etc.)');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen es demasiado grande (máximo 5MB)');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'catalogo_productos_web');

    try {
      setUploading(true);
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dstnroimw/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      onImageUpload({
        imagenUrl: data.secure_url,
        imagenPublicId: data.public_id
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

const ImportExportActions = ({ productos, productosFiltrados, setProductos }) => {
  const fileInputRef = React.useRef(null);

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const exportarProductos = (tipoExportacion = 'todos') => {
    let productosAExportar = [...productos];
    
    if (tipoExportacion === 'activos') {
      productosAExportar = productosAExportar.filter(p => p.activo);
    } else if (tipoExportacion === 'filtrados') {
      productosAExportar = productosFiltrados;
    }

    const exportData = {
      metadata: {
        fechaExportacion: new Date().toISOString(),
        cantidadProductos: productosAExportar.length,
        version: '1.0'
      },
      productos: productosAExportar
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const fecha = new Date();
    const nombreArchivo = `productos_${tipoExportacion}_${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}.json`;
    
    const exportLink = document.createElement('a');
    exportLink.setAttribute('href', dataUri);
    exportLink.setAttribute('download', nombreArchivo);
    document.body.appendChild(exportLink);
    exportLink.click();
    document.body.removeChild(exportLink);
  };

  const exportarAExcel = (tipoExportacion = 'todos') => {
    let productosAExportar = [...productos];
    
    if (tipoExportacion === 'activos') {
      productosAExportar = productosAExportar.filter(p => p.activo);
    } else if (tipoExportacion === 'filtrados') {
      productosAExportar = productosFiltrados;
    }

    let csvContent = "Código,Nombre,Categoría,Precio,Stock,Descripción,Estado,Última Actualización\n";
    
    productosAExportar.forEach(producto => {
      const row = [
        producto.codigo || 'N/A',
        `"${producto.nombre.replace(/"/g, '""')}"`,
        producto.categoria || 'Sin categoría',
        formatPrecio(producto.precio).replace(/[^\d,]/g, ''),
        producto.stock || 0,
        `"${(producto.descripcion || 'Sin descripción').replace(/"/g, '""')}"`,
        producto.activo ? 'Activo' : 'Inactivo',
        new Date().toLocaleDateString()
      ].join(',');
      
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fecha = new Date();
    const nombreArchivo = `inventario_final_${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importarProductos = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      alert('Por favor, selecciona un archivo JSON válido');
      return;
    }

    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result);
        
        if (!data.productos || !Array.isArray(data.productos)) {
          throw new Error('El archivo no contiene una lista válida de productos');
        }

        const productosImportados = data.productos.map((p, index) => {
          if (!p.nombre || typeof p.nombre !== 'string') {
            throw new Error(`Producto en posición ${index} no tiene un nombre válido`);
          }
          
          if (!p.precio || isNaN(parseFloat(p.precio))) {
            throw new Error(`Producto "${p.nombre}" no tiene un precio válido`);
          }

          return {
            codigo: p.codigo || '',
            nombre: p.nombre,
            precio: parseFloat(p.precio),
            categoria: p.categoria || '',
            stock: parseInt(p.stock) || 0,
            descripcion: p.descripcion || '',
            activo: p.activo !== undefined ? p.activo : true,
            imagen_url: p.imagenUrl || '',
            imagen_public_id: p.imagenPublicId || ''
          };
        });

        const confirmacion = window.confirm(
          `Se importarán ${productosImportados.length} productos.\n\n` +
          `¿Deseas continuar?`
        );

        if (confirmacion) {
          // Insertar en lote en Supabase
          const { data: insertedData, error } = await supabase
            .from('productos')
            .insert(productosImportados)
            .select();

          if (error) throw error;

          // Actualizar el estado local con los nuevos productos
          const { data: allProducts, error: fetchError } = await supabase
            .from('productos')
            .select('*');

          if (fetchError) throw fetchError;

          setProductos(allProducts);
          alert('Importación completada con éxito');
        }
      } catch (error) {
        console.error('Error importando productos:', error);
        alert(`Error al importar: ${error.message}`);
      }
    };

    reader.onerror = () => {
      alert('Error al leer el archivo');
    };

    reader.readAsText(file);
  };

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="import-export-actions">
      <div className="dropdown">
        <button className="button info-button">
          <i className="fas fa-file-export"></i> Exportar ▼
        </button>
        <div className="dropdown-content">
          <button onClick={() => exportarProductos('todos')}>JSON - Todos</button>
          <button onClick={() => exportarProductos('activos')}>JSON - Activos</button>
          <button onClick={() => exportarProductos('filtrados')}>JSON - Filtrados</button>
          <div className="dropdown-divider"></div>
          <button onClick={() => exportarAExcel('todos')}>Excel - Todos</button>
          <button onClick={() => exportarAExcel('activos')}>Excel - Activos</button>
          <button onClick={() => exportarAExcel('filtrados')}>Excel - Filtrados</button>
        </div>
      </div>
      
      <button 
        className="button warning-button"
        onClick={handleImportClick}
      >
        <i className="fas fa-file-import"></i> Importar
      </button>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={importarProductos}
        accept=".json"
        style={{ display: 'none' }}
      />
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

  const categorias = ['Toallas', 'Bloqueadores', 'Pañales', 'Alimentos', 'Desodorantes', 'Medicamentos', 'Otros'];

  // Cargar productos desde Supabase
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .order('nombre', { ascending: true });

        if (error) throw error;

        setProductos(data || []);
      } catch (error) {
        console.error("Error cargando productos:", error);
        alert('Error al cargar los productos');
      } finally {
        setCargando(false);
      }
    };
    
    cargarProductos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoProducto({
      ...nuevoProducto,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validarProducto = () => {
    if (!nuevoProducto.nombre || !nuevoProducto.precio) {
      alert('⚠️ Nombre y precio son campos obligatorios');
      return false;
    }
    return true;
  };

  const guardarProducto = async () => {
    if (!validarProducto()) return;

    try {
      const productoData = {
        codigo: nuevoProducto.codigo || null,
        nombre: nuevoProducto.nombre,
        precio: parseFloat(nuevoProducto.precio),
        categoria: nuevoProducto.categoria || null,
        stock: parseInt(nuevoProducto.stock) || 0,
        descripcion: nuevoProducto.descripcion || null,
        activo: nuevoProducto.activo,
        imagen_url: nuevoProducto.imagenUrl || null,
        imagen_public_id: nuevoProducto.imagenPublicId || null
      };

      if (editandoId) {
        // Actualizar producto existente
        const { data, error } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', editandoId)
          .select();

        if (error) throw error;

        setProductos(productos.map(p => 
          p.id === editandoId ? data[0] : p
        ));
      } else {
        // Crear nuevo producto
        const { data, error } = await supabase
          .from('productos')
          .insert([productoData])
          .select();

        if (error) throw error;

        setProductos([...productos, data[0]]);
      }

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
    } catch (error) {
      console.error('Error guardando producto:', error);
      alert('Error al guardar el producto');
    }
  };

  const eliminarProducto = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;
    
    try {
      const { error } = await supabase
        .from('productos')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setProductos(productos.filter(p => p.id !== id));
      alert('Producto eliminado con éxito');
    } catch (error) {
      console.error('Error eliminando producto:', error);
      alert('Error al eliminar el producto');
    }
  };

  const toggleEstadoProducto = async (id) => {
    const producto = productos.find(p => p.id === id);
    const nuevoEstado = !producto.activo;

    try {
      const { data, error } = await supabase
        .from('productos')
        .update({ activo: nuevoEstado })
        .eq('id', id)
        .select();

      if (error) throw error;

      setProductos(productos.map(p => 
        p.id === id ? data[0] : p
      ));
      
      alert(`Producto "${producto.nombre}" ha sido ${nuevoEstado ? 'activado' : 'desactivado'}`);
    } catch (error) {
      console.error('Error cambiando estado del producto:', error);
      alert('Error al cambiar el estado del producto');
    }
  };

  const editarProducto = (producto) => {
    setNuevoProducto({
      codigo: producto.codigo || '',
      nombre: producto.nombre || '',
      precio: producto.precio.toString() || '',
      categoria: producto.categoria || '',
      stock: producto.stock?.toString() || '',
      descripcion: producto.descripcion || '',
      activo: producto.activo !== undefined ? producto.activo : true,
      imagenUrl: producto.imagen_url || '',
      imagenPublicId: producto.imagen_public_id || ''
    });
    setEditandoId(producto.id);
    setMostrarFormulario(true);
  };

  const productosFiltrados = productos.filter(producto => {
    const coincideBusqueda = producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                            (producto.codigo && producto.codigo.toLowerCase().includes(busqueda.toLowerCase()));
    const coincideCategoria = categoriaFiltro === 'Todas' || producto.categoria === categoriaFiltro;
    
    if (filtroEstado === 'activos') return coincideBusqueda && coincideCategoria && producto.activo;
    if (filtroEstado === 'inactivos') return coincideBusqueda && coincideCategoria && !producto.activo;
    return coincideBusqueda && coincideCategoria;
  });

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
          <ImportExportActions 
            productos={productos}
            productosFiltrados={productosFiltrados}
            setProductos={setProductos}
          />
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

      <div className="resumen-productos">
        <span><i className="fas fa-check-circle"></i> Activos: {productos.filter(p => p.activo).length}</span>
        <span><i className="fas fa-ban"></i> Inactivos: {productos.filter(p => !p.activo).length}</span>
        <span><i className="fas fa-boxes"></i> Total: {productos.length}</span>
      </div>

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
              
              {producto.imagen_url && (
                <div className="producto-imagen">
                  <img src={producto.imagen_url} alt={producto.nombre} />
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
                
                {/* Botón de eliminar solo visible para productos inactivos */}
                {!producto.activo && (
                  <button 
                    className="action-button delete-button"
                    onClick={() => eliminarProducto(producto.id)}
                  >
                    <i className="fas fa-trash"></i> Eliminar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogoProductos;