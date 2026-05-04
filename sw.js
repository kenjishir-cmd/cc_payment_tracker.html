/* 信用卡管理 PWA - 萬用自動更新 Service Worker (v3.7.2) */

// 每次更新 index.html 內容後，請手動將下方的版本號跳一號 (例如 3.7.2 -> 3.7.3)
// 這會觸發瀏覽器偵測檔案變動，進而更新你的 App 內容。
const CACHE_NAME = 'credit-manager-v3.7.2';

// 1. 安裝階段：跳過等待，立刻讓新版生效
self.addEventListener('install', (e) => {
  self.skipWaiting(); 
});

// 2. 激活階段：徹底清理所有舊版本的快取資料夾
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('PWA 更新：清理舊快取庫', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim()) // 立即取得控制權
  );
});

// 3. 核心邏輯：Network-First (網路優先)
// 有網路時優先抓伺服器最新的 index.html，斷網時才顯示上次存好的內容
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // 抓到新資源，同步更新快取
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        return res;
      })
      .catch(() => {
        // 沒網路時，去快取找資源
        return caches.match(e.request);
      })
  );
});
