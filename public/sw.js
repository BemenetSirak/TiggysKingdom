const CACHE = 'tiggys-kingdom-v1';
const PRECACHE = ['/', '/tiggy.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const { request } = e;
  if (request.method !== 'GET') return;
  if (request.url.includes('localhost:4242')) return;           // never cache API
  if (request.url.includes('googleapis.com')) return;           // never cache YouTube API
  if (request.url.includes('youtube.com')) return;              // never cache YouTube

  if (request.destination === 'image') {
    // Cache-first for images (including /tiggy.png)
    e.respondWith(
      caches.match(request).then(hit =>
        hit || fetch(request).then(res => {
          caches.open(CACHE).then(c => c.put(request, res.clone()));
          return res;
        })
      )
    );
    return;
  }

  if (request.mode === 'navigate') {
    // Network-first for page navigations; fall back to cached /
    e.respondWith(
      fetch(request).catch(() => caches.match('/'))
    );
    return;
  }

  // Stale-while-revalidate for JS/CSS assets
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(request).then(cached => {
        const network = fetch(request).then(res => {
          cache.put(request, res.clone());
          return res;
        });
        return cached || network;
      })
    )
  );
});
