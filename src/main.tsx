import { createRoot } from 'react-dom/client'
import App from './App'
import './style.css'

createRoot(document.getElementById('root')!).render(<App />)

// Đăng ký service worker (chỉ ở bản build) để cài được như app và học offline.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => {}) })
}
