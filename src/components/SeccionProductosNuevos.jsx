// src/components/SeccionProductosNuevos.jsx
import React, { useState } from 'react';
import ProductoPreventa from './ProductoPreventa';
import './SeccionProductosNuevos.css';

/**
 * Sección para mostrar productos nuevos en pre-venta
 * Se integra en el catálogo como una sección separada
 */
const SeccionProductosNuevos = ({
  productosPreventa = [],
  onAgregarAlCarrito,
  loading = false,
}) => {
  const [ordenar, setOrdenar] = useState('proximamente'); // 'proximamente', 'masRecientes', 'menosPrecio'
  const [filtroCategoria, setFiltroCategoria] = useState('todos');

  // Extraer categorías únicas
  const categorias = ['todos', ...new Set(productosPreventa.map(p => p.categoria))];

  // Filtrar y ordenar productos
  const productosOrdenados = (() => {
    let resultado = [...productosPreventa];

    // Filtrar por categoría
    if (filtroCategoria !== 'todos') {
      resultado = resultado.filter(p => p.categoria === filtroCategoria);
    }

    // Ordenar
    switch (ordenar) {
      case 'proximamente':
        resultado.sort((a, b) => {
          const fechaA = new Date(a.fecha_disponibilidad || '9999-12-31');
          const fechaB = new Date(b.fecha_disponibilidad || '9999-12-31');
          return fechaA - fechaB;
        });
        break;

      case 'masRecientes':
        resultado.sort((a, b) => {
          const fechaA = new Date(a.created_at || 0);
          const fechaB = new Date(b.created_at || 0);
          return fechaB - fechaA;
        });
        break;

      case 'menosPrecio':
        resultado.sort((a, b) => a.precio_venta - b.precio_venta);
        break;

      default:
        break;
    }

    return resultado;
  })();

  if (loading) {
    return (
      <div className="seccion-nuevos-loading">
        <div className="spinner"></div>
        <p>Cargando productos nuevos...</p>
      </div>
    );
  }

  if (productosPreventa.length === 0) {
    return null;
  }

  return (
    <section className="seccion-productos-nuevos">
      <div className="seccion-header">
        <div className="titulo-seccion">
          <h2>
            <span className="icono-titulo">🎁</span>
            Productos Nuevos (Pre-venta)
          </h2>
          <p className="subtitulo-seccion">
            Reserva hoy los productos que llegarán pronto
          </p>
        </div>

        {/* Controles de filtrado y ordenamiento */}
        <div className="controles-seccion">
          {/* Ordenar */}
          <div className="control-grupo">
            <label htmlFor="ordenar-nuevos">Ordenar por:</label>
            <select
              id="ordenar-nuevos"
              value={ordenar}
              onChange={(e) => setOrdenar(e.target.value)}
              className="select-control"
            >
              <option value="proximamente">⏰ Próximamente</option>
              <option value="masRecientes">✨ Más Recientes</option>
              <option value="menosPrecio">💰 Menor Precio</option>
            </select>
          </div>

          {/* Filtrar por categoría */}
          {categorias.length > 1 && (
            <div className="control-grupo">
              <label htmlFor="categoria-nuevos">Categoría:</label>
              <select
                id="categoria-nuevos"
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                className="select-control"
              >
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'todos' ? 'Todas las categorías' : cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mostrar cantidad */}
          <div className="cantidad-productos">
            Mostrando {productosOrdenados.length} de {productosPreventa.length}
          </div>
        </div>
      </div>

      {/* Grid de productos */}
      {productosOrdenados.length > 0 ? (
        <div className="grid-productos-nuevos">
          {productosOrdenados.map((producto) => (
            <ProductoPreventa
              key={producto.id}
              producto={producto}
              onAgregar={onAgregarAlCarrito}
            />
          ))}
        </div>
      ) : (
        <div className="sin-productos-nuevos">
          <p>No hay productos nuevos en esta categoría</p>
        </div>
      )}

      {/* Banner informativo */}
      <div className="banner-preventa">
        <div className="banner-contenido">
          <h3>¿Cómo funciona la Pre-venta?</h3>
          <ul className="lista-beneficios">
            <li>✅ Reserva productos antes de que se agoten</li>
            <li>✅ Precio especial de pre-venta</li>
            <li>✅ Tu pedido se confirma automáticamente cuando llega el stock</li>
            <li>✅ Recibir notificación cuando esté disponible</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

export default SeccionProductosNuevos;
