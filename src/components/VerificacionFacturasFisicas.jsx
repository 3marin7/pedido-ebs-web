import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../App';
import { supabase } from './supabaseClient';
import * as XLSX from 'xlsx';
import { parseDateLocal, formatDateLocal, nowLocalIsoDate } from '../lib/dateUtils';
import './VerificacionFacturasFisicas.css';

const SALDO_EPSILON = 0.01;
const PAGE_SIZE = 1000;

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatMoneda = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(valor || 0);

// Supabase devuelve máximo 1000 filas por consulta: cargar por páginas
const cargarTodo = async (tabla, columnas, columnaOrden) => {
  let desde = 0;
  let filas = [];

  while (true) {
    const { data, error } = await supabase
      .from(tabla)
      .select(columnas)
      .order(columnaOrden, { ascending: true })
      .range(desde, desde + PAGE_SIZE - 1);

    if (error) throw error;

    const lote = data || [];
    filas = [...filas, ...lote];

    if (lote.length < PAGE_SIZE) break;
    desde += PAGE_SIZE;
  }

  return filas;
};

const VerificacionFacturasFisicas = () => {
  const { user } = useAuth();
  const [facturas, setFacturas] = useState([]);
  const [verificadas, setVerificadas] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [vendedor, setVendedor] = useState('');
  const [soloPendientes, setSoloPendientes] = useState(true);
  const [vista, setVista] = useState('faltantes');
  const [numero, setNumero] = useState('');
  const [mensaje, setMensaje] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const [facturasData, abonosData, verificacionesData] = await Promise.all([
          cargarTodo('facturas', 'id, fecha, cliente, vendedor, total', 'id'),
          cargarTodo('abonos', 'id, factura_id, monto', 'id'),
          cargarTodo('verificacion_facturas_fisicas', 'factura_id', 'factura_id')
        ]);

        const abonadoPorFactura = {};
        abonosData.forEach((abono) => {
          const key = String(abono.factura_id);
          abonadoPorFactura[key] = (abonadoPorFactura[key] || 0) + toNumber(abono.monto);
        });

        setFacturas(
          facturasData.map((f) => {
            const total = toNumber(f.total);
            const saldo = total - (abonadoPorFactura[String(f.id)] || 0);
            return { ...f, total, saldo: Math.abs(saldo) < SALDO_EPSILON ? 0 : saldo };
          })
        );
        setVerificadas(new Set(verificacionesData.map((v) => String(v.factura_id))));
      } catch (error) {
        console.error('Error cargando verificación de facturas:', error);
        setErrorCarga(
          'No se pudieron cargar los datos. Verifica que se haya ejecutado sql/VERIFICACION_FACTURAS_FISICAS_SETUP.sql en Supabase.'
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const vendedores = useMemo(
    () => [...new Set(facturas.map((f) => f.vendedor).filter(Boolean))].sort(),
    [facturas]
  );

  // Facturas que deberían estar en papel según los filtros
  const facturasAlcance = useMemo(
    () =>
      facturas
        .filter((f) => (vendedor ? f.vendedor === vendedor : true))
        .filter((f) => (soloPendientes ? f.saldo > SALDO_EPSILON : true))
        .sort((a, b) => (parseDateLocal(a.fecha) || new Date(0)) - (parseDateLocal(b.fecha) || new Date(0))),
    [facturas, vendedor, soloPendientes]
  );

  const resumen = useMemo(() => {
    const vacio = () => ({ cantidad: 0, valor: 0, saldo: 0 });
    const r = { sistema: vacio(), verificadas: vacio(), faltantes: vacio() };
    facturasAlcance.forEach((f) => {
      const grupo = verificadas.has(String(f.id)) ? r.verificadas : r.faltantes;
      [r.sistema, grupo].forEach((g) => {
        g.cantidad++;
        g.valor += f.total;
        g.saldo += f.saldo;
      });
    });
    return r;
  }, [facturasAlcance, verificadas]);

  const facturasVista = useMemo(() => {
    if (vista === 'faltantes') return facturasAlcance.filter((f) => !verificadas.has(String(f.id)));
    if (vista === 'verificadas') return facturasAlcance.filter((f) => verificadas.has(String(f.id)));
    return facturasAlcance;
  }, [facturasAlcance, verificadas, vista]);

  const marcar = async (facturaId) => {
    const key = String(facturaId);
    setVerificadas((prev) => new Set(prev).add(key));

    const { error } = await supabase
      .from('verificacion_facturas_fisicas')
      .insert([{ factura_id: facturaId, verificada_por: user?.username || null }]);

    // 23505 = ya estaba marcada (otra persona la marcó al mismo tiempo)
    if (error && error.code !== '23505') {
      console.error('Error marcando factura:', error);
      setVerificadas((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      setMensaje({ tipo: 'error', texto: `No se pudo guardar la factura #${facturaId}: ${error.message}` });
      return false;
    }
    return true;
  };

  const desmarcar = async (facturaId) => {
    const key = String(facturaId);
    setVerificadas((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    const { error } = await supabase
      .from('verificacion_facturas_fisicas')
      .delete()
      .eq('factura_id', facturaId);

    if (error) {
      console.error('Error desmarcando factura:', error);
      setVerificadas((prev) => new Set(prev).add(key));
      setMensaje({ tipo: 'error', texto: `No se pudo desmarcar la factura #${facturaId}: ${error.message}` });
    }
  };

  const toggle = (factura) => {
    if (verificadas.has(String(factura.id))) {
      desmarcar(factura.id);
    } else {
      marcar(factura.id);
    }
  };

  // Registro rápido: digitar el número de la factura física y presionar Enter
  const registrarNumero = async (e) => {
    e.preventDefault();
    const valor = numero.trim().replace(/^#/, '');
    if (!valor) return;

    setNumero('');
    inputRef.current?.focus();

    const factura = facturas.find((f) => String(f.id) === valor);

    if (!factura) {
      setMensaje({ tipo: 'error', texto: `❌ La factura #${valor} NO existe en el sistema.` });
      return;
    }

    const detalle = `${factura.cliente} · ${factura.vendedor || 'Sin vendedor'} · Saldo ${formatMoneda(factura.saldo)}`;

    if (verificadas.has(String(factura.id))) {
      setMensaje({ tipo: 'aviso', texto: `⚠️ La factura #${valor} ya estaba verificada. ${detalle}` });
      return;
    }

    if (factura.saldo <= SALDO_EPSILON) {
      setMensaje({
        tipo: 'aviso',
        texto: `⚠️ La factura #${valor} figura como PAGADA en el sistema, pero tienes la física. ${detalle}`
      });
    }

    const guardada = await marcar(factura.id);
    if (guardada && factura.saldo > SALDO_EPSILON) {
      const fueraDeFiltro = vendedor && factura.vendedor !== vendedor;
      setMensaje({
        tipo: fueraDeFiltro ? 'aviso' : 'ok',
        texto: fueraDeFiltro
          ? `⚠️ #${valor} verificada, pero es de otro vendedor. ${detalle}`
          : `✅ #${valor} verificada. ${detalle}`
      });
    }
  };

  const exportarFaltantes = () => {
    const faltantes = facturasAlcance.filter((f) => !verificadas.has(String(f.id)));
    const filas = faltantes.map((f) => ({
      'N° Factura': f.id,
      Fecha: formatDateLocal(f.fecha),
      Cliente: f.cliente,
      Vendedor: f.vendedor,
      Total: f.total,
      Saldo: f.saldo
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filas), 'Faltantes');
    const sufijo = vendedor ? `_${vendedor.replace(/\s+/g, '_')}` : '';
    XLSX.writeFile(wb, `facturas_faltantes${sufijo}_${nowLocalIsoDate()}.xlsx`);
  };

  const reiniciar = async () => {
    const ids = facturasAlcance.filter((f) => verificadas.has(String(f.id))).map((f) => f.id);
    if (ids.length === 0) return;

    const confirmar = window.confirm(
      `¿Borrar las ${ids.length} marcas de verificación${vendedor ? ` de ${vendedor}` : ''}?\n\nUsa esto solo para empezar un inventario nuevo.`
    );
    if (!confirmar) return;

    for (let i = 0; i < ids.length; i += 200) {
      const { error } = await supabase
        .from('verificacion_facturas_fisicas')
        .delete()
        .in('factura_id', ids.slice(i, i + 200));

      if (error) {
        console.error('Error reiniciando verificación:', error);
        setMensaje({ tipo: 'error', texto: `No se pudo reiniciar: ${error.message}` });
        return;
      }

      setVerificadas((prev) => {
        const next = new Set(prev);
        ids.slice(i, i + 200).forEach((id) => next.delete(String(id)));
        return next;
      });
    }

    setMensaje({ tipo: 'ok', texto: 'Verificación reiniciada.' });
  };

  if (cargando) {
    return <div className="vff-container"><p className="vff-cargando">Cargando facturas...</p></div>;
  }

  if (errorCarga) {
    return <div className="vff-container"><p className="vff-mensaje error">{errorCarga}</p></div>;
  }

  const progreso = resumen.sistema.cantidad > 0
    ? Math.round((resumen.verificadas.cantidad / resumen.sistema.cantidad) * 100)
    : 0;

  return (
    <div className="vff-container">
      <h2>📋 Verificación de Facturas Físicas</h2>
      <p className="vff-ayuda">
        Digita el número de cada factura en papel y presiona Enter. Las que queden en "Faltantes" son las que no tienes
        físicamente: revísalas con el vendedor.
      </p>

      <div className="vff-filtros">
        <label>
          Vendedor
          <select value={vendedor} onChange={(e) => setVendedor(e.target.value)}>
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="vff-check">
          <input type="checkbox" checked={soloPendientes} onChange={(e) => setSoloPendientes(e.target.checked)} />
          Solo facturas con saldo pendiente
        </label>
      </div>

      <form className="vff-registro" onSubmit={registrarNumero}>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          placeholder="N° de factura física y Enter"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          autoFocus
        />
        <button type="submit">Verificar</button>
      </form>

      {mensaje && <div className={`vff-mensaje ${mensaje.tipo}`}>{mensaje.texto}</div>}

      <div className="vff-resumen">
        {[
          ['', 'En sistema', resumen.sistema],
          ['ok', 'Verificadas', resumen.verificadas],
          ['faltan', 'Faltantes', resumen.faltantes]
        ].map(([clase, titulo, datos]) => (
          <div key={titulo} className={clase}>
            <span>{titulo}</span>
            <strong>{datos.cantidad} facturas</strong>
            <dl>
              <dt>Valor total</dt>
              <dd>{formatMoneda(datos.valor)}</dd>
              <dt>Saldo</dt>
              <dd>{formatMoneda(datos.saldo)}</dd>
            </dl>
          </div>
        ))}
      </div>

      <div className="vff-progreso">
        <div style={{ width: `${progreso}%` }} />
        <span>{progreso}% verificado</span>
      </div>

      <div className="vff-acciones">
        <div className="vff-tabs">
          {[
            ['faltantes', `Faltantes (${resumen.faltantes.cantidad})`],
            ['verificadas', `Verificadas (${resumen.verificadas.cantidad})`],
            ['todas', `Todas (${resumen.sistema.cantidad})`]
          ].map(([valor, etiqueta]) => (
            <button
              key={valor}
              type="button"
              className={vista === valor ? 'activa' : ''}
              onClick={() => setVista(valor)}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        <div>
          <button type="button" onClick={exportarFaltantes} disabled={resumen.faltantes.cantidad === 0}>
            📥 Exportar faltantes
          </button>
          <button type="button" className="peligro" onClick={reiniciar} disabled={resumen.verificadas.cantidad === 0}>
            Reiniciar
          </button>
        </div>
      </div>

      <div className="vff-tabla-wrap">
        <table className="vff-tabla">
          <thead>
            <tr>
              <th>✔</th>
              <th>N°</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Vendedor</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {facturasVista.map((f) => {
              const ok = verificadas.has(String(f.id));
              return (
                <tr key={f.id} className={ok ? 'verificada' : ''} onClick={() => toggle(f)}>
                  <td><input type="checkbox" checked={ok} readOnly /></td>
                  <td>#{f.id}</td>
                  <td>{formatDateLocal(f.fecha)}</td>
                  <td>{f.cliente}</td>
                  <td>{f.vendedor}</td>
                  <td className="vff-num">{formatMoneda(f.saldo)}</td>
                </tr>
              );
            })}
            {facturasVista.length === 0 && (
              <tr>
                <td colSpan={6} className="vff-vacio">
                  {vista === 'faltantes' ? '🎉 No hay facturas faltantes' : 'No hay facturas en esta vista'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default VerificacionFacturasFisicas;
