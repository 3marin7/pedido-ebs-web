// EJEMPLO: Cómo integrar Pre-venta en tu Carrito/Checkout
// Este archivo muestra cómo actualizar tu componente de carrito

/*
ANTES (sin preventa):
- Los productos se agregaban al carrito directamente
- Se creaba un solo pedido con todos los productos

DESPUÉS (con preventa):
- Los productos normales y en preventa se mantienen separados en el carrito
- Se muestra información de disponibilidad para preventa
- Al checkout, se crean dos pedidos si es necesario
*/

// ============================================
// Ejemplo 1: Agregar productos al carrito
// ============================================

import { usePreventaProducts } from '../hooks/usePreventaProducts';

function MiCarrito() {
  const [carrito, setCarrito] = useState([]);
  const { productosPreventa } = usePreventaProducts();

  const agregarAlCarrito = (producto, cantidad) => {
    const itemCarrito = {
      id: producto.id,
      nombre: producto.nombre,
      precio_venta: producto.precio_venta,
      cantidad,
      es_preventa: producto.es_preventa, // ← NUEVO: marcar si es preventa
      fecha_disponibilidad: producto.fecha_disponibilidad,
      imagen_url: producto.imagen_url,
    };

    setCarrito([...carrito, itemCarrito]);
  };

  return (
    <div className="carrito">
      {/* Mostrar productos normales y preventa por separado */}
      <div className="seccion-normales">
        <h3>📦 Productos Disponibles</h3>
        {carrito
          .filter(p => !p.es_preventa)
          .map(item => (
            <div key={item.id} className="item-carrito">
              <span>{item.nombre} x{item.cantidad}</span>
              <span>{item.precio_venta * item.cantidad}</span>
            </div>
          ))}
      </div>

      <div className="seccion-preventa">
        <h3>🔔 Pre-venta</h3>
        {carrito
          .filter(p => p.es_preventa)
          .map(item => (
            <div key={item.id} className="item-preventa">
              <span>{item.nombre} x{item.cantidad}</span>
              <span className="disponible">
                ⏰ Disponible {new Date(item.fecha_disponibilidad).toLocaleDateString()}
              </span>
              <span>{item.precio_venta * item.cantidad}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

// ============================================
// Ejemplo 2: Procesar checkout con preventa
// ============================================

import { procesarCarritoConPreventa } from '../lib/preventaUtils';

async function procesarCheckout(datosCliente) {
  try {
    // carrito = [...productos normales y en preventa]

    const resultado = await procesarCarritoConPreventa(
      carrito,
      {
        nombre: datosCliente.nombre,
        telefono: datosCliente.telefono,
        direccion: datosCliente.direccion,
        notas: datosCliente.notas,
      }
    );

    if (resultado.exitoso) {
      // ✅ Éxito
      console.log('Pedido creado:', resultado.pedidoId);
      console.log('Pre-ventas creadas:', resultado.prevPedidosCreados.length);

      // Mostrar mensaje al cliente
      if (resultado.totalProductosPreventa > 0) {
        alert(`
          ✅ Pedido creado exitosamente!
          
          Productos disponibles: ${resultado.totalProductosNormales}
          Pre-ventas (se cumplirán automáticamente): ${resultado.totalProductosPreventa}
          
          Recibirás confirmación cuando los productos estén disponibles.
        `);
      }
    } else {
      // ❌ Error
      alert('Error: ' + resultado.error);
    }
  } catch (error) {
    console.error('Error en checkout:', error);
  }
}

// ============================================
// Ejemplo 3: Mostrar resumen en checkout
// ============================================

import { formatearResumenCarrito, calcularDiasRestantes } from '../lib/preventaUtils';

function ResumenCheckout({ carrito }) {
  const resumen = formatearResumenCarrito(carrito);

  return (
    <div className="resumen-checkout">
      <h2>Resumen de tu orden</h2>

      <div className="resumen-items">
        <div className="fila">
          <span>Productos disponibles:</span>
          <span>{resumen.normales}</span>
        </div>

        {resumen.preventa > 0 && (
          <>
            <div className="fila fila-preventa">
              <span>🔔 Productos en Pre-venta:</span>
              <span>{resumen.preventa}</span>
            </div>

            {/* Listar productos en preventa con sus fechas */}
            <div className="detalles-preventa">
              {resumen.productosPreventa.map(prod => (
                <div key={prod.nombre} className="item-preventa-resumen">
                  <strong>{prod.nombre}</strong>
                  <span className="cantidad">x{prod.cantidad}</span>
                  <span className="disponibilidad">
                    Disponible en {prod.diasRestantes} días
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="totales">
        <div className="fila">
          <strong>Total:</strong>
          <strong>${resumen.totalPrecio}</strong>
        </div>
      </div>

      <button onClick={() => procesarCheckout(datosCliente)}>
        ✅ Completar Compra
      </button>
    </div>
  );
}

// ============================================
// Ejemplo 4: Actualizar tabla pedidos cuando entra stock
// ============================================

/*
TRIGGER AUTOMÁTICO en SQL:

Cuando un admin marca un producto como:
- es_preventa = FALSE
- stock = cantidad_ingreso

El trigger automáticamente:
1. Busca todos los preventa_pedidos con estado='reservado'
2. Los marca como cumplidos (en orden FIFO)
3. Decrementa el stock
4. Registra en historial_preventa

El cliente verá su pedido auto-cumplido en su panel.
*/

// ============================================
// Ejemplo 5: CSS para mostrar items de preventa
// ============================================

/*
.item-carrito.preventa {
  background: #fef5ff;
  border-left: 4px solid #a855f7;
  padding: 12px;
  margin: 8px 0;
  border-radius: 8px;
}

.item-carrito.preventa::before {
  content: '🔔 PRE-VENTA';
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: #a855f7;
  margin-bottom: 6px;
}

.disponible {
  display: block;
  font-size: 0.85rem;
  color: #9b5de5;
  margin-top: 4px;
}

.seccion-preventa {
  background: linear-gradient(135deg, #fef5ff 0%, #fff9fe 100%);
  padding: 16px;
  border-radius: 12px;
  margin-top: 16px;
}
*/

// ============================================
// Ejemplo 6: Notificar al cliente
// ============================================

/*
Cuando el admin activa el producto del inventario,
el trigger ejecuta y marca los preventa_pedidos como cumplidos.

Para notificar al cliente, puedes:

1. Email automático (usando Function de Supabase):
   - Crear Function que envíe email cuando preventa_pedido.estado = 'cumplido'

2. Trigger en la base de datos:
   - Después de UPDATE preventa_pedidos SET estado='cumplido'
   - Insertar registro en tabla de notificaciones

3. Dentro del app:
   - Verificar estado en tiempo real
   - Mostrar notificación en UI
*/

export default {
  agregarAlCarrito,
  procesarCheckout,
  ResumenCheckout,
  formatearResumenCarrito,
  calcularDiasRestantes,
};
