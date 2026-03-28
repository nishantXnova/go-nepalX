/**
 * GonePal Nepal - PWA Service Worker
 * Provides offline functionality for high-altitude trekkers in Nepal
 */

const PRECACHE_NAME = 'gonepal-precache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/gonepallogo.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/favicon-32x32.png',
  '/favicon-16x16.png',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/placeholder.svg',
  '/robots.txt',
  '/site.webmanifest',
  '/logos/buddha-air.svg',
  '/logos/tara-air.png',
  '/logos/yeti-airlines.svg',
];

// Install - cache precache assets
self.addEventListener('install', (event) => {
  console.log('[Gonepal SW] Installing service worker...');
  event.waitUntil(
    caches.open(PRECACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// Activate - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((n) => n !== PRECACHE_NAME && n.startsWith('gonepal-')).map(caches.delete)
    ))
  );
  self.clients.claim();
});

// Fetch - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Always let Supabase requests go directly to network - NO caching
  if (url.hostname.includes('supabase.co')) {
    return;
  }

  // For navigation requests (HTML pages) - Network First
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Images - CacheFirst
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request, 'gonepal-images'));
    return;
  }

  // Fonts - CacheFirst
  if (request.destination === 'font') {
    event.respondWith(cacheFirst(request, 'gonepal-fonts'));
    return;
  }

  // Static assets (JS, CSS) - StaleWhileRevalidate
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Map tiles - CacheFirst
  if (url.hostname.includes('tile.openstreetmap.org') || url.hostname.includes('tile.thunderforest.com')) {
    event.respondWith(cacheFirst(request, 'gonepal-map-tiles'));
    return;
  }

  // Default - NetworkFirst
  event.respondWith(networkFirst(request));
});

// CacheFirst strategy
async function cacheFirst(request, cacheName = 'gonepal-cache') {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// StaleWhileRevalidate strategy
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      caches.open('gonepal-static').then((c) => c.put(request, response.clone()));
    }
    return response;
  }).catch(() => cached || new Response('Offline', { status: 503 }));
  return cached || fetchPromise;
}

// NetworkFirst strategy
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open('gonepal-network');
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request) || new Response('Offline', { status: 503 });
  }
}

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-news') console.log('[Gonepal SW] Syncing news...');
  if (event.tag === 'sync-phrases') console.log('[Gonepal SW] Syncing phrases...');
});

// Push Notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'GoNepal Alert', {
        body: data.body,
        icon: '/gonepallogo.png',
        badge: '/gonepallogo.png',
        tag: data.tag || 'gonepal-alert',
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('/'));
});

// Messages
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
