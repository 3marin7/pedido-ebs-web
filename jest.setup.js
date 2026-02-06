// jest.setup.js
import '@testing-library/jest-dom'

// Mock para import.meta (usado por Vite)
Object.defineProperty(globalThis, 'import', {
  value: {
    meta: {
      env: {
        VITE_SUPABASE_URL: 'https://jqkfykverasqwlfsjsnj.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-key',
      },
    },
  },
  writable: false,
})

// Limpieza después de cada test
afterEach(() => {
  jest.clearAllMocks()
})
