/**
 * Formatação de prescrição/RIR/descanso compartilhada por todas as rotinas.
 *
 * Existe para não confundir um esforço de RM (1 série até a carga máxima)
 * com uma série comum de uma repetição, e para deixar claro quando RIR ou
 * descanso não vêm da fonte original (ex.: David Laid Powerbuilding DUP —
 * Gymshark Exact v7, onde a Gymshark não especifica esses valores).
 */
export interface PrescriptionLike {
  target_sets: number
  target_reps_min: number
  target_reps_max: number
  prescription_type?: string | null
  rep_max_target?: number | null
}

export function formatPrescription(
  exercise: PrescriptionLike,
  options: { perSide?: boolean } = {}
): string {
  if (exercise.prescription_type === 'rep_max_effort' && exercise.rep_max_target) {
    return `1×${exercise.rep_max_target}RM`
  }
  const reps = exercise.target_reps_min === exercise.target_reps_max
    ? String(exercise.target_reps_min)
    : `${exercise.target_reps_min}–${exercise.target_reps_max}`
  const base = `${exercise.target_sets}×${reps}`
  return options.perSide ? `${base} por perna` : base
}

/** Texto explicando o esforço de RM, para acompanhar o badge/prescrição na tela. */
export function rmEffortGuidance(repMaxTarget: number): string {
  return `Suba progressivamente a carga em séries de aquecimento até atingir o esforço de ${repMaxTarget}RM programado. Isto não é uma série comum de ${repMaxTarget} repetição${repMaxTarget > 1 ? 'ões' : ''} com carga fixa.`
}

export function formatRir(rirMin: number | null | undefined, rirMax: number | null | undefined): string {
  if (rirMin == null && rirMax == null) return 'não informado pela fonte'
  if (rirMin == null || rirMax == null || rirMin === rirMax) return String(rirMin ?? rirMax)
  return `${rirMin}–${rirMax}`
}

export interface RestLike {
  rest_seconds: number
  rest_seconds_source?: string | null
}

export function formatRest(exercise: RestLike): { label: string; isAppSuggested: boolean } {
  const isAppSuggested = exercise.rest_seconds_source === 'app_suggested'
  const minutes = Math.floor(exercise.rest_seconds / 60)
  const seconds = String(exercise.rest_seconds % 60).padStart(2, '0')
  return {
    label: isAppSuggested ? 'não especificado pela fonte' : `${minutes}:${seconds}`,
    isAppSuggested,
  }
}

export interface WhyThisWeightInput {
  recommendedLoadKg: number
  estimated1RmKg?: number | null
  percentageOfE1rm?: number | null
  targetRir?: number | null
  lastSession?: {
    weightKg: number
    setsCompleted: string
    technique: string
    rir: number
  } | null
}

/** Explicação exibida no botão "Por que este peso?" — nunca inventa fórmulas do produto pago. */
export function whyThisWeight(input: WhyThisWeightInput): string {
  const parts: string[] = []
  if (input.estimated1RmKg != null && input.percentageOfE1rm != null) {
    parts.push(
      `Recomendamos ${input.recommendedLoadKg} kg porque seu e1RM estimado é ${input.estimated1RmKg} kg. ` +
      `Esta série usa inicialmente ${input.percentageOfE1rm}% dessa estimativa` +
      (input.targetRir != null ? `, com alvo de RIR ${input.targetRir}.` : '.')
    )
  } else {
    parts.push(
      `Recomendamos ${input.recommendedLoadKg} kg com base no seu histórico recente` +
      (input.targetRir != null ? ` e no alvo de RIR ${input.targetRir}.` : '.')
    )
  }
  if (input.lastSession) {
    const { weightKg, setsCompleted, technique, rir } = input.lastSession
    parts.push(
      `Na última sessão, você completou ${setsCompleted} com ${weightKg} kg, técnica ${technique} e RIR ${rir}.`
    )
  }
  return parts.join(' ')
}
