import { createClient } from '@supabase/supabase-js';

const env = typeof globalThis !== 'undefined' ? globalThis.__APP_ENV__ || {} : {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY antes de iniciar la aplicación.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Cuenta cuya contraseña autoriza acciones sensibles (ej. eliminar facturas)
export const EMAIL_AUTORIZACION = '3marin7@gmail.com';

let clienteVerificacion = null;

// Inicia sesión con la cuenta de autorización en un cliente aparte que no
// guarda sesión (no reemplaza la sesión del usuario actual), ejecuta la acción
// con esa cuenta y cierra la sesión temporal.
// Devuelve { autorizado: false } si la contraseña es incorrecta.
export const ejecutarConAutorizacion = async (password, accion) => {
  if (!clienteVerificacion) {
    clienteVerificacion = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: 'ebs-verificacion' }
    });
  }

  const { error } = await clienteVerificacion.auth.signInWithPassword({
    email: EMAIL_AUTORIZACION,
    password
  });

  if (error) return { autorizado: false };

  try {
    const resultado = accion ? await accion(clienteVerificacion) : undefined;
    return { autorizado: true, resultado };
  } finally {
    await clienteVerificacion.auth.signOut({ scope: 'local' });
  }
};

export const verificarClaveAutorizacion = async (password) =>
  (await ejecutarConAutorizacion(password)).autorizado;
