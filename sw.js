/* 信用卡管理 PWA - 離線萬用版 sw.js (v3.7.2) */

const CACHE_NAME = 'credit-manager-v3.7.2';

// 離線必備的核心路徑
const CORE_ASSETS = [
  '/',
  '/index.html'
];

// 1. 安裝：將核心檔案存入手機硬碟
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
});

// 2. 激活：清理舊版快取庫，騰出空間
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    ))
  );
  return self.clients.claim();
});

// 3. 攔截：離線讀取邏輯 (Stale-While-Revalidate)
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        // 背景發起網路請求更新快取
        const networkFetch = fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // 網路失敗時不報錯，靜默處理
        });

        // 優先回傳快取內容（這行保證了離線開啟），如果沒快取才等網路
        return cachedResponse || networkFetch;
      });
    })
  );
});
