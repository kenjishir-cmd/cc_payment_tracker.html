/* 信用卡管理 PWA - 萬用自動更新 Service Worker (v3.7.0)
  功能：離線使用、背景自動更新、舊快取自動清理
*/

// 每次更新 index.html 內容後，請修改下方的版本號，這會觸發全體更新
const CACHE_NAME = 'credit-manager-v3.7.0';

// 初始安裝時需要預存的基礎核心檔案
const PRE_CACHE_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. 安裝階段 (Install)：下載核心檔案
self.addEventListener('install', (event) => {
  self.skipWaiting(); // 強制新版 SW 立即接管，不進入等待狀態
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('PWA: 正在預存核心資源');
      return cache.addAll(PRE_CACHE_RESOURCES);
    })
  );
});

// 2. 激活階段 (Activate)：清理舊版本的快取庫
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('PWA: 清理舊快取 ->', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即取得所有分頁的控制權
  );
});

// 3. 攔截請求 (Fetch)：萬用動態快取策略 (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
  // 只處理 GET 請求，且排除非 HTTP 的請求（如 Chrome 擴充功能）
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        // 發起網路請求以獲取最新資源
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // 如果網路請求成功，就更新快取
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // 當完全斷網且沒快取時，會停留在最後一次成功載入的畫面
        });

        // 優先回傳快取內容（實現秒開），背景同時進行網路更新
        return cachedResponse || fetchPromise;
      });
    })
  );
});
