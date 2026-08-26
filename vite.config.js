import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      __APP_ENV__: JSON.stringify(env)
    },
    server: {
      hmr: {
        overlay: false // Puedes desactivar temporalmente el overlay
      }
    }
  }
})