const CACHE_NAME = 'universal-pwa-cache-v1';

// 1. 強制讓新的 Service Worker 立即接管，不用等待舊版關閉
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

// 2. 啟動時清理舊快取 (如果未來你想改版號)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
});

// 3. 核心邏輯：Stale-While-Revalidate
self.addEventListener('fetch', (e) => {
  // 只處理 GET 請求
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        // 發起網路請求 (背景更新)
        const fetchedResponse = fetch(e.request).then((networkResponse) => {
          // 網路請求成功就存入快取
          if (networkResponse && networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
            // 這裡可以處理完全斷網且沒快取時的狀況
        });

        // 優先回傳快取，如果沒快取就等網路請求
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
