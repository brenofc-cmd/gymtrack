'use client'

import { useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BatteryCharging, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { DELOAD_PRESCRIPTION_TEXT, type DeloadSuggestion } from '@/lib/progression/deload'
import type { DeloadRecommendationRow } from '@/lib/queries/deload'

type Props = {
  userId: string
  pending: DeloadRecommendationRow | null
  active: DeloadRecommendationRow | null
  suggestion: DeloadSuggestion | null
}

/**
 * Card de deload no padrão visual do RecoveryAlertCard. Nunca aplica nada
 * automaticamente: a recomendação nasce 'sugerido' e só as ações do usuário
 * mudam o status (aceito/recusado/concluido).
 */
export function DeloadCard({ userId, pending, active, suggestion }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const persisted = useRef(false)

  // Persiste a sugestão recém-computada como 'sugerido' para que a regra
  // "uma pendente por vez" valha entre dispositivos (índice único parcial).
  useEffect(() => {
    if (!suggestion || pending || active || persisted.current) return
    persisted.current = true
    createClient()
      .from('deload_recommendations')
      .insert({
        user_id: userId,
        reason: suggestion.reason,
        trigger_data: { trigger: suggestion.trigger, ...suggestion.triggerData },
      })
      .then(({ error }) => {
        // Conflito (23505) = outra aba/dispositivo já registrou a pendente.
        if (error && error.code !== '23505') return
        startTransition(() => router.refresh())
      })
  }, [suggestion, pending, active, userId, router])

  async function decide(id: string, status: 'aceito' | 'recusado' | 'concluido') {
    const { error } = await createClient()
      .from('deload_recommendations')
      .update({ status, decided_at: new Date().toISOString() })
      .eq('id', id)
    if (error) {
      toast.error('Não foi possível registrar a decisão.')
      return
    }
    if (status === 'aceito') toast.success('Semana de descarga iniciada. Bom descanso ativo!')
    if (status === 'recusado') toast.success('Sugestão dispensada.')
    if (status === 'concluido') toast.success('Deload concluído. De volta à progressão normal!')
    startTransition(() => router.refresh())
  }

  if (active) {
    return (
      <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <BatteryCharging className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm font-semibold text-primary">Semana de deload ativa</p>
        </div>
        <p className="text-xs text-muted-foreground mb-3">{DELOAD_PRESCRIPTION_TEXT}</p>
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide(active.id, 'concluido')}
          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-primary/30 px-4 text-xs font-bold text-primary disabled:opacity-60"
        >
          <Check className="size-4" aria-hidden="true" />
          Concluir deload
        </button>
      </div>
    )
  }

  const shown = pending
  if (!shown) return null

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <BatteryCharging className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-sm font-semibold text-amber-500">Sugestão: semana de descarga</p>
      </div>
      <p className="text-xs text-muted-foreground mb-2">{shown.reason}</p>
      <p className="text-xs text-muted-foreground mb-3">{DELOAD_PRESCRIPTION_TEXT}</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide(shown.id, 'aceito')}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500/90 px-4 text-xs font-bold text-background disabled:opacity-60"
        >
          <Check className="size-4" aria-hidden="true" />
          Aceitar deload
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => decide(shown.id, 'recusado')}
          className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border px-4 text-xs font-bold text-muted-foreground disabled:opacity-60"
        >
          <X className="size-4" aria-hidden="true" />
          Agora não
        </button>
      </div>
    </div>
  )
}
