import { describe, expect, it } from 'vitest'
import { formatPrescription } from '@/lib/training/prescription'

describe('formatPrescription: a prescrição pública nunca é escondida atrás da orientação de carga', () => {
  it('esforço de RM mostra o RM literal (5RM, 3RM, 1RM), nunca "1×5" puro', () => {
    expect(
      formatPrescription({ prescription_type: 'rep_max_effort', rep_max_target: 5, target_sets: 1, target_reps_min: 5, target_reps_max: 5 })
    ).toBe('1×5RM')
    expect(
      formatPrescription({ prescription_type: 'rep_max_effort', rep_max_target: 3, target_sets: 1, target_reps_min: 3, target_reps_max: 3 })
    ).toBe('1×3RM')
    expect(
      formatPrescription({ prescription_type: 'rep_max_effort', rep_max_target: 1, target_sets: 1, target_reps_min: 1, target_reps_max: 1 })
    ).toBe('1×1RM')
  })

  it('pull-ups (faixa 8–10 da fonte) mostram "3×8–10", nunca colapsam para "3×10"', () => {
    expect(
      formatPrescription({ prescription_type: 'rep_range', target_sets: 3, target_reps_min: 8, target_reps_max: 10 })
    ).toBe('3×8–10')
  })

  it('séries fixas mostram sets×reps simples', () => {
    expect(
      formatPrescription({ prescription_type: 'fixed_reps', target_sets: 4, target_reps_min: 12, target_reps_max: 12 })
    ).toBe('4×12')
  })

  it('exercício unilateral acrescenta "por perna"', () => {
    expect(
      formatPrescription(
        { prescription_type: 'fixed_reps', target_sets: 3, target_reps_min: 10, target_reps_max: 10 },
        { perSide: true }
      )
    ).toBe('3×10 por perna')
  })

  it('um tipo de prescrição não reconhecido (ex.: um "guided_top_set" legado) nunca finge ser RM: cai na faixa/valor bruto', () => {
    expect(
      formatPrescription({ prescription_type: 'guided_top_set', rep_max_target: 5, target_sets: 1, target_reps_min: 5, target_reps_max: 5 })
    ).toBe('1×5')
  })
})
