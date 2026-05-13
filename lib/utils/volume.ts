import type { SetLog } from '@/types/database'

export function calcVolume(sets: Pick<SetLog, 'weight_kg' | 'reps'>[]): number {
  return sets.reduce((total, s) => {
    return total + (s.weight_kg ?? 0) * s.reps
  }, 0)
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${kg.toFixed(0)}kg`
}

// Fórmula de Epley: peso × (1 + reps / 30)
export function calc1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg
  return weightKg * (1 + reps / 30)
}
