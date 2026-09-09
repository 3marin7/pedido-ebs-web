import { supabase } from './supabase';

const parseNumber = (value) => {
  const numero = Number(value);
  return Number.isFinite(numero) ? numero : 0;
};

const parseDateToIso = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return null;

  return fecha.toISOString().slice(0, 10);
};

const parseDisplayDate = (value) => {
  if (!value) return 'Sin fecha';

  const fecha = /^\d{4}-\d{2}-\d{2}/.test(String(value))
    ? (() => {
      const [anio, mes, dia] = String(value).slice(0, 10).split('-').map(Number);
      return new Date(anio, mes - 1, dia);
    })()
    : new Date(value);
  if (Number.isNaN(fecha.getTime())) {
    return value;
  }

  return fecha.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const subirEvidenciaCloudinary = async (archivo, referencia, carpeta = 'evidencias_servicios') => {
  const formulario = new FormData();
  formulario.append('file', archivo);
  formulario.append('upload_preset', 'catalogo_productos_web');
  formulario.append('folder', `${carpeta}/${referencia}`);

  const respuesta = await fetch(
    'https://api.cloudinary.com/v1_1/dstnroimw/image/upload',
    {
      method: 'POST',
      body: formulario,
    },
  );

  const resultado = await respuesta.json();
  if (!respuesta.ok || !resultado.secure_url) {
    throw new Error(resultado.error?.message || 'Cloudinary no devolvió la URL de la evidencia');
  }

  return resultado.secure_url;
};

export const normalizarInmueble = (registro) => ({
  id: registro.id,
  unidad: registro.unidad || 'Sin unidad',
  inquilino: registro.inquilino || 'Sin asignar',
  telefonoInquilino: registro.telefono_inquilino || '',
  canon: parseNumber(registro.canon),
  corte: parseNumber(registro.dia_corte ?? registro.corte ?? 5),
  canonEstado: registro.estado_canon || 'Al día',
  contrato: registro.contrato_fecha ? parseDisplayDate(registro.contrato_fecha) : 'Sin fecha',
  servicioEstado: registro.estado_servicio || 'Al día',
  _raw: registro,
});

export const normalizarServicio = (registro) => ({
  id: registro.id,
  unidad: registro.unidad || 'Sin unidad',
  referenciaPago: registro.referencia_pago || '',
  recurrente: Boolean(registro.recurrente ?? true),
  diaVencimiento: parseNumber(registro.dia_vencimiento ?? registro.diaVencimiento ?? 0),
  tipo: registro.tipo || 'Servicio',
  periodo: registro.periodo || 'Sin período',
  monto: parseNumber(registro.monto),
  vencimiento: registro.vencimiento ? parseDisplayDate(registro.vencimiento) : 'Sin fecha',
  responsable: registro.responsable || 'Inquilino',
  estado: registro.estado || 'Pendiente',
  evidenciaUrl: registro.evidencia_url || '',
  evidenciaReciboUrl: registro.evidencia_recibo_url || '',
  inmueble_id: registro.inmueble_id || null,
  _raw: registro,
});

export const normalizarPago = (registro) => ({
  id: registro.id,
  periodo: registro.periodo || 'Sin período',
  monto: parseNumber(registro.monto),
  fecha: registro.fecha_pago ? parseDisplayDate(registro.fecha_pago) : 'Sin fecha',
  estado: registro.estado || 'Al día',
  evidenciaUrl: registro.evidencia_url || '',
  inmueble_id: registro.inmueble_id || null,
  _raw: registro,
});

export const normalizarCompraInmueble = (registro) => ({
  id: registro.id,
  nombre: registro.nombre || 'Inmueble sin nombre',
  direccion: registro.direccion || '',
  valorTotal: parseNumber(registro.valor_total),
  fechaCompra: registro.fecha_compra || '',
  notas: registro.notas || '',
});

export const normalizarAbonoInmueble = (registro) => ({
  id: registro.id,
  compraId: registro.compra_id,
  valor: parseNumber(registro.valor),
  fechaAbono: registro.fecha_abono || '',
  abonadoPor: registro.abonado_por || 'Sin registrar',
  evidenciaUrl: registro.evidencia_url || '',
  nota: registro.nota || '',
});

export const normalizarGastoInmueble = (registro) => ({
  id: registro.id,
  compraId: registro.compra_id,
  concepto: registro.concepto || 'Otro gasto',
  valor: parseNumber(registro.valor),
  fechaGasto: registro.fecha_gasto || '',
  pagadoPor: registro.pagado_por || 'Sin registrar',
});

export const fetchInmueblesFromSupabase = async () => {
  const { data, error } = await supabase
    .from('inmuebles')
    .select('*')
    .order('unidad', { ascending: true });

  if (error) {
    console.warn('No se pudo cargar inmuebles desde Supabase:', error.message);
    return [];
  }

  return (data || []).map(normalizarInmueble);
};

export const fetchServiciosFromSupabase = async () => {
  const { data, error } = await supabase
    .from('servicios_publicos')
    .select('*')
    .order('vencimiento', { ascending: true, nullsFirst: false });

  if (error) {
    console.warn('No se pudo cargar servicios desde Supabase:', error.message);
    return [];
  }

  const inmuebles = await fetchInmueblesFromSupabase();
  const lookup = new Map(inmuebles.map((inmueble) => [inmueble.id, inmueble.unidad]));

  return (data || []).map((registro) => {
    const servicio = normalizarServicio(registro);
    servicio.unidad = lookup.get(registro.inmueble_id) || 'Sin unidad';
    return servicio;
  });
};

export const fetchPagosFromSupabase = async (inmuebleId) => {
  const { data, error } = await supabase
    .from('pagos_arriendo')
    .select('*')
    .eq('inmueble_id', inmuebleId)
    .order('fecha_pago', { ascending: false });

  if (error) {
    console.warn('No se pudo cargar pagos desde Supabase:', error.message);
    return [];
  }

  return (data || []).map(normalizarPago);
};

export const fetchComprasInmuebleFromSupabase = async () => {
  const { data, error } = await supabase
    .from('compras_inmuebles')
    .select('*')
    .order('fecha_compra', { ascending: false });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data || []).map(normalizarCompraInmueble);
};

export const crearCompraInmuebleEnSupabase = async (compra) => {
  const { data, error } = await supabase
    .from('compras_inmuebles')
    .insert([{
      nombre: compra.nombre.trim(),
      direccion: compra.direccion?.trim() || null,
      valor_total: parseNumber(compra.valorTotal),
      fecha_compra: compra.fechaCompra,
      notas: compra.notas?.trim() || null,
    }])
    .select()
    .single();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return normalizarCompraInmueble(data);
};

export const fetchAbonosInmuebleFromSupabase = async (compraId) => {
  const { data, error } = await supabase
    .from('abonos_inmueble')
    .select('*')
    .eq('compra_id', compraId)
    .order('fecha_abono', { ascending: false });
  if (error) throw new Error(`Supabase: ${error.message}`);
  return (data || []).map(normalizarAbonoInmueble);
};

export const crearAbonoInmuebleEnSupabase = async (compraId, abono) => {
  let evidenciaUrl = '';
  if (abono.evidenciaFile) {
    try {
      evidenciaUrl = await subirEvidenciaCloudinary(abono.evidenciaFile, compraId, 'evidencias_compras');
    } catch (uploadError) {
      throw new Error(`Cloudinary: ${uploadError.message}`);
    }
  }
  const { data, error } = await supabase
    .from('abonos_inmueble')
    .insert([{
      compra_id: compraId,
      valor: parseNumber(abono.valor),
      fecha_abono: abono.fechaAbono,
      abonado_por: abono.abonadoPor.trim(),
      evidencia_url: evidenciaUrl || null,
      nota: abono.nota?.trim() || null,
    }])
    .select()
    .single();
  if (error) {
    const mensaje = error.message.includes("evidencia_url")
      ? 'Falta crear la columna evidencia_url en abonos_inmueble. Ejecuta sql/FIX_COMPRAS_INMUEBLES_RLS.sql en Supabase.'
      : `Supabase: ${error.message}`;
    throw new Error(mensaje);
  }
  return normalizarAbonoInmueble(data);
};

export const fetchGastosInmuebleFromSupabase = async (compraId) => {
  const { data, error } = await supabase.from('gastos_inmueble').select('*').eq('compra_id', compraId).order('fecha_gasto', { ascending: false });
  if (error) {
    console.warn('No se pudieron cargar gastos adicionales; se muestran como cero:', error.message);
    return [];
  }
  return (data || []).map(normalizarGastoInmueble);
};

export const crearGastoInmuebleEnSupabase = async (compraId, gasto) => {
  const { data, error } = await supabase.from('gastos_inmueble').insert([{
    compra_id: compraId,
    concepto: gasto.concepto.trim(),
    valor: parseNumber(gasto.valor),
    fecha_gasto: gasto.fechaGasto,
    pagado_por: gasto.pagadoPor,
  }]).select().single();
  if (error) throw new Error(`Supabase: ${error.message}`);
  return normalizarGastoInmueble(data);
};

export const crearInmuebleEnSupabase = async (propiedad) => {
  const payload = {
    unidad: propiedad.unidad,
    inquilino: propiedad.inquilino,
    telefono_inquilino: propiedad.telefonoInquilino || null,
    canon: parseNumber(propiedad.canon),
    dia_corte: parseNumber(propiedad.corte),
    contrato_fecha: parseDateToIso(propiedad.contrato),
    estado_canon: propiedad.canonEstado || 'Al día',
    estado_servicio: propiedad.servicioEstado || 'Al día',
  };

  const { data, error } = await supabase
    .from('inmuebles')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.warn('No se pudo crear inmueble en Supabase:', error.message);
    return null;
  }

  return normalizarInmueble(data);
};

export const actualizarTelefonoInquilinoEnSupabase = async (inmuebleId, telefono) => {
  const { data, error } = await supabase
    .from('inmuebles')
    .update({ telefono_inquilino: telefono.trim() || null })
    .eq('id', inmuebleId)
    .select()
    .single();

  if (error) {
    console.warn('No se pudo actualizar el teléfono del inquilino:', error.message);
    throw new Error(`Supabase: ${error.message}`);
  }

  return normalizarInmueble(data);
};

export const actualizarInmuebleEnSupabase = async (inmuebleId, propiedad) => {
  const { data, error } = await supabase
    .from('inmuebles')
    .update({
      inquilino: propiedad.inquilino,
      telefono_inquilino: propiedad.telefonoInquilino || null,
      canon: parseNumber(propiedad.canon),
      contrato_fecha: parseDateToIso(propiedad.contrato),
    })
    .eq('id', inmuebleId)
    .select()
    .single();

  if (error) {
    console.warn('No se pudo actualizar el inmueble:', error.message);
    throw new Error(`Supabase: ${error.message}`);
  }

  return normalizarInmueble(data);
};

export const crearServicioEnSupabase = async (servicio) => {
  const inmuebleId = servicio.inmueble_id || servicio.id_inmueble || null;
  let inmueble = null;

  if (inmuebleId) {
    const { data, error } = await supabase
      .from('inmuebles')
      .select('*')
      .eq('id', inmuebleId)
      .maybeSingle();

    if (!error) inmueble = data ? normalizarInmueble(data) : null;
  }

  if (!inmueble && servicio.unidad) {
    inmueble = await buscarInmueblePorUnidad(servicio.unidad);
  }

  if (!inmueble) {
    console.warn('No se encontró el inmueble para guardar el servicio:', servicio.unidad);
    return null;
  }

  let evidenciaUrl = servicio.evidenciaUrl || '';
  let evidenciaReciboUrl = servicio.evidenciaReciboUrl || '';
  const evidencias = [
    { archivo: servicio.evidenciaPagoFile, nombre: 'pago' },
    { archivo: servicio.evidenciaReciboFile, nombre: 'recibo' },
  ];
  for (const evidencia of evidencias) {
    if (!evidencia.archivo) continue;
    try {
      const url = await subirEvidenciaCloudinary(evidencia.archivo, inmueble.id);
      if (evidencia.nombre === 'recibo') evidenciaReciboUrl = url;
      else evidenciaUrl = url;
    } catch (uploadError) {
      console.warn(`No se pudo subir la evidencia de ${evidencia.nombre} del servicio a Cloudinary:`, uploadError.message);
      throw new Error(`Cloudinary: ${uploadError.message}`);
    }
  }

  const payload = {
    inmueble_id: inmueble.id,
    tipo: servicio.tipo,
    referencia_pago: servicio.referenciaPago || '',
    periodo: servicio.periodo,
    monto: parseNumber(servicio.monto),
    vencimiento: parseDateToIso(servicio.vencimiento),
    responsable: servicio.responsable || 'Inquilino',
    estado: servicio.estado || 'Pendiente',
    recurrente: Boolean(servicio.recurrente ?? true),
    evidencia_url: evidenciaUrl || null,
    evidencia_recibo_url: evidenciaReciboUrl || null,
  };

  const { data, error } = await supabase
    .from('servicios_publicos')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.warn('No se pudo crear servicio en Supabase:', error.message);
    throw new Error(`Supabase: ${error.message}`);
  }

  return normalizarServicio(data);
};

export const actualizarServicioEnSupabase = async (id, monto) => {
  const { data, error } = await supabase
    .from('servicios_publicos')
    .update({ monto: parseNumber(monto) })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.warn('No se pudo actualizar servicio en Supabase:', error.message);
    return null;
  }

  return normalizarServicio(data);
};

export const crearPagoEnSupabase = async (inmuebleId, pago) => {
  let evidenciaUrl = pago.evidenciaUrl || '';
  if (pago.evidenciaFile) {
    try {
      evidenciaUrl = await subirEvidenciaCloudinary(pago.evidenciaFile, inmuebleId);
    } catch (uploadError) {
      console.warn('No se pudo subir la evidencia del pago de arriendo:', uploadError.message);
      throw new Error(`Cloudinary: ${uploadError.message}`);
    }
  }

  const payload = {
    inmueble_id: inmuebleId,
    periodo: pago.periodo,
    monto: parseNumber(pago.monto),
    fecha_pago: parseDateToIso(pago.fecha),
    estado: pago.estado || 'Al día',
    evidencia_url: evidenciaUrl || null,
  };

  const { data, error } = await supabase
    .from('pagos_arriendo')
    .insert([payload])
    .select()
    .single();

  if (error) {
    console.warn('No se pudo registrar pago en Supabase:', error.message);
    throw new Error(`Supabase: ${error.message}`);
  }

  return normalizarPago(data);
};

export const buscarInmueblePorUnidad = async (unidad) => {
  const { data, error } = await supabase
    .from('inmuebles')
    .select('*')
    .ilike('unidad', unidad)
    .maybeSingle();

  if (error) {
    console.warn('No se pudo buscar inmueble por unidad:', error.message);
    return null;
  }

  return data ? normalizarInmueble(data) : null;
};
