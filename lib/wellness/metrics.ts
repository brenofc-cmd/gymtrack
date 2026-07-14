export function movingAverage(values: number[], windowSize = 7): number | null {
  const finite = values.filter(Number.isFinite)
  if (finite.length === 0) return null
  const sample = finite.slice(-windowSize)
  return sample.reduce((sum, value) => sum + value, 0) / sample.length
}

export type CalorieAdjustment = 'aumentar' | 'reduzir' | 'manter' | 'insuficiente'

export function suggestCalorieAdjustment(
  weeklyChangeKg: number | null,
  targetMin = 0.15,
  targetMax = 0.30
): { action: CalorieAdjustment; calories: number; reason: string } {
  if (weeklyChangeKg == null) {
    return { action: 'insuficiente', calories: 0, reason: 'Registre pelo menos duas médias semanais.' }
  }
  if (weeklyChangeKg < targetMin) {
    return { action: 'aumentar', calories: 150, reason: 'A média subiu menos que a meta por duas semanas.' }
  }
  if (weeklyChangeKg > targetMax) {
    return { action: 'reduzir', calories: 100, reason: 'A média subiu mais que a meta por duas semanas.' }
  }
  return { action: 'manter', calories: 0, reason: 'A variação está dentro da faixa desejada.' }
}

export function shouldSuggestFatigueReduction(signals: {
  performanceDrop: boolean
  poorSleep: boolean
  jointPain: boolean
  constantFatigue: boolean
  lowMotivation: boolean
  persistentSoreness: boolean
}): boolean {
  return Object.values(signals).filter(Boolean).length >= 3
}
