import { describe, expect, it } from 'vitest'
import { buildWarmupPlan } from '@/lib/progression/warmup'
import {
  suggestProgression,
  type ProgressionTarget,
  type SetPerformance,
} from '@/lib/progression/progression'

const TARGET: ProgressionTarget = {
  sets: 3,
  repsMin: 8,
  repsMax: 12,
  rirMin: 2,
  rirMax: 2,
  kind: 'composto',
  loadDirection: 'lower_is_harder',
}

function set(): SetPerformance {
  return {
    weightKg: 30,
    reps: 12,
    rir: 2,
    isWarmup: false,
    painLevel: 'nenhuma',
    executionQuality: 'boa',
  }
}

describe('Exercício assistido', () => {
  it('progride reduzindo assistência, nunca aumentando-a', () => {
    const result = suggestProgression(TARGET, [set(), set(), set()])
    expect(result?.action).toBe('aumentar')
    expect(result?.loadAdjustment).toBe('decrease_assistance')
    expect(result?.reason).toMatch(/reduza a assistência/i)
  })

  it('aquece com mais assistência em incrementos fixos, sem percentuais invertidos', () => {
    const plan = buildWarmupPlan(30, 'assistance')
    expect(plan.slice(1).map((item) => item.weightKg)).toEqual([40, 35, 30])
    expect(plan.map((item) => item.label).join(' ')).not.toMatch(/%/)
  })
})
