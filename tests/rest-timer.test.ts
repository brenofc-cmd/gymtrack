import { describe, it, expect } from 'vitest'
import { timerIsActive, timerRemaining, type RestTimer } from '@/lib/store/sessionStore'

function timer(overrides: Partial<RestTimer> = {}): RestTimer {
  return {
    endsAt: null,
    pausedRemaining: null,
    totalSeconds: 90,
    workoutExerciseId: 'we-1',
    ...overrides,
  }
}

describe('Cronômetro de descanso — baseado em timestamp real', () => {
  it('inativo quando não há endsAt nem pausa', () => {
    expect(timerIsActive(timer())).toBe(false)
    expect(timerRemaining(timer())).toBe(0)
  })

  it('restante é calculado a partir do timestamp (funciona minimizado)', () => {
    const now = Date.now()
    const t = timer({ endsAt: now + 90_000 })
    expect(timerIsActive(t)).toBe(true)
    expect(timerRemaining(t, now)).toBe(90)
    // 40 segundos "depois" (aba minimizada, sem ticks)
    expect(timerRemaining(t, now + 40_000)).toBe(50)
  })

  it('não fica negativo depois do fim', () => {
    const now = Date.now()
    const t = timer({ endsAt: now - 5_000 })
    expect(timerRemaining(t, now)).toBe(0)
  })

  it('sobrevive à atualização da página: estado persistido reconstrói o restante', () => {
    // Simula persistência: o endsAt salvo continua válido após reload
    const before = Date.now()
    const persisted = JSON.parse(JSON.stringify(timer({ endsAt: before + 60_000 })))
    const afterReload = before + 10_000
    expect(timerRemaining(persisted, afterReload)).toBe(50)
    expect(timerIsActive(persisted)).toBe(true)
  })

  it('pausado: restante congelado em pausedRemaining', () => {
    const t = timer({ pausedRemaining: 42 })
    expect(timerIsActive(t)).toBe(true)
    expect(timerRemaining(t)).toBe(42)
    expect(timerRemaining(t, Date.now() + 99_000)).toBe(42)
  })
})
