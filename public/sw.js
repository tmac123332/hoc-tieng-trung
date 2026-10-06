// Service worker: giúp app chạy offline.
// - Âm thanh và tệp tĩnh: lấy từ bộ nhớ đệm trước (cache-first).
// - Trang chính (index.html): thử mạng trước để nhận bản cập nhật, mất mạng thì dùng bản đã lưu.
const CACHE = 'htt-v1'

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await cache.addAll(['./', './manifest.webmanifest', './icons/icon-192.png', './audio/manifest.json'])
    // Tải sẵn toàn bộ âm thanh để học được khi không có mạng.
    try {
      const files = Object.values(await (await fetch('./audio/manifest.json')).json())
      await Promise.all(files.map(f => cache.add('./audio/' + f).catch(() => {})))
    } catch { /* bỏ qua, sẽ lưu dần khi dùng */ }
    self.skipWaiting()
  })())
})

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k)
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', e => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { caches.open(CACHE).then(c => c.put('./', r.clone())); return r })
      .catch(() => caches.match('./')))
    return
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) caches.open(CACHE).then(c => c.put(req, r.clone()))
    return r
  })))
})
