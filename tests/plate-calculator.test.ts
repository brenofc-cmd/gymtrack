import { describe, expect, it } from 'vitest'
import { barbellPlateBreakdown, roundToExecutableLoad } from '@/lib/progression/plate-calculator'

const equipment = {
  barWeightKg: 20,
  smallestPlateKg: 1.25,
  dumbbellIncrementKg: 2,
  machineIncrementKg: 5,
  assistanceIncrementKg: 2.5,
}

describe('calculadora de anilhas', () => {
  it('monta a combinação por lado para uma carga exata', () => {
    const result = barbellPlateBreakdown(100, equipment)
    expect(result.barWeightKg).toBe(20)
    expect(result.perSideKg).toBe(40)
    expect(result.platesPerSide).toEqual([25, 15])
    expect(result.achievedKg).toBe(100)
  })

  it('arredonda para baixo (executável) quando a carga-alvo não é exata para a menor anilha', () => {
    const result = barbellPlateBreakdown(100.3, equipment)
    expect(result.achievedKg).toBe(100)
    expect(result.achievedKg).toBeLessThan(100.3)
  })

  it('nunca sugere anilhas menores que a menor anilha cadastrada', () => {
    const result = barbellPlateBreakdown(60, { ...equipment, smallestPlateKg: 5 })
    for (const plate of result.platesPerSide) expect(plate).toBeGreaterThanOrEqual(5)
  })
})

describe('arredondamento por tipo de equipamento', () => {
  it('barra usa a calculadora de anilhas', () => {
    expect(roundToExecutableLoad(100, 'barbell', equipment)).toBe(100)
  })

  it('halteres/máquina/assistência arredondam para o incremento cadastrado', () => {
    expect(roundToExecutableLoad(21, 'dumbbell', equipment)).toBe(22)
    expect(roundToExecutableLoad(47, 'machine', equipment)).toBe(45)
    expect(roundToExecutableLoad(23, 'assistance', equipment)).toBe(22.5)
  })
})
