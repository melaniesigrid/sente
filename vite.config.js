import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// BASE_PATH overrides the base for a build served from a subdirectory. The site
// is at the root of joseki.online and dev is "/", so nothing sets it any more.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
