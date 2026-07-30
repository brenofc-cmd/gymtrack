import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { estimateWorkoutTime, workoutTimeStatus } from '@/lib/training/session-time'
import { coreSessionElapsedSeconds } from '@/lib/daily-core/logic'

describe('Core canônico v2 — contrato de dados', () => {
  const sql = readFileSync(path.resolve(__dirname, '../supabase/migrations/20260730174205_canonical_core_v2.sql'), 'utf8')
  const executable = sql.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')

  it('programa casa terça/sexta, academia quarta/sábado e domingo livre', () => {
    expect(sql).toContain("(2, 'Core Matinal A'")
    expect(sql).toContain("(3, 'Finalizador abdominal A'")
    expect(sql).toContain("(5, 'Core Matinal B'")
    expect(sql).toContain("(6, 'Finalizador abdominal B'")
    expect(sql).toContain("(7, 'Descanso completo'")
    expect(sql.match(/'core-v2-cable-crunch'/g)?.length).toBeGreaterThanOrEqual(1)
    expect(sql.match(/'core-v2-reverse-crunch'/g)?.length).toBeGreaterThanOrEqual(1)
  })

  it('preserva histórico e não altera o DUP principal', () => {
    expect(executable).not.toMatch(/delete\s+from/i)
    expect(executable).not.toMatch(/insert\s+into\s+public\.(workouts|workout_exercises)/i)
    expect(executable).not.toMatch(/update\s+public\.(workouts|workout_exercises)/i)
    expect(sql).toContain("'pre-canonical-core-v2'")
  })

  it('é idempotente e mantém volume direto em seis séries semanais', () => {
    expect(sql).toContain('on conflict (day_of_week) do update')
    expect(sql).toContain('on conflict (slug) do update')
    expect(sql).toContain("'core-v2-cable-crunch', 3")
    expect(sql).toContain("'core-v2-reverse-crunch', 6")
    expect(sql.match(/'hipertrofia', 'repeticoes',\s+3,/g)?.length).toBe(2)
  })
})

describe('Limite e relógio de sessão', () => {
  it('faz estimativa segmentada e alerta quando ultrapassa 75 minutos', () => {
    const estimate = estimateWorkoutTime([{ target_sets: 15, rest_seconds: 180 }], 8)
    expect(estimate.totalMinutes).toBe(70)
    expect(estimate.exceedsLimit).toBe(false)
    expect(estimateWorkoutTime([{ target_sets: 17, rest_seconds: 180 }], 8).exceedsLimit).toBe(true)
  })

  it('alerta aos 65 e limita aos 75 minutos', () => {
    expect(workoutTimeStatus(64 * 60)).toBe('normal')
    expect(workoutTimeStatus(65 * 60)).toBe('warning')
    expect(workoutTimeStatus(75 * 60)).toBe('limit')
  })

  it('desconta pausas da duração real', () => {
    expect(coreSessionElapsedSeconds('2026-07-30T10:00:00Z', null, 300, Date.parse('2026-07-30T10:20:00Z'))).toBe(900)
  })
})
