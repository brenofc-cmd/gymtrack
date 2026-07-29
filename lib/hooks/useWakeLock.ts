'use client'

import { useEffect, useRef } from 'react'

/** Suporte à Screen Wake Lock API (iOS 16.4+, Chrome/Android modernos). */
export function wakeLockSupported(): boolean {
  return typeof navigator !== 'undefined' && 'wakeLock' in navigator
}

/**
 * Mantém a tela ligada enquanto o componente estiver montado (sessão ativa).
 *
 * - Sem suporte do navegador: no-op silencioso, nunca lança.
 * - O sistema libera o lock quando a aba fica oculta; reaquire em
 *   visibilitychange ao voltar.
 * - Libera no unmount (fim/saída da sessão).
 */
export function useWakeLock(enabled: boolean = true): void {
  const sentinelRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if (!enabled || !wakeLockSupported()) return

    let cancelled = false

    async function acquire() {
      try {
        const sentinel = await navigator.wakeLock.request('screen')
        if (cancelled) {
          sentinel.release().catch(() => {})
          return
        }
        sentinelRef.current = sentinel
      } catch {
        // Bateria baixa/permissão negada: falha silenciosa — a sessão continua.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') acquire()
    }

    acquire()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      sentinelRef.current?.release().catch(() => {})
      sentinelRef.current = null
    }
  }, [enabled])
}
