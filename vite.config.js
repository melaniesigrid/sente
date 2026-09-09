import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// BASE_PATH is set by the Pages workflow to "/<repo>/"; unset locally, so dev is "/".
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
