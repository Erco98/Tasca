// Tasca: funziona anche senza internet.
// La pagina dell'app la chiede prima alla rete (così vedi subito l'ultima versione pubblicata) e usa la copia salvata solo offline;
// icone e manifest dalla copia salvata.
const CACHE = 'tasca-v2';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const page = req.mode === 'navigate' || /\/(index\.html)?$/.test(new URL(req.url).pathname);
  e.respondWith(caches.open(CACHE).then(async (c) => {
    if (page) {
      try { const r = await fetch(req, { cache: 'no-cache' }); if (r.ok) c.put('./index.html', r.clone()); return r; }
      catch { return (await c.match('./index.html')) || (await c.match('./')) || Response.error(); }
    }
    const hit = await c.match(req, { ignoreSearch: true });
    const fresh = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || fresh;
  }));
});
