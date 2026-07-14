'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, Check, CloudOff, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  flushSyncQueue,
  getPendingSyncCount,
  SYNC_STATE_EVENT,
  type SyncState,
} from '@/lib/offline/syncQueue'
import { cn } from '@/lib/utils'

interface SaveDetail {
  state: SyncState
  pending: number
}

const LABELS: Record<SyncState, string> = {
  synced: 'Salvo',
  syncing: 'Salvando…',
  offline: 'Offline — será sincronizado',
  error: 'Erro ao salvar — tentar novamente',
}

export function WorkoutSaveStatus({ compact = false }: { compact?: boolean }) {
  const [detail, setDetail] = useState<SaveDetail>({ state: 'synced', pending: 0 })

  useEffect(() => {
    const pending = getPendingSyncCount()
    const initialTimer = setTimeout(() => {
      setDetail({
        state: navigator.onLine ? (pending > 0 ? 'syncing' : 'synced') : 'offline',
        pending,
      })
    }, 0)
    const onState = (event: Event) =>
      setDetail((event as CustomEvent<SaveDetail>).detail)
    const onOffline = () =>
      setDetail({ state: 'offline', pending: getPendingSyncCount() })
    const onOnline = () => void flushSyncQueue(createClient())
    window.addEventListener(SYNC_STATE_EVENT, onState)
    window.addEventListener('offline', onOffline)
    window.addEventListener('online', onOnline)
    return () => {
      clearTimeout(initialTimer)
      window.removeEventListener(SYNC_STATE_EVENT, onState)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online', onOnline)
    }
  }, [])

  const Icon = detail.state === 'synced'
    ? Check
    : detail.state === 'syncing'
      ? RefreshCw
      : detail.state === 'offline'
        ? CloudOff
        : AlertCircle

  return (
    <button
      type="button"
      onClick={() => {
        if (detail.state === 'error') void flushSyncQueue(createClient())
      }}
      disabled={detail.state !== 'error'}
      aria-live="polite"
      className={cn(
        'inline-flex min-h-7 items-center gap-1.5 rounded-full text-[10px] font-semibold',
        compact ? 'px-0' : 'border border-border bg-secondary/50 px-2.5',
        detail.state === 'synced' && 'text-[#72d99a]',
        detail.state === 'syncing' && 'text-[#7eb9ff]',
        detail.state === 'offline' && 'text-[#ffcf7a]',
        detail.state === 'error' && 'text-destructive'
      )}
    >
      <Icon className={cn('size-3', detail.state === 'syncing' && 'animate-spin')} />
      <span>{compact && detail.state === 'offline' ? 'Offline' : LABELS[detail.state]}</span>
      {detail.pending > 0 && <span className="font-mono">({detail.pending})</span>}
    </button>
  )
}
