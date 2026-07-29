/**
 * Motor de deload — detecção de estagnação e gestão de fadiga acumulada.
 *
 * A prontidão diária reage dia a dia; este módulo olha a janela de 2–3
 * semanas. Nunca é automático: produz uma RECOMENDAÇÃO com motivo, que o
 * usuário confirma na UI (persistida em deload_recommendations).
 *
 * Gatilhos (qualquer um):
 *  (a) 3 semanas consecutivas sem ação "aumentar" em ≥2 compostos com
 *      sessões completas;
 *  (b) ≥4 check-ins low_recovery nos últimos 7 dias;
 *  (c) queda de e1RM >10% em um composto por 2 sessões seguidas, sem dor
 *      aguda registrada.
 *
 * Prescrição sugerida: 1 semana com -40% das séries dos acessórios e
 * RIR 3–4 nos compostos, mantendo as cargas.
 */

import type { ReadinessStatus } from '@/lib/training/readiness'

export type DeloadWeek = {
  /** 0 = semana mais recente */
  weekIndex: number
  /** Sessões concluídas que incluíram o exercício nessa semana */
  completedSessions: number
  /** Houve progressão de carga (ação "aumentar" executada) nessa semana */
  hadIncrease: boolean
}

export type DeloadExerciseHistory = {
  exerciseName: string
  isCompound: boolean
  /** Semanas em ordem recente → antiga (índices 0, 1, 2) */
  weeks: DeloadWeek[]
  /** e1RM máximo por sessão concluída, mais recente primeiro */
  e1rmBySession?: number[]
  /** Dor moderada/forte registrada nas sessões recentes do exercício */
  hadAcutePain?: boolean
}

export type DeloadReadinessCheckin = {
  date: string
  status: ReadinessStatus
}

export type DeloadHistory = {
  exercises: DeloadExerciseHistory[]
  /** Check-ins dos últimos 7 dias */
  readinessLast7Days: DeloadReadinessCheckin[]
  /** Já existe recomendação com status 'sugerido' aguardando decisão */
  hasPendingRecommendation: boolean
}

export type DeloadTrigger = 'estagnacao' | 'baixa_recuperacao' | 'queda_e1rm'

export type DeloadPrescription = {
  accessorySetsReductionPct: 40
  compoundRir: readonly [3, 4]
  keepLoads: true
  durationWeeks: 1
}

export type DeloadSuggestion = {
  trigger: DeloadTrigger
  reason: string
  prescription: DeloadPrescription
  triggerData: Record<string, unknown>
}

export const DELOAD_PRESCRIPTION: DeloadPrescription = {
  accessorySetsReductionPct: 40,
  compoundRir: [3, 4],
  keepLoads: true,
  durationWeeks: 1,
}

export const DELOAD_PRESCRIPTION_TEXT =
  'Por 1 semana: reduza as séries dos acessórios em ~40%, trabalhe os compostos em RIR 3–4 e mantenha as cargas. Depois retome a progressão normal.'

const STAGNATION_WEEKS = 3
const STAGNATION_MIN_COMPOUNDS = 2
const LOW_RECOVERY_MIN_CHECKINS = 4
const E1RM_DROP_THRESHOLD = 0.1
const E1RM_DROP_SESSIONS = 2

function isStagnant(exercise: DeloadExerciseHistory): boolean {
  if (!exercise.isCompound) return false
  if (exercise.weeks.length < STAGNATION_WEEKS) return false
  const recent = exercise.weeks.slice(0, STAGNATION_WEEKS)
  return recent.every((week) => week.completedSessions >= 1 && !week.hadIncrease)
}

function e1rmDrop(exercise: DeloadExerciseHistory): { dropPct: number } | null {
  if (!exercise.isCompound || exercise.hadAcutePain) return null
  const sessions = exercise.e1rmBySession ?? []
  if (sessions.length < E1RM_DROP_SESSIONS + 1) return null
  const recent = sessions.slice(0, E1RM_DROP_SESSIONS)
  const reference = Math.max(...sessions.slice(E1RM_DROP_SESSIONS))
  if (reference <= 0) return null
  const threshold = reference * (1 - E1RM_DROP_THRESHOLD)
  if (recent.every((value) => value < threshold)) {
    const worst = Math.min(...recent)
    return { dropPct: Math.round(((reference - worst) / reference) * 100) }
  }
  return null
}

export function suggestDeload(history: DeloadHistory): DeloadSuggestion | null {
  // Nunca empilhar sugestões: enquanto houver uma pendente, nada novo.
  if (history.hasPendingRecommendation) return null

  const stagnant = history.exercises.filter(isStagnant)
  if (stagnant.length >= STAGNATION_MIN_COMPOUNDS) {
    const names = stagnant.map((e) => e.exerciseName)
    return {
      trigger: 'estagnacao',
      reason: `${names.length} exercícios compostos (${names.join(', ')}) estão há ${STAGNATION_WEEKS} semanas com sessões completas e sem progressão de carga. Uma semana de descarga ajuda a dissipar fadiga acumulada e destravar a progressão.`,
      prescription: DELOAD_PRESCRIPTION,
      triggerData: { stagnantCompounds: names, weeks: STAGNATION_WEEKS },
    }
  }

  const lowRecovery = history.readinessLast7Days.filter(
    (checkin) => checkin.status === 'low_recovery'
  )
  if (lowRecovery.length >= LOW_RECOVERY_MIN_CHECKINS) {
    return {
      trigger: 'baixa_recuperacao',
      reason: `${lowRecovery.length} check-ins de prontidão nos últimos 7 dias indicaram recuperação baixa. Isso sugere fadiga acumulada além do ajuste diário — uma semana de descarga é mais eficaz do que reduzir sessão a sessão.`,
      prescription: DELOAD_PRESCRIPTION,
      triggerData: { lowRecoveryCheckins: lowRecovery.length, windowDays: 7 },
    }
  }

  for (const exercise of history.exercises) {
    const drop = e1rmDrop(exercise)
    if (drop) {
      return {
        trigger: 'queda_e1rm',
        reason: `O e1RM de ${exercise.exerciseName} caiu mais de 10% (≈${drop.dropPct}%) nas últimas ${E1RM_DROP_SESSIONS} sessões, sem dor aguda registrada — um sinal clássico de fadiga acumulada. Uma semana de descarga tende a recuperar o desempenho.`,
        prescription: DELOAD_PRESCRIPTION,
        triggerData: { exercise: exercise.exerciseName, dropPct: drop.dropPct, sessions: E1RM_DROP_SESSIONS },
      }
    }
  }

  return null
}
