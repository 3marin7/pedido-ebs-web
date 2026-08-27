import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import './CalculadorSueldoVendedor.css';

const chunkArray = (array, size = 200) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const parseDateLocal = (value, endOfDay = false) => {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return endOfDay
      ? new Date(y, m - 1, d, 23, 59, 59, 999)
      : new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatInputDate = (dateValue) => {
  const date = parseDateLocal(dateValue);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatFechaCorta = (dateValue) => {
  const date = parseDateLocal(dateValue);
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const UNIDADES = ['', 'un', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DECENAS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const DECENAS_10 = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

// Convierte un número entero (0-999) a letras en español
const centenasALetras = (n) => {
  if (n === 0) return '';
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let texto = c > 0 ? CENTENAS[c] : '';

  if (resto > 0) {
    if (resto < 10) {
      texto += (texto ? ' ' : '') + UNIDADES[resto];
    } else if (resto < 20) {
      texto += (texto ? ' ' : '') + DECENAS[resto - 10];
    } else {
      const d = Math.floor(resto / 10);
      const u = resto % 10;
      texto += (texto ? ' ' : '') + DECENAS_10[d] + (u > 0 ? ` y ${UNIDADES[u]}` : '');
    }
  }
  return texto.trim();
};

// Convierte un valor monetario entero a su representación en letras (pesos colombianos)
const numeroALetras = (valor) => {
  const entero = Math.round(Math.abs(Number(valor) || 0));
  if (entero === 0) return 'Cero pesos M/CTE.';

  const millones = Math.floor(entero / 1000000);
  const miles = Math.floor((entero % 1000000) / 1000);
  const cientos = entero % 1000;

  let partes = [];

  if (millones > 0) {
    partes.push(millones === 1 ? 'un millón' : `${centenasALetras(millones)} millones`);
  }
  if (miles > 0) {
    partes.push(miles === 1 ? 'mil' : `${centenasALetras(miles)} mil`);
  }
  if (cientos > 0) {
    partes.push(centenasALetras(cientos));
  }

  const texto = partes.join(' ').replace(/\s+/g, ' ').trim();
  const textoCapitalizado = texto.charAt(0).toUpperCase() + texto.slice(1);
  return `${textoCapitalizado} pesos M/CTE.`;
};

const CalculadorSueldoVendedor = () => {
  const [vendedores, setVendedores] = useState([]);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState(null);
  const [periodo, setPeriodo] = useState('mes-actual');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  
  // Configuración de sueldo
  const [sueldoBase, setSueldoBase] = useState(1000000);
  const [porcentajeComision, setPorcentajeComision] = useState(4);

  // Colilla de pago (comprobante mensual en PDF)
  const [mostrarModalColilla, setMostrarModalColilla] = useState(false);
  const [generandoColilla, setGenerandoColilla] = useState(false);
  const [datosEmpresa, setDatosEmpresa] = useState({
    nombre: 'DROGUERÍA JIREH',
    nit: '52469246-8',
    telefono: '3209105993',
    direccion: 'Cra. 80 K # 82 A - 11 Sur Local 2, Bogotá D.C.',
    representante: 'CAROLINA BERNAL'
  });
  const [datosEmpleado, setDatosEmpleado] = useState({
    cargo: '',
    cedula: '',
    contrato: 'Término Indefinido',
    fechaIngreso: '',
    diasLiquidados: 30,
    porcentajeEPS: 4,
    porcentajeAFP: 4,
    formaPago: 'Transferencia Electrónica Bancaria'
  });

  // Datos de resultados
  const [datosVendedor, setDatosVendedor] = useState({
    nombre: '',
    ventasTotal: 0,
    cobrosTotal: 0,
    saldoTotal: 0,
    cantidadFacturas: 0,
    cantidadAbonos: 0,
    ticketPromedio: 0,
    comision: 0,
    sueldoTotal: 0,
    facturas: [],
    abonosPeriodo: [],
    abonosHistoricos: [],
    abonosPorFacturaPeriodo: {},
    abonosPorFacturaHistorico: {},
    ultimaFechaAbonoPorFactura: {}
  });

  // Cargar lista de vendedores únicos
  useEffect(() => {
    cargarVendedores();
    establecerFechasDefault();
  }, []);

  // Cargar datos cuando cambia el vendedor o período
  useEffect(() => {
    if (vendedorSeleccionado) {
      cargarDatosVendedor();
    }
  }, [vendedorSeleccionado, periodo, fechaInicio, fechaFin]);

  const establecerFechasDefault = () => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

    setFechaInicio(formatInputDate(primerDiaMes));
    setFechaFin(formatInputDate(ultimoDiaMes));
  };

  const cargarVendedores = async () => {
    try {
      setError(null);
      const { data, error: queryError } = await supabase
        .from('facturas')
        .select('vendedor')
        .not('vendedor', 'is', null)
        .not('vendedor', 'eq', 'Sin asignar')
        .order('vendedor');

      if (queryError) throw queryError;

      // Obtener vendedores únicos
      const vendedoresUnicos = Array.from(new Set((data || []).map(f => f.vendedor))).sort();
      setVendedores(vendedoresUnicos);

      if (vendedoresUnicos.length > 0 && !vendedorSeleccionado) {
        setVendedorSeleccionado(vendedoresUnicos[0]);
      }
    } catch (err) {
      console.error('Error cargando vendedores:', err);
      setError('Error al cargar lista de vendedores');
    }
  };

  const cargarDatosVendedor = async () => {
    if (!vendedorSeleccionado) return;

    try {
      setCargando(true);
      setError(null);

      const inicioFecha = fechaInicio;
      const finFecha = fechaFin;

      // Obtener todas las facturas del vendedor en el sistema.
      const { data, error: queryError } = await supabase
        .from('facturas')
        .select('id, fecha, total, cliente, productos')
        .eq('vendedor', vendedorSeleccionado)
        .order('fecha', { ascending: false });

      if (queryError) throw queryError;

      const facturasSistema = data || [];
      const facturaIdsSistema = facturasSistema.map(f => f.id).filter(Boolean);

      let abonosPeriodo = [];
      let abonosHistoricos = [];
      if (facturaIdsSistema.length > 0) {
        const consultasAbonosPeriodo = chunkArray(facturaIdsSistema, 200).map((idsChunk) =>
          supabase
            .from('abonos')
            .select('id, factura_id, fecha, monto, metodo')
            .in('factura_id', idsChunk)
            .gte('fecha', inicioFecha)
            .lte('fecha', finFecha)
        );

        const consultasAbonosHistoricos = chunkArray(facturaIdsSistema, 200).map((idsChunk) =>
          supabase
            .from('abonos')
            .select('id, factura_id, fecha, monto, metodo')
            .in('factura_id', idsChunk)
        );

        const [respuestasPeriodo, respuestasHistoricas] = await Promise.all([
          Promise.all(consultasAbonosPeriodo),
          Promise.all(consultasAbonosHistoricos)
        ]);

        abonosPeriodo = respuestasPeriodo.flatMap(({ data: abonosData, error: abonosError }) => {
          if (abonosError) {
            throw abonosError;
          }
          return abonosData || [];
        });

        abonosHistoricos = respuestasHistoricas.flatMap(({ data: abonosData, error: abonosError }) => {
          if (abonosError) {
            throw abonosError;
          }
          return abonosData || [];
        });

        abonosPeriodo.sort((a, b) => {
          const fechaA = parseDateLocal(a.fecha) || new Date(0);
          const fechaB = parseDateLocal(b.fecha) || new Date(0);
          return fechaB - fechaA;
        });
        abonosHistoricos.sort((a, b) => {
          const fechaA = parseDateLocal(a.fecha) || new Date(0);
          const fechaB = parseDateLocal(b.fecha) || new Date(0);
          return fechaB - fechaA;
        });
      }

      const ultimaFechaAbonoPorFactura = abonosPeriodo.reduce((acc, abono) => {
        const facturaId = abono.factura_id;
        if (!facturaId || !abono.fecha) return acc;

        const fechaActual = parseDateLocal(abono.fecha);
        if (!fechaActual) return acc;

        const fechaGuardada = acc[facturaId] ? parseDateLocal(acc[facturaId]) : null;
        if (!fechaGuardada || fechaActual > fechaGuardada) {
          acc[facturaId] = abono.fecha;
        }
        return acc;
      }, {});

      // Mostrar unicamente facturas con abonos en el periodo, ordenadas por fecha de abono.
      const facturaIdsConAbonos = new Set(abonosPeriodo.map((abono) => String(abono.factura_id)));
      const facturasParaMostrar = facturasSistema.filter((factura) =>
        facturaIdsConAbonos.has(String(factura.id))
      ).sort((a, b) => {
        const fechaAbonoB = new Date(ultimaFechaAbonoPorFactura[b.id] || '1970-01-01');
        const fechaAbonoA = new Date(ultimaFechaAbonoPorFactura[a.id] || '1970-01-01');
        return fechaAbonoB - fechaAbonoA;
      });
      
      // Calcular totales sobre facturas que si tuvieron abonos en el periodo.
      const ventasTotal = facturasParaMostrar.reduce((sum, f) => sum + (parseFloat(f.total) || 0), 0);
      const cobrosTotal = abonosPeriodo.reduce((sum, a) => sum + (parseFloat(a.monto) || 0), 0);
      const abonosPorFacturaPeriodo = abonosPeriodo.reduce((acc, abono) => {
        const facturaId = abono.factura_id;
        if (!facturaId) return acc;
        acc[facturaId] = (acc[facturaId] || 0) + (parseFloat(abono.monto) || 0);
        return acc;
      }, {});
      const abonosPorFacturaHistorico = abonosHistoricos.reduce((acc, abono) => {
        const facturaId = abono.factura_id;
        if (!facturaId) return acc;
        acc[facturaId] = (acc[facturaId] || 0) + (parseFloat(abono.monto) || 0);
        return acc;
      }, {});
      const saldoTotal = facturasParaMostrar.reduce((sum, factura) => {
        const totalFactura = parseFloat(factura.total) || 0;
        const abonoFactura = abonosPorFacturaHistorico[factura.id] || 0;
        return sum + Math.max(0, totalFactura - abonoFactura);
      }, 0);
      const cantidadFacturas = facturasParaMostrar.length;
      const cantidadAbonos = abonosPeriodo.length;
      const ticketPromedio = cantidadAbonos > 0 ? cobrosTotal / cantidadAbonos : 0;
      const comision = cobrosTotal * (porcentajeComision / 100);
      const sueldoTotal = sueldoBase + comision;

      setDatosVendedor({
        nombre: vendedorSeleccionado,
        ventasTotal,
        cobrosTotal,
        saldoTotal,
        cantidadFacturas,
        cantidadAbonos,
        ticketPromedio,
        comision,
        sueldoTotal,
        facturas: facturasParaMostrar,
        abonosPeriodo,
        abonosHistoricos,
        abonosPorFacturaPeriodo,
        abonosPorFacturaHistorico,
        ultimaFechaAbonoPorFactura
      });
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError('Error al cargar datos del vendedor');
    } finally {
      setCargando(false);
    }
  };

  const handlePeriodoChange = (nuevoPeriodo) => {
    setPeriodo(nuevoPeriodo);
    
    const hoy = new Date();
    let inicio, fin;

    switch (nuevoPeriodo) {
      case 'mes-actual':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case 'mes-pasado':
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), 0);
        break;
      case 'trimestre':
        inicio = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3, 1);
        fin = new Date(hoy.getFullYear(), Math.floor(hoy.getMonth() / 3) * 3 + 3, 0);
        break;
      case 'semestre':
        if (hoy.getMonth() < 6) {
          inicio = new Date(hoy.getFullYear(), 0, 1);
          fin = new Date(hoy.getFullYear(), 6, 0);
        } else {
          inicio = new Date(hoy.getFullYear(), 6, 1);
          fin = new Date(hoy.getFullYear(), 12, 0);
        }
        break;
      case 'anio':
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear(), 11, 31);
        break;
      default:
        return;
    }

    setFechaInicio(formatInputDate(inicio));
    setFechaFin(formatInputDate(fin));
  };

  const formatCurrency = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(valor);
  };

  const formatDate = (dateString) => {
    const parsedDate = parseDateLocal(dateString);
    if (!parsedDate) {
      return 'Fecha no valida';
    }

    return parsedDate.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resumenCalculos = useMemo(() => {
    return {
      sueldoBase,
      porcentajeComision,
      ventasTotal: datosVendedor.ventasTotal,
      cobrosTotal: datosVendedor.cobrosTotal,
      saldoTotal: datosVendedor.saldoTotal,
      comisionCalculada: datosVendedor.cobrosTotal * (porcentajeComision / 100),
      sueldoMensual: sueldoBase + (datosVendedor.cobrosTotal * (porcentajeComision / 100))
    };
  }, [sueldoBase, porcentajeComision, datosVendedor.ventasTotal, datosVendedor.cobrosTotal, datosVendedor.saldoTotal]);

  // Genera el comprobante mensual de pago (colilla) en PDF a partir del ingreso mensual total calculado
  const generarColillaPDF = async () => {
    try {
      setGenerandoColilla(true);

      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' });

      const sueldoBaseValor = resumenCalculos.sueldoBase;
      const comisionValor = resumenCalculos.comisionCalculada;
      const totalDevengado = resumenCalculos.sueldoMensual;
      const epsValor = totalDevengado * (datosEmpleado.porcentajeEPS / 100);
      const afpValor = totalDevengado * (datosEmpleado.porcentajeAFP / 100);
      const totalDeducciones = epsValor + afpValor;
      const netoPagado = totalDevengado - totalDeducciones;

      const marginX = 12;
      const anchoUtil = 210 - marginX * 2;
      let y = 14;

      // ── Encabezado ──
      doc.setTextColor(20, 60, 120);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(datosEmpresa.nombre, marginX, y);

      doc.setFontSize(15);
      doc.setTextColor(20, 20, 20);
      doc.text('COMPROBANTE MENSUAL DE PAGO', marginX + anchoUtil, y, { align: 'right' });

      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      doc.text(`NIT: ${datosEmpresa.nit}   |   Tel: ${datosEmpresa.telefono}`, marginX, y);

      doc.setFillColor(219, 234, 254);
      const periodoTexto = `Periodo: ${formatFechaCorta(fechaInicio)} al ${formatFechaCorta(fechaFin)}`;
      const periodoAncho = doc.getTextWidth(periodoTexto) + 6;
      doc.roundedRect(marginX + anchoUtil - periodoAncho, y - 4, periodoAncho, 5.5, 1, 1, 'F');
      doc.setTextColor(29, 78, 216);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(periodoTexto, marginX + anchoUtil - 3, y - 0.3, { align: 'right' });

      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(70, 70, 70);
      doc.text(datosEmpresa.direccion, marginX, y);

      y += 4;
      doc.setDrawColor(210, 210, 210);
      doc.line(marginX, y, marginX + anchoUtil, y);

      // ── Datos del empleado ──
      y += 6;
      const colDerechaX = marginX + anchoUtil / 2 + 4;
      const filaAltura = 5.2;

      const filaDatos = (label, valorIzq, label2, valorDer) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 30, 30);
        doc.text(label, marginX, y);
        doc.text(label2, colDerechaX, y);

        doc.setFont('helvetica', 'normal');
        doc.text(String(valorIzq || '-'), marginX + 28, y);
        doc.text(String(valorDer || '-'), colDerechaX + 32, y);
        y += filaAltura;
      };

      filaDatos('Empleado:', datosVendedor.nombre, 'Cargo:', datosEmpleado.cargo);
      filaDatos('Cédula:', datosEmpleado.cedula, 'Contrato / Ingreso:', `${datosEmpleado.contrato} | ${formatFechaCorta(datosEmpleado.fechaIngreso) || '-'}`);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Básico Mensual:', marginX, y);
      doc.text('Días Liquidados:', colDerechaX, y);
      doc.setTextColor(20, 60, 120);
      doc.text(`${formatCurrency(sueldoBaseValor)} COP`, marginX + 28, y);
      doc.setTextColor(30, 30, 30);
      doc.setFont('helvetica', 'normal');
      doc.text(`${datosEmpleado.diasLiquidados} Días`, colDerechaX + 32, y);

      y += 7;
      doc.setDrawColor(210, 210, 210);
      doc.line(marginX, y, marginX + anchoUtil, y);

      // ── Tablas Devengados / Deducciones ──
      y += 5;
      const anchoTabla = (anchoUtil - 6) / 2;
      const xIzq = marginX;
      const xDer = marginX + anchoTabla + 6;
      const tablaHeaderY = y;

      doc.setFillColor(30, 90, 180);
      doc.rect(xIzq, tablaHeaderY, anchoTabla, 6, 'F');
      doc.setFillColor(200, 40, 60);
      doc.rect(xDer, tablaHeaderY, anchoTabla, 6, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('DEVENGADOS (INGRESOS)', xIzq + 2, tablaHeaderY + 4.2);
      doc.text('DEDUCCIONES DE LEY', xDer + 2, tablaHeaderY + 4.2);

      y = tablaHeaderY + 9;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(90, 90, 90);
      doc.text('Concepto', xIzq, y);
      doc.text('Días', xIzq + anchoTabla - 26, y, { align: 'right' });
      doc.text('Valor ($)', xIzq + anchoTabla, y, { align: 'right' });
      doc.text('Concepto', xDer, y);
      doc.text('%', xDer + anchoTabla - 26, y, { align: 'right' });
      doc.text('Valor ($)', xDer + anchoTabla, y, { align: 'right' });

      y += 2;
      doc.setDrawColor(220, 220, 220);
      doc.line(xIzq, y, xIzq + anchoTabla, y);
      doc.line(xDer, y, xDer + anchoTabla, y);

      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      doc.text('Sueldo Básico Mensual', xIzq, y);
      doc.text(String(datosEmpleado.diasLiquidados), xIzq + anchoTabla - 26, y, { align: 'right' });
      doc.text(formatCurrency(sueldoBaseValor).replace('$', '').trim(), xIzq + anchoTabla, y, { align: 'right' });

      doc.text(`Aporte Salud (EPS - ${datosEmpleado.porcentajeEPS}%)`, xDer, y);
      doc.text(`${datosEmpleado.porcentajeEPS}%`, xDer + anchoTabla - 26, y, { align: 'right' });
      doc.text(formatCurrency(epsValor).replace('$', '').trim(), xDer + anchoTabla, y, { align: 'right' });

      let yFilaExtra = y;
      if (comisionValor > 0) {
        yFilaExtra += 5;
        doc.text(`Comisión por Cobros (${porcentajeComision}%)`, xIzq, yFilaExtra);
        doc.text('-', xIzq + anchoTabla - 26, yFilaExtra, { align: 'right' });
        doc.text(formatCurrency(comisionValor).replace('$', '').trim(), xIzq + anchoTabla, yFilaExtra, { align: 'right' });
      }

      const yAporte2 = y + 5;
      doc.text(`Aporte Pensión (AFP - ${datosEmpleado.porcentajeAFP}%)`, xDer, yAporte2);
      doc.text(`${datosEmpleado.porcentajeAFP}%`, xDer + anchoTabla - 26, yAporte2, { align: 'right' });
      doc.text(formatCurrency(afpValor).replace('$', '').trim(), xDer + anchoTabla, yAporte2, { align: 'right' });

      y = Math.max(yFilaExtra, yAporte2) + 4.5;
      doc.setDrawColor(210, 210, 210);
      doc.line(xIzq, y - 3, xIzq + anchoTabla, y - 3);
      doc.line(xDer, y - 3, xDer + anchoTabla, y - 3);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);
      doc.text('TOTAL DEVENGADO:', xIzq, y);
      doc.text(`$${formatCurrency(totalDevengado).replace('$', '').trim()}`, xIzq + anchoTabla, y, { align: 'right' });
      doc.text('TOTAL DEDUCCIONES:', xDer, y);
      doc.text(`$${formatCurrency(totalDeducciones).replace('$', '').trim()}`, xDer + anchoTabla, y, { align: 'right' });

      // ── Forma de pago y neto ──
      y += 9;
      doc.setDrawColor(200, 200, 200);
      doc.line(marginX, y - 4, marginX + anchoUtil, y - 4);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text('Forma de pago:', marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(datosEmpleado.formaPago, marginX + 24, y);

      y += 4.5;
      doc.setFont('helvetica', 'bold');
      doc.text('Valor en letras:', marginX, y);
      doc.setFont('helvetica', 'normal');
      doc.text(numeroALetras(netoPagado), marginX + 24, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 30, 30);
      doc.text('NETO MENSUAL PAGADO:', marginX + anchoUtil, y - 4.5, { align: 'right' });
      doc.setFontSize(11);
      doc.setTextColor(20, 60, 120);
      doc.text(`${formatCurrency(netoPagado)} COP`, marginX + anchoUtil, y + 1, { align: 'right' });

      // ── Firmas ──
      y += 14;
      doc.setDrawColor(120, 120, 120);
      doc.line(marginX, y, marginX + 60, y);
      doc.line(marginX + anchoUtil - 60, y, marginX + anchoUtil, y);

      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(20, 20, 20);
      doc.text(datosEmpresa.representante, marginX, y);
      doc.text(datosVendedor.nombre, marginX + anchoUtil - 60, y);

      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(80, 80, 80);
      doc.text(`Representante Legal | ${datosEmpresa.nombre}`, marginX, y);
      doc.text(`C.C. ${datosEmpleado.cedula || '-'} | Firma Empleado`, marginX + anchoUtil - 60, y);

      const nombreVendedorSlug = (datosVendedor.nombre || 'vendedor').toLowerCase().replace(/\s+/g, '-');
      const nombreArchivo = `colilla-pago-${nombreVendedorSlug}-${formatInputDate(fechaFin) || formatInputDate(new Date())}.pdf`;
      doc.save(nombreArchivo);

      setMostrarModalColilla(false);
    } catch (err) {
      console.error('Error generando colilla de pago:', err);
      setError('No se pudo generar la colilla de pago. Intenta nuevamente.');
    } finally {
      setGenerandoColilla(false);
    }
  };

  return (
    <div className="calculador-sueldo">
      <div className="calculador-header">
        <h1>💰 Calculador de Sueldo Vendedor</h1>
        <p className="subtitle">Calcula ingresos: Sueldo Base + Comisión sobre cobros (abonos) del período</p>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      <div className="calculador-content">
        {/* Panel de Control */}
        <div className="control-panel">
          <div className="control-group">
            <label>Selecciona Vendedor:</label>
            <select 
              value={vendedorSeleccionado || ''} 
              onChange={(e) => setVendedorSeleccionado(e.target.value)}
              disabled={cargando}
            >
              <option value="">-- Selecciona un vendedor --</option>
              {vendedores.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>Período:</label>
            <div className="periodo-buttons">
              {[
                { id: 'mes-actual', label: 'Mes Actual' },
                { id: 'mes-pasado', label: 'Mes Pasado' },
                { id: 'trimestre', label: 'Trimestre' },
                { id: 'semestre', label: 'Semestre' },
                { id: 'anio', label: 'Año' },
                { id: 'personalizado', label: 'Personalizado' }
              ].map(p => (
                <button
                  key={p.id}
                  className={`periodo-btn ${periodo === p.id ? 'active' : ''}`}
                  onClick={() => {
                    if (p.id === 'personalizado') {
                      setPeriodo('personalizado');
                    } else {
                      handlePeriodoChange(p.id);
                    }
                  }}
                  disabled={cargando}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {periodo === 'personalizado' && (
            <div className="fecha-inputs">
              <div className="fecha-group">
                <label>Desde:</label>
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  disabled={cargando}
                />
              </div>
              <div className="fecha-group">
                <label>Hasta:</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  disabled={cargando}
                />
              </div>
            </div>
          )}

          {/* Configuración de Sueldo */}
          <div className="sueldo-config">
            <h3>⚙️ Configuración de Sueldo</h3>
            <div className="config-row">
              <div className="config-group">
                <label>Sueldo Base ($):</label>
                <input
                  type="number"
                  value={sueldoBase}
                  onChange={(e) => setSueldoBase(parseFloat(e.target.value) || 0)}
                  className="número-input"
                />
              </div>
              <div className="config-group">
                <label>Comisión (%):</label>
                <input
                  type="number"
                  value={porcentajeComision}
                  onChange={(e) => setPorcentajeComision(parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="número-input"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {cargando ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        ) : vendedorSeleccionado ? (
          <div className="resultados">
            {/* Resumen Principal */}
            <div className="resumen-principal">
              <div className="resumen-card">
                <div className="card-icon">📊</div>
                <div className="card-content">
                  <span className="label">Período:</span>
                  <span className="valor">
                    {formatDate(fechaInicio)} - {formatDate(fechaFin)}
                  </span>
                </div>
              </div>

              <div className="resumen-card">
                <div className="card-icon">💼</div>
                <div className="card-content">
                  <span className="label">Vendedor:</span>
                  <span className="valor">{datosVendedor.nombre}</span>
                </div>
              </div>

              <div className="resumen-card">
                <div className="card-icon">💵</div>
                <div className="card-content">
                  <span className="label">Total Cobrado (Abonos):</span>
                  <span className="valor">{formatCurrency(resumenCalculos.cobrosTotal)}</span>
                </div>
              </div>

              <div className="resumen-card highlight-card">
                <div className="card-icon">💰</div>
                <div className="card-content">
                  <span className="label">Comisión del Período:</span>
                  <span className="valor comision">{formatCurrency(resumenCalculos.comisionCalculada)}</span>
                </div>
              </div>

              <div className="resumen-card">
                <div className="card-icon">🧾</div>
                <div className="card-content">
                  <span className="label">Cantidad de Abonos:</span>
                  <span className="valor">{datosVendedor.cantidadAbonos}</span>
                </div>
              </div>

              <div className="resumen-card average">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <span className="label">Promedio por Abono:</span>
                  <span className="valor">{formatCurrency(datosVendedor.ticketPromedio)}</span>
                </div>
              </div>
            </div>

            {/* Cálculo de Sueldo */}
            <div className="calculo-sueldo">
              <div className="calculo-sueldo-header">
                <h2>🧮 Cálculo de Sueldo Mensual</h2>
                <button
                  type="button"
                  className="btn-generar-colilla"
                  onClick={() => setMostrarModalColilla(true)}
                  disabled={cargando}
                >
                  🧾 Generar Colilla de Pago (PDF)
                </button>
              </div>
              
              <div className="formula">
                <div className="formula-item">
                  <span className="label">Sueldo Base:</span>
                  <span className="valor">{formatCurrency(resumenCalculos.sueldoBase)}</span>
                </div>
                <div className="formula-operator">+</div>
                <div className="formula-item">
                  <span className="label">Comisión ({resumenCalculos.porcentajeComision}% de cobros {formatCurrency(resumenCalculos.cobrosTotal)}):</span>
                  <span className="valor comision">{formatCurrency(resumenCalculos.comisionCalculada)}</span>
                </div>
                <div className="formula-operator">=</div>
                <div className="formula-total">
                  <span className="label">INGRESO MENSUAL TOTAL:</span>
                  <span className="valor">{formatCurrency(resumenCalculos.sueldoMensual)}</span>
                </div>
              </div>

              {/* Desglose Porcentual */}
              <div className="desglose">
                <div className="desglose-item">
                  <span className="label">% Sueldo Base:</span>
                  <span className="valor">
                    {resumenCalculos.sueldoMensual > 0
                      ? ((resumenCalculos.sueldoBase / resumenCalculos.sueldoMensual) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
                <div className="desglose-item">
                  <span className="label">% Comisión:</span>
                  <span className="valor comision">
                    {resumenCalculos.sueldoMensual > 0
                      ? ((resumenCalculos.comisionCalculada / resumenCalculos.sueldoMensual) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </div>
              </div>

              {/* Proyecciones Anuales */}
              <div className="proyecciones">
                <h3>📅 Proyecciones Anuales (basadas en este período)</h3>
                <div className="proyeccion-grid">
                  <div className="proyeccion-card">
                    <span className="label">Ingreso Anual Estimado:</span>
                    <span className="valor">
                      {formatCurrency(resumenCalculos.sueldoMensual * 12)}
                    </span>
                  </div>
                  <div className="proyeccion-card">
                    <span className="label">Cobros Anuales Estimados:</span>
                    <span className="valor">
                      {formatCurrency(resumenCalculos.cobrosTotal * 12)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Historial de Facturas */}
            {datosVendedor.cantidadFacturas > 0 && (
              <div className="facturas-detalle">
                <h2>📄 Historial de Facturas ({datosVendedor.cantidadFacturas})</h2>
                <div className="facturas-table">
                  <table>
                    <thead>
                      <tr>
                        <th>ID Factura</th>
                        <th>Cliente</th>
                        <th>Valores</th>
                        <th>Fecha Abono</th>
                        <th>Comisión ({porcentajeComision}%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosVendedor.facturas.map((factura) => (
                        <tr key={factura.id}>
                          <td data-label="ID factura" className="id-factura">{String(factura.id || '').slice(0, 8)}...</td>
                          <td data-label="Cliente">{factura.cliente}</td>
                          <td data-label="Valores" className="monto-stack">
                            <div><span>Total:</span> {formatCurrency(factura.total)}</div>
                            <div><span>Abono período:</span> {formatCurrency(datosVendedor.abonosPorFacturaPeriodo[factura.id] || 0)}</div>
                            <div><span>Abono histórico:</span> {formatCurrency(datosVendedor.abonosPorFacturaHistorico[factura.id] || 0)}</div>
                            <div><span>Saldo:</span> {formatCurrency(Math.max(0, (parseFloat(factura.total) || 0) - (datosVendedor.abonosPorFacturaHistorico[factura.id] || 0)))}</div>
                          </td>
                          <td data-label="Fecha abono">{datosVendedor.ultimaFechaAbonoPorFactura[factura.id] ? formatDate(datosVendedor.ultimaFechaAbonoPorFactura[factura.id]) : 'Sin abono'}</td>
                          <td data-label="Comisión" className="comision comision-col">
                            {formatCurrency((datosVendedor.abonosPorFacturaPeriodo[factura.id] || 0) * (porcentajeComision / 100))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {datosVendedor.cantidadFacturas === 0 && (
              <div className="sin-facturas">
                <p>📭 No hay facturas con abonos para este vendedor en el período seleccionado</p>
              </div>
            )}
          </div>
        ) : (
          <div className="sin-datos">
            <p>👉 Selecciona un vendedor para ver los datos</p>
          </div>
        )}
      </div>

      {mostrarModalColilla && (
        <div className="modal-overlay-colilla" onClick={() => !generandoColilla && setMostrarModalColilla(false)}>
          <div className="modal-colilla" onClick={(e) => e.stopPropagation()}>
            <div className="modal-colilla-header">
              <h3>🧾 Datos para la Colilla de Pago</h3>
              <button
                type="button"
                className="modal-colilla-cerrar"
                onClick={() => setMostrarModalColilla(false)}
                disabled={generandoColilla}
              >
                ✕
              </button>
            </div>

            <div className="modal-colilla-body">
              <p className="modal-colilla-nota">
                El comprobante usará el <strong>Ingreso Mensual Total</strong> calculado ({formatCurrency(resumenCalculos.sueldoMensual)}) para el empleado <strong>{datosVendedor.nombre}</strong>.
              </p>

              <h4>Empresa</h4>
              <div className="modal-colilla-grid">
                <div className="modal-colilla-campo">
                  <label>Nombre de la empresa</label>
                  <input
                    type="text"
                    value={datosEmpresa.nombre}
                    onChange={(e) => setDatosEmpresa({ ...datosEmpresa, nombre: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>NIT</label>
                  <input
                    type="text"
                    value={datosEmpresa.nit}
                    onChange={(e) => setDatosEmpresa({ ...datosEmpresa, nit: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={datosEmpresa.telefono}
                    onChange={(e) => setDatosEmpresa({ ...datosEmpresa, telefono: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Representante legal</label>
                  <input
                    type="text"
                    value={datosEmpresa.representante}
                    onChange={(e) => setDatosEmpresa({ ...datosEmpresa, representante: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo modal-colilla-campo-full">
                  <label>Dirección</label>
                  <input
                    type="text"
                    value={datosEmpresa.direccion}
                    onChange={(e) => setDatosEmpresa({ ...datosEmpresa, direccion: e.target.value })}
                  />
                </div>
              </div>

              <h4>Empleado</h4>
              <div className="modal-colilla-grid">
                <div className="modal-colilla-campo">
                  <label>Cédula</label>
                  <input
                    type="text"
                    value={datosEmpleado.cedula}
                    onChange={(e) => setDatosEmpleado({ ...datosEmpleado, cedula: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Cargo</label>
                  <input
                    type="text"
                    value={datosEmpleado.cargo}
                    onChange={(e) => setDatosEmpleado({ ...datosEmpleado, cargo: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Tipo de contrato</label>
                  <input
                    type="text"
                    value={datosEmpleado.contrato}
                    onChange={(e) => setDatosEmpleado({ ...datosEmpleado, contrato: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Fecha de ingreso</label>
                  <input
                    type="date"
                    value={datosEmpleado.fechaIngreso}
                    onChange={(e) => setDatosEmpleado({ ...datosEmpleado, fechaIngreso: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Días liquidados</label>
                  <input
                    type="number"
                    value={datosEmpleado.diasLiquidados}
                    onChange={(e) => setDatosEmpleado({ ...datosEmpleado, diasLiquidados: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Forma de pago</label>
                  <input
                    type="text"
                    value={datosEmpleado.formaPago}
                    onChange={(e) => setDatosEmpleado({ ...datosEmpleado, formaPago: e.target.value })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Aporte Salud EPS (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={datosEmpleado.porcentajeEPS}
                    onChange={(e) => setDatosEmpleado({ ...datosEmpleado, porcentajeEPS: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="modal-colilla-campo">
                  <label>Aporte Pensión AFP (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={datosEmpleado.porcentajeAFP}
                    onChange={(e) => setDatosEmpleado({ ...datosEmpleado, porcentajeAFP: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-colilla-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setMostrarModalColilla(false)}
                disabled={generandoColilla}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={generarColillaPDF}
                disabled={generandoColilla}
              >
                {generandoColilla ? 'Generando…' : '📄 Generar PDF'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalculadorSueldoVendedor;
