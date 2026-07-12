import { resolve } from 'node:path'
import { defineConfig } from 'vite'

// Multi-page app: every screen is its own HTML entry point (no SPA).
const root = import.meta.dirname

export default defineConfig({
  root,
  build: {
    target: 'es2020',
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        listing: resolve(root, 'listing.html'),
        sell: resolve(root, 'sell.html'),
        edit: resolve(root, 'edit.html'),
        dashboard: resolve(root, 'dashboard.html'),
        login: resolve(root, 'login.html'),
        register: resolve(root, 'register.html'),
        profile: resolve(root, 'profile.html'),
        admin: resolve(root, 'admin.html'),
      },
    },
  },
})
