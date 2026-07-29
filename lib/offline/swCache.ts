/**
 * Versionamento do cache do service worker.
 *
 * A lógica é espelhada em public/sw.js (o SW não importa módulos TS);
 * tests/sw-cache.test.ts garante que a versão declarada lá não diverge da
 * daqui. Para invalidar o shell em produção, incremente SW_CACHE_VERSION nos
 * DOIS arquivos.
 */

export const SW_CACHE_PREFIX = 'gymtrack-shell-'
export const SW_CACHE_VERSION = 'v1'

export function swCacheName(version: string = SW_CACHE_VERSION): string {
  return `${SW_CACHE_PREFIX}${version}`
}

/** Caches antigos do GymTrack a remover no activate; ignora caches de terceiros. */
export function isStaleCache(name: string, current: string = swCacheName()): boolean {
  return name.startsWith(SW_CACHE_PREFIX) && name !== current
}

export function staleCaches(names: string[], current: string = swCacheName()): string[] {
  return names.filter((name) => isStaleCache(name, current))
}
