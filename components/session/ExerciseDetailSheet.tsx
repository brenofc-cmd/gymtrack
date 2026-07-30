'use client'

import { useState } from 'react'
import { AlertTriangle, BookOpen, History, Video } from 'lucide-react'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { ProgressChart } from '@/components/exercise/ProgressChart'
import { ExerciseAnimation } from '@/components/exercise/ExerciseAnimation'
import { cn } from '@/lib/utils'
import type { Exercise } from '@/types/database'

interface HistoryPoint {
  date: string
  maxWeight: number
  totalVolume: number
  maxReps: number
}

interface ExerciseDetailSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  exercise: Exercise
  guidance: string[]
  history: HistoryPoint[]
}

const TABS = [
  { key: 'execution', label: 'Execução', icon: BookOpen },
  { key: 'errors', label: 'Erros', icon: AlertTriangle },
  { key: 'history', label: 'Histórico', icon: History },
  { key: 'video', label: 'Vídeo', icon: Video },
] as const

type Tab = (typeof TABS)[number]['key']

export function ExerciseDetailSheet({ open, onOpenChange, exercise, guidance, history }: ExerciseDetailSheetProps) {
  const [tab, setTab] = useState<Tab>('execution')
  const errors = guidance.filter((item) => /não|evitar|sem |interromper/i.test(item))
  const commonErrors = errors.length > 0
    ? errors
    : [
        'Usar uma carga que reduz a amplitude ou muda o padrão do movimento.',
        'Acelerar a fase de descida e perder o controle da repetição.',
        'Compensar com balanço do tronco quando a série se aproxima da falha.',
      ]

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={exercise.name_pt} description={`${exercise.muscle_group} · ${exercise.equipment ?? 'equipamento livre'}`}>
      <div className="grid grid-cols-4 gap-1 rounded-xl bg-secondary p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setTab(key)} className={cn('flex h-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-semibold transition-colors', tab === key ? 'bg-card text-primary' : 'text-muted-foreground')}>
            <Icon className="size-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'execution' && (
        <div className="mt-4 space-y-4">
          <div className="relative aspect-video overflow-hidden rounded-2xl border border-border bg-background">
            <ExerciseAnimation
              name={exercise.name_pt}
              primaryMuscle={exercise.muscle_group}
              movementPattern={exercise.movement_pattern}
            />
          </div>
          <ol className="space-y-2.5">
            {(guidance.length > 0 ? guidance : exercise.instructions ?? []).map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-3 text-sm leading-relaxed text-[#c7d0db]">
                <span className="grid size-6 shrink-0 place-items-center rounded-full border border-primary/25 bg-primary/10 text-[11px] font-bold text-primary">{index + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {tab === 'errors' && (
        <div className="mt-4 space-y-2">
          {commonErrors.map((error, index) => (
            <div key={`${error}-${index}`} className="flex gap-3 rounded-xl border border-[#ffb547]/20 bg-[#ffb547]/5 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-[#ffb547]" />
              <p className="text-sm leading-relaxed text-[#c7d0db]">{error}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="mt-4">
          {history.length > 0 ? (
            <ProgressChart data={history} />
          ) : (
            <div className="rounded-2xl border border-dashed border-input px-5 py-10 text-center">
              <History className="mx-auto size-7 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">Sem histórico concluído</p>
              <p className="mt-1 text-xs text-muted-foreground">As séries deste exercício aparecerão aqui após o treino.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'video' && (
        <div className="mt-4">
          <div className="aspect-video overflow-hidden rounded-2xl border border-border bg-background">
            <ExerciseAnimation
              name={exercise.name_pt}
              primaryMuscle={exercise.muscle_group}
              movementPattern={exercise.movement_pattern}
            />
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Animação anatômica: o músculo principal aparece em vermelho.
          </p>
        </div>
      )}
    </BottomSheet>
  )
}
