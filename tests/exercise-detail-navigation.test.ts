import { describe, expect, it } from 'vitest'
import {
  exerciseDetailBackHref,
  exerciseDetailHref,
} from '@/lib/navigation/exercise-detail'

describe('navegação contextual do detalhe do exercício', () => {
  it('volta ao treino que estava sendo conferido antes de iniciar', () => {
    const href = exerciseDetailHref('exercise-1', {
      workoutLetter: 'C',
      workoutSource: 'treinos',
    })
    expect(href).toBe('/exercicios/exercise-1?from=treino&workout=C&workoutSource=treinos')
    expect(
      exerciseDetailBackHref({
        from: 'treino',
        workout: 'C',
        workoutSource: 'treinos',
      })
    ).toBe('/treino/C?from=treinos')
  })

  it('preserva quando a conferência começou pelo painel', () => {
    expect(
      exerciseDetailBackHref({
        from: 'treino',
        workout: 'a',
        workoutSource: 'dashboard',
      })
    ).toBe('/treino/A?from=dashboard')
  })

  it('mantém o catálogo como retorno seguro sem contexto válido', () => {
    expect(exerciseDetailHref('exercise-1')).toBe('/exercicios/exercise-1')
    expect(exerciseDetailBackHref({ from: 'treino', workout: 'Z' })).toBe('/exercicios')
  })
})
