/*
 * Service worker do GymTrack — shell offline com escopo de privacidade.
 *
 * REGRA CENTRAL (corrigida na auditoria 10/10): páginas autenticadas contêm
 * dados privados do usuário (séries, peso, alimentação). A versão anterior
 * fazia `cache.put` de QUALQUER navegação, então:
 *   - após logout, uma página com dados privados podia ser servida do cache;
 *   - em aparelho compartilhado, o usuário B podia ver a tela do usuário A.
 * Agora só rotas do SHELL PÚBLICO são gravadas em cache. Rotas autenticadas
 * usam network-only com fallback para /offline — nunca são persistidas.
 *
 * O SW também não intercepta chamadas ao Supabase: mutações offline continuam
 * exclusivamente na fila idempotente (lib/offline/syncQueue.ts).
 *
 * Versionamento espelhado em lib/offline/swCache.ts (teste garante paridade).
 */

const CACHE_PREFIX = 'gymtrack-shell-'
const CACHE_VERSION = 'v2'
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`

/**
 * Rotas seguras para cache: não exigem sessão e não contêm dados de usuário.
 * `/` fica de fora de propósito — é o dashboard autenticado.
 */
const PUBLIC_SHELL = ['/offline', '/login']

function isPublicShell(pathname) {
  return PUBLIC_SHELL.includes(pathname)
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/exercises/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/manifest.webmanifest' ||
    url.pathname.endsWith('.woff2')
  )
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PUBLIC_SHELL))
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

/**
 * Logout e troca de usuário: o app envia esta mensagem para descartar
 * qualquer resposta guardada antes de outra conta assumir o aparelho.
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_PRIVATE_CACHE') {
    event.waitUntil(
      caches
        .keys()
        .then((names) =>
          Promise.all(
            names.filter((name) => name.startsWith(CACHE_PREFIX)).map((name) => caches.delete(name))
          )
        )
        .then(() => caches.open(CACHE_NAME).then((cache) => cache.addAll(PUBLIC_SHELL)))
        .catch(() => {})
    )
  }
  // Atualização controlada: só troca de versão quando a página pedir.
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Nunca intercepta outros hosts (inclusive Supabase).
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    // Rota pública do shell: network-first COM cache.
    if (isPublicShell(url.pathname)) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            // Só guarda respostas OK e não-redirecionadas: um 302 para /login
            // salvo como se fosse página válida quebraria a navegação.
            if (response.ok && response.type !== 'opaqueredirect' && !response.redirected) {
              const copy = response.clone()
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
            }
            return response
          })
          .catch(() =>
            caches.match(request).then((cached) => cached || caches.match('/offline'))
          )
      )
      return
    }

    // Rota autenticada: network-only. Sem rede, cai na página offline —
    // NUNCA serve conteúdo privado guardado.
    event.respondWith(fetch(request).catch(() => caches.match('/offline')))
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

// Push é tratado pelo sistema operacional mesmo sem a página aberta.
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = {} }
  const title = data.title || 'GymTrack'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || 'Seu descanso terminou.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'gymtrack-rest-timer',
    renotify: true,
    data: { url: data.url || '/' },
    // Ignorado onde não for compatível; Android usa o padrão do aparelho.
    vibrate: [350, 100, 350],
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const existing = windows.find((client) => client.url.startsWith(self.location.origin))
    return existing ? existing.focus() : clients.openWindow(event.notification.data?.url || '/')
  }))
})
