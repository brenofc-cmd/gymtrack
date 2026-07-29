import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import path from 'path'
import { classifyDay, DAY_CLASSIFICATION_LABEL } from '@/components/workout/WorkoutFocusBadge'
import { POWERBUILDING_V4 } from '@/lib/routine/powerbuilding-v4'

const compound = { exercise_type: 'composto' }
const isolator = { exercise_type: 'isolador' }
const ab = { exercise_type: 'abdominal' }

describe('classificação do dia (DUP)', () => {
  it('dia de força técnica com maioria de compostos é "Força técnica"', () => {
    expect(classifyDay('strength_technique', [compound, compound, compound, isolator])).toBe(
      'strength_technique'
    )
  })

  it('dia de força técnica com maioria de acessórios vira "Misto" (não chamar só de força)', () => {
    expect(
      classifyDay('strength_technique', [compound, isolator, isolator, isolator, ab])
    ).toBe('mixed')
  })

  it('dia de hipertrofia é hipertrofia independentemente da composição', () => {
    expect(classifyDay('hypertrophy', [compound, compound])).toBe('hypertrophy')
    expect(classifyDay('hypertrophy', [isolator, isolator])).toBe('hypertrophy')
  })

  it('recuperação é preservada', () => {
    expect(classifyDay('recovery', [isolator])).toBe('recovery')
  })

  it('sem foco declarado cai em hipertrofia (padrão da rotina)', () => {
    expect(classifyDay(null, [])).toBe('hypertrophy')
    expect(classifyDay(undefined, [compound])).toBe('hypertrophy')
  })

  it('todas as classificações têm rótulo em português', () => {
    for (const key of ['strength_technique', 'hypertrophy', 'mixed', 'recovery', 'rest'] as const) {
      expect(DAY_CLASSIFICATION_LABEL[key]).toBeTruthy()
    }
    expect(DAY_CLASSIFICATION_LABEL.mixed).toBe('Misto')
  })

  it('aplicada à rotina v4 real, os dias A–C classificam como força técnica ou misto e D–F como hipertrofia', () => {
    for (const day of POWERBUILDING_V4) {
      const classification = classifyDay(
        day.focus,
        day.exercises.map((exercise) => ({ exercise_type: exercise.kind }))
      )
      if (day.focus === 'strength_technique') {
        expect(['strength_technique', 'mixed']).toContain(classification)
      } else {
        expect(classification).toBe('hypertrophy')
      }
    }
  })
})

describe('classificação exibida nas três telas (fonte única)', () => {
  const files = {
    dashboard: 'app/(app)/page.tsx',
    detalhe: 'app/(app)/treino/[letter]/page.tsx',
    sessao: 'app/(app)/sessao/[id]/SessionClient.tsx',
  }

  it('dashboard, detalhe do treino e sessão usam o mesmo componente', () => {
    for (const [screen, file] of Object.entries(files)) {
      const source = readFileSync(path.resolve(__dirname, '..', file), 'utf-8')
      expect(source, screen).toContain('classifyDay')
    }
  })

  it('nenhuma tela usa mais o rótulo antigo com fallback fixo de hipertrofia', () => {
    for (const [screen, file] of Object.entries(files)) {
      const source = readFileSync(path.resolve(__dirname, '..', file), 'utf-8')
      expect(source, screen).not.toContain("TRAINING_FOCUS_LABEL[workout.session_focus")
    }
  })
})

describe('nomenclatura do produto (item 15.12)', () => {
  const listSources = (dir: string): string[] => {
    const out: string[] = []
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry)
      if (statSync(full).isDirectory()) out.push(...listSources(full))
      else if (/\.(ts|tsx)$/.test(entry)) out.push(full)
    }
    return out
  }

  it('nenhuma tela cita David Laid nem chama a rotina de "treino oficial"', () => {
    const offenders: string[] = []
    for (const root of ['app', 'components'].map((d) => path.resolve(__dirname, '..', d))) {
      for (const file of listSources(root)) {
        const source = readFileSync(file, 'utf-8')
        if (/david\s*laid/i.test(source) || /treino (oficial|do david)/i.test(source)) {
          offenders.push(path.relative(path.resolve(__dirname, '..'), file))
        }
      }
    }
    expect(offenders).toEqual([])
  })

  it('a área educativa usa a nomenclatura adaptada e não promete físico idêntico', () => {
    const learning = readFileSync(
      path.resolve(__dirname, '../app/(app)/aprendizado/page.tsx'),
      'utf-8'
    )
    expect(learning).toMatch(/adaptado para iniciante/i)
    expect(learning).not.toMatch(/mesmo físico|físico igual/i)
  })
})
