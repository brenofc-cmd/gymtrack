import { TRAINING_FOCUS_LABEL, type TrainingFocus } from '@/lib/routine/powerbuilding-dup-adaptado-v6'
import { cn } from '@/lib/utils'

/**
 * Classificação DUP do dia. Fonte única para dashboard, detalhe do treino e
 * cabeçalho da sessão — evita rótulos divergentes entre telas.
 *
 * "misto" existe porque um dia de força técnica com vários acessórios de
 * hipertrofia não deve ser chamado apenas de "força".
 */
export type DayClassification = TrainingFocus | 'mixed' | 'rest'

export const DAY_CLASSIFICATION_LABEL: Record<DayClassification, string> = {
  ...TRAINING_FOCUS_LABEL,
  mixed: 'Misto',
  rest: 'Descanso',
}

const CLASSIFICATION_STYLE: Record<DayClassification, string> = {
  strength_technique: 'border-[var(--info-tint)]/30 bg-[var(--info-tint)]/10 text-[var(--info-text)]',
  strength_hypertrophy: 'border-[var(--purple-text)]/30 bg-[var(--purple-text)]/10 text-[var(--purple-text)]',
  strength: 'border-[var(--info-tint)]/30 bg-[var(--info-tint)]/10 text-[var(--info-text)]',
  max_strength_hypertrophy: 'border-[var(--warn-tint)]/30 bg-[var(--warn-tint)]/10 text-[var(--warn-text)]',
  hypertrophy: 'border-primary/30 bg-primary/10 text-primary',
  mixed: 'border-[var(--purple-text)]/30 bg-[var(--purple-text)]/10 text-[var(--purple-text)]',
  recovery: 'border-[var(--mint-text)]/30 bg-[var(--mint-text)]/10 text-[var(--mint-text)]',
  rest: 'border-border bg-secondary text-muted-foreground',
}

/**
 * Classifica o dia a partir do foco declarado e da composição real da sessão.
 * Um dia de força técnica com maioria de acessórios isoladores é "misto".
 */
export function classifyDay(
  focus: string | null | undefined,
  exercises: Array<{ exercise_type?: string | null }> = []
): DayClassification {
  if (focus === 'strength_hypertrophy' || focus === 'max_strength_hypertrophy' || focus === 'strength' || focus === 'rest') return focus
  if (focus === 'recovery') return 'recovery'
  const compounds = exercises.filter((item) => item.exercise_type === 'composto').length
  const isolators = exercises.filter(
    (item) => item.exercise_type === 'isolador' || item.exercise_type === 'abdominal'
  ).length

  if (focus === 'strength_technique') {
    return isolators > compounds ? 'mixed' : 'strength_technique'
  }
  return 'hypertrophy'
}

export function WorkoutFocusBadge({
  classification,
  className,
}: {
  classification: DayClassification
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider',
        CLASSIFICATION_STYLE[classification],
        className
      )}
    >
      {DAY_CLASSIFICATION_LABEL[classification]}
    </span>
  )
}
