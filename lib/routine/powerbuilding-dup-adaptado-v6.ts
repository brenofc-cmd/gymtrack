/**
 * Powerbuilding DUP Adaptado — bloco de oito semanas.
 *
 * Inspirado na estrutura powerbuilding associada a David Laid, mas adaptado
 * para praticantes iniciantes: sem tentativas RM, volume posterior reduzido,
 * progressão após duas exposições válidas e deload obrigatório na semana 8.
 */
export const ROUTINE_VERSION = 6
export const ROUTINE_SLUG = 'powerbuilding-dup-adaptado-v6'
export const ROUTINE_NAME = 'Powerbuilding DUP Adaptado — 8 semanas'
export const ROUTINE_WEEKS = 8

export type WorkoutLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type TrainingFocus =
  | 'strength_hypertrophy'
  | 'max_strength_hypertrophy'
  | 'strength'
  | 'strength_technique'
  | 'hypertrophy'
  | 'recovery'
  | 'rest'
export type ExerciseKind = 'composto' | 'isolador' | 'abdominal'
export type FailureRiskLevel = 'low' | 'moderate' | 'high'
export type MovementPattern =
  | 'horizontal_push'
  | 'incline_push'
  | 'vertical_push'
  | 'vertical_pull'
  | 'horizontal_pull'
  | 'squat'
  | 'hip_hinge'
  | 'unilateral_leg'
  | 'knee_flexion'
  | 'hip_extension'
  | 'lateral_delt'
  | 'elbow_flexion'
  | 'elbow_extension'
  | 'trunk_flexion'
  | 'pelvic_curl'
export type LoadUnit =
  | 'barbell_total_kg'
  | 'dumbbell_each_kg'
  | 'added_load_kg'
  | 'bodyweight_or_assistance_kg'

export interface ExerciseCatalogDef {
  slug: string
  name: string
  nameEn: string
  kind: ExerciseKind
  primaryMuscle: string
  secondaryMuscles: string[]
  movementPattern: MovementPattern
  equipment: string
  loadUnit: LoadUnit
  unilateral: boolean
  instructions: string[]
  warnings: string[]
  imageUrl: string
  riskLevel: FailureRiskLevel
  defaultRestSeconds: number
  incrementKg: number
}

const exercise = (
  slug: string,
  name: string,
  nameEn: string,
  kind: ExerciseKind,
  primaryMuscle: string,
  secondaryMuscles: string[],
  movementPattern: MovementPattern,
  equipment: string,
  loadUnit: LoadUnit,
  imageUrl: string,
  options: Partial<Pick<ExerciseCatalogDef, 'unilateral' | 'riskLevel' | 'defaultRestSeconds' | 'incrementKg' | 'warnings' | 'instructions'>> = {}
): ExerciseCatalogDef => ({
  slug,
  name,
  nameEn,
  kind,
  primaryMuscle,
  secondaryMuscles,
  movementPattern,
  equipment,
  loadUnit,
  imageUrl,
  unilateral: options.unilateral ?? false,
  riskLevel: options.riskLevel ?? (kind === 'composto' ? 'high' : 'moderate'),
  defaultRestSeconds: options.defaultRestSeconds ?? (kind === 'composto' ? 180 : 75),
  incrementKg: options.incrementKg ?? (kind === 'composto' ? 2.5 : 1),
  instructions: options.instructions ?? ['Use amplitude controlada, postura estável e execução consistente.'],
  warnings: options.warnings ?? ['Interrompa se houver dor ou perda importante da posição.'],
})

export const POWERBUILDING_DUP_EXERCISE_CATALOG_V6 = {
  'back-squat': exercise('back-squat', 'Agachamento livre', 'Barbell back squat', 'composto', 'quadríceps', ['glúteos', 'isquiotibiais', 'core'], 'squat', 'barra e rack', 'barbell_total_kg', '/exercises/Barbell_Full_Squat.jpg', { warnings: ['Use travas de segurança ajustadas e mantenha o brace.'] }),
  'romanian-deadlift': exercise('romanian-deadlift', 'Levantamento terra romeno', 'Romanian deadlift', 'composto', 'isquiotibiais', ['glúteos', 'eretores da coluna'], 'hip_hinge', 'barra', 'barbell_total_kg', '/exercises/Romanian_Deadlift.jpg'),
  'walking-lunge': exercise('walking-lunge', 'Afundo caminhando', 'Walking lunge', 'composto', 'quadríceps', ['glúteos', 'adutores'], 'unilateral_leg', 'halteres', 'dumbbell_each_kg', '/exercises/Dumbbell_Lunges.jpg', { unilateral: true, defaultRestSeconds: 90, incrementKg: 1 }),
  'glute-ham-raise': exercise('glute-ham-raise', 'Glute-ham raise', 'Glute ham raise', 'isolador', 'isquiotibiais', ['glúteos'], 'knee_flexion', 'banco GHD', 'added_load_kg', '/exercises/Glute_Ham_Raise.jpg'),
  'reverse-hyper': exercise('reverse-hyper', 'Reverse hyper', 'Reverse hyperextension', 'isolador', 'glúteos', ['isquiotibiais', 'eretores da coluna'], 'hip_extension', 'máquina reverse hyper', 'added_load_kg', '/exercises/Reverse_Hyperextension.jpg', { instructions: ['Use carga leve, movimento controlado e termine sem hiperestender a lombar.'] }),
  'barbell-bench-press': exercise('barbell-bench-press', 'Supino reto com barra', 'Barbell bench press', 'composto', 'peito', ['tríceps', 'deltoide anterior'], 'horizontal_push', 'barra e banco', 'barbell_total_kg', '/exercises/Barbell_Bench_Press_-_Medium_Grip.jpg', { warnings: ['Use travas e spotter nas séries pesadas.'] }),
  'push-press': exercise('push-press', 'Push press', 'Push press', 'composto', 'ombros', ['tríceps', 'quadríceps', 'core'], 'vertical_push', 'barra', 'barbell_total_kg', '/exercises/Push_Press.jpg'),
  'weighted-dip': exercise('weighted-dip', 'Paralelas com carga', 'Weighted dip', 'composto', 'peito', ['tríceps', 'deltoide anterior'], 'vertical_push', 'paralelas e cinto de carga', 'added_load_kg', '/exercises/Parallel_Bar_Dip.jpg', {
    defaultRestSeconds: 120,
    incrementKg: 1,
    instructions: ['Comece somente com o peso corporal. Acrescente carga quando completar todas as séries com execução controlada.'],
  }),
  'pec-deck': exercise('pec-deck', 'Peck deck', 'Pec deck fly', 'isolador', 'peito', ['deltoide anterior'], 'horizontal_push', 'máquina peck deck', 'added_load_kg', '/exercises/Butterfly.jpg'),
  'dumbbell-lateral-raise': exercise('dumbbell-lateral-raise', 'Elevação lateral com halteres', 'Dumbbell lateral raise', 'isolador', 'deltoide lateral', [], 'lateral_delt', 'halteres', 'dumbbell_each_kg', '/exercises/Side_Lateral_Raise.jpg', { riskLevel: 'low', incrementKg: 1 }),
  'skull-crusher': exercise('skull-crusher', 'Tríceps testa', 'Skull crusher', 'isolador', 'tríceps', [], 'elbow_extension', 'barra W e banco', 'barbell_total_kg', '/exercises/EZ-Bar_Skullcrusher.jpg'),
  'dumbbell-triceps-extension': exercise('dumbbell-triceps-extension', 'Extensão de tríceps acima da cabeça com halter', 'Overhead dumbbell triceps extension', 'isolador', 'tríceps', [], 'elbow_extension', 'halter', 'added_load_kg', '/exercises/Standing_Dumbbell_Triceps_Extension.jpg'),
  'triceps-pushdown': exercise('triceps-pushdown', 'Tríceps na polia', 'Cable triceps pushdown', 'isolador', 'tríceps', [], 'elbow_extension', 'polia com barra ou corda', 'added_load_kg', '/exercises/Triceps_Pushdown_-_Rope_Attachment.jpg'),
  'conventional-deadlift': exercise('conventional-deadlift', 'Levantamento terra convencional', 'Conventional deadlift', 'composto', 'cadeia posterior', ['glúteos', 'isquiotibiais', 'costas', 'core'], 'hip_hinge', 'barra', 'barbell_total_kg', '/exercises/Barbell_Deadlift.jpg', { warnings: ['Interrompa com dor ou perda importante da posição lombar.'] }),
  'deficit-stiff-leg-deadlift': exercise('deficit-stiff-leg-deadlift', 'Stiff-leg deadlift em déficit baixo', 'Low-deficit stiff-leg deadlift', 'composto', 'isquiotibiais', ['glúteos', 'eretores da coluna'], 'hip_hinge', 'barra e plataforma baixa de 3–5 cm', 'barbell_total_kg', '/exercises/Stiff_Leg_Deadlift_Low_Deficit.jpg', {
    instructions: ['Use déficit pequeno, coluna estável, barra próxima das pernas e amplitude sem arredondar a lombar.'],
    warnings: ['Retire o déficit se perder posição, mobilidade ou sentir dor.'],
  }),
  'pull-up': exercise('pull-up', 'Barra fixa', 'Pull-up', 'composto', 'costas', ['bíceps', 'antebraços'], 'vertical_pull', 'barra fixa, cinto ou assistência', 'bodyweight_or_assistance_kg', '/exercises/Pullups.jpg', { defaultRestSeconds: 150, incrementKg: 1 }),
  'yates-row': exercise('yates-row', 'Remada Yates', 'Yates row', 'composto', 'costas', ['bíceps', 'deltoide posterior'], 'horizontal_pull', 'barra', 'barbell_total_kg', '/exercises/Reverse_Grip_Bent-Over_Rows.jpg', {
    defaultRestSeconds: 150,
    instructions: ['Use pegada supinada, tronco mais elevado, cotovelos próximos e puxe para a parte inferior do abdômen.'],
  }),
  'barbell-shrug': exercise('barbell-shrug', 'Encolhimento', 'Barbell shrug', 'isolador', 'trapézio', ['antebraços'], 'horizontal_pull', 'barra', 'barbell_total_kg', '/exercises/Barbell_Shrug.jpg'),
  'barbell-curl': exercise('barbell-curl', 'Rosca direta com barra', 'Barbell curl', 'isolador', 'bíceps', ['braquial', 'antebraços'], 'elbow_flexion', 'barra', 'barbell_total_kg', '/exercises/EZ-Bar_Curl.jpg'),
  'seated-hammer-curl': exercise('seated-hammer-curl', 'Rosca martelo sentada', 'Seated hammer curl', 'isolador', 'bíceps', ['braquial', 'antebraços'], 'elbow_flexion', 'halteres e banco', 'dumbbell_each_kg', '/exercises/Seated_Hammer_Curl.jpg', {
    incrementKg: 1,
    instructions: ['Sente-se com tronco estável, pegada neutra, braços próximos ao corpo e sem balanço.'],
  }),
  'cable-crunch': exercise('cable-crunch', 'Abdominal no cabo', 'Cable crunch', 'abdominal', 'abdômen', [], 'trunk_flexion', 'polia alta e corda', 'added_load_kg', '/exercises/Cable_Crunch.jpg'),
  'reverse-crunch': exercise('reverse-crunch', 'Reverse crunch', 'Reverse crunch', 'abdominal', 'abdômen', [], 'pelvic_curl', 'colchonete ou banco', 'added_load_kg', '/exercises/Reverse_Crunch.jpg', { riskLevel: 'low' }),
  'barbell-overhead-press': exercise('barbell-overhead-press', 'Desenvolvimento militar com barra', 'Barbell overhead press', 'composto', 'ombros', ['tríceps', 'core'], 'vertical_push', 'barra e rack', 'barbell_total_kg', '/exercises/Standing_Military_Press.jpg'),
  'incline-barbell-bench-press': exercise('incline-barbell-bench-press', 'Supino inclinado com barra', 'Incline barbell bench press', 'composto', 'peito', ['tríceps', 'deltoide anterior'], 'incline_push', 'barra e banco inclinado', 'barbell_total_kg', '/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip.jpg', { defaultRestSeconds: 150 }),
} satisfies Record<string, ExerciseCatalogDef>

export type ExerciseSlug = keyof typeof POWERBUILDING_DUP_EXERCISE_CATALOG_V6

export interface RoutineExerciseDef extends ExerciseCatalogDef {
  exerciseSlug: ExerciseSlug
  sets: number
  repsMin: number
  repsMax: number
  prescriptionType: 'fixed_reps'
  fixedReps: number
  prescriptionLocked: true
  rirMin: number
  rirMax: number
  restSeconds: number
  progressionType: 'fixed_target' | 'assistance_or_added_load'
  supersetGroup: number | null
  defaultSetRole: 'standard'
  failureAllowed: false
  topSetEnabled: false
}

export interface RoutineDayDef {
  letter: WorkoutLetter
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  focus: TrainingFocus
  focusLabel: string
  objective: string
  warmupNote: string
  exercises: RoutineExerciseDef[]
}

const WARMUP = 'Aquecimento de 8–10 minutos e séries progressivas. O aquecimento não conta no volume prescrito.'
const prescribed = (
  exerciseSlug: ExerciseSlug,
  sets: number,
  reps: number,
  options: Partial<Pick<RoutineExerciseDef, 'restSeconds' | 'rirMin' | 'rirMax' | 'progressionType' | 'supersetGroup'>> = {}
): RoutineExerciseDef => {
  const catalog = POWERBUILDING_DUP_EXERCISE_CATALOG_V6[exerciseSlug]
  return {
    ...catalog,
    exerciseSlug,
    sets,
    repsMin: reps,
    repsMax: reps,
    prescriptionType: 'fixed_reps',
    fixedReps: reps,
    prescriptionLocked: true,
    rirMin: options.rirMin ?? (catalog.kind === 'composto' ? 2 : 1),
    rirMax: options.rirMax ?? 2,
    restSeconds: options.restSeconds ?? catalog.defaultRestSeconds,
    progressionType: options.progressionType ?? (exerciseSlug === 'pull-up' ? 'assistance_or_added_load' : 'fixed_target'),
    supersetGroup: options.supersetGroup ?? null,
    defaultSetRole: 'standard',
    failureAllowed: false,
    topSetEnabled: false,
  }
}

export const POWERBUILDING_DUP_ADAPTADO_V6: RoutineDayDef[] = [
  {
    letter: 'A', dayOfWeek: 1, name: 'Legs 1', focus: 'strength_hypertrophy',
    focusLabel: 'Força no agachamento + hipertrofia de pernas',
    objective: 'Priorizar agachamento e treinar posterior sem excesso de dobradiças.',
    warmupNote: WARMUP,
    exercises: [
      prescribed('back-squat', 4, 5),
      prescribed('romanian-deadlift', 3, 8),
      prescribed('walking-lunge', 3, 10, { rirMin: 1, rirMax: 2 }),
      prescribed('glute-ham-raise', 3, 10),
    ],
  },
  {
    letter: 'B', dayOfWeek: 2, name: 'Push 1', focus: 'strength_hypertrophy',
    focusLabel: 'Força no supino + hipertrofia de peito, ombros e tríceps',
    objective: 'Desenvolver força no supino e volume de empurrar com supersets apenas nos isoladores.',
    warmupNote: WARMUP,
    exercises: [
      prescribed('barbell-bench-press', 4, 4),
      prescribed('push-press', 3, 5),
      prescribed('weighted-dip', 3, 8),
      prescribed('pec-deck', 2, 12, { supersetGroup: 1 }),
      prescribed('dumbbell-lateral-raise', 3, 15, { supersetGroup: 1 }),
      prescribed('skull-crusher', 2, 10),
      prescribed('triceps-pushdown', 2, 12),
    ],
  },
  {
    letter: 'C', dayOfWeek: 3, name: 'Pull 1', focus: 'strength_hypertrophy',
    focusLabel: 'Força no levantamento terra + hipertrofia de costas e bíceps',
    objective: 'Treinar o terra sem stiff adicional e completar costas, braços e abdômen.',
    warmupNote: WARMUP,
    exercises: [
      prescribed('conventional-deadlift', 3, 4),
      prescribed('pull-up', 3, 8),
      prescribed('yates-row', 3, 8),
      prescribed('barbell-shrug', 2, 10, { supersetGroup: 1 }),
      prescribed('barbell-curl', 2, 10, { supersetGroup: 1 }),
      prescribed('seated-hammer-curl', 2, 10, { supersetGroup: 2 }),
      prescribed('cable-crunch', 3, 12, { supersetGroup: 2 }),
    ],
  },
  {
    letter: 'D', dayOfWeek: 4, name: 'Legs 2', focus: 'hypertrophy',
    focusLabel: 'Hipertrofia de pernas + reverse hyper leve',
    objective: 'Treinar pernas sem repetir levantamento terra romeno e controlar a fadiga lombar.',
    warmupNote: WARMUP,
    exercises: [
      prescribed('back-squat', 4, 8),
      prescribed('walking-lunge', 3, 10, { rirMin: 1, rirMax: 2 }),
      prescribed('reverse-hyper', 3, 12),
    ],
  },
  {
    letter: 'E', dayOfWeek: 5, name: 'Push 2', focus: 'strength_hypertrophy',
    focusLabel: 'Força no desenvolvimento + hipertrofia de peito, ombros e tríceps',
    objective: 'Priorizar desenvolvimento militar e usar apenas um movimento acima da cabeça para tríceps.',
    warmupNote: WARMUP,
    exercises: [
      prescribed('barbell-overhead-press', 4, 6),
      prescribed('incline-barbell-bench-press', 3, 10),
      prescribed('weighted-dip', 3, 10),
      prescribed('dumbbell-lateral-raise', 3, 15, { supersetGroup: 1 }),
      prescribed('triceps-pushdown', 2, 12, { supersetGroup: 1 }),
      prescribed('dumbbell-triceps-extension', 2, 12),
    ],
  },
  {
    letter: 'F', dayOfWeek: 6, name: 'Pull 2', focus: 'strength_technique',
    focusLabel: 'Técnica no levantamento terra + hipertrofia de costas e bíceps',
    objective: 'Praticar terra técnico com RIR 3 e usar déficit pequeno somente com coluna estável e sem dor.',
    warmupNote: WARMUP,
    exercises: [
      prescribed('conventional-deadlift', 3, 3, { rirMin: 3, rirMax: 3 }),
      prescribed('deficit-stiff-leg-deadlift', 2, 10, { rirMin: 3, rirMax: 3 }),
      prescribed('pull-up', 3, 10),
      prescribed('yates-row', 3, 10),
      prescribed('barbell-shrug', 2, 12, { supersetGroup: 1 }),
      prescribed('barbell-curl', 2, 12, { supersetGroup: 1 }),
      prescribed('seated-hammer-curl', 2, 12, { supersetGroup: 2 }),
      prescribed('reverse-crunch', 3, 12, { supersetGroup: 2 }),
    ],
  },
]

export type ProgramWeekPhase = 'adaptation' | 'progression' | 'consolidation' | 'deload'

export function programWeekPhase(week: number): ProgramWeekPhase {
  if (week <= 2) return 'adaptation'
  if (week <= 6) return 'progression'
  if (week === 7) return 'consolidation'
  return 'deload'
}

export function progressionAllowedForProgramWeek(week: number) {
  return programWeekPhase(week) === 'progression'
}

export function effectiveTargetsForProgramWeek(
  base: { target_sets: number; rir_min: number | null; rir_max: number | null },
  exerciseType: string | null,
  week: number
) {
  const phase = programWeekPhase(week)
  if (phase === 'deload') {
    return {
      target_sets: Math.max(1, Math.round(base.target_sets * 0.6)),
      rir_min: 3,
      rir_max: 4,
      is_deload: true,
    }
  }
  if (phase === 'adaptation') {
    return {
      target_sets: base.target_sets,
      rir_min: exerciseType === 'composto' ? 3 : 2,
      rir_max: 3,
      is_deload: false,
    }
  }
  return {
    target_sets: base.target_sets,
    rir_min: base.rir_min,
    rir_max: base.rir_max,
    is_deload: false,
  }
}

export const DIA_LABEL: Record<number, string> = {
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
  7: 'Domingo',
}

export const TRAINING_FOCUS_LABEL: Record<TrainingFocus, string> = {
  strength_hypertrophy: 'Força + hipertrofia',
  max_strength_hypertrophy: 'Força máxima + hipertrofia',
  strength: 'Força',
  strength_technique: 'Força técnica',
  hypertrophy: 'Hipertrofia',
  recovery: 'Recuperação',
  rest: 'Descanso',
}

export const MOVEMENT_PATTERN_LABEL: Record<MovementPattern, string> = {
  horizontal_push: 'Empurrar horizontal',
  incline_push: 'Empurrar inclinado',
  vertical_push: 'Empurrar vertical',
  vertical_pull: 'Puxar vertical',
  horizontal_pull: 'Puxar horizontal',
  squat: 'Agachamento',
  hip_hinge: 'Dobradiça de quadril',
  unilateral_leg: 'Unilateral de pernas',
  knee_flexion: 'Flexão de joelho',
  hip_extension: 'Extensão de quadril',
  lateral_delt: 'Deltoide lateral',
  elbow_flexion: 'Flexão de cotovelo',
  elbow_extension: 'Extensão de cotovelo',
  trunk_flexion: 'Flexão do tronco',
  pelvic_curl: 'Retroversão pélvica',
}

export const AVISO_GERAL =
  'Programa adaptado de powerbuilding: oito semanas, sem testes máximos, progressão após duas exposições válidas e deload obrigatório na semana 8.'

export function prescriptionLabel(exercise: {
  target_sets: number
  target_reps_min: number
  target_reps_max: number
}) {
  const reps = exercise.target_reps_min === exercise.target_reps_max
    ? exercise.target_reps_min
    : `${exercise.target_reps_min}–${exercise.target_reps_max}`
  return `${exercise.target_sets} séries × ${reps} repetições`
}

export function directVolumeByMuscle(routine: RoutineDayDef[] = POWERBUILDING_DUP_ADAPTADO_V6) {
  return routine.flatMap((day) => day.exercises).reduce<Record<string, number>>((volume, item) => {
    volume[item.primaryMuscle] = (volume[item.primaryMuscle] ?? 0) + item.sets
    return volume
  }, {})
}

export function secondaryVolumeByMuscle(routine: RoutineDayDef[] = POWERBUILDING_DUP_ADAPTADO_V6) {
  return routine.flatMap((day) => day.exercises).reduce<Record<string, number>>((volume, item) => {
    for (const muscle of item.secondaryMuscles) volume[muscle] = (volume[muscle] ?? 0) + item.sets * 0.5
    return volume
  }, {})
}
