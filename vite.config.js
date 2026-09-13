import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// BASE_PATH overrides the base for a build served from a subdirectory. The site
// is at the root of joseki.online and dev is "/", so nothing sets it any more.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  /* Two suites need longer than vitest's 5s default, and neither is slow by
     mistake. The life-and-death tests search real positions, and the component
     suites transform the module graph before the first view can mount. Both sit
     under 8s alone and go past 5s only when 98 workers are contending, which is
     a red suite that proves nothing. The budget is for the machine, not the
     assertions. */
  test: { testTimeout: 15000 },
})
