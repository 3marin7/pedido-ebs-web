import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './CatalogoProductos.css';
import { useAuth } from '../App';
import { getProductSalesAndRecommendations, mergeRecommendationsIntoProducts } from '../lib/inventoryUtils';

// Componente para subir imágenes a Cloudinary
const CloudinaryUpload = ({ onImageUpload }) => {
  const [uploading, setUploading] = useState(false);

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
    }
  };

  return (
    <div className="cloudinary-upload">
      <label className="upload-button">
        {uploading ? 'Subiendo...' : '📤 Subir Imagen'}
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

// Componente para importar/exportar productos
const ImportExportActions = ({ productos, productosFiltrados, setProductos }) => {
  const fileInputRef = React.useRef(null);
  const [exportOpen, setExportOpen] = useState(false);

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

  const toggleExportMenu = () => {
    setExportOpen((prev) => !prev);
  };

  const handleExportAction = (action) => {
    action();
    setExportOpen(false);
  };

  return (
    <div className="import-export-actions">
      <div className="dropdown">
        <button
          className="button info-button"
          onClick={toggleExportMenu}
          aria-expanded={exportOpen}
          type="button"
        >
          <i className="fas fa-file-export"></i> Exportar ▼
        </button>
        <div className={`dropdown-content ${exportOpen ? 'open' : ''}`}>
          <button onClick={() => handleExportAction(() => exportarProductos('todos'))}>JSON - Todos</button>
          <button onClick={() => handleExportAction(() => exportarProductos('activos'))}>JSON - Activos</button>
          <button onClick={() => handleExportAction(() => exportarProductos('filtrados'))}>JSON - Filtrados</button>
          <div className="dropdown-divider"></div>
          <button onClick={() => handleExportAction(() => exportarAExcel('todos'))}>Excel - Todos</button>
          <button onClick={() => handleExportAction(() => exportarAExcel('activos'))}>Excel - Activos</button>
          <button onClick={() => handleExportAction(() => exportarAExcel('filtrados'))}>Excel - Filtrados</button>
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

// Componente para reporte de inventario
const ReporteInventario = ({ productos }) => {
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('activos');
  const categorias = ['Todas', 'Toallas', 'Bloqueadores y Cuidado de la Piel', 'Pañales', 'Alimentos', 'Desodorantes', 'Medicamentos', 'Cuidado del Cabello','Jabones y Geles','Otros','Producto del Dia Promocion'];

  // Filtrar productos según los filtros seleccionados
  const productosFiltrados = productos.filter(producto => {
    const coincideCategoria = filtroCategoria === 'Todas' || producto.categoria === filtroCategoria;
    
    if (filtroEstado === 'activos') return coincideCategoria && producto.activo;
    if (filtroEstado === 'inactivos') return coincideCategoria && !producto.activo;
    return coincideCategoria;
  });

  // Calcular totales
  const totalProductos = productosFiltrados.length;
  const valorTotal = productosFiltrados.reduce((total, producto) => {
    return total + (producto.precio * (producto.stock || 0));
  }, 0);

  const formatPrecio = (precio) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  };

  const exportarReporte = () => {
    let csvContent = "Código,Nombre,Categoría,Precio Unitario,Stock,Valor Total,Estado\n";
    
    productosFiltrados.forEach(producto => {
      const valorTotalProducto = producto.precio * (producto.stock || 0);
      const row = [
        producto.codigo || 'N/A',
        `"${producto.nombre.replace(/"/g, '""')}"`,
        producto.categoria || 'Sin categoría',
        formatPrecio(producto.precio).replace(/[^\d,]/g, ''),
        producto.stock || 0,
        formatPrecio(valorTotalProducto).replace(/[^\d,]/g, ''),
        producto.activo ? 'Activo' : 'Inactivo'
      ].join(',');
      
      csvContent += row + '\n';
    });

    // Agregar total general
    csvContent += `\nTOTAL GENERAL,,,${totalProductos} productos,,${formatPrecio(valorTotal).replace(/[^\d,]/g, '')},`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fecha = new Date();
    const nombreArchivo = `reporte_inventario_${fecha.getFullYear()}-${(fecha.getMonth()+1).toString().padStart(2, '0')}-${fecha.getDate().toString().padStart(2, '0')}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', nombreArchivo);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="reporte-inventario">
      <h2><i className="fas fa-file-alt"></i> Reporte de Inventario</h2>
      
      <div className="filtros-reporte">
        <div className="filtro-group">
          <label>Categoría:</label>
          <select 
            value={filtroCategoria} 
            onChange={(e) => setFiltroCategoria(e.target.value)}
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        
        <div className="filtro-group">
          <label>Estado:</label>
          <select 
            value={filtroEstado} 
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
            <option value="todos">Todos</option>
          </select>
        </div>
        
        <button className="button info-button" onClick={exportarReporte}>
          <i className="fas fa-download"></i> Exportar Reporte
        </button>
      </div>
      
      <div className="resumen-reporte">
        <div className="resumen-item">
          <span className="resumen-label">Productos:</span>
          <span className="resumen-valor">{totalProductos}</span>
        </div>
        <div className="resumen-item">
          <span className="resumen-label">Valor Total:</span>
          <span className="resumen-valor">{formatPrecio(valorTotal)}</span>
        </div>
      </div>
      
      <div className="tabla-reporte-container">
        <table className="tabla-reporte">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Categoría</th>
              <th>Precio Unitario</th>
              <th>Stock</th>
              <th>Rotación (1-5)</th>
              <th>Pedido Sugerido</th>
              <th>Valor Total</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map(producto => {
              const valorTotalProducto = producto.precio * (producto.stock || 0);
              return (
                <tr key={producto.id} className={!producto.activo ? 'inactivo' : ''}>
                  <td>{producto.codigo || 'N/A'}</td>
                  <td>{producto.nombre}</td>
                  <td>{producto.categoria || 'Sin categoría'}</td>
                  <td>{formatPrecio(producto.precio)}</td>
                  <td>{producto.stock || 0}</td>
                  <td>{producto.rotation || 1}</td>
                  <td>{producto.suggestedOrder == null ? 0 : producto.suggestedOrder}</td>
                  <td>{formatPrecio(valorTotalProducto)}</td>
                  <td>
                    <span className={`estado-badge ${producto.activo ? 'activo' : 'inactivo'}`}>
                      {producto.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" className="total-label">TOTAL GENERAL</td>
              <td className="total-value">{totalProductos} productos</td>
              <td className="total-value" colSpan="2">{formatPrecio(valorTotal)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// Modal para validar contraseña al eliminar
const ModalConfirmacion = ({ isOpen, onClose, onConfirm, productoNombre }) => {
  const [password, setPassword] = useState('');

  const handleConfirm = () => {
    if (password === 'edwin' || password === '777') {
      onConfirm();
      onClose();
    } else {
      alert('Contraseña incorrecta comunicate con soporte 3004583117');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-confirmacion">
        <h3>Confirmar Eliminación</h3>
        <p>Está a punto de eliminar el producto: <strong>{productoNombre}</strong></p>
        <p>Ingrese la contraseña para confirmar:</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="password-input"
        />
        <div className="modal-actions">
          <button className="button secondary-button" onClick={onClose}>
            Cancelar
          </button>
          <button className="button danger-button" onClick={handleConfirm}>
            Confirmar Eliminación
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente principal del catálogo
const CatalogoProductos = ({ mode = 'admin' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isReadOnly = mode === 'contabilidad';
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
  const [vistaActual, setVistaActual] = useState('catalogo');
  const [modalEliminar, setModalEliminar] = useState({
    isOpen: false,
    productoId: null,
    productoNombre: ''
  });
  const [notificacionesStock, setNotificacionesStock] = useState([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarAccionesMobile, setMostrarAccionesMobile] = useState(false);
  const [nuevaPromocion, setNuevaPromocion] = useState({
    productoId: '',
    descuento: 15,
    tipoPromocion: 'Oferta especial',
    descripcion: 'Descuento exclusivo por tiempo limitado'
  });
  const [reglaRapida, setReglaRapida] = useState('manual');

  const categorias = ['Toallas', 'Bloqueadores y Cuidado de la Piel', 'Pañales', 'Alimentos', 'Desodorantes', 'Medicamentos', 'Cuidado del Cabello','Jabones y Geles','Otros','Producto del Dia Promocion'];
  const reglasPromocion = [
    { value: 'manual', label: 'Regla manual', descuento: 15, tipoPromocion: 'Oferta especial', descripcion: 'Descuento exclusivo por tiempo limitado' },
    { value: 'baja-rotacion', label: 'Baja rotación', descuento: 12, tipoPromocion: 'Baja rotación', descripcion: 'Ideal para mover inventario que lleva tiempo sin moverse.' },
    { value: 'stock-alto', label: 'Muchas existencias', descuento: 15, tipoPromocion: 'Stock alto', descripcion: 'Descuento para aprovechar existencias acumuladas y acelerar ventas.' },
    { value: 'limpieza', label: 'Limpieza de inventario', descuento: 18, tipoPromocion: 'Limpieza de stock', descripcion: 'Promoción para mover inventario antes de recibir nuevo producto.' },
    { value: 'temporada', label: 'Fin de temporada', descuento: 20, tipoPromocion: 'Fin de temporada', descripcion: 'Descuento especial para cerrar stock de temporada.' }
  ];

  const buildPromoMarker = ({ descuento, tipoPromocion, descripcion }) => {
    const cleanTipo = (tipoPromocion || 'Oferta especial').replace(/\|/g, ' ');
    const cleanDescripcion = (descripcion || 'Descuento exclusivo por tiempo limitado').replace(/\|/g, ' ');
    return `[PROMO|${descuento}|${cleanTipo}|${cleanDescripcion}]`;
  };

  const stripPromoMarker = (descripcion = '') => {
    if (!descripcion.startsWith('[PROMO|')) return descripcion;
    const endIndex = descripcion.indexOf(']');
    if (endIndex === -1) return descripcion;
    return descripcion.slice(endIndex + 1).trim();
  };

  const parsePromoMarker = (descripcion = '') => {
    if (!descripcion.startsWith('[PROMO|')) return null;
    const endIndex = descripcion.indexOf(']');
    if (endIndex === -1) return null;

    const payload = descripcion.slice(7, endIndex);
    const [descuento = '0', tipoPromocion = 'Oferta especial', descripcionPromo = 'Descuento exclusivo por tiempo limitado'] = payload.split('|');
    return {
      descuento: Number(descuento) || 0,
      tipoPromocion,
      descripcionPromo,
      textoNormal: descripcion.slice(endIndex + 1).trim()
    };
  };

  const promocionesDefinidasFromProductos = useMemo(() => {
    return productos
      .map(producto => {
        const promoMeta = parsePromoMarker(producto.descripcion || '');
        if (!promoMeta) return null;

        const precioOriginal = Number(producto.precio) || 0;
        const precioFinal = Math.max(0, Math.round(precioOriginal * (1 - promoMeta.descuento / 100)));

        return {
          id: producto.id,
          productoId: producto.id,
          nombre: producto.nombre,
          categoria: producto.categoria || 'General',
          descuento: promoMeta.descuento,
          precioOriginal,
          precioFinal,
          tipoPromocion: promoMeta.tipoPromocion,
          descripcion: promoMeta.descripcionPromo
        };
      })
      .filter(Boolean);
  }, [productos]);

  const productosActivos = productos.filter((producto) => producto.activo);

  const promocionesSugeridas = useMemo(() => {
    return productosActivos.slice(0, 6).map((producto, index) => {
      const descuento = [10, 15, 20, 25][index % 4];
      const precioOriginal = Number(producto.precio) || 0;
      const precioFinal = Math.max(0, Math.round(precioOriginal * (1 - descuento / 100)));

      return {
        id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria || 'General',
        descuento,
        precioOriginal,
        precioFinal,
        tipoPromocion: index % 2 === 0 ? 'Oferta relámpago' : 'Descuento extra',
        descripcion: 'Ideal para mover stock con un descuento adicional y captar más pedidos.'
      };
    });
  }, [productosActivos]);

  const sugerenciasAutomaticas = useMemo(() => {
    const productosDisponibles = productosActivos.filter((producto) => !parsePromoMarker(producto.descripcion || ''));
    if (productosDisponibles.length === 0) return [];

    const stockPromedio = productosDisponibles.reduce((sum, producto) => sum + (Number(producto.stock) || 0), 0) / productosDisponibles.length;
    const now = Date.now();
    const umbralStock = Math.max(20, Math.round(stockPromedio * 1.4));

    const sugerencias = [];

    productosDisponibles.forEach((producto) => {
      const stock = Number(producto.stock) || 0;
      const fechaCreacion = producto.created_at ? new Date(producto.created_at) : null;
      const haceMasDe60Dias = fechaCreacion ? (now - fechaCreacion.getTime()) > (60 * 24 * 60 * 60 * 1000) : false;

      if (haceMasDe60Dias && stock >= Math.max(10, Math.round(stockPromedio))) {
        sugerencias.push({
          id: `${producto.id}-baja-rotacion`,
          productoId: producto.id,
          nombre: producto.nombre,
          categoria: producto.categoria || 'General',
          descuento: 12,
          tipoPromocion: 'Baja rotación',
          descripcion: 'Ideal para mover inventario que lleva tiempo sin moverse.',
          motivo: 'Baja rotación',
          puntaje: 90 + stock
        });
      }

      if (stock >= umbralStock) {
        sugerencias.push({
          id: `${producto.id}-stock-alto`,
          productoId: producto.id,
          nombre: producto.nombre,
          categoria: producto.categoria || 'General',
          descuento: 15,
          tipoPromocion: 'Stock alto',
          descripcion: 'Descuento para aprovechar existencias acumuladas y acelerar ventas.',
          motivo: 'Muchas existencias',
          puntaje: 80 + stock
        });
      }
    });

    return sugerencias
      .filter((sugerencia, index, array) => array.findIndex((item) => item.productoId === sugerencia.productoId && item.motivo === sugerencia.motivo) === index)
      .sort((a, b) => b.puntaje - a.puntaje)
      .slice(0, 6);
  }, [productosActivos]);

  const promocionesActivas = promocionesDefinidasFromProductos.length > 0 ? promocionesDefinidasFromProductos : promocionesSugeridas;

  const handlePromocionInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaPromocion({
      ...nuevaPromocion,
      [name]: name === 'descuento'
        ? Number(value)
        : name === 'productoId'
        ? value ? Number(value) : ''
        : value
    });
  };

  const aplicarSugerencia = (sugerencia) => {
    setReglaRapida(sugerencia.motivo ? 'manual' : 'manual');
    setNuevaPromocion(prev => ({
      ...prev,
      productoId: sugerencia.productoId || prev.productoId,
      descuento: sugerencia.descuento,
      tipoPromocion: sugerencia.tipoPromocion,
      descripcion: sugerencia.descripcion
    }));
  };

  const handleReglaRapidaChange = (e) => {
    const seleccion = reglasPromocion.find((regla) => regla.value === e.target.value);
    setReglaRapida(e.target.value);
    setNuevaPromocion((prev) => ({
      ...prev,
      descuento: seleccion?.descuento ?? prev.descuento,
      tipoPromocion: seleccion?.tipoPromocion ?? prev.tipoPromocion,
      descripcion: seleccion?.descripcion ?? prev.descripcion
    }));
  };

  const agregarPromocion = async () => {
    if (!nuevaPromocion.productoId) {
      alert('Selecciona un producto para la promoción.');
      return;
    }

    const productoSeleccionado = productosActivos.find(p => p.id === nuevaPromocion.productoId || p.id === Number(nuevaPromocion.productoId));
    if (!productoSeleccionado) {
      alert('Producto no encontrado o no está activo.');
      return;
    }

    const precioOriginal = Number(productoSeleccionado.precio) || 0;
    const precioFinal = Math.max(0, Math.round(precioOriginal * (1 - nuevaPromocion.descuento / 100)));
    const promoMarker = buildPromoMarker({
      descuento: nuevaPromocion.descuento,
      tipoPromocion: nuevaPromocion.tipoPromocion,
      descripcion: nuevaPromocion.descripcion
    });
    const descripcionActualizada = `${promoMarker} ${stripPromoMarker(productoSeleccionado.descripcion || '')}`.trim();

    try {
      const { data: updatedProducto, error: updateError } = await supabase
        .from('productos')
        .update({
          descripcion: descripcionActualizada,
          categoria: 'Producto del Dia Promocion'
        })
        .eq('id', productoSeleccionado.id)
        .select();

      if (updateError) throw updateError;

      const productoActualizado = updatedProducto[0];
      setProductos(productos.map(p => p.id === productoSeleccionado.id ? productoActualizado : p));

      setNuevaPromocion({
        productoId: '',
        descuento: 15,
        tipoPromocion: 'Oferta especial',
        descripcion: 'Descuento exclusivo por tiempo limitado'
      });
      setReglaRapida('manual');

      alert('Promoción guardada y visible para clientes.');
    } catch (error) {
      console.error('Error guardando promoción:', error);
      alert('No se pudo guardar la promoción. Intenta de nuevo.');
    }
  };

  const eliminarPromocion = async (promoId) => {
    const promo = promocionesDefinidasFromProductos.find(p => p.id === promoId);
    if (!promo) return;

    try {
      const producto = productos.find(p => p.id === promo.productoId);
      if (!producto) return;

      const descripcionSinPromo = stripPromoMarker(producto.descripcion || '');
      const { data: updatedProducto, error: updateError } = await supabase
        .from('productos')
        .update({ descripcion: descripcionSinPromo })
        .eq('id', producto.id)
        .select();

      if (updateError) throw updateError;
      setProductos(productos.map(p => p.id === producto.id ? updatedProducto[0] : p));
    } catch (error) {
      console.error('Error eliminando promoción:', error);
      alert('No se pudo eliminar la promoción. Intenta de nuevo.');
    }
  };

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

        // Obtener recomendaciones de rotación y sugerencias de pedido
        try {
          const recs = await getProductSalesAndRecommendations({ periodDays: 90, leadTimeDays: 14, safetyDays: 7 });
          const merged = mergeRecommendationsIntoProducts(data || [], recs);
          setProductos(merged);
        } catch (recErr) {
          console.warn('No se pudieron obtener recomendaciones de inventario:', recErr);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        alert('Error al cargar los productos');
      } finally {
        setCargando(false);
      }
    };
    
    cargarProductos();
  }, []);

  // Verificar stock bajo y generar notificaciones
  useEffect(() => {
    if (productos.length > 0) {
      const productosStockBajo = productos.filter(p => p.activo && p.stock < 25);
      setNotificacionesStock(productosStockBajo);
    }
  }, [productos]);

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

  // Registrar auditoría de cambios de producto en catálogo
  const registrarAuditoria = async ({ tipoAccion, productoId, camposModificados, cambiosResumen }) => {
    try {
      const { error } = await supabase
        .from('auditoria_productos')
        .insert([{
          producto_id: productoId,
          tipo_accion: tipoAccion,
          campos_modificados: camposModificados || {},
          cambios_resumen: cambiosResumen,
          usuario: user?.username || 'Sistema',
          rol_usuario: user?.role || 'N/A'
        }]);

      if (error) {
        console.error('Error registrando auditoría:', error);
      }
    } catch (error) {
      console.error('Error registrando auditoría:', error);
    }
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
        const productoPrevio = productos.find(p => p.id === editandoId);
        const stockAnterior = productoPrevio?.stock ?? null;
        const stockNuevoValor = parseInt(nuevoProducto.stock) || 0;

        // Actualizar producto existente
        const { data, error } = await supabase
          .from('productos')
          .update(productoData)
          .eq('id', editandoId)
          .select();

        if (error) throw error;

        const productoActualizado = data[0];
        setProductos(productos.map(p => 
          p.id === editandoId ? productoActualizado : p
        ));

        // Registrar ajuste de stock si hubo cambio
        if (stockAnterior !== null && stockAnterior !== stockNuevoValor) {
          const cambios = {
            stock: {
              antes: stockAnterior,
              despues: stockNuevoValor
            }
          };
          await registrarAuditoria({
            tipoAccion: 'edicion',
            productoId: editandoId,
            camposModificados: cambios,
            cambiosResumen: `Stock: ${stockAnterior} → ${stockNuevoValor}`
          });
        }

        // Registrar cambios de otros campos
        const cambios = {};
        const compareCampo = (campo, label = campo) => {
          const antes = productoPrevio?.[campo];
          const despues = productoActualizado?.[campo];
          if (antes !== despues) {
            cambios[campo] = { antes, despues };
          }
        };

        compareCampo('nombre', 'Nombre');
        compareCampo('precio', 'Precio');
        compareCampo('categoria', 'Categoría');
        compareCampo('descripcion', 'Descripción');
        compareCampo('activo', 'Estado');
        compareCampo('codigo', 'Código');

        if (Object.keys(cambios).length > 0) {
          const cambiosTexto = Object.entries(cambios)
            .map(([campo, valores]) => `${campo}: "${valores.antes ?? 'N/A'}" → "${valores.despues ?? 'N/A'}"`)
            .join('; ');
          
          await registrarAuditoria({
            tipoAccion: 'edicion',
            productoId: editandoId,
            camposModificados: cambios,
            cambiosResumen: cambiosTexto
          });
        }
      } else {
        // Crear nuevo producto
        const { data, error } = await supabase
          .from('productos')
          .insert([productoData])
          .select();

        if (error) throw error;

        const nuevo = data[0];
        setProductos([...productos, nuevo]);

        // Registrar creación
        await registrarAuditoria({
          tipoAccion: 'creacion',
          productoId: nuevo.id,
          camposModificados: {
            nombre: nuevo.nombre,
            stock: nuevo.stock || 0,
            precio: nuevo.precio,
            categoria: nuevo.categoria
          },
          cambiosResumen: `Producto creado: "${nuevo.nombre}" con stock inicial de ${nuevo.stock || 0}`
        });
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

  const abrirModalEliminar = (productoId, productoNombre) => {
    setModalEliminar({
      isOpen: true,
      productoId,
      productoNombre
    });
  };

  const cerrarModalEliminar = () => {
    setModalEliminar({
      isOpen: false,
      productoId: null,
      productoNombre: ''
    });
  };

  const confirmarEliminacion = () => {
    if (modalEliminar.productoId) {
      eliminarProducto(modalEliminar.productoId);
    }
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
        <h1>
          <i className="fas fa-boxes"></i> 
          {isReadOnly ? 'Catálogo de Productos (Solo Lectura)' : 'Catálogo de Productos'}
        </h1>
        <button
          className="mobile-actions-toggle"
          onClick={() => setMostrarAccionesMobile(!mostrarAccionesMobile)}
          aria-expanded={mostrarAccionesMobile}
          aria-controls="catalogo-acciones"
          type="button"
        >
          <i className="fas fa-bars"></i> Acciones
        </button>
        <div
          id="catalogo-acciones"
          className={`header-actions ${mostrarAccionesMobile ? 'mobile-open' : ''}`}
        >
          {!isReadOnly && (
            <ImportExportActions 
              productos={productos}
              productosFiltrados={productosFiltrados}
              setProductos={setProductos}
            />
          )}
          <button 
            className="button warning-button"
            onClick={() => setMostrarNotificaciones(!mostrarNotificaciones)}
            title={`${notificacionesStock.length} productos con stock bajo`}
          >
            <i className="fas fa-exclamation-triangle"></i> Stock Bajo ({notificacionesStock.length})
          </button>
          {!isReadOnly && user?.role !== 'inventario' && (
            <button 
              className="button success-button"
              onClick={() => {
                setMostrarFormulario(true);
                setEditandoId(null);
              }}
            >
              <i className="fas fa-plus"></i> Nuevo Producto
            </button>
          )}
          <button 
            className={`button ${vistaActual === 'catalogo' ? 'primary-button' : 'secondary-button'}`}
            onClick={() => setVistaActual('catalogo')}
          >
            <i className="fas fa-boxes"></i> Catálogo
          </button>
          {user?.role !== 'inventario' && (
            <button 
              className={`button ${vistaActual === 'reporte' ? 'primary-button' : 'secondary-button'}`}
              onClick={() => setVistaActual('reporte')}
            >
              <i className="fas fa-file-alt"></i> Reporte
            </button>
          )}
          <button 
            className={`button ${vistaActual === 'promociones' ? 'primary-button' : 'secondary-button'}`}
            onClick={() => setVistaActual('promociones')}
          >
            <i className="fas fa-tags"></i> Promociones
          </button>
          <button 
            className="button secondary-button"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </header>

      <div className="mobile-view-actions">
        <button 
          className={`button ${vistaActual === 'catalogo' ? 'primary-button' : 'secondary-button'}`}
          onClick={() => setVistaActual('catalogo')}
          type="button"
        >
          <i className="fas fa-boxes"></i> Catálogo
        </button>
        {user?.role !== 'inventario' && (
          <button 
            className={`button ${vistaActual === 'reporte' ? 'primary-button' : 'secondary-button'}`}
            onClick={() => setVistaActual('reporte')}
            type="button"
          >
            <i className="fas fa-file-alt"></i> Reporte
          </button>
        )}
        <button 
          className={`button ${vistaActual === 'promociones' ? 'primary-button' : 'secondary-button'}`}
          onClick={() => setVistaActual('promociones')}
          type="button"
        >
          <i className="fas fa-tags"></i> Promociones
        </button>
      </div>

      {vistaActual === 'reporte' ? (
        <ReporteInventario productos={productos} />
      ) : vistaActual === 'promociones' ? (
        <div className="promociones-view">
          <div className="promociones-hero">
            <div>
              <p className="promociones-eyebrow">Campañas rápidas</p>
              <h2>Promociones para mover más ventas</h2>
              <p>Activa descuentos y ofertas atractivas para impulsar el ticket promedio como en una tienda de estilo Temu.</p>
            </div>
            <div className="promociones-stats">
              <div className="promo-stat-card">
                <span className="promo-stat-value">{promocionesActivas.length}</span>
                <span className="promo-stat-label">Promociones activas</span>
              </div>
              <div className="promo-stat-card">
                <span className="promo-stat-value">+15%</span>
                <span className="promo-stat-label">Venta adicional</span>
              </div>
            </div>
          </div>

          <div className="promociones-manager">
            <h3>Define tus promociones</h3>

            {sugerenciasAutomaticas.length > 0 && (
              <div className="sugerencias-promociones">
                <div className="sugerencias-header">
                  <h4>Sugerencias automáticas</h4>
                  <p>Recomendadas para productos con baja rotación o con exceso de stock.</p>
                </div>
                <div className="sugerencias-list">
                  {sugerenciasAutomaticas.map((sugerencia) => (
                    <div className="sugerencia-card" key={sugerencia.id}>
                      <div>
                        <p className="sugerencia-motivo">{sugerencia.motivo}</p>
                        <h5>{sugerencia.nombre}</h5>
                        <p>{sugerencia.descripcion}</p>
                      </div>
                      <div className="sugerencia-actions">
                        <span>-{sugerencia.descuento}%</span>
                        <button className="button secondary-button" type="button" onClick={() => aplicarSugerencia(sugerencia)}>
                          <i className="fas fa-tag"></i> Usar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="promociones-form">
              <select
                name="reglaRapida"
                value={reglaRapida}
                onChange={handleReglaRapidaChange}
              >
                {reglasPromocion.map((regla) => (
                  <option key={regla.value} value={regla.value}>{regla.label}</option>
                ))}
              </select>
              <select
                name="productoId"
                value={nuevaPromocion.productoId}
                onChange={handlePromocionInputChange}
              >
                <option value="">Selecciona un producto</option>
                {productosActivos.map(producto => (
                  <option key={producto.id} value={producto.id}>
                    {producto.nombre} — {formatPrecio(producto.precio)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                name="descuento"
                min="5"
                max="80"
                value={nuevaPromocion.descuento}
                onChange={handlePromocionInputChange}
                placeholder="Descuento %"
              />
              <input
                type="text"
                name="tipoPromocion"
                value={nuevaPromocion.tipoPromocion}
                onChange={handlePromocionInputChange}
                placeholder="Tipo de promoción"
              />
              <input
                type="text"
                name="descripcion"
                value={nuevaPromocion.descripcion}
                onChange={handlePromocionInputChange}
                placeholder="Descripción breve"
              />
              <button className="button success-button" type="button" onClick={agregarPromocion}>
                <i className="fas fa-plus-circle"></i> Agregar promoción
              </button>
            </div>

            {promocionesDefinidasFromProductos.length > 0 && (
              <div className="promociones-definidas">
                <h4>Promociones definidas</h4>
                <div className="promociones-definidas-list">
                  {promocionesDefinidasFromProductos.map((promo) => (
                    <div className="promo-definition-card" key={promo.id}>
                      <div>
                        <strong>{promo.nombre}</strong> • {promo.tipoPromocion}
                        <p>{promo.descripcion}</p>
                      </div>
                      <div>
                        <span>{promo.descuento}%</span>
                        <button className="button secondary-button" type="button" onClick={() => eliminarPromocion(promo.id)}>
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="promociones-grid">
            {promocionesActivas.length === 0 ? (
              <div className="empty-state">
                <i className="fas fa-tags"></i>
                <h3>No hay promociones definidas</h3>
                <p>Agrega una promoción para mostrarla aquí.</p>
              </div>
            ) : (
              promocionesActivas.map((promo) => (
                <div className="promo-card" key={promo.id}>
                  <span className="promo-badge">-{promo.descuento}%</span>
                  <div className="promo-content">
                    <p className="promo-type">{promo.tipoPromocion}</p>
                    <h3>{promo.nombre}</h3>
                    <p className="promo-category">{promo.categoria}</p>
                    <div className="promo-prices">
                      <span className="promo-original">{formatPrecio(promo.precioOriginal)}</span>
                      <span className="promo-final">{formatPrecio(promo.precioFinal)}</span>
                    </div>
                    <p className="promo-caption">{promo.descripcion}</p>
                    <button
                      className="promo-action"
                      onClick={() => {
                        setBusqueda(promo.nombre);
                        setVistaActual('catalogo');
                      }}
                      type="button"
                    >
                      Ver producto
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="resumen-productos">
            <span><i className="fas fa-check-circle"></i> Activos: {productos.filter(p => p.activo).length}</span>
            <span><i className="fas fa-ban"></i> Inactivos: {productos.filter(p => !p.activo).length}</span>
            <span><i className="fas fa-boxes"></i> Total: {productos.length}</span>
          </div>

          {/* Panel de Notificaciones de Stock Bajo */}
          {mostrarNotificaciones && notificacionesStock.length > 0 && (
            <div className="notificaciones-stock">
              <div className="notificaciones-header">
                <h3><i className="fas fa-bell"></i> Alertas de Stock</h3>
                <button 
                  className="close-btn"
                  onClick={() => setMostrarNotificaciones(false)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="notificaciones-list">
                {notificacionesStock.map(producto => (
                  <div key={producto.id} className={`notificacion-item stock-${producto.stock <= 0 ? 'critico' : producto.stock <= 10 ? 'bajo' : 'alerta'}`}>
                    <div className="notificacion-icon">
                      <i className={`fas ${producto.stock <= 0 ? 'fa-times-circle' : producto.stock <= 10 ? 'fa-exclamation-circle' : 'fa-info-circle'}`}></i>
                    </div>
                    <div className="notificacion-content">
                      <h4>{producto.nombre}</h4>
                      <p>Stock actual: <strong>{producto.stock} unidades</strong></p>
                      {producto.codigo && <p className="codigo">Ref: {producto.codigo}</p>}
                    </div>
                    <div className="notificacion-stock">
                      <span className="stock-number">{producto.stock}</span>
                      {producto.stock === 0 && <span className="badge-critico">AGOTADO</span>}
                      {producto.stock > 0 && producto.stock <= 10 && <span className="badge-bajo">MUY BAJO</span>}
                      {producto.stock > 10 && producto.stock < 25 && <span className="badge-alerta">BAJO</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {mostrarNotificaciones && notificacionesStock.length === 0 && (
            <div className="notificaciones-vacia">
              <i className="fas fa-check-circle"></i>
              <p>✓ Todos los productos tienen stock disponible</p>
            </div>
          )}

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
                  {user?.role !== 'inventario' && (
                    <button 
                      className="button primary-button"
                      onClick={guardarProducto}
                    >
                      {editandoId ? 'Guardar Cambios' : 'Agregar Producto'}
                    </button>
                  )}
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
                  
                  {!isReadOnly && user?.role !== 'inventario' && (
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
                          onClick={() => abrirModalEliminar(producto.id, producto.nombre)}
                        >
                          <i className="fas fa-trash"></i> Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <ModalConfirmacion
        isOpen={modalEliminar.isOpen}
        onClose={cerrarModalEliminar}
        onConfirm={confirmarEliminacion}
        productoNombre={modalEliminar.productoNombre}
      />
    </div>
  );
};

export default CatalogoProductos;