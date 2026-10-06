import { createClient } from '@supabase/supabase-js';

const env = typeof globalThis !== 'undefined' ? globalThis.__APP_ENV__ || {} : {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY antes de iniciar la aplicación.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
