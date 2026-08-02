/**
 * VALIDADORES DE LÍMITES DE FACTURACIÓN
 * Funciones para validar si un cliente puede recibir una factura
 * según tipo, antigüedad de facturas previas y montos
 */

import { supabase } from './supabaseConfig';

/**
 * Obtener límites de facturación para un cliente
 * @param {number} clienteId - ID del cliente
 * @returns {Promise<Object>} Límites y restricciones
 */
export const obtenerLimitesCliente = async (clienteId) => {
  try {
    const { data, error } = await supabase
      .from('clientes_con_limites')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error obteniendo límites:', error);
    return null;
  }
};

/**
 * Validar si se puede facturar según antigüedad de facturas previas
 * @param {number} clienteId - ID del cliente
 * @param {number} diasMaximos - Días máximos de antigüedad permitida
 * @returns {Promise<Object>} { permitida: bool, motivo: string, detalles: {} }
 */
export const validarAntiguedadFacturas = async (clienteId, diasMaximos = 30) => {
  try {
    const hoy = new Date();
    const hace30Dias = new Date(hoy.getTime() - diasMaximos * 24 * 60 * 60 * 1000);

    const { data: facturasPendientes, error } = await supabase
      .from('facturas')
      .select('id, numero_factura, fecha, total, estado')
      .eq('cliente_id', clienteId)
      .eq('estado', 'pendiente')
      .lt('fecha', hace30Dias.toISOString().split('T')[0])
      .order('fecha', { ascending: true });

    if (error) throw error;

    if (facturasPendientes && facturasPendientes.length > 0) {
      const facturaAntigua = facturasPendientes[0];
      const diasAtraso = Math.floor(
        (hoy - new Date(facturaAntigua.fecha)) / (1000 * 60 * 60 * 24)
      );

      return {
        permitida: false,
        resultado: 'BLOQUEADA',
        tipo: 'ANTIGUEDAD',
        motivo: `Cliente tiene ${facturasPendientes.length} factura(s) pendiente(s) con más de ${diasMaximos} días de antigüedad`,
        detalles: {
          facturaAntigua: facturaAntigua.numero_factura,
          diasAtraso,
          montoAdeudado: facturasPendientes.reduce((sum, f) => sum + parseFloat(f.total || 0), 0),
          facturasAtrasadas: facturasPendientes.length,
        }
      };
    }

    return {
      permitida: true,
      resultado: 'PERMITIDA',
      tipo: 'ANTIGUEDAD',
      motivo: 'Sin facturas pendientes atrasadas',
      detalles: {
        facturasPendientes: 0
      }
    };
  } catch (error) {
    console.error('Error validando antigüedad:', error);
    return {
      permitida: false,
      resultado: 'ERROR',
      tipo: 'ANTIGUEDAD',
      motivo: 'Error al validar antigüedad',
      detalles: { error: error.message }
    };
  }
};

/**
 * Validar límites de valor (mínimo y máximo) de factura
 * @param {number} totalFactura - Total de la factura
 * @param {Object} limites - Límites del cliente { valor_minimo, valor_maximo }
 * @returns {Object} { permitida: bool, motivo: string }
 */
export const validarValorFactura = (totalFactura, limites) => {
  const total = parseFloat(totalFactura) || 0;
  const minimo = parseFloat(limites?.valor_minimo_factura) || 0;
  const maximo = parseFloat(limites?.valor_maximo_factura) || Infinity;

  if (total < minimo) {
    return {
      permitida: false,
      resultado: 'BLOQUEADA',
      tipo: 'VALOR_MINIMO',
      motivo: `El valor mínimo de factura es ${minimo.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`,
      detalles: { valorFactura: total, valorMinimo: minimo }
    };
  }

  if (total > maximo) {
    return {
      permitida: false,
      resultado: 'BLOQUEADA',
      tipo: 'VALOR_MAXIMO',
      motivo: `El valor máximo de factura es ${maximo.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`,
      detalles: { valorFactura: total, valorMaximo: maximo }
    };
  }

  return {
    permitida: true,
    resultado: 'PERMITIDA',
    tipo: 'VALOR',
    motivo: 'Valor de factura dentro de los límites',
    detalles: { valorFactura: total, minimo, maximo }
  };
};

/**
 * Validar si cliente puede comprar a crédito y tiene crédito disponible
 * @param {number} clienteId - ID del cliente
 * @param {number} montoNuevaFactura - Monto de la nueva factura
 * @param {Object} limites - Límites del cliente
 * @returns {Promise<Object>} { permitida: bool, motivo: string }
 */
export const validarCreditoDisponible = async (clienteId, montoNuevaFactura, limites) => {
  try {
    if (!limites?.puede_comprar_credito) {
      return {
        permitida: false,
        resultado: 'BLOQUEADA',
        tipo: 'CREDITO_NO_PERMITIDO',
        motivo: 'Este tipo de cliente no puede comprar a crédito',
        detalles: {}
      };
    }

    // Obtener deuda actual del cliente
    const { data: facturasDeuda, error } = await supabase
      .from('facturas')
      .select('total, estado')
      .eq('cliente_id', clienteId)
      .eq('estado', 'pendiente')
      .eq('tipo_pago', 'credito');

    if (error) throw error;

    const deudaActual = facturasDeuda?.reduce((sum, f) => sum + parseFloat(f.total || 0), 0) || 0;
    const deudaTotal = deudaActual + montoNuevaFactura;
    const creditoDisponible = limites.valor_maximo_credito - deudaActual;

    if (deudaTotal > limites.valor_maximo_credito) {
      return {
        permitida: false,
        resultado: 'BLOQUEADA',
        tipo: 'CREDITO_EXCEDIDO',
        motivo: `Crédito insuficiente. Límite: ${limites.valor_maximo_credito}, Deuda actual: ${deudaActual}, Nueva factura: ${montoNuevaFactura}`,
        detalles: {
          deudaActual,
          creditoDisponible: creditoDisponible > 0 ? creditoDisponible : 0,
          creditoLimite: limites.valor_maximo_credito,
          deudaTotal,
          facturasDeuda: facturasDeuda?.length || 0
        }
      };
    }

    return {
      permitida: true,
      resultado: 'PERMITIDA',
      tipo: 'CREDITO',
      motivo: `Crédito disponible: ${creditoDisponible.toLocaleString('es-CO', { style: 'currency', currency: 'COP' })}`,
      detalles: {
        deudaActual,
        creditoDisponible,
        creditoLimite: limites.valor_maximo_credito
      }
    };
  } catch (error) {
    console.error('Error validando crédito:', error);
    return {
      permitida: false,
      resultado: 'ERROR',
      tipo: 'CREDITO',
      motivo: 'Error al validar crédito disponible',
      detalles: { error: error.message }
    };
  }
};

/**
 * Validación COMPLETA: Ejecutar todas las validaciones
 * @param {number} clienteId - ID del cliente
 * @param {number} totalFactura - Total a facturar
 * @param {string} tipoPago - 'contado' o 'credito'
 * @returns {Promise<Object>} { permitida: bool, validaciones: [], resumen: string }
 */
export const validarFacturacionCompleta = async (clienteId, totalFactura, tipoPago = 'contado') => {
  try {
    const limites = await obtenerLimitesCliente(clienteId);
    if (!limites) {
      return {
        permitida: false,
        validaciones: [],
        resumen: 'No se encontraron límites para este cliente'
      };
    }

    const validaciones = [];

    // 1. Validar antigüedad
    const valAntiguedad = await validarAntiguedadFacturas(
      clienteId,
      limites.dias_antiguedad_maximo
    );
    validaciones.push(valAntiguedad);

    // 2. Validar valor
    const valValor = validarValorFactura(totalFactura, limites);
    validaciones.push(valValor);

    // 3. Validar crédito si es a crédito
    if (tipoPago === 'credito') {
      const valCredito = await validarCreditoDisponible(clienteId, totalFactura, limites);
      validaciones.push(valCredito);
    }

    // Determinar si está permitida
    const permitida = validaciones.every(v => v.permitida !== false);
    const bloqueadas = validaciones.filter(v => v.resultado === 'BLOQUEADA');

    // Registrar en auditoría
    if (!permitida) {
      await registrarValidacionFacturacion(clienteId, null, validaciones);
    }

    return {
      permitida,
      validaciones,
      resumen: permitida
        ? 'Facturación permitida ✓'
        : `Facturación bloqueada: ${bloqueadas.map(v => v.motivo).join(', ')}`
    };
  } catch (error) {
    console.error('Error en validación completa:', error);
    return {
      permitida: false,
      validaciones: [],
      resumen: 'Error al realizar validaciones'
    };
  }
};

/**
 * Registrar validación en auditoría
 * @param {number} clienteId - ID del cliente
 * @param {string} numeroFactura - Número de factura (opcional)
 * @param {Array} validaciones - Array de validaciones realizadas
 */
export const registrarValidacionFacturacion = async (clienteId, numeroFactura, validaciones) => {
  try {
    for (const validacion of validaciones) {
      if (validacion.resultado !== 'PERMITIDA') {
        await supabase.from('validaciones_facturacion').insert({
          cliente_id: clienteId,
          factura_numero: numeroFactura,
          tipo_validacion: validacion.tipo,
          resultado: validacion.resultado,
          motivo: validacion.motivo,
          detalles: validacion.detalles
        });
      }
    }
  } catch (error) {
    console.error('Error registrando validación:', error);
  }
};

/**
 * Obtener reporte de clientes por tipo y límites
 * @returns {Promise<Array>} Lista de clientes con sus tipos y límites
 */
export const reporteClientesConLimites = async () => {
  try {
    const { data, error } = await supabase
      .from('clientes_con_limites')
      .select('*')
      .eq('activo', true)
      .order('tipo_cliente', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo reporte:', error);
    return [];
  }
};

/**
 * Actualizar tipo de cliente
 * @param {number} clienteId - ID del cliente
 * @param {number} tipoClienteId - ID del tipo de cliente
 */
export const actualizarTipoCliente = async (clienteId, tipoClienteId) => {
  try {
    const { error } = await supabase
      .from('clientes')
      .update({ tipo_cliente_id: tipoClienteId })
      .eq('id', clienteId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error actualizando tipo de cliente:', error);
    return false;
  }
};
