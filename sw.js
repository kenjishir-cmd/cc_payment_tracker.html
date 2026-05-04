/* sw.js - 離線萬用版 v3.7.2 */
const CACHE_NAME = 'credit-manager-v3.7.2';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.map(k => k !== CACHE_NAME ? caches.delete(k) : null))));
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;
  e.respondWith(
    caches.open(CACHE_NAME).then(c => {
      return c.match(e.request).then(res => {
        const fetchUpdate = fetch(e.request).then(nRes => {
          if (nRes && nRes.status === 200) c.put(e.request, nRes.clone());
          return nRes;
        }).catch(() => null);
        return res || fetchUpdate;
      });
    })
  );
});
