/**
 * David Laid Powerbuilding DUP — Guided Load v7.
 *
 * Fontes: https://www.gymshark.com/blog/article/david-laid-workout e
 * https://davidlaid.com/products/dup — mesma divisão pública A–F, mesma
 * ordem de dias e exercícios, mesmas séries/repetições-fonte da
 * `lib/routine/david-laid-gymshark-exact-v7.ts`. A diferença é que os
 * esforços de 1RM/3RM/5RM da fonte viram top sets técnicos (RIR 2, sem
 * tentativa máxima obrigatória), com carga inicial por percentual de e1RM.
 * O programa pago (davidlaid.com) informa ter calculadora própria mas não
 * publica fórmulas — nenhum percentual aqui é inferido dela.
 */
export const ROUTINE_VERSION = 8
export const ROUTINE_SLUG = 'david-laid-guided-load-v7'
export const ROUTINE_NAME = 'David Laid Powerbuilding DUP — Guided Load v7'
export const ROUTINE_DESCRIPTION =
  'Rotina baseada, na mesma sequência, exercícios, séries e repetições, na divisão Powerbuilding DUP publicamente associada a David Laid pela Gymshark, com orientação própria do GymTrack para carga, RIR, aquecimento, técnica, progressão, recuperação e segurança.'

export const SOURCE_DISCLAIMER =
  'Os exercícios, a ordem, as séries e as repetições são baseados na rotina pública associada a David Laid pela Gymshark. Cargas, e1RM, RIR, aquecimentos, descansos, ajustes e regras de segurança são orientações próprias do GymTrack e não reproduzem fórmulas do programa pago.'

export const FATIGUE_DISCLAIMER =
  'Esta rotina possui volume e fadiga elevados. A qualidade da técnica, ausência de dor e capacidade de recuperação têm prioridade sobre completar a carga planejada.'

export const NOT_PERSONAL_ROUTINE_NOTE =
  'Esta não é necessariamente a rotina pessoal atual de David Laid — é a rotina pública associada a ele pela Gymshark.'

export const GUIDED_TOP_SET_SAFETY_NOTE =
  'Esta é uma série pesada de força, mas não é uma tentativa máxima obrigatória. Use a carga recomendada, mantenha aproximadamente duas repetições em reserva e interrompa caso a técnica se deteriore.'

export const RIR_EXPLANATION =
  'RIR significa repetições em reserva: quantas repetições adicionais você acredita que conseguiria fazer mantendo técnica correta.'

export const RIR_SCALE_LABEL: Record<0 | 1 | 2 | 3 | 4, string> = {
  4: 'RIR 4+: conseguiria fazer quatro ou mais',
  3: 'RIR 3: conseguiria fazer mais três',
  2: 'RIR 2: conseguiria fazer mais duas',
  1: 'RIR 1: conseguiria fazer mais uma',
  0: 'RIR 0: não conseguiria completar outra',
}

export const WARMUP_DISCLAIMER =
  'Aquecimento sugerido pelo GymTrack. Não faz parte das séries da rotina.'

export const FAMILIARIZATION_MODE_NOTE =
  'Modo de familiarização ativo: carga inicial reduzida, RIR-alvo mais alto nos top sets e recordes bloqueados até duas exposições válidas, com técnica boa e sem dor.'

export const PULL_UP_SOURCE_NOTE = 'Fonte: 8–10; alvo guiado: 10'

export const BIRD_DOG_TIP =
  'A matéria cita o bird-dog como exercício útil de estabilidade. Ele não faz parte dos seis treinos principais desta ficha — pode ser feito como suporte opcional, 2–3×8–12 por lado, lento e controlado, sem contar como exercício do dia.'

export const HYPEREXTENSION_TIP =
  'Hiperextensão pode aparecer como conteúdo de suporte lombar, mas não substitui glute-ham raise/reverse hyper, RDL ou stiff sem uma decisão explícita sua.'

export const TRICEPS_PUSHDOWN_TIP =
  'Extensão de tríceps na polia (triceps pushdown) é citada como acessório extra na matéria, mas não faz parte da ficha principal — pode ser adicionada como opção de suporte, fora das oito séries programadas de tríceps.'

export type WorkoutLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type PrescriptionType = 'fixed_reps' | 'rep_range' | 'guided_top_set'
export type LoadStrategy =
  | 'percentage_of_e1rm_topset'
  | 'percentage_of_e1rm_backoff'
  | 'history_rir'
  | 'bodyweight_assisted'

export interface GuidedLoadExerciseItem {
  slug: string
  sets: number
  sourceRepsMin: number
  sourceRepsMax: number
  prescriptionType: PrescriptionType
  fixedReps?: number
  repMaxTarget?: 1 | 3 | 5
  guidedRepsFixed?: number
  rirMin: number
  rirMax: number
  restSeconds: number
  percentageOfE1rm?: number
  loadStrategy: LoadStrategy
  sourcePrescription: string
  guidedPrescription: string
  alternativeSlug?: string
}

export interface GuidedLoadDay {
  letter: WorkoutLetter
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  objective: string
  exercises: GuidedLoadExerciseItem[]
}

const topSet = (
  slug: string,
  target: 1 | 3 | 5,
  pct: number,
  restSeconds: number
): GuidedLoadExerciseItem => ({
  slug,
  sets: 1,
  sourceRepsMin: target,
  sourceRepsMax: target,
  prescriptionType: 'guided_top_set',
  fixedReps: target,
  repMaxTarget: target,
  rirMin: 2,
  rirMax: 2,
  restSeconds,
  percentageOfE1rm: pct,
  loadStrategy: 'percentage_of_e1rm_topset',
  sourcePrescription: `Fonte: ${target}RM effort`,
  guidedPrescription: `GymTrack: 1×${target}, RIR 2`,
})

const backoff = (
  slug: string,
  sets: number,
  reps: number,
  rirMin: number,
  rirMax: number,
  pct: number,
  restSeconds: number
): GuidedLoadExerciseItem => ({
  slug,
  sets,
  sourceRepsMin: reps,
  sourceRepsMax: reps,
  prescriptionType: 'fixed_reps',
  fixedReps: reps,
  rirMin,
  rirMax,
  restSeconds,
  percentageOfE1rm: pct,
  loadStrategy: 'percentage_of_e1rm_backoff',
  sourcePrescription: `Fonte: ${sets}×${reps}`,
  guidedPrescription: `GymTrack: ${sets}×${reps}, RIR ${rirMin === rirMax ? rirMin : `${rirMin}–${rirMax}`}`,
})

const accessory = (
  slug: string,
  sets: number,
  reps: number,
  rirMin: number,
  rirMax: number,
  restSeconds: number,
  alternativeSlug?: string,
  perSideNote = false
): GuidedLoadExerciseItem => ({
  slug,
  sets,
  sourceRepsMin: reps,
  sourceRepsMax: reps,
  prescriptionType: 'fixed_reps',
  fixedReps: reps,
  rirMin,
  rirMax,
  restSeconds,
  loadStrategy: 'history_rir',
  sourcePrescription: `Fonte: ${sets}×${reps}${perSideNote ? ' (por perna)' : ''}`,
  guidedPrescription: `GymTrack: ${sets}×${reps}${perSideNote ? ' por perna' : ''}, RIR ${rirMin === rirMax ? rirMin : `${rirMin}–${rirMax}`}`,
  alternativeSlug,
})

const pullUp = (restSeconds: number): GuidedLoadExerciseItem => ({
  slug: 'pull-up',
  sets: 3,
  sourceRepsMin: 8,
  sourceRepsMax: 10,
  prescriptionType: 'rep_range',
  guidedRepsFixed: 10,
  rirMin: 2,
  rirMax: 2,
  restSeconds,
  loadStrategy: 'bodyweight_assisted',
  sourcePrescription: 'Fonte: 3×8–10',
  guidedPrescription: 'GymTrack: alvo fixo 3×10, RIR 2',
})

export const DAVID_LAID_GUIDED_LOAD_V7: GuidedLoadDay[] = [
  {
    letter: 'A', dayOfWeek: 1, name: 'Legs 1 — Agachamento e volume',
    objective: 'Top set técnico de cinco repetições no agachamento (RIR 2, não é tentativa máxima) seguido de alto volume para quadríceps, glúteos e posteriores.',
    exercises: [
      topSet('back-squat', 5, 80, 240),
      backoff('back-squat', 4, 12, 2, 3, 57.5, 150),
      accessory('romanian-deadlift', 3, 10, 2, 3, 150),
      accessory('walking-lunge', 3, 10, 2, 2, 105, undefined, true),
      accessory('glute-ham-raise', 3, 10, 2, 3, 90, 'reverse-hyper'),
    ],
  },
  {
    letter: 'B', dayOfWeek: 2, name: 'Push 1 — Força no supino',
    objective: 'Top set técnico de uma repetição no supino (RIR 2, não é tentativa máxima) seguido de força e volume para peito, ombros e tríceps.',
    exercises: [
      topSet('barbell-bench-press', 1, 90, 270),
      backoff('barbell-bench-press', 4, 4, 2, 2, 77.5, 180),
      backoff('push-press', 3, 4, 2, 2, 75, 180),
      accessory('weighted-dip', 3, 10, 2, 2, 120),
      accessory('dumbbell-fly', 3, 10, 1, 2, 90, 'pec-deck'),
      accessory('dumbbell-lateral-raise', 3, 10, 2, 2, 90),
      accessory('skull-crusher', 3, 10, 1, 2, 90),
      accessory('dumbbell-triceps-extension', 3, 10, 1, 2, 90),
    ],
  },
  {
    letter: 'C', dayOfWeek: 3, name: 'Pull 1 — Força no levantamento terra',
    objective: 'Top set técnico de três repetições no levantamento terra (RIR 2, não é tentativa máxima) seguido de volume para cadeia posterior, dorsais, trapézio e bíceps.',
    exercises: [
      topSet('conventional-deadlift', 3, 85, 240),
      backoff('conventional-deadlift', 4, 6, 2, 2, 72.5, 210),
      accessory('stiff-leg-deadlift', 3, 10, 2, 3, 150),
      pullUp(150),
      accessory('yates-row', 3, 10, 2, 2, 120),
      accessory('barbell-shrug', 3, 10, 1, 2, 90),
      accessory('barbell-curl', 3, 10, 1, 2, 90),
      accessory('seated-hammer-curl', 3, 10, 1, 2, 90),
    ],
  },
  {
    letter: 'D', dayOfWeek: 4, name: 'Legs 2 — Agachamento pesado e volume',
    objective: 'Top set técnico de três repetições no agachamento (RIR 2, não é tentativa máxima) seguido de séries de volume moderado.',
    exercises: [
      topSet('back-squat', 3, 85, 240),
      backoff('back-squat', 4, 8, 2, 3, 67.5, 180),
      accessory('romanian-deadlift', 3, 10, 2, 3, 150),
      accessory('walking-lunge', 3, 10, 2, 2, 105, undefined, true),
      accessory('glute-ham-raise', 3, 10, 2, 3, 90, 'reverse-hyper'),
    ],
  },
  {
    letter: 'E', dayOfWeek: 5, name: 'Push 2 — Desenvolvimento militar',
    objective: 'Top set técnico de cinco repetições no desenvolvimento militar (RIR 2, não é tentativa máxima) com prioridade para ombros.',
    exercises: [
      topSet('barbell-overhead-press', 5, 80, 240),
      backoff('barbell-overhead-press', 4, 12, 2, 3, 57.5, 150),
      accessory('incline-barbell-bench-press', 3, 12, 2, 2, 150),
      accessory('dumbbell-lateral-raise', 3, 10, 2, 2, 90),
      accessory('weighted-dip', 3, 10, 2, 2, 120),
      accessory('dumbbell-triceps-extension', 3, 10, 1, 2, 90),
      accessory('skull-crusher', 3, 10, 1, 2, 90),
    ],
  },
  {
    letter: 'F', dayOfWeek: 6, name: 'Pull 2 — Levantamento terra pesado',
    objective: 'Top set técnico de uma repetição no levantamento terra (RIR 2, não é tentativa máxima) seguido de séries pesadas e acessórios para costas e braços.',
    exercises: [
      topSet('conventional-deadlift', 1, 90, 270),
      backoff('conventional-deadlift', 4, 2, 2, 3, 82.5, 210),
      accessory('stiff-leg-deadlift', 3, 10, 2, 3, 150),
      pullUp(150),
      accessory('yates-row', 3, 10, 2, 2, 120),
      accessory('barbell-shrug', 3, 10, 1, 2, 90),
      accessory('barbell-curl', 3, 10, 1, 2, 90),
      accessory('seated-hammer-curl', 3, 10, 1, 2, 90),
    ],
  },
]
