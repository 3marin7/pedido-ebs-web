import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import './CalculadorSueldoVendedor.css';

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

  // Datos de resultados
  const [datosVendedor, setDatosVendedor] = useState({
    nombre: '',
    ventasTotal: 0,
    cantidadFacturas: 0,
    ticketPromedio: 0,
    comision: 0,
    sueldoTotal: 0,
    facturas: []
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

    setFechaInicio(primerDiaMes.toISOString().split('T')[0]);
    setFechaFin(ultimoDiaMes.toISOString().split('T')[0]);
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

      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);

      // Obtener todas las facturas del vendedor en el período
      const { data, error: queryError } = await supabase
        .from('facturas')
        .select('id, fecha, total, cliente, productos')
        .eq('vendedor', vendedorSeleccionado)
        .gte('fecha', inicio.toISOString())
        .lte('fecha', fin.toISOString())
        .order('fecha', { ascending: false });

      if (queryError) throw queryError;

      const facturas = data || [];
      
      // Calcular totales
      const ventasTotal = facturas.reduce((sum, f) => sum + (parseFloat(f.total) || 0), 0);
      const cantidadFacturas = facturas.length;
      const ticketPromedio = cantidadFacturas > 0 ? ventasTotal / cantidadFacturas : 0;
      const comision = ventasTotal * (porcentajeComision / 100);
      const sueldoTotal = sueldoBase + comision;

      setDatosVendedor({
        nombre: vendedorSeleccionado,
        ventasTotal,
        cantidadFacturas,
        ticketPromedio,
        comision,
        sueldoTotal,
        facturas
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

    setFechaInicio(inicio.toISOString().split('T')[0]);
    setFechaFin(fin.toISOString().split('T')[0]);
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
    return new Date(dateString).toLocaleDateString('es-CO', {
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
      comisionCalculada: datosVendedor.ventasTotal * (porcentajeComision / 100),
      sueldoMensual: sueldoBase + (datosVendedor.ventasTotal * (porcentajeComision / 100))
    };
  }, [sueldoBase, porcentajeComision, datosVendedor.ventasTotal]);

  return (
    <div className="calculador-sueldo">
      <div className="calculador-header">
        <h1>💰 Calculador de Sueldo Vendedor</h1>
        <p className="subtitle">Calcula ingresos mensuales: Sueldo Base + Comisión en Ventas</p>
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
                  onClick={() => periodo !== 'personalizado' && handlePeriodoChange(p.id)}
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
                <div className="card-icon">📈</div>
                <div className="card-content">
                  <span className="label">Total de Ventas:</span>
                  <span className="valor">{formatCurrency(resumenCalculos.ventasTotal)}</span>
                </div>
              </div>

              <div className="resumen-card">
                <div className="card-icon">📋</div>
                <div className="card-content">
                  <span className="label">Cantidad de Facturas:</span>
                  <span className="valor">{datosVendedor.cantidadFacturas}</span>
                </div>
              </div>

              <div className="resumen-card average">
                <div className="card-icon">🎯</div>
                <div className="card-content">
                  <span className="label">Ticket Promedio:</span>
                  <span className="valor">{formatCurrency(datosVendedor.ticketPromedio)}</span>
                </div>
              </div>
            </div>

            {/* Cálculo de Sueldo */}
            <div className="calculo-sueldo">
              <h2>🧮 Cálculo de Sueldo Mensual</h2>
              
              <div className="formula">
                <div className="formula-item">
                  <span className="label">Sueldo Base:</span>
                  <span className="valor">{formatCurrency(resumenCalculos.sueldoBase)}</span>
                </div>
                <div className="formula-operator">+</div>
                <div className="formula-item">
                  <span className="label">Comisión ({resumenCalculos.porcentajeComision}% de {formatCurrency(resumenCalculos.ventasTotal)}):</span>
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
                    {((resumenCalculos.sueldoBase / resumenCalculos.sueldoMensual) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="desglose-item">
                  <span className="label">% Comisión:</span>
                  <span className="valor comision">
                    {((resumenCalculos.comisionCalculada / resumenCalculos.sueldoMensual) * 100).toFixed(1)}%
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
                    <span className="label">Ventas Anuales Estimadas:</span>
                    <span className="valor">
                      {formatCurrency(resumenCalculos.ventasTotal * 12)}
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
                        <th>Fecha</th>
                        <th>ID Factura</th>
                        <th>Cliente</th>
                        <th>Total Venta</th>
                        <th>Comisión ({porcentajeComision}%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosVendedor.facturas.slice(0, 20).map((factura) => (
                        <tr key={factura.id}>
                          <td>{formatDate(factura.fecha)}</td>
                          <td className="id-factura">{factura.id.substring(0, 8)}...</td>
                          <td>{factura.cliente}</td>
                          <td className="cantidad">{formatCurrency(factura.total)}</td>
                          <td className="comision">
                            {formatCurrency(factura.total * (porcentajeComision / 100))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {datosVendedor.facturas.length > 20 && (
                    <p className="nota">
                      Mostrando 20 de {datosVendedor.facturas.length} facturas
                    </p>
                  )}
                </div>
              </div>
            )}

            {datosVendedor.cantidadFacturas === 0 && (
              <div className="sin-facturas">
                <p>📭 No hay facturas para este vendedor en el período seleccionado</p>
              </div>
            )}
          </div>
        ) : (
          <div className="sin-datos">
            <p>👉 Selecciona un vendedor para ver los datos</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalculadorSueldoVendedor;
