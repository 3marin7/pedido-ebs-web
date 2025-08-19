import { createClient } from '@supabase/supabase-js'

// Configuración de Supabase (usa variables de entorno para mayor seguridad)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jqkfykverasqwlfsjsnj.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa2Z5a3ZlcmFzcXdsZnNqc25qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NjU2ODEsImV4cCI6MjA3MDM0MTY4MX0.5Ep9I5N7bEYXj7OdsdiYacR-GM8X586Zv8KsDycLS70'

// Crea y exporta el cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseKey)