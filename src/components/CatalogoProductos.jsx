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

// Componente para revisión de inventario
const sumarDias = (fecha, dias) => {
  const nuevaFecha = new Date(fecha);
  nuevaFecha.setHours(0, 0, 0, 0);
  nuevaFecha.setDate(nuevaFecha.getDate() + dias);
  return nuevaFecha;
};

const calcularProximaRevision = (fechaBase = new Date()) => {
  return sumarDias(fechaBase, 90).toISOString();
};

const normalizarRevisionTrimestral = (producto) => {
  const cantidadSistema = Number(producto.cantidad_sistema ?? producto.stock ?? 0);
  const cantidadReal = Number(
    producto.cantidad_real != null ? producto.cantidad_real : (producto.stock ?? 0)
  );
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  let fechaProximaRevision = producto.fecha_proxima_revision ? new Date(producto.fecha_proxima_revision) : null;
  const fechaRevision = producto.fecha_revision ? new Date(producto.fecha_revision) : null;

  if (!fechaProximaRevision && fechaRevision) {
    fechaProximaRevision = sumarDias(fechaRevision, 90);
  }

  const tieneEstadoExplicito = ['pendiente', 'verificado', 'diferencia', 'ajustado'].includes(producto.estado_revision);

  let estadoRevision = producto.estado_revision || (
    producto.cantidad_real != null || producto.cantidad_sistema != null
      ? (cantidadReal === cantidadSistema ? 'verificado' : 'diferencia')
      : 'pendiente'
  );

  if (tieneEstadoExplicito && ['ajustado', 'diferencia'].includes(producto.estado_revision) && Number(producto.cantidad_real ?? producto.stock ?? 0) >= 0) {
    estadoRevision = producto.estado_revision;
  }

  if (!tieneEstadoExplicito && fechaProximaRevision && fechaProximaRevision <= hoy) {
    estadoRevision = 'pendiente';
    fechaProximaRevision = sumarDias(hoy, 90);
  }

  return {
    ...producto,
    cantidad_sistema: cantidadSistema,
    cantidad_real: cantidadReal,
    estado_revision: estadoRevision,
    diferencia: cantidadReal - cantidadSistema,
    fecha_revision: producto.fecha_revision || null,
    fecha_proxima_revision: fechaProximaRevision ? fechaProximaRevision.toISOString() : null,
    revisado_por: producto.revisado_por || '',
    observacion: producto.observacion || ''
  };
};

const RevisionInventario = ({ productos, setProductos, user }) => {
  const [filtroRevision, setFiltroRevision] = useState('todos');
  const [busquedaRevision, setBusquedaRevision] = useState('');
  const [modalRevision, setModalRevision] = useState(null);

  const productosRevision = useMemo(() => {
    return productos.map((producto) => normalizarRevisionTrimestral(producto));
  }, [productos]);

  const resumenRevision = useMemo(() => {
    const totales = {
      pendientes: 0,
      verificados: 0,
      diferencias: 0,
      ajustados: 0,
    };

    productosRevision.forEach((producto) => {
      if (producto.estado_revision === 'pendiente') totales.pendientes += 1;
      if (producto.estado_revision === 'verificado') totales.verificados += 1;
      if (producto.estado_revision === 'diferencia') totales.diferencias += 1;
      if (producto.estado_revision === 'ajustado') totales.ajustados += 1;
    });

    return totales;
  }, [productosRevision]);

  const resumenPorEstado = useMemo(() => {
    const base = {
      todos: { count: 0, cantidadReal: 0, ajuste: 0, valorReal: 0, valorAjuste: 0 },
      pendiente: { count: 0, cantidadReal: 0, ajuste: 0, valorReal: 0, valorAjuste: 0 },
      verificado: { count: 0, cantidadReal: 0, ajuste: 0, valorReal: 0, valorAjuste: 0 },
      diferencia: { count: 0, cantidadReal: 0, ajuste: 0, valorReal: 0, valorAjuste: 0 },
      ajustado: { count: 0, cantidadReal: 0, ajuste: 0, valorReal: 0, valorAjuste: 0 },
    };

    productosRevision.forEach((producto) => {
      const estado = producto.estado_revision || 'pendiente';
      const cantidadReal = Number(producto.cantidad_real ?? 0);
      const cantidadSistema = Number(producto.cantidad_sistema ?? producto.stock ?? 0);
      const precio = Number(producto.precio || 0);
      const ajuste = cantidadReal - cantidadSistema;
      const valorReal = precio * cantidadReal;
      const valorAjuste = ajuste * precio;

      base.todos.count += 1;
      base.todos.cantidadReal += cantidadReal;
      base.todos.ajuste += ajuste;
      base.todos.valorReal += valorReal;
      base.todos.valorAjuste += valorAjuste;

      if (!base[estado]) {
        base[estado] = { count: 0, cantidadReal: 0, ajuste: 0, valorReal: 0, valorAjuste: 0 };
      }

      base[estado].count += 1;
      base[estado].cantidadReal += cantidadReal;
      base[estado].ajuste += ajuste;
      base[estado].valorReal += valorReal;
      base[estado].valorAjuste += valorAjuste;
    });

    return base;
  }, [productosRevision]);

  const totalEstadoActual = filtroRevision === 'todos'
    ? resumenPorEstado.todos
    : resumenPorEstado[filtroRevision] || {
        count: 0,
        cantidadReal: 0,
        ajuste: 0,
        valorReal: 0,
        valorAjuste: 0
      };

  const valorTotalInventarioReal = totalEstadoActual.valorReal;

  const etiquetaEstadoActual = {
    todos: 'Total inventario',
    pendiente: 'Total pendientes',
    verificado: 'Total verificados',
    diferencia: 'Total diferencias',
    ajustado: 'Total ajustados'
  }[filtroRevision] || 'Total inventario';

  const etiquetaEstadoResumen = {
    todos: 'inventario real',
    pendiente: 'pendientes',
    verificado: 'verificados',
    diferencia: 'diferencias',
    ajustado: 'ajustados'
  }[filtroRevision] || 'inventario real';

  const footerLabels = {
    todos: {
      unidades: 'Total inventario real',
      valor: 'Valor total real',
      ajuste: 'Ajuste total'
    },
    pendiente: {
      unidades: 'Pendientes',
      valor: 'Valor pendientes',
      ajuste: 'Ajuste pendientes'
    },
    verificado: {
      unidades: 'Verificados',
      valor: 'Valor verificados',
      ajuste: 'Ajuste verificados'
    },
    diferencia: {
      unidades: 'Diferencias',
      valor: 'Valor diferencias',
      ajuste: 'Ajuste diferencias'
    },
    ajustado: {
      unidades: 'Ajustados',
      valor: 'Valor ajustados',
      ajuste: 'Ajuste ajustados'
    }
  };

  const footerLabel = footerLabels[filtroRevision] || footerLabels.todos;

  const formatCantidad = (valor) => new Intl.NumberFormat('es-CO').format(Math.round(Number(valor || 0)));
  const formatPrecio = (valor) => new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(valor || 0));

  const productosFiltrados = useMemo(() => {
    return productosRevision.filter((producto) => {
      const coincideBusqueda = !busquedaRevision ||
        producto.nombre.toLowerCase().includes(busquedaRevision.toLowerCase()) ||
        (producto.codigo && producto.codigo.toLowerCase().includes(busquedaRevision.toLowerCase()));

      const coincideFiltro = filtroRevision === 'todos' || producto.estado_revision === filtroRevision;
      return coincideBusqueda && coincideFiltro;
    });
  }, [productosRevision, busquedaRevision, filtroRevision]);

  const getEstadoLabel = (estado) => {
    const labels = {
      pendiente: 'Pendientes',
      verificado: 'Verificados',
      diferencia: 'Diferencias',
      ajustado: 'Ajustados'
    };
    return labels[estado] || 'Pendientes';
  };

  const guardarRevision = async (producto, formValues) => {
    const cantidadSistema = Number(producto.cantidad_sistema ?? producto.stock ?? 0);
    const cantidadRealInput = Number(formValues.cantidadReal ?? producto.cantidad_real ?? producto.stock ?? 0);
    const cantidadReal = Number.isFinite(cantidadRealInput) ? Math.max(0, cantidadRealInput) : Math.max(0, cantidadSistema);
    const estadoRevision = formValues.estado;
    const fechaRevision = new Date().toISOString();
    const usuarioRevision = user?.username || 'Sistema';
    const observacion = formValues.observacion || '';
    const diferencia = cantidadReal - cantidadSistema;
    const fechaProximaRevision = calcularProximaRevision(new Date());

    const actualizado = {
      ...producto,
      cantidad_sistema: cantidadSistema,
      cantidad_real: cantidadReal,
      stock: cantidadReal,
      estado_revision: estadoRevision,
      diferencia,
      fecha_revision: fechaRevision,
      fecha_proxima_revision: fechaProximaRevision,
      revisado_por: usuarioRevision,
      observacion
    };

    setProductos((prevProductos) => prevProductos.map((item) => item.id === producto.id ? actualizado : item));

    try {
      const { error: errorProducto } = await supabase
        .from('productos')
        .update({
          stock: cantidadReal,
          cantidad_real: cantidadReal,
          cantidad_sistema: cantidadSistema,
          estado_revision: estadoRevision,
          fecha_revision: fechaRevision,
          fecha_proxima_revision: fechaProximaRevision,
          revisado_por: usuarioRevision,
          observacion
        })
        .eq('id', producto.id);

      if (errorProducto) {
        console.error('Error guardando producto en revisión:', errorProducto);
        alert('No se pudo guardar la revisión. Verifica que la tabla productos tenga las columnas de inventario.');
        return;
      }

      const { error: errorRevision } = await supabase
        .from('inventario_revisiones')
        .insert([
          {
            producto_id: producto.id,
            cantidad_sistema: cantidadSistema,
            cantidad_real: cantidadReal,
            diferencia,
            estado_revision: estadoRevision,
            fecha_revision: fechaRevision,
            fecha_proxima_revision: fechaProximaRevision,
            revisado_por: usuarioRevision,
            observacion,
            rol_usuario: user?.role || 'N/A'
          }
        ]);

      if (errorRevision) {
        console.error('Error guardando historial de revisión:', errorRevision);
        alert('La revisión no quedó guardada en el historial. Intenta de nuevo.');
        return;
      }

      const { data: productosActualizados, error: errorCarga } = await supabase
        .from('productos')
        .select('*')
        .order('nombre', { ascending: true });

      if (!errorCarga && productosActualizados) {
        const { data: revisionesData } = await supabase
          .from('inventario_revisiones')
          .select('*')
          .order('fecha_revision', { ascending: false });

        const revisionesPorProducto = new Map();
        (revisionesData || []).forEach((revision) => {
          if (!revisionesPorProducto.has(revision.producto_id)) {
            revisionesPorProducto.set(revision.producto_id, revision);
          }
        });

        const productosConRevision = (productosActualizados || []).map((item) => {
          const ultimaRevision = revisionesPorProducto.get(item.id);
          if (!ultimaRevision) return item;

          const cantidadSistemaRevision = Number(ultimaRevision.cantidad_sistema ?? item.stock ?? 0);
          const cantidadRealRevision = Number(
            ultimaRevision.cantidad_real != null ? ultimaRevision.cantidad_real : (item.stock ?? 0)
          );
          const siguienteEstado = ultimaRevision.estado_revision || item.estado_revision || 'pendiente';

          return normalizarRevisionTrimestral({
            ...item,
            cantidad_sistema: cantidadSistemaRevision,
            cantidad_real: cantidadRealRevision,
            estado_revision: siguienteEstado,
            fecha_revision: ultimaRevision.fecha_revision || item.fecha_revision || null,
            fecha_proxima_revision: ultimaRevision.fecha_proxima_revision || item.fecha_proxima_revision || null,
            revisado_por: ultimaRevision.revisado_por || item.revisado_por || '',
            observacion: ultimaRevision.observacion || item.observacion || '',
            diferencia: cantidadRealRevision - cantidadSistemaRevision
          });
        });

        setProductos(productosConRevision);
      }

      const { error: errorAuditoria } = await supabase
        .from('auditoria_productos')
        .insert([
          {
            producto_id: producto.id,
            tipo_accion: 'revision_inventario',
            campos_modificados: {
              cantidad_sistema: cantidadSistema,
              cantidad_real: cantidadReal,
              diferencia,
              estado_revision: estadoRevision,
              fecha_revision: fechaRevision,
              revisado_por: usuarioRevision,
              observacion
            },
            cambios_resumen: `Revisión de inventario: sistema ${cantidadSistema}, real ${cantidadReal}, diferencia ${diferencia}, estado ${estadoRevision}.`,
            usuario: usuarioRevision,
            rol_usuario: user?.role || 'N/A'
          }
        ]);

      if (errorAuditoria) {
        console.warn('No se pudo guardar la auditoría de revisión:', errorAuditoria);
      }

      alert('✅ Revisión guardada correctamente.');
    } catch (error) {
      console.error('No se pudo guardar la revisión en Supabase:', error);
      alert('No se pudo guardar la revisión. Revisa la conexión o la estructura de la base de datos.');
    }

    setModalRevision(null);
  };

  return (
    <div className="revision-inventario">
      <div className="revision-header">
        <div>
          <p className="revision-eyebrow">Control operativo</p>
          <h2>Revisión de inventario</h2>
        </div>
        <div className="revision-summary">
          <div className="revision-card pending">
            <span className="revision-number">{resumenRevision.pendientes}</span>
            <span className="revision-label">Pendientes</span>
          </div>
          <div className="revision-card verified">
            <span className="revision-number">{resumenRevision.verificados}</span>
            <span className="revision-label">Verificados</span>
          </div>
          <div className="revision-card difference">
            <span className="revision-number">{resumenRevision.diferencias}</span>
            <span className="revision-label">Diferencia</span>
          </div>
          <div className="revision-card adjusted">
            <span className="revision-number">{resumenRevision.ajustados}</span>
            <span className="revision-label">Ajustados</span>
          </div>
        </div>
      </div>

      <div className="revision-toolbar">
        <div className="revision-search">
          <input
            type="text"
            value={busquedaRevision}
            onChange={(e) => setBusquedaRevision(e.target.value)}
            placeholder="Buscar producto o código..."
          />
        </div>
        <div className="revision-filtros">
          {['todos', 'pendiente', 'verificado', 'diferencia', 'ajustado'].map((estado) => (
            <button
              key={estado}
              type="button"
              className={`revision-filter ${filtroRevision === estado ? 'active' : ''}`}
              onClick={() => setFiltroRevision(estado)}
            >
              {estado === 'todos' ? 'Todos' : getEstadoLabel(estado)}
            </button>
          ))}
        </div>
      </div>

      <div className="revision-resumen-estado">
        <div className="revision-total-box active">
          <span>{etiquetaEstadoActual}</span>
          <strong>{formatCantidad(totalEstadoActual.cantidadReal)} unidades</strong>
          <small>{totalEstadoActual.count} productos</small>
        </div>

        <div className="revision-total-box">
          <span>Ajuste</span>
          <strong>{totalEstadoActual.ajuste >= 0 ? '+' : ''}{formatCantidad(totalEstadoActual.ajuste)} unidades</strong>
          <small>variación en revisión</small>
        </div>

        {['pendiente', 'verificado', 'diferencia', 'ajustado'].map((estado) => (
          <div
            key={estado}
            className={`revision-total-box mini ${filtroRevision === estado ? 'active' : ''}`}
          >
            <span>{getEstadoLabel(estado)}</span>
            <strong>{resumenPorEstado[estado]?.count ?? 0}</strong>
            <small>{formatCantidad(resumenPorEstado[estado]?.cantidadReal ?? 0)} und.</small>
          </div>
        ))}
      </div>

      <div className="revision-table-wrap">
        <table className="revision-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Categoría</th>
              <th>Sistema</th>
              <th>Real</th>
              <th>Diferencia</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Revisado por</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map((producto) => (
              <tr key={producto.id} className={`revision-row ${producto.estado_revision}`}>
                <td>
                  <div className="revision-product">
                    <strong>{producto.nombre}</strong>
                    <small>{producto.codigo || 'Sin código'}</small>
                  </div>
                </td>
                <td>{producto.categoria || 'Sin categoría'}</td>
                <td>{producto.cantidad_sistema}</td>
                <td>{producto.cantidad_real}</td>
                <td className={producto.diferencia === 0 ? 'difference-zero' : producto.diferencia > 0 ? 'difference-positive' : 'difference-negative'}>
                  {producto.diferencia > 0 ? '+' : ''}{producto.diferencia}
                </td>
                <td>
                  <span className={`revision-badge ${producto.estado_revision}`}>
                    {getEstadoLabel(producto.estado_revision)}
                  </span>
                </td>
                <td>{producto.fecha_revision ? new Date(producto.fecha_revision).toLocaleDateString('es-CO') : 'Sin revisión'}</td>
                <td>{producto.revisado_por || '-'}</td>
                <td>
                  <button
                    type="button"
                    className="button secondary-button small-button"
                    onClick={() => setModalRevision(producto)}
                  >
                    Verificar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="revision-footer-total">
        <div className="revision-footer-total__card">
          <span>{footerLabel.unidades}</span>
          <strong>{formatCantidad(totalEstadoActual.cantidadReal)} unidades</strong>
          <small>{totalEstadoActual.count} productos</small>
        </div>

        <div className="revision-footer-total__card">
          <span>{footerLabel.valor}</span>
          <strong>{formatPrecio(valorTotalInventarioReal)}</strong>
          <small>Precio × cantidad real</small>
        </div>

        <div className="revision-footer-total__card">
          <span>{footerLabel.ajuste}</span>
          <strong>{totalEstadoActual.ajuste >= 0 ? '+' : ''}{formatCantidad(totalEstadoActual.ajuste)} unidades</strong>
          <small>{formatPrecio(totalEstadoActual.valorAjuste)}</small>
        </div>
      </div>

      {modalRevision && (
        <div className="modal-overlay">
          <div className="producto-form revision-modal">
            <h2>Revisión de {modalRevision.nombre}</h2>
            <div className="form-group">
              <label>Estado</label>
              <select
                defaultValue={modalRevision.estado_revision}
                id="revision-estado"
              >
                <option value="pendiente">Pendiente</option>
                <option value="verificado">Verificado</option>
                <option value="diferencia">Diferencia</option>
                <option value="ajustado">Ajustado</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cantidad sistema</label>
                <input type="number" value={modalRevision.cantidad_sistema} readOnly />
              </div>
              <div className="form-group">
                <label>Cantidad real</label>
                <input
                  type="number"
                  min="0"
                  defaultValue={modalRevision.cantidad_real}
                  id="revision-cantidad-real"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Observación</label>
              <textarea
                rows="3"
                defaultValue={modalRevision.observacion}
                id="revision-observacion"
                placeholder="Describe si hubo diferencia, ajuste o novedad"
              />
            </div>

            <div className="form-actions">
              <button className="button secondary-button" onClick={() => setModalRevision(null)}>
                Cancelar
              </button>
              <button
                className="button success-button"
                onClick={() => {
                  const estado = document.getElementById('revision-estado')?.value || 'pendiente';
                  const cantidadReal = document.getElementById('revision-cantidad-real')?.value;
                  const observacion = document.getElementById('revision-observacion')?.value || '';

                  guardarRevision(modalRevision, {
                    estado,
                    cantidadReal,
                    observacion
                  });
                }}
              >
                Guardar revisión
              </button>
            </div>
          </div>
        </div>
      )}
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

  const getRevisionState = (producto) => {
    const estado = producto?.estado_revision || 'pendiente';

    const map = {
      pendiente: { label: 'Pendiente', icon: '•', className: 'pending' },
      verificado: { label: 'Verificado', icon: '✓', className: 'verified' },
      diferencia: { label: 'Diferencia', icon: '!', className: 'difference' },
      ajustado: { label: 'Ajustado', icon: '✓', className: 'adjusted' }
    };

    return map[estado] || map.pendiente;
  };

  const exportarReporte = () => {
    let csvContent = "Código,Nombre,Categoría,Precio Unitario,Stock,Valor Total,Estado,Revisión\n";
    
    productosFiltrados.forEach(producto => {
      const valorTotalProducto = producto.precio * (producto.stock || 0);
      const revision = getRevisionState(producto);
      const row = [
        producto.codigo || 'N/A',
        `"${producto.nombre.replace(/"/g, '""')}"`,
        producto.categoria || 'Sin categoría',
        formatPrecio(producto.precio).replace(/[^\d,]/g, ''),
        producto.stock || 0,
        formatPrecio(valorTotalProducto).replace(/[^\d,]/g, ''),
        producto.activo ? 'Activo' : 'Inactivo',
        revision.label
      ].join(',');
      
      csvContent += row + '\n';
    });

    // Agregar total general
    csvContent += `\nTOTAL GENERAL,,,${totalProductos} productos,,${formatPrecio(valorTotal).replace(/[^\d,]/g, '')},,`;

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
              <th>Revisión</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.map(producto => {
              const valorTotalProducto = producto.precio * (producto.stock || 0);
              const revision = getRevisionState(producto);
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
                  <td>
                    <span className={`revision-report-badge ${revision.className}`}>
                      {revision.icon} {revision.label}
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
  const [vistaProductos, setVistaProductos] = useState('tarjetas');
  const [modalEliminar, setModalEliminar] = useState({
    isOpen: false,
    productoId: null,
    productoNombre: ''
  });
  const [notificacionesStock, setNotificacionesStock] = useState([]);
  const [mostrarNotificaciones, setMostrarNotificaciones] = useState(false);
  const [mostrarAccionesMobile, setMostrarAccionesMobile] = useState(false);
  const [navActivoMobile, setNavActivoMobile] = useState('');
  const [panelCatalogoMobile, setPanelCatalogoMobile] = useState(null);
  const [menuMasAbierto, setMenuMasAbierto] = useState(false);
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

  const manejarNavClick = (item) => {
    if (item === 'mas') {
      const abrirMenu = !menuMasAbierto;
      setMenuMasAbierto(abrirMenu);
      setNavActivoMobile(abrirMenu ? 'mas' : '');
      return;
    }

    setMenuMasAbierto(false);

    if (item === 'buscar' || item === 'categorias') {
      const abrirPanel = panelCatalogoMobile === item ? null : item;
      setPanelCatalogoMobile(abrirPanel);
      setNavActivoMobile(abrirPanel || '');
      return;
    }

    setPanelCatalogoMobile(null);
    setNavActivoMobile(item);

    if (item === 'nuevo') {
      if (isReadOnly || user?.role === 'inventario') return;
      setMostrarFormulario(true);
      setEditandoId(null);
      setMostrarAccionesMobile(false);
      setNavActivoMobile('');
    }
  };

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

        let productosBase = data || [];

        try {
          const { data: revisionesData } = await supabase
            .from('inventario_revisiones')
            .select('*')
            .order('fecha_revision', { ascending: false });

          const revisionesPorProducto = new Map();
          (revisionesData || []).forEach((revision) => {
            if (!revisionesPorProducto.has(revision.producto_id)) {
              revisionesPorProducto.set(revision.producto_id, revision);
            }
          });

          productosBase = productosBase.map((producto) => {
            const ultimaRevision = revisionesPorProducto.get(producto.id);
            if (!ultimaRevision) return producto;

            const cantidadSistemaRevision = Number(ultimaRevision.cantidad_sistema ?? producto.stock ?? 0);
            const cantidadRealRevision = Number(ultimaRevision.cantidad_real ?? producto.stock ?? 0);

            return {
              ...producto,
              cantidad_sistema: cantidadSistemaRevision,
              cantidad_real: cantidadRealRevision,
              estado_revision: ultimaRevision.estado_revision || producto.estado_revision || 'pendiente',
              fecha_revision: ultimaRevision.fecha_revision || producto.fecha_revision || null,
              revisado_por: ultimaRevision.revisado_por || producto.revisado_por || '',
              observacion: ultimaRevision.observacion || producto.observacion || '',
              diferencia: cantidadRealRevision - cantidadSistemaRevision
            };
          });
        } catch (revisionesError) {
          console.warn('No se pudo cargar historial de revisiones:', revisionesError);
        }

        setProductos(productosBase);

        // Obtener recomendaciones de rotación y sugerencias de pedido
        try {
          const recs = await getProductSalesAndRecommendations({ periodDays: 90, leadTimeDays: 14, safetyDays: 7 });
          const merged = mergeRecommendationsIntoProducts(productosBase, recs);
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
          className="header-actions"
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

      {mostrarAccionesMobile && (
        <div
          className="menu-overlay active"
          onClick={() => setMostrarAccionesMobile(false)}
        ></div>
      )}

      <div className={`mobile-menu ${mostrarAccionesMobile ? 'active' : ''}`}>
        <div className="menu-header">
          <h3>Opciones</h3>
          <button
            className="close-menu"
            type="button"
            onClick={() => setMostrarAccionesMobile(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="menu-actions">
          {!isReadOnly && user?.role !== 'inventario' && (
            <button
              className="menu-btn primary"
              type="button"
              onClick={() => {
                setMostrarFormulario(true);
                setEditandoId(null);
                setMostrarAccionesMobile(false);
              }}
            >
              <i className="fas fa-plus"></i> Nuevo Producto
            </button>
          )}

          <button
            className="menu-btn"
            type="button"
            onClick={() => {
              setMostrarNotificaciones(!mostrarNotificaciones);
              setMostrarAccionesMobile(false);
            }}
          >
            <i className="fas fa-exclamation-triangle"></i> Stock Bajo ({notificacionesStock.length})
          </button>

          <button
            className="menu-btn"
            type="button"
            onClick={() => {
              setVistaActual('catalogo');
              setMostrarAccionesMobile(false);
            }}
          >
            <i className="fas fa-boxes"></i> Catálogo
          </button>

          {user?.role !== 'inventario' && (
            <button
              className="menu-btn"
              type="button"
              onClick={() => {
                setVistaActual('reporte');
                setMostrarAccionesMobile(false);
              }}
            >
              <i className="fas fa-file-alt"></i> Reporte
            </button>
          )}

          <button
            className="menu-btn"
            type="button"
            onClick={() => {
              setVistaActual('revision');
              setMostrarAccionesMobile(false);
            }}
          >
            <i className="fas fa-clipboard-check"></i> Revisión
          </button>

          <button
            className="menu-btn"
            type="button"
            onClick={() => {
              setVistaActual('promociones');
              setMostrarAccionesMobile(false);
            }}
          >
            <i className="fas fa-tags"></i> Promociones
          </button>

          {!isReadOnly && (
            <div className="menu-import-export">
              <ImportExportActions 
                productos={productos}
                productosFiltrados={productosFiltrados}
                setProductos={setProductos}
              />
            </div>
          )}

          <button
            className="menu-btn"
            type="button"
            onClick={() => {
              navigate('/');
              setMostrarAccionesMobile(false);
            }}
          >
            <i className="fas fa-arrow-left"></i> Volver
          </button>
        </div>
      </div>

      {vistaActual === 'reporte' ? (
        <ReporteInventario productos={productos} />
      ) : vistaActual === 'revision' ? (
        <RevisionInventario productos={productos} setProductos={setProductos} user={user} />
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
                id="catalogo-busqueda"
                type="text"
                placeholder="🔍 Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <div className="filtros-avanzados">
              <select 
                id="catalogo-categoria"
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
            <div className="productos-view-toggle" aria-label="Vista de productos">
              <span>Vista:</span>
              <button
                type="button"
                className={vistaProductos === 'tarjetas' ? 'active' : ''}
                onClick={() => setVistaProductos('tarjetas')}
                aria-label="Vista de tarjetas"
              >
                <i className="fas fa-grip"></i> Tarjetas
              </button>
              <button
                type="button"
                className={vistaProductos === 'lista' ? 'active' : ''}
                onClick={() => setVistaProductos('lista')}
                aria-label="Vista de lista"
              >
                <i className="fas fa-list"></i> Lista
              </button>
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
            vistaProductos === 'lista' ? (
              <div className="productos-lista-tabla-wrapper">
                <table className="productos-lista-tabla">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Categoría</th>
                      <th>Stock</th>
                      <th>Precio</th>
                      <th>Estado</th>
                      {!isReadOnly && user?.role !== 'inventario' && <th>Acciones</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {productosFiltrados.map(producto => (
                      <tr key={producto.id} className={!producto.activo ? 'inactivo' : ''}>
                        <td className="lista-nombre">{producto.nombre}</td>
                        <td>{producto.categoria || 'Sin categoría'}</td>
                        <td>{producto.stock || 0}</td>
                        <td>{formatPrecio(producto.precio)}</td>
                        <td>
                          <span className={`lista-estado ${producto.activo ? 'activo' : 'inactivo'}`}>
                            {producto.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        {!isReadOnly && user?.role !== 'inventario' && (
                          <td className="lista-acciones">
                            <button className="action-button toggle-button" onClick={() => toggleEstadoProducto(producto.id)}>
                              <i className={`fas ${producto.activo ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                              {producto.activo ? 'Desactivar' : 'Activar'}
                            </button>
                            <button className="action-button edit-button" onClick={() => editarProducto(producto)}>
                              <i className="fas fa-edit"></i> Editar
                            </button>
                            {!producto.activo && (
                              <button className="action-button delete-button" onClick={() => abrirModalEliminar(producto.id, producto.nombre)}>
                                <i className="fas fa-trash"></i> Eliminar
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            )
          )}
        </>
      )}

      {!mostrarFormulario && vistaActual !== 'revision' && (
        <>
          {panelCatalogoMobile === 'buscar' && (
            <div className="catalogo-mobile-panel catalogo-mobile-panel--buscar">
              <label htmlFor="catalogo-busqueda-mobile">Buscar productos</label>
              <div className="catalogo-mobile-search">
                <i className="fas fa-search"></i>
                <input
                  id="catalogo-busqueda-mobile"
                  type="search"
                  placeholder="Buscar por nombre o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  autoFocus
                />
                {busqueda && (
                  <button type="button" onClick={() => setBusqueda('')} aria-label="Limpiar búsqueda">
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
            </div>
          )}

          {panelCatalogoMobile === 'categorias' && (
            <div className="catalogo-mobile-panel catalogo-mobile-panel--categorias">
              <label htmlFor="catalogo-categoria-mobile">Filtrar productos</label>
              <select
                id="catalogo-categoria-mobile"
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                autoFocus
              >
                <option value="Todas">Todas las categorías</option>
                {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <span>Mostrando {productosFiltrados.length} de {productos.length}</span>
            </div>
          )}

          <div className="bottom-nav-mobile" role="navigation" aria-label="Navegación del catálogo">
            {[
              { key: 'buscar', label: 'Buscar', icon: 'fa-magnifying-glass' },
              { key: 'categorias', label: 'Categorías', icon: 'fa-list' },
              { key: 'nuevo', label: 'Nuevo', icon: 'fa-plus', plus: true },
              { key: 'mas', label: 'Más', icon: 'fa-ellipsis' }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                className={`bottom-nav-item ${navActivoMobile === item.key ? 'active' : ''} ${item.plus ? 'bottom-nav-item--plus' : ''}`}
                onClick={() => manejarNavClick(item.key)}
              >
                <i className={`fas ${item.icon}`}></i>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {!mostrarFormulario && vistaActual !== 'revision' && menuMasAbierto && (
        <div className="more-menu" role="menu" aria-label="Más opciones del catálogo">
          <button
            type="button"
            className="more-menu-item"
            onClick={() => {
              setMenuMasAbierto(false);
              setNavActivoMobile('');
              setMostrarNotificaciones(!mostrarNotificaciones);
            }}
          >
            <i className="fas fa-bell"></i>
            <span>Stock bajo</span>
          </button>
          <button
            type="button"
            className="more-menu-item"
            onClick={() => {
              setMenuMasAbierto(false);
              setNavActivoMobile('');
              setVistaActual('reporte');
            }}
          >
            <i className="fas fa-file-alt"></i>
            <span>Reporte</span>
          </button>
          <button
            type="button"
            className="more-menu-item"
            onClick={() => {
              setMenuMasAbierto(false);
              setNavActivoMobile('');
              setVistaActual('revision');
            }}
          >
            <i className="fas fa-clipboard-check"></i>
            <span>Revisión</span>
          </button>
          <button
            type="button"
            className="more-menu-item"
            onClick={() => {
              setMenuMasAbierto(false);
              setNavActivoMobile('');
              setVistaActual('promociones');
            }}
          >
            <i className="fas fa-tags"></i>
            <span>Promociones</span>
          </button>
          <button
            type="button"
            className="more-menu-item"
            onClick={() => {
              setMenuMasAbierto(false);
              setNavActivoMobile('');
              navigate('/');
            }}
          >
            <i className="fas fa-arrow-left"></i>
            <span>Volver</span>
          </button>
        </div>
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