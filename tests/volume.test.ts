import { describe, it, expect } from 'vitest'
import { calcVolume } from '@/lib/utils/volume'
import { analyzeRecovery } from '@/lib/progression/recovery'
import { buildWarmupPlan } from '@/lib/progression/warmup'
import { currentDayOfWeek, todayLetter } from '@/lib/utils/weekday'

describe('Volume', () => {
  it('calcula kg × reps', () => {
    expect(
      calcVolume([
        { weight_kg: 20, reps: 10 },
        { weight_kg: 10, reps: 5 },
      ])
    ).toBe(250)
  })
})

describe('Aquecimento', () => {
  it('gera séries de aproximação a partir da carga de trabalho', () => {
    const plan = buildWarmupPlan(40)
    expect(plan).toHaveLength(4)
    expect(plan[1].weightKg).toBe(15) // ~40% de 40 = 16 → arredonda p/ 15 (anilhas de 2.5)
    expect(plan[2].weightKg).toBe(25) // ~60% de 40 = 24 → 25
    expect(plan[3].weightKg).toBe(30) // ~77.5% de 40 = 31 → 30
  })

  it('usuário sem histórico: plano sem cargas, sem quebrar', () => {
    const plan = buildWarmupPlan(null)
    expect(plan).toHaveLength(4)
    expect(plan.every((s) => s.weightKg === null)).toBe(true)
  })
})

describe('Análise de recuperação', () => {
  it('sem alerta com menos de 3 sessões', () => {
    expect(
      analyzeRecovery([
        { volume: 1000, finishedAt: '2026-07-01' },
        { volume: 900, finishedAt: '2026-07-03' },
      ])
    ).toBeNull()
  })

  it('alerta quando o volume caiu por 2 sessões consecutivas', () => {
    const alert = analyzeRecovery([
      { volume: 1000, finishedAt: '2026-07-01' },
      { volume: 900, finishedAt: '2026-07-03' },
      { volume: 800, finishedAt: '2026-07-05' },
    ])
    expect(alert).not.toBeNull()
    expect(alert!.suggestions.length).toBeGreaterThanOrEqual(4)
    // não diagnostica overtraining
    expect(alert!.message.toLowerCase()).not.toContain('overtraining')
  })

  it('sem alerta quando o volume se recuperou', () => {
    expect(
      analyzeRecovery([
        { volume: 1000, finishedAt: '2026-07-01' },
        { volume: 900, finishedAt: '2026-07-03' },
        { volume: 1100, finishedAt: '2026-07-05' },
      ])
    ).toBeNull()
  })
})

describe('Treino do dia — fuso horário do usuário (America/Sao_Paulo)', () => {
  it('mapeia segunda→A ... sábado→F e domingo→descanso', () => {
    // 2026-07-06 é segunda-feira
    expect(todayLetter(new Date('2026-07-06T12:00:00-03:00'))).toBe('A')
    expect(todayLetter(new Date('2026-07-07T12:00:00-03:00'))).toBe('B')
    expect(todayLetter(new Date('2026-07-08T12:00:00-03:00'))).toBe('C')
    expect(todayLetter(new Date('2026-07-09T12:00:00-03:00'))).toBe('D')
    expect(todayLetter(new Date('2026-07-10T12:00:00-03:00'))).toBe('E')
    expect(todayLetter(new Date('2026-07-11T12:00:00-03:00'))).toBe('F')
    expect(todayLetter(new Date('2026-07-12T12:00:00-03:00'))).toBeNull()
  })

  it('respeita o fuso: 23h de domingo em SP ainda é domingo (descanso)', () => {
    // 2026-07-13T01:00Z = domingo 22:00 em São Paulo
    expect(currentDayOfWeek(new Date('2026-07-13T01:00:00Z'))).toBe(7)
    expect(todayLetter(new Date('2026-07-13T01:00:00Z'))).toBeNull()
  })
})
