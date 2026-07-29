'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  INTRO_POWERBUILDING_CRITERIA,
  TRAINING_PHASE_LABEL,
  type TrainingPhase,
} from '@/lib/training/phase'

/**
 * Fase de treinamento — mudança SEMPRE por confirmação explícita do usuário.
 * 'advanced_powerbuilding' não é oferecida (indisponível por enquanto).
 * A fase não altera a rotina: controla a apresentação do top set/back-off.
 */
export function TrainingPhaseCard({
  userId,
  phase,
}: {
  userId: string
  phase: TrainingPhase
}) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  async function setPhase(next: TrainingPhase) {
    setSaving(true)
    const { error } = await createClient()
      .from('user_profiles')
      .update({ training_phase: next, updated_at: new Date().toISOString() })
      .eq('id', userId)
    setSaving(false)
    if (error) {
      toast.error('Não foi possível atualizar a fase.')
      return
    }
    toast.success(`Fase atualizada: ${TRAINING_PHASE_LABEL[next]}.`)
    setConfirming(false)
    router.refresh()
  }

  return (
    <section className="surface-card space-y-3 p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <GraduationCap className="size-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Fase de treinamento</h2>
          <p className="text-xs text-muted-foreground">
            Atual: <strong className="text-foreground">{TRAINING_PHASE_LABEL[phase]}</strong>
          </p>
        </div>
      </div>

      {phase === 'fundamentals' && !confirming && (
        <>
          <p className="text-xs text-muted-foreground">
            Na fase Fundamentos, os exercícios com top set aparecem como séries retas
            conservadoras. Avance para habilitar o top set/back-off da rotina.
          </p>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="h-11 w-full rounded-xl border border-primary/30 text-xs font-bold text-primary"
          >
            Quero avançar para Introdução ao powerbuilding
          </button>
        </>
      )}

      {phase === 'fundamentals' && confirming && (
        <div className="space-y-2">
          <p className="text-xs font-semibold">Confirme apenas se você cumpre os critérios:</p>
          <ul className="space-y-1">
            {INTRO_POWERBUILDING_CRITERIA.map((criterion) => (
              <li key={criterion} className="flex gap-1.5 text-xs text-muted-foreground">
                <span className="text-primary shrink-0">·</span>
                {criterion}
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={saving}
              onClick={() => setPhase('intro_powerbuilding')}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Confirmo, avançar
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="h-11 flex-1 rounded-xl border border-border text-xs font-semibold text-muted-foreground"
            >
              Ainda não
            </button>
          </div>
        </div>
      )}

      {phase === 'intro_powerbuilding' && (
        <>
          <p className="text-xs text-muted-foreground">
            Top set/back-off habilitado nos exercícios marcados da rotina. Se preferir
            voltar às séries retas conservadoras, retorne aos Fundamentos.
          </p>
          <button
            type="button"
            disabled={saving}
            onClick={() => setPhase('fundamentals')}
            className="h-11 w-full rounded-xl border border-border text-xs font-semibold text-muted-foreground disabled:opacity-60"
          >
            Voltar para Fundamentos
          </button>
        </>
      )}
    </section>
  )
}
