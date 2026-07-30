import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  POWERBUILDING_DUP_ADAPTADO_V6,
  POWERBUILDING_DUP_EXERCISE_CATALOG_V6,
  ROUTINE_NAME,
  ROUTINE_VERSION,
  ROUTINE_WEEKS,
  effectiveTargetsForProgramWeek,
  progressionAllowedForProgramWeek,
} from '@/lib/routine/powerbuilding-dup-adaptado-v6'
import {
  consecutiveValidPrescriptionExposures,
  type PrescriptionExposure,
} from '@/lib/training/dup-progression'

const migration = readFileSync(
  path.resolve(
    __dirname,
    '../supabase/migrations/20260730193617_powerbuilding_dup_adaptado_v6.sql'
  ),
  'utf8'
)

const compact = POWERBUILDING_DUP_ADAPTADO_V6.map((day) => ({
  letter: day.letter,
  items: day.exercises.map((item) => [
    item.exerciseSlug,
    item.sets,
    item.repsMin,
    item.rirMin,
    item.rirMax,
    item.supersetGroup,
  ]),
}))

describe('Powerbuilding DUP Adaptado v6', () => {
  it('possui seis dias, oito semanas, 35 posições e nenhuma tentativa RM', () => {
    expect(ROUTINE_NAME).toBe('Powerbuilding DUP Adaptado — 8 semanas')
    expect(ROUTINE_VERSION).toBe(6)
    expect(ROUTINE_WEEKS).toBe(8)
    expect(compact.map((day) => day.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    expect(compact.flatMap((day) => day.items)).toHaveLength(35)
    expect(
      POWERBUILDING_DUP_ADAPTADO_V6
        .flatMap((day) => day.exercises)
        .every((item) => item.prescriptionType === 'fixed_reps')
    ).toBe(true)
  })

  it('trava a prescrição definitiva e reduz dobradiças', () => {
    expect(compact).toEqual([
      { letter: 'A', items: [
        ['back-squat', 4, 5, 2, 2, null],
        ['romanian-deadlift', 3, 8, 2, 2, null],
        ['walking-lunge', 3, 10, 1, 2, null],
        ['glute-ham-raise', 3, 10, 1, 2, null],
      ] },
      { letter: 'B', items: [
        ['barbell-bench-press', 4, 4, 2, 2, null],
        ['push-press', 3, 5, 2, 2, null],
        ['weighted-dip', 3, 8, 2, 2, null],
        ['pec-deck', 2, 12, 1, 2, 1],
        ['dumbbell-lateral-raise', 3, 15, 1, 2, 1],
        ['skull-crusher', 2, 10, 1, 2, null],
        ['triceps-pushdown', 2, 12, 1, 2, null],
      ] },
      { letter: 'C', items: [
        ['conventional-deadlift', 3, 4, 2, 2, null],
        ['pull-up', 3, 8, 2, 2, null],
        ['yates-row', 3, 8, 2, 2, null],
        ['barbell-shrug', 2, 10, 1, 2, 1],
        ['barbell-curl', 2, 10, 1, 2, 1],
        ['seated-hammer-curl', 2, 10, 1, 2, 2],
        ['cable-crunch', 3, 12, 1, 2, 2],
      ] },
      { letter: 'D', items: [
        ['back-squat', 4, 8, 2, 2, null],
        ['walking-lunge', 3, 10, 1, 2, null],
        ['reverse-hyper', 3, 12, 1, 2, null],
      ] },
      { letter: 'E', items: [
        ['barbell-overhead-press', 4, 6, 2, 2, null],
        ['incline-barbell-bench-press', 3, 10, 2, 2, null],
        ['weighted-dip', 3, 10, 2, 2, null],
        ['dumbbell-lateral-raise', 3, 15, 1, 2, 1],
        ['triceps-pushdown', 2, 12, 1, 2, 1],
        ['dumbbell-triceps-extension', 2, 12, 1, 2, null],
      ] },
      { letter: 'F', items: [
        ['conventional-deadlift', 3, 3, 3, 3, null],
        ['deficit-stiff-leg-deadlift', 2, 10, 3, 3, null],
        ['pull-up', 3, 10, 2, 2, null],
        ['yates-row', 3, 10, 2, 2, null],
        ['barbell-shrug', 2, 12, 1, 2, 1],
        ['barbell-curl', 2, 12, 1, 2, 1],
        ['seated-hammer-curl', 2, 12, 1, 2, 2],
        ['reverse-crunch', 3, 12, 1, 2, 2],
      ] },
    ])
  })

  it('mantém compostos fora de supersets e corrige as quatro mídias', () => {
    const supersets = POWERBUILDING_DUP_ADAPTADO_V6
      .flatMap((day) => day.exercises)
      .filter((item) => item.supersetGroup != null)
    expect(supersets.every((item) => item.kind !== 'composto')).toBe(true)
    expect(POWERBUILDING_DUP_EXERCISE_CATALOG_V6['yates-row'].imageUrl)
      .toBe('/exercises/Reverse_Grip_Bent-Over_Rows.jpg')
    expect(POWERBUILDING_DUP_EXERCISE_CATALOG_V6['seated-hammer-curl'].imageUrl)
      .toBe('/exercises/Seated_Hammer_Curl.jpg')
    expect(POWERBUILDING_DUP_EXERCISE_CATALOG_V6['deficit-stiff-leg-deadlift'].imageUrl)
      .toBe('/exercises/Stiff_Leg_Deadlift_Low_Deficit.jpg')
    expect(migration).toContain("image_url = '/exercises/Stomach_Vacuum.jpg'")
  })

  it('aplica adaptação, progressão, consolidação e deload', () => {
    const base = { target_sets: 4, rir_min: 2, rir_max: 2 }
    expect(effectiveTargetsForProgramWeek(base, 'composto', 1))
      .toEqual({ target_sets: 4, rir_min: 3, rir_max: 3, is_deload: false })
    expect(effectiveTargetsForProgramWeek(base, 'composto', 4))
      .toEqual({ target_sets: 4, rir_min: 2, rir_max: 2, is_deload: false })
    expect(progressionAllowedForProgramWeek(7)).toBe(false)
    expect(effectiveTargetsForProgramWeek(base, 'composto', 8))
      .toEqual({ target_sets: 2, rir_min: 3, rir_max: 4, is_deload: true })
  })

  it('a migração preserva histórico, usa 8 semanas e não apaga sessões ou séries', () => {
    expect(migration).toContain('provision_powerbuilding_dup_adapted_v6')
    expect(migration).toContain("'routine_version',6")
    expect(migration).toContain("'exercises',v_exercises")
    expect(migration).toContain('v_exercises<>35')
    expect(migration).toContain("6,\n      8,")
    expect(migration).not.toMatch(
      /(delete from|truncate)\s+(public\.)?(workout_sessions|set_logs)\b/i
    )
  })
})

function validExposure(
  sessionId: string,
  finishedAt: string,
  weightKg = 80,
  variation: string | null = null
): PrescriptionExposure {
  return {
    sessionId,
    finishedAt,
    weekNumber: 3,
    isDeload: false,
    sets: Array.from({ length: 4 }, (_, index) => ({
      setNumber: index + 1,
      weightKg,
      reps: 5,
      rir: 2,
      executionQuality: 'boa',
      painLevel: 'nenhuma',
      romQuality: 'completa',
      externalAssistance: false,
      attemptResult: null,
      performedExerciseId: variation,
    })),
  }
}

describe('duas exposições válidas por posição e prescrição', () => {
  const prescription = () => ({
    targetSets: 4,
    targetReps: 5,
    rirMin: 2,
    rirMax: 2,
    plannedExerciseId: 'agachamento-a-4x5',
  })

  it('conta duas exposições com mesma carga e variação', () => {
    expect(consecutiveValidPrescriptionExposures([
      validExposure('s1', '2026-07-01T10:00:00Z'),
      validExposure('s2', '2026-07-08T10:00:00Z'),
    ], prescription)).toBe(2)
  })

  it('uma falha zera; mudar carga ou variação inicia nova sequência', () => {
    const failed = validExposure('s3', '2026-07-15T10:00:00Z')
    failed.sets[2].romQuality = 'reduzida'
    expect(consecutiveValidPrescriptionExposures([
      validExposure('s1', '2026-07-01T10:00:00Z'),
      failed,
    ], prescription)).toBe(0)

    expect(consecutiveValidPrescriptionExposures([
      validExposure('s1', '2026-07-01T10:00:00Z', 77.5),
      validExposure('s2', '2026-07-08T10:00:00Z', 80),
    ], prescription)).toBe(1)

    const olderFailure = validExposure('s0', '2026-06-24T10:00:00Z')
    olderFailure.sets[0].externalAssistance = true
    expect(consecutiveValidPrescriptionExposures([
      olderFailure,
      validExposure('s1', '2026-07-01T10:00:00Z'),
    ], prescription)).toBe(1)
  })

  it('exige feedback explícito sem dor e sem ajuda externa', () => {
    const assisted = validExposure('s1', '2026-07-01T10:00:00Z')
    assisted.sets[0].externalAssistance = true
    expect(consecutiveValidPrescriptionExposures([assisted], prescription)).toBe(0)

    const missingFeedback = validExposure('s2', '2026-07-08T10:00:00Z')
    missingFeedback.sets[0].painLevel = null
    expect(consecutiveValidPrescriptionExposures([missingFeedback], prescription)).toBe(0)
  })
})
