// jest.setup.js
import '@testing-library/jest-dom'

// Variables de entorno para compatibilidad con Vite y pruebas
globalThis.__APP_ENV__ = {
  VITE_SUPABASE_URL: 'https://jqkfykverasqwlfsjsnj.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'test-key',
  VITE_PUBLIC_CATALOG_BASE_URL: '',
  VITE_PUBLIC_APP_URL: '',
  VITE_COOPIDROGAS_URL: '',
  VITE_COOPIDROGAS_ANON_KEY: '',
}

// Limpieza después de cada test
afterEach(() => {
  jest.clearAllMocks()
})
