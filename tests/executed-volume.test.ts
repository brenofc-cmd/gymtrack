import { describe, it, expect } from 'vitest'
import { aggregateExecutedVolume, type ExecutedSetLog } from '@/lib/training/executed-volume'

const MUSCLES = {
  'ex-supino': 'peito',
  'ex-crossover': 'peito',
  'ex-remada': 'costas',
  'ex-rosca': 'bíceps',
}

function set(overrides: Partial<ExecutedSetLog> = {}): ExecutedSetLog {
  return {
    is_warmup: false,
    pain_level: null,
    exercise_id: 'ex-supino',
    performed_exercise_id: null,
    ...overrides,
  }
}

describe('aggregateExecutedVolume', () => {
  it('conta 1 série válida por set_log agrupando pelo músculo primário', () => {
    const result = aggregateExecutedVolume(
      [set(), set(), set({ exercise_id: 'ex-remada' })],
      MUSCLES
    )
    expect(result).toEqual({ peito: 2, costas: 1 })
  })

  it('exclui séries de aquecimento', () => {
    const result = aggregateExecutedVolume(
      [set({ is_warmup: true }), set()],
      MUSCLES
    )
    expect(result).toEqual({ peito: 1 })
  })

  it('exclui séries com dor moderada ou forte, mas conta leve e nenhuma', () => {
    const result = aggregateExecutedVolume(
      [
        set({ pain_level: 'moderada' }),
        set({ pain_level: 'forte' }),
        set({ pain_level: 'leve' }),
        set({ pain_level: 'nenhuma' }),
        set({ pain_level: null }),
      ],
      MUSCLES
    )
    expect(result).toEqual({ peito: 3 })
  })

  it('respeita performed_exercise_id quando houve substituição', () => {
    const result = aggregateExecutedVolume(
      [set({ exercise_id: 'ex-supino', performed_exercise_id: 'ex-rosca' })],
      MUSCLES
    )
    expect(result).toEqual({ bíceps: 1 })
  })

  it('usa o exercício planejado quando não há substituição', () => {
    const result = aggregateExecutedVolume(
      [set({ exercise_id: 'ex-crossover', performed_exercise_id: null })],
      MUSCLES
    )
    expect(result).toEqual({ peito: 1 })
  })

  it('ignora exercícios sem músculo mapeado em vez de quebrar', () => {
    const result = aggregateExecutedVolume(
      [set({ exercise_id: 'ex-desconhecido' }), set()],
      MUSCLES
    )
    expect(result).toEqual({ peito: 1 })
  })

  it('retorna objeto vazio sem séries', () => {
    expect(aggregateExecutedVolume([], MUSCLES)).toEqual({})
  })
})
