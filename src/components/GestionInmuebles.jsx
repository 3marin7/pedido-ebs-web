import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  crearInmuebleEnSupabase,
  crearPagoEnSupabase,
  crearServicioEnSupabase,
  fetchInmueblesFromSupabase,
  fetchPagosFromSupabase,
  fetchServiciosFromSupabase,
  actualizarServicioEnSupabase,
  actualizarTelefonoInquilinoEnSupabase,
  actualizarInmuebleEnSupabase,
} from "../lib/inmueblesSupabase";
import "./GestionInmuebles.css";
import "./GestionInmueblesExtra.css";

const dinero = (valor) => `$${valor.toLocaleString("es-CO")}`;
const mesesPeriodo = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];
const mesesPeriodoTexto = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const anioActual = new Date().getFullYear();
const aniosPeriodo = Array.from({ length: 7 }, (_, indice) => anioActual - 3 + indice);
const fechaLocal = (fecha) => {
  if (!fecha) return null;
  const partes = String(fecha).slice(0, 10).split("-").map(Number);
  if (partes.length !== 3 || partes.some(Number.isNaN)) return null;
  return new Date(partes[0], partes[1] - 1, partes[2]);
};

const periodoAClave = (valor) => {
  const periodo = String(valor || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const mes = mesesPeriodoTexto.findIndex((nombre) => periodo.includes(nombre));
  const mesCorto = mesesPeriodo.findIndex((nombre) => periodo.includes(nombre.toLowerCase()));
  const anio = periodo.match(/20\d{2}/)?.[0];
  if ((mes === -1 && mesCorto === -1) || !anio) return null;
  return `${anio}-${String(mes !== -1 ? mes : mesCorto).padStart(2, "0")}`;
};

const periodoDelPago = (pago) => {
  const clave = periodoAClave(pago.periodo);
  if (!clave) return null;
  const [anio, mes] = clave.split("-").map(Number);
  return { anio, mes };
};

const pagoEstaConfirmado = (pago) => {
  const estado = String(pago.estado || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return !["pendiente", "anulado", "rechazado", "cancelado"].includes(estado);
};

const etiquetaPeriodo = (clave) => {
  if (!clave) return "Todos los períodos";
  const [anio, mes] = clave.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { month: "long", year: "numeric" })
    .format(new Date(anio, mes, 1));
};

const pagoEsDelMes = (pago, fecha) => {
  if (!pagoEstaConfirmado(pago)) return false;
  const periodo = periodoDelPago(pago);
  if (periodo) {
    return periodo.anio === fecha.getFullYear() && periodo.mes === fecha.getMonth();
  }
  const fechaPago = fechaLocal(pago._raw?.fecha_pago);
  return Boolean(fechaPago)
    && fechaPago.getFullYear() === fecha.getFullYear()
    && fechaPago.getMonth() === fecha.getMonth();
};

const calcularEstadoCanon = (propiedad, pagos = []) => {
  const hoy = new Date();
  const fechaContrato = fechaLocal(propiedad._raw?.contrato_fecha);
  const diaCorte = fechaContrato?.getDate() || propiedad.corte || 5;
  const fechaCorte = new Date(hoy.getFullYear(), hoy.getMonth(), Math.min(diaCorte, new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate()));
  const periodosPagados = new Set(
    pagos.filter(pagoEstaConfirmado).map(periodoDelPago).filter(Boolean).map(({ anio, mes }) => `${anio}-${mes}`),
  );
  const periodosRegistrados = pagos.filter(pagoEstaConfirmado).map(periodoDelPago).filter(Boolean);
  const primerPeriodo = periodosRegistrados.reduce((menor, periodo) => {
    if (!menor) return periodo;
    return periodo.anio < menor.anio || (periodo.anio === menor.anio && periodo.mes < menor.mes)
      ? periodo
      : menor;
  }, null);
  if (primerPeriodo) {
    const primerMes = new Date(primerPeriodo.anio, primerPeriodo.mes, 1);
    const mesActual = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    for (const fechaPeriodo = new Date(primerMes); fechaPeriodo < mesActual; fechaPeriodo.setMonth(fechaPeriodo.getMonth() + 1)) {
      if (!periodosPagados.has(`${fechaPeriodo.getFullYear()}-${fechaPeriodo.getMonth()}`)) {
        const fechaVencida = new Date(fechaPeriodo.getFullYear(), fechaPeriodo.getMonth(), diaCorte);
        return {
          ...propiedad,
          corte: diaCorte,
          canonEstado: "En mora",
          diasAtraso: Math.max(1, Math.floor((hoy - fechaVencida) / 86400000)),
        };
      }
    }
  }
  const pagoDelMes = pagos.some((pago) => pagoEsDelMes(pago, hoy));
  if (pagoDelMes || hoy < fechaCorte) {
    return { ...propiedad, corte: diaCorte, canonEstado: "Al día", diasAtraso: 0 };
  }
  const diasAtraso = Math.floor((hoy - fechaCorte) / 86400000);
  return {
    ...propiedad,
    corte: diaCorte,
    canonEstado: diasAtraso === 0 ? "Vence hoy" : "En mora",
    diasAtraso,
  };
};

function Estado({ children, tipo = "success" }) {
  return (
    <span className={`inmueble-status inmueble-status--${tipo}`}>
      {children}
    </span>
  );
}

function FormularioServicio({ onClose, onSave, inmuebles = [], unidadInicial = "", inmuebleId = null }) {
  const inmuebleInicial = inmuebles.find((inmueble) => inmueble.unidad === unidadInicial)
    || inmuebles.find((inmueble) => inmueble.id === inmuebleId)
    || inmuebles[0]
    || null;
  const [formulario, setFormulario] = useState({
    unidad: inmuebleInicial?.unidad || unidadInicial,
    tipo: "Energía (Luz)",
    referenciaPago: "",
    periodo: "Nov-2026",
    monto: "",
    vencimiento: "2026-11-15",
    responsable: "Inquilino",
  });
  const [evidenciaReciboFile, setEvidenciaReciboFile] = useState(null);
  const [evidenciaPagoFile, setEvidenciaPagoFile] = useState(null);
  const [error, setError] = useState("");
  const actualizar = (evento) =>
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
  const guardar = async (evento) => {
    evento.preventDefault();
    setError("");
    for (const archivo of [evidenciaReciboFile, evidenciaPagoFile]) {
      if (archivo && !archivo.type.startsWith("image/")) {
        setError("Las evidencias deben ser imágenes.");
        return;
      }
      if (archivo && archivo.size > 5 * 1024 * 1024) {
        setError("Cada imagen no puede superar los 5 MB.");
        return;
      }
    }
    const inmueble = inmuebles.find((item) => item.unidad === formulario.unidad);
    try {
      const guardado = await onSave({
        ...formulario,
        monto: Number(formulario.monto) || 0,
        unidad: formulario.unidad,
        inmueble_id: inmueble?.id || inmuebleId,
        evidenciaReciboFile,
        evidenciaPagoFile,
        estado: "Pendiente",
        recurrente: true,
        id: Date.now(),
      });
      if (!guardado) {
        setError("No se pudo guardar la factura. Revisa la consola para ver el detalle.");
      }
    } catch (guardarError) {
      console.error("Error guardando factura de servicio:", guardarError);
      setError(guardarError.message || "No se pudo guardar la factura.");
    }
  };
  return (
    <div
      className="inmueble-modal-backdrop"
      role="presentation"
      onMouseDown={(evento) =>
        evento.target === evento.currentTarget && onClose()
      }
    >
      <form className="inmueble-modal" onSubmit={guardar}>
        <div className="inmueble-modal__header">
          <div>
            <span className="inmueble-eyebrow">Servicios públicos</span>
            <h2>Registrar nueva factura</h2>
          </div>
          <button
            type="button"
            className="inmueble-icon-button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="inmueble-form-grid">
          <label>
            Unidad
            <select name="unidad" value={formulario.unidad} onChange={actualizar} required>
              {inmuebles.map((inmueble) => (
                <option key={inmueble.id} value={inmueble.unidad}>
                  {inmueble.unidad}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo de servicio
            <select name="tipo" value={formulario.tipo} onChange={actualizar}>
              <option>Energía (Luz)</option>
              <option>Agua</option>
              <option>Gas</option>
              <option>Internet/Admin</option>
            </select>
          </label>
          <label>
            Referencia de pago
            <input
              name="referenciaPago"
              value={formulario.referenciaPago}
              onChange={actualizar}
              placeholder="Número de referencia"
              required
            />
          </label>
          <label>
            Mes / período
            <input
              name="periodo"
              value={formulario.periodo}
              onChange={actualizar}
              required
            />
          </label>
          <label>
            Monto factura
            <input
              name="monto"
              type="number"
              min="0"
              value={formulario.monto}
              onChange={actualizar}
              placeholder="85000"
              required
            />
          </label>
          <label>
            Fecha límite de pago
            <input
              name="vencimiento"
              type="date"
              value={formulario.vencimiento}
              onChange={actualizar}
              required
            />
          </label>
          <label>
            Responsable
            <select
              name="responsable"
              value={formulario.responsable}
              onChange={actualizar}
            >
              <option>Inquilino</option>
              <option>Propietario</option>
              <option>Administración</option>
            </select>
          </label>
          <label>
            Recibo o factura del servicio
            <input
              name="evidenciaRecibo"
              type="file"
              accept="image/*"
              onChange={(evento) => setEvidenciaReciboFile(evento.target.files?.[0] || null)}
            />
            {evidenciaReciboFile && <small>{evidenciaReciboFile.name}</small>}
          </label>
          <label>
            Comprobante del pago
            <input
              name="evidenciaPago"
              type="file"
              accept="image/*"
              onChange={(evento) => setEvidenciaPagoFile(evento.target.files?.[0] || null)}
            />
            {evidenciaPagoFile && <small>{evidenciaPagoFile.name}</small>}
          </label>
        </div>
        {error && <p role="alert" className="inmueble-empty" style={{ color: "#b3261e" }}>{error}</p>}
        <button className="inmueble-primary-button" type="submit">
          Guardar registro
        </button>
      </form>
    </div>
  );
}

function FormularioInmueble({ onClose, onSave }) {
  const [formulario, setFormulario] = useState({
    unidad: "",
    inquilino: "",
    telefonoInquilino: "",
    canon: "",
    corte: "5",
    contrato: "",
  });
  const actualizar = (evento) =>
    setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
  const guardar = (evento) => {
    evento.preventDefault();
    onSave({
      ...formulario,
      id: `${formulario.unidad}-${Date.now()}`,
      canon: Number(formulario.canon),
      corte: Number(formulario.corte),
      contrato: formulario.contrato,
      canonEstado: "Al día",
      servicioEstado: "Al día",
    });
  };
  return (
    <div
      className="inmueble-modal-backdrop"
      role="presentation"
      onMouseDown={(evento) =>
        evento.target === evento.currentTarget && onClose()
      }
    >
      <form className="inmueble-modal" onSubmit={guardar}>
        <div className="inmueble-modal__header">
          <div>
            <span className="inmueble-eyebrow">Propiedades</span>
            <h2>Agregar inmueble</h2>
          </div>
          <button
            type="button"
            className="inmueble-icon-button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="inmueble-form-grid">
          <label>
            Unidad
            <input
              name="unidad"
              value={formulario.unidad}
              onChange={actualizar}
              placeholder="APT-301"
              required
            />
          </label>
          <label>
            Inquilino
            <input
              name="inquilino"
              value={formulario.inquilino}
              onChange={actualizar}
              placeholder="Nombre completo"
              required
            />
          </label>
          <label>
            WhatsApp del inquilino
            <input
              name="telefonoInquilino"
              value={formulario.telefonoInquilino}
              onChange={actualizar}
              placeholder="573001234567"
              inputMode="tel"
            />
          </label>
          <label>
            Canon mensual
            <input
              name="canon"
              type="number"
              min="0"
              value={formulario.canon}
              onChange={actualizar}
              placeholder="1200000"
              required
            />
          </label>
          <label>
            Día de corte
            <input
              name="corte"
              type="number"
              min="1"
              max="31"
              value={formulario.corte}
              onChange={actualizar}
              required
            />
          </label>
          <label>
            Vencimiento del contrato
            <input
              name="contrato"
              type="date"
              value={formulario.contrato}
              onChange={actualizar}
              required
            />
          </label>
        </div>
        <button className="inmueble-primary-button" type="submit">
          Guardar inmueble
        </button>
      </form>
    </div>
  );
}

function FormularioTelefono({ propiedad, onClose, onSave }) {
  const [telefono, setTelefono] = useState(propiedad.telefonoInquilino || "");
  const [error, setError] = useState("");

  const guardar = async (evento) => {
    evento.preventDefault();
    setError("");
    const numero = telefono.replace(/\D/g, "");
    if (numero && numero.length < 10) {
      setError("Escribe un número válido con indicativo de país, por ejemplo 573001234567.");
      return;
    }
    try {
      await onSave(telefono);
      onClose();
    } catch (guardarError) {
      setError(guardarError.message || "No se pudo actualizar el teléfono.");
    }
  };

  return (
    <div className="inmueble-modal-backdrop" role="presentation" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}>
      <form className="inmueble-modal" onSubmit={guardar}>
        <div className="inmueble-modal__header">
          <div><span className="inmueble-eyebrow">Contacto del inquilino</span><h2>Corregir WhatsApp</h2></div>
          <button type="button" className="inmueble-icon-button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="inmueble-form-grid">
          <label>Unidad<input value={propiedad.unidad} disabled /></label>
          <label>Inquilino<input value={propiedad.inquilino} disabled /></label>
          <label>WhatsApp<input value={telefono} onChange={(evento) => setTelefono(evento.target.value)} placeholder="573001234567" inputMode="tel" autoFocus /></label>
        </div>
        {error && <p role="alert" className="inmueble-empty" style={{ color: "#b3261e" }}>{error}</p>}
        <button className="inmueble-primary-button" type="submit">Guardar teléfono</button>
      </form>
    </div>
  );
}

function FormularioDatosInmueble({ propiedad, onClose, onSave }) {
  const [formulario, setFormulario] = useState({
    inquilino: propiedad.inquilino || "",
    canon: propiedad.canon || 0,
    contrato: propiedad._raw?.contrato_fecha || "",
  });
  const [error, setError] = useState("");

  const guardar = async (evento) => {
    evento.preventDefault();
    setError("");
    try {
      await onSave(formulario);
      onClose();
    } catch (guardarError) {
      setError(guardarError.message || "No se pudieron actualizar los datos.");
    }
  };

  return (
    <div className="inmueble-modal-backdrop" role="presentation" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}>
      <form className="inmueble-modal" onSubmit={guardar}>
        <div className="inmueble-modal__header">
          <div><span className="inmueble-eyebrow">Datos del inmueble</span><h2>Editar información</h2></div>
          <button type="button" className="inmueble-icon-button" onClick={onClose} aria-label="Cerrar">×</button>
        </div>
        <div className="inmueble-form-grid">
          <label>Unidad<input value={propiedad.unidad} disabled /></label>
          <label>Nombre del arrendatario<input name="inquilino" value={formulario.inquilino} onChange={(evento) => setFormulario({ ...formulario, inquilino: evento.target.value })} required /></label>
          <label>Canon mensual<input name="canon" type="number" min="0" value={formulario.canon} onChange={(evento) => setFormulario({ ...formulario, canon: evento.target.value })} required /></label>
          <label>Vencimiento del contrato<input name="contrato" type="date" value={formulario.contrato} onChange={(evento) => setFormulario({ ...formulario, contrato: evento.target.value })} required /></label>
        </div>
        {error && <p role="alert" className="inmueble-empty" style={{ color: "#b3261e" }}>{error}</p>}
        <button className="inmueble-primary-button" type="submit">Guardar cambios</button>
      </form>
    </div>
  );
}

function FormularioPago({ propiedad, onClose, onSave }) {
  const fechaActual = new Date();
  const [formulario, setFormulario] = useState({
    periodoMes: fechaActual.getMonth(),
    periodoAnio: fechaActual.getFullYear(),
    monto: propiedad.canon,
    fecha: "",
  });
  const [error, setError] = useState("");
  const [evidenciaFile, setEvidenciaFile] = useState(null);
  const actualizar = (evento) => setFormulario({ ...formulario, [evento.target.name]: evento.target.value });
  const guardar = async (evento) => {
    evento.preventDefault();
    setError("");
    if (evidenciaFile && !evidenciaFile.type.startsWith("image/")) {
      setError("El soporte debe ser una imagen.");
      return;
    }
    if (evidenciaFile && evidenciaFile.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB.");
      return;
    }
    try {
      const guardado = await onSave({
        inmueble_id: propiedad.id,
        periodo: `${mesesPeriodo[Number(formulario.periodoMes)]} ${formulario.periodoAnio}`,
        monto: Number(formulario.monto) || 0,
        fecha: formulario.fecha,
        evidenciaFile,
        estado: "Al día",
      });
      if (!guardado) {
        setError("No se pudo guardar el pago.");
      }
    } catch (guardarError) {
      console.error("Error guardando pago de arriendo:", guardarError);
      setError(guardarError.message || "No se pudo guardar el pago.");
    }
  };
  return <div className="inmueble-modal-backdrop" role="presentation" onMouseDown={(evento) => evento.target === evento.currentTarget && onClose()}><form className="inmueble-modal" onSubmit={guardar}><div className="inmueble-modal__header"><div><span className="inmueble-eyebrow">Pagos de arriendo</span><h2>Registrar nuevo pago</h2></div><button type="button" className="inmueble-icon-button" onClick={onClose} aria-label="Cerrar">×</button></div><div className="inmueble-form-grid"><label>Unidad<select disabled><option value={propiedad.id}>{propiedad.unidad}</option></select></label><label>Mes del pago<select name="periodoMes" value={formulario.periodoMes} onChange={actualizar} required>{mesesPeriodo.map((mes, indice) => <option key={mes} value={indice}>{mes}</option>)}</select></label><label>Año del pago<select name="periodoAnio" value={formulario.periodoAnio} onChange={actualizar} required>{aniosPeriodo.map((anio) => <option key={anio} value={anio}>{anio}</option>)}</select></label><label>Valor pagado<input name="monto" type="number" min="0" value={formulario.monto} onChange={actualizar} required /></label><label>Fecha de pago<input name="fecha" type="date" value={formulario.fecha} onChange={actualizar} required /></label><label>Soporte del pago<input name="evidencia" type="file" accept="image/*" onChange={(evento) => setEvidenciaFile(evento.target.files?.[0] || null)} />{evidenciaFile && <small>{evidenciaFile.name}</small>}</label></div>{error && <p role="alert" className="inmueble-empty" style={{ color: "#b3261e" }}>{error}</p>}<button className="inmueble-primary-button" type="submit">Guardar pago</button></form></div>;
}

function ReportePendientes({ propiedades, servicios }) {
  const pendientesCanon = propiedades.filter(
    (propiedad) => ["En mora", "Vence hoy"].includes(propiedad.canonEstado),
  );
  const pendientesServicios = servicios.filter(
    (servicio) => servicio.estado !== "Pagado",
  );
  const total =
    pendientesCanon.reduce((suma, propiedad) => suma + propiedad.canon, 0) +
    pendientesServicios.reduce((suma, servicio) => suma + servicio.monto, 0);
  return (
    <section className="inmueble-panel inmueble-pendientes">
      <div className="inmueble-panel__heading">
        <div>
          <span className="inmueble-eyebrow">Control de cartera</span>
          <h2>Pagos pendientes</h2>
        </div>
        <strong className="inmueble-total-pendiente">
          Total: {dinero(total)}
        </strong>
      </div>
      <div className="inmueble-pendientes-grid">
        <div>
          <h3>
            Arriendos en mora <span>{pendientesCanon.length}</span>
          </h3>
          {pendientesCanon.length ? (
            pendientesCanon.map((propiedad) => (
              <p key={propiedad.id}>
                <strong>{propiedad.unidad}</strong> · {propiedad.inquilino}
                <small>{propiedad.canonEstado}{propiedad.diasAtraso ? ` · ${propiedad.diasAtraso} días de atraso` : ""}</small>
                <b>{dinero(propiedad.canon)}</b>
              </p>
            ))
          ) : (
            <p className="inmueble-empty">No hay cánones pendientes.</p>
          )}
        </div>
        <div>
          <h3>
            Servicios por pagar <span>{pendientesServicios.length}</span>
          </h3>
          {pendientesServicios.length ? (
            pendientesServicios.map((servicio) => (
              <p key={servicio.id}>
                <strong>{servicio.unidad}</strong> · {servicio.tipo}
                <b>{dinero(servicio.monto)}</b>
              </p>
            ))
          ) : (
            <p className="inmueble-empty">No hay servicios pendientes.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function AlertasPropietario({ propiedades, servicios, onOpenProperty }) {
  const arriendosEnMora = propiedades.filter((propiedad) => ["En mora", "Vence hoy"].includes(propiedad.canonEstado));
  const serviciosPropietario = servicios.filter((servicio) => servicio.responsable === "Propietario" && servicio.estado !== "Pagado");
  const totalAlertas = arriendosEnMora.length + serviciosPropietario.length;
  return (
    <section className="inmueble-panel inmueble-alertas">
      <div className="inmueble-panel__heading">
        <div><span className="inmueble-eyebrow">Seguimiento diario</span><h2>Notificaciones y alertas</h2></div>
        <strong className="inmueble-alert-count">{totalAlertas} pendientes</strong>
      </div>
      <div className="inmueble-alertas-grid">
        <div className="inmueble-alert-card inmueble-alert-card--danger">
          <h3>Arriendos por cobrar <span>{arriendosEnMora.length}</span></h3>
          {arriendosEnMora.length ? arriendosEnMora.map((propiedad) => <button className="inmueble-alert-item" key={propiedad.id} onClick={() => onOpenProperty(propiedad.id)}><span><strong>{propiedad.unidad}</strong><small>{propiedad.inquilino} · {propiedad.canonEstado}{propiedad.diasAtraso ? ` · ${propiedad.diasAtraso} días de atraso` : ""}</small></span><b>{dinero(propiedad.canon)} →</b></button>) : <p className="inmueble-empty">No hay arriendos vencidos.</p>}
        </div>
        <div className="inmueble-alert-card inmueble-alert-card--owner">
          <h3>Servicios a cargo del propietario <span>{serviciosPropietario.length}</span></h3>
          {serviciosPropietario.length ? serviciosPropietario.map((servicio) => <button className="inmueble-alert-item" key={servicio.id} onClick={() => onOpenProperty(servicio.inmueble_id || propiedades.find((propiedad) => propiedad.unidad === servicio.unidad)?.id)}><span><strong>{servicio.unidad} · {servicio.tipo}</strong><small>Factura pendiente · vence {servicio.vencimiento}</small></span><b>{dinero(servicio.monto)} →</b></button>) : <p className="inmueble-empty">No hay servicios del propietario pendientes.</p>}
        </div>
      </div>
    </section>
  );
}

function DetalleInmueble({ propiedad, servicios, pagos, onBack, onAddService, onAddPayment, onEditPhone, onEditData, onUpdateService }) {
  const serviciosUnidad = servicios.filter(
    (servicio) => servicio.inmueble_id === propiedad.id
      || (!servicio.inmueble_id && servicio.unidad === propiedad.unidad),
  );
  const periodosDisponibles = Array.from(new Set([
    ...pagos.map((pago) => periodoAClave(pago.periodo)),
    ...serviciosUnidad.map((servicio) => periodoAClave(servicio.periodo)),
  ].filter(Boolean))).sort().reverse();
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState("todos");
  const pagosFiltrados = periodoSeleccionado === "todos"
    ? pagos
    : pagos.filter((pago) => periodoAClave(pago.periodo) === periodoSeleccionado);
  const serviciosFiltrados = periodoSeleccionado === "todos"
    ? serviciosUnidad
    : serviciosUnidad.filter((servicio) => periodoAClave(servicio.periodo) === periodoSeleccionado);
  const totalPagos = pagosFiltrados.reduce((total, pago) => total + pago.monto, 0);
  const totalServicios = serviciosFiltrados.reduce((total, servicio) => total + servicio.monto, 0);
  const totalServiciosDeducibles = serviciosFiltrados
    .filter((servicio) => ["Propietario", "Administración", "Administrador"].includes(servicio.responsable))
    .reduce((total, servicio) => total + servicio.monto, 0);
  const totalAcumulado = totalPagos - totalServiciosDeducibles;
  const periodoInforme = etiquetaPeriodo(periodoSeleccionado === "todos" ? null : periodoSeleccionado);
  const enviarPagoPorWhatsApp = (pago) => {
    const telefono = propiedad.telefonoInquilino || window.prompt("Escribe el WhatsApp del arrendatario con indicativo de país, por ejemplo 573001234567:");
    if (!telefono) return;
    const numero = telefono.replace(/\D/g, "");
    if (numero.length < 10) {
      window.alert("El número de WhatsApp no parece válido.");
      return;
    }
    const mensaje = [
      `Comprobante de pago de arriendo - ${propiedad.unidad}`,
      `Arrendatario: ${propiedad.inquilino}`,
      `Periodo: ${pago.periodo}`,
      `Valor pagado: ${dinero(pago.monto)}`,
      `Fecha de pago: ${pago.fecha}`,
      pago.evidenciaUrl ? `Soporte: ${pago.evidenciaUrl}` : "Soporte: se enviará por este medio.",
      "Gracias.",
    ].join("\n");
    window.open(`https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`, "_blank", "noopener,noreferrer");
  };
  return (
    <main className="inmueble-shell">
      <article className="inmueble-print-report">
        <header className="inmueble-print-report__header">
          <div className="inmueble-print-report__brand">
            <img src="/logo-ebs.png" alt="EBS" />
            <div>
              <strong>DISTRIBUCIONES EBS</strong>
              <span>EL BUEN SAMARITANO</span>
            </div>
          </div>
          <div className="inmueble-print-report__title">
            <h1>COMPROBANTE MENSUAL DE PAGOS</h1>
            <b>Periodo: {periodoInforme}</b>
          </div>
        </header>
        <div className="inmueble-print-report__rule" />
        <section className="inmueble-print-report__identity">
          <div><b>Unidad:</b><span>{propiedad.unidad}</span></div>
          <div><b>Inquilino:</b><span>{propiedad.inquilino}</span></div>
          <div><b>Canon mensual:</b><span>{dinero(propiedad.canon)}</span></div>
          <div><b>Contrato vence:</b><span>{propiedad.contrato}</span></div>
        </section>
        <div className="inmueble-print-report__columns">
          <section className="inmueble-print-report__rent-section">
            <h2>PAGOS DE ARRIENDO</h2>
            <table>
              <thead><tr><th>Periodo</th><th>Fecha</th><th>Soporte</th><th>Valor</th></tr></thead>
              <tbody>
                {pagosFiltrados.length ? pagosFiltrados.map((pago) => (
                  <tr key={`print-${pago.id || pago.periodo}-${pago.fecha}`}>
                    <td>{pago.periodo}</td><td>{pago.fecha}</td><td>{pago.evidenciaUrl ? "Adjunto" : "Sin soporte"}</td><td>{dinero(pago.monto)}</td>
                  </tr>
                )) : <tr><td colSpan="4">No hay pagos registrados</td></tr>}
              </tbody>
              <tfoot><tr><th colSpan="3">TOTAL PAGADO</th><th>{dinero(totalPagos)}</th></tr></tfoot>
            </table>
          </section>
        </div>
        <section className="inmueble-print-report__services-section">
          <h2>INFORME DE PAGOS DE SERVICIOS PÚBLICOS</h2>
          <table>
            <thead><tr><th>Servicio</th><th>Periodo</th><th>Responsable</th><th>Estado</th><th>Recibo</th><th>Pago</th><th>Valor</th></tr></thead>
            <tbody>
              {serviciosFiltrados.length ? serviciosFiltrados.map((servicio) => (
                <tr key={`print-service-${servicio.id}`}>
                  <td>{servicio.tipo}</td>
                  <td>{servicio.periodo}</td>
                  <td>{servicio.responsable}</td>
                  <td>{servicio.estado}</td>
                  <td>{servicio.evidenciaReciboUrl ? "Adjunto" : "Sin recibo"}</td>
                  <td>{servicio.evidenciaUrl ? "Adjunto" : "Sin pago"}</td>
                  <td>{dinero(servicio.monto)}</td>
                </tr>
              )) : <tr><td colSpan="7">No hay servicios registrados</td></tr>}
            </tbody>
            <tfoot><tr><th colSpan="6">TOTAL SERVICIOS PÚBLICOS</th><th>{dinero(totalServicios)}</th></tr></tfoot>
          </table>
        </section>
        <section className="inmueble-print-report__totals">
          <div><span>Total pagos de arriendo</span><strong>{dinero(totalPagos)}</strong></div>
          <div><span>Total servicios públicos</span><strong>{dinero(totalServicios)}</strong></div>
          <div className="inmueble-print-report__grand-total"><span>TOTAL ACUMULADO</span><strong>{dinero(totalAcumulado)}</strong></div>
        </section>
        <footer className="inmueble-print-report__footer">
          <div><span>Preparado por</span><b>Administración EBS</b></div>
          <div><span>Recibido por</span><b>Firma del propietario</b></div>
        </footer>
      </article>
      <div className="inmueble-page-heading">
        <button className="inmueble-back-button" onClick={onBack}>
          ← Volver
        </button>
        <div>
          <span className="inmueble-eyebrow">Ficha de inmueble</span>
          <h1>Detalle del inmueble: {propiedad.unidad}</h1>
          <p className="inmueble-print-only">Informe de pagos y servicios públicos</p>
        </div>
        <button className="inmueble-secondary-button inmueble-print-button" onClick={() => window.print()}>
          Imprimir informe
        </button>
      </div>
      <section className="inmueble-summary-grid">
        <div>
          <small>Inquilino</small>
          <strong>{propiedad.inquilino}</strong>
          <button type="button" className="inmueble-inline-button" onClick={onEditData}>Editar datos</button>
        </div>
        <div>
          <small>Contrato vence</small>
          <strong>
            {propiedad.contrato} <em>(Alerta)</em>
          </strong>
        </div>
        <div>
          <small>WhatsApp del arrendatario</small>
          <strong>{propiedad.telefonoInquilino || "No registrado"}</strong>
          <button type="button" className="inmueble-inline-button" onClick={onEditPhone}>Corregir teléfono</button>
        </div>
        <div>
          <small>Canon mensual</small>
          <strong>{dinero(propiedad.canon)}</strong>
        </div>
      </section>
      <section className="inmueble-panel">
        <div className="inmueble-panel__heading">
          <div><h2>Historial de pagos de arriendo</h2><span className="inmueble-filter-result">{pagosFiltrados.length} registro(s)</span></div>
          <div className="inmueble-history-actions">
            <label className="inmueble-period-filter">Período
              <select value={periodoSeleccionado} onChange={(evento) => setPeriodoSeleccionado(evento.target.value)} aria-label="Filtrar pagos por período">
                <option value="todos">Todos</option>
                {periodosDisponibles.map((periodo) => <option key={periodo} value={periodo}>{etiquetaPeriodo(periodo)}</option>)}
              </select>
            </label>
            <button className="inmueble-primary-button" onClick={onAddPayment}>＋ Registrar nuevo pago</button>
          </div>
        </div>
        <div className="inmueble-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Período</th>
                <th>Monto pagado</th>
                <th>Fecha pago real</th>
                <th>Soporte</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {pagosFiltrados.map((pago) => (
                <tr key={`${pago.periodo}-${pago.fecha}`}>
                  <td>{pago.periodo}</td>
                  <td>{dinero(pago.monto)}</td>
                  <td>{pago.fecha}</td>
                  <td className="inmueble-document">
                    {pago.evidenciaUrl ? (
                      <span>
                        <a href={pago.evidenciaUrl} target="_blank" rel="noreferrer">Ver soporte</a>{" "}
                        <button type="button" className="inmueble-inline-button" onClick={() => enviarPagoPorWhatsApp(pago)}>Enviar</button>
                      </span>
                    ) : (
                      <button type="button" className="inmueble-inline-button" onClick={() => enviarPagoPorWhatsApp(pago)}>Enviar comprobante</button>
                    )}
                  </td>
                  <td>
                    <Estado>{pago.estado}</Estado>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="inmueble-panel">
        <div className="inmueble-panel__heading">
          <div><h2>Pagos de servicios públicos</h2><span className="inmueble-filter-result">{serviciosFiltrados.length} registro(s)</span></div>
          <div className="inmueble-history-actions">
            <label className="inmueble-period-filter">Período
              <select value={periodoSeleccionado} onChange={(evento) => setPeriodoSeleccionado(evento.target.value)} aria-label="Filtrar servicios por período">
                <option value="todos">Todos</option>
                {periodosDisponibles.map((periodo) => <option key={periodo} value={periodo}>{etiquetaPeriodo(periodo)}</option>)}
              </select>
            </label>
            <button className="inmueble-secondary-button" onClick={onAddService}>＋ Registrar factura</button>
          </div>
        </div>
        <div className="inmueble-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tipo de servicio</th>
                <th>Referencia de pago</th>
                <th>Mes / período</th>
                <th>Monto factura</th>
                <th>Vencimiento</th>
                <th>Responsable</th>
                <th>Evidencia</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {serviciosFiltrados.map((servicio) => (
                <tr key={servicio.id}>
                  <td>{servicio.tipo}</td>
                  <td className="inmueble-reference">{servicio.referenciaPago || "Sin referencia"}</td>
                  <td>{servicio.periodo}</td>
                  <td><input className="inmueble-amount-input" type="number" min="0" value={servicio.monto} onChange={(evento) => onUpdateService(servicio.id, evento.target.value)} aria-label={`Valor de ${servicio.tipo}`} /></td>
                  <td>{servicio.vencimiento}</td>
                  <td>{servicio.responsable}</td>
                  <td>
                    <div className="inmueble-document-links">
                      {servicio.evidenciaReciboUrl ? (
                        <a href={servicio.evidenciaReciboUrl} target="_blank" rel="noreferrer">Ver recibo</a>
                      ) : <span>Sin recibo</span>}
                      {servicio.evidenciaUrl ? (
                        <a href={servicio.evidenciaUrl} target="_blank" rel="noreferrer">Ver pago</a>
                      ) : <span>Sin comprobante</span>}
                    </div>
                  </td>
                  <td>
                    <Estado
                      tipo={
                        servicio.estado === "Pagado" ? "success" : "warning"
                      }
                    >
                      {servicio.estado}
                    </Estado>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default function GestionInmuebles() {
  const navigate = useNavigate();
  const { unidad } = useParams();
  const [propiedades, setPropiedades] = useState([]);
  const [servicios, setServicios] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [pagosPorInmueble, setPagosPorInmueble] = useState({});
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoModal, setTipoModal] = useState(null);
  const [editarTelefono, setEditarTelefono] = useState(false);
  const [editarDatos, setEditarDatos] = useState(false);
  const [unidadServicioActiva, setUnidadServicioActiva] = useState("APT-202");
  const [inmuebleServicioActiva, setInmuebleServicioActiva] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        const [inmuebles, serviciosList] = await Promise.all([
          fetchInmueblesFromSupabase(),
          fetchServiciosFromSupabase(),
        ]);
        const pagosList = await Promise.all(
          inmuebles.map(async (inmueble) => [inmueble.id, await fetchPagosFromSupabase(inmueble.id)]),
        );
        setPropiedades(inmuebles);
        setServicios(serviciosList);
        setPagosPorInmueble(Object.fromEntries(pagosList));
        setError("");
      } catch (err) {
        console.error(err);
        setError("No fue posible cargar los inmuebles. Revisa la conexión con Supabase.");
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const propiedadesConEstado = useMemo(
    () => propiedades.map((propiedad) => calcularEstadoCanon(propiedad, pagosPorInmueble[propiedad.id] || [])),
    [pagosPorInmueble, propiedades],
  );

  const propiedadSeleccionada =
    propiedadesConEstado.find((propiedad) => propiedad.id === unidad) || propiedadesConEstado[0] || null;
  const propiedadSeleccionadaId = propiedadSeleccionada?.id;

  useEffect(() => {
    const cargarPagos = async () => {
      if (!propiedadSeleccionadaId) {
        setPagos([]);
        return;
      }

      try {
        const pagosActuales = await fetchPagosFromSupabase(propiedadSeleccionadaId);
        setPagos(pagosActuales);
      } catch (err) {
        console.error(err);
        setPagos([]);
      }
    };

    cargarPagos();
  }, [propiedadSeleccionadaId]);

  useEffect(() => {
    const cargarServiciosDelInmueble = async () => {
      if (!propiedadSeleccionadaId) return;

      const serviciosActualizados = await fetchServiciosFromSupabase();
      setServicios(serviciosActualizados);
    };

    cargarServiciosDelInmueble();
  }, [propiedadSeleccionadaId]);

  const filtradas = useMemo(
    () =>
      propiedadesConEstado.filter((propiedad) =>
        `${propiedad.unidad} ${propiedad.inquilino}`
          .toLowerCase()
          .includes(busqueda.toLowerCase()),
      ),
    [busqueda, propiedadesConEstado],
  );

  const agregarServicio = async (servicio) => {
    const nuevoServicio = await crearServicioEnSupabase(servicio);
    if (!nuevoServicio) return null;

    const serviciosActualizados = await fetchServiciosFromSupabase();
    setServicios(serviciosActualizados);
    setModalAbierto(false);
    setTipoModal(null);
    return nuevoServicio;
  };

  const agregarPropiedad = async (propiedad) => {
    const nuevaPropiedad = await crearInmuebleEnSupabase(propiedad);
    if (nuevaPropiedad) {
      setPropiedades((actuales) => [nuevaPropiedad, ...actuales]);
    }
    setModalAbierto(false);
    setTipoModal(null);
  };

  const abrirServicio = (unidad = "APT-202", inmuebleId = null) => {
    setUnidadServicioActiva(unidad || "APT-202");
    setInmuebleServicioActiva(inmuebleId);
    setTipoModal("servicio");
    setModalAbierto(true);
  };

  const onUpdateService = async (id, monto) => {
    const valor = Number(monto) || 0;
    const servicioActualizado = await actualizarServicioEnSupabase(id, valor);
    if (!servicioActualizado) return;

    setServicios((actuales) =>
      actuales.map((servicio) =>
        servicio.id === id ? { ...servicio, monto: valor } : servicio,
      ),
    );
  };

  const registrarPago = async (pago) => {
    if (!propiedadSeleccionada) return;

    const nuevoPago = await crearPagoEnSupabase(propiedadSeleccionada.id, pago);
    if (!nuevoPago) return;

    setPagos((actuales) => [nuevoPago, ...actuales]);
    setPagosPorInmueble((actuales) => ({
      ...actuales,
      [propiedadSeleccionada.id]: [nuevoPago, ...(actuales[propiedadSeleccionada.id] || [])],
    }));
    return nuevoPago;
  };

  const actualizarTelefono = async (telefono) => {
    const inmuebleActualizado = await actualizarTelefonoInquilinoEnSupabase(propiedadSeleccionada.id, telefono);
    setPropiedades((actuales) => actuales.map((propiedad) => (
      propiedad.id === inmuebleActualizado.id ? inmuebleActualizado : propiedad
    )));
    setEditarTelefono(false);
  };

  const actualizarDatosInmueble = async (datos) => {
    const inmuebleActualizado = await actualizarInmuebleEnSupabase(propiedadSeleccionada.id, datos);
    setPropiedades((actuales) => actuales.map((propiedad) => (
      propiedad.id === inmuebleActualizado.id ? inmuebleActualizado : propiedad
    )));
    setEditarDatos(false);
  };

  if (unidad && propiedadSeleccionada)
    return (
      <>
        <DetalleInmueble
          propiedad={propiedadSeleccionada}
          servicios={servicios}
          pagos={pagos}
          onBack={() => navigate("/gestion-inmuebles")}
          onAddService={() => abrirServicio(propiedadSeleccionada?.unidad, propiedadSeleccionada?.id)}
          onAddPayment={() => {
            setTipoModal("pago");
            setModalAbierto(true);
          }}
          onEditPhone={() => setEditarTelefono(true)}
          onEditData={() => setEditarDatos(true)}
          onUpdateService={onUpdateService}
        />
        {editarDatos && (
          <FormularioDatosInmueble
            propiedad={propiedadSeleccionada}
            onClose={() => setEditarDatos(false)}
            onSave={actualizarDatosInmueble}
          />
        )}
        {editarTelefono && (
          <FormularioTelefono
            propiedad={propiedadSeleccionada}
            onClose={() => setEditarTelefono(false)}
            onSave={actualizarTelefono}
          />
        )}
        {modalAbierto && tipoModal === "pago" && (
          <FormularioPago
            propiedad={propiedadSeleccionada}
            onClose={() => setModalAbierto(false)}
            onSave={(pago) => {
              return registrarPago(pago).then((nuevoPago) => {
                if (nuevoPago) setModalAbierto(false);
                return nuevoPago;
              });
            }}
          />
        )}
        {modalAbierto && tipoModal === "servicio" && (
          <FormularioServicio
            inmuebles={[propiedadSeleccionada]}
            unidadInicial={unidadServicioActiva}
            inmuebleId={inmuebleServicioActiva}
            onClose={() => setModalAbierto(false)}
            onSave={agregarServicio}
          />
        )}
      </>
    );

  const mora = propiedadesConEstado.filter(
    (propiedad) => ["En mora", "Vence hoy"].includes(propiedad.canonEstado),
  ).length;
  const unidadesOcupadas = propiedadesConEstado.filter(
    (propiedad) => propiedad.inquilino && propiedad.inquilino !== "Sin asignar",
  ).length;
  const ocupacion = propiedadesConEstado.length
    ? Math.round((unidadesOcupadas / propiedadesConEstado.length) * 100)
    : 0;
  const hoy = new Date();
  const recaudacionMes = Object.values(pagosPorInmueble)
    .flat()
    .filter((pago) => pagoEstaConfirmado(pago) && pagoEsDelMes(pago, hoy))
    .reduce((total, pago) => total + pago.monto, 0);

  return (
    <main className="inmueble-shell">
      <header className="inmueble-hero">
        <div>
          <span className="inmueble-eyebrow">Panel del propietario</span>
          <h1>Gestión de inmuebles</h1>
          <p>
            Una lectura clara del estado de tus unidades, pagos y contratos.
          </p>
        </div>
        <div className="inmueble-hero-actions">
          <button className="inmueble-secondary-button" onClick={() => navigate("/compras-inmuebles")}>
            ＋ Comprar inmueble
          </button>
          <button
            className="inmueble-secondary-button"
            onClick={() => {
              setTipoModal("inmueble");
              setModalAbierto(true);
            }}
          >
            ＋ Agregar inmueble
          </button>
          <button className="inmueble-primary-button" onClick={() => abrirServicio(propiedadSeleccionada?.unidad || "APT-202", propiedadSeleccionada?.id || null)}>
            ＋ Nueva factura
          </button>
        </div>
      </header>
      {error && <div className="inmueble-empty" style={{ marginBottom: 12, color: '#b3261e' }}>{error}</div>}
      {cargando ? (
        <div className="inmueble-empty" style={{ marginBottom: 12 }}>Cargando inmuebles...</div>
      ) : null}
      <section className="inmueble-metrics">
        <div>
          <small>Unidades totales</small>
            <strong>{propiedadesConEstado.length}</strong>
          <span className="metric-icon metric-icon--green">⌂</span>
        </div>
        <div>
          <small>Ocupación</small>
          <strong>{ocupacion}%</strong>
          <span className="metric-trend">Unidades arrendadas</span>
        </div>
        <div>
          <small>Recaudación del mes</small>
          <strong>
            {dinero(recaudacionMes)}
          </strong>
          <span className="metric-icon metric-icon--yellow">$</span>
        </div>
        <div className="metric-alert">
          <small>Unidades en mora</small>
          <strong>{mora}</strong>
          <span className="metric-icon metric-icon--red">!</span>
        </div>
      </section>
      <section className="inmueble-panel inmueble-properties">
        <div className="inmueble-panel__heading">
          <div>
            <span className="inmueble-eyebrow">Vista general</span>
            <h2>Estado actual de inmuebles</h2>
          </div>
          <input
            className="inmueble-search"
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Buscar unidad o inquilino"
            aria-label="Buscar unidad o inquilino"
          />
        </div>
        <div className="inmueble-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Inquilino</th>
                <th>Canon mensual</th>
                <th>Día corte</th>
                <th>Estado canon</th>
                <th>Vencimiento contrato</th>
                <th>Servicios</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((propiedad) => (
                <tr key={propiedad.id}>
                  <td>
                    <strong>{propiedad.unidad}</strong>
                  </td>
                  <td>{propiedad.inquilino}</td>
                  <td>{dinero(propiedad.canon)}</td>
                  <td>{propiedad.corte}</td>
                  <td>
                    <Estado
                      tipo={
                        ["En mora", "Vence hoy"].includes(propiedad.canonEstado)
                          ? "danger"
                          : "success"
                      }
                    >
                      {propiedad.canonEstado}
                    </Estado>
                  </td>
                  <td>{propiedad.contrato}</td>
                  <td>
                    <Estado
                      tipo={
                        propiedad.servicioEstado === "Pendiente"
                          ? "warning"
                          : "success"
                      }
                    >
                      {propiedad.servicioEstado}
                    </Estado>
                  </td>
                  <td>
                    <button
                      className="inmueble-link-button"
                      onClick={() =>
                        navigate(`/gestion-inmuebles/${propiedad.id}`)
                      }
                    >
                      Ver detalles →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <ReportePendientes propiedades={propiedadesConEstado} servicios={servicios} />
      <AlertasPropietario propiedades={propiedadesConEstado} servicios={servicios} onOpenProperty={(id) => id && navigate(`/gestion-inmuebles/${id}`)} />
      {modalAbierto && (
        tipoModal === "servicio" ? (
          <FormularioServicio
            inmuebles={propiedadesConEstado}
            unidadInicial={unidadServicioActiva}
            inmuebleId={inmuebleServicioActiva}
            onClose={() => setModalAbierto(false)}
            onSave={agregarServicio}
          />
        ) : (
          <FormularioInmueble
            onClose={() => setModalAbierto(false)}
            onSave={agregarPropiedad}
          />
        )
      )}
    </main>
  );
}
