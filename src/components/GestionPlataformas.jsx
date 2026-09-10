import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../App';
import {
  consultarCredencialesSeguras,
  crearPagoPlataforma,
  crearPlataforma,
  fetchAuditoriaCredenciales,
  fetchCredencialesPlataforma,
  fetchPagosPlataforma,
  fetchPlataformas,
  guardarCredencialSegura,
} from '../lib/plataformasSupabase';
import './GestionPlataformas.css';

const dinero = (valor) => `$${Number(valor || 0).toLocaleString('es-CO')}`;
const hoyIso = () => new Date().toISOString().slice(0, 10);
const periodoActual = () => `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;
const estadoNormalizado = (valor) => String(valor || '').trim().toUpperCase();
const mesesPorFrecuencia = { MENSUAL: 1, SEMESTRAL: 6, ANUAL: 12 };
const fechaLocalDesdeIso = (valor) => {
  const [anio, mes, dia] = String(valor).slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia);
};
const isoLocal = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
const fechaFinCobertura = (inicio, frecuencia) => {
  const fecha = fechaLocalDesdeIso(inicio);
  fecha.setMonth(fecha.getMonth() + mesesPorFrecuencia[frecuencia] || 1);
  fecha.setDate(fecha.getDate() - 1);
  return isoLocal(fecha);
};

const estadoPago = (plataforma, pagos) => {
  const hoy = new Date();
  const pago = pagos.find((item) => {
    if (estadoNormalizado(item.estado) !== 'PAGADO') return false;
    const inicio = fechaLocalDesdeIso(item.periodo);
    const fin = fechaLocalDesdeIso(item.periodoHasta || item.periodo);
    return hoy >= inicio && hoy <= fin;
  });
  if (pago || hoy.getDate() < plataforma.diaCorte) return 'Al día';
  if (hoy.getDate() === plataforma.diaCorte) return 'Vence hoy';
  return 'En mora';
};

const serviciosIniciales = ['Supabase', 'Cloudinary', 'GitHub', 'Correo electrónico'];

function FormularioPlataforma({ onClose, onSave }) {
  const [formulario, setFormulario] = useState({
    nombreCliente: '', telefonoCliente: '', correoCliente: '', nombre: '', contrato: '',
    proveedorDespliegue: '', urlProduccion: '',
    fechaInicio: hoyIso(), fechaFin: '', diaCorte: 5, valorMensual: '',
    servicios: serviciosIniciales, estado: 'ACTIVO',
  });
  const [error, setError] = useState('');
  const actualizar = (evento) => setFormulario((actual) => ({ ...actual, [evento.target.name]: evento.target.value }));
  const alternarServicio = (servicio) => setFormulario((actual) => ({
    ...actual,
    servicios: actual.servicios.includes(servicio)
      ? actual.servicios.filter((item) => item !== servicio)
      : [...actual.servicios, servicio],
  }));
  const guardar = async (evento) => {
    evento.preventDefault();
    setError('');
    if (!formulario.servicios.length) {
      setError('Selecciona al menos un servicio de infraestructura.');
      return;
    }
    try {
      await onSave(formulario);
      onClose();
    } catch (guardarError) {
      setError(guardarError.message);
    }
  };
  return (
    <div className="plataformas-modal-backdrop" role="presentation" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}>
      <form className="plataformas-modal" onSubmit={guardar}>
        <div className="plataformas-modal__header">
          <div><span className="plataformas-eyebrow">Nuevo contrato</span><h2>Registrar plataforma</h2></div>
          <button type="button" className="plataformas-close" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="plataformas-form-grid">
          <label>Nombre de la plataforma<input name="nombre" value={formulario.nombre} onChange={actualizar} placeholder="Portal del cliente" required /></label>
          <label>Número de contrato<input name="contrato" value={formulario.contrato} onChange={actualizar} placeholder="CTR-2026-001" required /></label>
          <label>Dónde está desplegada<input name="proveedorDespliegue" value={formulario.proveedorDespliegue} onChange={actualizar} placeholder="Vercel, Netlify, servidor propio..." /></label>
          <label>Link de acceso del cliente<input type="url" name="urlProduccion" value={formulario.urlProduccion} onChange={actualizar} placeholder="https://cliente.tudominio.com" /></label>
          <label>Contacto principal<input name="nombreCliente" value={formulario.nombreCliente} onChange={actualizar} placeholder="Nombre completo" required /></label>
          <label>WhatsApp<input name="telefonoCliente" value={formulario.telefonoCliente} onChange={actualizar} placeholder="573001234567" inputMode="tel" required /></label>
          <label>Correo corporativo<input type="email" name="correoCliente" value={formulario.correoCliente} onChange={actualizar} placeholder="contacto@empresa.com" /></label>
          <label>Canon mensual<input type="number" min="0" name="valorMensual" value={formulario.valorMensual} onChange={actualizar} placeholder="450000" required /></label>
          <label>Inicio del arriendo<input type="date" name="fechaInicio" value={formulario.fechaInicio} onChange={actualizar} required /></label>
          <label>Fin del arriendo<input type="date" name="fechaFin" value={formulario.fechaFin} onChange={actualizar} /></label>
          <label>Día de corte<input type="number" min="1" max="31" name="diaCorte" value={formulario.diaCorte} onChange={actualizar} required /></label>
          <label>Estado<select name="estado" value={formulario.estado} onChange={actualizar}><option value="ACTIVO">Activo</option><option value="SUSPENDIDO">Suspendido</option><option value="FINALIZADO">Finalizado</option></select></label>
        </div>
        <fieldset className="plataformas-services"><legend>Servicios aprovisionados</legend>{serviciosIniciales.map((servicio) => <label key={servicio}><input type="checkbox" checked={formulario.servicios.includes(servicio)} onChange={() => alternarServicio(servicio)} />{servicio}</label>)}</fieldset>
        {error && <p className="plataformas-error" role="alert">{error}</p>}
        <button className="plataformas-primary" type="submit">Guardar plataforma</button>
      </form>
    </div>
  );
}

function PagoModal({ plataforma, onClose, onSave }) {
  const [pago, setPago] = useState({ plataformaId: plataforma.id, periodo: periodoActual(), frecuencia: 'MENSUAL', periodoHasta: fechaFinCobertura(periodoActual(), 'MENSUAL'), monto: plataforma.valorMensual, fechaPago: hoyIso() });
  const [error, setError] = useState('');
  const actualizarFrecuencia = (frecuencia) => setPago((actual) => ({ ...actual, frecuencia, periodoHasta: fechaFinCobertura(actual.periodo, frecuencia) }));
  const actualizarPeriodo = (periodo) => setPago((actual) => ({ ...actual, periodo, periodoHasta: fechaFinCobertura(periodo, actual.frecuencia) }));
  const guardar = async (evento) => {
    evento.preventDefault();
    try { await onSave(pago); onClose(); } catch (guardarError) { setError(guardarError.message); }
  };
  return <div className="plataformas-modal-backdrop" role="presentation" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}><form className="plataformas-modal plataformas-modal--small" onSubmit={guardar}><div className="plataformas-modal__header"><div><span className="plataformas-eyebrow">Cartera</span><h2>Registrar pago</h2></div><button type="button" className="plataformas-close" onClick={onClose} aria-label="Cerrar">×</button></div><label>Periodo desde<input type="date" value={pago.periodo} onChange={(evento) => actualizarPeriodo(evento.target.value)} required /></label><label>Periodicidad<select value={pago.frecuencia} onChange={(evento) => actualizarFrecuencia(evento.target.value)}><option value="MENSUAL">Mensual</option><option value="SEMESTRAL">Semestral</option><option value="ANUAL">Anual</option></select></label><label>Cubierto hasta<input type="date" value={pago.periodoHasta} readOnly /></label><label>Valor pagado<input type="number" min="0" value={pago.monto} onChange={(evento) => setPago({ ...pago, monto: evento.target.value })} required /></label><label>Fecha de pago<input type="date" value={pago.fechaPago} onChange={(evento) => setPago({ ...pago, fechaPago: evento.target.value })} required /></label>{error && <p className="plataformas-error" role="alert">{error}</p>}<button className="plataformas-primary" type="submit">Confirmar pago</button></form></div>;
}

function BovedaTecnica({ plataforma, onClose }) {
  const [credenciales, setCredenciales] = useState([]);
  const [clave, setClave] = useState('');
  const [secretos, setSecretos] = useState([]);
  const [nueva, setNueva] = useState({ proveedor: 'SUPABASE', usuario: '', password: '', url: '', claveMaestra: '' });
  const [error, setError] = useState('');
  useEffect(() => { fetchCredencialesPlataforma(plataforma.id).then(setCredenciales).catch((fetchError) => setError(fetchError.message)); }, [plataforma.id]);
  const revelar = async (evento) => {
    evento.preventDefault();
    try { setSecretos(await consultarCredencialesSeguras(plataforma.contrato, clave)); setClave(''); } catch (fetchError) { setError(fetchError.message); }
  };
  const guardar = async (evento) => {
    evento.preventDefault();
    if (nueva.password && !nueva.claveMaestra) {
      setError('Escribe una clave maestra cuando registres una contraseña.');
      return;
    }
    try {
      await guardarCredencialSegura({ ...nueva, plataformaId: plataforma.id });
      setCredenciales(await fetchCredencialesPlataforma(plataforma.id));
      setNueva({ ...nueva, usuario: '', password: '', claveMaestra: '' });
      setError('');
    } catch (guardarError) { setError(guardarError.message); }
  };
  return (
    <div className="plataformas-modal-backdrop" role="presentation" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}>
      <section className="plataformas-modal">
        <div className="plataformas-modal__header"><div><span className="plataformas-eyebrow">Acceso restringido</span><h2>Bóveda técnica</h2><p>{plataforma.nombre} · {plataforma.contrato}</p></div><button type="button" className="plataformas-close" onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="credenciales-lista">{credenciales.length ? credenciales.map((credencial) => <div className="credencial-row" key={credencial.id}><strong>{credencial.proveedor}</strong><span>{credencial.usuario}</span><a href={credencial.url} target="_blank" rel="noreferrer">Abrir panel</a><small>{credencial.totalRotaciones} rotaciones</small></div>) : <p className="plataformas-muted">No hay credenciales registradas para esta plataforma.</p>}</div>
        <form className="credencial-form" onSubmit={guardar}><h3>Guardar o actualizar cuenta</h3><div className="plataformas-form-grid">
          <label>Proveedor<select value={nueva.proveedor} onChange={(evento) => setNueva({ ...nueva, proveedor: evento.target.value })}><option value="SUPABASE">Supabase</option><option value="CLOUDINARY">Cloudinary</option><option value="GITHUB">GitHub</option><option value="CORREO">Cuenta de correo electrónico</option><option value="OTRO">Otro</option></select></label>
          <label>Usuario o correo<input value={nueva.usuario} onChange={(evento) => setNueva({ ...nueva, usuario: evento.target.value })} required /></label><label>Contraseña o token <span className="campo-opcional">(opcional)</span><input type="password" value={nueva.password} onChange={(evento) => setNueva({ ...nueva, password: evento.target.value })} autoComplete="new-password" placeholder="Déjalo vacío si aún no existe" /></label><label>URL de acceso<input type="url" value={nueva.url} onChange={(evento) => setNueva({ ...nueva, url: evento.target.value })} placeholder="https://..." /></label><label>Clave maestra <span className="campo-opcional">(solo si hay contraseña)</span><input type="password" value={nueva.claveMaestra} onChange={(evento) => setNueva({ ...nueva, claveMaestra: evento.target.value })} /></label>
        </div><button className="plataformas-secondary" type="submit">Cifrar y guardar cuenta</button></form>
        <form className="clave-form" onSubmit={revelar}><label>Clave maestra<input type="password" value={clave} onChange={(evento) => setClave(evento.target.value)} autoComplete="current-password" required /></label><button className="plataformas-secondary" type="submit">Consultar temporalmente</button></form>{secretos.length > 0 && <div className="secretos"><strong>Credenciales consultadas</strong>{secretos.map((secreto) => <p key={`${secreto.proveedor}-${secreto.usuario_o_email}`}><b>{secreto.proveedor}</b>: {secreto.usuario_o_email} · <code>{secreto.password_plana || 'Sin contraseña registrada'}</code></p>)}</div>}{error && <p className="plataformas-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}

export default function GestionPlataformas() {
  const { user } = useAuth();
  const [plataformas, setPlataformas] = useState([]);
  const [pagos, setPagos] = useState({});
  const [auditoria, setAuditoria] = useState([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');
  const [modal, setModal] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const rol = String(user?.role || '').toLowerCase();
  const puedeBoveda = ['admin', 'superadmin', 'tecnico'].includes(rol);

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const lista = await fetchPlataformas();
      const pagosLista = await Promise.all(lista.map(async (plataforma) => [plataforma.id, await fetchPagosPlataforma(plataforma.id)]));
      setPlataformas(lista); setPagos(Object.fromEntries(pagosLista));
      if (puedeBoveda) setAuditoria(await fetchAuditoriaCredenciales());
      setError('');
    } catch (cargaError) { setError(cargaError.message); } finally { setCargando(false); }
  }, [puedeBoveda]);
  useEffect(() => { cargar(); }, [cargar]);

  const filas = useMemo(() => plataformas.filter((plataforma) => {
    const coincideFiltro = filtro === 'TODOS' || plataforma.estado === filtro;
    const texto = `${plataforma.nombre} ${plataforma.contrato} ${plataforma.nombreCliente}`.toLowerCase();
    return coincideFiltro && texto.includes(busqueda.toLowerCase());
  }).map((plataforma) => ({ ...plataforma, estadoPago: estadoPago(plataforma, pagos[plataforma.id] || []) })), [busqueda, filtro, pagos, plataformas]);
  const enMora = filas.filter((fila) => fila.estadoPago === 'En mora').length;
  const canon = filas.filter((fila) => fila.estado === 'ACTIVO').reduce((total, fila) => total + fila.valorMensual, 0);
  const guardarPlataforma = async (formulario) => { const nueva = await crearPlataforma(formulario); setPlataformas((actual) => [nueva, ...actual]); };
  const guardarPago = async (pago) => { const nuevo = await crearPagoPlataforma(pago); setPagos((actual) => ({ ...actual, [pago.plataformaId]: [nuevo, ...(actual[pago.plataformaId] || [])] })); };

  return <main className="plataformas-shell"><header className="plataformas-hero"><div><span className="plataformas-eyebrow">Infraestructura arrendada</span><h1>Plataformas de clientes</h1><p>Contratos, facturación y operación técnica en una vista separada de inmuebles.</p></div><button className="plataformas-primary" onClick={() => setModal('crear')}>+ Nueva plataforma</button></header>
    {error && <div className="plataformas-error plataformas-error--page" role="alert">{error}<small>Verifica que hayas ejecutado sql/PLATAFORMAS_ARRENDAMIENTO_SETUP.sql en Supabase.</small></div>}
    <section className="plataformas-metrics"><article><small>Contratos activos</small><strong>{plataformas.filter((item) => item.estado === 'ACTIVO').length}</strong></article><article><small>Canon mensual activo</small><strong>{dinero(canon)}</strong></article><article><small>En mora</small><strong className={enMora ? 'texto-alerta' : ''}>{enMora}</strong></article><article><small>Servicios provisionados</small><strong>{plataformas.reduce((total, item) => total + item.servicios.length, 0)}</strong></article></section>
    <section className="plataformas-panel"><div className="plataformas-toolbar"><div><span className="plataformas-eyebrow">Control administrativo</span><h2>Contratos y servicios activos</h2></div><div className="plataformas-filters"><input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Buscar plataforma, contrato o cliente" /><select value={filtro} onChange={(evento) => setFiltro(evento.target.value)}><option value="TODOS">Todos los estados</option><option value="ACTIVO">Activos</option><option value="SUSPENDIDO">Suspendidos</option><option value="FINALIZADO">Finalizados</option></select></div></div>{cargando ? <p className="plataformas-muted">Cargando plataformas...</p> : <div className="plataformas-table-wrap"><table><thead><tr><th>Plataforma</th><th>Cliente</th><th>Contrato</th><th>Despliegue</th><th>Servicios</th><th>Canon</th><th>Corte</th><th>Pago</th><th>Acciones</th></tr></thead><tbody>{filas.map((fila) => <tr key={fila.id}><td><strong>{fila.nombre}</strong><small>{fila.estado}</small></td><td>{fila.nombreCliente}<small>{fila.telefonoCliente}</small></td><td>{fila.contrato}<small>Desde {fila.fechaInicio}</small></td><td>{fila.proveedorDespliegue || 'Sin registrar'}{fila.urlProduccion && <a className="deployment-link" href={fila.urlProduccion} target="_blank" rel="noreferrer">Abrir plataforma ↗</a>}</td><td><div className="service-tags">{fila.servicios.map((servicio) => <span key={servicio}>{servicio}</span>)}</div></td><td>{dinero(fila.valorMensual)}</td><td>Día {fila.diaCorte}</td><td><span className={`payment-status payment-status--${fila.estadoPago.toLowerCase().replace(' ', '-')}`}>{fila.estadoPago}</span></td><td><div className="actions"><button onClick={() => { setSeleccionada(fila); setModal('pago'); }}>Registrar pago</button>{puedeBoveda && <button onClick={() => { setSeleccionada(fila); setModal('boveda'); }}>Bóveda</button>}</div></td></tr>)}</tbody></table>{!filas.length && <p className="plataformas-muted">No hay plataformas que coincidan con el filtro.</p>}</div>}</section>
    {puedeBoveda && <section className="plataformas-panel auditoria-panel"><div><span className="plataformas-eyebrow">Trazabilidad técnica</span><h2>Últimas rotaciones de credenciales</h2></div>{auditoria.length ? <div className="auditoria-lista">{auditoria.slice(0, 6).map((item) => <div key={`${item.id_credencial}-${item.fecha_ultimo_cambio}`}><strong>{item.nombre_plataforma} · {item.proveedor}</strong><span>{item.usuario_o_email} · {item.total_rotaciones} rotaciones</span></div>)}</div> : <p className="plataformas-muted">Aún no hay credenciales con auditoría registrada.</p>}</section>}
    {modal === 'crear' && <FormularioPlataforma onClose={() => setModal(null)} onSave={guardarPlataforma} />}{modal === 'pago' && seleccionada && <PagoModal plataforma={seleccionada} onClose={() => setModal(null)} onSave={guardarPago} />}{modal === 'boveda' && seleccionada && <BovedaTecnica plataforma={seleccionada} onClose={() => setModal(null)} />}
  </main>;
}
