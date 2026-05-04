/**
 * 萬用版核心：每次 index.html 有大變動時，
 * 請修改下方這行版號（例如 v1 改 v1.1），這會強制所有裝置重新下載最新檔案。
 */
const CACHE_NAME = 'credit-manager-v3.4.2';

// 1. 安裝階段：立刻接管
self.addEventListener('install', (e) => {
  self.skipWaiting(); // 強制跳過等待，新版立刻生效
});

// 2. 啟動階段：自動清理舊快取庫
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('清理過時快取:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即取得控制權，不需重新整理
  );
});

// 3. 攔截請求：Stale-While-Revalidate (萬用動態快取)
self.addEventListener('fetch', (e) => {
  // 過濾：只處理 GET，且排除掉 Chrome 插件等非 HTTP 請求
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

  e.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(e.request).then((cachedResponse) => {
        // 背景發起請求獲取最新資源
        const fetchedResponse = fetch(e.request).then((networkResponse) => {
          // 網路通暢且回傳正常，就更新快取
          if (networkResponse && networkResponse.status === 200) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // 斷網且沒快取時，這裡可以回傳一個斷網提示頁面
        });

        // 優先給你看快取（秒開體驗），如果沒快取才等網路結果
        return cachedResponse || fetchedResponse;
      });
    })
  );
});
