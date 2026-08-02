/**
 * EJEMPLO DE INTEGRACIÓN EN InvoiceScreen.jsx
 * 
 * Este archivo muestra cómo integrar las validaciones de límites
 * en el componente de facturación existente.
 * 
 * CAMBIOS NECESARIOS:
 * 1. Importar validador
 * 2. Llamar validación antes de guardar
 * 3. Mostrar errores/advertencias
 */

// ============================================
// 1. AGREGAR IMPORTACIONES AL INICIO
// ============================================

import { validarFacturacionCompleta } from '../lib/validadorFacturacion';

// ============================================
// 2. EN LA FUNCIÓN guardarFactura() 
// ============================================

const guardarFactura = async () => {
  try {
    // Validaciones básicas existentes
    if (!cliente || !codigoClienteFinal) {
      alert('Selecciona un cliente válido');
      return;
    }

    if (productos.length === 0) {
      alert('Agrega al menos un producto');
      return;
    }

    if (!vendedorSeleccionado) {
      alert('Selecciona un vendedor');
      return;
    }

    // Calcular total
    const totalFactura = productos.reduce((sum, p) => 
      sum + (parseFloat(p.cantidad) * parseFloat(p.precio_venta)), 0
    );

    // ⭐ NUEVA VALIDACIÓN: Verificar límites de facturación
    console.log('🔍 Validando límites de facturación...');
    
    const validacion = await validarFacturacionCompleta(
      clienteId,           // ID del cliente seleccionado
      totalFactura,        // Total a facturar
      tipoPagoSeleccionado // 'contado' o 'credito'
    );

    // Si hay restricciones de facturación
    if (!validacion.permitida) {
      // Construir mensaje detallado con motivos de bloqueo
      const bloqueados = validacion.validaciones
        .filter(v => v.resultado === 'BLOQUEADA')
        .map(v => {
          let icon = '❌';
          if (v.tipo === 'ANTIGUEDAD') icon = '📅';
          else if (v.tipo === 'VALOR_MINIMO' || v.tipo === 'VALOR_MAXIMO') icon = '💰';
          else if (v.tipo === 'CREDITO') icon = '💳';
          
          return `${icon} ${v.motivo}`;
        })
        .join('\n');

      const mensaje = `
⛔ NO SE PUEDE FACTURAR

Razones de bloqueo:
${bloqueados}

Por favor, resuelve estos problemas antes de intentar nuevamente.
      `;

      alert(mensaje);
      console.error('Facturación rechazada:', validacion);
      return;
    }

    // ✅ Validación pasó, proceder con guardado
    console.log('✅ Validaciones pasadas, procediendo a guardar...');

    // Validaciones de stock (si existen)
    const verificarStock = await verificarStockAntesDeVenta();
    if (!verificarStock) {
      alert('Error de stock: revisa inventario');
      return;
    }

    // Generar número de factura
    const numeroFactura = await generarNumeroFactura();

    // Insertar factura
    const { data: facturaGuardada, error: errorFactura } = await supabase
      .from('facturas')
      .insert([{
        numero_factura: numeroFactura,
        cliente_id: clienteId,
        cliente: cliente,
        codigo_cliente: codigoClienteFinal,
        vendedor: vendedorSeleccionado,
        fecha: new Date().toISOString().split('T')[0],
        subtotal: subtotal,
        impuestos: impuestos,
        descuento: descuentoTotal,
        total: totalFactura,
        tipo_pago: tipoPagoSeleccionado,
        estado: 'pendiente',
        productos: JSON.stringify(productos),
        // ... otros campos
      }])
      .select()
      .single();

    if (errorFactura) throw errorFactura;

    // Actualizar inventario
    await actualizarInventario(productos, numeroFactura);

    // 🎉 ÉXITO
    setExito(true);
    alert(`✓ Factura #${numeroFactura} guardada exitosamente`);
    
    // Limpiar formulario
    limpiarFormulario();

  } catch (error) {
    console.error('Error guardando factura:', error);
    alert('Error: ' + error.message);
  }
};

// ============================================
// 3. COMPONENTE PARA MOSTRAR ADVERTENCIAS
// ============================================

// Agregar dentro del JSX, antes del botón de guardar:

{/* Mostrar límites disponibles del cliente */}
{cliente && (
  <div className="limites-info-box">
    <h4>📊 Límites de Facturación para este Cliente</h4>
    {limitesCliente && (
      <div className="limites-grid">
        <div className="limite-item">
          <span className="label">Antigüedad máxima sin pagar:</span>
          <span className="valor">{limitesCliente.dias_antiguedad_maximo} días</span>
        </div>
        <div className="limite-item">
          <span className="label">Valor mínimo por factura:</span>
          <span className="valor">
            ${parseFloat(limitesCliente.valor_minimo_factura).toLocaleString()}
          </span>
        </div>
        <div className="limite-item">
          <span className="label">Valor máximo por factura:</span>
          <span className="valor">
            ${parseFloat(limitesCliente.valor_maximo_factura).toLocaleString()}
          </span>
        </div>
        {limitesCliente.puede_comprar_credito && (
          <div className="limite-item">
            <span className="label">Crédito máximo permitido:</span>
            <span className="valor">
              ${parseFloat(limitesCliente.valor_maximo_credito).toLocaleString()}
            </span>
          </div>
        )}
        <div className="limite-item">
          <span className="label">Tipo de cliente:</span>
          <span className="valor badge">{limitesCliente.tipo_cliente}</span>
        </div>
      </div>
    )}
  </div>
)}

// ============================================
// 4. AGREGAR EFECTO PARA CARGAR LÍMITES
// ============================================

useEffect(() => {
  if (clienteId) {
    cargarLimitesCliente();
  }
}, [clienteId]);

const cargarLimitesCliente = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes_con_limites')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (error) throw error;
    setLimitesCliente(data);
  } catch (error) {
    console.error('Error cargando límites:', error);
  }
};

// ============================================
// 5. VALIDACIÓN EN TIEMPO REAL (OPCIONAL)
// ============================================

// Advertencia en tiempo real mientras se construye la factura
useEffect(() => {
  if (clienteId && totalFactura > 0) {
    validarFacturaEnTiempoReal();
  }
}, [clienteId, totalFactura, tipoPagoSeleccionado]);

const validarFacturaEnTiempoReal = async () => {
  try {
    const validacion = await validarFacturacionCompleta(
      clienteId,
      totalFactura,
      tipoPagoSeleccionado
    );

    // Mostrar advertencias pero NO bloquear edición
    if (!validacion.permitida) {
      const advertencias = validacion.validaciones
        .filter(v => v.resultado === 'BLOQUEADA')
        .map(v => v.motivo);
      
      setAdvertencias(advertencias);
    } else {
      setAdvertencias([]);
    }
  } catch (error) {
    console.error('Error validando en tiempo real:', error);
  }
};

// En JSX, mostrar advertencias:
{advertencias.length > 0 && (
  <div className="advertencias-facturacion">
    <h4>⚠️ Advertencias:</h4>
    {advertencias.map((adv, i) => (
      <p key={i}>• {adv}</p>
    ))}
  </div>
)}

// ============================================
// 6. ESTILOS CSS PARA NUEVA UI
// ============================================

/* Agregar a InvoiceScreen.css */

.limites-info-box {
  background: #e8f4f8;
  border: 2px solid #3498db;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
}

.limites-info-box h4 {
  margin: 0 0 15px 0;
  color: #2980b9;
  font-size: 14px;
}

.limites-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 10px;
}

.limite-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  background: white;
  border-radius: 4px;
  font-size: 12px;
}

.limite-item .label {
  font-weight: 600;
  color: #2c3e50;
}

.limite-item .valor {
  color: #3498db;
  font-weight: bold;
}

.limite-item .badge {
  background: #3498db;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
}

.advertencias-facturacion {
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 15px;
}

.advertencias-facturacion h4 {
  margin: 0 0 8px 0;
  color: #856404;
  font-size: 13px;
}

.advertencias-facturacion p {
  margin: 3px 0;
  color: #856404;
  font-size: 12px;
}

// ============================================
// 7. ESTADO DEL COMPONENTE REQUERIDO
// ============================================

// Agregar a useState:
const [limitesCliente, setLimitesCliente] = useState(null);
const [advertencias, setAdvertencias] = useState([]);

// ============================================
// FIN DE EJEMPLO
// ============================================
