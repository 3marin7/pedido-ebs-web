import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function MejoresProductos() {
  const [productosMasVendidos, setProductosMasVendidos] = useState([]);
  const [periodo, setPeriodo] = useState('mes');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [cargando, setCargando] = useState(false);
  const [vista, setVista] = useState('lista'); // 'lista', 'barras', 'torta'
  const [comparativa, setComparativa] = useState(false);
  const [periodoAnterior, setPeriodoAnterior] = useState([]);

  // Establecer fechas por defecto
  useEffect(() => {
    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const ultimoDiaMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
    
    setFechaInicio(primerDiaMes.toISOString().split('T')[0]);
    setFechaFin(ultimoDiaMes.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (fechaInicio && fechaFin) {
      obtenerProductosMasVendidos();
    }
  }, [periodo, fechaInicio, fechaFin, comparativa]);

  const obtenerProductosMasVendidos = async () => {
    try {
      setCargando(true);
      
      // Obtener facturas del período seleccionado
      const { data: facturas, error } = await supabase
        .from('facturas')
        .select('*')
        .gte('fecha', fechaInicio)
        .lte('fecha', fechaFin);
      
      if (error) throw error;
      
      // Procesar productos vendidos
      const ventasPorProducto = {};
      
      facturas.forEach(factura => {
        if (factura.productos && Array.isArray(factura.productos)) {
          factura.productos.forEach(producto => {
            if (!ventasPorProducto[producto.nombre]) {
              ventasPorProducto[producto.nombre] = {
                nombre: producto.nombre,
                cantidad: 0,
                totalVentas: 0,
                vecesVendido: 0
              };
            }
            
            ventasPorProducto[producto.nombre].cantidad += producto.cantidad;
            ventasPorProducto[producto.nombre].totalVentas += producto.cantidad * producto.precio;
            ventasPorProducto[producto.nombre].vecesVendido += 1;
          });
        }
      });
      
      // Convertir a array y ordenar
      const productosArray = Object.values(ventasPorProducto);
      productosArray.sort((a, b) => b.cantidad - a.cantidad);
      
      setProductosMasVendidos(productosArray.slice(0, 10)); // Top 10 productos
      
      // Obtener datos del período anterior si se solicita comparativa
      if (comparativa) {
        await obtenerDatosPeriodoAnterior();
      } else {
        setPeriodoAnterior([]);
      }
      
    } catch (error) {
      console.error('Error obteniendo productos más vendidos:', error);
    } finally {
      setCargando(false);
    }
  };

  const obtenerDatosPeriodoAnterior = async () => {
    try {
      // Calcular período anterior
      const inicioDate = new Date(fechaInicio);
      const finDate = new Date(fechaFin);
      const diffTime = finDate - inicioDate;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      
      const inicioAnterior = new Date(inicioDate);
      inicioAnterior.setDate(inicioDate.getDate() - diffDays);
      
      const finAnterior = new Date(inicioDate);
      finAnterior.setDate(inicioDate.getDate() - 1);
      
      // Obtener facturas del período anterior
      const { data: facturasAnterior, error } = await supabase
        .from('facturas')
        .select('*')
        .gte('fecha', inicioAnterior.toISOString().split('T')[0])
        .lte('fecha', finAnterior.toISOString().split('T')[0]);
      
      if (error) throw error;
      
      // Procesar productos vendidos del período anterior
      const ventasPorProductoAnterior = {};
      
      facturasAnterior.forEach(factura => {
        if (factura.productos && Array.isArray(factura.productos)) {
          factura.productos.forEach(producto => {
            if (!ventasPorProductoAnterior[producto.nombre]) {
              ventasPorProductoAnterior[producto.nombre] = {
                nombre: producto.nombre,
                cantidad: 0,
                totalVentas: 0,
                vecesVendido: 0
              };
            }
            
            ventasPorProductoAnterior[producto.nombre].cantidad += producto.cantidad;
            ventasPorProductoAnterior[producto.nombre].totalVentas += producto.cantidad * producto.precio;
            ventasPorProductoAnterior[producto.nombre].vecesVendido += 1;
          });
        }
      });
      
      // Convertir a array y ordenar
      const productosArrayAnterior = Object.values(ventasPorProductoAnterior);
      setPeriodoAnterior(productosArrayAnterior);
      
    } catch (error) {
      console.error('Error obteniendo datos del período anterior:', error);
    }
  };

  const exportarPDF = () => {
    // Crear contenido HTML para el PDF
    const contenido = `
      <h1>Reporte de Productos Más Vendidos</h1>
      <p>Período: ${fechaInicio} al ${fechaFin}</p>
      <table border="1" cellpadding="5" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th>#</th>
            <th>Producto</th>
            <th>Cantidad Vendida</th>
            <th>Total Ventas</th>
            <th>Veces Vendido</th>
          </tr>
        </thead>
        <tbody>
          ${productosMasVendidos.map((producto, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${producto.nombre}</td>
              <td>${producto.cantidad}</td>
              <td>$${producto.totalVentas.toLocaleString()}</td>
              <td>${producto.vecesVendido}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
    
    // Crear ventana para imprimir
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <html>
        <head>
          <title>Reporte Productos Más Vendidos</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f2f2f2; }
          </style>
        </head>
        <body>
          ${contenido}
        </body>
      </html>
    `);
    ventana.document.close();
    
    // Imprimir como PDF
    ventana.print();
  };

  const exportarCSV = () => {
    // Preparar datos para CSV
    const datosCSV = productosMasVendidos.map((producto, index) => ({
      'Posición': index + 1,
      'Producto': producto.nombre,
      'Cantidad Vendida': producto.cantidad,
      'Total Ventas': producto.totalVentas,
      'Veces Vendido': producto.vecesVendido
    }));
    
    // Crear libro de trabajo y hoja
    const libro = XLSX.utils.book_new();
    const hoja = XLSX.utils.json_to_sheet(datosCSV);
    
    // Añadir hoja al libro
    XLSX.utils.book_append_sheet(libro, hoja, 'Productos Más Vendidos');
    
    // Descargar archivo
    XLSX.writeFile(libro, `productos_mas_vendidos_${fechaInicio}_a_${fechaFin}.xlsx`);
  };

  // Preparar datos para gráficos
  const datosGraficoBarras = {
    labels: productosMasVendidos.map(p => p.nombre),
    datasets: [
      {
        label: 'Cantidad Vendida',
        data: productosMasVendidos.map(p => p.cantidad),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const datosGraficoTorta = {
    labels: productosMasVendidos.map(p => p.nombre),
    datasets: [
      {
        data: productosMasVendidos.map(p => p.cantidad),
        backgroundColor: [
          '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
          '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#36A2EB'
        ],
        borderWidth: 1,
      },
    ],
  };

  const opcionesGrafico = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Productos Más Vendidos',
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          🏆 Productos Más Vendidos
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={exportarCSV}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center"
          >
            📊 Excel
          </button>
          <button
            onClick={exportarPDF}
            className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 flex items-center"
          >
            📄 PDF
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vista</label>
          <select
            value={vista}
            onChange={(e) => setVista(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="lista">Lista</option>
            <option value="barras">Gráfico de Barras</option>
            <option value="torta">Gráfico de Torta</option>
          </select>
        </div>
        
        <div className="flex items-end">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={comparativa}
              onChange={(e) => setComparativa(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">Comparar con período anterior</span>
          </label>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">Cargando datos...</p>
        </div>
      ) : productosMasVendidos.length > 0 ? (
        <>
          {/* Selector de vista */}
          {vista === 'lista' && (
            <div className="space-y-4">
              {productosMasVendidos.map((producto, index) => {
                // Encontrar datos del período anterior para comparación
                const productoAnterior = periodoAnterior.find(p => p.nombre === producto.nombre);
                const diferencia = productoAnterior ? producto.cantidad - productoAnterior.cantidad : null;
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full mr-4">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-800">{producto.nombre}</h3>
                        <p className="text-sm text-gray-600">{producto.vecesVendido} ventas</p>
                        {comparativa && diferencia !== null && (
                          <p className={`text-xs ${diferencia > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {diferencia > 0 ? '↑' : '↓'} {Math.abs(diferencia)} unidades vs. período anterior
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{producto.cantidad} unidades</p>
                      <p className="text-sm text-green-600">${producto.totalVentas.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {vista === 'barras' && (
            <div className="h-96 mt-6">
              <Bar data={datosGraficoBarras} options={opcionesGrafico} />
            </div>
          )}
          
          {vista === 'torta' && (
            <div className="h-96 mt-6">
              <Pie data={datosGraficoTorta} options={opcionesGrafico} />
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          No hay datos de ventas para el período seleccionado.
        </div>
      )}
    </div>
  );
}