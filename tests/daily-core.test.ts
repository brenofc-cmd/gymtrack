import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import {
  adaptationWeek,
  buildExercisePlan,
  coreWeekday,
  evaluateProgression,
  streakStats,
  type CoreExerciseWithVariations,
} from '@/lib/daily-core/logic'
import { coreTimerRemaining } from '@/lib/daily-core/store'
import type { DailyCoreExerciseRow, DailyCorePreferenceRow, DailyCoreSessionRow, DailyCoreSetRow, DailyCoreVariationRow } from '@/types/database'

const baseExercise: DailyCoreExerciseRow = {
  id: 'exercise-1', slug: 'crunch-carga', day_of_week: 1, name: 'Crunch com carga', objective: 'Flexão',
  exercise_type: 'hipertrofia', measure_type: 'repeticoes', target_sets: 3, target_reps_min: 10,
  target_reps_max: 15, target_seconds_min: null, target_seconds_max: null, per_side: false, rir_min: 1,
  rir_max: 2, rest_seconds_min: 60, rest_seconds_max: 75, primary_muscle: 'abdômen', equipment: null,
  short_cue: 'Controle', instructions: ['Controle'], common_mistakes: ['Perder o controle'],
  image_url: '/exercises/core/crunch.png', image_alt: 'Crunch controlado', progression_rule: 'Progressão dupla', order_index: 0,
  created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
}

const preferences: DailyCorePreferenceRow = {
  user_id: 'user-1', has_ab_wheel: false, has_resistance_band: false, has_weighted_backpack: false,
  manual_rep_count: true, routine_time: '07:00:00', adaptation_started_on: '2026-07-01', skip_adaptation: false,
  onboarding_completed_at: '2026-07-01T00:00:00Z', created_at: '2026-07-01T00:00:00Z', updated_at: '2026-07-01T00:00:00Z',
}

function exercise(overrides: Partial<CoreExerciseWithVariations>): CoreExerciseWithVariations {
  return { ...baseExercise, variations: [], ...overrides }
}

function variation(overrides: Pick<DailyCoreVariationRow, 'id' | 'exercise_id' | 'name'> & Partial<DailyCoreVariationRow>): DailyCoreVariationRow {
  return {
    difficulty: 1, equipment_required: null, is_default: false, is_equipment_fallback: false, order_index: 0,
    image_url: null, image_alt: null, short_cue: null, instructions: null, common_mistakes: null,
    measure_type: null, target_reps_min: null, target_reps_max: null, target_seconds_min: null,
    target_seconds_max: null, per_side: null, rest_seconds_min: null, rest_seconds_max: null, created_at: '',
    ...overrides,
  }
}

function set(overrides: Partial<DailyCoreSetRow> = {}): DailyCoreSetRow {
  return {
    id: crypto.randomUUID(), session_id: 'session-1', user_id: 'user-1', exercise_id: 'exercise-1', variation_id: null,
    set_number: 1, reps: 15, duration_seconds: null, weight_kg: 5, rir: 1, execution_quality: 'boa',
    pain_level: 'sem_dor', lumbar_controlled: true, notes: null, completed_at: '2026-07-01T10:00:00Z',
    client_updated_at: '2026-07-01T10:00:00Z', created_at: '2026-07-01T10:00:00Z', updated_at: '2026-07-01T10:00:00Z',
    ...overrides,
  }
}

function session(date: string, overrides: Partial<DailyCoreSessionRow> = {}): DailyCoreSessionRow {
  return {
    id: crypto.randomUUID(), user_id: 'user-1', day_of_week: 1, session_date: date, session_type: 'hipertrofia',
    status: 'concluido', completion_kind: 'treino', adaptation_week: 0, started_at: `${date}T10:00:00Z`,
    finished_at: `${date}T10:10:00Z`, duration_seconds: 600, client_updated_at: `${date}T10:10:00Z`,
    created_at: `${date}T10:00:00Z`, updated_at: `${date}T10:10:00Z`, ...overrides,
  }
}

describe('Abdômen Diário — seleção semanal', () => {
  it('seleciona corretamente segunda e domingo no fuso do app', () => {
    expect(coreWeekday(new Date('2026-07-13T12:00:00Z'))).toBe(1)
    expect(coreWeekday(new Date('2026-07-19T12:00:00Z'))).toBe(7)
  })

  it('sem roda usa prancha longa; com roda usa ab wheel', () => {
    const exercises = [exercise({ id: 'wheel', slug: 'ab-wheel' }), exercise({ id: 'plank', slug: 'prancha-longa', measure_type: 'tempo', target_reps_min: null, target_reps_max: null, target_seconds_min: 20, target_seconds_max: 40 })]
    expect(buildExercisePlan(exercises, preferences, 0).map((item) => item.slug)).toEqual(['prancha-longa'])
    expect(buildExercisePlan(exercises, { ...preferences, has_ab_wheel: true }, 0).map((item) => item.slug)).toEqual(['ab-wheel'])
  })

  it('sem elástico escolhe automaticamente uma alternativa do Pallof press', () => {
    const pallof = exercise({
      id: 'pallof', slug: 'pallof-press',
      variations: [
        variation({ id: 'band', exercise_id: 'pallof', name: 'Pallof', equipment_required: 'elástico', is_default: true }),
        variation({ id: 'dead-bug', exercise_id: 'pallof', name: 'Dead bug', is_equipment_fallback: true, order_index: 1 }),
      ],
    })
    expect(buildExercisePlan([pallof], preferences, 0)[0].selectedVariation?.id).toBe('dead-bug')
  })
})
describe('Abdômen Diário — adaptação', () => {
  it('primeira semana reduz hipertrofia para duas séries e RIR 3', () => {
    const plan = buildExercisePlan([exercise({})], preferences, 1)[0]
    expect(plan.effectiveSets).toBe(2)
    expect(plan.effectiveRir).toBe(3)
  })

  it('segunda semana libera três séries, ainda com RIR 3', () => {
    const plan = buildExercisePlan([exercise({})], preferences, 2)[0]
    expect(plan.effectiveSets).toBe(3)
    expect(plan.effectiveRir).toBe(3)
  })

  it('calcula a semana a partir da data de início e permite pular', () => {
    expect(adaptationWeek('2026-07-01', false, '2026-07-03')).toBe(1)
    expect(adaptationWeek('2026-07-01', false, '2026-07-10')).toBe(2)
    expect(adaptationWeek('2026-07-01', true, '2026-07-03')).toBe(0)
  })
})

describe('Abdômen Diário — progressão própria', () => {
  it('progressão dupla exige topo da faixa em todas as séries, técnica e RIR', () => {
    const result = evaluateProgression(baseExercise, [set({ set_number: 1 }), set({ set_number: 2 }), set({ set_number: 3 })])
    expect(result.status).toBe('progredir')
    expect(result.suggestedWeightKg).toBe(6)
  })

  it('tempo aumenta apenas 5 segundos e não ultrapassa o limite', () => {
    const timed = { ...baseExercise, measure_type: 'tempo' as const, target_reps_min: null, target_reps_max: null, target_seconds_min: 20, target_seconds_max: 40 }
    const result = evaluateProgression(timed, [set({ duration_seconds: 30 }), set({ duration_seconds: 30 }), set({ duration_seconds: 30 })])
    expect(result.status).toBe('manter')
    expect(result.suggestedSeconds).toBe(35)
  })

  it('dor moderada, forte ou lombar bloqueia progressão', () => {
    for (const pain of ['dor_moderada', 'dor_forte', 'dor_lombar'] as const) {
      expect(evaluateProgression(baseExercise, [set({ pain_level: pain }), set(), set()]).status).toBe('bloqueada_por_dor')
    }
  })

  it('ab wheel não progride sem controle lombar', () => {
    const wheel = { ...baseExercise, slug: 'ab-wheel' }
    expect(evaluateProgression(wheel, [set({ lumbar_controlled: false }), set(), set()]).status).toBe('revisar_tecnica')
  })

  it('não exige nota de técnica quando esse campo não aparece na sessão', () => {
    const stability = { ...baseExercise, exercise_type: 'estabilidade' as const }
    const sets = [1, 2, 3].map((setNumber) => set({ set_number: setNumber, execution_quality: null }))

    expect(evaluateProgression(stability, sets).status).toBe('progredir')
  })
})

describe('Abdômen Diário — timers e consistência sustentável', () => {
  it('timer usa timestamp e sobrevive a recarregamento', () => {
    const now = Date.now()
    const persisted = JSON.parse(JSON.stringify({ endsAt: now + 40_000, pausedRemaining: null, totalSeconds: 40 }))
    expect(coreTimerRemaining(persisted, now + 10_000)).toBe(30)
  })

  it('domingo não quebra a sequência e recuperação de sábado conta', () => {
    const sessions = [
      session('2026-07-17', { day_of_week: 5 }),
      session('2026-07-18', { day_of_week: 6, session_type: 'recuperacao', completion_kind: 'recuperacao_completa', duration_seconds: 0 }),
      session('2026-07-20', { day_of_week: 1 }),
    ]
    expect(streakStats(sessions, '2026-07-20').current).toBe(3)
  })

  it('pausa registrada por dor não recebe mensagem punitiva nem quebra consistência', () => {
    const paused = session('2026-07-20', { status: 'interrompido', completion_kind: 'pausa_por_dor' })
    expect(streakStats([paused], '2026-07-20').current).toBe(1)
  })
})

describe('Migration 0010 — segurança, isolamento e histórico', () => {
  const sql = readFileSync(path.resolve(__dirname, '../supabase/migrations/20260717010046_daily_core.sql'), 'utf8')
  const executable = sql.split('\n').filter((line) => !line.trim().startsWith('--')).join('\n')

  it('habilita RLS em todas as tabelas da funcionalidade', () => {
    for (const table of ['days', 'exercises', 'variations', 'preferences', 'reminders', 'sessions', 'sets', 'progressions', 'pain_logs', 'main_exercise_conflicts']) {
      expect(sql).toContain(`alter table public.daily_core_${table} enable row level security`)
    }
  })

  it('políticas de dados pessoais isolam por auth.uid()', () => {
    expect(sql.match(/\(select auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(20)
    expect(sql).toContain('to authenticated')
  })

  it('faz backup, preserva histórico e apenas oculta duplicidades do modelo ativo', () => {
    expect(sql.indexOf('insert into public.routine_backups')).toBeLessThan(sql.indexOf('set is_hidden = true'))
    expect(executable).not.toMatch(/delete from public\.(workouts|workout_exercises|workout_sessions|set_logs)/i)
    expect(executable).toContain('set is_hidden = true')
    expect(sql).toContain('update public.workout_exercises we')
    expect(sql).toContain('set is_hidden = c.was_hidden')
  })
})
