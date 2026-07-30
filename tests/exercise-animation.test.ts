import { describe, expect, it } from 'vitest'
import {
  DAVID_LAID_EXERCISE_CATALOG_V5,
  DAVID_LAID_PUBLIC_DUP_V5,
} from '@/lib/routine/david-laid-public-dup-v5'
import {
  inferExerciseMotion,
  inferMuscleHighlight,
} from '@/lib/exercise-animation'

describe('animações anatômicas', () => {
  it('cobre todos os exercícios e substituições do DUP público', () => {
    const slugs = new Set(
      DAVID_LAID_PUBLIC_DUP_V5.flatMap((day) =>
        day.exercises.flatMap((exercise) => [exercise.exerciseSlug, ...exercise.substitutions])
      )
    )
    expect(slugs.size).toBe(23)

    for (const slug of slugs) {
      const exercise = DAVID_LAID_EXERCISE_CATALOG_V5[slug]
      expect(inferExerciseMotion(exercise.name, exercise.movementPattern)).not.toBe('full_body')
      expect(inferMuscleHighlight(exercise.primaryMuscle)).not.toBe('full_body')
    }
  })

  it('infere padrões legados sem movement_pattern', () => {
    expect(inferExerciseMotion('Cadeira flexora (leg curl)', null)).toBe('knee_flexion')
    expect(inferExerciseMotion('Supino inclinado com halteres (banco a 30°)', null)).toBe('incline_push')
    expect(inferExerciseMotion('Ab wheel (rollout)', null)).toBe('anti_extension')
    expect(inferExerciseMotion('Caminhada na esteira', null)).toBe('cardio')
  })
})
