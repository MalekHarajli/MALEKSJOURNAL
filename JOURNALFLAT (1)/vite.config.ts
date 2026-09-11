import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Every file lives at the project root, so there is no public/ directory to copy.
export default defineConfig({
  plugins: [react()],
  publicDir: false,
})
