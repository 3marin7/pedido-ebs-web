// src/components/ProductoPreventa.jsx
import React, { useState } from 'react';
import './ProductoPreventa.css';

/**
 * Tarjeta de producto en pre-venta
 */
const ProductoPreventa = ({
  producto,
  onAgregar,
  mostrarDescripcionPreventa = true,
}) => {
  const [cantidad, setCantidad] = useState(1);
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  const daysUntilAvailable = () => {
    if (!producto.fecha_disponibilidad) return null;
    const hoy = new Date();
    const fecha = new Date(producto.fecha_disponibilidad);
    const diff = Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const diasRestantes = daysUntilAvailable();

  const handleAgregar = () => {
    onAgregar({
      ...producto,
      cantidad,
      es_preventa: true,
    });
    setCantidad(1);
  };

  return (
    <div className="producto-preventa-card">
      {/* Badge de pre-venta */}
      <div className="badge-preventa">
        <span className="badge-icon">🔔</span>
        <span className="badge-text">PRE-VENTA</span>
      </div>

      {/* Imagen */}
      {producto.imagen_url && (
        <div className="imagen-container-preventa">
          <img
            src={producto.imagen_url}
            alt={producto.nombre}
            className="imagen-preventa"
          />
        </div>
      )}

      {/* Contenido */}
      <div className="contenido-preventa">
        {/* Nombre y disponibilidad */}
        <h3 className="nombre-preventa">{producto.nombre}</h3>

        {diasRestantes !== null && (
          <div className="disponibilidad-preventa">
            <span className="dias-restantes">
              ⏰ Disponible en {diasRestantes} días
            </span>
            <span className="fecha-disponible">
              {new Date(producto.fecha_disponibilidad).toLocaleDateString('es-CO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
        )}

        {/* Descripción */}
        {producto.descripcion && (
          <p className="descripcion-preventa">{producto.descripcion}</p>
        )}

        {/* Descripción especial de preventa */}
        {mostrarDescripcionPreventa && producto.descripcion_preventa && (
          <div className="descripcion-preventa-especial">
            <p className="titulo-especial">📋 Características de la Pre-venta:</p>
            <p>{producto.descripcion_preventa}</p>
          </div>
        )}

        {/* Stock de preventa */}
        {producto.stock_preventa > 0 && (
          <div className="stock-preventa-info">
            <span className="stock-label">Reservas recibidas:</span>
            <span className="stock-numero">{producto.stock_preventa} unidades</span>
          </div>
        )}

        {/* Precio */}
        <div className="precio-preventa">
          <span className="etiqueta-precio">Precio Pre-venta:</span>
          <span className="numero-precio">
            {new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
            }).format(producto.precio_venta)}
          </span>
        </div>

        {/* Selector de cantidad */}
        <div className="selector-cantidad">
          <label htmlFor={`cant-${producto.id}`}>Cantidad:</label>
          <div className="input-group">
            <button
              onClick={() => setCantidad(Math.max(1, cantidad - 1))}
              className="btn-cantidad"
              disabled={cantidad === 1}
            >
              −
            </button>
            <input
              id={`cant-${producto.id}`}
              type="number"
              min="1"
              value={cantidad}
              onChange={(e) =>
                setCantidad(Math.max(1, parseInt(e.target.value) || 1))
              }
              className="input-cantidad"
            />
            <button
              onClick={() => setCantidad(cantidad + 1)}
              className="btn-cantidad"
            >
              +
            </button>
          </div>
        </div>

        {/* Botones */}
        <div className="acciones-preventa">
          <button
            onClick={handleAgregar}
            className="btn-reservar"
          >
            🛒 Reservar Ahora
          </button>
          {producto.descripcion_preventa && (
            <button
              onClick={() => setMostrarDetalles(!mostrarDetalles)}
              className="btn-detalles"
            >
              {mostrarDetalles ? '▲ Menos' : '▼ Más'}
            </button>
          )}
        </div>

        {/* Info adicional */}
        <div className="info-preventa-footer">
          <p className="texto-pequeno">
            ✅ Tu reserva se confirmará automáticamente cuando el producto esté disponible
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProductoPreventa;
