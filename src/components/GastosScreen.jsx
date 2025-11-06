import React, { useState, useEffect } from 'react';
import './GastosScreen.css';

const GastosScreen = () => {
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [tipoGasto, setTipoGasto] = useState('todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [datosGastos, setDatosGastos] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Estado para nuevo gasto
  const [nuevoGasto, setNuevoGasto] = useState({
    fecha: '',
    tipo: 'nequi',
    persona: 'Edwin Marín',
    cantidad: '',
    referencia: '',
    categoria: 'Servicios',
    descripcion: ''
  });

  // Datos de ejemplo basados en el documento
  const datosEjemplo = {
    gastosNequi: {
      'Edwin Marín': [
        {
          id: 1,
          fecha: '2025-06-05',
          cantidad: 380000,
          referencia: 'M12808105',
          descripcion: 'Pago varios'
        },
        {
          id: 2,
          fecha: '2025-06-07',
          cantidad: 1000000,
          referencia: 'M12152352',
          descripcion: 'Transferencia negocio'
        },
        // ... más gastos de Edwin según el documento
      ],
      'Jhon Fredy Marín': [
        {
          id: 101,
          fecha: '2025-06-01',
          cantidad: 200000,
          referencia: 'S7660991',
          descripcion: 'Pago inicial'
        },
        {
          id: 102,
          fecha: '2025-06-03',
          cantidad: 270000,
          referencia: 'M168089',
          descripcion: 'Compra materiales'
        },
        // ... más gastos de Jhon según el documento
      ]
    },
    nominas: [
      {
        id: 201,
        persona: 'Paola Huertas',
        cantidad: 2750000,
        mes: 5, // Junio
        anio: 2025,
        tipo: 'nómina',
        descripcion: 'Pago nómina mensual'
      },
      {
        id: 202,
        persona: 'Carolina Bernal',
        cantidad: 1550000,
        mes: 5,
        anio: 2025,
        tipo: 'nómina',
        descripcion: 'Pago nómina mensual'
      },
      {
        id: 203,
        persona: 'Fabian Marín',
        cantidad: 2500000,
        mes: 5,
        anio: 2025,
        tipo: 'prima',
        descripcion: 'Prima 2024'
      }
    ],
    gastosEspecificos: [
      {
        id: 301,
        categoria: 'Ofrenda',
        cantidad: 1400000,
        mes: 5,
        anio: 2025
      },
      {
        id: 302,
        categoria: 'E.P.S',
        cantidad: 400000,
        mes: 5,
        anio: 2025
      },
      {
        id: 303,
        categoria: 'Gasolina',
        cantidad: 323000,
        mes: 5,
        anio: 2025
      },
      {
        id: 304,
        categoria: 'Parqueadero',
        cantidad: 470000,
        mes: 5,
        anio: 2025
      },
      {
        id: 305,
        categoria: 'Comida',
        cantidad: 357500,
        mes: 5,
        anio: 2025
      },
      {
        id: 306,
        categoria: 'Arriendo',
        cantidad: 650000,
        mes: 5,
        anio: 2025
      },
      {
        id: 307,
        categoria: 'Viajes',
        cantidad: 200000,
        mes: 5,
        anio: 2025
      },
      {
        id: 308,
        categoria: 'Pasajes',
        cantidad: 50400,
        mes: 5,
        anio: 2025
      },
      {
        id: 309,
        categoria: 'Compras Oficina',
        cantidad: 102500,
        mes: 5,
        anio: 2025
      }
    ],
    creditos: [
      {
        id: 401,
        distribuidora: 'Roma',
        pago: 700000,
        cartera: 4152638,
        fechaPago: '2025-07-13',
        tipo: 'crédito'
      },
      {
        id: 402,
        distribuidora: 'Axa',
        pago: 1796000,
        cartera: 3140000,
        fechaPago: '2025-07-20',
        tipo: 'crédito'
      },
      {
        id: 403,
        distribuidora: 'Coopicredito',
        pago: 22731842,
        cartera: 0,
        fechaPago: '2025-07-05',
        tipo: 'crédito'
      }
    ],
    cajaMenor: {
      moneda: 43000,
      efectivo: 352000,
      total: 395000
    }
  };

  useEffect(() => {
    setCargando(true);
    const timer = setTimeout(() => {
      setDatosGastos(datosEjemplo);
      setCargando(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Categorías de gastos
  const categoriasGastos = [
    'Servicios', 'Nómina', 'Gasolina', 'Arriendo', 'Comida', 'Transporte',
    'Ofrenda', 'Arreglos', 'Parqueadero', 'Viajes', 'Pasajes', 'Compras Oficina',
    'Fechas Especiales', 'Varios', 'EPS', 'Créditos'
  ];

  // Tipos de gasto
  const tiposGasto = [
    { value: 'nequi', label: 'Nequi' },
    { value: 'efectivo', label: 'Efectivo' },
    { value: 'nomina', label: 'Nómina' },
    { value: 'credito', label: 'Crédito' },
    { value: 'especifico', label: 'Gasto Específico' },
    { value: 'todos', label: 'Todos los Gastos' }
  ];

  // Personas
  const personas = ['Edwin Marín', 'Jhon Fredy Marín', 'Paola Huertas', 'Carolina Bernal', 'Fabian Marín'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoGasto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calcularTotalGastos = () => {
    if (!datosGastos) return 0;

    let total = 0;

    // Sumar gastos Nequi de Edwin
    if (datosGastos.gastosNequi['Edwin Marín']) {
      total += datosGastos.gastosNequi['Edwin Marín'].reduce((sum, gasto) => sum + gasto.cantidad, 0);
    }

    // Sumar gastos Nequi de Jhon
    if (datosGastos.gastosNequi['Jhon Fredy Marín']) {
      total += datosGastos.gastosNequi['Jhon Fredy Marín'].reduce((sum, gasto) => sum + gasto.cantidad, 0);
    }

    // Sumar nóminas
    total += datosGastos.nominas.reduce((sum, nomina) => sum + nomina.cantidad, 0);

    // Sumar gastos específicos
    total += datosGastos.gastosEspecificos.reduce((sum, gasto) => sum + gasto.cantidad, 0);

    return total;
  };

  const agregarGasto = () => {
    if (!nuevoGasto.fecha || !nuevoGasto.cantidad) {
      alert('Por favor complete la fecha y cantidad del gasto');
      return;
    }

    const gasto = {
      id: Date.now(),
      fecha: nuevoGasto.fecha,
      cantidad: parseFloat(nuevoGasto.cantidad),
      referencia: nuevoGasto.referencia,
      descripcion: nuevoGasto.descripcion,
      categoria: nuevoGasto.categoria,
      tipo: nuevoGasto.tipo,
      persona: nuevoGasto.persona
    };

    setDatosGastos(prev => {
      const nuevoEstado = JSON.parse(JSON.stringify(prev));

      switch (nuevoGasto.tipo) {
        case 'nequi':
          if (!nuevoEstado.gastosNequi[nuevoGasto.persona]) {
            nuevoEstado.gastosNequi[nuevoGasto.persona] = [];
          }
          nuevoEstado.gastosNequi[nuevoGasto.persona].push(gasto);
          break;

        case 'nomina':
          nuevoEstado.nominas.push({
            ...gasto,
            persona: nuevoGasto.persona,
            mes: new Date(nuevoGasto.fecha).getMonth(),
            anio: new Date(nuevoGasto.fecha).getFullYear()
          });
          break;

        case 'especifico':
          nuevoEstado.gastosEspecificos.push({
            ...gasto,
            categoria: nuevoGasto.categoria,
            mes: new Date(nuevoGasto.fecha).getMonth(),
            anio: new Date(nuevoGasto.fecha).getFullYear()
          });
          break;

        default:
          break;
      }

      return nuevoEstado;
    });

    limpiarFormulario();
    alert('Gasto agregado exitosamente!');
  };

  const editarGasto = (gasto, tipo, persona = null) => {
    setGastoEditando({ gasto, tipo, persona });
    setNuevoGasto({
      fecha: gasto.fecha,
      tipo: tipo,
      persona: persona || gasto.persona || 'Edwin Marín',
      cantidad: gasto.cantidad.toString(),
      referencia: gasto.referencia || '',
      categoria: gasto.categoria || 'Servicios',
      descripcion: gasto.descripcion || ''
    });
    setMostrarFormulario(true);
  };

  const eliminarGasto = (gastoId, tipo, persona = null) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este gasto?')) {
      return;
    }

    setDatosGastos(prev => {
      const nuevoEstado = JSON.parse(JSON.stringify(prev));

      switch (tipo) {
        case 'nequi':
          if (persona && nuevoEstado.gastosNequi[persona]) {
            nuevoEstado.gastosNequi[persona] = nuevoEstado.gastosNequi[persona].filter(g => g.id !== gastoId);
          }
          break;

        case 'nomina':
          nuevoEstado.nominas = nuevoEstado.nominas.filter(n => n.id !== gastoId);
          break;

        case 'especifico':
          nuevoEstado.gastosEspecificos = nuevoEstado.gastosEspecificos.filter(g => g.id !== gastoId);
          break;

        default:
          break;
      }

      return nuevoEstado;
    });

    alert('Gasto eliminado exitosamente!');
  };

  const limpiarFormulario = () => {
    setNuevoGasto({
      fecha: '',
      tipo: 'nequi',
      persona: 'Edwin Marín',
      cantidad: '',
      referencia: '',
      categoria: 'Servicios',
      descripcion: ''
    });
    setGastoEditando(null);
    setMostrarFormulario(false);
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || amount === '') return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getNombreMes = (mes) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes];
  };

  if (!datosGastos) {
    return (
      <div className="gastos-container">
        <div className="gastos-header">
          <h1>Cargando información de gastos...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={`gastos-container ${cargando ? 'loading' : ''}`}>
      {/* Header */}
      <div className="gastos-header">
        <h1>💰 Sistema de Gestión de Gastos</h1>
        <p>Control y análisis de gastos mensuales, nóminas y créditos</p>
      </div>

      {/* Resumen General */}
      <div className="resumen-gastos">
        <div className="resumen-card total">
          <h3>Total Gastos {getNombreMes(mesSeleccionado)} {anioSeleccionado}</h3>
          <p className="monto-total">{formatCurrency(calcularTotalGastos())}</p>
          <div className="desglose">
            <span>Nequi: {formatCurrency(6348000 + 22743250)}</span>
            <span>Nóminas: {formatCurrency(2750000 + 1550000 + 2500000)}</span>
            <span>Gastos Específicos: {formatCurrency(16050400)}</span>
          </div>
        </div>

        <div className="resumen-card caja-menor">
          <h3>Caja Menor</h3>
          <p className="monto-total">{formatCurrency(datosGastos.cajaMenor.total)}</p>
          <div className="desglose">
            <span>Moneda: {formatCurrency(datosGastos.cajaMenor.moneda)}</span>
            <span>Efectivo: {formatCurrency(datosGastos.cajaMenor.efectivo)}</span>
          </div>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="acciones-principales">
        <button 
          className="btn btn-success" 
          onClick={() => {
            setGastoEditando(null);
            setMostrarFormulario(true);
          }}
        >
          ➕ Agregar Gasto
        </button>
        
        <div className="filtros-rapidos">
          <select 
            value={tipoGasto} 
            onChange={(e) => setTipoGasto(e.target.value)}
            className="filtro-select"
          >
            {tiposGasto.map(tipo => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
          
          <select 
            value={mesSeleccionado} 
            onChange={(e) => setMesSeleccionado(parseInt(e.target.value))}
            className="filtro-select"
          >
            {Array.from({length: 12}, (_, i) => (
              <option key={i} value={i}>{getNombreMes(i)}</option>
            ))}
          </select>
          
          <select 
            value={anioSeleccionado} 
            onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))}
            className="filtro-select"
          >
            {[2024, 2025, 2026].map(anio => (
              <option key={anio} value={anio}>{anio}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Formulario de Gastos */}
      {mostrarFormulario && (
        <div className="formulario-gasto">
          <div className="formulario-header">
            <h3>{gastoEditando ? '✏️ Editar Gasto' : '➕ Agregar Nuevo Gasto'}</h3>
            <button className="btn-cerrar" onClick={limpiarFormulario}>×</button>
          </div>
          
          <div className="formulario-grid">
            <div className="form-group">
              <label>Fecha *</label>
              <input
                type="date"
                name="fecha"
                value={nuevoGasto.fecha}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Tipo de Gasto *</label>
              <select
                name="tipo"
                value={nuevoGasto.tipo}
                onChange={handleInputChange}
              >
                {tiposGasto.filter(t => t.value !== 'todos').map(tipo => (
                  <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Persona *</label>
              <select
                name="persona"
                value={nuevoGasto.persona}
                onChange={handleInputChange}
              >
                {personas.map(persona => (
                  <option key={persona} value={persona}>{persona}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Cantidad *</label>
              <input
                type="number"
                name="cantidad"
                value={nuevoGasto.cantidad}
                onChange={handleInputChange}
                placeholder="0"
                step="1000"
                required
              />
            </div>
            
            <div className="form-group">
              <label>Referencia</label>
              <input
                type="text"
                name="referencia"
                value={nuevoGasto.referencia}
                onChange={handleInputChange}
                placeholder="Ej: M12808105"
              />
            </div>
            
            <div className="form-group">
              <label>Categoría</label>
              <select
                name="categoria"
                value={nuevoGasto.categoria}
                onChange={handleInputChange}
              >
                {categoriasGastos.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group full-width">
              <label>Descripción</label>
              <textarea
                name="descripcion"
                value={nuevoGasto.descripcion}
                onChange={handleInputChange}
                placeholder="Descripción detallada del gasto..."
                rows="3"
              />
            </div>
          </div>
          
          <div className="formulario-acciones">
            <button 
              className="btn btn-success" 
              onClick={agregarGasto}
            >
              💾 {gastoEditando ? 'Actualizar Gasto' : 'Guardar Gasto'}
            </button>
            <button className="btn btn-secondary" onClick={limpiarFormulario}>
              ❌ Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Sección de Gastos por Tipo */}
      {(tipoGasto === 'todos' || tipoGasto === 'nequi') && (
        <div className="seccion-gastos">
          <h2>💳 Gastos Nequi</h2>
          
          <div className="subseccion">
            <h3>Edwin Marín - Total: {formatCurrency(6348000)}</h3>
            <div className="tabla-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cantidad</th>
                    <th>Referencia</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {datosGastos.gastosNequi['Edwin Marín']?.map(gasto => (
                    <tr key={gasto.id}>
                      <td>{gasto.fecha}</td>
                      <td className="negative">{formatCurrency(gasto.cantidad)}</td>
                      <td className="referencia">{gasto.referencia}</td>
                      <td>{gasto.descripcion}</td>
                      <td>
                        <div className="acciones-tabla">
                          <button 
                            className="btn-editar"
                            onClick={() => editarGasto(gasto, 'nequi', 'Edwin Marín')}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-eliminar"
                            onClick={() => eliminarGasto(gasto.id, 'nequi', 'Edwin Marín')}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="subseccion">
            <h3>Jhon Fredy Marín - Total: {formatCurrency(22743250)}</h3>
            <div className="tabla-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cantidad</th>
                    <th>Referencia</th>
                    <th>Descripción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {datosGastos.gastosNequi['Jhon Fredy Marín']?.map(gasto => (
                    <tr key={gasto.id}>
                      <td>{gasto.fecha}</td>
                      <td className="negative">{formatCurrency(gasto.cantidad)}</td>
                      <td className="referencia">{gasto.referencia}</td>
                      <td>{gasto.descripcion}</td>
                      <td>
                        <div className="acciones-tabla">
                          <button 
                            className="btn-editar"
                            onClick={() => editarGasto(gasto, 'nequi', 'Jhon Fredy Marín')}
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-eliminar"
                            onClick={() => eliminarGasto(gasto.id, 'nequi', 'Jhon Fredy Marín')}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Nóminas */}
      {(tipoGasto === 'todos' || tipoGasto === 'nomina') && (
        <div className="seccion-gastos">
          <h2>👥 Nóminas y Pagos Personal</h2>
          <div className="tabla-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Persona</th>
                  <th>Tipo</th>
                  <th>Cantidad</th>
                  <th>Mes</th>
                  <th>Descripción</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {datosGastos.nominas.map(nomina => (
                  <tr key={nomina.id}>
                    <td><strong>{nomina.persona}</strong></td>
                    <td><span className="badge badge-info">{nomina.tipo}</span></td>
                    <td className="negative">{formatCurrency(nomina.cantidad)}</td>
                    <td>{getNombreMes(nomina.mes)} {nomina.anio}</td>
                    <td>{nomina.descripcion}</td>
                    <td>
                      <div className="acciones-tabla">
                        <button 
                          className="btn-editar"
                          onClick={() => editarGasto(nomina, 'nomina')}
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-eliminar"
                          onClick={() => eliminarGasto(nomina.id, 'nomina')}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gastos Específicos */}
      {(tipoGasto === 'todos' || tipoGasto === 'especifico') && (
        <div className="seccion-gastos">
          <h2>📊 Gastos Específicos por Categoría</h2>
          <div className="categorias-grid">
            {datosGastos.gastosEspecificos.map(gasto => (
              <div key={gasto.id} className="categoria-card">
                <h4>{gasto.categoria}</h4>
                <p className="monto-categoria negative">{formatCurrency(gasto.cantidad)}</p>
                <span className="periodo">{getNombreMes(gasto.mes)} {gasto.anio}</span>
                <div className="acciones-categoria">
                  <button 
                    className="btn-editar"
                    onClick={() => editarGasto(gasto, 'especifico')}
                  >
                    ✏️
                  </button>
                  <button 
                    className="btn-eliminar"
                    onClick={() => eliminarGasto(gasto.id, 'especifico')}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Créditos y Distribuidoras */}
      {(tipoGasto === 'todos' || tipoGasto === 'credito') && (
        <div className="seccion-gastos">
          <h2>🏦 Créditos y Distribuidoras</h2>
          <div className="creditos-grid">
            {datosGastos.creditos.map(credito => (
              <div key={credito.id} className="credito-card">
                <div className="credito-header">
                  <h4>{credito.distribuidora}</h4>
                  <span className="badge badge-warning">{credito.tipo}</span>
                </div>
                <div className="credito-info">
                  <div className="info-item">
                    <span className="label">Próximo Pago:</span>
                    <span className="value">{formatCurrency(credito.pago)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Cartera Pendiente:</span>
                    <span className="value">{formatCurrency(credito.cartera)}</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Fecha Pago:</span>
                    <span className="value fecha">{credito.fechaPago}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen por Categorías */}
      <div className="seccion-gastos">
        <h2>📈 Resumen por Categorías</h2>
        <div className="resumen-categorias">
          {datosGastos.gastosEspecificos.map(gasto => (
            <div key={gasto.id} className="categoria-resumen">
              <div className="categoria-info">
                <span className="categoria-nombre">{gasto.categoria}</span>
                <span className="categoria-monto">{formatCurrency(gasto.cantidad)}</span>
              </div>
              <div className="categoria-bar">
                <div 
                  className="categoria-progreso"
                  style={{
                    width: `${(gasto.cantidad / 16050400) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GastosScreen;