import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import path from 'path'
import {
  aggregatePlannedVolume,
  aggregatePlannedIndirect,
  type PlannedExerciseRow,
} from '@/lib/training/planned-volume'
import { DAVID_LAID_PUBLIC_DUP_V5 } from '@/lib/routine/david-laid-public-dup-v5'

function row(overrides: Partial<PlannedExerciseRow>): PlannedExerciseRow {
  return {
    target_sets: 3,
    is_hidden: false,
    muscle_group: 'peito',
    secondary_muscles: null,
    ...overrides,
  }
}

describe('volume planejado a partir da ficha ativa (banco)', () => {
  it('soma séries diretas por músculo apenas dos exercícios visíveis', () => {
    const result = aggregatePlannedVolume([
      row({ muscle_group: 'peito', target_sets: 3 }),
      row({ muscle_group: 'peito', target_sets: 2 }),
      row({ muscle_group: 'costas', target_sets: 4 }),
    ])
    expect(result).toEqual({ peito: 5, costas: 4 })
  })

  it('a rotina DUP não inclui abdômen e o módulo independente não conta no volume', () => {
    const staticAbSets = DAVID_LAID_PUBLIC_DUP_V5.flatMap((day) => day.exercises)
      .filter((exercise) => exercise.primaryMuscle === 'abdômen')
      .reduce((total, exercise) => total + exercise.sets, 0)
    expect(staticAbSets).toBe(0)

    // Qualquer registro do módulo Abdômen Diário continua oculto na rotina principal.
    const activeRows: PlannedExerciseRow[] = [
      row({ muscle_group: 'peito', target_sets: 3 }),
      row({ muscle_group: 'abdômen', target_sets: 3, is_hidden: true }),
      row({ muscle_group: 'abdômen', target_sets: 3, is_hidden: true }),
      row({ muscle_group: 'abdômen', target_sets: 3, is_hidden: true }),
      row({ muscle_group: 'abdômen', target_sets: 2, is_hidden: true }),
    ]
    const planned = aggregatePlannedVolume(activeRows)
    expect(planned).toEqual({ peito: 3 })
    expect(planned['abdômen']).toBeUndefined()
  })

  it('indiretas: 0,5/série por músculo secundário, separadas e sem exercícios ocultos', () => {
    const result = aggregatePlannedIndirect([
      row({ muscle_group: 'peito', target_sets: 3, secondary_muscles: ['tríceps', 'deltoide anterior'] }),
      row({ muscle_group: 'costas', target_sets: 4, secondary_muscles: ['bíceps'] }),
      row({ muscle_group: 'abdômen', target_sets: 3, is_hidden: true, secondary_muscles: ['oblíquos'] }),
    ])
    expect(result).toEqual({ tríceps: 1.5, 'deltoide anterior': 1.5, bíceps: 2 })
    expect(result['oblíquos']).toBeUndefined()
  })

  it('indiretas nunca se somam às diretas (chaves independentes)', () => {
    const rows = [row({ muscle_group: 'peito', target_sets: 4, secondary_muscles: ['tríceps'] })]
    const planned = aggregatePlannedVolume(rows)
    const indirect = aggregatePlannedIndirect(rows)
    expect(planned).toEqual({ peito: 4 })
    expect(indirect).toEqual({ tríceps: 2 })
  })

  it('o card não usa mais a rotina estática como fonte (sem fallback silencioso)', () => {
    const card = readFileSync(
      path.resolve(__dirname, '../components/dashboard/PlannedVolumeCard.tsx'),
      'utf-8'
    )
    expect(card).not.toContain('VOLUME_SEMANAL_ALVO')
    expect(card).not.toContain('secondaryVolumeByMuscle')
    expect(card).toContain('planned == null')
    expect(card).toContain('Abdômen Diário')
  })
})
