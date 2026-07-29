'use client'

import { useEffect } from 'react'

/**
 * Registra o service worker de shell offline (public/sw.js).
 * Apenas em produção — em dev o SW atrapalha o hot reload — e com update
 * padrão do navegador (sem skipWaiting agressivo: a versão nova assume
 * quando as abas antigas fecham).
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registro falhou (ex.: navegação privada) — o app segue online-only.
    })
  }, [])

  return null
}
