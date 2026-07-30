import { describe, expect, it } from 'vitest'
import { classifyExerciseStimulus } from '@/lib/training/stimulus'
import { OPTIONAL_TREADMILL_FINISHERS } from '@/lib/training/conditioning'

describe('classificação de estímulo por prescrição', () => {
  it('identifica esforço RM e baixas repetições como força', () => {
    expect(classifyExerciseStimulus({
      prescription_type: 'rep_max_effort',
      target_reps_min: 5,
      target_reps_max: 5,
      exercise_type: 'composto',
    })).toBe('strength')
    expect(classifyExerciseStimulus({
      target_reps_min: 4,
      target_reps_max: 4,
      exercise_type: 'composto',
    })).toBe('strength')
  })

  it('separa back-off composto misto de trabalho de hipertrofia', () => {
    expect(classifyExerciseStimulus({
      target_reps_min: 6,
      target_reps_max: 6,
      exercise_type: 'composto',
    })).toBe('mixed')
    expect(classifyExerciseStimulus({
      target_reps_min: 10,
      target_reps_max: 10,
      exercise_type: 'isolador',
    })).toBe('hypertrophy')
  })
})

describe('esteira opcional', () => {
  it('aparece somente nos dois dias com menos entradas de musculação', () => {
    expect(Object.keys(OPTIONAL_TREADMILL_FINISHERS)).toEqual(['A', 'D'])
    expect(OPTIONAL_TREADMILL_FINISHERS.A?.minutes).toBe('10–15 min')
    expect(OPTIONAL_TREADMILL_FINISHERS.D?.intensity).toContain('RPE 3–4')
  })
})
