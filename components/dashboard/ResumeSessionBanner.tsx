'use client'

import Link from 'next/link'
import { Play, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ResumeSessionBannerProps {
  sessionId: string
  workoutName: string
  startedAt: string
}

export function ResumeSessionBanner({
  sessionId,
  workoutName,
  startedAt,
}: ResumeSessionBannerProps) {
  const ago = formatDistanceToNow(new Date(startedAt), {
    addSuffix: true,
    locale: ptBR,
  })

  return (
    <Link
      href={`/sessao/${sessionId}`}
      aria-label={`Retomar treino ${workoutName}`}
      className="rounded-2xl border border-primary/40 bg-primary/5 p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/15 shrink-0">
        <Clock className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold leading-tight">Treino em andamento</p>
        <p className="text-xs text-muted-foreground truncate">
          {workoutName} · iniciado {ago}
        </p>
      </div>
      <div
        aria-hidden="true"
        className="shrink-0 flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-primary text-primary-foreground pointer-events-none"
      >
        <Play className="w-3.5 h-3.5" />
        Retomar
      </div>
    </Link>
  )
}
