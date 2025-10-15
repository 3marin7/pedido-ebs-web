import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './FacturaDetalle.css';

const FacturaDetalle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [factura, setFactura] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [abonos, setAbonos] = useState([]);
  const [nuevoAbono, setNuevoAbono] = useState({
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    metodo: 'Efectivo',
    nota: ''
  });
  const [editandoAbono, setEditandoAbono] = useState(null);
  const [mostrarFormAbono, setMostrarFormAbono] = useState(false);

  // Función para convertir números a letras
  const convertirNumeroALetras = (numero) => {
    const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (numero === 0) return 'CERO PESOS';
    if (numero > 999999999) return 'NÚMERO DEMASIADO GRANDE';

    let letras = '';

    // Convertir millones
    if (numero >= 1000000) {
      const millones = Math.floor(numero / 1000000);
      if (millones === 1) {
        letras += 'UN MILLÓN ';
      } else {
        letras += convertirGrupo(millones) + ' MILLONES ';
      }
      numero %= 1000000;
    }

    // Convertir miles
    if (numero >= 1000) {
      const miles = Math.floor(numero / 1000);
      if (miles === 1) {
        letras += 'MIL ';
      } else {
        letras += convertirGrupo(miles) + ' MIL ';
      }
      numero %= 1000;
    }

    // Convertir centenas, decenas y unidades
    if (numero > 0) {
      letras += convertirGrupo(numero);
    }

    return letras.trim() + ' PESOS';

    function convertirGrupo(n) {
      let grupo = '';
      const c = Math.floor(n / 100);
      const d = Math.floor((n % 100) / 10);
      const u = n % 10;

      // Centenas
      if (c > 0) {
        if (n === 100) {
          grupo += 'CIEN';
        } else {
          grupo += centenas[c] + ' ';
        }
      }

      // Decenas y unidades
      if (d > 0) {
        if (d === 1) {
          if (u === 0) {
            grupo += 'DIEZ';
          } else {
            grupo += especiales[u];
          }
          return grupo;
        } else if (d === 2 && u > 0) {
          grupo += 'VEINTI' + unidades[u].toLowerCase();
        } else {
          grupo += decenas[d];
          if (u > 0) {
            grupo += ' Y ' + unidades[u];
          }
        }
      } else if (u > 0) {
        grupo += unidades[u];
      }

      return grupo.trim();
    }
  };

  // Cargar factura y abonos desde Supabase
  useEffect(() => {
    const cargarFacturaYAbonos = async () => {
      try {
        setCargando(true);
        
        // Cargar factura
        const { data: facturaData, error: facturaError } = await supabase
          .from('facturas')
          .select('*')
          .eq('id', id)
          .single();
        
        if (facturaError) throw facturaError;
        setFactura(facturaData);
        
        // Cargar abonos
        const { data: abonosData, error: abonosError } = await supabase
          .from('abonos')
          .select('*')
          .eq('factura_id', id)
          .order('fecha', { ascending: false });
        
        if (abonosError) throw abonosError;
        setAbonos(abonosData || []);
        
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarFacturaYAbonos();
  }, [id]);

  const copiarDatos = () => {
    const datos = `
      Cuenta de Cobro #${factura.id}
      Cliente: ${factura.cliente}
      Fecha: ${new Date(factura.fecha).toLocaleDateString()}
      Total: $${factura.total.toFixed(2)}
      Total en letras: ${convertirNumeroALetras(Math.round(factura.total))}
      Saldo Pendiente: $${(factura.total - calcularTotalAbonado()).toFixed(2)}
      Productos: ${factura.productos.map(p => `\n  - ${p.nombre} (${p.cantidad} x $${p.precio.toFixed(2)})`).join('')}
      Abonos: ${abonos.length > 0 ? abonos.map(a => `\n  - $${a.monto.toFixed(2)} (${new Date(a.fecha).toLocaleDateString()})`).join('') : ' Ninguno'}
    `;
    navigator.clipboard.writeText(datos);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const imprimirFactura = () => {
    // Abrir ventana de impresión con el diseño específico para papel oficio horizontal
    const ventanaImpresion = window.open('', '_blank', 'width=1000,height=800');
    
    const contenidoImpresion = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cuenta de Cobro #${factura.id.toString().padStart(6, '0')}</title>
          <style>
            @page {
              size: letter landscape; /* Tamaño oficio en horizontal */
              margin: 0.5cm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              font-size: 10px;
              line-height: 1.2;
            }
            .pagina-oficio {
              width: 27.94cm; /* Ancho oficio en horizontal */
              height: 21.59cm; /* Alto oficio en horizontal */
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.5cm;
              page-break-after: always;
            }
            .seccion-cuenta {
              border: 1px solid #000;
              padding: 0.3cm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              height: 100%;
            }
            .titulo-seccion {
              text-align: center;
              font-weight: bold;
              margin-bottom: 0.2cm;
              border-bottom: 1px solid #000;
              padding-bottom: 0.1cm;
              font-size: 11px;
            }
            .encabezado {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.2cm;
              align-items: flex-start;
            }
            .numero-cuenta {
              font-weight: bold;
              font-size: 12px;
              margin-bottom: 0.2cm;
              text-align: center;
            }
            .fecha {
              font-size: 9px;
            }
            .info-cliente-vendedor {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 0.3cm;
              margin-bottom: 0.2cm;
            }
            .info-item h4 {
              margin: 0 0 0.05cm 0;
              font-size: 9px;
            }
            .info-item p {
              margin: 0;
              border-bottom: 1px solid #ddd;
              padding-bottom: 0.05cm;
              min-height: 0.4cm;
              font-size: 9px;
            }
            .tabla-productos {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0.2cm;
              table-layout: fixed;
              flex-grow: 1;
            }
            .tabla-productos th, .tabla-productos td {
              border: 1px solid #000;
              padding: 0.05cm;
              text-align: left;
              font-size: 8px;
              word-wrap: break-word;
            }
            .tabla-productos th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .tabla-productos .col-producto {
              width: 60%;
            }
            .tabla-productos .col-cantidad {
              width: 10%;
              text-align: center;
            }
            .tabla-productos .col-precio {
              width: 15%;
              text-align: right;
            }
            .tabla-productos .col-subtotal {
              width: 15%;
              text-align: right;
            }
            .total-letras {
              margin: 0.1cm 0;
              padding: 0.1cm;
              border: 1px solid #000;
              background-color: #f9f9f9;
              font-size: 9px;
              text-align: center;
              font-weight: bold;
            }
            .resumen-total {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 0.2cm;
              margin-top: 0.2cm;
              font-weight: bold;
              text-align: center;
              font-size: 9px;
            }
            .resumen-item {
              border: 1px solid #000;
              padding: 0.1cm;
              background-color: #f0f0f0;
            }
            .estado {
              text-align: center;
              margin-top: 0.1cm;
              font-weight: bold;
              font-size: 10px;
              padding: 0.1cm;
              border: 1px solid #000;
              background-color: ${estaPagada() ? '#d4edda' : '#fff3cd'};
              color: ${estaPagada() ? '#155724' : '#856404'};
            }
            .footer {
              text-align: center;
              margin-top: 0.2cm;
              font-size: 8px;
              border-top: 1px solid #000;
              padding-top: 0.1cm;
            }
            .logo {
              font-weight: bold;
              margin-top: 0.05cm;
              font-size: 9px;
            }
            .empresa-info {
              text-align: left;
            }
            .empresa-info strong {
              font-size: 11px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .pagina-oficio {
                height: 100%;
                width: 100%;
              }
              .seccion-cuenta {
                border: 1px solid #000;
              }
            }
          </style>
        </head>
        <body>
          <div class="pagina-oficio">
            <!-- ORIGINAL - PARA EL CLIENTE -->
            <div class="seccion-cuenta">
              <div class="titulo-seccion">ORIGINAL - PARA EL CLIENTE</div>
              <div class="encabezado">
                <div class="empresa-info">
                  <div><strong>DISTRIBUCIONES EBS</strong></div>
                  <div>Cuenta de Cobro</div>
                </div>
                <div class="fecha">${formatearFecha(factura.fecha)}</div>
              </div>
              
              <div class="numero-cuenta">CUENTA DE COBRO #${factura.id.toString().padStart(6, '0')}</div>
              
              <div class="info-cliente-vendedor">
                <div class="info-item">
                  <h4>CLIENTE:</h4>
                  <p>${factura.cliente}</p>
                  <h4>DIRECCIÓN:</h4>
                  <p>${factura.direccion || 'NO ESPECIFICADO'}</p>
                </div>
                <div class="info-item">
                  <h4>VENDEDOR:</h4>
                  <p>${factura.vendedor}</p>
                  <h4>TELÉFONO:</h4>
                  <p>${factura.telefono || 'NO ESPECIFICADO'}</p>
                </div>
              </div>
              
              <table class="tabla-productos">
                <thead>
                  <tr>
                    <th class="col-producto">PRODUCTO</th>
                    <th class="col-cantidad">CANT</th>
                    <th class="col-precio">PRECIO UNIT.</th>
                    <th class="col-subtotal">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${factura.productos.map(producto => `
                    <tr>
                      <td class="col-producto">${producto.nombre}</td>
                      <td class="col-cantidad">${producto.cantidad}</td>
                      <td class="col-precio">${formatearMonedaImpresion(producto.precio)}</td>
                      <td class="col-subtotal">${formatearMonedaImpresion(producto.cantidad * producto.precio)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total-letras">
                <strong>SON: ${convertirNumeroALetras(Math.round(factura.total))}</strong>
              </div>
              
              <div class="resumen-total">
                <div class="resumen-item">
                  <div>PRODUCTOS</div>
                  <div>${factura.productos.length}</div>
                </div>
                <div class="resumen-item">
                  <div>TOTAL</div>
                  <div>${formatearMonedaImpresion(factura.total)}</div>
                </div>
                <div class="resumen-item">
                  <div>ABONADO</div>
                  <div>${formatearMonedaImpresion(calcularTotalAbonado())}</div>
                </div>
                <div class="resumen-item">
                  <div>SALDO</div>
                  <div>${formatearMonedaImpresion(calcularSaldoPendiente())}</div>
                </div>
              </div>
              
              <div class="estado">ESTADO: ${estaPagada() ? 'PAGADA' : 'PENDIENTE'}</div>
              
              <div class="footer">
                <div>Gracias por su preferencia. Para cualquier aclaración, presentar esta cuenta de cobro.</div>
                <div class="logo">EBS - Sistema de Ebs-Hermanos Marin</div>
              </div>
            </div>
            
            <!-- COPIA - PARA EL ARCHIVO -->
            <div class="seccion-cuenta">
              <div class="titulo-seccion">COPIA - PARA EL ARCHIVO</div>
              <div class="encabezado">
                <div class="empresa-info">
                  <div><strong>DISTRIBUCIONES EBS</strong></div>
                  <div>Cuenta de Cobro</div>
                </div>
                <div class="fecha">${formatearFecha(factura.fecha)}</div>
              </div>
              
              <div class="numero-cuenta">CUENTA DE COBRO #${factura.id.toString().padStart(6, '0')}</div>
              
              <div class="info-cliente-vendedor">
                <div class="info-item">
                  <h4>CLIENTE:</h4>
                  <p>${factura.cliente}</p>
                  <h4>DIRECCIÓN:</h4>
                  <p>${factura.direccion || 'NO ESPECIFICADO'}</p>
                </div>
                <div class="info-item">
                  <h4>VENDEDOR:</h4>
                  <p>${factura.vendedor}</p>
                  <h4>TELÉFONO:</h4>
                  <p>${factura.telefono || 'NO ESPECIFICADO'}</p>
                </div>
              </div>
              
              <table class="tabla-productos">
                <thead>
                  <tr>
                    <th class="col-producto">PRODUCTO</th>
                    <th class="col-cantidad">CANT</th>
                    <th class="col-precio">PRECIO UNIT.</th>
                    <th class="col-subtotal">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  ${factura.productos.map(producto => `
                    <tr>
                      <td class="col-producto">${producto.nombre}</td>
                      <td class="col-cantidad">${producto.cantidad}</td>
                      <td class="col-precio">${formatearMonedaImpresion(producto.precio)}</td>
                      <td class="col-subtotal">${formatearMonedaImpresion(producto.cantidad * producto.precio)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="total-letras">
                <strong>SON: ${convertirNumeroALetras(Math.round(factura.total))}</strong>
              </div>
              
              <div class="resumen-total">
                <div class="resumen-item">
                  <div>PRODUCTOS</div>
                  <div>${factura.productos.length}</div>
                </div>
                <div class="resumen-item">
                  <div>TOTAL</div>
                  <div>${formatearMonedaImpresion(factura.total)}</div>
                </div>
                <div class="resumen-item">
                  <div>ABONADO</div>
                  <div>${formatearMonedaImpresion(calcularTotalAbonado())}</div>
                </div>
                <div class="resumen-item">
                  <div>SALDO</div>
                  <div>${formatearMonedaImpresion(calcularSaldoPendiente())}</div>
                </div>
              </div>
              
              <div class="estado">ESTADO: ${estaPagada() ? 'PAGADA' : 'PENDIENTE'}</div>
              
              <div class="footer">
                <div>Gracias por su preferencia. Para cualquier aclaración, presentar esta cuenta de cobro.</div>
                <div class="logo">EBS - Sistema de Ebs-Hermanos Marin</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    ventanaImpresion.document.write(contenidoImpresion);
    ventanaImpresion.document.close();
    
    // Esperar a que se cargue el contenido antes de imprimir
    ventanaImpresion.onload = function() {
      setTimeout(() => {
        ventanaImpresion.print();
        // Opcional: cerrar la ventana después de imprimir
        // ventanaImpresion.close();
      }, 500);
    };
  };

  const calcularTotalAbonado = () => {
    return abonos.reduce((total, abono) => total + abono.monto, 0);
  };

  const calcularSaldoPendiente = () => {
    return factura ? factura.total - calcularTotalAbonado() : 0;
  };

  const estaPagada = () => {
    return Math.abs(calcularSaldoPendiente()) < 0.01;
  };

  const handleInputAbonoChange = (e) => {
    const { name, value } = e.target;
    setNuevoAbono(prev => ({
      ...prev,
      [name]: name === 'monto' ? parseFloat(value) || 0 : value
    }));
  };

  const validarAbono = () => {
    if (nuevoAbono.monto <= 0) {
      alert('El monto debe ser positivo');
      return false;
    }
    
    if (nuevoAbono.monto > calcularSaldoPendiente()) {
      alert('El monto no puede ser mayor al saldo pendiente');
      return false;
    }
    
    return true;
  };

  const agregarAbono = async () => {
    if (!validarAbono()) return;

    try {
      setCargando(true);
      
      const abonoData = {
        factura_id: Number(id),
        monto: nuevoAbono.monto,
        fecha: nuevoAbono.fecha || new Date().toISOString().split('T')[0],
        metodo: nuevoAbono.metodo,
        nota: nuevoAbono.nota || null
      };

      const { data, error } = await supabase
        .from('abonos')
        .insert([abonoData])
        .select();
      
      if (error) throw error;

      // Actualizar estado local
      setAbonos([data[0], ...abonos]);
      
      // Resetear formulario
      setNuevoAbono({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Efectivo',
        nota: ''
      });
      setMostrarFormAbono(false);
      
    } catch (error) {
      console.error("Error agregando abono:", error);
      alert('Error al agregar el abono');
    } finally {
      setCargando(false);
    }
  };

  const editarAbono = async () => {
    if (!validarAbono()) return;

    try {
      setCargando(true);
      
      const abonoData = {
        monto: nuevoAbono.monto,
        fecha: nuevoAbono.fecha,
        metodo: nuevoAbono.metodo,
        nota: nuevoAbono.nota || null
      };

      const { data, error } = await supabase
        .from('abonos')
        .update(abonoData)
        .eq('id', editandoAbono.id)
        .select();
      
      if (error) throw error;

      // Actualizar estado local
      setAbonos(abonos.map(abono => 
        abono.id === editandoAbono.id ? data[0] : abono
      ));
      
      // Resetear formulario
      setEditandoAbono(null);
      setNuevoAbono({
        monto: '',
        fecha: new Date().toISOString().split('T')[0],
        metodo: 'Efectivo',
        nota: ''
      });
      setMostrarFormAbono(false);
      
    } catch (error) {
      console.error("Error editando abono:", error);
      alert('Error al editar el abono');
    } finally {
      setCargando(false);
    }
  };

  const eliminarAbono = async (idAbono) => {
    if (!window.confirm('¿Estás seguro de eliminar este abono?')) return;

    try {
      setCargando(true);
      
      const { error } = await supabase
        .from('abonos')
        .delete()
        .eq('id', idAbono);
      
      if (error) throw error;

      // Actualizar estado local
      setAbonos(abonos.filter(abono => abono.id !== idAbono));
      
    } catch (error) {
      console.error("Error eliminando abono:", error);
      alert('Error al eliminar el abono');
    } finally {
      setCargando(false);
    }
  };

  const iniciarEdicionAbono = (abono) => {
    setEditandoAbono(abono);
    setNuevoAbono({
      monto: abono.monto,
      fecha: abono.fecha,
      metodo: abono.metodo || 'Efectivo',
      nota: abono.nota || ''
    });
    setMostrarFormAbono(true);
  };

  const cancelarEdicion = () => {
    setEditandoAbono(null);
    setNuevoAbono({
      monto: '',
      fecha: new Date().toISOString().split('T')[0],
      metodo: 'Efectivo',
      nota: ''
    });
    setMostrarFormAbono(false);
  };

  const formatearMoneda = (monto) => {
    return new Intl.NumberFormat('es-CO', { 
      style: 'currency', 
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(monto);
  };

  const formatearMonedaImpresion = (monto) => {
    return `$ ${new Intl.NumberFormat('es-CO', { 
      minimumFractionDigits: 0
    }).format(monto)}`;
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const metodosPago = ['Efectivo', 'Transferencia', 'Tarjeta', 'Cheque', 'Otro'];

  if (cargando) {
    return (
      <div className="cargando-detalle">
        <div className="spinner"></div>
        <p>Cargando cuenta de cobro...</p>
      </div>
    );
  }

  if (!factura) {
    return (
      <div className="factura-no-encontrada">
        <h2>Cuenta de cobro no encontrada</h2>
        <button 
          className="button primary-button"
          onClick={() => navigate('/facturas')}
        >
          Volver al listado
        </button>
      </div>
    );
  }

  const totalAbonado = calcularTotalAbonado();
  const saldoPendiente = calcularSaldoPendiente();

  return (
    <div className="factura-detalle-container">
      <div className="factura-actions-bar">
        <button 
          className="button secondary-button"
          onClick={() => navigate('/facturas')}
        >
          &larr; Volver
        </button>
        
        <div className="action-buttons">
          <button 
            className="button icon-button"
            onClick={copiarDatos}
            title="Copiar datos"
          >
            {copiado ? '✓ Copiado' : '⎘ Copiar'}
          </button>
          <button 
            className="button icon-button"
            onClick={imprimirFactura}
            title="Imprimir"
          >
            ⎙ Imprimir
          </button>
        </div>
      </div>

      <div className="factura-header">
        <div className="header-info">
          <h1>Cuenta de Cobro #{factura.id.toString().padStart(6, '0')}</h1>
          <p className="fecha-emision">
            Emitida el {new Date(factura.fecha).toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="header-total">
          <span>Total Cuenta de Cobro</span>
          <h2>{formatearMoneda(factura.total)}</h2>
        </div>
      </div>

      {/* Mostrar total en letras en la vista normal también */}
      <div className="total-letras-container">
        <div className="total-letras">
          <strong>SON: {convertirNumeroALetras(Math.round(factura.total))}</strong>
        </div>
      </div>

      <div className="factura-info-grid">
        <div className="info-card cliente-info">
          <h3>Cliente</h3>
          <p>{factura.cliente}</p>
          {factura.telefono && <p>Tel: {factura.telefono}</p>}
          {factura.correo && <p>Email: {factura.correo}</p>}
        </div>
        
        <div className="info-card vendedor-info">
          <h3>Vendedor</h3>
          <p>{factura.vendedor}</p>
          {factura.direccion && (
            <div className="direccion-info">
              <h4>Dirección</h4>
              <p>{factura.direccion}</p>
            </div>
          )}
        </div>
      </div>

      <div className="productos-table-container">
        <h3>Productos</h3>
        <table className="productos-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio Unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {factura.productos.map((producto, index) => (
              <tr key={index}>
                <td>{producto.nombre}</td>
                <td>{producto.cantidad}</td>
                <td>{formatearMoneda(producto.precio)}</td>
                <td>{formatearMoneda(producto.cantidad * producto.precio)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="3" className="total-label">Total</td>
              <td className="total-value">{formatearMoneda(factura.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Sección de Abonos */}
      <div className="abonos-section">
        <div className="abonos-header">
          <h3>Abonos</h3>
          <div className="abonos-summary">
            <div className="summary-item">
              <span>Total Abonado:</span>
              <strong>{formatearMoneda(totalAbonado)}</strong>
            </div>
            <div className="summary-item">
              <span>Saldo Pendiente:</span>
              <strong className={saldoPendiente <= 0 ? 'pagado' : 'pendiente'}>
                {formatearMoneda(saldoPendiente)}
                {estaPagada() && <span className="badge-pagado">PAGADO</span>}
              </strong>
            </div>
          </div>
          {!mostrarFormAbono && (
            <button 
              className="button primary-button"
              onClick={() => setMostrarFormAbono(true)}
              disabled={estaPagada()}
            >
              + Agregar Abono
            </button>
          )}
        </div>

        {mostrarFormAbono && (
          <div className="abono-form">
            <h4>{editandoAbono ? 'Editar Abono' : 'Nuevo Abono'}</h4>
            <div className="form-group">
              <label>Monto:</label>
              <input
                type="number"
                name="monto"
                value={nuevoAbono.monto}
                onChange={handleInputAbonoChange}
                min="0.01"
                step="0.01"
                max={saldoPendiente}
              />
            </div>
            <div className="form-group">
              <label>Fecha:</label>
              <input
                type="date"
                name="fecha"
                value={nuevoAbono.fecha}
                onChange={handleInputAbonoChange}
              />
            </div>
            <div className="form-group">
              <label>Método de pago:</label>
              <select
                name="metodo"
                value={nuevoAbono.metodo}
                onChange={handleInputAbonoChange}
              >
                {metodosPago.map(metodo => (
                  <option key={metodo} value={metodo}>{metodo}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Nota (opcional):</label>
              <textarea
                name="nota"
                value={nuevoAbono.nota}
                onChange={handleInputAbonoChange}
                rows="2"
              />
            </div>
            <div className="form-actions">
              <button 
                className="button secondary-button"
                onClick={cancelarEdicion}
                disabled={cargando}
              >
                Cancelar
              </button>
              <button 
                className="button primary-button"
                onClick={editandoAbono ? editarAbono : agregarAbono}
                disabled={cargando}
              >
                {cargando ? 'Procesando...' : (editandoAbono ? 'Guardar Cambios' : 'Agregar Abono')}
              </button>
            </div>
          </div>
        )}

        {abonos.length > 0 ? (
          <div className="abonos-table-container">
            <table className="abonos-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Método</th>
                  <th>Nota</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {abonos.map((abono) => (
                  <tr key={abono.id}>
                    <td>{formatearFecha(abono.fecha)}</td>
                    <td>{formatearMoneda(abono.monto)}</td>
                    <td>{abono.metodo || 'Efectivo'}</td>
                    <td>{abono.nota || '-'}</td>
                    <td className="acciones-cell">
                      <button 
                        className="button icon-button small"
                        onClick={() => iniciarEdicionAbono(abono)}
                        title="Editar"
                        disabled={cargando}
                      >
                        ✏️
                      </button>
                      <button 
                        className="button icon-button small danger"
                        onClick={() => eliminarAbono(abono.id)}
                        title="Eliminar"
                        disabled={cargando}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="sin-abonos">
            <p>No se han registrado abonos para esta cuenta de cobro.</p>
          </div>
        )}
      </div>

      <div className="factura-footer">
        <p className="footer-nota">
          Gracias por su preferencia. Para cualquier aclaración, presentar esta cuenta de cobro.
        </p>
        <div className="footer-logo">
          <span>EBS</span>
          <small>Sistema de Ebs-Hermanos Marin</small>
        </div>
      </div>
    </div>
  );
};

export default FacturaDetalle;