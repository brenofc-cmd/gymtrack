import { describe, expect, it } from 'vitest'
import {
  formatLoadValue,
  getLoadInputConfig,
  parseDecimalInput,
} from '@/lib/training/load-input'
import type { Exercise } from '@/types/database'

function exercise(
  name_pt: string,
  equipment: string,
  movement_pattern: string | null = null
): Pick<Exercise, 'name_pt' | 'equipment' | 'movement_pattern' | 'exercise_type'> {
  return { name_pt, equipment, movement_pattern, exercise_type: 'composto' }
}

describe('Configuração dos diferentes tipos de carga', () => {
  it('trata barra fixa assistida com lógica inversa', () => {
    const config = getLoadInputConfig(
      exercise('Barra fixa assistida com pegada neutra', 'máquina assistida')
    )
    expect(config.kind).toBe('assistance')
    expect(config.loadLabel).toBe('Assistência')
    expect(config.lowerIsHarder).toBe(true)
    expect(config.helperText).toMatch(/menos assistência/i)
  })

  it('rotula halteres por unidade e exercício unilateral por lado', () => {
    const dumbbells = getLoadInputConfig(
      exercise('Supino inclinado com halteres', 'halter')
    )
    const unilateral = getLoadInputConfig(
      exercise('Agachamento búlgaro', 'halter', 'unilateral_leg')
    )
    expect(dumbbells.loadLabel).toBe('Peso por halter')
    expect(unilateral.loadLabel).toBe('Peso por halter')
    expect(unilateral.repsLabel).toBe('Reps/lado')
  })

  it('diferencia máquina, peso corporal e repetições sem carga', () => {
    expect(getLoadInputConfig(exercise('Hack squat', 'máquina')).kind).toBe('machine_weight')
    const bodyweight = getLoadInputConfig(exercise('Reverse crunch', 'corpo'))
    expect(bodyweight.kind).toBe('bodyweight')
    expect(bodyweight.acceptsLoad).toBe(false)
    expect(formatLoadValue(null, bodyweight)).toBe('Peso corporal')
    expect(
      getLoadInputConfig(exercise('Abdominal livre', 'sem carga')).kind
    ).toBe('reps_only')
  })

  it('suporta peso total, por lado, carga corporal adicional, duração e distância', () => {
    expect(getLoadInputConfig(exercise('Levantamento terra', 'barra')).kind).toBe('external_total')
    expect(
      getLoadInputConfig(exercise('Remada unilateral no cabo', 'cabo')).kind
    ).toBe('per_side')
    expect(
      getLoadInputConfig(exercise('Barra fixa com carga adicional', 'corpo')).kind
    ).toBe('bodyweight_plus')
    expect(getLoadInputConfig(exercise('Prancha isométrica', 'corpo')).kind).toBe('duration')
    expect(getLoadInputConfig(exercise('Caminhada na esteira', 'esteira')).kind).toBe('distance')
  })

  it('aceita vírgula e ponto sem aceitar texto inválido', () => {
    expect(parseDecimalInput('24,5')).toBe(24.5)
    expect(parseDecimalInput('24.5')).toBe(24.5)
    expect(parseDecimalInput('')).toBeNull()
    expect(parseDecimalInput('abc')).toBeNaN()
  })
})
