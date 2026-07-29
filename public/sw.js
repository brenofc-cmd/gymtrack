/*
 * Service worker mínimo do GymTrack — shell offline.
 *
 * Escopo deliberadamente pequeno:
 * - precache do shell (/, /treinos, /abdomen, /offline);
 * - stale-while-revalidate para estáticos (/_next/static, /exercises, fontes);
 * - network-first para navegações HTML, com fallback ao cache e depois /offline;
 * - NUNCA intercepta métodos de escrita nem chamadas ao Supabase — a
 *   sincronização de dados é responsabilidade exclusiva da fila idempotente
 *   (lib/offline/syncQueue.ts e lib/daily-core/syncQueue.ts).
 *
 * Versionamento espelhado em lib/offline/swCache.ts (teste garante paridade).
 * Sem skipWaiting agressivo: a nova versão assume quando as abas antigas fecham.
 */

const CACHE_PREFIX = 'gymtrack-shell-'
const CACHE_VERSION = 'v1'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`
const PRECACHE_URLS = ['/', '/treinos', '/abdomen', '/offline']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {})
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/exercises/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.woff2')
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(request, copy))
            .catch(() => {})
          return response
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match('/offline'))
        )
    )
    return
  }

  if (isStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone()).catch(() => {})
            return response
          })
          .catch(() => cached)
        return cached || network
      })
    )
  }
})
