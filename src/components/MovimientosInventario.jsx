import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './MovimientosInventario.css';

export default function MovimientosInventario() {
  const [movimiento, setMovimiento] = useState({
    producto_id: '',
    tipo_movimiento: 'entrada',
    cantidad: '',
    precio_unitario: '',
    motivo: '',
    observaciones: ''
  });

  const [productos, setProductos] = useState([]);
  const [productosFiltrados, setProductosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const submittingRef = useRef(false);
  const requestIdRef = useRef(null);

  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtrar productos cuando cambia la búsqueda
  useEffect(() => {
    if (busqueda.trim() === '') {
      setProductosFiltrados(productos);
    } else {
      const filtrados = productos.filter(producto =>
        producto.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        producto.id.toString().includes(busqueda)
      );
      setProductosFiltrados(filtrados);
    }
  }, [busqueda, productos]);

  const cargarProductos = async () => {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, stock')
        .order('nombre');

      if (error) {
        setError('Error al cargar productos: ' + error.message);
      } else {
        setProductos(data);
        setProductosFiltrados(data);
        setError('');
      }
    } catch (err) {
      setError('Error inesperado: ' + err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setLoading(true);
    setError('');

    // Validaciones
    if (!movimiento.producto_id) {
      setError('Debe seleccionar un producto');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!movimiento.cantidad || movimiento.cantidad <= 0) {
      setError('La cantidad debe ser mayor a cero');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (!movimiento.motivo) {
      setError('Debe seleccionar un motivo');
      setLoading(false);
      submittingRef.current = false;
      return;
    }

    if (movimiento.tipo_movimiento === 'salida') {
      const producto = productos.find(p => p.id == movimiento.producto_id);
      if (producto && parseInt(movimiento.cantidad) > producto.stock) {
        setError('❌ No hay suficiente stock disponible. Stock actual: ' + producto.stock);
        setLoading(false);
        submittingRef.current = false;
        return;
      }
    }

    try {
      const cantidadMovida = parseInt(movimiento.cantidad);

      if (!requestIdRef.current) requestIdRef.current = crypto.randomUUID();
      const { data, error } = await supabase.rpc('registrar_movimiento_inventario', {
        p_request_id: requestIdRef.current,
        p_producto_id: Number(movimiento.producto_id),
        p_tipo_movimiento: movimiento.tipo_movimiento,
        p_cantidad: cantidadMovida,
        p_descripcion: `${movimiento.motivo}${movimiento.observaciones ? ' - ' + movimiento.observaciones : ''}`,
        p_precio_unitario: movimiento.precio_unitario ? parseFloat(movimiento.precio_unitario) : null,
        p_motivo: movimiento.motivo,
        p_observaciones: movimiento.observaciones || null,
      });

      if (error) {
        console.error('Error de Supabase:', error);
        setError(`No se pudo registrar el movimiento de forma segura: ${error.message}`);
      } else {
        const stockNuevo = Number(data?.stock_nuevo);
        if (!Number.isFinite(stockNuevo)) {
          throw new Error('Supabase no devolvió el stock actualizado del producto.');
        }

        const fueReintento = Boolean(data?.ya_registrado);
        alert(
          fueReintento
            ? `✅ Este movimiento ya estaba registrado. Stock actual: ${stockNuevo}`
            : `✅ Movimiento registrado. Stock actualizado: ${data.stock_anterior} → ${stockNuevo}`
        );

        requestIdRef.current = null;
        setMovimiento({
          producto_id: '',
          tipo_movimiento: 'entrada',
          cantidad: '',
          precio_unitario: '',
          motivo: '',
          observaciones: ''
        });
        setBusqueda('');
        cargarProductos();
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setError('Error inesperado: ' + err.message);
    }
    setLoading(false);
    submittingRef.current = false;
  };

  const actualizarMovimiento = (cambios) => {
    requestIdRef.current = null;
    setMovimiento((actual) => ({ ...actual, ...cambios }));
  };

  const limpiarBusqueda = () => {
    setBusqueda('');
  };

  // Opciones para los menús desplegables de motivos
  const motivosEntrada = [
    { value: 'compra', label: 'Compra' },
    { value: 'devolucion', label: 'Devolución' },
    { value: 'ajuste', label: 'Ajuste de inventario' }
  ];

  const motivosSalida = [
    { value: 'venta', label: 'Venta' },
    { value: 'devolucion', label: 'Devolución' },
    { value: 'ajuste', label: 'Ajuste de inventario' },
    { value: 'merma', label: 'Merma/pérdida' },
    { value: 'transferencia', label: 'Transferencia' }
  ];

  return (
    <div className="movimientos-container">
      {/* Header */}
      <div className="movimientos-header">
        <h1 className="movimientos-title">CONTROL DE INVENTARIO</h1>
        <p className="movimientos-subtitle">Registro de movimientos de productos</p>
      </div>

      {/* Mostrar error si existe */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError('')} className="close-error">X</button>
        </div>
      )}

      {/* Formulario */}
      <div className="movimientos-content">
        <form onSubmit={handleSubmit} className="movimientos-form">
          
          {/* Buscador de Productos */}
          <div className="form-group">
            <label className="form-label">
              🔍 Buscar Producto
            </label>
            <div className="search-container">
              <input
                type="text"
                placeholder="Escribe el nombre o ID del producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="search-input"
              />
              {busqueda && (
                <button 
                  type="button" 
                  onClick={limpiarBusqueda}
                  className="clear-search"
                  title="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>
            {busqueda && (
              <div className="search-info">
                <span>
                  {productosFiltrados.length} producto(s) encontrado(s)
                  {productosFiltrados.length === 0 && ' - No se encontraron resultados'}
                </span>
              </div>
            )}
          </div>

          {/* Producto */}
          <div className="form-group">
            <label className="form-label">
              Producto *
            </label>
            <select
              value={movimiento.producto_id}
              onChange={(e) => actualizarMovimiento({ producto_id: e.target.value })}
              required
              className="form-select"
              disabled={loading}
            >
              <option value="">Seleccionar Producto</option>
              {productosFiltrados.map((producto) => (
                <option key={producto.id} value={producto.id}>
                  {producto.nombre} - Stock: {producto.stock} - ID: {producto.id}
                </option>
              ))}
            </select>
            {productosFiltrados.length === 0 && busqueda && (
              <div className="no-results">
                No se encontraron productos que coincidan con "{busqueda}"
              </div>
            )}
          </div>

          {/* Tipo de Movimiento y Cantidad en misma línea */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Tipo de Movimiento *
              </label>
              <select
                value={movimiento.tipo_movimiento}
                onChange={(e) => actualizarMovimiento({ tipo_movimiento: e.target.value, motivo: '' })}
                required
                className="form-select"
                disabled={loading}
              >
                <option value="entrada">📥 Entrada (Aumenta stock)</option>
                <option value="salida">📤 Salida (Disminuye stock)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Cantidad *
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ej: 10"
                value={movimiento.cantidad}
                onChange={(e) => actualizarMovimiento({ cantidad: e.target.value })}
                required
                className="form-input"
                disabled={loading}
              />
            </div>
          </div>

          {/* Precio Unitario y Motivo en misma línea */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">
                Precio Unitario (Opcional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 5800"
                value={movimiento.precio_unitario}
                onChange={(e) => actualizarMovimiento({ precio_unitario: e.target.value })}
                className="form-input"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Motivo *
              </label>
              <select
                value={movimiento.motivo}
                onChange={(e) => actualizarMovimiento({ motivo: e.target.value })}
                required
                className="form-select"
                disabled={loading}
              >
                <option value="">Seleccionar motivo</option>
                {movimiento.tipo_movimiento === 'entrada'
                  ? motivosEntrada.map((motivo) => (
                      <option key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </option>
                    ))
                  : motivosSalida.map((motivo) => (
                      <option key={motivo.value} value={motivo.value}>
                        {motivo.label}
                      </option>
                    ))
                }
              </select>
            </div>
          </div>

          {/* Observaciones */}
          <div className="form-group">
            <label className="form-label">
              Observaciones (Opcional)
            </label>
            <textarea
              placeholder="Detalles adicionales del movimiento..."
              value={movimiento.observaciones}
              onChange={(e) => actualizarMovimiento({ observaciones: e.target.value })}
              rows="3"
              className="form-textarea"
              disabled={loading}
            />
          </div>

          {/* Botón */}
          <div className="form-actions">
            <button 
              type="submit" 
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'Procesando...' : 'Registrar Movimiento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}