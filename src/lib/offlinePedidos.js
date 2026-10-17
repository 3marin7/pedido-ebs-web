import localforage from 'localforage';

// Almacenamiento local (IndexedDB) para trabajar con internet malo o sin conexión
const store = localforage.createInstance({ name: 'pedido-ebs', storeName: 'offline' });

const CLAVE_PRODUCTOS = 'catalogo_productos';
const CLAVE_COLA = 'pedidos_pendientes';
const CLAVE_SINCRONIZADOS = 'pedidos_sincronizados_sin_whatsapp';

export const TIEMPO_ESPERA_MS = 15000;

// Rechaza si la promesa tarda más de `ms` (conexión muy lenta = sin conexión)
export const conTiempoLimite = (promesa, ms = TIEMPO_ESPERA_MS) =>
  Promise.race([
    promesa,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado (conexión lenta)')), ms)
    )
  ]);

export const esErrorDeRed = (error) => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const mensaje = String(error?.message || error || '').toLowerCase();
  return [
    'failed to fetch',
    'load failed',
    'networkerror',
    'network request failed',
    'tiempo de espera agotado',
    'fetch failed'
  ].some((texto) => mensaje.includes(texto));
};

// ---------- Catálogo de productos ----------

export const guardarProductosEnCache = async (productos) => {
  try {
    await store.setItem(CLAVE_PRODUCTOS, { productos, fecha: new Date().toISOString() });
  } catch (error) {
    console.warn('No se pudo guardar el catálogo en el dispositivo:', error);
  }
};

export const leerProductosDeCache = async () => {
  try {
    return await store.getItem(CLAVE_PRODUCTOS);
  } catch {
    return null;
  }
};

// ---------- Cola de pedidos pendientes ----------

export const obtenerPedidosPendientes = async () => {
  try {
    return (await store.getItem(CLAVE_COLA)) || [];
  } catch {
    return [];
  }
};

export const encolarPedido = async (pedido) => {
  const pendientes = await obtenerPedidosPendientes();
  const idLocal = `OFF-${Date.now().toString(36).toUpperCase()}`;
  pendientes.push({ idLocal, pedido });
  await store.setItem(CLAVE_COLA, pendientes);
  return idLocal;
};

export const obtenerSincronizadosSinWhatsApp = async () => {
  try {
    return (await store.getItem(CLAVE_SINCRONIZADOS)) || [];
  } catch {
    return [];
  }
};

export const marcarWhatsAppEnviado = async (id) => {
  const lista = await obtenerSincronizadosSinWhatsApp();
  const restante = lista.filter((item) => item.id !== id);
  await store.setItem(CLAVE_SINCRONIZADOS, restante);
  return restante;
};

// Busca si el pedido ya llegó al servidor (p. ej. se envió pero la respuesta se perdió)
const buscarPedidoExistente = async (supabase, pedido) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id')
    .eq('cliente_telefono', pedido.cliente_telefono)
    .eq('fecha_creacion', pedido.fecha_creacion)
    .limit(1);
  if (error) {
    if (esErrorDeRed(error)) throw error;
    return null; // Sin permiso de lectura u otro problema: se intenta insertar igual
  }
  return data?.[0]?.id ?? null;
};

let sincronizando = false;

// Envía al servidor los pedidos guardados sin conexión. Devuelve los que se enviaron.
export const sincronizarPedidosPendientes = async (supabase) => {
  if (sincronizando) return { enviados: [], pendientes: (await obtenerPedidosPendientes()).length };
  sincronizando = true;
  const enviados = [];

  try {
    let pendientes = await obtenerPedidosPendientes();

    for (const item of [...pendientes]) {
      try {
        let id = await conTiempoLimite(buscarPedidoExistente(supabase, item.pedido));

        if (!id) {
          const { data, error } = await conTiempoLimite(
            supabase.from('pedidos').insert([item.pedido]).select('id')
          );
          if (error) throw error;
          id = data?.[0]?.id;
          if (!id) throw new Error('El servidor no devolvió número de pedido');
        }

        enviados.push({ id, idLocal: item.idLocal, pedido: item.pedido });
        pendientes = pendientes.filter((p) => p.idLocal !== item.idLocal);
        await store.setItem(CLAVE_COLA, pendientes);
      } catch (error) {
        console.warn(`No se pudo sincronizar el pedido ${item.idLocal}:`, error);
        if (esErrorDeRed(error)) break; // Sin conexión: se reintenta más tarde
      }
    }

    if (enviados.length > 0) {
      const sinWhatsApp = await obtenerSincronizadosSinWhatsApp();
      await store.setItem(CLAVE_SINCRONIZADOS, [...sinWhatsApp, ...enviados]);
    }

    return { enviados, pendientes: pendientes.length };
  } finally {
    sincronizando = false;
  }
};
