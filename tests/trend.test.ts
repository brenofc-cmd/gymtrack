import { describe, it, expect } from 'vitest'
import { analyzeTrend, TREND_LABEL, type TrendSessionPoint } from '@/lib/progression/trend'

function session(overrides: Partial<TrendSessionPoint> = {}): TrendSessionPoint {
  return {
    date: '2026-07-01T18:00:00Z',
    maxWeight: 40,
    maxReps: 8,
    sets: 3,
    volume: 960,
    avgRir: 2,
    hadPoorExecution: false,
    hadBlockingPain: false,
    lowReadiness: false,
    ...overrides,
  }
}

/** Série de sessões da mais antiga para a mais recente. */
function series(count: number, build: (index: number) => Partial<TrendSessionPoint>) {
  return Array.from({ length: count }, (_, index) =>
    session({ date: `2026-07-${String(index + 1).padStart(2, '0')}T18:00:00Z`, ...build(index) })
  )
}

describe('analyzeTrend — dados insuficientes', () => {
  it('classifica como dados insuficientes com menos de 3 sessões', () => {
    const result = analyzeTrend(series(2, () => ({})), 8)
    expect(result.state).toBe('dados_insuficientes')
    expect(result.label).toBe(TREND_LABEL.dados_insuficientes)
    expect(result.reason).toMatch(/2 sessões/)
  })

  it('janela vazia não quebra e reporta consistência', () => {
    const result = analyzeTrend([], 4)
    expect(result.state).toBe('dados_insuficientes')
    expect(result.consistency).toEqual({ expected: 4, logged: 0 })
    expect(result.bestSet).toBeNull()
  })
})

describe('analyzeTrend — evolução', () => {
  it('reconhece aumento de carga acima do limiar', () => {
    const result = analyzeTrend(
      series(4, (index) => ({ maxWeight: 40 + index * 2.5 })),
      8
    )
    expect(result.state).toBe('evoluindo')
    expect(result.weightChangePct).toBeCloseTo(0.1875, 3)
    expect(result.reason).toMatch(/19%|18%/)
  })

  it('reconhece ganho de repetições com a mesma carga como progresso', () => {
    const result = analyzeTrend(
      series(4, (index) => ({ maxWeight: 40, maxReps: 8 + index })),
      8
    )
    expect(result.state).toBe('evoluindo')
    expect(result.repsChange).toBe(3)
    expect(result.reason).toMatch(/Repetição também é progresso/)
  })

  it('exercício sem carga (peso corporal) evolui por repetições', () => {
    const result = analyzeTrend(
      series(4, (index) => ({ maxWeight: null, maxReps: 10 + index * 2 })),
      6
    )
    expect(result.state).toBe('evoluindo')
    expect(result.weightChangePct).toBeNull()
  })
})

describe('analyzeTrend — sinais que vêm antes da carga', () => {
  it('técnica inconsistente tem prioridade sobre ganho de carga', () => {
    const result = analyzeTrend(
      series(4, (index) => ({ maxWeight: 40 + index * 5, hadPoorExecution: index % 2 === 0 })),
      8
    )
    expect(result.state).toBe('tecnica_inconsistente')
    expect(result.reason).toMatch(/Estabilize a técnica/)
  })

  it('recuperação prejudicada é reportada quando metade das sessões teve dor ou prontidão baixa', () => {
    const result = analyzeTrend(
      series(4, (index) => ({ maxWeight: 40, lowReadiness: index < 2, hadBlockingPain: index >= 2 })),
      8
    )
    expect(result.state).toBe('recuperacao_prejudicada')
    expect(result.reason).toMatch(/recuperação baixa ou dor/)
  })
})

describe('analyzeTrend — estagnação exige janela cheia', () => {
  it('carga e repetições paradas ao longo da janela viram possível estagnação', () => {
    const result = analyzeTrend(
      series(8, () => ({ maxWeight: 40, maxReps: 8 })),
      8
    )
    expect(result.state).toBe('possivel_estagnacao')
    expect(result.reason).toMatch(/descarga|carga, descanso/)
  })

  it('NÃO diagnostica estagnação com poucas sessões na janela (uma sessão ruim não basta)', () => {
    const result = analyzeTrend(
      series(3, () => ({ maxWeight: 40, maxReps: 8 })),
      8
    )
    expect(result.state).toBe('estavel')
  })

  it('queda isolada de repetições é tratada como oscilação, não como estagnação', () => {
    const result = analyzeTrend(
      [session({ maxReps: 10 }), session({ maxReps: 10 }), session({ maxReps: 9 })],
      8
    )
    expect(result.state).toBe('estavel')
    expect(result.reason).toMatch(/Oscilação normal/)
  })
})

describe('analyzeTrend — métricas de apoio', () => {
  it('conta consistência contra o esperado da janela', () => {
    const result = analyzeTrend(series(5, () => ({})), 8)
    expect(result.consistency).toEqual({ expected: 8, logged: 5 })
  })

  it('escolhe a melhor série por carga e desempata por repetições', () => {
    const result = analyzeTrend(
      [
        session({ maxWeight: 40, maxReps: 12 }),
        session({ maxWeight: 45, maxReps: 6 }),
        session({ maxWeight: 45, maxReps: 9 }),
      ],
      4
    )
    expect(result.bestSet).toMatchObject({ weight: 45, reps: 9 })
  })

  it('a janela é apenas lente de observação: 4, 6 e 8 aceitas sem obrigar troca', () => {
    for (const window of [4, 6, 8] as const) {
      const result = analyzeTrend(series(4, () => ({})), window)
      expect(result.window).toBe(window)
      expect(result.reason).not.toMatch(/troque|substitua/i)
    }
  })
})
