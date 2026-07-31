/**
 * Calculadora de anilhas e arredondamento para carga executável, a partir do
 * equipamento cadastrado pelo usuário (barra, menor anilha, incrementos de
 * halteres/máquina/assistência — `user_preferences`). Prioriza o RIR-alvo e
 * o histórico: arredonda para o valor executável mais próximo, nunca para
 * cima de forma agressiva.
 */

export interface EquipmentProfile {
  barWeightKg: number
  smallestPlateKg: number
  dumbbellIncrementKg: number
  machineIncrementKg: number
  assistanceIncrementKg: number
}

const STANDARD_PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5]

export interface PlateBreakdown {
  totalKg: number
  barWeightKg: number
  perSideKg: number
  platesPerSide: number[]
  achievedKg: number
}

/** Monta a combinação de anilhas por lado para a carga total pedida. */
export function barbellPlateBreakdown(
  totalKg: number,
  equipment: Pick<EquipmentProfile, 'barWeightKg' | 'smallestPlateKg'>
): PlateBreakdown {
  const perSideTarget = Math.max(0, (totalKg - equipment.barWeightKg) / 2)
  const availablePlates = STANDARD_PLATES_KG.filter((p) => p >= equipment.smallestPlateKg - 1e-9)

  let remaining = perSideTarget
  const platesPerSide: number[] = []
  for (const plate of availablePlates) {
    while (remaining + 1e-9 >= plate) {
      platesPerSide.push(plate)
      remaining -= plate
    }
  }

  const achievedPerSide = platesPerSide.reduce((sum, p) => sum + p, 0)
  const achievedKg = equipment.barWeightKg + achievedPerSide * 2

  return {
    totalKg,
    barWeightKg: equipment.barWeightKg,
    perSideKg: achievedPerSide,
    platesPerSide,
    achievedKg,
  }
}

export type RoundableKind = 'barbell' | 'dumbbell' | 'machine' | 'assistance'

/** Arredonda uma carga-alvo para o valor executável mais próximo com o equipamento disponível. */
export function roundToExecutableLoad(
  targetKg: number,
  kind: RoundableKind,
  equipment: EquipmentProfile
): number {
  if (kind === 'barbell') {
    return barbellPlateBreakdown(targetKg, equipment).achievedKg
  }
  const increment =
    kind === 'dumbbell' ? equipment.dumbbellIncrementKg
    : kind === 'machine' ? equipment.machineIncrementKg
    : equipment.assistanceIncrementKg
  if (increment <= 0) return Math.max(0, targetKg)
  return Math.max(0, Math.round(targetKg / increment) * increment)
}
