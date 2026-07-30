import type { WorkoutLetter } from '@/types/database'

export type TreadmillFinisher = {
  minutes: string
  intensity: string
  guidance: string
}

/**
 * A e D são os dias mais curtos da versão adaptada. A esteira é opcional,
 * fica sempre por último e nunca reduz o descanso dos exercícios compostos.
 */
export const OPTIONAL_TREADMILL_FINISHERS: Partial<Record<WorkoutLetter, TreadmillFinisher>> = {
  A: {
    minutes: '10 min',
    intensity: 'RPE 3–4 · caminhada leve',
    guidance: 'Faça depois da musculação, com inclinação de 0–5%, sem transformar em treino intervalado.',
  },
  D: {
    minutes: '10 min',
    intensity: 'RPE 3–4 · caminhada leve',
    guidance: 'Faça depois da musculação, com inclinação de 0–5%, mantendo recuperação confortável.',
  },
}
