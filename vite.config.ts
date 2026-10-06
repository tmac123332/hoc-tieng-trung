import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// base './' để bản build chạy được ở bất kỳ đường dẫn nào (GitHub Pages, Cloudflare Pages, Netlify…)
export default defineConfig({ base: './', plugins: [react()] })
