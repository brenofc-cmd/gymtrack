import type { Exercise } from '@/types/database'

export type LoadInputKind =
  | 'external_total'
  | 'per_dumbbell'
  | 'per_side'
  | 'machine_weight'
  | 'assistance'
  | 'bodyweight'
  | 'bodyweight_plus'
  | 'reps_only'
  | 'duration'
  | 'distance'

export interface LoadInputConfig {
  kind: LoadInputKind
  loadLabel: string
  loadShortLabel: string
  repsLabel: string
  unit: 'kg' | 's' | 'm' | null
  acceptsLoad: boolean
  unilateral: boolean
  /** Para assistência, valores menores representam maior dificuldade. */
  lowerIsHarder: boolean
  incrementKg: number
  helperText?: string
}

type ExerciseForLoad = Pick<
  Exercise,
  'name_pt' | 'equipment' | 'movement_pattern' | 'exercise_type'
>

function normalize(value: string | null | undefined): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function getLoadInputConfig(
  exercise: ExerciseForLoad,
  workoutNotes?: string | null
): LoadInputConfig {
  const name = normalize(exercise.name_pt)
  const equipment = normalize(exercise.equipment)
  const notes = normalize(workoutNotes)
  const unilateral =
    /unilateral|por lado|por perna|cada lado|alternad/.test(`${name} ${notes}`) ||
    exercise.movement_pattern === 'unilateral_leg' ||
    exercise.movement_pattern === 'anti_rotation'

  if (/distancia|caminhada|corrida|esteira/.test(name)) {
    return {
      kind: 'distance',
      loadLabel: 'Distância',
      loadShortLabel: 'Dist.',
      repsLabel: 'Distância',
      unit: 'm',
      acceptsLoad: false,
      unilateral: false,
      lowerIsHarder: false,
      incrementKg: 0,
    }
  }

  if (/isometr|duracao|prancha/.test(name)) {
    return {
      kind: 'duration',
      loadLabel: 'Duração',
      loadShortLabel: 'Tempo',
      repsLabel: 'Tempo',
      unit: 's',
      acceptsLoad: false,
      unilateral,
      lowerIsHarder: false,
      incrementKg: 0,
    }
  }

  if (/assistid|assistencia/.test(`${name} ${equipment}`)) {
    return {
      kind: 'assistance',
      loadLabel: 'Assistência',
      loadShortLabel: 'Assist.',
      repsLabel: unilateral ? 'Reps/lado' : 'Reps',
      unit: 'kg',
      acceptsLoad: true,
      unilateral,
      lowerIsHarder: true,
      incrementKg: 2.5,
      helperText: 'Menos assistência significa maior dificuldade.',
    }
  }

  if (equipment.includes('halter')) {
    return {
      kind: 'per_dumbbell',
      loadLabel: 'Peso por halter',
      loadShortLabel: 'Por halter',
      repsLabel: unilateral ? 'Reps/lado' : 'Reps',
      unit: 'kg',
      acceptsLoad: true,
      unilateral,
      lowerIsHarder: false,
      incrementKg: 1,
    }
  }

  if (/corpo|roda abdominal|sem equipamento/.test(equipment)) {
    const withAddedLoad = /com carga|lastr|peso adicional/.test(`${name} ${notes}`)
    return {
      kind: withAddedLoad ? 'bodyweight_plus' : 'bodyweight',
      loadLabel: withAddedLoad ? 'Carga adicional' : 'Peso corporal',
      loadShortLabel: withAddedLoad ? 'Carga +' : 'Corpo',
      repsLabel: unilateral ? 'Reps/lado' : 'Reps',
      unit: withAddedLoad ? 'kg' : null,
      acceptsLoad: withAddedLoad,
      unilateral,
      lowerIsHarder: false,
      incrementKg: withAddedLoad ? 1 : 0,
    }
  }

  if (/sem carga|repeticoes livres/.test(`${equipment} ${notes}`)) {
    return {
      kind: 'reps_only',
      loadLabel: 'Sem carga',
      loadShortLabel: 'Livre',
      repsLabel: unilateral ? 'Reps/lado' : 'Reps',
      unit: null,
      acceptsLoad: false,
      unilateral,
      lowerIsHarder: false,
      incrementKg: 0,
    }
  }

  if (unilateral && !equipment.includes('maquina')) {
    return {
      kind: 'per_side',
      loadLabel: 'Peso por lado',
      loadShortLabel: 'Por lado',
      repsLabel: 'Reps/lado',
      unit: 'kg',
      acceptsLoad: true,
      unilateral: true,
      lowerIsHarder: false,
      incrementKg: 1,
    }
  }

  if (/maquina|cabo|polia/.test(equipment)) {
    return {
      kind: 'machine_weight',
      loadLabel: 'Peso da máquina',
      loadShortLabel: 'Máquina',
      repsLabel: unilateral ? 'Reps/lado' : 'Reps',
      unit: 'kg',
      acceptsLoad: true,
      unilateral,
      lowerIsHarder: false,
      incrementKg: 2,
    }
  }

  return {
    kind: 'external_total',
    loadLabel: 'Peso total',
    loadShortLabel: 'Peso',
    repsLabel: unilateral ? 'Reps/lado' : 'Reps',
    unit: 'kg',
    acceptsLoad: true,
    unilateral,
    lowerIsHarder: false,
    incrementKg: 2.5,
  }
}

/** Aceita teclado brasileiro (vírgula) e internacional (ponto). */
export function parseDecimalInput(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (normalized === '') return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function formatLoadValue(
  weightKg: number | null,
  config: LoadInputConfig,
  compact = false
): string {
  if (!config.acceptsLoad) {
    if (config.kind === 'bodyweight') return compact ? 'Corpo' : 'Peso corporal'
    return compact ? '—' : config.loadLabel
  }
  if (weightKg == null) return '—'
  const value = Number.isInteger(weightKg) ? weightKg.toString() : weightKg.toFixed(1)
  return `${value}${compact ? '' : ' '}${config.unit ?? ''}`.trim()
}

export function formatPreviousSet(
  weightKg: number | null,
  reps: number,
  config: LoadInputConfig
): string {
  const repsSuffix = config.kind === 'duration' ? 's' : config.kind === 'distance' ? 'm' : ''
  if (!config.acceptsLoad) return `${reps}${repsSuffix}`
  return `${formatLoadValue(weightKg, config, true)} × ${reps}`
}
