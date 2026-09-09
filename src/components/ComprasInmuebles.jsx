import React, { useEffect, useMemo, useState } from "react";
import {
  crearAbonoInmuebleEnSupabase,
  crearCompraInmuebleEnSupabase,
  crearGastoInmuebleEnSupabase,
  fetchAbonosInmuebleFromSupabase,
  fetchGastosInmuebleFromSupabase,
  fetchComprasInmuebleFromSupabase,
} from "../lib/inmueblesSupabase";
import "./ComprasInmuebles.css";

const dinero = (valor) => `$${Number(valor || 0).toLocaleString("es-CO")}`;
const personasAbono = ["Edwin Marin", "Fabian Marin", "Jhon Marin", "Doris Chiguasuque"];
const fechaHoy = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
};
const formatearFecha = (valor) => {
  if (!valor) return "Sin fecha";
  const [anio, mes, dia] = String(valor).slice(0, 10).split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(anio, mes - 1, dia));
};

function ResumenCompra({ compra, abonos, gastos, onPrint, seleccionada, modoImpresion }) {
  const [filtrosAbonos, setFiltrosAbonos] = useState({ desde: "", hasta: "", persona: "todas" });
  const abonosFiltrados = useMemo(() => abonos.filter((abono) => {
    const fecha = String(abono.fechaAbono || "").slice(0, 10);
    return (!filtrosAbonos.desde || fecha >= filtrosAbonos.desde)
      && (!filtrosAbonos.hasta || fecha <= filtrosAbonos.hasta)
      && (filtrosAbonos.persona === "todas" || abono.abonadoPor === filtrosAbonos.persona);
  }), [abonos, filtrosAbonos]);
  const totalAbonado = abonos.reduce((total, abono) => total + abono.valor, 0);
  const totalGastos = gastos.reduce((total, gasto) => total + gasto.valor, 0);
  const costoTotal = compra.valorTotal + totalGastos;
  const totalAportes = totalAbonado + totalGastos;
  const saldo = Math.max(0, costoTotal - totalAportes);
  const progreso = costoTotal > 0 ? Math.min(100, (totalAportes / costoTotal) * 100) : 0;
  const aportesPorPersona = personasAbono.map((persona) => {
    const valorAbonos = abonos.filter((abono) => abono.abonadoPor === persona).reduce((total, abono) => total + abono.valor, 0);
    const valorGastos = gastos.filter((gasto) => gasto.pagadoPor === persona).reduce((total, gasto) => total + gasto.valor, 0);
    const valor = valorAbonos + valorGastos;
    return { persona, valor, valorAbonos, valorGastos, porcentaje: totalAportes > 0 ? (valor / totalAportes) * 100 : 0 };
  });
  return (
    <article className={`compra-card${seleccionada ? " compra-card--print-selected" : ""}`}>
      <div className="compra-card__heading">
        <div><span className="compra-eyebrow">Inmueble en compra</span><h2>{compra.nombre}</h2></div>
        <div className="compra-card__actions"><strong>{progreso.toFixed(0)}%</strong><button className="compra-button compra-button--small compra-print-button" type="button" onClick={() => onPrint(compra.id, "resumen")}>Imprimir informe</button><button className="compra-button compra-button--small compra-print-button compra-button--outline" type="button" onClick={() => onPrint(compra.id, "detalle")}>Informe detallado</button></div>
      </div>
      <p className="compra-address">{compra.direccion || "Dirección pendiente"}</p>
      <div className="compra-progress"><span style={{ width: `${progreso}%` }} /></div>
      <div className="compra-summary-grid">
        <div><small>Costo total</small><b>{dinero(costoTotal)}</b></div>
        <div><small>Abonos + gastos</small><b>{dinero(totalAportes)}</b></div>
        <div><small>Falta cancelar</small><b className={saldo ? "compra-balance" : "compra-paid"}>{dinero(saldo)}</b></div>
      </div>
      <div className="compra-gastos"><div className="compra-abonos-heading"><h3>Gastos adicionales</h3><small>{gastos.length} registro(s) · {dinero(totalGastos)}</small></div>{gastos.length ? <div className="compra-table-wrap"><table><thead><tr><th>Concepto</th><th>Valor</th><th>Fecha</th><th>Pagado por</th></tr></thead><tbody>{gastos.map((gasto) => <tr key={gasto.id}><td>{gasto.concepto}</td><td>{dinero(gasto.valor)}</td><td>{formatearFecha(gasto.fechaGasto)}</td><td>{gasto.pagadoPor}</td></tr>)}</tbody></table></div> : <p className="compra-empty">No hay gastos adicionales registrados.</p>}<GastoForm compraId={compra.id} onSaved={() => window.dispatchEvent(new CustomEvent("compras-inmuebles-updated"))} /></div>
      <div className="compra-card__meta">Compra: {formatearFecha(compra.fechaCompra)} · {abonos.length} abono(s)</div>
      <div className="compra-aportes">
        <div className="compra-abonos-heading"><h3>Participación por persona</h3><small>Sobre el total abonado</small></div>
        <div className="compra-aportes-grid">
          {aportesPorPersona.map((aporte) => <div key={aporte.persona}><span>{aporte.persona}</span><strong>{dinero(aporte.valor)}</strong><b>{aporte.porcentaje.toFixed(1)}%</b></div>)}
        </div>
      </div>
      <div className={`compra-print-report compra-print-report--summary${modoImpresion === "resumen" ? " compra-print-report--selected" : ""}`}>
        <header className="compra-print-header"><div><strong>CONTROL PATRIMONIAL</strong><span>Informe de participación en inmueble</span></div><small>Generado el {formatearFecha(fechaHoy())}</small></header>
        <div className="compra-print-rule" />
        <h1>{compra.nombre}</h1>
        <div className="compra-print-property"><p><strong>Dirección</strong><span>{compra.direccion || "Sin registrar"}</span></p><p><strong>Fecha de compra</strong><span>{formatearFecha(compra.fechaCompra)}</span></p></div>
        <div className="compra-print-totals"><span>Precio casa<strong>{dinero(compra.valorTotal)}</strong></span><span>Gastos adicionales<strong>{dinero(totalGastos)}</strong></span><span>Costo total<strong>{dinero(costoTotal)}</strong></span><span>Total aportado<strong>{dinero(totalAportes)}</strong></span><span>Saldo pendiente<strong>{dinero(saldo)}</strong></span></div>
        <h2>Participación de los abonantes</h2>
        <table className="compra-participacion-table"><colgroup><col /><col /><col /></colgroup><thead><tr><th>Persona</th><th>Total aportado</th><th>Participación</th></tr></thead><tbody>
          {aportesPorPersona.map((aporte) => <tr key={`print-${aporte.persona}`}><td>{aporte.persona}</td><td>{dinero(aporte.valor)}</td><td>{aporte.porcentaje.toFixed(1)}%</td></tr>)}
        </tbody></table>
        <p className="compra-print-note">La participación incluye los abonos al inmueble y los gastos adicionales pagados por cada persona.</p>
        <h2 className="compra-print-signatures-title">Firmas de los participantes</h2>
        <div className="compra-print-signatures">{aportesPorPersona.map((aporte) => <div key={`firma-${aporte.persona}`}><div className="compra-signature-line" /><strong>{aporte.persona}</strong><span>{aporte.porcentaje.toFixed(1)}% de participación</span><small>Firma</small></div>)}</div>
      </div>
      <div className={`compra-print-report compra-print-report--detail${modoImpresion === "detalle" ? " compra-print-report--selected" : ""}`}>
        <header className="compra-print-header"><div><strong>CONTROL PATRIMONIAL</strong><span>Informe detallado de movimientos</span></div><small>Generado el {formatearFecha(fechaHoy())}</small></header>
        <div className="compra-print-rule" /><h1>{compra.nombre}</h1>
        <div className="compra-print-property"><p><strong>Dirección</strong><span>{compra.direccion || "Sin registrar"}</span></p><p><strong>Fecha de compra</strong><span>{formatearFecha(compra.fechaCompra)}</span></p></div>
        <div className="compra-print-totals"><span>Precio casa<strong>{dinero(compra.valorTotal)}</strong></span><span>Gastos<strong>{dinero(totalGastos)}</strong></span><span>Costo total<strong>{dinero(costoTotal)}</strong></span><span>Total aportado<strong>{dinero(totalAportes)}</strong></span><span>Saldo<strong>{dinero(saldo)}</strong></span></div>
        <h2>Abonos realizados</h2><table className="compra-abonos-detail-table"><colgroup><col /><col /><col /><col /></colgroup><thead><tr><th>Fecha</th><th>Valor</th><th>Abonado por</th><th>Soporte</th></tr></thead><tbody>{abonosFiltrados.length ? abonosFiltrados.map((abono) => <tr key={`detail-abono-${abono.id}`}><td>{formatearFecha(abono.fechaAbono)}</td><td>{dinero(abono.valor)}</td><td>{abono.abonadoPor}</td><td>{abono.evidenciaUrl ? "Adjunto" : "Sin soporte"}</td></tr>) : <tr><td colSpan="4">No hay abonos que coincidan con los filtros</td></tr>}</tbody></table>
        <h2>Gastos adicionales</h2><table className="compra-gastos-detail-table"><colgroup><col /><col /><col /><col /></colgroup><thead><tr><th>Concepto</th><th>Valor</th><th>Fecha</th><th>Pagado por</th></tr></thead><tbody>{gastos.length ? gastos.map((gasto) => <tr key={`detail-gasto-${gasto.id}`}><td>{gasto.concepto}</td><td>{dinero(gasto.valor)}</td><td>{formatearFecha(gasto.fechaGasto)}</td><td>{gasto.pagadoPor}</td></tr>) : <tr><td colSpan="4">No hay gastos adicionales registrados</td></tr>}</tbody></table>
        <h2>Participación y firmas</h2><table className="compra-participacion-table"><thead><tr><th>Persona</th><th>Total aportado</th><th>Participación</th></tr></thead><tbody>{aportesPorPersona.map((aporte) => <tr key={`detail-persona-${aporte.persona}`}><td>{aporte.persona}</td><td>{dinero(aporte.valor)}</td><td>{aporte.porcentaje.toFixed(1)}%</td></tr>)}</tbody></table><div className="compra-print-signatures">{aportesPorPersona.map((aporte) => <div key={`detail-firma-${aporte.persona}`}><div className="compra-signature-line" /><strong>{aporte.persona}</strong><span>{aporte.porcentaje.toFixed(1)}% de participación</span><small>Firma</small></div>)}</div>
      </div>
      <div className="compra-abonos-heading"><div><h3>Historial de abonos</h3><small>{abonosFiltrados.length} de {abonos.length} registro(s)</small></div></div>
      <div className="compra-abonos-filters"><label>Desde<input type="date" value={filtrosAbonos.desde} onChange={(evento) => setFiltrosAbonos({ ...filtrosAbonos, desde: evento.target.value })} /></label><label>Hasta<input type="date" value={filtrosAbonos.hasta} onChange={(evento) => setFiltrosAbonos({ ...filtrosAbonos, hasta: evento.target.value })} /></label><label>Abonado por<select value={filtrosAbonos.persona} onChange={(evento) => setFiltrosAbonos({ ...filtrosAbonos, persona: evento.target.value })}><option value="todas">Todas las personas</option>{personasAbono.map((persona) => <option key={persona} value={persona}>{persona}</option>)}</select></label><button type="button" className="compra-filter-clear" onClick={() => setFiltrosAbonos({ desde: "", hasta: "", persona: "todas" })}>Limpiar</button></div>
      {abonosFiltrados.length ? (
        <div className="compra-table-wrap"><table><thead><tr><th>Fecha</th><th>Valor</th><th>Abonado por</th><th>Evidencia</th><th>Nota</th></tr></thead><tbody>
          {abonosFiltrados.map((abono) => <tr key={abono.id}><td>{formatearFecha(abono.fechaAbono)}</td><td>{dinero(abono.valor)}</td><td>{abono.abonadoPor}</td><td>{abono.evidenciaUrl ? <a href={abono.evidenciaUrl} target="_blank" rel="noreferrer">Ver consignación</a> : "Sin adjunto"}</td><td>{abono.nota || "-"}</td></tr>)}
        </tbody></table></div>
      ) : <p className="compra-empty">Aún no hay abonos registrados.</p>}
      <AbonoForm compraId={compra.id} onSaved={() => window.dispatchEvent(new CustomEvent("compras-inmuebles-updated"))} />
    </article>
  );
}

function AbonoForm({ compraId, onSaved }) {
  const [formulario, setFormulario] = useState({ valor: "", fechaAbono: fechaHoy(), abonadoPor: "", nota: "", evidenciaFile: null });
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const actualizar = (evento) => setFormulario((actual) => ({ ...actual, [evento.target.name]: evento.target.value }));
  const guardar = async (evento) => {
    evento.preventDefault();
    if (Number(formulario.valor) <= 0 || !formulario.abonadoPor.trim()) {
      setError("Ingresa un valor mayor que cero y quién realiza el abono.");
      return;
    }
    if (formulario.evidenciaFile && !formulario.evidenciaFile.type.startsWith("image/")) {
      setError("La evidencia debe ser una imagen.");
      return;
    }
    if (formulario.evidenciaFile && formulario.evidenciaFile.size > 5 * 1024 * 1024) {
      setError("La imagen no puede superar los 5 MB.");
      return;
    }
    try {
      setGuardando(true);
      setError("");
      const abono = await crearAbonoInmuebleEnSupabase(compraId, formulario);
      if (!abono) throw new Error("No se pudo guardar el abono.");
      setFormulario({ valor: "", fechaAbono: fechaHoy(), abonadoPor: "", nota: "", evidenciaFile: null });
      onSaved();
    } catch (guardarError) {
      setError(guardarError.message || "No se pudo guardar el abono.");
    } finally {
      setGuardando(false);
    }
  };
  return <form className="compra-abono-form" onSubmit={guardar}>
    <h3>Registrar abono</h3>
    <div className="compra-form-grid">
      <label>Valor<input name="valor" type="number" min="1" value={formulario.valor} onChange={actualizar} required /></label>
      <label>Fecha<input name="fechaAbono" type="date" value={formulario.fechaAbono} onChange={actualizar} required /></label>
      <label>Quién abona<select name="abonadoPor" value={formulario.abonadoPor} onChange={actualizar} required><option value="">Selecciona una persona</option>{personasAbono.map((persona) => <option key={persona} value={persona}>{persona}</option>)}</select></label>
      <label>Nota<input name="nota" value={formulario.nota} onChange={actualizar} placeholder="Opcional" /></label>
      <label>Evidencia<input name="evidenciaFile" type="file" accept="image/*" onChange={(evento) => setFormulario((actual) => ({ ...actual, evidenciaFile: evento.target.files?.[0] || null }))} />{formulario.evidenciaFile && <small>{formulario.evidenciaFile.name}</small>}</label>
    </div>
    {error && <p className="compra-error" role="alert">{error}</p>}
    <button className="compra-button compra-button--small" type="submit" disabled={guardando}>{guardando ? "Guardando..." : "Registrar abono"}</button>
  </form>;
}

function GastoForm({ compraId, onSaved }) {
  const [formulario, setFormulario] = useState({ concepto: "", valor: "", fechaGasto: fechaHoy(), pagadoPor: "" });
  const [error, setError] = useState("");
  const guardar = async (evento) => {
    evento.preventDefault();
    if (!formulario.concepto.trim() || Number(formulario.valor) <= 0 || !formulario.pagadoPor) {
      setError("Ingresa concepto, valor y quién pagó el gasto.");
      return;
    }
    try {
      await crearGastoInmuebleEnSupabase(compraId, formulario);
      setFormulario({ concepto: "", valor: "", fechaGasto: fechaHoy(), pagadoPor: "" });
      setError("");
      onSaved();
    } catch (guardarError) {
      setError(guardarError.message || "No se pudo guardar el gasto.");
    }
  };
  return <form className="compra-gasto-form" onSubmit={guardar}><h3>Agregar gasto</h3><div className="compra-form-grid"><label>Concepto<input name="concepto" value={formulario.concepto} onChange={(evento) => setFormulario({ ...formulario, concepto: evento.target.value })} placeholder="Escrituración, registro..." required /></label><label>Valor<input name="valor" type="number" min="1" value={formulario.valor} onChange={(evento) => setFormulario({ ...formulario, valor: evento.target.value })} required /></label><label>Fecha<input name="fechaGasto" type="date" value={formulario.fechaGasto} onChange={(evento) => setFormulario({ ...formulario, fechaGasto: evento.target.value })} required /></label><label>Pagado por<select name="pagadoPor" value={formulario.pagadoPor} onChange={(evento) => setFormulario({ ...formulario, pagadoPor: evento.target.value })} required><option value="">Selecciona una persona</option>{personasAbono.map((persona) => <option key={persona} value={persona}>{persona}</option>)}</select></label></div>{error && <p className="compra-error">{error}</p>}<button className="compra-button compra-button--small" type="submit">Agregar gasto</button></form>;
}

export default function ComprasInmuebles() {
  const [compras, setCompras] = useState([]);
  const [abonos, setAbonos] = useState({});
  const [gastos, setGastos] = useState({});
  const [formulario, setFormulario] = useState({ nombre: "", direccion: "", valorTotal: "", fechaCompra: fechaHoy(), notas: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [reporteParaImprimir, setReporteParaImprimir] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [orden, setOrden] = useState("recientes");

  const cargar = async () => {
    try {
      setCargando(true);
      const comprasActuales = await fetchComprasInmuebleFromSupabase();
      const abonosActuales = await Promise.all(comprasActuales.map(async (compra) => [compra.id, await fetchAbonosInmuebleFromSupabase(compra.id)]));
      const gastosActuales = await Promise.all(comprasActuales.map(async (compra) => [compra.id, await fetchGastosInmuebleFromSupabase(compra.id)]));
      setCompras(comprasActuales);
      setAbonos(Object.fromEntries(abonosActuales));
      setGastos(Object.fromEntries(gastosActuales));
      setError("");
    } catch (cargarError) {
      setError(cargarError.message || "No fue posible cargar las compras de inmuebles.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    const actualizar = () => cargar();
    window.addEventListener("compras-inmuebles-updated", actualizar);
    return () => window.removeEventListener("compras-inmuebles-updated", actualizar);
  }, []);

  const actualizar = (evento) => setFormulario((actual) => ({ ...actual, [evento.target.name]: evento.target.value }));
  const guardarCompra = async (evento) => {
    evento.preventDefault();
    if (Number(formulario.valorTotal) <= 0) {
      setError("El valor total del inmueble debe ser mayor que cero.");
      return;
    }
    try {
      const compra = await crearCompraInmuebleEnSupabase(formulario);
      if (!compra) throw new Error("No se pudo guardar la compra.");
      setFormulario({ nombre: "", direccion: "", valorTotal: "", fechaCompra: fechaHoy(), notas: "" });
      await cargar();
    } catch (guardarError) {
      setError(guardarError.message || "No se pudo guardar la compra.");
    }
  };

  const totalPendiente = useMemo(() => compras.reduce((total, compra) => {
    const abonado = (abonos[compra.id] || []).reduce((suma, abono) => suma + abono.valor, 0);
    const gastosCompra = (gastos[compra.id] || []).reduce((suma, gasto) => suma + gasto.valor, 0);
    return total + Math.max(0, compra.valorTotal + gastosCompra - abonado - gastosCompra);
  }, 0), [abonos, compras, gastos]);

  const comprasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return compras
      .filter((compra) => {
        const coincideTexto = !texto || `${compra.nombre} ${compra.direccion || ""} ${compra.notas || ""}`.toLowerCase().includes(texto);
        const totalAbonado = (abonos[compra.id] || []).reduce((total, abono) => total + abono.valor, 0);
        const totalGastos = (gastos[compra.id] || []).reduce((total, gasto) => total + gasto.valor, 0);
        const estaPagada = totalAbonado + totalGastos >= compra.valorTotal + totalGastos;
        const coincideEstado = filtroEstado === "todas"
          || (filtroEstado === "pendientes" && !estaPagada)
          || (filtroEstado === "pagadas" && estaPagada);
        return coincideTexto && coincideEstado;
      })
      .sort((a, b) => {
        if (orden === "nombre") return a.nombre.localeCompare(b.nombre, "es");
        if (orden === "saldo") {
          const saldoA = a.valorTotal - (abonos[a.id] || []).reduce((total, abono) => total + abono.valor, 0);
          const saldoB = b.valorTotal - (abonos[b.id] || []).reduce((total, abono) => total + abono.valor, 0);
          return saldoB - saldoA;
        }
        return String(b.fechaCompra).localeCompare(String(a.fechaCompra));
      });
  }, [abonos, busqueda, compras, filtroEstado, gastos, orden]);

  useEffect(() => {
    const limpiarSeleccion = () => setReporteParaImprimir(null);
    window.addEventListener("afterprint", limpiarSeleccion);
    return () => window.removeEventListener("afterprint", limpiarSeleccion);
  }, []);

  useEffect(() => {
    if (!reporteParaImprimir) return undefined;
    const frame = window.requestAnimationFrame(() => window.print());
    return () => window.cancelAnimationFrame(frame);
  }, [reporteParaImprimir]);

  const imprimirCompra = (compraId, modo = "resumen") => {
    setReporteParaImprimir({ compraId, modo });
  };

  return <main className="compras-shell">
    <header className="compras-hero"><div><span className="compra-eyebrow">Patrimonio</span><h1>Compra de inmuebles</h1><p>Controla nuevas compras, abonos y el saldo pendiente de cada propiedad.</p></div><div className="compras-hero-actions"><div className="compras-hero-total"><small>Total pendiente</small><strong>{dinero(totalPendiente)}</strong></div><button className="compra-button compra-print-button" type="button" onClick={() => imprimirCompra("todos")}>Imprimir todos</button></div></header>
    <section className="compras-panel"><div className="compras-panel__heading"><div><span className="compra-eyebrow">Nueva inversión</span><h2>Registrar inmueble por comprar</h2></div></div>
      <form className="compra-form" onSubmit={guardarCompra}><div className="compra-form-grid"><label>Nombre o referencia<input name="nombre" value={formulario.nombre} onChange={actualizar} placeholder="Ej. Apartamento 302" required /></label><label>Dirección<input name="direccion" value={formulario.direccion} onChange={actualizar} placeholder="Dirección del inmueble" /></label><label>Valor total<input name="valorTotal" type="number" min="1" value={formulario.valorTotal} onChange={actualizar} required /></label><label>Fecha de compra<input name="fechaCompra" type="date" value={formulario.fechaCompra} onChange={actualizar} required /></label><label className="compra-form-wide">Notas<input name="notas" value={formulario.notas} onChange={actualizar} placeholder="Opcional" /></label></div>{error && <p className="compra-error" role="alert">{error}</p>}<button className="compra-button" type="submit">＋ Guardar compra</button></form>
    </section>
    <section className="compras-list"><div className="compras-panel__heading"><div><span className="compra-eyebrow">Seguimiento</span><h2>Inmuebles en proceso de compra</h2></div><strong>{comprasFiltradas.length} de {compras.length} registro(s)</strong></div><div className="compras-filters"><label>Buscar inmueble<input type="search" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Nombre, dirección o nota" /></label><label>Estado<select value={filtroEstado} onChange={(evento) => setFiltroEstado(evento.target.value)}><option value="todas">Todos</option><option value="pendientes">Con saldo pendiente</option><option value="pagadas">Cancelados</option></select></label><label>Ordenar por<select value={orden} onChange={(evento) => setOrden(evento.target.value)}><option value="recientes">Más recientes</option><option value="nombre">Nombre</option><option value="saldo">Mayor saldo</option></select></label></div>{cargando ? <p className="compra-empty">Cargando compras...</p> : comprasFiltradas.length ? comprasFiltradas.map((compra) => <ResumenCompra key={compra.id} compra={compra} abonos={abonos[compra.id] || []} gastos={gastos[compra.id] || []} onPrint={imprimirCompra} seleccionada={reporteParaImprimir?.compraId === "todos" || reporteParaImprimir?.compraId === compra.id} modoImpresion={reporteParaImprimir?.compraId === "todos" ? reporteParaImprimir.modo : reporteParaImprimir?.compraId === compra.id ? reporteParaImprimir.modo : null} />) : <p className="compra-empty">No hay inmuebles que coincidan con la búsqueda.</p>}</section>
  </main>;
}
