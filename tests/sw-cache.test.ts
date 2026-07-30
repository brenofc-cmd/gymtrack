import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import {
  SW_CACHE_PREFIX,
  SW_CACHE_VERSION,
  swCacheName,
  isStaleCache,
  staleCaches,
  isCacheableRoute,
} from '@/lib/offline/swCache'

const swSource = readFileSync(path.resolve(__dirname, '../public/sw.js'), 'utf-8')

describe('versionamento do cache do service worker', () => {
  it('monta o nome do cache com prefixo + versão', () => {
    expect(swCacheName()).toBe(`${SW_CACHE_PREFIX}${SW_CACHE_VERSION}`)
    expect(swCacheName('v9')).toBe(`${SW_CACHE_PREFIX}v9`)
  })

  it('marca como velho apenas caches do GymTrack de outra versão', () => {
    expect(isStaleCache(swCacheName('v0'))).toBe(true)
    expect(isStaleCache(swCacheName())).toBe(false)
    // caches de terceiros no mesmo origin nunca são apagados
    expect(isStaleCache('workbox-precache-v2')).toBe(false)
  })

  it('filtra a lista de caches a limpar no activate', () => {
    const names = [swCacheName('v0'), swCacheName(), 'outro-cache']
    expect(staleCaches(names)).toEqual([swCacheName('v0')])
  })
})

describe('public/sw.js — paridade e escopo', () => {
  it('usa a mesma versão de cache declarada em lib/offline/swCache.ts', () => {
    const prefix = swSource.match(/const CACHE_PREFIX = '([^']+)'/)?.[1]
    const version = swSource.match(/const CACHE_VERSION = '([^']+)'/)?.[1]
    expect(prefix).toBe(SW_CACHE_PREFIX)
    expect(version).toBe(SW_CACHE_VERSION)
  })

  it('faz precache APENAS do shell público (rotas autenticadas ficam de fora)', () => {
    // Antes da auditoria 10/10 o precache incluía '/', '/treinos' e '/abdomen'
    // — todas autenticadas, o que persistia dados privados no aparelho.
    for (const url of ['/offline', '/login']) {
      expect(swSource, url).toContain(`'${url}'`)
    }
    const precache = swSource.match(/const PUBLIC_SHELL = \[([^\]]*)\]/)?.[1] ?? ''
    for (const url of ['/treinos', '/abdomen', '/progresso']) {
      expect(precache, url).not.toContain(url)
    }
  })

  it('só intercepta GET — sincronização de dados fica com a fila idempotente', () => {
    expect(swSource).toContain("if (request.method !== 'GET') return")
    expect(swSource).not.toMatch(/supabase\.co|from\(/)
    expect(swSource).not.toMatch(/addEventListener\(\s*'(sync|periodicsync)'/)
    expect(swSource).not.toContain('BackgroundSync')
  })

  it('não usa skipWaiting agressivo (só sob mensagem explícita da página)', () => {
    const messageBlock = swSource.split("addEventListener('message'")[1]?.split("addEventListener('fetch'")[0] ?? ''
    expect(messageBlock).toContain('self.skipWaiting()')
    // Fora do handler de mensagem não pode haver skipWaiting
    expect(swSource.replace(messageBlock, '')).not.toContain('skipWaiting()')
  })

  it('limpa somente caches do próprio prefixo no activate', () => {
    expect(swSource).toContain("name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME")
  })
})

describe('privacidade do cache (regressão da auditoria 10/10)', () => {
  it('só rotas do shell público são cacheáveis; dashboard e telas de dados não', () => {
    for (const route of ['/offline', '/login']) {
      expect(isCacheableRoute(route), route).toBe(true)
    }
    // '/' é o dashboard autenticado — nunca pode ser gravado
    for (const route of ['/', '/progresso', '/historico', '/sessao/abc', '/alimentacao', '/perfil', '/abdomen', '/treinos']) {
      expect(isCacheableRoute(route), route).toBe(false)
    }
  })

  it('o SW só grava navegações do shell público', () => {
    expect(swSource).toContain('isPublicShell(url.pathname)')
    // Rota autenticada: network-only com fallback, sem cache.put
    expect(swSource).toMatch(/Rota autenticada: network-only/)
    expect(swSource).toMatch(/event\.respondWith\(fetch\(request\)\.catch\(\(\) => caches\.match\('\/offline'\)\)\)/)
  })

  it('nunca guarda respostas redirecionadas (302 para /login) como página válida', () => {
    expect(swSource).toContain("response.type !== 'opaqueredirect'")
    expect(swSource).toContain('!response.redirected')
    expect(swSource).toContain('response.ok')
  })

  it('a lista de shell público NÃO inclui a raiz autenticada', () => {
    const list = swSource.match(/const PUBLIC_SHELL = \[([^\]]*)\]/)?.[1] ?? ''
    expect(list).toContain("'/offline'")
    expect(list).not.toMatch(/'\/'\s*[,\]]/)
  })

  it('expõe limpeza de cache no logout e skipWaiting controlado por mensagem', () => {
    expect(swSource).toContain("event.data.type === 'CLEAR_PRIVATE_CACHE'")
    expect(swSource).toContain("event.data.type === 'SKIP_WAITING'")
    // skipWaiting só dentro do handler de mensagem, nunca no install
    const installBlock = swSource.split("addEventListener('install'")[1]?.split('addEventListener')[0] ?? ''
    expect(installBlock).not.toContain('skipWaiting')
  })

  it('a versão do cache foi incrementada para invalidar o cache inseguro anterior', () => {
    expect(SW_CACHE_VERSION).toBe('v2')
  })
})

describe('limpeza de estado privado no logout', () => {
  it('o logout chama clearPrivateState antes de redirecionar', () => {
    const logout = readFileSync(
      path.resolve(__dirname, '../components/auth/LogoutButton.tsx'),
      'utf-8'
    )
    expect(logout).toContain('clearPrivateState()')
    expect(logout.indexOf('clearPrivateState()')).toBeLessThan(logout.indexOf("router.push('/login')"))
  })

  it('a limpeza cobre Cache Storage e as chaves locais do app', () => {
    const source = readFileSync(
      path.resolve(__dirname, '../lib/offline/clearPrivateState.ts'),
      'utf-8'
    )
    expect(source).toContain('caches.delete')
    expect(source).toContain('localStorage.removeItem')
    expect(source).toContain("'gymtrack-'")
    expect(source).toContain('CLEAR_PRIVATE_CACHE')
  })
})
