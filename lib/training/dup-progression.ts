/**
 * Camada de progressão individual do GymTrack aplicada à rotina pública.
 * Estes cálculos não são percentuais oficiais de David Laid.
 */
export const GYMTRACK_DUP_POLICY_LABEL = 'Progressão individual calculada pelo GymTrack.'

export type AttemptResult =
  | 'completed'
  | 'personal_record'
  | 'technical_failure'
  | 'strength_failure'
  | 'skipped'
  | 'pain'

export type ReadinessLevel = 'ready' | 'attention' | 'low_recovery' | 'stop_for_pain'

export interface GymTrackDupProgressionPolicy {
  trainingMaxRatio: number
  technicalMaxRatioWithoutHistory: number
  defaultTargetRir: number
  failureReductionRatio: number
  readinessMultiplier: Record<ReadinessLevel, number>
}

export const GYMTRACK_DUP_PROGRESSION_POLICY: GymTrackDupProgressionPolicy = {
  trainingMaxRatio: 0.9,
  technicalMaxRatioWithoutHistory: 0.85,
  defaultTargetRir: 1,
  failureReductionRatio: 0.95,
  readinessMultiplier: {
    ready: 1,
    attention: 0.975,
    low_recovery: 0.925,
    stop_for_pain: 0,
  },
}

export function estimateOneRepMax(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || !Number.isInteger(reps) || reps < 1 || reps > 10) return null
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10
}

export function deriveTrainingMax(
  tested1rm: number | null,
  estimated1rm: number | null,
  ratio = GYMTRACK_DUP_PROGRESSION_POLICY.trainingMaxRatio
): number | null {
  const reference = tested1rm ?? estimated1rm
  if (reference == null || reference <= 0 || ratio <= 0 || ratio > 1) return null
  return Math.round(reference * ratio * 10) / 10
}

export function roundToIncrement(weightKg: number, incrementKg: number): number {
  if (!Number.isFinite(weightKg) || weightKg < 0 || !Number.isFinite(incrementKg) || incrementKg <= 0) return 0
  return Math.round(weightKg / incrementKg) * incrementKg
}

export interface LoadRecommendationInput {
  trainingMax: number | null
  targetReps: number
  targetRir?: number
  incrementKg: number
  readiness: ReadinessLevel
  previousWeightKg: number | null
  previousAttempt?: AttemptResult | null
  recentFailures?: number
  pain?: boolean
  executionQuality?: 'boa' | 'aceitavel' | 'ruim' | null
  prescriptionType: 'fixed_reps' | 'rep_range' | 'rep_max_effort'
}

export interface LoadRecommendation {
  suggestedKg: number | null
  action: 'increase' | 'maintain' | 'reduce' | 'stop' | 'insufficient_data'
  requiresManualConfirmation: boolean
  reason: string
}

export function recommendGymTrackLoad(input: LoadRecommendationInput): LoadRecommendation {
  if (input.pain || input.readiness === 'stop_for_pain' || input.previousAttempt === 'pain') {
    return { suggestedKg: null, action: 'stop', requiresManualConfirmation: true, reason: 'Dor registrada: não há sugestão de carga até revisão.' }
  }
  if (input.trainingMax == null && input.previousWeightKg == null) {
    return { suggestedKg: null, action: 'insufficient_data', requiresManualConfirmation: true, reason: 'Sem histórico ou máxima de referência; escolha a carga manualmente.' }
  }

  const targetRir = input.targetRir ?? GYMTRACK_DUP_PROGRESSION_POLICY.defaultTargetRir
  const fromTrainingMax = input.trainingMax == null
    ? null
    : input.trainingMax / (1 + (input.targetReps + targetRir) / 30)
  let suggested = fromTrainingMax ?? input.previousWeightKg ?? 0
  let action: LoadRecommendation['action'] = 'maintain'
  let reason = 'Mantenha a carga enquanto consolida repetições, esforço e técnica.'

  const failed = (input.recentFailures ?? 0) >= 2 ||
    input.previousAttempt === 'technical_failure' ||
    input.previousAttempt === 'strength_failure' ||
    input.executionQuality === 'ruim'
  if (failed || input.readiness === 'low_recovery') {
    suggested = (input.previousWeightKg ?? suggested) * GYMTRACK_DUP_PROGRESSION_POLICY.failureReductionRatio
    action = 'reduce'
    reason = 'Falhas recentes, técnica ou recuperação indicam redução conservadora.'
  } else if (input.previousAttempt === 'personal_record' || input.previousAttempt === 'completed') {
    const next = (input.previousWeightKg ?? suggested) + input.incrementKg
    if (input.prescriptionType !== 'rep_max_effort') {
      suggested = Math.max(suggested, next)
      action = 'increase'
      reason = 'Meta anterior concluída com segurança; menor incremento disponível sugerido.'
    } else {
      suggested = input.previousWeightKg ?? suggested
      reason = 'Esforços RM nunca aumentam automaticamente; confirme manualmente qualquer mudança.'
    }
  }

  suggested *= GYMTRACK_DUP_PROGRESSION_POLICY.readinessMultiplier[input.readiness]
  return {
    suggestedKg: roundToIncrement(suggested, input.incrementKg),
    action,
    requiresManualConfirmation: input.prescriptionType === 'rep_max_effort',
    reason,
  }
}

export interface AccessorySetResult {
  reps: number
  rir: number | null
  executionQuality: 'boa' | 'aceitavel' | 'ruim' | null
  pain: boolean
}

export function accessoryProgression(
  sets: AccessorySetResult[],
  targetSets: number,
  targetRepsMin: number,
  targetRepsMax: number
): 'increase_load' | 'increase_reps' | 'maintain' | 'reduce' | 'stop' {
  if (sets.some((set) => set.pain)) return 'stop'
  if (sets.some((set) => set.executionQuality === 'ruim') || sets.filter((set) => set.reps < targetRepsMin).length >= 2) return 'reduce'
  if (sets.length < targetSets) return 'maintain'
  const safeEffort = sets.every((set) => set.rir != null && set.rir >= 1 && set.rir <= 2 && set.executionQuality === 'boa')
  if (!safeEffort) return 'maintain'
  if (sets.every((set) => set.reps >= targetRepsMax)) return 'increase_load'
  return targetRepsMin < targetRepsMax ? 'increase_reps' : 'maintain'
}

export function unilateralVolume(weightKg: number, repsPerSide: number, sets: number): number {
  if ([weightKg, repsPerSide, sets].some((value) => !Number.isFinite(value) || value < 0)) return 0
  return weightKg * repsPerSide * 2 * sets
}

export function nextBlockWeek(currentWeek: number, completedSixSessions: boolean) {
  if (!completedSixSessions) return { week: currentWeek, completed: false }
  if (currentWeek >= 9) return { week: 9, completed: true }
  return { week: currentWeek + 1, completed: false }
}
