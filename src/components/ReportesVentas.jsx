import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './ReportesCobros.css';

const PAGE_SIZE = 1000;

const parseDateLocal = (value) => {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatInputDate = (value) => {
  const date = parseDateLocal(value);
  if (!date) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const normalizarFechaISO = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  return formatInputDate(value);
};

const fetchAllRows = async (table, orderColumn = 'id', ascending = true) => {
  let from = 0;
  const allRows = [];

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order(orderColumn, { ascending })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;
    const rows = data || [];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
};

const ReportesVentas = () => {
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);
  const [facturas, setFacturas] = useState([]);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [filtroVendedor, setFiltroVendedor] = useState('Todos');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const facturasData = await fetchAllRows('facturas', 'fecha', false);
        setFacturas(facturasData || []);

        const hoy = new Date();
        const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        setFechaInicio(formatInputDate(primerDiaMes));
        setFechaFin(formatInputDate(ultimoDiaMes));
      } catch (error) {
        console.error('Error cargando ventas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const vendedores = Array.from(new Set((facturas || []).map((f) => f.vendedor).filter(Boolean))).sort();

  const facturasFiltradas = (facturas || [])
    .filter((factura) => {
      if (filtroVendedor !== 'Todos' && factura.vendedor !== filtroVendedor) return false;
      const fecha = normalizarFechaISO(factura.fecha);
      if (!fecha) return false;
      if (fechaInicio && fecha < fechaInicio) return false;
      if (fechaFin && fecha > fechaFin) return false;
      return true;
    });

  const resumenPorDia = Object.values(
    facturasFiltradas.reduce((acc, factura) => {
      const fecha = normalizarFechaISO(factura.fecha);
      if (!fecha) return acc;
      if (!acc[fecha]) {
        acc[fecha] = { fecha, total: 0, cantidad: 0, ventas: [] };
      }
      const total = parseFloat(factura.total) || 0;
      acc[fecha].total += total;
      acc[fecha].cantidad += 1;
      acc[fecha].ventas.push(factura);
      return acc;
    }, {})
  ).sort((a, b) => {
    const aDate = parseDateLocal(a.fecha) || new Date(0);
    const bDate = parseDateLocal(b.fecha) || new Date(0);
    return bDate - aDate;
  });

  const resumenPorMes = Object.values(
    facturasFiltradas.reduce((acc, factura) => {
      const fechaIso = normalizarFechaISO(factura.fecha);
      if (!fechaIso) return acc;

      const fecha = new Date(`${fechaIso}T00:00:00`);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      const mesNombre = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

      if (!acc[mes]) {
        acc[mes] = { mes, mesNombre, total: 0, cantidad: 0 };
      }

      acc[mes].total += parseFloat(factura.total) || 0;
      acc[mes].cantidad += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.mes.localeCompare(a.mes));

  const resumenPorVendedor = Object.values(
    facturasFiltradas.reduce((acc, factura) => {
      const vendedor = factura.vendedor || 'Sin asignar';
      if (!acc[vendedor]) {
        acc[vendedor] = { vendedor, total: 0, cantidad: 0 };
      }
      acc[vendedor].total += parseFloat(factura.total) || 0;
      acc[vendedor].cantidad += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.total - a.total);

  const totalGeneral = facturasFiltradas.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
  const cantidadGeneral = facturasFiltradas.length;

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(valor || 0);
  };

  const formatFechaLegible = (fecha) => {
    const date = parseDateLocal(fecha);
    if (!date) return 'Fecha invalida';
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="reportes-container">
      <header className="reportes-header">
        <h1>
          <i className="fas fa-chart-line"></i> Informe de Ventas Diarias
        </h1>
        <div className="header-actions">
          <button className="button secondary-button" onClick={() => navigate('/facturas')}>
            <i className="fas fa-arrow-left"></i> Volver a Facturas
          </button>
        </div>
      </header>

      <div className="filtros-container">
        <div className="filtro-row">
          <div className="filtro-group">
            <label>
              <i className="fas fa-calendar-alt"></i> Fecha Inicio:
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                max={fechaFin || formatInputDate(new Date())}
              />
            </label>
            <label>
              Fecha Fin:
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                min={fechaInicio}
                max={formatInputDate(new Date())}
              />
            </label>
          </div>

          <div className="filtro-group">
            <label>
              <i className="fas fa-user-tie"></i> Vendedor:
              <select value={filtroVendedor} onChange={(e) => setFiltroVendedor(e.target.value)}>
                <option value="Todos">Todos los vendedores</option>
                {vendedores.map((vendedor) => (
                  <option key={vendedor} value={vendedor}>{vendedor}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <div className="resumen-filtros">
          <div className="resumen-card">
            <div className="resumen-icon"><i className="fas fa-money-bill-wave"></i></div>
            <div className="resumen-content">
              <span>Total ventas</span>
              <strong>{formatMoneda(totalGeneral)}</strong>
            </div>
          </div>
          <div className="resumen-card">
            <div className="resumen-icon"><i className="fas fa-file-invoice"></i></div>
            <div className="resumen-content">
              <span>Cantidad de facturas</span>
              <strong>{cantidadGeneral}</strong>
            </div>
          </div>
          <div className="resumen-card">
            <div className="resumen-icon"><i className="fas fa-calculator"></i></div>
            <div className="resumen-content">
              <span>Promedio por venta</span>
              <strong>{cantidadGeneral > 0 ? formatMoneda(totalGeneral / cantidadGeneral) : formatMoneda(0)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="reporte-diario">
        <h2><i className="fas fa-users"></i> Resumen por Vendedor</h2>
        <div className="tabla-container">
          <table className="tabla-abonos">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Facturas</th>
                <th>Total</th>
                <th>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {resumenPorVendedor.map((item) => (
                <tr key={item.vendedor}>
                  <td>{item.vendedor}</td>
                  <td>{item.cantidad}</td>
                  <td className="total">{formatMoneda(item.total)}</td>
                  <td>{item.cantidad > 0 ? formatMoneda(item.total / item.cantidad) : formatMoneda(0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reporte-diario">
        <h2><i className="fas fa-calendar-day"></i> Ventas por Dia</h2>
        {cargando ? (
          <div className="loading-placeholder"><div className="spinner"></div><p>Cargando ventas...</p></div>
        ) : resumenPorDia.length === 0 ? (
          <div className="empty-state"><i className="fas fa-calendar-times"></i><p>No hay ventas para el filtro seleccionado</p></div>
        ) : (
          <div className="tabla-container">
            <table className="tabla-abonos">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Facturas</th>
                  <th>Total ventas</th>
                  <th>Promedio</th>
                </tr>
              </thead>
              <tbody>
                {resumenPorDia.map((dia) => (
                  <tr key={dia.fecha}>
                    <td>{formatFechaLegible(dia.fecha)}</td>
                    <td>{dia.cantidad}</td>
                    <td className="total">{formatMoneda(dia.total)}</td>
                    <td>{formatMoneda(dia.total / dia.cantidad)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="reporte-diario" style={{ marginBottom: 24 }}>
        <h2><i className="fas fa-calendar-alt"></i> Ventas por Mes</h2>
        <div className="tabla-container">
          <table className="tabla-abonos">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Facturas</th>
                <th>Total ventas</th>
                <th>Promedio</th>
              </tr>
            </thead>
            <tbody>
              {resumenPorMes.map((mes) => (
                <tr key={mes.mes}>
                  <td>{mes.mesNombre}</td>
                  <td>{mes.cantidad}</td>
                  <td className="total">{formatMoneda(mes.total)}</td>
                  <td>{formatMoneda(mes.total / mes.cantidad)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportesVentas;
