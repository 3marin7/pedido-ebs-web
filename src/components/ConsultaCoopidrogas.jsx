import React, { useEffect, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import './ConsultaCoopidrogas.css';

const TABLA = 'catalogo_coopidrogas';
const MAX_RESULTADOS = 50;
const SCANNER_ELEMENT_ID = 'coop-scanner-reader';

const formatMoneda = (valor) =>
  valor != null
    ? new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(valor)
    : '—';

const formatFecha = (fecha) => {
  if (!fecha) return '—';
  const d = new Date(fecha + 'T00:00:00');
  return isNaN(d.getTime())
    ? fecha
    : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatPorcentaje = (valor) =>
  valor != null ? `${Number(valor).toFixed(2)} %` : '—';

/* ─── Componente principal ─────────────────────────────────────────────── */
const ConsultaCoopidrogas = () => {
  const [termino, setTermino] = useState('');
  const [modoEan, setModoEan] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);
  const [error, setError] = useState('');
  const [escaneando, setEscaneando] = useState(false);
  const [escaneoError, setEscaneoError] = useState('');
  const inputRef = useRef(null);
  const scannerRef = useRef(null);

  const detenerEscaneo = async () => {
    if (!scannerRef.current) {
      setEscaneando(false);
      return;
    }

    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (scannerError) {
      console.warn('[ConsultaCoopidrogas] Error cerrando escaner:', scannerError);
    } finally {
      scannerRef.current = null;
      setEscaneando(false);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        void detenerEscaneo();
      }
    };
  }, []);

  const limpiar = () => {
    setTermino('');
    setResultados([]);
    setBuscado(false);
    setError('');
    setEscaneoError('');
    inputRef.current?.focus();
  };

  const consultarProductos = async (valor) => {
    if (!valor) return;

    setCargando(true);
    setError('');
    setResultados([]);

    try {
      let query = supabase
        .from(TABLA)
        .select(
          'ean, material, denominacion, proveedor, grupo, sub_grupo, ' +
            'lote, und, cantidad, venta_real, venta_cte, impuesto, boni_pct, catalogo, fecha_creac'
        )
        .limit(MAX_RESULTADOS);

      if (modoEan) {
        query = query.eq('ean', valor);
      } else {
        query = query.ilike('denominacion', `%${valor}%`);
      }

      const { data, error: sbError } = await query;

      if (sbError) throw sbError;

      setResultados(data || []);
      setBuscado(true);
    } catch (err) {
      console.error('[ConsultaCoopidrogas] Error:', err);
      setError(
        err?.message?.includes('relation') || err?.message?.includes('does not exist')
          ? 'La tabla "catalogo_coopidrogas" no existe todavía. Primero importa los datos.'
          : `Error al consultar: ${err.message}`
      );
    } finally {
      setCargando(false);
    }
  };

  const buscar = async (e) => {
    e?.preventDefault();
    await consultarProductos(termino.trim());
  };

  const iniciarEscaneo = async () => {
    if (escaneando) return;

    setEscaneoError('');
    setError('');
    setModoEan(true);

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
      const cams = await Html5Qrcode.getCameras();
      const camaraTrasera = cams.find((cam) => /back|rear|environment|trasera/i.test(cam.label));
      const camaraElegida = camaraTrasera || cams[0];

      if (!camaraElegida) {
        throw new Error('No se detecto ninguna camara disponible.');
      }

      scannerRef.current = scanner;

      await scanner.start(
        { deviceId: { exact: camaraElegida.id } },
        {
          fps: 10,
          qrbox: { width: 280, height: 120 },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39
          ]
        },
        async (decodedText) => {
          const codigo = String(decodedText || '').trim();
          if (!codigo) return;

          setTermino(codigo);
          await detenerEscaneo();
          await consultarProductos(codigo);
        },
        () => {
          // Ignora errores intermitentes de deteccion para evitar ruido en UI.
        }
      );

      setEscaneando(true);
    } catch (scannerError) {
      console.error('[ConsultaCoopidrogas] Error iniciando escaner:', scannerError);
      setEscaneoError(`No se pudo iniciar la camara: ${scannerError?.message || 'Error desconocido'}`);
      await detenerEscaneo();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') buscar();
  };

  return (
    <div className="coop-container">
      {/* Encabezado */}
      <div className="coop-header">
        <h1 className="coop-title">
          🔍 Consulta Catálogo Coopidrogas
        </h1>
        <p className="coop-subtitle">
          Busca productos por <strong>nombre (denominación)</strong> o por{' '}
          <strong>código de barras (EAN)</strong>
        </p>
      </div>

      {/* Formulario de búsqueda */}
      <form className="coop-form" onSubmit={buscar}>
        {/* Selector de modo */}
        <div className="coop-modo-selector">
          <button
            type="button"
            className={`coop-modo-btn ${!modoEan ? 'activo' : ''}`}
            onClick={() => { setModoEan(false); limpiar(); }}
          >
            📝 Por Nombre
          </button>
          <button
            type="button"
            className={`coop-modo-btn ${modoEan ? 'activo' : ''}`}
            onClick={() => { setModoEan(true); limpiar(); }}
          >
            🔖 Por Código EAN
          </button>
        </div>

        {/* Input de búsqueda */}
        <div className="coop-input-row">
          <input
            ref={inputRef}
            type={modoEan ? 'text' : 'text'}
            inputMode={modoEan ? 'numeric' : 'text'}
            className="coop-input"
            placeholder={
              modoEan
                ? 'Escanea o escribe el código de barras…'
                : 'Escribe el nombre del producto…'
            }
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
          {termino && (
            <button type="button" className="coop-btn-limpiar" onClick={limpiar} aria-label="Limpiar">
              ✕
            </button>
          )}
          <button
            type="submit"
            className="coop-btn-buscar"
            disabled={cargando || !termino.trim()}
          >
            {cargando ? (
              <span className="coop-spinner" />
            ) : (
              'Buscar'
            )}
          </button>
          <button
            type="button"
            className="coop-btn-scan"
            onClick={escaneando ? detenerEscaneo : iniciarEscaneo}
          >
            {escaneando ? 'Detener camara' : 'Escanear'}
          </button>
        </div>

        {escaneoError && <div className="coop-escaneo-error">{escaneoError}</div>}

        {escaneando && (
          <div className="coop-scanner-box">
            <p className="coop-scanner-help">Apunta la camara al codigo de barras para buscar automaticamente.</p>
            <div id={SCANNER_ELEMENT_ID} className="coop-scanner-reader" />
          </div>
        )}
      </form>

      {/* Error */}
      {error && <div className="coop-error">❌ {error}</div>}

      {/* Sin resultados */}
      {buscado && !cargando && !error && resultados.length === 0 && (
        <div className="coop-sin-resultados">
          No se encontraron productos para <strong>"{termino}"</strong>.
        </div>
      )}

      {/* Tabla de resultados */}
      {resultados.length > 0 && (
        <div className="coop-tabla-wrapper">
          <p className="coop-conteo">
            {resultados.length === MAX_RESULTADOS
              ? `Mostrando los primeros ${MAX_RESULTADOS} resultados.`
              : `${resultados.length} producto${resultados.length !== 1 ? 's' : ''} encontrado${resultados.length !== 1 ? 's' : ''}.`}
          </p>
          <div className="coop-tabla-scroll">
            <table className="coop-tabla">
              <thead>
                <tr>
                  <th>EAN</th>
                  <th>Denominación</th>
                  <th>Proveedor</th>
                  <th>Grupo</th>
                  <th>Subgrupo</th>
                  <th>Material</th>
                  <th>Lote</th>
                  <th>UND</th>
                  <th>Cantidad</th>
                  <th>Venta Real</th>
                  <th>Venta Cte</th>
                  <th>Impuesto</th>
                  <th>% Boni</th>
                  <th>Catálogo</th>
                  <th>Fecha Creac.</th>
                </tr>
              </thead>
              <tbody>
                {resultados.map((p, i) => (
                  <tr key={p.ean ?? i} className={i % 2 === 0 ? 'par' : 'impar'}>
                    <td className="coop-ean">{p.ean ?? '—'}</td>
                    <td className="coop-denom">{p.denominacion ?? '—'}</td>
                    <td>{p.proveedor ?? '—'}</td>
                    <td>{p.grupo ?? '—'}</td>
                    <td>{p.sub_grupo ?? '—'}</td>
                    <td>{p.material ?? '—'}</td>
                    <td>{p.lote ?? '—'}</td>
                    <td>{p.und ?? '—'}</td>
                    <td className="coop-num">{p.cantidad ?? '—'}</td>
                    <td className="coop-precio">{formatMoneda(p.venta_real)}</td>
                    <td className="coop-precio">{formatMoneda(p.venta_cte)}</td>
                    <td className="coop-num">{formatPorcentaje(p.impuesto)}</td>
                    <td className="coop-num">{formatPorcentaje(p.boni_pct)}</td>
                    <td>{p.catalogo ?? '—'}</td>
                    <td>{formatFecha(p.fecha_creac)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultaCoopidrogas;
