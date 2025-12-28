import { defineConfig } from 'vite' // <--- ¡Esto resuelve "defineConfig is not defined"!
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // ** IMPORTANTE: Esta base asegura que GitHub Pages encuentre los archivos estáticos **

  plugins: [react()],
})