// src/lib/supabaseQueries.js
import { supabase } from './supabase';

/**
 * Obtiene las ventas agrupadas por mes para un año específico
 * @param {number} year - Año para filtrar (por defecto año actual)
 * @returns {Array} Array de objetos con {mes: string, ventas: number}
 */
export const getVentasMensuales = async (year = new Date().getFullYear()) => {
  try {
    const { data, error } = await supabase
      .from('facturas')
      .select('fecha, total')
      .gte('fecha', `${year}-01-01`)
      .lte('fecha', `${year}-12-31`)
      .order('fecha');

    if (error) {
      console.error('Error fetching ventas mensuales:', error);
      throw error;
    }

    // Agrupar por mes
    const ventasPorMes = Array(12).fill(0);
    
    data.forEach(factura => {
      const mes = new Date(factura.fecha).getMonth(); // 0-11
      ventasPorMes[mes] += factura.total || 0;
    });

    // Formatear para la gráfica
    const meses = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];

    return ventasPorMes.map((total, index) => ({
      mes: meses[index],
      ventas: total
    }));

  } catch (error) {
    console.error('Error en getVentasMensuales:', error);
    return [];
  }
};

/**
 * Obtiene los cobros diarios de los últimos 30 días
 * @returns {Array} Array de objetos con {fecha: string, cobros: number}
 */
export const getCobrosDiarios = async () => {
  try {
    // Calcular fecha de hace 30 días
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const fechaInicio = hace30Dias.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('facturas')
      .select('fecha, total, estado_pago')
      .gte('fecha', fechaInicio)
      .order('fecha');

    if (error) {
      console.error('Error fetching cobros diarios:', error);
      throw error;
    }

    // Agrupar por día - SI TIENES CAMPO estado_pago:
    const cobrosPorDia = {};
    
    data.forEach(factura => {
      // Si tienes campo estado_pago, filtrar solo los pagados
      // Si no tienes ese campo, quita la siguiente línea
      // if (factura.estado_pago !== 'pagado') return;
      
      const dia = factura.fecha;
      cobrosPorDia[dia] = (cobrosPorDia[dia] || 0) + (factura.total || 0);
    });

    // Formatear para la gráfica
    const resultado = Object.entries(cobrosPorDia).map(([fecha, total]) => ({
      fecha,
      cobros: total
    }));

    // Ordenar por fecha
    return resultado.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  } catch (error) {
    console.error('Error en getCobrosDiarios:', error);
    return [];
  }
};

/**
 * Versión alternativa si NO tienes campo estado_pago
 * Obtiene todos los ingresos diarios (asume que todas las facturas son cobros)
 */
export const getIngresosDiarios = async () => {
  try {
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    const fechaInicio = hace30Dias.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('facturas')
      .select('fecha, total')
      .gte('fecha', fechaInicio)
      .order('fecha');

    if (error) throw error;

    const ingresosPorDia = {};
    
    data.forEach(factura => {
      const dia = factura.fecha;
      ingresosPorDia[dia] = (ingresosPorDia[dia] || 0) + (factura.total || 0);
    });

    const resultado = Object.entries(ingresosPorDia).map(([fecha, total]) => ({
      fecha,
      ingresos: total
    }));

    return resultado.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

  } catch (error) {
    console.error('Error en getIngresosDiarios:', error);
    return [];
  }
};

/**
 * Obtiene el total de ventas del mes actual
 */
export const getVentasMesActual = async () => {
  try {
    const ahora = new Date();
    const primerDiaMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1)
      .toISOString().split('T')[0];
    const ultimoDiaMes = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0)
      .toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('facturas')
      .select('total')
      .gte('fecha', primerDiaMes)
      .lte('fecha', ultimoDiaMes);

    if (error) throw error;

    return data.reduce((sum, factura) => sum + (factura.total || 0), 0);

  } catch (error) {
    console.error('Error en getVentasMesActual:', error);
    return 0;
  }
};