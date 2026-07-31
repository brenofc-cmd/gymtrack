import { describe, expect, it } from 'vitest'
import { classifyExerciseStimulus } from '@/lib/training/stimulus'
import { OPTIONAL_TREADMILL_FINISHERS } from '@/lib/training/conditioning'

describe('classificação de estímulo por prescrição', () => {
  // Taxonomia fixada pela rotina David Laid Powerbuilding DUP — Gymshark
  // Exact v7: FORÇA MÁXIMA (esforço de RM) e FORÇA (≤6 reps sem ser RM) são
  // categorias distintas por exercício; "misto" só existe no nível do dia
  // (ver dayStimulusSummary).
  it('identifica esforço RM como força máxima', () => {
    expect(classifyExerciseStimulus({
      prescription_type: 'rep_max_effort',
      target_reps_min: 5,
      target_reps_max: 5,
      exercise_type: 'composto',
    })).toBe('max_strength')
  })

  it('classifica baixas repetições sem RM como força', () => {
    expect(classifyExerciseStimulus({
      target_reps_min: 4,
      target_reps_max: 4,
      exercise_type: 'composto',
    })).toBe('strength')
    expect(classifyExerciseStimulus({
      target_reps_min: 6,
      target_reps_max: 6,
      exercise_type: 'composto',
    })).toBe('strength')
  })

  it('classifica 8+ repetições e acessórios como hipertrofia', () => {
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
    expect(OPTIONAL_TREADMILL_FINISHERS.A?.minutes).toBe('10 min')
    expect(OPTIONAL_TREADMILL_FINISHERS.D?.intensity).toContain('RPE 3–4')
  })
})
