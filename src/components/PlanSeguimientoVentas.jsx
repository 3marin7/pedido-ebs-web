import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './PlanSeguimientoVentas.css';

const PAGE_SIZE = 1000;
const STORAGE_KEY = 'plan_seguimiento_ventas_v1';

const parseDateLocal = (value) => {
  if (!value) return null;

  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parts = value.split('-').map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const toInputDate = (value) => {
  const date = parseDateLocal(value) || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoney = (value) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(toNumber(value));
};

const loadStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('No se pudo leer seguimiento guardado:', error);
    return [];
  }
};

const saveStorage = (rows) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
};

const fetchAllFacturas = async () => {
  let from = 0;
  const allRows = [];

  while (true) {
    const { data, error } = await supabase
      .from('facturas')
      .select('id,fecha,total,vendedor,cliente,productos')
      .order('id', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw error;

    const rows = data || [];
    allRows.push(...rows);

    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return allRows;
};

const PlanSeguimientoVentas = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [facturas, setFacturas] = useState([]);
  const [seguimiento, setSeguimiento] = useState(loadStorage());
  const [fechaControl, setFechaControl] = useState(toInputDate(new Date()));
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const rows = await fetchAllFacturas();
        setFacturas(rows || []);
      } catch (fetchError) {
        console.error(fetchError);
        setError('No fue posible cargar las facturas para el tablero.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const metrics = useMemo(() => {
    const now = new Date();
    const d30 = new Date(now);
    d30.setDate(now.getDate() - 30);

    const validRows = facturas.filter((row) => row.fecha && Number.isFinite(Number(row.total)));
    const last30 = validRows.filter((row) => {
      const rowDate = parseDateLocal(row.fecha);
      return rowDate && rowDate >= d30;
    });

    const ventas30 = last30.reduce((sum, row) => sum + toNumber(row.total), 0);
    const facturas30 = last30.length;
    const ticketPromedio = facturas30 > 0 ? ventas30 / facturas30 : 0;

    const vendedorMap = {};
    last30.forEach((row) => {
      const vendedor = (row.vendedor || 'Sin vendedor').trim() || 'Sin vendedor';
      if (!vendedorMap[vendedor]) {
        vendedorMap[vendedor] = { vendedor, ventas: 0, facturas: 0 };
      }
      vendedorMap[vendedor].ventas += toNumber(row.total);
      vendedorMap[vendedor].facturas += 1;
    });

    const vendedores = Object.values(vendedorMap).sort((a, b) => b.ventas - a.ventas);
    const metaMesEquipo = ventas30 * 1.1;
    const totalVentasVendedores = vendedores.reduce((sum, item) => sum + item.ventas, 0);

    const metasPorVendedor = vendedores.map((item) => {
      const participacion = totalVentasVendedores > 0 ? item.ventas / totalVentasVendedores : 0;
      const metaMensual = metaMesEquipo * participacion;
      const metaDiaria = metaMensual / 26;

      return {
        vendedor: item.vendedor,
        ventas30: item.ventas,
        facturas30: item.facturas,
        ticket: item.facturas > 0 ? item.ventas / item.facturas : 0,
        participacion,
        metaMensual,
        metaDiaria
      };
    });

    const productMap = {};
    last30.forEach((row) => {
      const productos = Array.isArray(row.productos) ? row.productos : [];
      productos.forEach((item) => {
        const nombre = String(item?.nombre || item?.producto || 'Producto sin nombre').trim();
        const cantidad = toNumber(item?.cantidad);
        const subtotal = toNumber(item?.subtotal) || toNumber(item?.precio) * cantidad;

        if (!productMap[nombre]) {
          productMap[nombre] = { producto: nombre, ventas: 0, cantidad: 0 };
        }

        productMap[nombre].ventas += subtotal;
        productMap[nombre].cantidad += cantidad;
      });
    });

    const topProductos = Object.values(productMap)
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 8);

    return {
      ventas30,
      facturas30,
      ticketPromedio,
      metaMesEquipo,
      metaDiariaEquipo: metaMesEquipo / 26,
      metasPorVendedor,
      topProductos
    };
  }, [facturas]);

  useEffect(() => {
    if (metrics.metasPorVendedor.length === 0) return;

    setSeguimiento((prev) => {
      let next = [...prev];
      let changed = false;

      metrics.metasPorVendedor.forEach((item) => {
        const idx = next.findIndex((row) => row.fecha === fechaControl && row.vendedor === item.vendedor);
        if (idx === -1) {
          next.push({
            id: `${fechaControl}-${item.vendedor}`,
            fecha: fechaControl,
            vendedor: item.vendedor,
            metaDiaria: Math.round(item.metaDiaria),
            ventaReal: 0,
            contactos: 0,
            cotizaciones: 0,
            cierres: 0,
            accion: '',
            bloqueo: ''
          });
          changed = true;
        }
      });

      if (changed) {
        saveStorage(next);
      }

      return next;
    });
  }, [metrics.metasPorVendedor, fechaControl]);

  const rowsDia = useMemo(() => {
    return seguimiento
      .filter((row) => row.fecha === fechaControl)
      .sort((a, b) => a.vendedor.localeCompare(b.vendedor));
  }, [seguimiento, fechaControl]);

  const resumenDia = useMemo(() => {
    const meta = rowsDia.reduce((sum, row) => sum + toNumber(row.metaDiaria), 0);
    const real = rowsDia.reduce((sum, row) => sum + toNumber(row.ventaReal), 0);
    const brecha = real - meta;
    const avance = meta > 0 ? (real / meta) * 100 : 0;

    return { meta, real, brecha, avance };
  }, [rowsDia]);

  const resumen7Dias = useMemo(() => {
    const today = parseDateLocal(fechaControl) || new Date();
    const fromDate = new Date(today);
    fromDate.setDate(today.getDate() - 6);

    const byVendor = {};
    seguimiento.forEach((row) => {
      const date = parseDateLocal(row.fecha);
      if (!date || date < fromDate || date > today) return;

      if (!byVendor[row.vendedor]) {
        byVendor[row.vendedor] = {
          vendedor: row.vendedor,
          meta: 0,
          real: 0,
          contactos: 0,
          cotizaciones: 0,
          cierres: 0
        };
      }

      byVendor[row.vendedor].meta += toNumber(row.metaDiaria);
      byVendor[row.vendedor].real += toNumber(row.ventaReal);
      byVendor[row.vendedor].contactos += toNumber(row.contactos);
      byVendor[row.vendedor].cotizaciones += toNumber(row.cotizaciones);
      byVendor[row.vendedor].cierres += toNumber(row.cierres);
    });

    return Object.values(byVendor)
      .map((item) => ({
        ...item,
        brecha: item.real - item.meta,
        avance: item.meta > 0 ? (item.real / item.meta) * 100 : 0
      }))
      .sort((a, b) => b.real - a.real);
  }, [seguimiento, fechaControl]);

  const updateRow = (id, key, value) => {
    setSeguimiento((prev) => {
      const next = prev.map((row) => {
        if (row.id !== id) return row;
        const numericKeys = ['metaDiaria', 'ventaReal', 'contactos', 'cotizaciones', 'cierres'];
        return {
          ...row,
          [key]: numericKeys.includes(key) ? toNumber(value) : value
        };
      });
      saveStorage(next);
      return next;
    });
  };

  const exportCsv = () => {
    const headers = [
      'fecha',
      'vendedor',
      'meta_diaria',
      'venta_real',
      'brecha',
      'avance_pct',
      'contactos',
      'cotizaciones',
      'cierres',
      'accion',
      'bloqueo'
    ];

    const rows = rowsDia.map((row) => {
      const brecha = toNumber(row.ventaReal) - toNumber(row.metaDiaria);
      const avance = toNumber(row.metaDiaria) > 0 ? (toNumber(row.ventaReal) / toNumber(row.metaDiaria)) * 100 : 0;

      return [
        row.fecha,
        row.vendedor,
        Math.round(toNumber(row.metaDiaria)),
        Math.round(toNumber(row.ventaReal)),
        Math.round(brecha),
        avance.toFixed(2),
        Math.round(toNumber(row.contactos)),
        Math.round(toNumber(row.cotizaciones)),
        Math.round(toNumber(row.cierres)),
        String(row.accion || '').replaceAll('"', '""'),
        String(row.bloqueo || '').replaceAll('"', '""')
      ];
    });

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `seguimiento-ventas-${fechaControl}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 250);
  };

  return (
    <div className="plan-seguimiento-container">
      <header className="plan-seguimiento-header">
        <div>
          <h1><i className="fas fa-bullseye"></i> Plan y Seguimiento de Ventas</h1>
          <p>Control diario por vendedor, metas operativas y exportacion de informe.</p>
        </div>
        <div className="plan-actions">
          <button className="button secondary-button" onClick={() => navigate('/reportes-ventas')}>
            <i className="fas fa-chart-line"></i> Ver informe de ventas
          </button>
          <button className="button success-button" onClick={exportCsv} disabled={rowsDia.length === 0}>
            <i className="fas fa-file-csv"></i> Exportar informe diario
          </button>
        </div>
      </header>

      {error && <div className="plan-alert">{error}</div>}

      <section className="kpi-grid">
        <article className="kpi-card">
          <span>Ventas ultimos 30 dias</span>
          <strong>{formatMoney(metrics.ventas30)}</strong>
        </article>
        <article className="kpi-card">
          <span>Meta mes (+10%)</span>
          <strong>{formatMoney(metrics.metaMesEquipo)}</strong>
        </article>
        <article className="kpi-card">
          <span>Ticket promedio 30 dias</span>
          <strong>{formatMoney(metrics.ticketPromedio)}</strong>
        </article>
        <article className="kpi-card">
          <span>Meta diaria equipo</span>
          <strong>{formatMoney(metrics.metaDiariaEquipo)}</strong>
        </article>
      </section>

      <section className="control-section">
        <div className="control-title-row">
          <h2><i className="fas fa-clipboard-check"></i> Control diario por vendedor</h2>
          <label>
            Fecha de control
            <input type="date" value={fechaControl} onChange={(e) => setFechaControl(e.target.value)} />
          </label>
        </div>

        {loading ? (
          <div className="loading-state">Cargando datos...</div>
        ) : (
          <div className="table-wrap">
            <table className="control-table">
              <thead>
                <tr>
                  <th>Vendedor</th>
                  <th>Meta diaria</th>
                  <th>Venta real</th>
                  <th>Brecha</th>
                  <th>Avance</th>
                  <th>Contactos</th>
                  <th>Cotizaciones</th>
                  <th>Cierres</th>
                  <th>Accion principal</th>
                  <th>Bloqueo</th>
                </tr>
              </thead>
              <tbody>
                {rowsDia.map((row) => {
                  const brecha = toNumber(row.ventaReal) - toNumber(row.metaDiaria);
                  const avance = toNumber(row.metaDiaria) > 0 ? (toNumber(row.ventaReal) / toNumber(row.metaDiaria)) * 100 : 0;

                  return (
                    <tr key={row.id}>
                      <td>{row.vendedor}</td>
                      <td>
                        <input
                          type="number"
                          value={row.metaDiaria}
                          onChange={(e) => updateRow(row.id, 'metaDiaria', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.ventaReal}
                          onChange={(e) => updateRow(row.id, 'ventaReal', e.target.value)}
                        />
                      </td>
                      <td className={brecha >= 0 ? 'brecha-ok' : 'brecha-bad'}>{formatMoney(brecha)}</td>
                      <td>{avance.toFixed(1)}%</td>
                      <td>
                        <input
                          type="number"
                          value={row.contactos}
                          onChange={(e) => updateRow(row.id, 'contactos', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.cotizaciones}
                          onChange={(e) => updateRow(row.id, 'cotizaciones', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={row.cierres}
                          onChange={(e) => updateRow(row.id, 'cierres', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.accion}
                          onChange={(e) => updateRow(row.id, 'accion', e.target.value)}
                          placeholder="Accion de alto impacto"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={row.bloqueo}
                          onChange={(e) => updateRow(row.id, 'bloqueo', e.target.value)}
                          placeholder="Bloqueo actual"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="resumen-dia">
          <div>
            <span>Meta del dia</span>
            <strong>{formatMoney(resumenDia.meta)}</strong>
          </div>
          <div>
            <span>Venta real</span>
            <strong>{formatMoney(resumenDia.real)}</strong>
          </div>
          <div>
            <span>Brecha</span>
            <strong className={resumenDia.brecha >= 0 ? 'brecha-ok' : 'brecha-bad'}>{formatMoney(resumenDia.brecha)}</strong>
          </div>
          <div>
            <span>Avance</span>
            <strong>{resumenDia.avance.toFixed(1)}%</strong>
          </div>
        </div>
      </section>

      <section className="dual-grid">
        <article className="panel-card">
          <h3><i className="fas fa-users"></i> Meta por vendedor (30 dias base)</h3>
          <ul className="metric-list">
            {metrics.metasPorVendedor.map((item) => (
              <li key={item.vendedor}>
                <div>
                  <strong>{item.vendedor}</strong>
                  <small>{(item.participacion * 100).toFixed(1)}% de participacion</small>
                </div>
                <div>
                  <span>Meta diaria</span>
                  <strong>{formatMoney(item.metaDiaria)}</strong>
                </div>
                <div>
                  <span>Meta mensual</span>
                  <strong>{formatMoney(item.metaMensual)}</strong>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel-card">
          <h3><i className="fas fa-star"></i> Productos top para empujar</h3>
          <ul className="metric-list compact">
            {metrics.topProductos.map((item) => (
              <li key={item.producto}>
                <div>
                  <strong>{item.producto}</strong>
                  <small>{Math.round(item.cantidad)} unidades</small>
                </div>
                <div>
                  <span>Ventas 30d</span>
                  <strong>{formatMoney(item.ventas)}</strong>
                </div>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="control-section">
        <h2><i className="fas fa-calendar-week"></i> Informe consolidado ultimos 7 dias</h2>
        <div className="table-wrap">
          <table className="control-table">
            <thead>
              <tr>
                <th>Vendedor</th>
                <th>Meta 7 dias</th>
                <th>Venta real 7 dias</th>
                <th>Brecha</th>
                <th>Avance</th>
                <th>Contactos</th>
                <th>Cotizaciones</th>
                <th>Cierres</th>
              </tr>
            </thead>
            <tbody>
              {resumen7Dias.map((item) => (
                <tr key={item.vendedor}>
                  <td>{item.vendedor}</td>
                  <td>{formatMoney(item.meta)}</td>
                  <td>{formatMoney(item.real)}</td>
                  <td className={item.brecha >= 0 ? 'brecha-ok' : 'brecha-bad'}>{formatMoney(item.brecha)}</td>
                  <td>{item.avance.toFixed(1)}%</td>
                  <td>{item.contactos}</td>
                  <td>{item.cotizaciones}</td>
                  <td>{item.cierres}</td>
                </tr>
              ))}
              {resumen7Dias.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-row">Aun no hay registros de seguimiento en los ultimos 7 dias.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default PlanSeguimientoVentas;
