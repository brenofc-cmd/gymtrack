import { describe, expect, it } from 'vitest'
import {
  ACTIVE_RECOVERY_DAY_OF_WEEK,
  REST_DAY_OF_WEEK,
  getCurrentDayState,
  nextRotatingWorkout,
} from '@/lib/training/schedule'
import { currentDayOfWeek } from '@/lib/utils/weekday'

// 2026-07-06 é segunda-feira; a semana completa segue até domingo 07-12.
const MON = new Date('2026-07-06T12:00:00-03:00')
const TUE = new Date('2026-07-07T12:00:00-03:00')
const WED = new Date('2026-07-08T12:00:00-03:00')
const THU = new Date('2026-07-09T12:00:00-03:00')
const FRI = new Date('2026-07-10T12:00:00-03:00')
const SAT = new Date('2026-07-11T12:00:00-03:00')
const SUN = new Date('2026-07-12T12:00:00-03:00')
const NEXT_MON = new Date('2026-07-13T12:00:00-03:00')

describe('agenda: quinta é recuperação ativa, domingo é descanso, o resto é treino', () => {
  it('classifica os sete dias da semana corretamente', () => {
    expect(getCurrentDayState('D', MON).kind).toBe('training')
    expect(getCurrentDayState('D', TUE).kind).toBe('training')
    expect(getCurrentDayState('D', WED).kind).toBe('training')
    expect(getCurrentDayState('D', THU).kind).toBe('active_recovery')
    expect(getCurrentDayState('D', FRI).kind).toBe('training')
    expect(getCurrentDayState('D', SAT).kind).toBe('training')
    expect(getCurrentDayState('D', SUN).kind).toBe('rest')
  })

  it('usa quinta = 4 e domingo = 7, a mesma convenção de currentDayOfWeek', () => {
    expect(currentDayOfWeek(THU)).toBe(ACTIVE_RECOVERY_DAY_OF_WEEK)
    expect(currentDayOfWeek(SUN)).toBe(REST_DAY_OF_WEEK)
  })
})

describe('recuperação/descanso nunca consomem nem avançam a sequência A–F', () => {
  it('quinta-feira: a sessão pendente continua pendente, não vira Legs 2 automaticamente', () => {
    const state = getCurrentDayState('D', THU)
    expect(state.kind).toBe('active_recovery')
    expect(state.nextSession).toBe('D')
  })

  it('domingo: a sessão pendente continua pendente para o próximo treino', () => {
    const state = getCurrentDayState('F', SUN)
    expect(state.kind).toBe('rest')
    expect(state.nextSession).toBe('F')
  })

  it('sequência A → B → C → quinta (recuperação) → D: quinta não pula para D sozinha', () => {
    const wednesday = getCurrentDayState('C', WED)
    expect(wednesday).toMatchObject({ kind: 'training', currentSession: 'C', nextSession: 'D' })

    // Sessão C concluída quarta; quinta é recuperação e D continua pendente.
    const thursday = getCurrentDayState('D', THU)
    expect(thursday).toMatchObject({ kind: 'active_recovery', nextSession: 'D' })

    // Sexta, D finalmente é treinado.
    const friday = getCurrentDayState('D', FRI)
    expect(friday).toMatchObject({ kind: 'training', currentSession: 'D' })
  })

  it('sequência E → domingo (descanso) → F: domingo não pula para F sozinho', () => {
    const saturday = getCurrentDayState('E', SAT)
    expect(saturday).toMatchObject({ kind: 'training', currentSession: 'E', nextSession: 'F' })

    const sunday = getCurrentDayState('F', SUN)
    expect(sunday).toMatchObject({ kind: 'rest', nextSession: 'F' })

    const nextMonday = getCurrentDayState('F', NEXT_MON)
    expect(nextMonday).toMatchObject({ kind: 'training', currentSession: 'F', nextSession: 'A' })
  })

  it('F → próximo dia disponível → A: a rotação nunca pula F', () => {
    expect(nextRotatingWorkout(null, 'F')).toBe('A')
    expect(getCurrentDayState('A', NEXT_MON)).toMatchObject({ kind: 'training', currentSession: 'A', nextSession: 'B' })
  })
})

describe('virada de semana nunca reseta a sequência para A', () => {
  it('segunda-feira não força A: se a última sessão concluída foi E, segunda oferece F', () => {
    // getSuggestedWorkout() já calculou 'F' (nextRotatingWorkout(null, 'E')) —
    // getCurrentDayState só decide se hoje é dia de treinar essa pendência.
    expect(nextRotatingWorkout(null, 'E')).toBe('F')
    const monday = getCurrentDayState('F', MON)
    expect(monday).toMatchObject({ kind: 'training', currentSession: 'F' })
    expect(monday).not.toMatchObject({ currentSession: 'A' })
  })
})

describe('timezone: quinta/domingo calculados no fuso do usuário, não em UTC', () => {
  it('23h de domingo em São Paulo ainda é domingo (descanso), mesmo já sendo segunda em UTC', () => {
    // 2026-07-13T01:00:00Z = domingo 22:00 em São Paulo (UTC-3).
    const lateSundayUTC = new Date('2026-07-13T01:00:00Z')
    expect(currentDayOfWeek(lateSundayUTC)).toBe(7)
    expect(getCurrentDayState('F', lateSundayUTC).kind).toBe('rest')
  })

  it('aceita um timeZone explícito em vez do padrão America/Sao_Paulo', () => {
    // Mesmo instante, mas em UTC já é segunda — outro fuso pode discordar do padrão.
    const lateSundayUTC = new Date('2026-07-13T01:00:00Z')
    expect(getCurrentDayState('F', lateSundayUTC, 'UTC').kind).toBe('training')
  })
})
