'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { AlertCircle, Check, CloudOff, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { flushSyncQueue, getPendingSyncCount, SYNC_STATE_EVENT, type SyncState } from '@/lib/offline/syncQueue'

interface StatusDetail {
  state: SyncState
  pending: number
}

const STATUS = {
  offline: { icon: CloudOff, label: 'Offline · alterações guardadas', className: 'border-[var(--warn-tint)]/35 bg-[var(--warn-surface)] text-[var(--warn-text)]' },
  syncing: { icon: RefreshCw, label: 'Sincronizando…', className: 'border-[var(--info-tint)]/35 bg-[var(--info-tint)]/10 text-[var(--info-text)]' },
  synced: { icon: Check, label: 'Tudo sincronizado', className: 'border-[var(--mint-text)]/30 bg-accent text-[var(--mint-text)]' },
  error: { icon: AlertCircle, label: 'Erro ao salvar · toque para tentar', className: 'border-destructive/35 bg-destructive/10 text-destructive' },
} satisfies Record<SyncState, { icon: typeof Check; label: string; className: string }>

export function SystemStatus() {
  const pathname = usePathname()
  const [detail, setDetail] = useState<StatusDetail | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let hideTimer: ReturnType<typeof setTimeout> | null = null

    const setStatus = (next: StatusDetail) => {
      if (hideTimer) clearTimeout(hideTimer)
      setDetail(next)
      if (next.state === 'synced') {
        hideTimer = setTimeout(() => setDetail(null), 1800)
      }
    }
    const onState = (event: Event) => setStatus((event as CustomEvent<StatusDetail>).detail)
    const onOffline = () => setStatus({ state: 'offline', pending: getPendingSyncCount() })
    const onOnline = () => void flushSyncQueue(supabase)

    window.addEventListener(SYNC_STATE_EVENT, onState)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    if (!navigator.onLine) onOffline()
    else void flushSyncQueue(supabase)

    return () => {
      if (hideTimer) clearTimeout(hideTimer)
      window.removeEventListener(SYNC_STATE_EVENT, onState)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  if (!detail || pathname.startsWith('/sessao/')) return null
  const status = STATUS[detail.state]
  const Icon = status.icon

  return (
    <button
      type="button"
      onClick={() => {
        if (detail.state === 'error') void flushSyncQueue(createClient())
      }}
      className={`fixed left-1/2 top-3 z-[80] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold shadow-2xl ${status.className}`}
    >
      <Icon className={`size-3.5 ${detail.state === 'syncing' ? 'animate-spin' : ''}`} />
      {status.label}
      {detail.pending > 0 && <span className="font-mono text-[10px]">({detail.pending})</span>}
    </button>
  )
}
