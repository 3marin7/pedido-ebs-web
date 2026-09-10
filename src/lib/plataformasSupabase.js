import { supabase } from './supabase';

const numero = (valor) => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
};

const serviciosDe = (plataforma) => [
  plataforma.servicio_supabase && 'Supabase',
  plataforma.servicio_cloudinary && 'Cloudinary',
  plataforma.servicio_github && 'GitHub',
  plataforma.servicio_correo && 'Correo electrónico',
].filter(Boolean);

export const normalizarPlataforma = (registro) => ({
  id: registro.id_plataforma || registro.id,
  clienteId: registro.id_cliente_plataforma,
  nombreCliente: registro.nombre_contacto || 'Sin contacto',
  telefonoCliente: registro.telefono_contacto || '',
  correoCliente: registro.correo_contacto || '',
  nombre: registro.nombre_plataforma || 'Sin nombre',
  proveedorDespliegue: registro.proveedor_despliegue || '',
  urlProduccion: registro.url_produccion || '',
  contrato: registro.numero_contrato || 'Sin contrato',
  fechaInicio: registro.fecha_inicio_arriendo || '',
  fechaFin: registro.fecha_fin_arriendo || '',
  diaCorte: numero(registro.dia_corte || 5),
  valorMensual: numero(registro.valor_mensual ?? registro.canon_pago),
  servicios: registro.servicios_infraestructura
    ? registro.servicios_infraestructura.split(', ')
    : serviciosDe(registro),
  estado: registro.estado || 'ACTIVO',
  _raw: registro,
});

export const normalizarPagoPlataforma = (registro) => ({
  id: registro.id_pago || registro.id,
  plataformaId: registro.id_plataforma,
  periodo: registro.periodo,
  periodoHasta: registro.periodo_hasta || registro.periodo,
  frecuencia: String(registro.frecuencia || 'MENSUAL').trim().toUpperCase(),
  monto: numero(registro.monto),
  fechaPago: registro.fecha_pago || '',
  estado: String(registro.estado || 'PENDIENTE').trim().toUpperCase(),
  evidenciaUrl: registro.evidencia_url || '',
  _raw: registro,
});

export const normalizarCredencial = (registro) => ({
  id: registro.id_credencial,
  plataformaId: registro.id_plataforma,
  proveedor: registro.proveedor,
  usuario: registro.usuario_o_email,
  url: registro.url_acceso || '',
  ultimaActualizacion: registro.ultima_actualizacion || '',
  totalRotaciones: Number(registro.total_rotaciones || 0),
});

const capturarError = (error, contexto) => {
  if (error) throw new Error(`${contexto}: ${error.message}`);
};

export const fetchPlataformas = async () => {
  const { data, error } = await supabase
    .from('vista_control_plataformas_arriendo')
    .select('*')
    .order('nombre_plataforma', { ascending: true });
  capturarError(error, 'Supabase');
  return (data || []).map(normalizarPlataforma);
};

export const fetchPagosPlataforma = async (plataformaId) => {
  const { data, error } = await supabase
    .from('pagos_plataforma')
    .select('*')
    .eq('id_plataforma', plataformaId)
    .order('periodo', { ascending: false });
  capturarError(error, 'Supabase');
  return (data || []).map(normalizarPagoPlataforma);
};

export const fetchCredencialesPlataforma = async (plataformaId) => {
  const { data, error } = await supabase
    .from('credenciales_plataforma')
    .select('id_credencial,id_plataforma,proveedor,usuario_o_email,url_acceso,ultima_actualizacion')
    .eq('id_plataforma', plataformaId)
    .order('proveedor', { ascending: true });
  capturarError(error, 'Supabase');
  return (data || []).map(normalizarCredencial);
};

export const fetchAuditoriaCredenciales = async () => {
  const { data, error } = await supabase
    .from('vista_seguimiento_credenciales')
    .select('*')
    .order('fecha_ultimo_cambio', { ascending: false });
  capturarError(error, 'Supabase');
  return data || [];
};

export const crearPlataforma = async (formulario) => {
  const { data: cliente, error: clienteError } = await supabase
    .from('clientes_plataforma')
    .insert({
      nombre_contacto: formulario.nombreCliente.trim(),
      telefono_contacto: formulario.telefonoCliente.trim(),
      correo_contacto: formulario.correoCliente.trim() || null,
    })
    .select('id_cliente_plataforma')
    .single();
  capturarError(clienteError, 'No se pudo crear el contacto');

  const { data, error } = await supabase
    .from('plataformas_arriendo')
    .insert({
      id_cliente_plataforma: cliente.id_cliente_plataforma,
      nombre_plataforma: formulario.nombre.trim(),
      proveedor_despliegue: formulario.proveedorDespliegue.trim() || null,
      url_produccion: formulario.urlProduccion.trim() || null,
      numero_contrato: formulario.contrato.trim(),
      fecha_inicio_arriendo: formulario.fechaInicio,
      fecha_fin_arriendo: formulario.fechaFin || null,
      dia_corte: Number(formulario.diaCorte),
      valor_mensual: Number(formulario.valorMensual),
      servicio_supabase: formulario.servicios.includes('Supabase'),
      servicio_cloudinary: formulario.servicios.includes('Cloudinary'),
      servicio_github: formulario.servicios.includes('GitHub'),
      servicio_correo: formulario.servicios.includes('Correo electrónico'),
      estado: formulario.estado,
    })
    .select('*')
    .single();
  capturarError(error, 'No se pudo crear la plataforma');
  return normalizarPlataforma({ ...data, nombre_contacto: formulario.nombreCliente });
};

export const crearPagoPlataforma = async (pago) => {
  const { data, error } = await supabase
    .from('pagos_plataforma')
    .upsert({
      id_plataforma: pago.plataformaId,
      periodo: pago.periodo,
      periodo_hasta: pago.periodoHasta,
      frecuencia: pago.frecuencia,
      monto: Number(pago.monto),
      fecha_pago: pago.fechaPago || null,
      estado: pago.estado || 'PAGADO',
      evidencia_url: pago.evidenciaUrl || null,
    }, { onConflict: 'id_plataforma,periodo' })
    .select('*')
    .single();
  capturarError(error, 'No se pudo registrar el pago');
  return normalizarPagoPlataforma(data);
};

export const consultarCredencialesSeguras = async (contrato, claveMaestra) => {
  const { data, error } = await supabase.rpc('consultar_credenciales_seguras', {
    p_numero_contrato: contrato,
    p_clave_maestra: claveMaestra,
  });
  capturarError(error, 'No se pudieron consultar las credenciales');
  return data || [];
};

export const guardarCredencialSegura = async (credencial) => {
  const { data, error } = await supabase.rpc('guardar_credencial_segura', {
    p_id_plataforma: credencial.plataformaId,
    p_proveedor: credencial.proveedor,
    p_usuario_o_email: credencial.usuario,
    p_password_plana: credencial.password,
    p_url_acceso: credencial.url,
    p_notas_seguridad: credencial.notas || '',
    p_clave_maestra: credencial.claveMaestra,
  });
  capturarError(error, 'No se pudo guardar la credencial');
  return data;
};
