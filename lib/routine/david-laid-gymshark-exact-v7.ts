/**
 * David Laid Powerbuilding DUP — Gymshark Exact v7.
 *
 * Fonte: https://www.gymshark.com/blog/article/david-laid-workout — divisão
 * pública associada a David Laid. Reprodução exata: mesma divisão A–F, mesma
 * ordem de dias e exercícios, mesmas séries/repetições e mesmos esforços de
 * 1RM/3RM/5RM. RIR e descanso não são informados pela fonte (ver
 * `lib/training/prescription.ts`). Nenhum superset e nenhum exercício de
 * abdômen foi adicionado.
 */
export const ROUTINE_VERSION = 7
export const ROUTINE_SLUG = 'david-laid-gymshark-exact-v7'
export const ROUTINE_NAME = 'David Laid Powerbuilding DUP — Gymshark Exact v7'
export const ROUTINE_DESCRIPTION =
  'Rotina Powerbuilding DUP de seis dias baseada exatamente na divisão publicada pela Gymshark e associada a David Laid. Combina esforços máximos de força com séries de força e hipertrofia.'

export const METHOD_BADGE = 'Powerbuilding DUP'
export const SOURCE_BADGE = 'Rotina Gymshark'

export const SOURCE_DISCLAIMER =
  'Esta rotina reproduz a divisão pública associada a David Laid no artigo da Gymshark. Ela não representa necessariamente todos os detalhes do programa pago de nove semanas nem confirma qual é o treino atual de David Laid.'

export const POWERBUILDING_EXPLANATION =
  'Powerbuilding combina movimentos pesados do powerlifting com exercícios e volume de bodybuilding. O objetivo é desenvolver força nos principais levantamentos sem abandonar o crescimento muscular e a estética.'

export const DUP_EXPLANATION =
  'DUP significa Daily Undulating Periodization, ou periodização ondulatória diária. A intensidade e o volume mudam entre as sessões. Nesta rotina, esforços de 1RM, 3RM e 5RM são combinados com séries pesadas e trabalho de hipertrofia.'

export const MAX_EFFORT_SAFETY_WARNING =
  'Este treino contém um esforço máximo ou próximo do máximo. Faça séries progressivas de aquecimento, utilize técnica adequada, travas e equipamentos de segurança. Não execute uma tentativa máxima sem experiência ou supervisão.'

export const ONE_RM_CONFIRMATION_TEXT =
  'Confirmo que compreendo que esta sessão possui uma tentativa de 1RM.'

export const WARMUP_DISCLAIMER =
  'Sugestão do GymTrack — não faz parte das séries publicadas da rotina.'

export const REST_RECOMMENDATION_NOTE =
  'Recomendação do GymTrack: esforços de força normalmente exigem intervalos maiores que exercícios acessórios. Ajuste de acordo com desempenho e recuperação.'

export const BIRD_DOG_TIP =
  'O artigo cita o bird-dog como exercício útil de estabilidade, mas ele não faz parte dos seis treinos principais da ficha.'

export type WorkoutLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'

/**
 * Nome curto e consistente de cada sessão — mesmo rótulo em toda a UI
 * (dashboard, /treinos, treino do dia, recuperação/descanso), para nunca
 * duas telas chamarem a mesma sessão de coisas diferentes.
 */
export const WORKOUT_LETTER_LABEL: Record<WorkoutLetter, string> = {
  A: 'Legs 1',
  B: 'Push 1',
  C: 'Pull 1',
  D: 'Legs 2',
  E: 'Push 2',
  F: 'Pull 2',
}
export type PrescriptionType = 'fixed_reps' | 'rep_range' | 'rep_max_effort'

export interface GymsharkExerciseItem {
  slug: string
  sets: number
  repsMin: number
  repsMax: number
  prescriptionType: PrescriptionType
  repMaxTarget?: 1 | 3 | 5
  alternativeSlug?: string
}

export interface GymsharkDay {
  letter: WorkoutLetter
  dayOfWeek: 1 | 2 | 3 | 4 | 5 | 6
  name: string
  objective: string
  exercises: GymsharkExerciseItem[]
}

const rm = (slug: string, target: 1 | 3 | 5): GymsharkExerciseItem => ({
  slug, sets: 1, repsMin: target, repsMax: target, prescriptionType: 'rep_max_effort', repMaxTarget: target,
})
const fixed = (slug: string, sets: number, reps: number, alternativeSlug?: string): GymsharkExerciseItem => ({
  slug, sets, repsMin: reps, repsMax: reps, prescriptionType: 'fixed_reps', alternativeSlug,
})
const range = (slug: string, sets: number, repsMin: number, repsMax: number): GymsharkExerciseItem => ({
  slug, sets, repsMin, repsMax, prescriptionType: 'rep_range',
})

export const DAVID_LAID_GYMSHARK_EXACT_V7: GymsharkDay[] = [
  {
    letter: 'A', dayOfWeek: 1, name: 'Legs 1 — Agachamento 5RM e volume',
    objective: 'Inicia com esforço máximo de cinco repetições no agachamento e continua com alto volume para quadríceps, glúteos e posteriores.',
    exercises: [
      rm('back-squat', 5),
      fixed('back-squat', 4, 12),
      fixed('romanian-deadlift', 3, 10),
      fixed('walking-lunge', 3, 10),
      fixed('glute-ham-raise', 3, 10, 'reverse-hyper'),
    ],
  },
  {
    letter: 'B', dayOfWeek: 2, name: 'Push 1 — Supino 1RM',
    objective: 'Sessão pesada de empurrar, começando com uma repetição máxima no supino e continuando com força e volume para peito, ombros e tríceps.',
    exercises: [
      rm('barbell-bench-press', 1),
      fixed('barbell-bench-press', 4, 4),
      fixed('push-press', 3, 4),
      fixed('weighted-dip', 3, 10),
      fixed('dumbbell-fly', 3, 10, 'pec-deck'),
      fixed('dumbbell-lateral-raise', 3, 10),
      fixed('skull-crusher', 3, 10),
      fixed('dumbbell-triceps-extension', 3, 10),
    ],
  },
  {
    letter: 'C', dayOfWeek: 3, name: 'Pull 1 — Terra 3RM',
    objective: 'Sessão de puxada iniciada por um esforço de três repetições máximas no levantamento terra, seguida por volume para cadeia posterior, dorsais, trapézio e bíceps.',
    exercises: [
      rm('conventional-deadlift', 3),
      fixed('conventional-deadlift', 4, 6),
      fixed('stiff-leg-deadlift', 3, 10),
      range('pull-up', 3, 8, 10),
      fixed('yates-row', 3, 10),
      fixed('barbell-shrug', 3, 10),
      fixed('barbell-curl', 3, 10),
      fixed('seated-hammer-curl', 3, 10),
    ],
  },
  {
    letter: 'D', dayOfWeek: 4, name: 'Legs 2 — Agachamento 3RM',
    objective: 'Segundo dia de pernas, começando com esforço máximo de três repetições no agachamento e continuando com séries de volume moderado.',
    exercises: [
      rm('back-squat', 3),
      fixed('back-squat', 4, 8),
      fixed('romanian-deadlift', 3, 10),
      fixed('walking-lunge', 3, 10),
      fixed('glute-ham-raise', 3, 10, 'reverse-hyper'),
    ],
  },
  {
    letter: 'E', dayOfWeek: 5, name: 'Push 2 — Desenvolvimento militar 5RM',
    objective: 'Sessão de empurrar com prioridade para ombros, iniciada por um esforço máximo de cinco repetições no desenvolvimento militar.',
    exercises: [
      rm('barbell-overhead-press', 5),
      fixed('barbell-overhead-press', 4, 12),
      fixed('incline-barbell-bench-press', 3, 12),
      fixed('dumbbell-lateral-raise', 3, 10),
      fixed('weighted-dip', 3, 10),
      fixed('dumbbell-triceps-extension', 3, 10),
      fixed('skull-crusher', 3, 10),
    ],
  },
  {
    letter: 'F', dayOfWeek: 6, name: 'Pull 2 — Terra 1RM',
    objective: 'Segundo dia de puxada, começando com uma repetição máxima no levantamento terra e seguindo com séries pesadas e acessórios para costas e braços.',
    exercises: [
      rm('conventional-deadlift', 1),
      fixed('conventional-deadlift', 4, 2),
      fixed('stiff-leg-deadlift', 3, 10),
      range('pull-up', 3, 8, 10),
      fixed('yates-row', 3, 10),
      fixed('barbell-shrug', 3, 10),
      fixed('barbell-curl', 3, 10),
      fixed('seated-hammer-curl', 3, 10),
    ],
  },
]

/**
 * Alias da fonte canônica — sessão, posição, exercício, sets, reps/faixa/RM
 * e alternativa, um único lugar para os 41 itens. `DAVID_LAID_GYMSHARK_EXACT_V7`
 * continua exportado (é o nome usado no resto do app e nos testes); este é
 * só outro nome para o mesmo array, não uma segunda lista.
 */
export const DAVID_LAID_GYMSHARK_ROUTINE = DAVID_LAID_GYMSHARK_EXACT_V7
