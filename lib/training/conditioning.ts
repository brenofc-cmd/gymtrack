import type { WorkoutLetter } from '@/types/database'

export type TreadmillFinisher = {
  minutes: string
  intensity: string
  guidance: string
}

/**
 * A e D têm menos entradas de musculação (cinco). A esteira é um complemento
 * opcional do GymTrack e não altera as 41 prescrições do DUP público.
 */
export const OPTIONAL_TREADMILL_FINISHERS: Partial<Record<WorkoutLetter, TreadmillFinisher>> = {
  A: {
    minutes: '10–15 min',
    intensity: 'RPE 3–4 · caminhada leve',
    guidance: 'Faça depois da musculação, com inclinação de 0–5%, sem transformar em treino intervalado.',
  },
  D: {
    minutes: '10–15 min',
    intensity: 'RPE 3–4 · caminhada leve',
    guidance: 'Faça depois da musculação, com inclinação de 0–5%, mantendo recuperação confortável.',
  },
}
