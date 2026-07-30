/**
 * Limpeza de estado privado no logout.
 *
 * Sem isto, o aparelho guardaria dados do usuário anterior:
 *  - Cache Storage do service worker (respostas de navegação);
 *  - localStorage com a sessão de treino em andamento e a fila offline.
 *
 * Chamado antes do redirect de logout. Nunca lança: falhar aqui não pode
 * impedir a saída da conta.
 */

/**
 * Prefixo das chaves locais do app. Cobre `gymtrack-session`,
 * `gymtrack-daily-core-v1` e as quatro filas `gymtrack-pending-*` /
 * `gymtrack-daily-core-sync-v1`.
 */
const PRIVATE_STORAGE_PREFIXES = ['gymtrack-']

export async function clearPrivateState(): Promise<void> {
  // 1) Cache do service worker
  try {
    if (typeof navigator !== 'undefined' && navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_PRIVATE_CACHE' })
    }
    if (typeof caches !== 'undefined') {
      const names = await caches.keys()
      await Promise.all(
        names.filter((name) => name.startsWith('gymtrack-')).map((name) => caches.delete(name))
      )
    }
  } catch {
    // Cache Storage indisponível (navegação privada) — segue o logout.
  }

  // 2) Estado local da sessão de treino e filas offline
  try {
    if (typeof localStorage !== 'undefined') {
      const toRemove: string[] = []
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index)
        if (key && PRIVATE_STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix))) {
          toRemove.push(key)
        }
      }
      for (const key of toRemove) localStorage.removeItem(key)
    }
  } catch {
    // Storage bloqueado — segue o logout.
  }
}
