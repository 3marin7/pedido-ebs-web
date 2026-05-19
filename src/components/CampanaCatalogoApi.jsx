import React, { useEffect, useMemo, useState } from 'react';
import './CampanaCatalogo.css';

const STORAGE_KEY = 'campana_catalogo_api_base_url';
const PUBLIC_URL_STORAGE_KEY = 'campana_catalogo_api_public_url';
const PAGE_FALLBACK_LABEL = 'API propia';

const DEFAULT_REGLAS = {
  maxSaldoPendiente: 250000,
  maxFacturasPendientes: 2,
  maxDiasAtraso: 30,
  minClasificacion: 3,
  diasReenvio: 20
};

const ENDPOINTS = {
  dashboard: '/campanas/catalogo/dashboard',
  clientes: '/clientes',
  facturas: '/facturas',
  abonos: '/abonos',
  historial: '/campanas/catalogo/historial',
  publicUrl: '/config/public-url',
  enviarWhatsApp: '/campanas/catalogo/enviar-whatsapp'
};

const normalizarBaseUrl = (url) => String(url || '').trim().replace(/\/$/, '');

const construirUrlApi = (baseUrl, endpoint) => {
  const base = normalizarBaseUrl(baseUrl);
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  if (!base) {
    return path;
  }

  return `${base}${path}`;
};

const esOrigenLocal = (url) => {
  const normalized = normalizarBaseUrl(url);

  if (!normalized) {
    return true;
  }

  if (normalized.startsWith('/')) {
    return false;
  }

  try {
    const parsed = new URL(normalized, window.location.origin);
    return ['localhost', '127.0.0.1', '0.0.0.0'].includes(parsed.hostname);
  } catch (error) {
    return true;
  }
};

const fetchJSON = async (url, options) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al consultar ${url}`);
  }

  return response.json();
};

const extraerLista = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  return [];
};

const parseFecha = (fecha) => {
  const parsed = fecha ? new Date(fecha) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
};

const calcularDiasDesde = (fecha) => {
  const parsed = parseFecha(fecha);

  if (!parsed) {
    return 0;
  }

  return Math.max(0, Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24)));
};

const formatearMoneda = (valor) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(valor || 0);

const formatearFecha = (fecha) => {
  const parsed = parseFecha(fecha);

  if (!parsed) {
    return 'Sin registro';
  }

  return parsed.toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const normalizarTelefonoWhatsApp = (telefono) => {
  const digits = String(telefono || '').replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  if (digits.length === 10 && digits.startsWith('3')) {
    return `57${digits}`;
  }

  if (digits.length === 12 && digits.startsWith('57')) {
    return digits;
  }

  if (digits.length === 13 && digits.startsWith('573')) {
    return digits;
  }

  return digits.length >= 10 ? digits : '';
};

const obtenerHistorial = () => {
  try {
    const stored = localStorage.getItem(PUBLIC_URL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Error leyendo URL pública guardada:', error);
    return {};
  }
};

const guardarHistorialUrl = (url) => {
  if (url) {
    localStorage.setItem(PUBLIC_URL_STORAGE_KEY, url);
  } else {
    localStorage.removeItem(PUBLIC_URL_STORAGE_KEY);
  }
};

const obtenerBaseUrlInicial = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored || '/api';
};

const normalizarCliente = (cliente) => ({
  ...cliente,
  id: cliente.id ?? cliente.cliente_id ?? cliente.uuid,
  nombre: cliente.nombre || cliente.razon_social || cliente.empresa || 'Sin nombre',
  telefono: cliente.telefono || cliente.celular || cliente.whatsapp || '',
  clasificacion: Number(cliente.clasificacion || cliente.rating || cliente.estrellas || 0),
  vendedor: cliente.vendedor || cliente.vendedor_nombre || '',
  centroComercial: cliente.centro_comercial || cliente.centroComercial || ''
});

const normalizarFactura = (factura) => ({
  ...factura,
  id: factura.id ?? factura.factura_id,
  cliente_id: factura.cliente_id ?? factura.id_cliente ?? factura.clienteId,
  cliente: factura.cliente || factura.nombre_cliente || factura.razon_social || factura.nombre || '',
  total: Number(factura.total || factura.valor_total || factura.monto_total || 0),
  fecha: factura.fecha || factura.created_at || factura.fecha_factura || ''
});

const normalizarAbono = (abono) => ({
  ...abono,
  factura_id: abono.factura_id ?? abono.id_factura ?? abono.facturaId,
  monto: Number(abono.monto || abono.valor || abono.total || 0)
});

const calcularCampana = ({ clientes, facturas, abonos, historialEnvios, reglas, soloConTelefono }) => {
  const abonosPorFactura = abonos.reduce((accumulator, abono) => {
    const facturaId = abono.factura_id;

    if (!facturaId) {
      return accumulator;
    }

    accumulator[facturaId] = (accumulator[facturaId] || 0) + (Number(abono.monto) || 0);
    return accumulator;
  }, {});

  const campaignRows = clientes.map((cliente) => {
    const facturasCliente = facturas.filter((factura) => {
      const coincideId = factura.cliente_id && String(factura.cliente_id) === String(cliente.id);
      const coincideNombre =
        String(factura.cliente || '').trim().toLowerCase() === String(cliente.nombre || '').trim().toLowerCase();

      return coincideId || coincideNombre;
    });

    const facturasPendientes = facturasCliente
      .map((factura) => {
        const total = Number(factura.total) || 0;
        const totalAbonado = abonosPorFactura[factura.id] || 0;
        const saldo = total - totalAbonado;
        const saldoPendiente = Math.abs(saldo) < 0.01 ? 0 : saldo;

        return {
          id: factura.id,
          fecha: factura.fecha,
          total,
          saldo: saldoPendiente,
          diasAtraso: calcularDiasDesde(factura.fecha)
        };
      })
      .filter((factura) => factura.saldo > 0.01);

    const totalSaldoPendiente = facturasPendientes.reduce((sum, factura) => sum + factura.saldo, 0);
    const maxDiasAtraso = facturasPendientes.length
      ? Math.max(...facturasPendientes.map((factura) => factura.diasAtraso))
      : 0;
    const telefonoWhatsApp = normalizarTelefonoWhatsApp(cliente.telefono);
    const historial = historialEnvios[cliente.id] || historialEnvios[cliente.nombre] || null;
    const diasDesdeUltimoEnvio = historial?.fecha ? calcularDiasDesde(historial.fecha) : null;
    const clasificacion = Number(cliente.clasificacion) || 0;
    const razonesBloqueo = [];

    if (!telefonoWhatsApp) {
      razonesBloqueo.push('Sin teléfono válido para WhatsApp');
    }

    if (clasificacion < reglas.minClasificacion) {
      razonesBloqueo.push(`Clasificación menor a ${reglas.minClasificacion} estrellas`);
    }

    if (totalSaldoPendiente > reglas.maxSaldoPendiente) {
      razonesBloqueo.push(`Saldo pendiente superior a ${formatearMoneda(reglas.maxSaldoPendiente)}`);
    }

    if (facturasPendientes.length > reglas.maxFacturasPendientes) {
      razonesBloqueo.push(`Más de ${reglas.maxFacturasPendientes} facturas pendientes`);
    }

    if (maxDiasAtraso > reglas.maxDiasAtraso) {
      razonesBloqueo.push(`Factura más atrasada supera ${reglas.maxDiasAtraso} días`);
    }

    if (diasDesdeUltimoEnvio !== null && diasDesdeUltimoEnvio < reglas.diasReenvio) {
      razonesBloqueo.push(`Se le envió catálogo hace ${diasDesdeUltimoEnvio} días`);
    }

    const puntaje =
      clasificacion * 25 +
      Math.max(0, 25 - facturasPendientes.length * 8) +
      Math.max(0, 25 - Math.round(totalSaldoPendiente / 10000)) +
      Math.max(0, 25 - maxDiasAtraso);

    return {
      ...cliente,
      telefonoWhatsApp,
      clasificacion,
      totalSaldoPendiente,
      facturasPendientes,
      cantidadFacturasPendientes: facturasPendientes.length,
      maxDiasAtraso,
      ultimaFechaEnvio: historial?.fecha || null,
      ultimoCanalEnvio: historial?.canal || null,
      diasDesdeUltimoEnvio,
      apto: razonesBloqueo.length === 0,
      razonesBloqueo,
      puntajeCampana: puntaje
    };
  });

  const aptos = campaignRows
    .filter((cliente) => (soloConTelefono ? !!cliente.telefonoWhatsApp : true))
    .filter((cliente) => cliente.apto)
    .sort((left, right) => right.puntajeCampana - left.puntajeCampana);

  const noAptos = campaignRows
    .filter((cliente) => cliente.razonesBloqueo.length > 0)
    .sort((left, right) => right.totalSaldoPendiente - left.totalSaldoPendiente);

  const enviadosRecientes = campaignRows.filter(
    (cliente) => cliente.diasDesdeUltimoEnvio !== null && cliente.diasDesdeUltimoEnvio < reglas.diasReenvio
  ).length;

  return {
    aptos,
    noAptos,
    totalClientes: campaignRows.length,
    enviadosRecientes,
    ultimaActualizacion: new Date().toISOString()
  };
};

const CampanaCatalogoApi = () => {
  const [apiBaseUrlInput, setApiBaseUrlInput] = useState(obtenerBaseUrlInicial);
  const [apiBaseUrl, setApiBaseUrl] = useState(obtenerBaseUrlInicial);
  const [publicUrlInput, setPublicUrlInput] = useState(localStorage.getItem(PUBLIC_URL_STORAGE_KEY) || '');
  const [publicUrl, setPublicUrl] = useState(localStorage.getItem(PUBLIC_URL_STORAGE_KEY) || '');
  const [clientes, setClientes] = useState([]);
  const [facturas, setFacturas] = useState([]);
  const [abonos, setAbonos] = useState([]);
  const [historialEnvios, setHistorialEnvios] = useState({});
  const [reglas, setReglas] = useState(DEFAULT_REGLAS);
  const [backendResumen, setBackendResumen] = useState(null);
  const [fuenteDatos, setFuenteDatos] = useState(PAGE_FALLBACK_LABEL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mensajeAccion, setMensajeAccion] = useState('');
  const [modoDemo, setModoDemo] = useState(false);
  const [soloConTelefono, setSoloConTelefono] = useState(true);
  const [mostrarNoAptos, setMostrarNoAptos] = useState(false);
  const [buscar, setBuscar] = useState('');
  const [orden, setOrden] = useState('score');

  const apiDisponible = useMemo(
    () => Boolean(apiBaseUrl) && (String(apiBaseUrl).startsWith('/') || !esOrigenLocal(apiBaseUrl)),
    [apiBaseUrl]
  );

  useEffect(() => {
    const cargarHistorial = async () => {
      try {
        const raw = localStorage.getItem('campana_catalogo_historial_envios');
        setHistorialEnvios(raw ? JSON.parse(raw) : {});
      } catch (storageError) {
        console.error('No se pudo leer el historial local:', storageError);
        setHistorialEnvios({});
      }
    };

    cargarHistorial();
  }, []);

  useEffect(() => {
    guardarHistorialUrl(publicUrl);
  }, [publicUrl]);

  useEffect(() => {
    const cargarDatos = async () => {
      setLoading(true);
      setError('');

      try {
        const base = normalizarBaseUrl(apiBaseUrl);

        // Primero intentamos una respuesta consolidada.
        const dashboardData = await fetchJSON(construirUrlApi(base, ENDPOINTS.dashboard));

        const clientesApi = extraerLista(dashboardData?.clientes || dashboardData?.data?.clientes);
        const facturasApi = extraerLista(dashboardData?.facturas || dashboardData?.data?.facturas);
        const abonosApi = extraerLista(dashboardData?.abonos || dashboardData?.data?.abonos);
        const historialApi = dashboardData?.historial || dashboardData?.envios || dashboardData?.data?.historial || [];

        const reglasApi = dashboardData?.reglas || dashboardData?.rules || null;

        if (clientesApi.length && facturasApi.length && abonosApi.length) {
          setClientes(clientesApi.map(normalizarCliente));
          setFacturas(facturasApi.map(normalizarFactura));
          setAbonos(abonosApi.map(normalizarAbono));
          setHistorialEnvios(
            Array.isArray(historialApi)
              ? historialApi.reduce((acc, item) => {
                  const id = item.clienteId || item.cliente_id || item.id_cliente || item.cliente || item.nombre;
                  if (!id) return acc;
                  acc[id] = {
                    fecha: item.fecha || item.created_at || new Date().toISOString(),
                    canal: item.canal || item.medium || 'api'
                  };
                  return acc;
                }, {})
              : {}
          );
          setPublicUrl(dashboardData?.publicUrl || dashboardData?.config?.publicUrl || publicUrl);
          setBackendResumen(dashboardData?.resumen || dashboardData?.summary || null);
          setFuenteDatos('dashboard consolidado');
          setModoDemo(false);
          if (reglasApi) {
            setReglas((prev) => ({ ...prev, ...reglasApi }));
          }
          return;
        }

        // Si no hay consolidado útil, pedimos las tablas separadas.
        const [clientesRaw, facturasRaw, abonosRaw, historialRaw, publicUrlRaw] = await Promise.all([
          fetchJSON(construirUrlApi(base, ENDPOINTS.clientes)),
          fetchJSON(construirUrlApi(base, ENDPOINTS.facturas)),
          fetchJSON(construirUrlApi(base, ENDPOINTS.abonos)),
          fetchJSON(construirUrlApi(base, ENDPOINTS.historial)).catch(() => []),
          fetchJSON(construirUrlApi(base, ENDPOINTS.publicUrl)).catch(() => ({ url: '' }))
        ]);

        const clientesNorm = extraerLista(clientesRaw).map(normalizarCliente);
        const facturasNorm = extraerLista(facturasRaw).map(normalizarFactura);
        const abonosNorm = extraerLista(abonosRaw).map(normalizarAbono);

        setClientes(clientesNorm);
        setFacturas(facturasNorm);
        setAbonos(abonosNorm);
        setHistorialEnvios(
          Array.isArray(historialRaw)
            ? historialRaw.reduce((acc, item) => {
                const id = item.clienteId || item.cliente_id || item.id_cliente || item.cliente || item.nombre;
                if (!id) return acc;
                acc[id] = {
                  fecha: item.fecha || item.created_at || new Date().toISOString(),
                  canal: item.canal || item.medium || 'api'
                };
                return acc;
              }, {})
            : {}
        );
        setPublicUrl(publicUrlRaw?.url || publicUrlRaw?.publicUrl || '');
        setBackendResumen(null);
        setFuenteDatos('tablas separadas');
        setModoDemo(false);
      } catch (fetchError) {
        console.warn('No se pudo consultar la API propia:', fetchError);
        setClientes([]);
        setFacturas([]);
        setAbonos([]);
        setHistorialEnvios({});
        setBackendResumen(null);
        setFuenteDatos(PAGE_FALLBACK_LABEL);
        setModoDemo(true);
        setError('La API todavía no devuelve datos confiables. Puedes usar esta vista para comparar el diseño y luego conectar el backend real.');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [apiBaseUrl]);

  const resumenCalculado = useMemo(
    () =>
      calcularCampana({
        clientes,
        facturas,
        abonos,
        historialEnvios,
        reglas,
        soloConTelefono
      }),
    [abonos, clientes, facturas, historialEnvios, reglas, soloConTelefono]
  );

  const datosFiltrados = useMemo(() => {
    const texto = buscar.trim().toLowerCase();

    let base = mostrarNoAptos ? resumenCalculado.noAptos : resumenCalculado.aptos;

    if (texto) {
      base = base.filter((cliente) => {
        const candidato = [cliente.nombre, cliente.telefono, cliente.vendedor, cliente.centroComercial]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return candidato.includes(texto);
      });
    }

    if (orden === 'saldo') {
      base = [...base].sort((left, right) => right.totalSaldoPendiente - left.totalSaldoPendiente);
    } else if (orden === 'score') {
      base = [...base].sort((left, right) => right.puntajeCampana - left.puntajeCampana);
    } else if (orden === 'reciente') {
      base = [...base].sort((left, right) => (right.diasDesdeUltimoEnvio || 9999) - (left.diasDesdeUltimoEnvio || 9999));
    }

    return base;
  }, [buscar, mostrarNoAptos, orden, resumenCalculado.aptos, resumenCalculado.noAptos]);

  const guardarApiBaseUrl = () => {
    const normalized = normalizarBaseUrl(apiBaseUrlInput);

    if (!normalized) {
      setMensajeAccion('Debes ingresar la URL base de la API.');
      return;
    }

    if (esOrigenLocal(normalized) && !normalized.startsWith('/')) {
      setMensajeAccion('La API base no puede ser localhost para esta vista.');
      return;
    }

    setApiBaseUrl(normalized);
    localStorage.setItem(STORAGE_KEY, normalized);
    setMensajeAccion(`API base guardada: ${normalized}`);
  };

  const guardarUrlPublica = () => {
    const normalized = normalizarBaseUrl(publicUrlInput);

    if (!normalized) {
      setPublicUrl('');
      setMensajeAccion('Debes ingresar la URL pública real de la plataforma.');
      return;
    }

    if (esOrigenLocal(normalized)) {
      setMensajeAccion('La URL pública no puede ser localhost. Usa la dirección real de tu plataforma desplegada.');
      return;
    }

    try {
      const parsed = new URL(normalized);
      setPublicUrl(parsed.origin);
      setPublicUrlInput(parsed.origin);
      setMensajeAccion(`URL pública guardada: ${parsed.origin}`);
    } catch (error) {
      setMensajeAccion('La URL pública no es válida. Ejemplo: https://tu-dominio.com');
    }
  };

  const copiarLink = async (cliente = null) => {
    if (!publicUrl) {
      setMensajeAccion('Configura primero la URL pública real de la plataforma antes de copiar o compartir el link.');
      return;
    }

    try {
      await navigator.clipboard.writeText(publicUrl);
      if (cliente) {
        setMensajeAccion(`Link copiado para ${cliente.nombre}.`);
      } else {
        setMensajeAccion('Link general del catálogo copiado.');
      }
    } catch (copyError) {
      console.error('Error copiando link:', copyError);
      setMensajeAccion('No se pudo copiar el link automáticamente.');
    }
  };

  const refrescar = () => {
    setApiBaseUrl((current) => current);
    setMensajeAccion('Refrescando datos de la vista API...');
  };

  const enviarPorWhatsApp = async (cliente) => {
    if (!cliente.telefonoWhatsApp) {
      setMensajeAccion(`El cliente ${cliente.nombre} no tiene un teléfono válido.`);
      return;
    }

    if (!publicUrl) {
      setMensajeAccion('No hay URL pública configurada para compartir.');
      return;
    }

    const mensajePlano = [
      `Hola ${cliente.nombre},`,
      'Te comparto nuestro catálogo digital para que revises productos y puedas hacer tu pedido fácilmente.',
      '',
      publicUrl
    ].join('\n');

    try {
      const response = await fetch(construirUrlApi(apiBaseUrl, ENDPOINTS.enviarWhatsApp), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteId: cliente.id,
          telefono: cliente.telefonoWhatsApp,
          publicUrl,
          mensaje: mensajePlano,
          canal: 'whatsapp'
        })
      });

      if (!response.ok) {
        throw new Error('Respuesta no válida.');
      }

      const data = await response.json();

      if (data?.whatsappUrl) {
        window.open(data.whatsappUrl, '_blank', 'noopener,noreferrer');
      } else {
        window.open(
          `https://wa.me/${cliente.telefonoWhatsApp}?text=${encodeURIComponent(mensajePlano)}`,
          '_blank',
          'noopener,noreferrer'
        );
      }

      setMensajeAccion(`Se generó el envío para ${cliente.nombre}.`);
    } catch (sendError) {
      window.open(
        `https://wa.me/${cliente.telefonoWhatsApp}?text=${encodeURIComponent(mensajePlano)}`,
        '_blank',
        'noopener,noreferrer'
      );
      setMensajeAccion(`No había backend disponible, así que se abrió WhatsApp en modo de respaldo para ${cliente.nombre}.`);
      console.warn('Fallback WhatsApp:', sendError);
    }
  };

  return (
    <div className="campana-catalogo-page">
      <div className="campana-catalogo-shell">
        <header className="campana-hero">
          <div>
            <span className="campana-eyebrow">Campaña Catálogo API</span>
            <h1>Vista alternativa con cálculo local desde API</h1>
            <p>
              Esta versión usa datos de tu API, pero aplica la misma lógica de negocio que la vista anterior para que
              los resultados sean comparables y más confiables.
            </p>
          </div>
          <div className="campana-hero-actions">
            <button className="campaign-btn campaign-btn-secondary" onClick={refrescar} disabled={loading}>
              {loading ? 'Cargando...' : 'Refrescar'}
            </button>
            <button className="campaign-btn campaign-btn-secondary" onClick={() => copiarLink()}>
              Copiar link general
            </button>
            <a className="campaign-btn campaign-btn-primary" href={publicUrl || '#'} target="_blank" rel="noreferrer">
              Ver catálogo público
            </a>
          </div>
        </header>

        <section className="criterios-panel url-config-panel">
          <div className="panel-header">
            <h2>Conexión con la API</h2>
            <p>
              La recomendación es usar una API que entregue clientes, facturas y abonos crudos para calcular aquí la
              campaña con las mismas reglas de negocio.
            </p>
          </div>

          <div className="url-config-grid">
            <label className="url-config-field">
              <span>Base URL de la API</span>
              <input
                type="text"
                placeholder="https://api.tu-dominio.com o /api"
                value={apiBaseUrlInput}
                onChange={(event) => setApiBaseUrlInput(event.target.value)}
              />
            </label>
            <button className="campaign-btn campaign-btn-primary" onClick={guardarApiBaseUrl}>
              Guardar API
            </button>
          </div>

          <div className="url-helper-block">
            <span className="url-helper-label">Fuente de datos actual</span>
            <strong>{fuenteDatos}</strong>
          </div>

          {!apiDisponible && (
            <div className="url-warning">
              Esta vista está en modo demo porque la API no está publicada o sigue apuntando a un entorno local.
            </div>
          )}
        </section>

        <section className="criterios-panel url-config-panel">
          <div className="panel-header">
            <h2>Public URL para compartir</h2>
            <p>La URL pública se usa para WhatsApp y para copiar el enlace al catálogo.</p>
          </div>

          <div className="url-config-grid">
            <label className="url-config-field">
              <span>URL pública real</span>
              <input
                type="url"
                placeholder="https://tu-dominio.com"
                value={publicUrlInput}
                onChange={(event) => setPublicUrlInput(event.target.value)}
              />
            </label>
            <button className="campaign-btn campaign-btn-primary" onClick={guardarUrlPublica}>
              Guardar URL pública
            </button>
          </div>

          <div className="url-helper-block">
            <span className="url-helper-label">Link final que se compartirá</span>
            <strong>{publicUrl || 'Configura una URL pública válida'}</strong>
          </div>
        </section>

        <section className="recordatorio-banner">
          <div>
            <strong>Comparación con la vista anterior</strong>
            <p>
              Aquí el cálculo se hace sobre los mismos criterios de negocio, pero consumiendo datos desde la API para
              evitar resultados inconsistentes.
            </p>
          </div>
          <div className="recordatorio-meta">
            <span>Actualizado: {formatearFecha(resumenCalculado.ultimaActualizacion)}</span>
            <label>
              <input
                type="checkbox"
                checked={soloConTelefono}
                onChange={(event) => setSoloConTelefono(event.target.checked)}
              />
              Solo mostrar clientes con WhatsApp
            </label>
          </div>
        </section>

        {mensajeAccion && <div className="campana-feedback">{mensajeAccion}</div>}
        {error && <div className="campana-error">{error}</div>}

        <section className="criterios-panel">
          <div className="panel-header panel-header-inline">
            <div>
              <h2>Lógica de negocio aplicada</h2>
              <p>Los criterios son los mismos que en la vista original, pero ahora puedes alimentarlos desde la API.</p>
            </div>
            <div className="recordatorio-meta">
              <label>
                <input
                  type="checkbox"
                  checked={mostrarNoAptos}
                  onChange={(event) => setMostrarNoAptos(event.target.checked)}
                />
                Mostrar no aptos
              </label>
              <select value={orden} onChange={(event) => setOrden(event.target.value)}>
                <option value="score">Ordenar por score</option>
                <option value="saldo">Ordenar por saldo</option>
                <option value="reciente">Ordenar por envío reciente</option>
              </select>
            </div>
          </div>

          <div className="criterios-grid">
            <label>
              <span>Saldo pendiente máximo</span>
              <input
                type="number"
                min="0"
                value={reglas.maxSaldoPendiente}
                onChange={(event) => setReglas((prev) => ({ ...prev, maxSaldoPendiente: Number(event.target.value) || 0 }))}
              />
            </label>
            <label>
              <span>Facturas pendientes máximas</span>
              <input
                type="number"
                min="0"
                value={reglas.maxFacturasPendientes}
                onChange={(event) =>
                  setReglas((prev) => ({ ...prev, maxFacturasPendientes: Number(event.target.value) || 0 }))
                }
              />
            </label>
            <label>
              <span>Días máximos de atraso</span>
              <input
                type="number"
                min="0"
                value={reglas.maxDiasAtraso}
                onChange={(event) => setReglas((prev) => ({ ...prev, maxDiasAtraso: Number(event.target.value) || 0 }))}
              />
            </label>
            <label>
              <span>Clasificación mínima</span>
              <input
                type="number"
                min="0"
                value={reglas.minClasificacion}
                onChange={(event) =>
                  setReglas((prev) => ({ ...prev, minClasificacion: Number(event.target.value) || 0 }))
                }
              />
            </label>
            <label>
              <span>Días de reenvío</span>
              <input
                type="number"
                min="0"
                value={reglas.diasReenvio}
                onChange={(event) => setReglas((prev) => ({ ...prev, diasReenvio: Number(event.target.value) || 0 }))}
              />
            </label>
            <label>
              <span>Búsqueda</span>
              <input
                type="text"
                value={buscar}
                onChange={(event) => setBuscar(event.target.value)}
                placeholder="Buscar cliente, teléfono, vendedor..."
              />
            </label>
          </div>
        </section>

        <section className="campana-stats">
          <article className="stat-card total">
            <span className="stat-label">Total clientes</span>
            <strong>{backendResumen?.totalClientes ?? resumenCalculado.totalClientes}</strong>
            <p>Calculado desde la API y refinado con la lógica de negocio.</p>
          </article>
          <article className="stat-card eligible">
            <span className="stat-label">Aptos</span>
            <strong>{backendResumen?.aptos ?? resumenCalculado.aptos.length}</strong>
            <p>Clientes recomendados para campaña.</p>
          </article>
          <article className="stat-card blocked">
            <span className="stat-label">No aptos</span>
            <strong>{backendResumen?.noAptos ?? resumenCalculado.noAptos.length}</strong>
            <p>Bloqueados por cartera, atraso o frecuencia.</p>
          </article>
          <article className="stat-card total">
            <span className="stat-label">Enviados recientes</span>
            <strong>{backendResumen?.enviadosRecientes ?? resumenCalculado.enviadosRecientes}</strong>
            <p>Mensajes dentro del periodo de enfriamiento.</p>
          </article>
        </section>

        <section className="clientes-section">
          <div className="panel-header panel-header-inline">
            <div>
              <h2>{mostrarNoAptos ? 'Clientes no aptos' : 'Clientes aptos desde API'}</h2>
              <p>
                {mostrarNoAptos
                  ? 'Revisa por qué se están bloqueando y si la API está respetando las reglas.'
                  : 'Los resultados se calculan localmente para que coincidan con la vista anterior.'}
              </p>
            </div>
          </div>

          <div className="campaign-grid">
            {datosFiltrados.map((cliente) => (
              <article key={cliente.id} className={`campaign-card ${cliente.apto ? 'eligible-card' : 'blocked-card'}`}>
                <div className="campaign-card-top">
                  <div>
                    <h3>{cliente.nombre}</h3>
                    <p>{cliente.telefono || 'Sin teléfono'}</p>
                  </div>
                  {cliente.apto ? (
                    <span className="score-chip">Score {cliente.puntajeCampana ?? 0}</span>
                  ) : (
                    <span className="blocked-chip">Bloqueado</span>
                  )}
                </div>

                <div className="campaign-metrics">
                  <div>
                    <span>Saldo pendiente</span>
                    <strong>{formatearMoneda(cliente.totalSaldoPendiente)}</strong>
                  </div>
                  <div>
                    <span>Clasificación</span>
                    <strong>{cliente.clasificacion || 0} estrellas</strong>
                  </div>
                </div>

                <div className="campaign-details">
                  <div>
                    <span>Facturas pendientes</span>
                    <strong>{cliente.cantidadFacturasPendientes || 0}</strong>
                  </div>
                  <div>
                    <span>Último envío</span>
                    <strong>{cliente.ultimaFechaEnvio ? formatearFecha(cliente.ultimaFechaEnvio) : 'Sin envío previo'}</strong>
                  </div>
                  <div>
                    <span>Canal</span>
                    <strong>{cliente.ultimoCanalEnvio || 'Pendiente'}</strong>
                  </div>
                </div>

                {cliente.apto ? (
                  <div className="campaign-actions">
                    <button className="campaign-btn campaign-btn-primary" onClick={() => enviarPorWhatsApp(cliente)}>
                      Enviar por WhatsApp
                    </button>
                    <button className="campaign-btn campaign-btn-secondary" onClick={() => copiarLink(cliente)}>
                      Copiar link
                    </button>
                  </div>
                ) : (
                  <ul className="blocked-reasons">
                    {cliente.razonesBloqueo.map((razon) => (
                      <li key={razon}>{razon}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>

          {!datosFiltrados.length && <div className="empty-state">No hay resultados con los filtros actuales.</div>}
        </section>

        <section className="criterios-panel">
          <div className="panel-header">
            <h2>Historial de campaña</h2>
            <p>La API puede guardar y consultar a quién se le compartió el catálogo.</p>
          </div>

          <div className="empty-state">
            {Object.keys(historialEnvios).length > 0 ? (
              <ul className="blocked-reasons" style={{ textAlign: 'left' }}>
                {Object.entries(historialEnvios).map(([key, item]) => (
                  <li key={key}>
                    {formatearFecha(item.fecha)} — {key} — {item.canal}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No hay historial cargado desde la API.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default CampanaCatalogoApi;