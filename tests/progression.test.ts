import { describe, it, expect } from 'vitest'
import {
  suggestProgression,
  suggestAbProgression,
  suggestForExercise,
  smallestIncrement,
  type ProgressionTarget,
  type SetPerformance,
} from '@/lib/progression/progression'

const COMPOSTO: ProgressionTarget = {
  sets: 3,
  repsMin: 6,
  repsMax: 10,
  rirMin: 2,
  rirMax: 2,
  kind: 'composto',
}

function set(overrides: Partial<SetPerformance> = {}): SetPerformance {
  return {
    weightKg: 20,
    reps: 8,
    rir: 2,
    isWarmup: false,
    painLevel: 'nenhuma',
    executionQuality: 'boa',
    ...overrides,
  }
}

describe('Progressão dupla — regras gerais', () => {
  it('sem séries registradas → sem sugestão', () => {
    expect(suggestProgression(COMPOSTO, [])).toBeNull()
  })

  it('séries dentro da faixa mas abaixo do topo → manter carga', () => {
    const result = suggestProgression(COMPOSTO, [set(), set(), set()])
    expect(result?.action).toBe('manter')
  })

  it('todas as séries no topo da faixa com técnica boa e RIR na meta → aumentar', () => {
    const sets = [set({ reps: 10 }), set({ reps: 10 }), set({ reps: 10 })]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('aumentar')
    expect(result?.incrementKg).toBe(2.5)
  })

  it('topo da faixa mas com menos séries que o alvo → não aumenta ainda', () => {
    const sets = [set({ reps: 10 }), set({ reps: 10 })]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('manter')
  })

  it('2+ séries abaixo do mínimo → revisar/reduzir carga', () => {
    const sets = [set({ reps: 5 }), set({ reps: 4 }), set({ reps: 6 })]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('revisar')
  })

  it('apenas 1 série abaixo do mínimo → manter (ainda há espaço para progredir)', () => {
    const sets = [set({ reps: 5 }), set({ reps: 7 }), set({ reps: 8 })]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('manter')
  })

  it('técnica ruim → revisar, mesmo com repetições no topo', () => {
    const sets = [
      set({ reps: 10, executionQuality: 'ruim' }),
      set({ reps: 10 }),
      set({ reps: 10 }),
    ]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('revisar')
  })

  it('RIR real bem abaixo do planejado em 2+ séries → revisar', () => {
    const sets = [set({ rir: 0 }), set({ rir: 0 }), set()]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('revisar')
  })

  it('séries de aquecimento são ignoradas na análise', () => {
    const sets = [
      set({ isWarmup: true, reps: 12, weightKg: 8 }),
      set({ reps: 10 }),
      set({ reps: 10 }),
      set({ reps: 10 }),
    ]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('aumentar')
  })

  it('menor incremento: composto 2.5kg, isolador 2kg', () => {
    expect(smallestIncrement('composto')).toBe(2.5)
    expect(smallestIncrement('isolador')).toBe(2)
  })
})

describe('Progressão — bloqueio por dor', () => {
  it('dor moderada bloqueia aumento mesmo com desempenho perfeito', () => {
    const sets = [
      set({ reps: 10, painLevel: 'moderada' }),
      set({ reps: 10 }),
      set({ reps: 10 }),
    ]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('bloquear_por_dor')
  })

  it('dor forte bloqueia aumento', () => {
    const sets = [set({ painLevel: 'forte' }), set(), set()]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('bloquear_por_dor')
  })

  it('desconforto leve não bloqueia', () => {
    const sets = [set({ painLevel: 'leve' }), set(), set()]
    const result = suggestProgression(COMPOSTO, sets)
    expect(result?.action).toBe('manter')
  })
})

describe('Progressão específica do abdômen — cable crunch (flexão do tronco)', () => {
  const CABLE_CRUNCH: ProgressionTarget = {
    sets: 3,
    repsMin: 10,
    repsMax: 15,
    rirMin: 1,
    rirMax: 2,
    kind: 'abdominal',
    movementPattern: 'flexao_tronco',
  }

  it('15 reps em todas as séries com RIR adequado → sugerir o menor aumento', () => {
    const sets = [set({ reps: 15, rir: 1 }), set({ reps: 15, rir: 2 }), set({ reps: 15, rir: 1 })]
    const result = suggestForExercise(CABLE_CRUNCH, sets)
    expect(result?.action).toBe('aumentar')
    expect(result?.incrementKg).toBe(2)
  })

  it('reps abaixo do topo → manter e progredir por repetições', () => {
    const sets = [set({ reps: 12 }), set({ reps: 11 }), set({ reps: 10 })]
    const result = suggestForExercise(CABLE_CRUNCH, sets)
    expect(result?.action).toBe('manter')
  })
})

describe('Progressão específica do abdômen — reverse crunch (retroversão pélvica)', () => {
  const REVERSE_CRUNCH: ProgressionTarget = {
    sets: 3,
    repsMin: 10,
    repsMax: 15,
    rirMin: 1,
    rirMax: 2,
    kind: 'abdominal',
    movementPattern: 'retroversao_pelvica',
  }

  it('topo da faixa mas execução ainda não dominada → NÃO sugerir carga', () => {
    const sets = [
      set({ reps: 15, executionQuality: 'aceitavel' }),
      set({ reps: 15, executionQuality: 'boa' }),
      set({ reps: 15, executionQuality: 'aceitavel' }),
    ]
    const result = suggestAbProgression(REVERSE_CRUNCH, sets)
    expect(result?.action).toBe('manter')
    expect(result?.reason).toMatch(/não adicione carga|controle/i)
  })

  it('topo da faixa com execução boa em todas → progredir', () => {
    const sets = [
      set({ reps: 15, executionQuality: 'boa' }),
      set({ reps: 15, executionQuality: 'boa' }),
      set({ reps: 15, executionQuality: 'boa' }),
    ]
    const result = suggestAbProgression(REVERSE_CRUNCH, sets)
    expect(result?.action).toBe('aumentar')
  })

  it('dor moderada bloqueia', () => {
    const sets = [set({ painLevel: 'moderada' }), set(), set()]
    const result = suggestAbProgression(REVERSE_CRUNCH, sets)
    expect(result?.action).toBe('bloquear_por_dor')
  })
})

describe('Progressão específica do abdômen — ab wheel (anti-extensão)', () => {
  const AB_WHEEL: ProgressionTarget = {
    sets: 3,
    repsMin: 6,
    repsMax: 12,
    rirMin: 1,
    rirMax: 2,
    kind: 'abdominal',
    movementPattern: 'anti_extensao',
  }

  it('QUALQUER desconforto lombar bloqueia progressão de amplitude', () => {
    const sets = [set({ painLevel: 'leve' }), set(), set()]
    const result = suggestAbProgression(AB_WHEEL, sets)
    expect(result?.action).toBe('bloquear_por_dor')
    expect(result?.reason).toMatch(/amplitude/i)
  })

  it('sem dor e topo da faixa → progredir amplitude/variação (sem hiperextensão)', () => {
    const sets = [set({ reps: 12 }), set({ reps: 12 }), set({ reps: 12 })]
    const result = suggestAbProgression(AB_WHEEL, sets)
    expect(result?.action).toBe('aumentar')
    expect(result?.reason).toMatch(/hiperextensão|amplitude|variação/i)
  })

  it('sem dor, dentro da faixa → manter e progredir por controle', () => {
    const sets = [set({ reps: 8 }), set({ reps: 8 }), set({ reps: 7 })]
    const result = suggestAbProgression(AB_WHEEL, sets)
    expect(result?.action).toBe('manter')
  })
})
