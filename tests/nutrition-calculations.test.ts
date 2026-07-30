import { describe, expect, it } from 'vitest'
import { scaleNutrition, sumNutrition } from '@/lib/nutrition/calculations'

describe('nutrition calculations', () => {
  it('soma nutrientes sem arredondar durante o cálculo', () => {
    expect(sumNutrition([{ kcal: 100, protein_g: 10 }, { kcal: 50, carbs_g: 12, fiber_g: 3 }])).toEqual({ kcal: 150, protein_g: 10, carbs_g: 12, fat_g: 0, fiber_g: 3 })
  })

  it('escala uma porção e rejeita quantidade negativa', () => {
    expect(scaleNutrition({ kcal: 80, protein_g: 4 }, 2.5)).toEqual({ kcal: 200, protein_g: 10, carbs_g: 0, fat_g: 0, fiber_g: 0 })
    expect(() => scaleNutrition({ kcal: 1 }, -1)).toThrow('Quantidade inválida')
  })
})
