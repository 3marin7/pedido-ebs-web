import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area } from 'recharts';
import './DashboardVentas.css';

const DashboardVentas = () => {
  const [facturasUltimos30Dias, setFacturasUltimos30Dias] = useState([]);
  const [ventasMesActual, setVentasMesActual] = useState(0);
  const [totalVentasAnual, setTotalVentasAnual] = useState(0);
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [ingresosDiarios, setIngresosDiarios] = useState([]);
  const [ventasPorVendedor, setVentasPorVendedor] = useState([]);
  const [cobrosMensuales, setCobrosMensuales] = useState([]);
  const [cobrosPorMes, setCobrosPorMes] = useState([]);
  const [estadoCobros, setEstadoCobros] = useState([]);
  const [totalCobradoAnual, setTotalCobradoAnual] = useState(0);
  const [cobrosUltimos30Dias, setCobrosUltimos30Dias] = useState(0);
  const [cobrosDiariosVendedor, setCobrosDiariosVendedor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const hoy = new Date();
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);

      // 1. Facturas de los últimos 30 días
      const { data: facturasData, error: facturasError } = await supabase
        .from('facturas')
        .select('fecha, total, cliente, vendedor')
        .gte('fecha', hace30Dias.toISOString().split('T')[0])
        .lte('fecha', hoy.toISOString().split('T')[0])
        .order('fecha', { ascending: true });

      if (facturasError) throw facturasError;
      setFacturasUltimos30Dias(facturasData || []);

      // 2. Ventas del mes actual
      const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const { data: ventasMesData, error: ventasMesError } = await supabase
        .from('facturas')
        .select('total')
        .gte('fecha', primerDiaMes.toISOString().split('T')[0])
        .lte('fecha', hoy.toISOString().split('T')[0]);

      if (ventasMesError) throw ventasMesError;
      const totalVentasMes = ventasMesData.reduce((sum, venta) => sum + (parseFloat(venta.total) || 0), 0);
      setVentasMesActual(totalVentasMes);

      // 3. Total ventas anual
      const primerDiaAnio = new Date(hoy.getFullYear(), 0, 1);
      const { data: ventasAnualData, error: ventasAnualError } = await supabase
        .from('facturas')
        .select('total')
        .gte('fecha', primerDiaAnio.toISOString().split('T')[0])
        .lte('fecha', hoy.toISOString().split('T')[0]);

      if (ventasAnualError) throw ventasAnualError;
      const totalVentasAnual = ventasAnualData.reduce((sum, venta) => sum + (parseFloat(venta.total) || 0), 0);
      setTotalVentasAnual(totalVentasAnual);

      // 4. Datos para gráficos
      await loadChartData();
      await loadVendedorData();
      await loadCobrosData();

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      // Gráfico de ventas mensuales
      const ventasMensualesData = await getVentasMensuales();
      setVentasMensuales(ventasMensualesData);

      // Gráfico de ingresos diarios
      const ingresosDiariosData = await getIngresosDiarios();
      setIngresosDiarios(ingresosDiariosData);

    } catch (error) {
      console.error('Error loading chart data:', error);
    }
  };

  const loadVendedorData = async () => {
    try {
      // Ventas totales por vendedor
      const { data: vendedoresData, error } = await supabase
        .from('facturas')
        .select('vendedor, total')
        .not('vendedor', 'is', null)
        .order('vendedor');

      if (error) throw error;

      const ventasPorVendedorMap = {};
      vendedoresData.forEach(factura => {
        const vendedor = factura.vendedor || 'Sin vendedor';
        ventasPorVendedorMap[vendedor] = (ventasPorVendedorMap[vendedor] || 0) + (parseFloat(factura.total) || 0);
      });

      const ventasPorVendedorArray = Object.entries(ventasPorVendedorMap)
        .map(([vendedor, ventas]) => ({ vendedor, ventas }))
        .sort((a, b) => b.ventas - a.ventas);

      setVentasPorVendedor(ventasPorVendedorArray);

    } catch (error) {
      console.error('Error loading vendedor data:', error);
    }
  };

  const loadCobrosData = async () => {
    try {
      const hoy = new Date();
      const currentYear = hoy.getFullYear();

      // 1. COBROS MENSUALES DEL AÑO ACTUAL (desde tabla abonos)
      const { data: cobrosAnualData, error: cobrosError } = await supabase
        .from('abonos')
        .select('fecha, monto, metodo, factura_id')
        .gte('fecha', `${currentYear}-01-01`)
        .lte('fecha', `${currentYear}-12-31`)
        .order('fecha');

      if (cobrosError) throw cobrosError;

      // Procesar cobros mensuales
      const cobrosPorMesMap = Array(12).fill(0);
      if (cobrosAnualData) {
        cobrosAnualData.forEach(abono => {
          const mes = new Date(abono.fecha).getMonth();
          cobrosPorMesMap[mes] += parseFloat(abono.monto) || 0;
        });
      }

      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      setCobrosMensuales(cobrosPorMesMap.map((total, index) => ({
        mes: meses[index],
        cobros: total
      })));

      // Total cobrado anual
      const totalAnual = cobrosAnualData ? 
        cobrosAnualData.reduce((sum, abono) => sum + (parseFloat(abono.monto) || 0), 0) : 0;
      setTotalCobradoAnual(totalAnual);

      // 2. COBROS DE LOS ÚLTIMOS 6 MESES
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
      
      const { data: cobrosRecientesData } = await supabase
        .from('abonos')
        .select('fecha, monto')
        .gte('fecha', seisMesesAtras.toISOString().split('T')[0])
        .order('fecha');

      const cobrosPorMesReciente = {};
      if (cobrosRecientesData) {
        cobrosRecientesData.forEach(abono => {
          const fecha = new Date(abono.fecha);
          const mesKey = `${fecha.getFullYear()}-${fecha.getMonth()}`;
          cobrosPorMesReciente[mesKey] = (cobrosPorMesReciente[mesKey] || 0) + (parseFloat(abono.monto) || 0);
        });

        setCobrosPorMes(Object.entries(cobrosPorMesReciente).map(([key, total]) => {
          const [año, mes] = key.split('-');
          return {
            periodo: `${meses[parseInt(mes)]}-${año.slice(2)}`,
            cobros: total
          };
        }).sort((a, b) => a.periodo.localeCompare(b.periodo)));
      }

      // 3. COBROS DE LOS ÚLTIMOS 30 DÍAS
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      
      const { data: cobros30DiasData } = await supabase
        .from('abonos')
        .select('monto')
        .gte('fecha', hace30Dias.toISOString().split('T')[0])
        .lte('fecha', hoy.toISOString().split('T')[0]);

      const total30Dias = cobros30DiasData ? 
        cobros30DiasData.reduce((sum, abono) => sum + (parseFloat(abono.monto) || 0), 0) : 0;
      setCobrosUltimos30Dias(total30Dias);

      // 4. MÉTODOS DE PAGO (gráfico circular)
      const metodosPago = {};
      if (cobrosAnualData) {
        cobrosAnualData.forEach(abono => {
          const metodo = abono.metodo || 'Sin especificar';
          metodosPago[metodo] = (metodosPago[metodo] || 0) + 1;
        });

        setEstadoCobros(Object.entries(metodosPago).map(([metodo, count]) => ({
          metodo,
          count,
          montoTotal: cobrosAnualData
            .filter(a => a.metodo === metodo)
            .reduce((sum, a) => sum + (parseFloat(a.monto) || 0), 0)
        })));
      }

      // 5. COBROS DIARIOS POR VENDEDOR
      await loadCobrosDiariosVendedor();

    } catch (error) {
      console.error('Error loading cobros data:', error);
    }
  };

  // Nueva función para cargar cobros diarios por vendedor
  const loadCobrosDiariosVendedor = async () => {
    try {
      const hace30Dias = new Date();
      hace30Dias.setDate(hace30Dias.getDate() - 30);
      const fechaInicio = hace30Dias.toISOString().split('T')[0];
      const hoy = new Date().toISOString().split('T')[0];

      // Obtener abonos de los últimos 30 días
      const { data: abonosData, error: abonosError } = await supabase
        .from('abonos')
        .select('fecha, monto, factura_id')
        .gte('fecha', fechaInicio)
        .lte('fecha', hoy)
        .order('fecha');

      if (abonosError) throw abonosError;

      if (!abonosData || abonosData.length === 0) {
        setCobrosDiariosVendedor([]);
        return;
      }

      // Obtener facturas relacionadas con estos abonos
      const facturaIds = [...new Set(abonosData.map(abono => abono.factura_id))];
      
      const { data: facturasData, error: facturasError } = await supabase
        .from('facturas')
        .select('id, vendedor')
        .in('id', facturaIds);

      if (facturasError) throw facturasError;

      // Crear un mapa de factura_id a vendedor
      const facturaVendedorMap = {};
      facturasData.forEach(factura => {
        facturaVendedorMap[factura.id] = factura.vendedor || 'Sin vendedor';
      });

      // Combinar datos de abonos con vendedores
      const cobrosConVendedor = abonosData.map(abono => ({
        ...abono,
        vendedor: facturaVendedorMap[abono.factura_id] || 'Sin vendedor',
        monto: parseFloat(abono.monto) || 0
      }));

      // Agrupar por fecha y vendedor
      const cobrosPorDiaVendedor = {};
      
      cobrosConVendedor.forEach(cobro => {
        const fecha = cobro.fecha;
        const vendedor = cobro.vendedor;
        
        if (!cobrosPorDiaVendedor[fecha]) {
          cobrosPorDiaVendedor[fecha] = {};
        }
        
        if (!cobrosPorDiaVendedor[fecha][vendedor]) {
          cobrosPorDiaVendedor[fecha][vendedor] = 0;
        }
        
        cobrosPorDiaVendedor[fecha][vendedor] += cobro.monto;
      });

      // Obtener lista de todos los vendedores únicos
      const todosVendedores = [...new Set(cobrosConVendedor.map(item => item.vendedor))];
      
      // Convertir a formato para gráfico de áreas apiladas
      const datosGrafico = Object.entries(cobrosPorDiaVendedor).map(([fecha, vendedores]) => {
        const dato = { fecha: fecha.split('-').reverse().join('/').slice(0, 5) };
        
        todosVendedores.forEach(vendedor => {
          dato[vendedor] = vendedores[vendedor] || 0;
        });
        
        return dato;
      }).sort((a, b) => a.fecha.localeCompare(b.fecha));

      setCobrosDiariosVendedor({
        datos: datosGrafico,
        vendedores: todosVendedores
      });

    } catch (error) {
      console.error('Error loading cobros diarios por vendedor:', error);
    }
  };

  // Función para obtener ventas mensuales
  const getVentasMensuales = async () => {
    try {
      const year = new Date().getFullYear();
      const { data, error } = await supabase
        .from('facturas')
        .select('fecha, total')
        .gte('fecha', `${year}-01-01`)
        .lte('fecha', `${year}-12-31`)
        .order('fecha');

      if (error) throw error;

      const ventasPorMes = Array(12).fill(0);
      if (data) {
        data.forEach(factura => {
          const mes = new Date(factura.fecha).getMonth();
          ventasPorMes[mes] += parseFloat(factura.total) || 0;
        });
      }

      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      return ventasPorMes.map((total, index) => ({ mes: meses[index], ventas: total }));

    } catch (error) {
      console.error('Error en getVentasMensuales:', error);
      return [];
    }
  };

  // Función para obtener ingresos diarios
  const getIngresosDiarios = async () => {
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
      if (data) {
        data.forEach(factura => {
          const dia = factura.fecha;
          ingresosPorDia[dia] = (ingresosPorDia[dia] || 0) + (parseFloat(factura.total) || 0);
        });
      }

      return Object.entries(ingresosPorDia).map(([fecha, total]) => ({
        fecha: fecha.split('-').reverse().join('/').slice(0, 5),
        ingresos: total
      })).sort((a, b) => a.fecha.localeCompare(b.fecha));

    } catch (error) {
      console.error('Error en getIngresosDiarios:', error);
      return [];
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Colores para los gráficos
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
  const COLORS_COBROS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0', '#607D8B'];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando datos del dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Dashboard de Ventas y Cobros</h1>
      
      {/* Tabs de navegación */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          📊 General
        </button>
        <button 
          className={`tab ${activeTab === 'vendedores' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendedores')}
        >
          👥 Por Vendedor
        </button>
        <button 
          className={`tab ${activeTab === 'cobros' ? 'active' : ''}`}
          onClick={() => setActiveTab('cobros')}
        >
          💰 Cobros
        </button>
      </div>

      {activeTab === 'general' && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h2>Facturas (Últimos 30 días)</h2>
              <div className="metric">
                <span className="metric-label">Total Facturado:</span>
                <span className="metric-value">
                  {formatCurrency(facturasUltimos30Dias.reduce((sum, f) => sum + (parseFloat(f.total) || 0), 0))}
                </span>
              </div>
              <div className="metric">
                <span className="metric-label">Número de Facturas:</span>
                <span className="metric-value">{facturasUltimos30Dias.length}</span>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Ventas del Mes Actual</h2>
              <div className="ventas-metric">
                <span className="ventas-value">{formatCurrency(ventasMesActual)}</span>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Total Ventas Anual</h2>
              <div className="ventas-metric">
                <span className="ventas-value">{formatCurrency(totalVentasAnual)}</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Ventas Mensuales (Barras) */}
          <div className="dashboard-card full-width">
            <h2>Ventas Mensuales {new Date().getFullYear()}</h2>
            {ventasMensuales.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ventasMensuales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={value => `$${value/1000000}M`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Ventas']} />
                  <Bar dataKey="ventas" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No hay datos para mostrar el gráfico</p>
            )}
          </div>

          {/* Gráfico de Ingresos Diarios (Líneas) */}
          <div className="dashboard-card full-width">
            <h2>Ingresos Diarios (Últimos 30 días)</h2>
            {ingresosDiarios.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={ingresosDiarios}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis tickFormatter={value => `$${value/1000}K`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Ingresos']} />
                  <Line type="monotone" dataKey="ingresos" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p>No hay datos para mostrar el gráfico</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'vendedores' && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h2>Total Vendedores</h2>
              <div className="metric">
                <span className="metric-value">{ventasPorVendedor.length}</span>
                <span className="metric-label">Vendedores activos</span>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Mejor Vendedor</h2>
              <div className="metric">
                <span className="metric-value">
                  {ventasPorVendedor[0]?.vendedor || 'N/A'}
                </span>
                <span className="metric-label">
                  {ventasPorVendedor[0] && formatCurrency(ventasPorVendedor[0].ventas)}
                </span>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Ventas Totales</h2>
              <div className="metric">
                <span className="metric-value">
                  {formatCurrency(ventasPorVendedor.reduce((sum, v) => sum + v.ventas, 0))}
                </span>
                <span className="metric-label">Total todos los vendedores</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Barras por Vendedor */}
          <div className="dashboard-card full-width">
            <h2>Ventas por Vendedor (Barras)</h2>
            {ventasPorVendedor.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={ventasPorVendedor}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="vendedor" />
                  <YAxis tickFormatter={value => `$${value/1000000}M`} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="ventas" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p>No hay datos de vendedores</p>
            )}
          </div>

          {/* Gráfico de Torta por Vendedor */}
          <div className="dashboard-card full-width">
            <h2>Distribución de Ventas por Vendedor (Torta)</h2>
            {ventasPorVendedor.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={ventasPorVendedor}
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="ventas"
                    nameKey="vendedor"
                    label={({ vendedor, ventas }) => `${vendedor}: ${formatCurrency(ventas)}`}
                  >
                    {ventasPorVendedor.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p>No hay datos de vendedores</p>
            )}
          </div>
        </>
      )}

      {activeTab === 'cobros' && (
        <>
          <div className="dashboard-grid">
            <div className="dashboard-card">
              <h2>Total Cobrado Anual</h2>
              <div className="metric">
                <span className="metric-value">
                  {formatCurrency(totalCobradoAnual)}
                </span>
                <span className="metric-label">En {new Date().getFullYear()}</span>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Promedio Mensual</h2>
              <div className="metric">
                <span className="metric-value">
                  {formatCurrency(totalCobradoAnual / 12)}
                </span>
                <span className="metric-label">Por mes</span>
              </div>
            </div>

            <div className="dashboard-card">
              <h2>Cobros Recientes</h2>
              <div className="metric">
                <span className="metric-value">{formatCurrency(cobrosUltimos30Dias)}</span>
                <span className="metric-label">Últimos 30 días</span>
              </div>
            </div>
          </div>

          {/* Gráfico de Cobros Mensuales */}
          <div className="dashboard-card full-width">
            <h2>Cobros Mensuales {new Date().getFullYear()}</h2>
            {cobrosMensuales.length > 0 && cobrosMensuales.some(item => item.cobros > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cobrosMensuales}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis tickFormatter={value => `$${value/1000000}M`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Cobros']} />
                  <Bar dataKey="cobros" fill="#4CAF50" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <p>No hay datos de cobros para {new Date().getFullYear()}</p>
                <small>Los cobros se registran en la tabla 'abonos'</small>
              </div>
            )}
          </div>

          {/* Gráfico de Evolución de Cobros */}
          <div className="dashboard-card full-width">
            <h2>Evolución de Cobros (Últimos 6 meses)</h2>
            {cobrosPorMes.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={cobrosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="periodo" />
                  <YAxis tickFormatter={value => `$${value/1000}K`} />
                  <Tooltip formatter={(value) => [formatCurrency(value), 'Cobros']} />
                  <Line type="monotone" dataKey="cobros" stroke="#2196F3" strokeWidth={3} dot={{ fill: '#2196F3', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <p>No hay datos de cobros recientes</p>
                <small>Los cobros se registran en la tabla 'abonos'</small>
              </div>
            )}
          </div>

          {/* Gráfico de Métodos de Pago */}
          <div className="dashboard-card full-width">
            <h2>Distribución por Método de Pago</h2>
            {estadoCobros.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadoCobros}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="metodo"
                    label={({ metodo, count }) => `${metodo}: ${count}`}
                  >
                    {estadoCobros.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS_COBROS[index % COLORS_COBROS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [
                    `${props.payload.metodo}: ${formatCurrency(props.payload.montoTotal)}`,
                    'Total cobrado'
                  ]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <p>No hay datos de métodos de pago</p>
                <small>Los métodos se registran en el campo 'metodo' de la tabla 'abonos'</small>
              </div>
            )}
          </div>

          {/* NUEVO: Gráfico de Cobros Diarios por Vendedor */}
          <div className="dashboard-card full-width">
            <h2>Cobros Diarios por Vendedor (Últimos 30 días)</h2>
            {cobrosDiariosVendedor.datos && cobrosDiariosVendedor.datos.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={cobrosDiariosVendedor.datos}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis tickFormatter={value => `$${value/1000}K`} />
                  <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                  <Legend />
                  {cobrosDiariosVendedor.vendedores.map((vendedor, index) => (
                    <Area 
                      key={vendedor} 
                      type="monotone" 
                      dataKey={vendedor} 
                      stackId="1" 
                      stroke={COLORS_COBROS[index % COLORS_COBROS.length]} 
                      fill={COLORS_COBROS[index % COLORS_COBROS.length]} 
                      fillOpacity={0.6}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="no-data">
                <p>No hay datos de cobros por vendedor</p>
                <small>Los cobros se registran en la tabla 'abonos' y se asocian a facturas con vendedores</small>
              </div>
            )}
          </div>
        </>
      )}

      <button onClick={fetchDashboardData} className="refresh-btn">
        🔄 Actualizar Datos
      </button>
    </div>
  );
};

export default DashboardVentas;