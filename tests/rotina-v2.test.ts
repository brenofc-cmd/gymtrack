import { describe, it, expect } from 'vitest'
import {
  ROTINA_V2,
  VOLUME_SEMANAL_ALVO,
  directVolumeByMuscle,
  ROUTINE_VERSION,
} from '@/lib/routine/rotina-v2'

describe('Rotina v2 — estrutura da divisão semanal', () => {
  it('tem exatamente 6 dias (segunda a sábado), domingo é descanso', () => {
    expect(ROTINA_V2).toHaveLength(6)
    expect(ROTINA_V2.map((d) => d.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('divisão: Push A, Pull A, Legs A, Push B, Pull B, Legs B com letras A–F', () => {
    expect(ROTINA_V2.map((d) => d.name)).toEqual([
      'Push A', 'Pull A', 'Legs A', 'Push B', 'Pull B', 'Legs B',
    ])
    expect(ROTINA_V2.map((d) => d.letter)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
  })

  it('Push A possui 7 exercícios', () => {
    expect(ROTINA_V2[0].exercises).toHaveLength(7)
  })

  it('Pull A possui 6 exercícios', () => {
    expect(ROTINA_V2[1].exercises).toHaveLength(6)
  })

  it('Legs A possui 6 exercícios', () => {
    expect(ROTINA_V2[2].exercises).toHaveLength(6)
  })

  it('Push B possui 6 exercícios', () => {
    expect(ROTINA_V2[3].exercises).toHaveLength(6)
  })

  it('Pull B possui 5 exercícios', () => {
    expect(ROTINA_V2[4].exercises).toHaveLength(5)
  })

  it('Legs B possui 6 exercícios', () => {
    expect(ROTINA_V2[5].exercises).toHaveLength(6)
  })

  it('versão da rotina é 3', () => {
    expect(ROUTINE_VERSION).toBe(3)
  })
})

describe('Rotina v2 — ordem e localização dos exercícios', () => {
  it('o stiff está no Legs B (primeiro exercício), não no Legs A', () => {
    const legsA = ROTINA_V2[2]
    const legsB = ROTINA_V2[5]
    expect(legsB.exercises[0].name).toMatch(/stiff/i)
    expect(legsA.exercises.some((e) => /stiff/i.test(e.name))).toBe(false)
  })

  it('a cadeira extensora está no Legs A, não no Legs B', () => {
    const legsA = ROTINA_V2[2]
    const legsB = ROTINA_V2[5]
    expect(legsA.exercises.some((e) => /extensora/i.test(e.name))).toBe(true)
    expect(legsB.exercises.some((e) => /extensora/i.test(e.name))).toBe(false)
  })

  it('não existe uma terceira remada no Pull B', () => {
    const pullB = ROTINA_V2[4]
    const rows = pullB.exercises.filter((e) => /remada|barra fixa|puxada/i.test(e.name))
    // 1 puxada vertical (barra fixa) + 1 remada horizontal = 2 puxadas no total
    const remadas = pullB.exercises.filter((e) => /remada/i.test(e.name))
    expect(remadas).toHaveLength(1)
    expect(rows.length).toBeLessThanOrEqual(2)
  })

  it('Push A: supino inclinado com halteres é o primeiro exercício', () => {
    expect(ROTINA_V2[0].exercises[0].name).toMatch(/supino inclinado com halteres/i)
  })

  it('a ordem de cada dia preserva compostos pesados antes de isoladores/abdômen', () => {
    for (const day of ROTINA_V2) {
      const lastIndexCompound = day.exercises
        .map((e, i) => (e.kind === 'composto' ? i : -1))
        .filter((i) => i >= 0)
        .pop()!
      const abIndex = day.exercises.findIndex((e) => e.kind === 'abdominal')
      if (abIndex !== -1) {
        // abdômen sempre depois do último composto
        expect(abIndex).toBeGreaterThan(lastIndexCompound)
        // abdômen é o último exercício do dia
        expect(abIndex).toBe(day.exercises.length - 1)
      }
    }
  })
})

describe('Rotina v2 — abdômen (3 sessões diretas por semana)', () => {
  const daysWithAbs = ROTINA_V2.filter((d) =>
    d.exercises.some((e) => e.kind === 'abdominal')
  )

  it('exatamente 3 dias têm trabalho abdominal direto (seg, qua, sáb)', () => {
    expect(daysWithAbs).toHaveLength(3)
    expect(daysWithAbs.map((d) => d.dayOfWeek)).toEqual([1, 3, 6])
  })

  it('não há treino abdominal direto em Pull A, Push B e Pull B', () => {
    for (const day of [ROTINA_V2[1], ROTINA_V2[3], ROTINA_V2[4]]) {
      expect(day.exercises.every((e) => e.kind !== 'abdominal')).toBe(true)
    }
  })

  it('o abdômen possui exatamente 12 séries diretas semanais', () => {
    const abSets = ROTINA_V2.flatMap((d) => d.exercises)
      .filter((e) => e.kind === 'abdominal')
      .reduce((sum, e) => sum + e.sets, 0)
    expect(abSets).toBe(12)
  })

  it('cada sessão abdominal usa um padrão de movimento diferente', () => {
    const patterns = daysWithAbs.map(
      (d) => d.exercises.find((e) => e.kind === 'abdominal')!.movementPattern
    )
    expect(patterns).toEqual(['flexao_tronco', 'retroversao_pelvica', 'anti_extensao'])
  })

  it('exercícios abdominais têm faixa de reps e substituições com progressão objetiva', () => {
    const abs = ROTINA_V2.flatMap((d) => d.exercises).filter((e) => e.kind === 'abdominal')
    for (const ex of abs) {
      expect(ex.repsMax).toBeGreaterThan(ex.repsMin)
      expect(ex.sets).toBe(4)
    }
    // ab wheel não substitui por prancha comum cronometrada como 1ª opção
    const abWheel = abs.find((e) => e.movementPattern === 'anti_extensao')!
    expect(abWheel.substitutions[0]).not.toMatch(/prancha/i)
  })
})

describe('Rotina v2 — séries, faixas de repetição e RIR', () => {
  it('todas as faixas de repetições e RIR são válidas', () => {
    for (const day of ROTINA_V2) {
      for (const ex of day.exercises) {
        expect(ex.repsMin).toBeGreaterThan(0)
        expect(ex.repsMax).toBeGreaterThanOrEqual(ex.repsMin)
        expect(ex.rirMin).toBeGreaterThanOrEqual(0)
        expect(ex.rirMax).toBeGreaterThanOrEqual(ex.rirMin)
        expect(ex.sets).toBeGreaterThanOrEqual(2)
        expect(ex.restSeconds).toBeGreaterThanOrEqual(60)
      }
    }
  })

  it('compostos pesados (agachamento/stiff) usam RIR 2–3', () => {
    const hack = ROTINA_V2[2].exercises[0]
    const stiff = ROTINA_V2[5].exercises[0]
    expect([hack.rirMin, hack.rirMax]).toEqual([2, 3])
    expect([stiff.rirMin, stiff.rirMax]).toEqual([2, 3])
  })

  it('faixas de descanso em intervalo usam o maior valor como padrão', () => {
    // cable crunch 75–90 → 90; flexora 90–120 → 120; leg press 150–180 → 180
    const cableCrunch = ROTINA_V2[0].exercises[6]
    expect(cableCrunch.restSeconds).toBe(90)
    const flexora = ROTINA_V2[2].exercises[3]
    expect(flexora.restSeconds).toBe(120)
    const legPress = ROTINA_V2[2].exercises[1]
    expect(legPress.restSeconds).toBe(180)
  })
})

describe('Rotina v2 — volume semanal', () => {
  const volume = directVolumeByMuscle()

  it('peitoral: 12 séries diretas', () => {
    expect(volume['peito']).toBe(12)
  })

  it('costas e dorsais: 14 séries diretas', () => {
    // costas diretas + deltoide posterior fica separado
    expect(volume['costas']).toBe(14)
  })

  it('deltoide lateral: 10 séries diretas', () => {
    expect(volume['deltoide lateral']).toBe(10)
  })

  it('deltoide posterior: 6 séries diretas', () => {
    expect(volume['deltoide posterior']).toBe(6)
  })

  it('bíceps: 8 séries diretas', () => {
    expect(volume['bíceps']).toBe(8)
  })

  it('tríceps: 8 séries diretas', () => {
    expect(volume['tríceps']).toBe(8)
  })

  it('quadríceps: ~11 séries diretas', () => {
    expect(volume['quadríceps']).toBe(11)
  })

  it('posteriores de coxa: ~9 séries diretas', () => {
    expect(volume['isquiotibiais']).toBe(9)
  })

  it('panturrilhas: 8 séries diretas', () => {
    expect(volume['panturrilha']).toBe(8)
  })

  it('abdômen: 12 séries diretas', () => {
    expect(volume['abdômen']).toBe(12)
  })

  it('a tabela exibida no app (VOLUME_SEMANAL_ALVO) bate com a rotina', () => {
    expect(volume['peito']).toBe(VOLUME_SEMANAL_ALVO['peito'])
    expect(volume['costas']).toBe(VOLUME_SEMANAL_ALVO['costas'])
    expect(volume['deltoide lateral']).toBe(VOLUME_SEMANAL_ALVO['deltoide lateral'])
    expect(volume['deltoide posterior']).toBe(VOLUME_SEMANAL_ALVO['deltoide posterior'])
    expect(volume['bíceps']).toBe(VOLUME_SEMANAL_ALVO['bíceps'])
    expect(volume['tríceps']).toBe(VOLUME_SEMANAL_ALVO['tríceps'])
    expect(volume['quadríceps']).toBe(VOLUME_SEMANAL_ALVO['quadríceps'])
    expect(volume['isquiotibiais']).toBe(VOLUME_SEMANAL_ALVO['isquiotibiais'])
    expect(volume['panturrilha']).toBe(VOLUME_SEMANAL_ALVO['panturrilha'])
    expect(volume['abdômen']).toBe(VOLUME_SEMANAL_ALVO['abdômen'])
  })
})

describe('Rotina v2 — substituições', () => {
  it('substituições cadastradas apenas onde o plano permite', () => {
    const withSubs = ROTINA_V2.flatMap((d) => d.exercises).filter(
      (e) => e.substitutions.length > 0
    )
    const names = withSubs.map((e) => e.name)
    expect(names).toContain('Supino inclinado com halteres')
    expect(names).toContain('Chest press convergente')
    expect(names).toContain('Hack squat')
    expect(names).toContain('Cable crunch')
    expect(names).toContain('Reverse crunch no banco')
    expect(names).toContain('Ab wheel ajoelhado')
  })

  it('hack squat permite agachamento livre e smith como variações', () => {
    const hack = ROTINA_V2[2].exercises[0]
    expect(hack.substitutions).toEqual(['Agachamento livre', 'Agachamento no Smith'])
  })
})
