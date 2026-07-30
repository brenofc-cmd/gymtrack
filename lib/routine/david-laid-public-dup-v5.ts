/**
 * Fonte canônica da divisão DUP pública associada a David Laid, conforme
 * publicada pela Gymshark em 27/05/2026.
 *
 * Séries, repetições, ordem e esforços RM abaixo são a parte pública. RIR,
 * descansos e sugestões de carga são a camada individual do GymTrack.
 */
export const ROUTINE_VERSION = 5
export const ROUTINE_SLUG = 'david-laid-public-dup-v5'
export const ROUTINE_WEEKS = 9

export type WorkoutLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type TrainingFocus =
  | 'strength_hypertrophy'
  | 'max_strength_hypertrophy'
  | 'strength'
  | 'rest'
  | 'strength_technique'
  | 'hypertrophy'
  | 'recovery'
export type ExerciseKind = 'composto' | 'isolador' | 'abdominal'
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
  | 'calf_raise'
  | 'rear_delt'
  | 'trunk_flexion'
  | 'pelvic_curl'
  | 'anti_extension'
  | 'anti_rotation'
export type PrescriptionType = 'fixed_reps' | 'rep_range' | 'rep_max_effort'
export type ProgressionType =
  | 'fixed_target'
  | 'double_progression'
  | 'gymtrack_rm'
  | 'assistance_or_added_load'
export type FailureRiskLevel = 'low' | 'moderate' | 'high'
export type LoadUnit = 'barbell_total_kg' | 'dumbbell_each_kg' | 'added_load_kg' | 'bodyweight_or_assistance_kg'

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
  slug, name, nameEn, kind, primaryMuscle, secondaryMuscles, movementPattern,
  equipment, loadUnit, imageUrl,
  unilateral: options.unilateral ?? false,
  riskLevel: options.riskLevel ?? (kind === 'composto' ? 'high' : 'moderate'),
  defaultRestSeconds: options.defaultRestSeconds ?? (kind === 'composto' ? 180 : 90),
  incrementKg: options.incrementKg ?? (kind === 'composto' ? 2.5 : 1),
  instructions: options.instructions ?? ['Use amplitude controlada, postura estável e execução consistente.'],
  warnings: options.warnings ?? ['Interrompa se houver dor aguda ou perda importante de posição.'],
})

export const DAVID_LAID_EXERCISE_CATALOG_V5 = {
  'back-squat': exercise('back-squat', 'Agachamento livre', 'Barbell back squat', 'composto', 'quadríceps', ['glúteos', 'isquiotibiais', 'core'], 'squat', 'barra e rack', 'barbell_total_kg', '/exercises/Barbell_Full_Squat.jpg', { warnings: ['Use travas de segurança ajustadas e mantenha o brace.'] }),
  'romanian-deadlift': exercise('romanian-deadlift', 'Levantamento terra romeno', 'Romanian deadlift', 'composto', 'isquiotibiais', ['glúteos', 'eretores da coluna'], 'hip_hinge', 'barra', 'barbell_total_kg', '/exercises/Romanian_Deadlift.jpg'),
  'walking-lunge': exercise('walking-lunge', 'Afundo caminhando', 'Walking lunge', 'composto', 'quadríceps', ['glúteos', 'adutores'], 'unilateral_leg', 'halteres', 'dumbbell_each_kg', '/exercises/Split_Squat_with_Dumbbells.jpg', { unilateral: true, incrementKg: 1 }),
  'glute-ham-raise': exercise('glute-ham-raise', 'Glute-ham raise', 'Glute ham raise', 'isolador', 'isquiotibiais', ['glúteos'], 'knee_flexion', 'banco GHD', 'added_load_kg', '/exercises/Lying_Leg_Curls.jpg'),
  'reverse-hyper': exercise('reverse-hyper', 'Reverse hyper', 'Reverse hyperextension', 'isolador', 'glúteos', ['isquiotibiais', 'eretores da coluna'], 'hip_extension', 'máquina reverse hyper', 'added_load_kg', '/exercises/Barbell_Hip_Thrust.jpg'),
  'barbell-bench-press': exercise('barbell-bench-press', 'Supino reto com barra', 'Barbell bench press', 'composto', 'peito', ['tríceps', 'deltoide anterior'], 'horizontal_push', 'barra e banco', 'barbell_total_kg', '/exercises/Barbell_Bench_Press_-_Medium_Grip.jpg', { warnings: ['Use travas e spotter no esforço pesado.'] }),
  'push-press': exercise('push-press', 'Push press', 'Push press', 'composto', 'ombros', ['tríceps', 'quadríceps', 'core'], 'vertical_push', 'barra', 'barbell_total_kg', '/exercises/Machine_Shoulder_Military_Press.jpg'),
  'weighted-dip': exercise('weighted-dip', 'Paralelas com carga', 'Weighted dip', 'composto', 'peito', ['tríceps', 'deltoide anterior'], 'vertical_push', 'paralelas e cinto de carga', 'added_load_kg', '/exercises/Knee_Hip_Raise_On_Parallel_Bars.jpg'),
  'dumbbell-fly': exercise('dumbbell-fly', 'Crucifixo com halteres', 'Dumbbell fly', 'isolador', 'peito', ['deltoide anterior'], 'horizontal_push', 'halteres e banco', 'dumbbell_each_kg', '/exercises/Incline_Dumbbell_Flyes.jpg', { incrementKg: 1 }),
  'pec-deck': exercise('pec-deck', 'Peck deck', 'Pec deck fly', 'isolador', 'peito', ['deltoide anterior'], 'horizontal_push', 'máquina peck deck', 'added_load_kg', '/exercises/Reverse_Machine_Flyes.jpg'),
  'dumbbell-lateral-raise': exercise('dumbbell-lateral-raise', 'Elevação lateral com halteres', 'Dumbbell lateral raise', 'isolador', 'deltoide lateral', [], 'lateral_delt', 'halteres', 'dumbbell_each_kg', '/exercises/Side_Lateral_Raise.jpg', { riskLevel: 'low', incrementKg: 1 }),
  'skull-crusher': exercise('skull-crusher', 'Tríceps testa', 'Skull crusher', 'isolador', 'tríceps', [], 'elbow_extension', 'barra W e banco', 'barbell_total_kg', '/exercises/EZ-Bar_Skullcrusher.jpg'),
  'dumbbell-triceps-extension': exercise('dumbbell-triceps-extension', 'Extensão de tríceps com halter', 'Dumbbell triceps extension', 'isolador', 'tríceps', [], 'elbow_extension', 'halter', 'added_load_kg', '/exercises/Cable_Rope_Overhead_Triceps_Extension.jpg'),
  'conventional-deadlift': exercise('conventional-deadlift', 'Levantamento terra convencional', 'Conventional deadlift', 'composto', 'cadeia posterior', ['glúteos', 'isquiotibiais', 'costas', 'core'], 'hip_hinge', 'barra', 'barbell_total_kg', '/exercises/Romanian_Deadlift.jpg', { incrementKg: 2.5, warnings: ['Interrompa com dor ou perda importante da posição lombar.'] }),
  'stiff-leg-deadlift': exercise('stiff-leg-deadlift', 'Stiff-leg deadlift', 'Stiff-leg deadlift', 'composto', 'isquiotibiais', ['glúteos', 'eretores da coluna'], 'hip_hinge', 'barra', 'barbell_total_kg', '/exercises/Romanian_Deadlift.jpg'),
  'deficit-stiff-leg-deadlift': exercise('deficit-stiff-leg-deadlift', 'Stiff-leg deadlift em déficit', 'Deficit stiff-leg deadlift', 'composto', 'isquiotibiais', ['glúteos', 'eretores da coluna'], 'hip_hinge', 'barra e plataforma de 5–7,5 cm', 'barbell_total_kg', '/exercises/Romanian_Deadlift.jpg'),
  'pull-up': exercise('pull-up', 'Barra fixa', 'Pull-up', 'composto', 'costas', ['bíceps', 'antebraços'], 'vertical_pull', 'barra fixa, cinto ou assistência', 'bodyweight_or_assistance_kg', '/exercises/Band_Assisted_Pull-Up.jpg', { incrementKg: 1 }),
  'yates-row': exercise('yates-row', 'Yates row', 'Yates row', 'composto', 'costas', ['bíceps', 'deltoide posterior'], 'horizontal_pull', 'barra', 'barbell_total_kg', '/exercises/Bent_Over_Barbell_Row.jpg'),
  'barbell-shrug': exercise('barbell-shrug', 'Encolhimento', 'Barbell shrug', 'isolador', 'trapézio', ['antebraços'], 'horizontal_pull', 'barra', 'barbell_total_kg', '/exercises/Bent_Over_Barbell_Row.jpg'),
  'barbell-curl': exercise('barbell-curl', 'Rosca direta com barra', 'Barbell curl', 'isolador', 'bíceps', ['braquial', 'antebraços'], 'elbow_flexion', 'barra', 'barbell_total_kg', '/exercises/EZ-Bar_Curl.jpg'),
  'seated-hammer-curl': exercise('seated-hammer-curl', 'Rosca martelo sentada', 'Seated hammer curl', 'isolador', 'bíceps', ['braquial', 'antebraços'], 'elbow_flexion', 'halteres e banco', 'dumbbell_each_kg', '/exercises/Hammer_Curls.jpg', { incrementKg: 1 }),
  'barbell-overhead-press': exercise('barbell-overhead-press', 'Desenvolvimento militar com barra', 'Barbell overhead press', 'composto', 'ombros', ['tríceps', 'core'], 'vertical_push', 'barra e rack', 'barbell_total_kg', '/exercises/Machine_Shoulder_Military_Press.jpg'),
  'incline-barbell-bench-press': exercise('incline-barbell-bench-press', 'Supino inclinado com barra', 'Incline barbell bench press', 'composto', 'peito', ['tríceps', 'deltoide anterior'], 'incline_push', 'barra e banco inclinado', 'barbell_total_kg', '/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip.jpg'),
} satisfies Record<string, ExerciseCatalogDef>

export type ExerciseSlug = keyof typeof DAVID_LAID_EXERCISE_CATALOG_V5

export interface RoutineExerciseDef extends ExerciseCatalogDef {
  exerciseSlug: ExerciseSlug
  sets: number
  repsMin: number
  repsMax: number
  prescriptionType: PrescriptionType
  fixedReps?: number
  repMaxTarget?: 1 | 3 | 5
  prescriptionLocked: true
  rirMin: number
  rirMax: number
  restSeconds: number
  progressionType: ProgressionType
  substitutions: ExerciseSlug[]
  defaultSetRole: 'standard' | 'backoff'
  /** Campos de compatibilidade para o gerador legado; não alteram a prescrição pública. */
  guidance: string[]
  aestheticFunction: string
  perSide: boolean
  failureAllowed: boolean
  topSetEnabled: boolean
  backoffPercentage?: number
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

const WARMUP = 'Aquecimento progressivo sugerido pelo GymTrack. Séries de aquecimento ficam separadas e não contam no volume prescrito.'
const prescribed = (
  exerciseSlug: ExerciseSlug,
  sets: number,
  repsMin: number,
  repsMax = repsMin,
  options: Partial<Pick<RoutineExerciseDef, 'prescriptionType' | 'repMaxTarget' | 'substitutions' | 'defaultSetRole' | 'restSeconds' | 'rirMin' | 'rirMax' | 'progressionType'>> = {}
): RoutineExerciseDef => {
  const catalog = DAVID_LAID_EXERCISE_CATALOG_V5[exerciseSlug]
  const prescriptionType = options.prescriptionType ?? (repsMin === repsMax ? 'fixed_reps' : 'rep_range')
  return {
    ...catalog,
    exerciseSlug,
    sets,
    repsMin,
    repsMax,
    prescriptionType,
    fixedReps: prescriptionType === 'fixed_reps' ? repsMin : undefined,
    repMaxTarget: options.repMaxTarget,
    prescriptionLocked: true,
    rirMin: options.rirMin ?? (prescriptionType === 'rep_max_effort' ? 0 : 1),
    rirMax: options.rirMax ?? (prescriptionType === 'rep_max_effort' ? 1 : 2),
    restSeconds: options.restSeconds ?? catalog.defaultRestSeconds,
    progressionType: options.progressionType ?? (prescriptionType === 'rep_range' ? 'double_progression' : prescriptionType === 'rep_max_effort' ? 'gymtrack_rm' : 'fixed_target'),
    substitutions: options.substitutions ?? [],
    defaultSetRole: options.defaultSetRole ?? 'standard',
    guidance: catalog.instructions,
    aestheticFunction: `Desenvolvimento de ${catalog.primaryMuscle}.`,
    perSide: catalog.unilateral,
    failureAllowed: false,
    topSetEnabled: false,
    backoffPercentage: undefined,
  }
}
const rm = (slug: ExerciseSlug, target: 1 | 3 | 5) =>
  prescribed(slug, 1, target, target, { prescriptionType: 'rep_max_effort', repMaxTarget: target, restSeconds: 300 })
const backoff = (slug: ExerciseSlug, sets: number, reps: number) =>
  prescribed(slug, sets, reps, reps, { defaultSetRole: 'backoff', rirMin: 1, rirMax: 2 })

export const DAVID_LAID_PUBLIC_DUP_V5: RoutineDayDef[] = [
  { letter: 'A', dayOfWeek: 1, name: 'Legs 1', focus: 'strength_hypertrophy', focusLabel: 'Força no agachamento + hipertrofia de pernas', objective: 'Desenvolver força no agachamento e hipertrofia dos membros inferiores.', warmupNote: WARMUP, exercises: [rm('back-squat', 5), backoff('back-squat', 4, 12), prescribed('romanian-deadlift', 3, 10), prescribed('walking-lunge', 3, 10), prescribed('glute-ham-raise', 3, 10, 10, { substitutions: ['reverse-hyper'] })] },
  { letter: 'B', dayOfWeek: 2, name: 'Push 1', focus: 'max_strength_hypertrophy', focusLabel: 'Força máxima no supino + hipertrofia de peito, ombros e tríceps', objective: 'Desenvolver força máxima no supino e hipertrofia dos músculos de empurrar.', warmupNote: WARMUP, exercises: [rm('barbell-bench-press', 1), backoff('barbell-bench-press', 4, 4), prescribed('push-press', 3, 4), prescribed('weighted-dip', 3, 10), prescribed('dumbbell-fly', 3, 10, 10, { substitutions: ['pec-deck'] }), prescribed('dumbbell-lateral-raise', 3, 10), prescribed('skull-crusher', 3, 10), prescribed('dumbbell-triceps-extension', 3, 10)] },
  { letter: 'C', dayOfWeek: 3, name: 'Pull 1', focus: 'strength_hypertrophy', focusLabel: 'Força no levantamento terra + hipertrofia de costas e bíceps', objective: 'Desenvolver força no levantamento terra e hipertrofia da cadeia posterior.', warmupNote: WARMUP, exercises: [rm('conventional-deadlift', 3), backoff('conventional-deadlift', 4, 6), prescribed('stiff-leg-deadlift', 3, 10), prescribed('pull-up', 3, 8, 10, { progressionType: 'assistance_or_added_load' }), prescribed('yates-row', 3, 10), prescribed('barbell-shrug', 3, 10), prescribed('barbell-curl', 3, 10), prescribed('seated-hammer-curl', 3, 10)] },
  { letter: 'D', dayOfWeek: 4, name: 'Legs 2', focus: 'strength_hypertrophy', focusLabel: 'Força moderada no agachamento + hipertrofia de pernas', objective: 'Desenvolver força moderada no agachamento e hipertrofia dos membros inferiores.', warmupNote: WARMUP, exercises: [rm('back-squat', 3), backoff('back-squat', 4, 8), prescribed('romanian-deadlift', 3, 10), prescribed('walking-lunge', 3, 10), prescribed('glute-ham-raise', 3, 10, 10, { substitutions: ['reverse-hyper'] })] },
  { letter: 'E', dayOfWeek: 5, name: 'Push 2', focus: 'strength_hypertrophy', focusLabel: 'Força no desenvolvimento + hipertrofia de ombros e tríceps', objective: 'Desenvolver força acima da cabeça e hipertrofia de ombros e tríceps.', warmupNote: WARMUP, exercises: [rm('barbell-overhead-press', 5), backoff('barbell-overhead-press', 4, 12), prescribed('incline-barbell-bench-press', 3, 12), prescribed('dumbbell-lateral-raise', 3, 10), prescribed('weighted-dip', 3, 10), prescribed('dumbbell-triceps-extension', 3, 10), prescribed('skull-crusher', 3, 10)] },
  { letter: 'F', dayOfWeek: 6, name: 'Pull 2', focus: 'max_strength_hypertrophy', focusLabel: 'Força máxima no levantamento terra + hipertrofia de costas e bíceps', objective: 'Desenvolver força elevada no levantamento terra e hipertrofia de costas e bíceps.', warmupNote: WARMUP, exercises: [rm('conventional-deadlift', 1), backoff('conventional-deadlift', 4, 2), prescribed('deficit-stiff-leg-deadlift', 3, 10), prescribed('pull-up', 3, 8, 10, { progressionType: 'assistance_or_added_load' }), prescribed('yates-row', 3, 10), prescribed('barbell-shrug', 3, 10), prescribed('barbell-curl', 3, 10), prescribed('seated-hammer-curl', 3, 10)] },
]

export const DIA_LABEL: Record<number, string> = { 1: 'Segunda-feira', 2: 'Terça-feira', 3: 'Quarta-feira', 4: 'Quinta-feira', 5: 'Sexta-feira', 6: 'Sábado', 7: 'Domingo' }
export const TRAINING_FOCUS_LABEL: Record<TrainingFocus, string> = { strength_hypertrophy: 'Força + hipertrofia', max_strength_hypertrophy: 'Força máxima + hipertrofia', strength: 'Força', rest: 'Descanso', strength_technique: 'Força técnica', hypertrophy: 'Hipertrofia', recovery: 'Recuperação' }
export const MOVEMENT_PATTERN_LABEL: Record<MovementPattern, string> = { horizontal_push: 'Empurrar horizontal', incline_push: 'Empurrar inclinado', vertical_push: 'Empurrar vertical', vertical_pull: 'Puxar vertical', horizontal_pull: 'Puxar horizontal', squat: 'Agachamento', hip_hinge: 'Dobradiça de quadril', unilateral_leg: 'Unilateral de pernas', knee_flexion: 'Flexão de joelho', hip_extension: 'Extensão de quadril', lateral_delt: 'Deltoide lateral', elbow_flexion: 'Flexão de cotovelo', elbow_extension: 'Extensão de cotovelo', calf_raise: 'Panturrilha', rear_delt: 'Deltoide posterior', trunk_flexion: 'Flexão do tronco', pelvic_curl: 'Retroversão pélvica', anti_extension: 'Anti-extensão', anti_rotation: 'Anti-rotação' }
export const AVISO_GERAL = 'A prescrição permanece igual à rotina pública. Cargas, RIR, descansos, readiness e deload são a camada de progressão individual do GymTrack.'

export function prescriptionLabel(exercise: { target_sets: number; target_reps_min: number; target_reps_max: number; prescription_type?: string | null; rep_max_target?: number | null }) {
  if (exercise.prescription_type === 'rep_max_effort') return `1 série principal de ${exercise.rep_max_target}RM`
  const reps = exercise.target_reps_min === exercise.target_reps_max ? exercise.target_reps_min : `${exercise.target_reps_min}–${exercise.target_reps_max}`
  return `${exercise.target_sets} séries × ${reps} repetições`
}
export function directVolumeByMuscle(routine: RoutineDayDef[] = DAVID_LAID_PUBLIC_DUP_V5) {
  return routine.flatMap((day) => day.exercises).reduce<Record<string, number>>((volume, item) => {
    volume[item.primaryMuscle] = (volume[item.primaryMuscle] ?? 0) + item.sets
    return volume
  }, {})
}
export function secondaryVolumeByMuscle(routine: RoutineDayDef[] = DAVID_LAID_PUBLIC_DUP_V5) {
  return routine.flatMap((day) => day.exercises).reduce<Record<string, number>>((volume, item) => {
    for (const muscle of item.secondaryMuscles) volume[muscle] = (volume[muscle] ?? 0) + item.sets * 0.5
    return volume
  }, {})
}
