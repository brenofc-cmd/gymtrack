// @vitest-environment jsdom

import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CurrentExercisePanel } from '@/components/session/CurrentExercisePanel'
import { ExerciseNavigator } from '@/components/session/ExerciseNavigator'
import { FinishWorkoutSheet } from '@/components/session/FinishWorkoutSheet'
import { RestTimerDock } from '@/components/session/RestTimerDock'
import { SetRow } from '@/components/session/SetRow'
import { WarmupSetList } from '@/components/session/WarmupSetList'
import { WorkoutSaveStatus } from '@/components/session/WorkoutSaveStatus'
import { getLoadInputConfig } from '@/lib/training/load-input'
import {
  timerIsActive,
  timerRemaining,
  useSessionStore,
  type LocalSetLog,
} from '@/lib/store/sessionStore'
import type { Exercise, WorkoutExerciseWithExercise } from '@/types/database'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))

vi.mock('next/navigation', () => ({ useRouter: () => router }))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: () => ({
      upsert: async () => ({ error: null }),
      update: () => ({ eq: () => ({ eq: async () => ({ error: null }) }) }),
    }),
  }),
}))

function exercise(id: string, name: string, equipment = 'máquina'): Exercise {
  return {
    id,
    name_pt: name,
    name_en: null,
    muscle_group: 'costas',
    equipment,
    exercise_type: 'composto',
    movement_pattern: 'vertical_pull',
    secondary_muscles: ['bíceps'],
    instructions: ['Movimento controlado.'],
    load_guidance: null,
    training_objective: null,
    risk_level: 'moderate',
    difficulty_level: 'intermediário',
    exercisedb_id: null,
    gif_url: null,
    slug: id,
    load_unit: 'added_load_kg',
    is_unilateral: false,
    technical_warnings: [],
    default_rest_seconds: 90,
    min_increment_kg: 1,
    created_at: null,
  }
}

function workoutExercise(id: string, item: Exercise): WorkoutExerciseWithExercise {
  return {
    id,
    workout_id: 'workout-1',
    exercise_id: item.id,
    order_index: 0,
    target_sets: 3,
    target_reps_min: 8,
    target_reps_max: 12,
    rest_seconds: 90,
    rest_seconds_source: 'source',
    rir_min: 2,
    rir_max: 2,
    superset_group: null,
    notes: null,
    user_note: null,
    is_hidden: false,
    created_at: null,
    top_set_enabled: false,
    backoff_percentage: null,
    technique_notes: ['Movimento controlado.'],
    load_guidance: null,
    progression_type: 'double_progression',
    failure_allowed: false,
    failure_risk_level: 'moderate',
    default_set_role: 'standard',
    prescription_type: 'rep_range',
    fixed_reps: null,
    rep_max_target: null,
    prescription_locked: false,
    is_priority: false,
    aesthetic_function: null,
    percentage_of_e1rm: null,
    load_strategy: null,
    source_prescription: null,
    guided_prescription: null,
    guided_reps_fixed: null,
    exercise: item,
    substitutions: [],
  }
}

const machine = getLoadInputConfig(exercise('machine', 'Remada máquina'))

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
  useSessionStore.getState().resetSession()
  router.push.mockReset()
  router.refresh.mockReset()
  Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: true })
})

afterEach(() => cleanup())

describe('Componentes do modo de treino ativo', () => {
  it('renderiza o exercício atual, histórico anterior e primeira série', () => {
    const item = workoutExercise('we-1', exercise('ex-1', 'Barra fixa assistida', 'máquina assistida'))
    useSessionStore.getState().startSession('session-1', 'workout-1')
    render(
      <CurrentExercisePanel
        sessionId="session-1"
        workoutExercise={item}
        exerciseNumber={1}
        totalExercises={6}
        previousSets={[{
          set_number: 1,
          weight_kg: 30,
          reps: 10,
          rir: 2,
          is_warmup: false,
          pain_level: 'nenhuma',
          execution_quality: 'boa',
          completed_at: '2026-07-01T12:00:00.000Z',
        }]}
        bestWeight={25}
        progression={null}
        history={[]}
        showWarmupPlan
        canMoveEarlier={false}
        canMoveLater
        onMoveEarlier={vi.fn()}
        onMoveLater={vi.fn()}
        onSkip={vi.fn()}
        onNextExercise={vi.fn()}
        hasNextExercise
      />
    )
    expect(screen.getByRole('heading', { name: 'Barra fixa assistida' })).toBeTruthy()
    expect(screen.getByText(/Última vez:/)).toBeTruthy()
    expect(screen.getByText('Assistência')).toBeTruthy()
    expect(screen.getByLabelText('Concluir série 1')).toBeTruthy()
  })

  it('destaca série atual e permite abrir o RIR picker ao concluir', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue('saved')
    render(
      <SetRow
        setNumber={1}
        loadConfig={machine}
        defaultWeight={30}
        defaultReps={10}
        previousSet={{ weight_kg: 30, reps: 10, rir: 2 }}
        targetRirMin={2}
        targetRirMax={2}
        completed={null}
        isCurrent
        onSave={onSave}
      />
    )
    expect(screen.getByText('Série atual')).toBeTruthy()
    await user.click(screen.getByLabelText('Concluir série 1'))
    expect(await screen.findByText('Como terminou esta série?')).toBeTruthy()
    await user.click(screen.getByLabelText(/RIR 2: Sobrariam 2, dentro da meta/))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith({ weight: 30, reps: 10, rir: 2 }))
  })

  it('executa o fluxo série → RIR → descanso → +15 s → edição', async () => {
    const user = userEvent.setup()
    const item = workoutExercise('we-1', exercise('ex-1', 'Puxada alta'))
    useSessionStore.getState().startSession('session-1', 'workout-1')
    render(
      <>
        <CurrentExercisePanel
          sessionId="session-1"
          workoutExercise={item}
          exerciseNumber={1}
          totalExercises={1}
          previousSets={[]}
          bestWeight={null}
          progression={null}
          history={[]}
          showWarmupPlan={false}
          canMoveEarlier={false}
          canMoveLater={false}
          onMoveEarlier={vi.fn()}
          onMoveLater={vi.fn()}
          onSkip={vi.fn()}
          onNextExercise={vi.fn()}
          hasNextExercise={false}
        />
        <RestTimerDock
          exercises={[item]}
          currentExerciseId="we-1"
          onPrevExercise={vi.fn()}
          onNextExercise={vi.fn()}
          canGoPrev={false}
          canGoNext={false}
        />
      </>
    )

    await user.type(screen.getByLabelText('Peso da máquina da série 1'), '30')
    await user.click(screen.getByLabelText('Concluir série 1'))
    await user.click(await screen.findByLabelText(/RIR 2: Sobrariam 2, dentro da meta/))
    await waitFor(() => expect(useSessionStore.getState().sets['we-1']).toHaveLength(1))
    expect(timerIsActive(useSessionStore.getState().restTimer)).toBe(true)

    const before = timerRemaining(useSessionStore.getState().restTimer)
    await user.click(screen.getByLabelText('Adicionar 15 segundos'))
    expect(timerRemaining(useSessionStore.getState().restTimer)).toBeGreaterThanOrEqual(before + 14)

    await user.click(screen.getByRole('button', { name: 'Pular descanso' }))
    expect(timerIsActive(useSessionStore.getState().restTimer)).toBe(false)
    expect(screen.getByText('Série 2 de 3 pronta')).toBeTruthy()

    await user.click(screen.getByLabelText('Editar série 1'))
    const weight = screen.getByLabelText('Peso da máquina da série 1')
    await user.clear(weight)
    await user.type(weight, '32')
    await user.click(screen.getByLabelText('Salvar edição da série 1'))
    await waitFor(() => expect(useSessionStore.getState().sets['we-1'][0].weight_kg).toBe(32))
  })

  it('mantém série concluída claramente confirmada e editável', () => {
    const completed: LocalSetLog = {
      id: 'set-1',
      set_number: 1,
      weight_kg: 30,
      reps: 10,
      rir: 2,
      is_warmup: false,
      completed_at: '2026-07-14T12:00:00.000Z',
    }
    render(
      <SetRow
        setNumber={1}
        loadConfig={machine}
        defaultWeight={null}
        defaultReps={null}
        completed={completed}
        onSave={vi.fn().mockResolvedValue('saved')}
      />
    )
    expect(screen.getByLabelText('Editar série 1')).toBeTruthy()
    expect(screen.getByLabelText('Editar RIR da série 1')).toBeTruthy()
  })

  it('aquecimento inicia recolhido e pode ser expandido', async () => {
    const user = userEvent.setup()
    render(
      <WarmupSetList
        workingWeightKg={60}
        loadConfig={machine}
        completedSets={[]}
        enabled
        onSave={vi.fn().mockResolvedValue('saved')}
        onRemove={vi.fn()}
      />
    )
    const toggle = screen.getByRole('button', { name: /Aquecimento sugerido/ })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    await user.click(toggle)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('button', { name: /Adicionar aquecimento/ })).toBeTruthy()
  })

  it('navegador troca diretamente para outro exercício', async () => {
    const user = userEvent.setup()
    const onGo = vi.fn()
    const exercises = [
      workoutExercise('we-1', exercise('ex-1', 'Puxada alta')),
      workoutExercise('we-2', exercise('ex-2', 'Remada máquina')),
    ]
    render(
      <ExerciseNavigator
        exercises={exercises}
        currentIndex={0}
        completedSets={0}
        totalSets={6}
        sets={{}}
        feedback={{}}
        skippedExerciseIds={[]}
        onGo={onGo}
      />
    )
    await user.click(screen.getByRole('button', { name: /Exercício 1 de 2/ }))
    await user.click(await screen.findByRole('button', { name: /2\. Remada máquina/ }))
    expect(onGo).toHaveBeenCalledWith(1)
  })

  it('permite avançar e voltar entre exercícios pelo pill de navegação inferior', async () => {
    // As setas anterior/próximo migraram do ExerciseNavigator (topo) para o
    // RestTimerDock (rodapé), unificadas no mesmo pill flutuante do mockup.
    const user = userEvent.setup()
    const exercises = [
      workoutExercise('we-1', exercise('ex-1', 'Puxada alta')),
      workoutExercise('we-2', exercise('ex-2', 'Remada máquina')),
    ]

    function NavigatorHarness() {
      const [index, setIndex] = useState(0)
      return (
        <RestTimerDock
          exercises={exercises}
          currentExerciseId={exercises[index].id}
          onPrevExercise={() => setIndex((i) => Math.max(0, i - 1))}
          onNextExercise={() => setIndex((i) => Math.min(exercises.length - 1, i + 1))}
          canGoPrev={index > 0}
          canGoNext={index < exercises.length - 1}
        />
      )
    }

    render(<NavigatorHarness />)
    expect(screen.getByText('Puxada alta')).toBeTruthy()
    await user.click(screen.getByLabelText('Próximo exercício'))
    expect(screen.getByText('Remada máquina')).toBeTruthy()
    await user.click(screen.getByLabelText('Exercício anterior'))
    expect(screen.getByText('Puxada alta')).toBeTruthy()
  })

  it('encerra o descanso por timestamp e deixa a próxima série pronta', async () => {
    vi.useFakeTimers()
    const item = workoutExercise('we-1', exercise('ex-1', 'Puxada alta'))
    useSessionStore.getState().startSession('session-1', 'workout-1')
    useSessionStore.getState().upsertSet('we-1', {
      id: 'set-1',
      set_number: 1,
      weight_kg: 30,
      reps: 10,
      rir: 2,
      is_warmup: false,
      completed_at: new Date().toISOString(),
    })
    useSessionStore.getState().startRestTimer(1, 'we-1')

    render(
      <RestTimerDock
        exercises={[item]}
        currentExerciseId="we-1"
        onPrevExercise={vi.fn()}
        onNextExercise={vi.fn()}
        canGoPrev={false}
        canGoNext={false}
      />
    )
    await act(async () => vi.advanceTimersByTime(1_500))

    expect(timerIsActive(useSessionStore.getState().restTimer)).toBe(false)
    expect(screen.getByText('Série 2 de 3 pronta')).toBeTruthy()
    vi.useRealTimers()
  })

  it('mostra estado offline persistente', async () => {
    Object.defineProperty(window.navigator, 'onLine', { configurable: true, value: false })
    render(<WorkoutSaveStatus />)
    expect(await screen.findByText('Offline — será sincronizado')).toBeTruthy()
  })

  it('abre resumo de finalização com pendências e aquecimentos', async () => {
    const item = workoutExercise('we-1', exercise('ex-1', 'Puxada alta'))
    useSessionStore.getState().startSession('session-1', 'workout-1', '2026-07-14T12:00:00.000Z')
    useSessionStore.getState().upsertSet('we-1', {
      id: 'warmup-1',
      set_number: 1,
      weight_kg: 20,
      reps: 10,
      rir: null,
      is_warmup: true,
      completed_at: '2026-07-14T12:01:00.000Z',
    })
    render(
      <FinishWorkoutSheet
        open
        onOpenChange={vi.fn()}
        sessionId="session-1"
        startedAt="2026-07-14T12:00:00.000Z"
        workoutExercises={[item]}
        bestWeights={[30]}
      />
    )
    expect(await screen.findByText('Resumo do treino')).toBeTruthy()
    expect(screen.getByText(/Existem 3 séries não concluídas/)).toBeTruthy()
    expect(screen.getByText('Aquecimentos')).toBeTruthy()
  })

  it('finaliza mesmo com pendências, limpa apenas a sessão e abre o histórico', async () => {
    const user = userEvent.setup()
    const item = workoutExercise('we-1', exercise('ex-1', 'Puxada alta'))
    useSessionStore.getState().startSession('session-1', 'workout-1', '2026-07-14T12:00:00.000Z')

    render(
      <FinishWorkoutSheet
        open
        onOpenChange={vi.fn()}
        sessionId="session-1"
        startedAt="2026-07-14T12:00:00.000Z"
        workoutExercises={[item]}
        bestWeights={[30]}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Finalizar mesmo assim' }))
    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/historico/session-1'))
    expect(useSessionStore.getState().sessionId).toBeNull()
  })
})
