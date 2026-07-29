import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import {
  SW_CACHE_PREFIX,
  SW_CACHE_VERSION,
  swCacheName,
  isStaleCache,
  staleCaches,
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

  it('faz precache do shell incluindo a página /offline', () => {
    for (const url of ['/', '/treinos', '/abdomen', '/offline']) {
      expect(swSource).toContain(`'${url}'`)
    }
  })

  it('só intercepta GET — sincronização de dados fica com a fila idempotente', () => {
    expect(swSource).toContain("if (request.method !== 'GET') return")
    expect(swSource).not.toMatch(/supabase\.co|from\(/)
    expect(swSource).not.toMatch(/addEventListener\(\s*'(sync|periodicsync)'/)
    expect(swSource).not.toContain('BackgroundSync')
  })

  it('não usa skipWaiting agressivo', () => {
    expect(swSource).not.toContain('skipWaiting()')
  })

  it('limpa somente caches do próprio prefixo no activate', () => {
    expect(swSource).toContain("name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME")
  })
})
