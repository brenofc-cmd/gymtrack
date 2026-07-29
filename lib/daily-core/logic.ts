import type {
  DailyCoreDayRow,
  DailyCoreExerciseRow,
  DailyCorePreferenceRow,
  DailyCoreSetRow,
  DailyCoreSessionRow,
  DailyCoreVariationRow,
} from '@/types/database'

export const DAILY_CORE_TIME_ZONE = 'America/Sao_Paulo'

export type CoreExerciseWithVariations = DailyCoreExerciseRow & {
  variations: DailyCoreVariationRow[]
}
export type CoreExercisePlan = CoreExerciseWithVariations & {
  selectedVariation: DailyCoreVariationRow | null
  effectiveSets: number
  effectiveRir: number | null
}

export type CoreExercisePresentation = {
  variation: DailyCoreVariationRow | null
  name: string
  imageUrl: string
  imageAlt: string
  shortCue: string
  instructions: string[]
  commonMistakes: string[]
  measureType: DailyCoreExerciseRow['measure_type']
  targetRepsMin: number | null
  targetRepsMax: number | null
  targetSecondsMin: number | null
  targetSecondsMax: number | null
  perSide: boolean
  restSecondsMin: number
  restSecondsMax: number
  equipment: string | null
}

export function resolveCoreExercise(
  exercise: CoreExercisePlan | CoreExerciseWithVariations,
  variationId?: string | null
): CoreExercisePresentation {
  const planned = 'selectedVariation' in exercise ? exercise.selectedVariation : null
  const variation = variationId
    ? exercise.variations.find((item) => item.id === variationId) ?? planned
    : planned

  return {
    variation,
    name: variation?.name ?? exercise.name,
    imageUrl: variation?.image_url ?? exercise.image_url,
    imageAlt: variation?.image_alt ?? exercise.image_alt,
    shortCue: variation?.short_cue ?? exercise.short_cue,
    instructions: variation?.instructions?.length ? variation.instructions : exercise.instructions,
    commonMistakes: variation?.common_mistakes?.length ? variation.common_mistakes : exercise.common_mistakes,
    measureType: variation?.measure_type ?? exercise.measure_type,
    targetRepsMin: variation?.target_reps_min ?? exercise.target_reps_min,
    targetRepsMax: variation?.target_reps_max ?? exercise.target_reps_max,
    targetSecondsMin: variation?.target_seconds_min ?? exercise.target_seconds_min,
    targetSecondsMax: variation?.target_seconds_max ?? exercise.target_seconds_max,
    perSide: variation?.per_side ?? exercise.per_side,
    restSecondsMin: variation?.rest_seconds_min ?? exercise.rest_seconds_min,
    restSecondsMax: variation?.rest_seconds_max ?? exercise.rest_seconds_max,
    equipment: variation?.equipment_required ?? exercise.equipment,
  }
}

export function localDateISO(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DAILY_CORE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function coreWeekday(date = new Date()): number {
  const short = new Intl.DateTimeFormat('en-US', {
    timeZone: DAILY_CORE_TIME_ZONE,
    weekday: 'short',
  }).format(date)
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(short) + 1
}

export function adaptationWeek(startedOn: string, skip: boolean, today = localDateISO()): number {
  if (skip) return 0
  const start = new Date(`${startedOn}T12:00:00Z`)
  const end = new Date(`${today}T12:00:00Z`)
  const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000))
  return Math.floor(days / 7) + 1
}

function chooseVariation(
  exercise: CoreExerciseWithVariations,
  preferences: DailyCorePreferenceRow
): DailyCoreVariationRow | null {
  const variations = [...exercise.variations].sort((a, b) => a.order_index - b.order_index)
  if (exercise.slug === 'pallof-press' && !preferences.has_resistance_band) {
    return variations.find((item) => item.is_equipment_fallback) ?? null
  }
  if (exercise.slug === 'crunch-carga' && preferences.has_weighted_backpack) {
    return variations.find((item) => item.equipment_required === 'mochila') ?? variations[0] ?? null
  }
  return variations.find((item) => item.is_default) ?? variations[0] ?? null
}

export function buildExercisePlan(
  exercises: CoreExerciseWithVariations[],
  preferences: DailyCorePreferenceRow,
  week = adaptationWeek(preferences.adaptation_started_on, preferences.skip_adaptation)
): CoreExercisePlan[] {
  return exercises
    .filter((exercise) => {
      if (exercise.slug === 'ab-wheel') return preferences.has_ab_wheel
      if (exercise.slug === 'prancha-longa') return !preferences.has_ab_wheel
      return true
    })
    .sort((a, b) => a.order_index - b.order_index)
    .map((exercise) => {
      const isStrong = exercise.exercise_type === 'hipertrofia' || exercise.exercise_type === 'anti_extensao'
      return {
        ...exercise,
        selectedVariation: chooseVariation(exercise, preferences),
        effectiveSets: isStrong && week === 1 ? Math.min(2, exercise.target_sets) : exercise.target_sets,
        effectiveRir: isStrong && (week === 1 || week === 2) ? 3 : exercise.rir_min,
      }
    })
}

export interface ProgressionDecision {
  status: 'manter' | 'progredir' | 'bloqueada_por_dor' | 'revisar_tecnica'
  reason: string
  suggestedReps: number | null
  suggestedSeconds: number | null
  suggestedWeightKg: number | null
}

const BLOCKING_PAIN = new Set(['dor_moderada', 'dor_forte', 'dor_lombar'])

export function evaluateProgression(
  exercise: DailyCoreExerciseRow,
  sets: Array<Pick<DailyCoreSetRow, 'reps' | 'duration_seconds' | 'weight_kg' | 'rir' | 'execution_quality' | 'pain_level' | 'lumbar_controlled'>>,
  adaptation = 0
): ProgressionDecision {
  if (sets.some((set) => set.pain_level && BLOCKING_PAIN.has(set.pain_level))) {
    return {
      status: 'bloqueada_por_dor',
      reason: 'Progressão bloqueada por dor. Interrompa o exercício e procure orientação se ela for relevante, progressiva ou persistente.',
      suggestedReps: null,
      suggestedSeconds: null,
      suggestedWeightKg: null,
    }
  }
  if (adaptation === 1 || adaptation === 2) {
    return {
      status: 'manter',
      reason: 'Fase de adaptação: mantenha a variação e priorize aprender o movimento.',
      suggestedReps: null,
      suggestedSeconds: null,
      suggestedWeightKg: null,
    }
  }
  if (sets.length < exercise.target_sets) {
    return {
      status: 'manter',
      reason: 'Complete todas as séries previstas antes de progredir.',
      suggestedReps: null,
      suggestedSeconds: null,
      suggestedWeightKg: null,
    }
  }
  const requiresTechniqueRating = exercise.exercise_type === 'hipertrofia' || exercise.exercise_type === 'anti_extensao'
  const techniqueIsGood = !requiresTechniqueRating
    || sets.every((set) => set.execution_quality === 'boa' || set.execution_quality === 'excelente')
  if (!techniqueIsGood) {
    return {
      status: 'revisar_tecnica',
      reason: 'Mantenha a dificuldade até todas as séries terem execução boa ou excelente.',
      suggestedReps: null,
      suggestedSeconds: null,
      suggestedWeightKg: null,
    }
  }
  if (exercise.slug === 'ab-wheel' && sets.some((set) => set.lumbar_controlled !== true)) {
    return {
      status: 'revisar_tecnica',
      reason: 'Não aumente a amplitude até manter a lombar controlada em todas as séries.',
      suggestedReps: null,
      suggestedSeconds: null,
      suggestedWeightKg: null,
    }
  }
  if (exercise.measure_type === 'tempo') {
    const top = exercise.target_seconds_max ?? 0
    const reachedTop = sets.every((set) => (set.duration_seconds ?? 0) >= top)
    return reachedTop
      ? {
          status: 'progredir',
          reason: 'Limite de tempo atingido com boa postura. Avance para uma variação mais difícil.',
          suggestedReps: null,
          suggestedSeconds: top,
          suggestedWeightKg: null,
        }
      : {
          status: 'manter',
          reason: 'Aumente apenas 5–10 segundos por vez, sem ultrapassar o limite da faixa.',
          suggestedReps: null,
          suggestedSeconds: Math.min(top, Math.max(...sets.map((set) => set.duration_seconds ?? 0)) + 5),
          suggestedWeightKg: null,
        }
  }
  const top = exercise.target_reps_max ?? 0
  const reachedTop = sets.every((set) => (set.reps ?? 0) >= top && (set.rir ?? -1) >= 1)
  if (!reachedTop) {
    return {
      status: 'manter',
      reason: 'Mantenha a carga até alcançar o topo da faixa em todas as séries com RIR ≥ 1.',
      suggestedReps: Math.min(top, Math.max(...sets.map((set) => set.reps ?? 0)) + 1),
      suggestedSeconds: null,
      suggestedWeightKg: null,
    }
  }
  const lastWeight = Math.max(...sets.map((set) => set.weight_kg ?? 0))
  return {
    status: 'progredir',
    reason: 'Topo da faixa atingido com técnica e RIR adequados. Aumente pouco a carga ou avance a variação.',
    suggestedReps: top,
    suggestedSeconds: null,
    suggestedWeightKg: lastWeight > 0 ? Math.round((lastWeight + 1) * 2) / 2 : null,
  }
}

export function streakStats(sessions: DailyCoreSessionRow[], today = localDateISO()): { current: number; best: number } {
  const completed = new Set(
    sessions
      .filter((session) => session.status === 'concluido' || session.completion_kind === 'pausa_por_dor')
      .map((session) => session.session_date)
  )
  const allDates = [...completed].sort()
  let best = 0
  let run = 0
  let previous: Date | null = null
  for (const value of allDates) {
    const date = new Date(`${value}T12:00:00Z`)
    if (!previous) run = 1
    else {
      let gap = Math.round((date.getTime() - previous.getTime()) / 86_400_000)
      const cursor = new Date(previous)
      while (gap > 1) {
        cursor.setUTCDate(cursor.getUTCDate() + 1)
        const weekday = cursor.getUTCDay()
        if (weekday !== 0) break
        gap -= 1
      }
      run = gap <= 1 ? run + 1 : 1
    }
    best = Math.max(best, run)
    previous = date
  }
  let current = 0
  const cursor = new Date(`${today}T12:00:00Z`)
  for (let checked = 0; checked < 366; checked += 1) {
    const iso = cursor.toISOString().slice(0, 10)
    const sunday = cursor.getUTCDay() === 0
    if (sunday) {
      cursor.setUTCDate(cursor.getUTCDate() - 1)
      continue
    }
    if (!completed.has(iso)) break
    current += 1
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return { current, best }
}

export function nextSession(days: DailyCoreDayRow[], weekday: number): DailyCoreDayRow | null {
  for (let offset = 1; offset <= 7; offset += 1) {
    const next = ((weekday - 1 + offset) % 7) + 1
    const day = days.find((item) => item.day_of_week === next)
    if (day && !day.is_rest) return day
  }
  return null
}
