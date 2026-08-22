// src/components/AdminProductosPreventa.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import usePreventaProducts from '../hooks/usePreventaProducts';
import './AdminProductosPreventa.css';

/**
 * Panel de administración para gestionar productos en pre-venta
 */
const AdminProductosPreventa = () => {
  const { productosPreventa, loading, guardarProductoPreventa, activarProductoDelInventario, obtenerPedidosPreventa } = usePreventaProducts();
  const [modo, setModo] = useState('lista'); // 'lista', 'crear', 'editar', 'detalles'
  const [productoEditando, setProductoEditando] = useState(null);
  const [pedidosPreventa, setPedidosPreventa] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(false);

  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    descripcion_preventa: '',
    precio_venta: '',
    categoria: '',
    imagen_url: '',
    fecha_disponibilidad: '',
  });

  const [errores, setErrores] = useState({});

  const resetFormulario = () => {
    setFormulario({
      nombre: '',
      descripcion: '',
      descripcion_preventa: '',
      precio_venta: '',
      categoria: '',
      imagen_url: '',
      fecha_disponibilidad: '',
    });
    setErrores({});
    setProductoEditando(null);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formulario.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!formulario.precio_venta) nuevosErrores.precio_venta = 'El precio es requerido';
    if (!formulario.fecha_disponibilidad) nuevosErrores.fecha_disponibilidad = 'La fecha de disponibilidad es requerida';

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleGuardar = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      const datosProducto = {
        ...formulario,
        precio_venta: parseFloat(formulario.precio_venta),
        ...(productoEditando && { id: productoEditando.id }),
      };

      await guardarProductoPreventa(datosProducto);
      resetFormulario();
      setModo('lista');
    } catch (error) {
      setErrores({ general: 'Error al guardar el producto: ' + error.message });
    }
  };

  const handleEditar = (producto) => {
    setProductoEditando(producto);
    setFormulario({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      descripcion_preventa: producto.descripcion_preventa || '',
      precio_venta: producto.precio_venta,
      categoria: producto.categoria || '',
      imagen_url: producto.imagen_url || '',
      fecha_disponibilidad: producto.fecha_disponibilidad || '',
    });
    setModo('editar');
  };

  const handleVerDetalles = async (producto) => {
    setProductoEditando(producto);
    setCargandoPedidos(true);
    const pedidos = await obtenerPedidosPreventa(producto.id);
    setPedidosPreventa(pedidos);
    setCargandoPedidos(false);
    setModo('detalles');
  };

  const handleActivarDelInventario = async (producto) => {
    const stockIngreso = prompt('¿Cuántas unidades ingresan al inventario?', '0');
    if (stockIngreso === null) return;

    const cantidad = parseInt(stockIngreso);
    if (isNaN(cantidad) || cantidad < 0) {
      alert('Ingresa una cantidad válida');
      return;
    }

    try {
      await activarProductoDelInventario(producto.id, cantidad);
      alert('✅ Producto activado del inventario. Los pedidos en preventa se cumplirán automáticamente.');
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const diasRestantes = (fecha) => {
    if (!fecha) return '-';
    const hoy = new Date();
    const fechaDisp = new Date(fecha);
    const diff = Math.ceil((fechaDisp - hoy) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff} días` : 'Hoy';
  };

  return (
    <div className="admin-preventa">
      {/* Navegación */}
      <div className="admin-nav">
        <button
          className={`btn-nav ${modo === 'lista' ? 'active' : ''}`}
          onClick={() => { setModo('lista'); resetFormulario(); }}
        >
          📋 Productos en Pre-venta
        </button>
        <button
          className={`btn-nav ${modo === 'crear' ? 'active' : ''}`}
          onClick={() => { setModo('crear'); resetFormulario(); }}
        >
          ➕ Crear Nuevo
        </button>
      </div>

      {/* Contenido */}
      <div className="admin-contenido">
        {/* Vista: Lista */}
        {modo === 'lista' && (
          <div className="vista-lista">
            <h2>Productos en Pre-venta</h2>

            {loading ? (
              <div className="cargando">Cargando...</div>
            ) : productosPreventa.length === 0 ? (
              <div className="sin-datos">
                <p>No hay productos en pre-venta</p>
                <button
                  className="btn-crear-primero"
                  onClick={() => setModo('crear')}
                >
                  Crear primer producto
                </button>
              </div>
            ) : (
              <div className="tabla-productos">
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Disponible en</th>
                      <th>Reservas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productosPreventa.map((prod) => (
                      <tr key={prod.id}>
                        <td className="nombre-producto">{prod.nombre}</td>
                        <td>{prod.categoria || '-'}</td>
                        <td className="precio">
                          {new Intl.NumberFormat('es-CO', {
                            style: 'currency',
                            currency: 'COP',
                            minimumFractionDigits: 0,
                          }).format(prod.precio_venta)}
                        </td>
                        <td>
                          <span className="fecha-disponible">
                            {formatFecha(prod.fecha_disponibilidad)}
                          </span>
                          <span className="dias-restantes">
                            {diasRestantes(prod.fecha_disponibilidad)}
                          </span>
                        </td>
                        <td className="stock-badge">{prod.stock_preventa}</td>
                        <td className="acciones-tabla">
                          <button
                            className="btn-accion btn-detalles"
                            onClick={() => handleVerDetalles(prod)}
                            title="Ver detalles y pedidos"
                          >
                            👁️
                          </button>
                          <button
                            className="btn-accion btn-editar"
                            onClick={() => handleEditar(prod)}
                            title="Editar"
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-accion btn-activar"
                            onClick={() => handleActivarDelInventario(prod)}
                            title="Activar del inventario"
                          >
                            ✅
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Vista: Crear/Editar */}
        {(modo === 'crear' || modo === 'editar') && (
          <div className="vista-formulario">
            <h2>{modo === 'crear' ? 'Crear Nuevo Producto en Pre-venta' : 'Editar Producto en Pre-venta'}</h2>

            <form onSubmit={handleGuardar} className="formulario-preventa">
              {errores.general && (
                <div className="error-general">{errores.general}</div>
              )}

              {/* Nombre */}
              <div className="campo-formulario">
                <label htmlFor="nombre">Nombre del Producto *</label>
                <input
                  id="nombre"
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) => setFormulario({ ...formulario, nombre: e.target.value })}
                  placeholder="Ej: Samsung Galaxy S25"
                  className={errores.nombre ? 'error' : ''}
                />
                {errores.nombre && <span className="error-text">{errores.nombre}</span>}
              </div>

              {/* Categoría */}
              <div className="campo-formulario">
                <label htmlFor="categoria">Categoría</label>
                <input
                  id="categoria"
                  type="text"
                  value={formulario.categoria}
                  onChange={(e) => setFormulario({ ...formulario, categoria: e.target.value })}
                  placeholder="Ej: Electrónica"
                />
              </div>

              {/* Descripción */}
              <div className="campo-formulario">
                <label htmlFor="descripcion">Descripción General</label>
                <textarea
                  id="descripcion"
                  value={formulario.descripcion}
                  onChange={(e) => setFormulario({ ...formulario, descripcion: e.target.value })}
                  placeholder="Descripción del producto"
                  rows="3"
                />
              </div>

              {/* Descripción especial de preventa */}
              <div className="campo-formulario">
                <label htmlFor="descripcion-preventa">
                  Descripción Especial de Pre-venta
                </label>
                <textarea
                  id="descripcion-preventa"
                  value={formulario.descripcion_preventa}
                  onChange={(e) => setFormulario({ ...formulario, descripcion_preventa: e.target.value })}
                  placeholder="Ej: Características especiales, materiales, fotos de muestra, etc."
                  rows="3"
                />
                <small>Información adicional que solo se mostrará en la sección de preventa</small>
              </div>

              {/* Precio */}
              <div className="campo-formulario">
                <label htmlFor="precio">Precio de Pre-venta * </label>
                <input
                  id="precio"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formulario.precio_venta}
                  onChange={(e) => setFormulario({ ...formulario, precio_venta: e.target.value })}
                  placeholder="0.00"
                  className={errores.precio_venta ? 'error' : ''}
                />
                {errores.precio_venta && (
                  <span className="error-text">{errores.precio_venta}</span>
                )}
              </div>

              {/* URL Imagen */}
              <div className="campo-formulario">
                <label htmlFor="imagen">URL de Imagen</label>
                <input
                  id="imagen"
                  type="url"
                  value={formulario.imagen_url}
                  onChange={(e) => setFormulario({ ...formulario, imagen_url: e.target.value })}
                  placeholder="https://..."
                />
                {formulario.imagen_url && (
                  <div className="preview-imagen">
                    <img src={formulario.imagen_url} alt="Preview" />
                  </div>
                )}
              </div>

              {/* Fecha de disponibilidad */}
              <div className="campo-formulario">
                <label htmlFor="fecha-disponibilidad">
                  Fecha de Disponibilidad *
                </label>
                <input
                  id="fecha-disponibilidad"
                  type="date"
                  value={formulario.fecha_disponibilidad}
                  onChange={(e) => setFormulario({ ...formulario, fecha_disponibilidad: e.target.value })}
                  className={errores.fecha_disponibilidad ? 'error' : ''}
                />
                {errores.fecha_disponibilidad && (
                  <span className="error-text">{errores.fecha_disponibilidad}</span>
                )}
              </div>

              {/* Botones */}
              <div className="botones-formulario">
                <button type="submit" className="btn-guardar">
                  💾 Guardar
                </button>
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => {
                    setModo('lista');
                    resetFormulario();
                  }}
                >
                  ❌ Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Vista: Detalles */}
        {modo === 'detalles' && productoEditando && (
          <div className="vista-detalles">
            <button
              className="btn-volver"
              onClick={() => setModo('lista')}
            >
              ← Volver
            </button>

            <div className="detalles-producto">
              {productoEditando.imagen_url && (
                <img
                  src={productoEditando.imagen_url}
                  alt={productoEditando.nombre}
                  className="imagen-detalle"
                />
              )}

              <div className="info-detalles">
                <h2>{productoEditando.nombre}</h2>
                <p className="categoria-badge">{productoEditando.categoria}</p>
                <p className="precio-detalle">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    minimumFractionDigits: 0,
                  }).format(productoEditando.precio_venta)}
                </p>

                <div className="datos-detalle">
                  <div className="dato">
                    <strong>Disponible:</strong>
                    <span>{formatFecha(productoEditando.fecha_disponibilidad)}</span>
                  </div>
                  <div className="dato">
                    <strong>Días restantes:</strong>
                    <span>{diasRestantes(productoEditando.fecha_disponibilidad)}</span>
                  </div>
                  <div className="dato">
                    <strong>Reservas acumuladas:</strong>
                    <span className="numero-grande">{productoEditando.stock_preventa}</span>
                  </div>
                </div>

                {productoEditando.descripcion && (
                  <div className="seccion-descripcion">
                    <h3>Descripción</h3>
                    <p>{productoEditando.descripcion}</p>
                  </div>
                )}

                {productoEditando.descripcion_preventa && (
                  <div className="seccion-descripcion">
                    <h3>Características de Pre-venta</h3>
                    <p>{productoEditando.descripcion_preventa}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Pedidos en preventa */}
            <div className="seccion-pedidos">
              <h3>Pedidos en Pre-venta ({pedidosPreventa.length})</h3>

              {cargandoPedidos ? (
                <div className="cargando">Cargando pedidos...</div>
              ) : pedidosPreventa.length === 0 ? (
                <div className="sin-datos-pequeno">
                  No hay pedidos en preventa aún
                </div>
              ) : (
                <div className="lista-pedidos">
                  {pedidosPreventa.map((pedido) => (
                    <div key={pedido.id} className="item-pedido">
                      <div className="info-pedido">
                        <strong>{pedido.pedidos?.cliente_nombre}</strong>
                        <span className="cantidad">{pedido.cantidad} unidades</span>
                      </div>
                      <div className="fecha-pedido">
                        {new Date(pedido.fecha_pedido).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón para activar */}
            <div className="botones-detalles">
              <button
                className="btn-activar-grande"
                onClick={() => handleActivarDelInventario(productoEditando)}
              >
                ✅ Activar del Inventario
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductosPreventa;
