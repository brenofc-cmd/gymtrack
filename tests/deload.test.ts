import { describe, it, expect } from 'vitest'
import {
  suggestDeload,
  DELOAD_PRESCRIPTION,
  type DeloadExerciseHistory,
  type DeloadHistory,
} from '@/lib/progression/deload'

function compound(
  name: string,
  overrides: Partial<DeloadExerciseHistory> = {}
): DeloadExerciseHistory {
  return {
    exerciseName: name,
    isCompound: true,
    weeks: [
      { weekIndex: 0, completedSessions: 1, hadIncrease: false },
      { weekIndex: 1, completedSessions: 1, hadIncrease: false },
      { weekIndex: 2, completedSessions: 1, hadIncrease: false },
    ],
    e1rmBySession: [],
    hadAcutePain: false,
    ...overrides,
  }
}

function progressingCompound(name: string): DeloadExerciseHistory {
  return compound(name, {
    weeks: [
      { weekIndex: 0, completedSessions: 1, hadIncrease: true },
      { weekIndex: 1, completedSessions: 1, hadIncrease: false },
      { weekIndex: 2, completedSessions: 1, hadIncrease: true },
    ],
  })
}

function history(overrides: Partial<DeloadHistory> = {}): DeloadHistory {
  return {
    exercises: [],
    readinessLast7Days: [],
    hasPendingRecommendation: false,
    ...overrides,
  }
}

describe('suggestDeload — gatilho (a): estagnação', () => {
  it('sugere deload com 2+ compostos estagnados por 3 semanas com sessões completas', () => {
    const result = suggestDeload(
      history({ exercises: [compound('Supino inclinado'), compound('Remada curvada')] })
    )
    expect(result?.trigger).toBe('estagnacao')
    expect(result?.reason).toContain('Supino inclinado')
    expect(result?.prescription).toEqual(DELOAD_PRESCRIPTION)
  })

  it('NÃO sugere com apenas 1 composto estagnado', () => {
    const result = suggestDeload(
      history({ exercises: [compound('Supino inclinado'), progressingCompound('Remada curvada')] })
    )
    expect(result).toBeNull()
  })

  it('NÃO sugere quando faltam sessões completas em alguma das 3 semanas', () => {
    const incomplete = compound('Supino inclinado', {
      weeks: [
        { weekIndex: 0, completedSessions: 0, hadIncrease: false },
        { weekIndex: 1, completedSessions: 1, hadIncrease: false },
        { weekIndex: 2, completedSessions: 1, hadIncrease: false },
      ],
    })
    const result = suggestDeload(
      history({ exercises: [incomplete, compound('Remada curvada')] })
    )
    expect(result).toBeNull()
  })

  it('isoladores estagnados não contam para o gatilho', () => {
    const isolation = compound('Rosca direta', { isCompound: false })
    const result = suggestDeload(
      history({ exercises: [isolation, compound('Remada curvada')] })
    )
    expect(result).toBeNull()
  })
})

describe('suggestDeload — gatilho (b): baixa recuperação', () => {
  const lowRecoveryCheckins = (count: number, filler = 0) => [
    ...Array.from({ length: count }, (_, i) => ({
      date: `2026-07-2${i}`,
      status: 'low_recovery' as const,
    })),
    ...Array.from({ length: filler }, (_, i) => ({
      date: `2026-07-1${i}`,
      status: 'ready' as const,
    })),
  ]

  it('sugere deload com 4+ check-ins low_recovery em 7 dias', () => {
    const result = suggestDeload(history({ readinessLast7Days: lowRecoveryCheckins(4, 2) }))
    expect(result?.trigger).toBe('baixa_recuperacao')
    expect(result?.triggerData).toMatchObject({ lowRecoveryCheckins: 4 })
  })

  it('NÃO sugere com 3 check-ins low_recovery', () => {
    const result = suggestDeload(history({ readinessLast7Days: lowRecoveryCheckins(3, 4) }))
    expect(result).toBeNull()
  })
})

describe('suggestDeload — gatilho (c): queda de e1RM', () => {
  it('sugere deload com queda >10% por 2 sessões seguidas sem dor aguda', () => {
    const dropping = compound('Agachamento', {
      weeks: [
        { weekIndex: 0, completedSessions: 1, hadIncrease: true },
        { weekIndex: 1, completedSessions: 1, hadIncrease: true },
        { weekIndex: 2, completedSessions: 1, hadIncrease: false },
      ],
      // recente → antigo: 86 e 88 são ~14% e ~12% abaixo do pico de 100
      e1rmBySession: [86, 88, 100, 98],
    })
    const result = suggestDeload(history({ exercises: [dropping] }))
    expect(result?.trigger).toBe('queda_e1rm')
    expect(result?.reason).toContain('Agachamento')
  })

  it('NÃO sugere quando a queda vem acompanhada de dor aguda registrada', () => {
    const droppingWithPain = compound('Agachamento', {
      weeks: [
        { weekIndex: 0, completedSessions: 1, hadIncrease: true },
        { weekIndex: 1, completedSessions: 1, hadIncrease: true },
        { weekIndex: 2, completedSessions: 1, hadIncrease: false },
      ],
      e1rmBySession: [86, 88, 100, 98],
      hadAcutePain: true,
    })
    expect(suggestDeload(history({ exercises: [droppingWithPain] }))).toBeNull()
  })

  it('NÃO sugere com queda em apenas 1 sessão', () => {
    const singleDip = compound('Agachamento', {
      weeks: [
        { weekIndex: 0, completedSessions: 1, hadIncrease: true },
        { weekIndex: 1, completedSessions: 1, hadIncrease: true },
        { weekIndex: 2, completedSessions: 1, hadIncrease: false },
      ],
      e1rmBySession: [86, 99, 100, 98],
    })
    expect(suggestDeload(history({ exercises: [singleDip] }))).toBeNull()
  })

  it('NÃO sugere com queda menor que 10%', () => {
    const shallowDip = compound('Agachamento', {
      weeks: [
        { weekIndex: 0, completedSessions: 1, hadIncrease: true },
        { weekIndex: 1, completedSessions: 1, hadIncrease: true },
        { weekIndex: 2, completedSessions: 1, hadIncrease: false },
      ],
      e1rmBySession: [93, 92, 100, 98],
    })
    expect(suggestDeload(history({ exercises: [shallowDip] }))).toBeNull()
  })
})

describe('suggestDeload — não-gatilho e bloqueio', () => {
  it('progresso normal não gera sugestão', () => {
    const result = suggestDeload(
      history({
        exercises: [progressingCompound('Supino inclinado'), progressingCompound('Remada curvada')],
        readinessLast7Days: [
          { date: '2026-07-27', status: 'ready' },
          { date: '2026-07-28', status: 'attention' },
        ],
      })
    )
    expect(result).toBeNull()
  })

  it('bloqueia nova sugestão enquanto houver uma pendente, mesmo com gatilho ativo', () => {
    const result = suggestDeload(
      history({
        exercises: [compound('Supino inclinado'), compound('Remada curvada')],
        readinessLast7Days: Array.from({ length: 5 }, (_, i) => ({
          date: `2026-07-2${i}`,
          status: 'low_recovery' as const,
        })),
        hasPendingRecommendation: true,
      })
    )
    expect(result).toBeNull()
  })

  it('prescrição nunca é automática: sugestão carrega motivo e prescrição para confirmação', () => {
    const result = suggestDeload(
      history({ exercises: [compound('Supino inclinado'), compound('Remada curvada')] })
    )
    expect(result?.reason).toBeTruthy()
    expect(result?.prescription.keepLoads).toBe(true)
    expect(result?.prescription.accessorySetsReductionPct).toBe(40)
    expect(result?.prescription.compoundRir).toEqual([3, 4])
    expect(result?.prescription.durationWeeks).toBe(1)
  })
})

describe('migration deload_recommendations', () => {
  it('cria tabela, RLS, políticas e garante uma pendente por usuário', async () => {
    const { readFileSync } = await import('fs')
    const path = await import('path')
    const sql = readFileSync(
      path.resolve(__dirname, '../supabase/migrations/20260729130000_deload_recommendations.sql'),
      'utf-8'
    )
    expect(sql).toContain('create table if not exists public.deload_recommendations')
    expect(sql).toContain('alter table public.deload_recommendations enable row level security')
    expect(sql).toMatch(/check \(status in \('sugerido', 'aceito', 'recusado', 'concluido'\)\)/)
    expect(sql).toContain('deload_recommendations_one_pending_idx')
    expect(sql).toContain("where status = 'sugerido'")
    expect(sql).toContain('keep_screen_awake boolean not null default true')
  })
})
