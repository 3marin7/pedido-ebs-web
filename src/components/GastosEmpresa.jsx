import React, { useState, useEffect } from 'react';
import './GastosEmpresa.css';
import { supabase } from '../lib/supabase';
import { formatInputDateLocal } from '../lib/dateUtils';

const getInitialFormGasto = (tipo = 'varios') => ({
  fecha: formatInputDateLocal(new Date()),
  categoria: tipo === 'nomina' ? 'Nómina' : 'Servicios',
  empleado: 'Edwin Marín',
  descripcion: '',
  monto: '',
  metodo_pago: 'transferencia',
  referencia: '',
  notas: ''
});

const GastosEmpresa = () => {
  // Estados principales
  const [vistaActual, setVistaActual] = useState('dashboard'); // dashboard, nuevo, historial, reportes
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(false);
  
  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState('todos');
  const [filtroEmpleado, setFiltroEmpleado] = useState('todos');
  const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
  const [filtroFechaFin, setFiltroFechaFin] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroReporteMes, setFiltroReporteMes] = useState('ultimos6');
  const [reporteMesInicio, setReporteMesInicio] = useState('');
  const [reporteMesFin, setReporteMesFin] = useState('');
  const [mesDashboardSeleccionado, setMesDashboardSeleccionado] = useState('');

  // Filtros exclusivos del módulo de Nómina (no afectan el historial general)
  const [filtroEmpleadoNomina, setFiltroEmpleadoNomina] = useState('todos');
  const [filtroFechaInicioNomina, setFiltroFechaInicioNomina] = useState('');
  const [filtroFechaFinNomina, setFiltroFechaFinNomina] = useState('');
  const [busquedaNomina, setBusquedaNomina] = useState('');
  
  // Modal de nuevo gasto
  const [mostrarModal, setMostrarModal] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [formGasto, setFormGasto] = useState(getInitialFormGasto());

  // Datos de ejemplo
  const datosEjemplo = {
    gastos: [
      {
        id: 1,
        fecha: '2026-02-15',
        categoria: 'Nómina',
        empleado: 'Paola Huertas',
        descripcion: 'Pago nómina febrero',
        monto: 2750000,
        metodo_pago: 'transferencia',
        referencia: 'TRANS-001',
        notas: 'Pago habitual',
        created_at: '2026-02-01'
      },
      {
        id: 2,
        fecha: '2026-02-14',
        categoria: 'Servicios',
        empleado: 'Edwin Marín',
        descripcion: 'Pago internet y teléfono',
        monto: 185000,
        metodo_pago: 'transferencia',
        referencia: 'TRANS-002',
        notas: '',
        created_at: '2026-02-01'
      },
      {
        id: 3,
        fecha: '2026-02-12',
        categoria: 'Transporte',
        empleado: 'Jhon Fredy Marín',
        descripcion: 'Gasolina y mantenimiento vehículo',
        monto: 250000,
        metodo_pago: 'efectivo',
        referencia: 'EFE-001',
        notas: 'Recibo guardado',
        created_at: '2026-02-01'
      },
      {
        id: 4,
        fecha: '2026-02-10',
        categoria: 'Suministros',
        empleado: 'Carolina Bernal',
        descripcion: 'Papel, bolígrafos y otros suministros de oficina',
        monto: 125000,
        metodo_pago: 'transferencia',
        referencia: 'TRANS-003',
        notas: '',
        created_at: '2026-02-01'
      },
      {
        id: 5,
        fecha: '2026-02-08',
        categoria: 'Viáticos',
        empleado: 'Fabian Marín',
        descripcion: 'Viáticos viaje a Medellín',
        monto: 450000,
        metodo_pago: 'efectivo',
        referencia: 'VIA-001',
        notas: 'Hospedaje y comidas',
        created_at: '2026-02-01'
      }
    ]
  };

  // Categorías disponibles
  const categorias = [
    { value: 'todos', label: '📊 Todas las categorías' },
    { value: 'Nómina', label: '👥 Nómina' },
    { value: 'Servicios', label: '🔌 Servicios' },
    { value: 'Transporte', label: '🚗 Transporte' },
    { value: 'Gasolina', label: '⛽ Gasolina' },
    { value: 'Arriendo', label: '🏢 Arriendo' },
    { value: 'Comida', label: '🍽️ Comida' },
    { value: 'Pasajes', label: '🎫 Pasajes' },
    { value: 'Aseo', label: '🧼 Aseo' },
    { value: 'Ofrenda', label: '🙏 Ofrenda' },
    { value: 'Parqueadero', label: '🅿️ Parqueadero' },
    { value: 'Viáticos', label: '✈️ Viáticos' },
    { value: 'Acarreos', label: '🚚 Acarreos' },
    { value: 'Oficina', label: '📝 Oficina' },
    { value: 'Muebles y Enseres', label: '🪑 Muebles y Enseres' },
    { value: 'Impuestos ICA', label: '📊 Impuestos ICA' },
    { value: 'IVA', label: '💼 IVA' },
    { value: 'Otros Pagos', label: '💳 Otros Pagos' },
    { value: 'EPS', label: '🏥 EPS' },
    { value: 'Créditos', label: '💸 Créditos' },
    { value: 'Suministros', label: '📦 Suministros' },
    { value: 'Mantenimiento', label: '🔧 Mantenimiento' },
    { value: 'Marketing', label: '📢 Marketing' },
    { value: 'Capacitación', label: '📚 Capacitación' },
    { value: 'Otros', label: '📝 Otros' }
  ];

  const categoriasPorTipo = {
    nomina: [{ value: 'Nómina', label: '👥 Nómina' }],
    varios: [
      { value: 'Servicios', label: '🔌 Servicios' },
      { value: 'Transporte', label: '🚗 Transporte' },
      { value: 'Gasolina', label: '⛽ Gasolina' },
      { value: 'Arriendo', label: '🏢 Arriendo' },
      { value: 'Comida', label: '🍽️ Comida' },
      { value: 'Pasajes', label: '🎫 Pasajes' },
      { value: 'Aseo', label: '🧼 Aseo' },
      { value: 'Ofrenda', label: '🙏 Ofrenda' },
      { value: 'Parqueadero', label: '🅿️ Parqueadero' },
      { value: 'Viáticos', label: '✈️ Viáticos' },
      { value: 'Acarreos', label: '🚚 Acarreos' },
      { value: 'Oficina', label: '📝 Oficina' },
      { value: 'Muebles y Enseres', label: '🪑 Muebles y Enseres' },
      { value: 'Impuestos ICA', label: '📊 Impuestos ICA' },
      { value: 'IVA', label: '💼 IVA' },
      { value: 'Otros Pagos', label: '💳 Otros Pagos' },
      { value: 'EPS', label: '🏥 EPS' },
      { value: 'Créditos', label: '💸 Créditos' },
      { value: 'Suministros', label: '📦 Suministros' },
      { value: 'Mantenimiento', label: '🔧 Mantenimiento' },
      { value: 'Marketing', label: '📢 Marketing' },
      { value: 'Capacitación', label: '📚 Capacitación' },
      { value: 'Otros', label: '📝 Otros' }
    ]
  };

  const empleadosIniciales = [
    'Empresa',
    'Edwin Marín',
    'Jhon Fredy Marín',
    'Fabian Marín',
    'Kedma Marín',
    'Sharon Marín',
    'Paola Huertas',
    'Carolina Bernal',
    'Kevin Alexander Vanegas',
    'Dairon'
  ];

  const ordenarEmpleados = (lista) => {
    const prioridad = ['Empresa', 'Edwin Marín', 'Jhon Fredy Marín', 'Paola Huertas', 'Carolina Bernal', 'Fabian Marín', 'Kedma Marín', 'Sharon Marín', 'Kevin Alexander Vanegas', 'Dairon'];
    const porPrioridad = (nombre) => {
      const indice = prioridad.indexOf(nombre);
      return indice === -1 ? Number.MAX_SAFE_INTEGER : indice;
    };

    return [...new Set(lista)].sort((a, b) => {
      const diferencia = porPrioridad(a) - porPrioridad(b);
      return diferencia !== 0 ? diferencia : a.localeCompare(b);
    });
  };

  const [empleados, setEmpleados] = useState(() => {
    if (typeof window === 'undefined') return ordenarEmpleados(empleadosIniciales);
    try {
      const guardados = localStorage.getItem('nominaEmpleados');
      return guardados
        ? ordenarEmpleados([...empleadosIniciales, ...JSON.parse(guardados)])
        : ordenarEmpleados(empleadosIniciales);
    } catch (error) {
      return ordenarEmpleados(empleadosIniciales);
    }
  });
  const [nuevoEmpleadoNomina, setNuevoEmpleadoNomina] = useState('');
  const metodosPago = [
    { value: 'transferencia', label: 'Transferencia' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'tarjeta', label: 'Tarjeta' },
    { value: 'cheque', label: 'Cheque' }
  ];

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('nominaEmpleados', JSON.stringify(empleados));
    }
  }, [empleados]);

  const getTipoGastoActual = (categoria) => (categoria === 'Nómina' ? 'nomina' : 'varios');
  const getCategoriasDisponibles = (tipo = 'varios') => categoriasPorTipo[tipo] || categoriasPorTipo.varios;

  const agregarEmpleadoNomina = () => {
    const nombre = nuevoEmpleadoNomina.trim();
    if (!nombre) {
      alert('Escribe el nombre del empleado antes de agregarlo');
      return;
    }

    const nombreNormalizado = nombre.replace(/\s+/g, ' ');
    if (empleados.some(emp => emp.toLowerCase() === nombreNormalizado.toLowerCase())) {
      setFormGasto(prev => ({ ...prev, empleado: nombreNormalizado }));
      setNuevoEmpleadoNomina('');
      return;
    }

    setEmpleados(prev => ordenarEmpleados([...prev, nombreNormalizado]));
    setFormGasto(prev => ({ ...prev, empleado: nombreNormalizado }));
    setNuevoEmpleadoNomina('');
  };

  const eliminarEmpleadoNomina = (empleado) => {
    if (empleados.length <= 1) {
      alert('Debe quedar al menos un empleado en la nómina');
      return;
    }

    if (!window.confirm(`¿Deseas eliminar a "${empleado}" de la lista de nómina?`)) {
      return;
    }

    const nuevos = empleados.filter(emp => emp !== empleado);
    setEmpleados(ordenarEmpleados(nuevos));

    if (formGasto.empleado === empleado) {
      setFormGasto(prev => ({ ...prev, empleado: nuevos[0] || '' }));
    }
  };

  // Cargar gastos desde Supabase
  const cargarGastos = async () => {
    try {
      setCargando(true);
      const { data, error } = await supabase
        .from('gastos_empresa')
        .select('*')
        .order('fecha', { ascending: false });
      
      if (error) throw error;
      
      const gastosFormateados = data.map(g => ({
        id: g.id,
        fecha: g.fecha,
        categoria: g.categoria,
        empleado: g.empleado,
        descripcion: g.descripcion,
        monto: parseFloat(g.monto),
        metodo_pago: g.metodo_pago,
        referencia: g.referencia,
        notas: g.notas,
        created_at: g.created_at
      }));
      
      setGastos(gastosFormateados);
    } catch (error) {
      console.error('Error al cargar gastos:', error);
      // Fallback a datos de ejemplo si Supabase no está configurado
      setGastos(datosEjemplo.gastos);
    } finally {
      setCargando(false);
    }
  };

  // Inicializar
  useEffect(() => {
    cargarGastos();
  }, []);

  // Guardar gasto
  const guardarGasto = async () => {
    if (!formGasto.fecha || !formGasto.monto || !formGasto.descripcion) {
      alert('Por favor completa los campos requeridos: fecha, monto y descripción');
      return;
    }

    try {
      const datosGasto = {
        fecha: formGasto.fecha,
        categoria: formGasto.categoria,
        empleado: formGasto.empleado,
        descripcion: formGasto.descripcion,
        monto: parseFloat(formGasto.monto),
        metodo_pago: formGasto.metodo_pago,
        referencia: formGasto.referencia || null,
        notas: formGasto.notas || null
      };

      if (gastoEditando) {
        // Editar
        const { error } = await supabase
          .from('gastos_empresa')
          .update(datosGasto)
          .eq('id', gastoEditando.id);
        
        if (error) throw error;
        alert('Gasto actualizado exitosamente');
      } else {
        // Crear nuevo
        const { error } = await supabase
          .from('gastos_empresa')
          .insert([datosGasto]);
        
        if (error) throw error;
        alert('Gasto registrado exitosamente');
      }

      await cargarGastos();
      setGastoEditando(null);
      setFormGasto(getInitialFormGasto());
    } catch (error) {
      console.error('Error al guardar gasto:', error);
      alert('Error al guardar gasto: ' + error.message);
    }
  };

  // Eliminar gasto
  const eliminarGasto = async (id) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este gasto?')) return;

    try {
      const { error } = await supabase
        .from('gastos_empresa')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      alert('Gasto eliminado exitosamente');
      await cargarGastos();
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
      alert('Error al eliminar gasto: ' + error.message);
    }
  };

  // Abrir modal
  const abrirModal = (gasto = null, tipo = null) => {
    if (gasto) {
      setGastoEditando(gasto);
      const tipoGasto = getTipoGastoActual(gasto.categoria);
      setFormGasto({ ...gasto, categoria: gasto.categoria || getInitialFormGasto(tipo || tipoGasto).categoria });
    } else {
      setGastoEditando(null);
      setFormGasto(getInitialFormGasto(tipo || 'varios'));
    }
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setGastoEditando(null);
  };

  const cambiarTipoGasto = (tipo) => {
    setFormGasto(prev => ({
      ...prev,
      categoria: tipo === 'nomina' ? 'Nómina' : 'Servicios'
    }));
  };

  // Funciones de utilidad
  const formatCurrency = (num) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(num);
  };

  const formatDate = (dateString) => {
    return new Date(dateString + 'T00:00:00').toLocaleDateString('es-CO');
  };

  // Filtrar gastos
  const gastosFiltrados = gastos.filter(g => {
    if (filtroCategoria !== 'todos' && g.categoria !== filtroCategoria) return false;
    if (filtroEmpleado !== 'todos' && g.empleado !== filtroEmpleado) return false;
    if (filtroFechaInicio && g.fecha < filtroFechaInicio) return false;
    if (filtroFechaFin && g.fecha > filtroFechaFin) return false;
    if (busqueda && (!g.descripcion.toLowerCase().includes(busqueda.toLowerCase()) && 
                     !g.referencia?.toLowerCase().includes(busqueda.toLowerCase()))) {
      return false;
    }
    return true;
  });

  // Gastos exclusivos de Nómina, con sus propios filtros
  const gastosNomina = gastos.filter(g => g.categoria === 'Nómina');
  const gastosNominaFiltrados = gastosNomina.filter(g => {
    if (filtroEmpleadoNomina !== 'todos' && g.empleado !== filtroEmpleadoNomina) return false;
    if (filtroFechaInicioNomina && g.fecha < filtroFechaInicioNomina) return false;
    if (filtroFechaFinNomina && g.fecha > filtroFechaFinNomina) return false;
    if (busquedaNomina && (!g.descripcion.toLowerCase().includes(busquedaNomina.toLowerCase()) &&
                           !g.referencia?.toLowerCase().includes(busquedaNomina.toLowerCase()))) {
      return false;
    }
    return true;
  });

  const totalNominaFiltrado = gastosNominaFiltrados.reduce((sum, g) => sum + g.monto, 0);
  const totalNominaMesActual = gastosNomina.filter(g => {
    const fecha = new Date(g.fecha + 'T00:00:00');
    return fecha.getMonth() === new Date().getMonth() && fecha.getFullYear() === new Date().getFullYear();
  }).reduce((sum, g) => sum + g.monto, 0);

  const empleadosConNomina = [...new Set(gastosNomina.map(g => g.empleado))];

  const totalNominaPorEmpleado = {};
  empleadosConNomina.forEach(emp => {
    totalNominaPorEmpleado[emp] = gastosNominaFiltrados
      .filter(g => g.empleado === emp)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  // Histórico de nómina agrupado por mes (más reciente primero)
  const nominaPorMes = {};
  gastosNominaFiltrados.forEach(g => {
    const fecha = new Date(g.fecha + 'T00:00:00');
    const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    if (!nominaPorMes[clave]) {
      nominaPorMes[clave] = { total: 0, cantidad: 0, fecha };
    }
    nominaPorMes[clave].total += g.monto;
    nominaPorMes[clave].cantidad += 1;
  });
  const nominaPorMesOrdenada = Object.entries(nominaPorMes)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([clave, datos]) => ({
      clave,
      etiqueta: datos.fecha.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
      ...datos
    }));

  // Exportar reporte de nómina filtrado a Excel
  const exportarNominaExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const filas = gastosNominaFiltrados.map(g => ({
        Fecha: formatDate(g.fecha),
        Empleado: g.empleado,
        Descripción: g.descripcion,
        Monto: g.monto,
        'Método de pago': g.metodo_pago,
        Referencia: g.referencia || '',
        Notas: g.notas || ''
      }));
      const hoja = XLSX.utils.json_to_sheet(filas);
      const libro = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(libro, hoja, 'Nómina');
      XLSX.writeFile(libro, `reporte-nomina-${formatInputDateLocal(new Date())}.xlsx`);
    } catch (error) {
      console.error('Error exportando reporte de nómina:', error);
      alert('Error al exportar el reporte de nómina');
    }
  };

  // Calcular totales
  const totalGastos = gastosFiltrados.reduce((sum, g) => sum + g.monto, 0);
  const totalPorCategoria = {};
  categorias.slice(1).forEach(cat => {
    totalPorCategoria[cat.value] = gastos
      .filter(g => g.categoria === cat.value)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  const totalPorEmpleado = {};
  empleados.forEach(emp => {
    totalPorEmpleado[emp] = gastos
      .filter(g => g.empleado === emp)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  const getMesKey = (fechaString) => {
    const fecha = new Date(fechaString + 'T00:00:00');
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  };

  const mesesDisponibles = [...new Set(gastos.map(g => getMesKey(g.fecha)))].sort().reverse();

  useEffect(() => {
    if (!mesDashboardSeleccionado && mesesDisponibles.length > 0) {
      setMesDashboardSeleccionado(mesesDisponibles[0]);
      return;
    }

    if (mesDashboardSeleccionado && !mesesDisponibles.includes(mesDashboardSeleccionado) && mesesDisponibles.length > 0) {
      setMesDashboardSeleccionado(mesesDisponibles[0]);
    }
  }, [mesesDisponibles, mesDashboardSeleccionado]);

  const gastosDashboard = mesDashboardSeleccionado
    ? gastos.filter(g => getMesKey(g.fecha) === mesDashboardSeleccionado)
    : gastos;

  const totalMesDashboard = gastosDashboard.reduce((sum, g) => sum + g.monto, 0);

  const totalPorCategoriaDashboard = {};
  categorias.slice(1).forEach(cat => {
    totalPorCategoriaDashboard[cat.value] = gastosDashboard
      .filter(g => g.categoria === cat.value)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  const totalPorEmpleadoDashboard = {};
  empleados.forEach(emp => {
    totalPorEmpleadoDashboard[emp] = gastosDashboard
      .filter(g => g.empleado === emp)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  const getMesLabel = (mesKey) => {
    const [anio, mes] = mesKey.split('-');
    return new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric'
    });
  };

  const mesesReporte = filtroReporteMes === 'todos'
    ? mesesDisponibles
    : filtroReporteMes === 'ultimos6'
      ? mesesDisponibles.slice(0, 6)
      : filtroReporteMes === 'especifico'
        ? mesesDisponibles.filter(mes => mes === reporteMesInicio)
        : mesesDisponibles.filter(mes => {
          if (!reporteMesInicio || !reporteMesFin) return false;
          const inicio = reporteMesInicio <= reporteMesFin ? reporteMesInicio : reporteMesFin;
          const fin = reporteMesInicio <= reporteMesFin ? reporteMesFin : reporteMesInicio;
          return mes >= inicio && mes <= fin;
        });
  const gastosReporte = gastos.filter(g => mesesReporte.includes(getMesKey(g.fecha)));
  const totalGeneralReporte = gastosReporte.reduce((sum, g) => sum + g.monto, 0);

  const totalPorCategoriaReporte = {};
  categorias.slice(1).forEach(cat => {
    totalPorCategoriaReporte[cat.value] = gastosReporte
      .filter(g => g.categoria === cat.value)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  const totalPorEmpleadoReporte = {};
  empleados.forEach(emp => {
    totalPorEmpleadoReporte[emp] = gastosReporte
      .filter(g => g.empleado === emp)
      .reduce((sum, g) => sum + g.monto, 0);
  });

  const resumenMensualReporte = Object.entries(
    gastosReporte.reduce((acc, g) => {
      const mesKey = getMesKey(g.fecha);
      if (!acc[mesKey]) {
        acc[mesKey] = { mes: mesKey, etiqueta: getMesLabel(mesKey), total: 0, registros: 0 };
      }
      acc[mesKey].total += Number(g.monto || 0);
      acc[mesKey].registros += 1;
      return acc;
    }, {})
  )
    .map(([, datos]) => datos)
    .sort((a, b) => b.mes.localeCompare(a.mes));

  const exportarReporteExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const categoriaRows = categorias.slice(1)
        .sort((a, b) => (totalPorCategoriaReporte[b.value] || 0) - (totalPorCategoriaReporte[a.value] || 0))
        .map(cat => ({
          Categoría: cat.label,
          Total: totalPorCategoriaReporte[cat.value] || 0,
          Registros: gastosReporte.filter(g => g.categoria === cat.value).length,
          '%': gastosReporte.length > 0 ? Number(((totalPorCategoriaReporte[cat.value] || 0) / totalGeneralReporte) * 100).toFixed(1) : 0
        }));

      const empleadoRows = empleados
        .sort((a, b) => (totalPorEmpleadoReporte[b] || 0) - (totalPorEmpleadoReporte[a] || 0))
        .map(emp => ({
          Empleado: emp,
          Total: totalPorEmpleadoReporte[emp] || 0,
          Registros: gastosReporte.filter(g => g.empleado === emp).length,
          '%': totalGeneralReporte > 0 ? Number(((totalPorEmpleadoReporte[emp] || 0) / totalGeneralReporte) * 100).toFixed(1) : 0
        }));

      const mesRows = resumenMensualReporte.map(item => ({
        Mes: item.etiqueta,
        Total: item.total,
        Registros: item.registros
      }));

      const libro = XLSX.utils.book_new();
      const hojaCategorias = XLSX.utils.json_to_sheet(categoriaRows);
      const hojaEmpleados = XLSX.utils.json_to_sheet(empleadoRows);
      const hojaMeses = XLSX.utils.json_to_sheet(mesRows);

      XLSX.utils.book_append_sheet(libro, hojaCategorias, 'Categorias');
      XLSX.utils.book_append_sheet(libro, hojaEmpleados, 'Empleados');
      XLSX.utils.book_append_sheet(libro, hojaMeses, 'Meses');
      const nombrePeriodo = filtroReporteMes === 'todos'
        ? 'todos'
        : filtroReporteMes === 'ultimos6'
          ? 'ultimos-6-meses'
          : filtroReporteMes === 'especifico'
            ? reporteMesInicio || 'mes-especifico'
            : `${reporteMesInicio || 'inicio'}-${reporteMesFin || 'fin'}`;
      XLSX.writeFile(libro, `reporte-gastos-${nombrePeriodo}-${formatInputDateLocal(new Date())}.xlsx`);
    } catch (error) {
      console.error('Error exportando reporte:', error);
      alert('Error al exportar el reporte');
    }
  };

  // ========================
  // RENDER: DASHBOARD
  // ========================
  if (vistaActual === 'dashboard') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>💰 Gastos de la Empresa</h1>
          <div className="ge-acciones-rapidas">
            <div className="dashboard-filter-wrap">
              <label className="dashboard-filter-label" htmlFor="mes-dashboard">Mes</label>
              <select
                id="mes-dashboard"
                className="dashboard-filter-select"
                value={mesDashboardSeleccionado || ''}
                onChange={(e) => setMesDashboardSeleccionado(e.target.value)}
              >
                {mesesDisponibles.length === 0 ? (
                  <option value="">Sin registros</option>
                ) : (
                  mesesDisponibles.map(mes => (
                    <option key={mes} value={mes}>{getMesLabel(mes)}</option>
                  ))
                )}
              </select>
            </div>
            <button className="btn-nuevo btn-nuevo-varios" onClick={() => { abrirModal(null, 'varios'); setVistaActual('nuevo'); }}>
              ➕ Gasto Varios
            </button>
            <button className="btn-nuevo btn-nuevo-nomina" onClick={() => { abrirModal(null, 'nomina'); setVistaActual('nuevo'); }}>
              🧾 Pago Nómina
            </button>
          </div>
        </div>

        {/* Navegación de vistas */}
        <div className="ge-nav">
          <button 
            className={`nav-btn ${vistaActual === 'dashboard' ? 'active' : ''}`}
            onClick={() => setVistaActual('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={`nav-btn ${vistaActual === 'nuevo' ? 'active' : ''}`}
            onClick={() => { abrirModal(null, 'varios'); setVistaActual('nuevo'); }}
          >
            ➕ Gasto Varios
          </button>
          <button 
            className={`nav-btn ${vistaActual === 'nomina' ? 'active' : ''}`}
            onClick={() => { abrirModal(null, 'nomina'); setVistaActual('nomina'); }}
          >
            🧾 Pago Nómina
          </button>
          <button 
            className={`nav-btn ${vistaActual === 'historial' ? 'active' : ''}`}
            onClick={() => setVistaActual('historial')}
          >
            📜 Historial
          </button>
          <button 
            className={`nav-btn ${vistaActual === 'nomina' ? 'active' : ''}`}
            onClick={() => setVistaActual('nomina')}
          >
            🧾 Nómina
          </button>
          <button 
            className={`nav-btn ${vistaActual === 'reportes' ? 'active' : ''}`}
            onClick={() => setVistaActual('reportes')}
          >
            📈 Reportes
          </button>
        </div>

        {/* Resumen rápido */}
        <div className="ge-resumen-grid">
          <div className="resumen-card">
            <div className="resumen-icon">💸</div>
            <div className="resumen-content">
              <h3>Total Gastos (Mes)</h3>
              <div className="resumen-valor">{formatCurrency(totalMesDashboard)}</div>
            </div>
          </div>

          <div className="resumen-card">
            <div className="resumen-icon">📋</div>
            <div className="resumen-content">
              <h3>Total Registros</h3>
              <div className="resumen-valor">{gastos.length}</div>
            </div>
          </div>

          <div className="resumen-card">
            <div className="resumen-icon">👥</div>
            <div className="resumen-content">
              <h3>Empleados</h3>
              <div className="resumen-valor">{empleados.length}</div>
            </div>
          </div>

          <div className="resumen-card">
            <div className="resumen-icon">📂</div>
            <div className="resumen-content">
              <h3>Categorías</h3>
              <div className="resumen-valor">{categorias.length - 1}</div>
            </div>
          </div>
        </div>

        {/* Top categorías */}
        <div className="ge-top-section">
          <div className="top-box">
            <h3>🏆 Gastos por Categoría</h3>
            <div className="top-list">
              {categorias.slice(1)
                .sort((a, b) => (totalPorCategoriaDashboard[b.value] || 0) - (totalPorCategoriaDashboard[a.value] || 0))
                .slice(0, 5)
                .map(cat => (
                  <div key={cat.value} className="top-item">
                    <div className="top-label">{cat.label}</div>
                    <div className="top-valor">{formatCurrency(totalPorCategoriaDashboard[cat.value] || 0)}</div>
                  </div>
                ))}
            </div>
          </div>

          <div className="top-box">
            <h3>👤 Gastos por Empleado</h3>
            <div className="top-list">
              {empleados
                .sort((a, b) => (totalPorEmpleadoDashboard[b] || 0) - (totalPorEmpleadoDashboard[a] || 0))
                .slice(0, 5)
                .map(emp => (
                  <div key={emp} className="top-item">
                    <div className="top-label">{emp}</div>
                    <div className="top-valor">{formatCurrency(totalPorEmpleadoDashboard[emp] || 0)}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // RENDER: NUEVO GASTO
  // ========================
  if (vistaActual === 'nuevo') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>➕ {gastoEditando ? '✏️ Editar Gasto' : 'Nuevo Registro'}</h1>
          <button className="btn-volver" onClick={() => setVistaActual('dashboard')}>
            ← Volver
          </button>
        </div>

        <div className="ge-form-container">
          <form className="ge-form">
            <div className="form-header-card">
              <div>
                <span className="form-kicker">Registro</span>
                <h2>{getTipoGastoActual(formGasto.categoria) === 'nomina' ? 'Pago de nómina' : 'Gasto empresarial'}</h2>
              </div>
              <span className={`form-badge ${getTipoGastoActual(formGasto.categoria) === 'nomina' ? 'badge-nomina' : 'badge-varios'}`}>
                {getTipoGastoActual(formGasto.categoria) === 'nomina' ? '🧾 Nómina' : '💼 Varios'}
              </span>
            </div>

            <div className="tipo-gasto-selector">
              <button
                type="button"
                className={`segmented-option ${getTipoGastoActual(formGasto.categoria) === 'varios' ? 'active' : ''}`}
                onClick={() => cambiarTipoGasto('varios')}
              >
                💼 Gasto Varios
              </button>
              <button
                type="button"
                className={`segmented-option ${getTipoGastoActual(formGasto.categoria) === 'nomina' ? 'active' : ''}`}
                onClick={() => cambiarTipoGasto('nomina')}
              >
                🧾 Nómina
              </button>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>📅 Fecha *</label>
                <input 
                  type="date"
                  value={formGasto.fecha}
                  onChange={(e) => setFormGasto({...formGasto, fecha: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>📂 Categoría *</label>
                <select 
                  value={formGasto.categoria}
                  onChange={(e) => setFormGasto({...formGasto, categoria: e.target.value})}
                >
                  {getCategoriasDisponibles(getTipoGastoActual(formGasto.categoria)).map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>👤 Empleado Responsable *</label>
                <div className="empleado-selector-row">
                  <select 
                    value={formGasto.empleado}
                    onChange={(e) => setFormGasto({...formGasto, empleado: e.target.value})}
                    className="empleado-select"
                  >
                    {empleados.map(emp => (
                      <option key={emp} value={emp}>{emp}</option>
                    ))}
                  </select>
                  {getTipoGastoActual(formGasto.categoria) === 'nomina' && (
                    <>
                      <input
                        type="text"
                        value={nuevoEmpleadoNomina}
                        onChange={(e) => setNuevoEmpleadoNomina(e.target.value)}
                        placeholder="Nuevo empleado"
                        className="empleado-input"
                      />
                      <button type="button" className="btn-agregar-empleado" onClick={agregarEmpleadoNomina}>
                        + Añadir
                      </button>
                    </>
                  )}
                </div>
                {getTipoGastoActual(formGasto.categoria) === 'nomina' && (
                  <div className="empleados-lista-mini">
                    {empleados.map(emp => (
                      <div key={emp} className="empleado-mini-item">
                        <span>{emp}</span>
                        {empleados.length > 1 && (
                          <button type="button" className="btn-eliminar-empleado" onClick={() => eliminarEmpleadoNomina(emp)}>
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>💰 Monto *</label>
                <input 
                  type="number"
                  value={formGasto.monto}
                  onChange={(e) => setFormGasto({...formGasto, monto: e.target.value})}
                  placeholder="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>💳 Método de Pago</label>
                <select 
                  value={formGasto.metodo_pago}
                  onChange={(e) => setFormGasto({...formGasto, metodo_pago: e.target.value})}
                >
                  {metodosPago.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>📌 Referencia</label>
                <input 
                  type="text"
                  value={formGasto.referencia}
                  onChange={(e) => setFormGasto({...formGasto, referencia: e.target.value})}
                  placeholder="Ej: TRANS-001, REC-005"
                />
              </div>
            </div>

            <div className="form-group">
              <label>📝 Descripción *</label>
              <textarea 
                value={formGasto.descripcion}
                onChange={(e) => setFormGasto({...formGasto, descripcion: e.target.value})}
                placeholder="Detalla qué se compró o el concepto del gasto"
                rows="3"
                required
              />
            </div>

            <div className="form-group">
              <label>📋 Notas adicionales</label>
              <textarea 
                value={formGasto.notas}
                onChange={(e) => setFormGasto({...formGasto, notas: e.target.value})}
                placeholder="Información adicional (opcional)"
                rows="2"
              />
            </div>

            <div className="form-buttons">
              <button type="button" className="btn-guardar" onClick={guardarGasto}>
                ✅ Guardar Gasto
              </button>
              <button type="button" className="btn-cancelar" onClick={() => { cerrarModal(); setVistaActual('dashboard'); }}>
                ❌ Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ========================
  // RENDER: HISTORIAL
  // ========================
  if (vistaActual === 'historial') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>📜 Historial de Gastos</h1>
          <div className="ge-acciones-rapidas">
            <button className="btn-volver" onClick={() => setVistaActual('dashboard')}>
              ← Volver a Gastos
            </button>
            <button className="btn-nuevo" onClick={() => { abrirModal(); setVistaActual('nuevo'); }}>
              ➕ Nuevo Gasto
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="ge-filtros">
          <div className="filtro-grid">
            <div className="filtro-item">
              <label>📂 Categoría</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
                {categorias.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div className="filtro-item">
              <label>👤 Empleado</label>
              <select value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)}>
                <option value="todos">Todos los empleados</option>
                {empleados.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

            <div className="filtro-item">
              <label>📅 Desde</label>
              <input 
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
              />
            </div>

            <div className="filtro-item">
              <label>📅 Hasta</label>
              <input 
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
              />
            </div>

            <div className="filtro-item">
              <label>🔍 Buscar</label>
              <input 
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Descripción o referencia"
              />
            </div>

            <div className="filtro-item">
              <button 
                className="btn-limpiar"
                onClick={() => {
                  setFiltroCategoria('todos');
                  setFiltroEmpleado('todos');
                  setFiltroFechaInicio('');
                  setFiltroFechaFin('');
                  setBusqueda('');
                }}
              >
                🔄 Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Tabla */}
        <div className="ge-tabla-wrapper">
          <table className="ge-tabla">
            <thead>
              <tr>
                <th>📅 Fecha</th>
                <th>📂 Categoría</th>
                <th>👤 Empleado</th>
                <th>📝 Descripción</th>
                <th>💰 Monto</th>
                <th>💳 Método</th>
                <th>📌 Referencia</th>
                <th>⚙️ Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="8" className="text-center">⏳ Cargando...</td></tr>
              ) : gastosFiltrados.length === 0 ? (
                <tr><td colSpan="8" className="text-center">No hay gastos registrados</td></tr>
              ) : (
                gastosFiltrados.map(g => (
                  <tr key={g.id}>
                    <td>{formatDate(g.fecha)}</td>
                    <td><span className="categoria-badge">{g.categoria}</span></td>
                    <td>{g.empleado}</td>
                    <td className="descripcion">{g.descripcion}</td>
                    <td className="monto">{formatCurrency(g.monto)}</td>
                    <td><span className="metodo-badge">{g.metodo_pago}</span></td>
                    <td>{g.referencia || '-'}</td>
                    <td className="acciones">
                      <button className="btn-editar" onClick={() => { abrirModal(g); setVistaActual('nuevo'); }}>✏️</button>
                      <button className="btn-eliminar" onClick={() => eliminarGasto(g.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen */}
        <div className="ge-resumen-tabla">
          <div className="resumen-item">
            <span className="label">Total Gastos:</span>
            <span className="valor">{formatCurrency(totalGastos)}</span>
          </div>
          <div className="resumen-item">
            <span className="label">Registros:</span>
            <span className="valor">{gastosFiltrados.length}</span>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // RENDER: NÓMINA
  // ========================
  if (vistaActual === 'nomina') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>🧾 Gastos de Nómina</h1>
          <button
            className="btn-nuevo"
            onClick={() => { abrirModal(); setFormGasto({ ...getInitialFormGasto(), categoria: 'Nómina' }); setVistaActual('nuevo'); }}
          >
            ➕ Nuevo Pago de Nómina
          </button>
        </div>

        {/* Navegación de vistas */}
        <div className="ge-nav">
          <button className="nav-btn" onClick={() => setVistaActual('dashboard')}>📊 Dashboard</button>
          <button className="nav-btn" onClick={() => setVistaActual('historial')}>📜 Historial</button>
          <button className="nav-btn active">🧾 Nómina</button>
          <button className="nav-btn" onClick={() => setVistaActual('reportes')}>📈 Reportes</button>
        </div>

        {/* Resumen rápido de nómina */}
        <div className="ge-resumen-grid">
          <div className="resumen-card">
            <div className="resumen-icon">💸</div>
            <div className="resumen-content">
              <h3>Nómina (Mes actual)</h3>
              <div className="resumen-valor">{formatCurrency(totalNominaMesActual)}</div>
            </div>
          </div>
          <div className="resumen-card">
            <div className="resumen-icon">📋</div>
            <div className="resumen-content">
              <h3>Total Filtrado</h3>
              <div className="resumen-valor">{formatCurrency(totalNominaFiltrado)}</div>
            </div>
          </div>
          <div className="resumen-card">
            <div className="resumen-icon">👥</div>
            <div className="resumen-content">
              <h3>Empleados con Nómina</h3>
              <div className="resumen-valor">{empleadosConNomina.length}</div>
            </div>
          </div>
          <div className="resumen-card">
            <div className="resumen-icon">📄</div>
            <div className="resumen-content">
              <h3>Pagos Registrados</h3>
              <div className="resumen-valor">{gastosNominaFiltrados.length}</div>
            </div>
          </div>
        </div>

        {/* Filtros exclusivos de Nómina */}
        <div className="ge-filtros">
          <div className="filtro-grid">
            <div className="filtro-item">
              <label>👤 Empleado</label>
              <select value={filtroEmpleadoNomina} onChange={(e) => setFiltroEmpleadoNomina(e.target.value)}>
                <option value="todos">Todos los empleados</option>
                {empleadosConNomina.map(emp => (
                  <option key={emp} value={emp}>{emp}</option>
                ))}
              </select>
            </div>
            <div className="filtro-item">
              <label>📅 Desde</label>
              <input type="date" value={filtroFechaInicioNomina} onChange={(e) => setFiltroFechaInicioNomina(e.target.value)} />
            </div>
            <div className="filtro-item">
              <label>📅 Hasta</label>
              <input type="date" value={filtroFechaFinNomina} onChange={(e) => setFiltroFechaFinNomina(e.target.value)} />
            </div>
            <div className="filtro-item">
              <label>🔍 Buscar</label>
              <input
                type="text"
                value={busquedaNomina}
                onChange={(e) => setBusquedaNomina(e.target.value)}
                placeholder="Descripción o referencia"
              />
            </div>
            <div className="filtro-item">
              <button
                className="btn-limpiar"
                onClick={() => {
                  setFiltroEmpleadoNomina('todos');
                  setFiltroFechaInicioNomina('');
                  setFiltroFechaFinNomina('');
                  setBusquedaNomina('');
                }}
              >
                🔄 Limpiar
              </button>
            </div>
            <div className="filtro-item">
              <button className="btn-guardar" onClick={exportarNominaExcel}>
                📥 Exportar Excel
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de pagos de nómina */}
        <div className="ge-tabla-wrapper">
          <table className="ge-tabla">
            <thead>
              <tr>
                <th>📅 Fecha</th>
                <th>👤 Empleado</th>
                <th>📝 Descripción</th>
                <th>💰 Monto</th>
                <th>💳 Método</th>
                <th>📌 Referencia</th>
                <th>⚙️ Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="7" className="text-center">⏳ Cargando...</td></tr>
              ) : gastosNominaFiltrados.length === 0 ? (
                <tr><td colSpan="7" className="text-center">No hay pagos de nómina registrados</td></tr>
              ) : (
                gastosNominaFiltrados.map(g => (
                  <tr key={g.id}>
                    <td>{formatDate(g.fecha)}</td>
                    <td>{g.empleado}</td>
                    <td className="descripcion">{g.descripcion}</td>
                    <td className="monto">{formatCurrency(g.monto)}</td>
                    <td><span className="metodo-badge">{g.metodo_pago}</span></td>
                    <td>{g.referencia || '-'}</td>
                    <td className="acciones">
                      <button className="btn-editar" onClick={() => { abrirModal(g); setVistaActual('nuevo'); }}>✏️</button>
                      <button className="btn-eliminar" onClick={() => eliminarGasto(g.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Resumen por empleado y por mes */}
        <div className="ge-top-section">
          <div className="top-box">
            <h3>👥 Nómina por Empleado</h3>
            <div className="top-list">
              {empleadosConNomina
                .sort((a, b) => (totalNominaPorEmpleado[b] || 0) - (totalNominaPorEmpleado[a] || 0))
                .map(emp => (
                  <div key={emp} className="top-item">
                    <div className="top-label">{emp}</div>
                    <div className="top-valor">{formatCurrency(totalNominaPorEmpleado[emp] || 0)}</div>
                  </div>
                ))}
              {empleadosConNomina.length === 0 && (
                <p className="text-center">Aún no hay pagos de nómina registrados</p>
              )}
            </div>
          </div>

          <div className="top-box">
            <h3>📅 Nómina por Mes (Histórico)</h3>
            <div className="ge-tabla-wrapper ge-tabla-scroll">
              <table className="ge-tabla">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Pagos</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {nominaPorMesOrdenada.length === 0 ? (
                    <tr><td colSpan="3" className="text-center">Sin datos históricos</td></tr>
                  ) : (
                    nominaPorMesOrdenada.map(mes => (
                      <tr key={mes.clave}>
                        <td style={{ textTransform: 'capitalize' }}>{mes.etiqueta}</td>
                        <td>{mes.cantidad}</td>
                        <td className="monto">{formatCurrency(mes.total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // RENDER: REPORTES
  // ========================
  if (vistaActual === 'reportes') {
    return (
      <div className="ge-container">
        <div className="ge-header">
          <h1>📈 Reportes</h1>
          <div className="reporte-toolbar">
            <select
              className="reporte-select"
              value={filtroReporteMes}
              onChange={(e) => setFiltroReporteMes(e.target.value)}
            >
              <option value="ultimos6">Últimos 6 meses</option>
              <option value="todos">Todos los meses</option>
              <option value="especifico">Mes específico</option>
              <option value="rango">Rango de meses</option>
            </select>
            {(filtroReporteMes === 'especifico' || filtroReporteMes === 'rango') && (
              <div className="reporte-periodo-inputs">
                <label>
                  {filtroReporteMes === 'rango' ? 'Desde' : 'Mes'}
                  <input
                    type="month"
                    value={reporteMesInicio}
                    onChange={(e) => {
                      setReporteMesInicio(e.target.value);
                      if (filtroReporteMes === 'especifico') setReporteMesFin(e.target.value);
                    }}
                  />
                </label>
                {filtroReporteMes === 'rango' && (
                  <label>
                    Hasta
                    <input
                      type="month"
                      value={reporteMesFin}
                      onChange={(e) => setReporteMesFin(e.target.value)}
                    />
                  </label>
                )}
              </div>
            )}
            <button className="btn-guardar" onClick={exportarReporteExcel}>
              📥 Exportar Excel
            </button>
            <button className="btn-volver" onClick={() => setVistaActual('dashboard')}>
              ← Volver a Gastos
            </button>
          </div>
        </div>

        <div className="reporte-tabla-wrapper">
          <table className="reporte-excel-table">
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Total</th>
                <th>Registros</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {categorias.slice(1)
                .sort((a, b) => (totalPorCategoriaReporte[b.value] || 0) - (totalPorCategoriaReporte[a.value] || 0))
                .map(cat => {
                  const total = totalPorCategoriaReporte[cat.value] || 0;
                  const registros = gastosReporte.filter(g => g.categoria === cat.value).length;
                  const porcentaje = totalGeneralReporte > 0 ? Number((total / totalGeneralReporte) * 100).toFixed(1) : 0;
                  return (
                    <tr key={cat.value}>
                      <td>{cat.label}</td>
                      <td className="monto-strong">{formatCurrency(total)}</td>
                      <td>{registros}</td>
                      <td>{porcentaje}%</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="reporte-tabla-wrapper reporte-segunda-tabla">
          <table className="reporte-excel-table">
            <thead>
              <tr>
                <th>Empleado</th>
                <th>Total</th>
                <th>Registros</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {empleados
                .sort((a, b) => (totalPorEmpleadoReporte[b] || 0) - (totalPorEmpleadoReporte[a] || 0))
                .map(emp => {
                  const total = totalPorEmpleadoReporte[emp] || 0;
                  const registros = gastosReporte.filter(g => g.empleado === emp).length;
                  const porcentaje = totalGeneralReporte > 0 ? Number((total / totalGeneralReporte) * 100).toFixed(1) : 0;
                  return (
                    <tr key={emp}>
                      <td>{emp}</td>
                      <td className="monto-strong">{formatCurrency(total)}</td>
                      <td>{registros}</td>
                      <td>{porcentaje}%</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        <div className="reporte-tabla-wrapper reporte-segunda-tabla">
          <table className="reporte-excel-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th>Total</th>
                <th>Registros</th>
              </tr>
            </thead>
            <tbody>
              {resumenMensualReporte.map(item => (
                <tr key={item.mes}>
                  <td style={{ textTransform: 'capitalize' }}>{item.etiqueta}</td>
                  <td className="monto-strong">{formatCurrency(item.total)}</td>
                  <td>{item.registros}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="reporte-totales">
          <h3>📌 Resumen General</h3>
          <div className="totales-grid">
            <div className="total-item">
              <div className="total-label">Total General</div>
              <div className="total-valor">{formatCurrency(totalGeneralReporte)}</div>
            </div>
            <div className="total-item">
              <div className="total-label">Promedio por Gasto</div>
              <div className="total-valor">{formatCurrency(gastosReporte.length > 0 ? totalGeneralReporte / gastosReporte.length : 0)}</div>
            </div>
            <div className="total-item">
              <div className="total-label">Gasto Mayor</div>
              <div className="total-valor">{formatCurrency(gastosReporte.length > 0 ? Math.max(...gastosReporte.map(g => g.monto)) : 0)}</div>
            </div>
            <div className="total-item">
              <div className="total-label">Gasto Menor</div>
              <div className="total-valor">{formatCurrency(gastosReporte.length > 0 ? Math.min(...gastosReporte.map(g => g.monto)) : 0)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default GastosEmpresa;
