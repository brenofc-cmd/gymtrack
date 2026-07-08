'use client'

import { useState } from 'react'
import { OctagonAlert } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useSessionStore } from '@/lib/store/sessionStore'
import { createClient } from '@/lib/supabase/client'
import { saveExerciseFeedback } from '@/lib/queries/sessions'
import type { ExecutionQuality, PainLevel } from '@/types/database'

interface ExerciseFeedbackPanelProps {
  sessionId: string
  workoutExerciseId: string
  hasSubstitutions: boolean
}

const EXECUTION_OPTIONS: Array<{ value: ExecutionQuality; label: string }> = [
  { value: 'boa', label: 'Boa' },
  { value: 'aceitavel', label: 'Aceitável' },
  { value: 'ruim', label: 'Ruim' },
]

const PAIN_OPTIONS: Array<{ value: PainLevel; label: string }> = [
  { value: 'nenhuma', label: 'Sem dor' },
  { value: 'leve', label: 'Leve' },
  { value: 'moderada', label: 'Moderada' },
  { value: 'forte', label: 'Forte' },
]

export function ExerciseFeedbackPanel({
  sessionId,
  workoutExerciseId,
  hasSubstitutions,
}: ExerciseFeedbackPanelProps) {
  const { feedback, setFeedback } = useSessionStore()
  const fb = feedback[workoutExerciseId] ?? {
    executionQuality: null,
    painLevel: null,
    notes: '',
  }
  const [savingNotes, setSavingNotes] = useState(false)

  const painIsSerious = fb.painLevel === 'moderada' || fb.painLevel === 'forte'

  async function persist(next: {
    executionQuality?: ExecutionQuality | null
    painLevel?: PainLevel | null
    notes?: string
  }) {
    try {
      const supabase = createClient()
      await saveExerciseFeedback(supabase, sessionId, workoutExerciseId, {
        execution_quality: next.executionQuality ?? fb.executionQuality,
        pain_level: next.painLevel ?? fb.painLevel,
        notes: next.notes ?? fb.notes,
      })
    } catch {
      toast.error('Feedback guardado localmente; será salvo nas próximas séries.')
    }
  }

  return (
    <div className="space-y-2 pt-2 border-t border-border">
      {/* Execução */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-16 shrink-0">
          Execução
        </span>
        <div className="flex gap-1">
          {EXECUTION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                const value = fb.executionQuality === opt.value ? null : opt.value
                setFeedback(workoutExerciseId, { executionQuality: value })
                void persist({ executionQuality: value })
              }}
              aria-pressed={fb.executionQuality === opt.value}
              className={cn(
                'px-2.5 h-7 rounded-md text-xs font-medium border transition-colors',
                fb.executionQuality === opt.value
                  ? opt.value === 'ruim'
                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/40'
                    : 'bg-primary/15 text-primary border-primary/40'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dor */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground w-16 shrink-0">
          Dor
        </span>
        <div className="flex gap-1 flex-wrap">
          {PAIN_OPTIONS.map((opt) => {
            const serious = opt.value === 'moderada' || opt.value === 'forte'
            return (
              <button
                key={opt.value}
                onClick={() => {
                  const value = fb.painLevel === opt.value ? null : opt.value
                  setFeedback(workoutExerciseId, { painLevel: value })
                  void persist({ painLevel: value })
                }}
                aria-pressed={fb.painLevel === opt.value}
                className={cn(
                  'px-2.5 h-7 rounded-md text-xs font-medium border transition-colors',
                  fb.painLevel === opt.value
                    ? serious
                      ? 'bg-destructive/15 text-destructive border-destructive/40'
                      : 'bg-primary/15 text-primary border-primary/40'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Alerta de dor moderada/forte */}
      {painIsSerious && (
        <div className="flex gap-2 items-start rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2">
          <OctagonAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <div className="text-xs text-destructive space-y-1">
            <p className="font-semibold">Interrompa este exercício.</p>
            <p className="opacity-90">
              Dor {fb.painLevel} registrada. Não haverá sugestão de progressão.
              {hasSubstitutions
                ? ' Você pode escolher uma substituição segura acima.'
                : ''}{' '}
              Se a dor persistir ou piorar, procure avaliação de um profissional de saúde.
            </p>
          </div>
        </div>
      )}

      {/* Observações */}
      <textarea
        value={fb.notes}
        onChange={(e) => setFeedback(workoutExerciseId, { notes: e.target.value })}
        onBlur={async () => {
          if (savingNotes) return
          setSavingNotes(true)
          await persist({ notes: fb.notes })
          setSavingNotes(false)
        }}
        placeholder="Observações do exercício (opcional)..."
        rows={1}
        maxLength={300}
        className="w-full rounded-lg border border-border bg-transparent px-2.5 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
      />
    </div>
  )
}
