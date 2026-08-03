'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Repeat2 } from 'lucide-react'
import { toast } from 'sonner'
import { BottomSheet } from '@/components/ui/bottom-sheet'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Exercise, SubstitutionWithExercise, WorkoutExerciseWithExercise } from '@/types/database'

interface ExerciseSwapSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  workoutExercise: WorkoutExerciseWithExercise
  selectedVariation: string | null
  onSelectToday: (exerciseId: string | null) => void
}

export function ExerciseSwapSheet({ open, onOpenChange, workoutExercise, selectedVariation, onSelectToday }: ExerciseSwapSheetProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(selectedVariation ?? workoutExercise.exercise.id)
  const [saving, setSaving] = useState(false)
  const options: Array<{ relation: SubstitutionWithExercise | null; exercise: Exercise }> = [
    { relation: null, exercise: workoutExercise.exercise },
    ...(workoutExercise.substitutions ?? []).map((relation) => ({ relation, exercise: relation.exercise })),
  ]
  const selected = options.find((option) => option.exercise.id === selectedId) ?? options[0]

  function onlyToday() {
    onSelectToday(selected.exercise.id === workoutExercise.exercise.id ? null : selected.exercise.id)
    onOpenChange(false)
    toast.success('Troca aplicada somente neste treino.')
  }

  async function permanent() {
    if (selected.exercise.id === workoutExercise.exercise.id || !selected.relation) {
      onSelectToday(null)
      onOpenChange(false)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.rpc('swap_workout_exercise', {
      p_workout_exercise_id: workoutExercise.id,
      p_replacement_exercise_id: selected.exercise.id,
    })
    setSaving(false)
    if (error) {
      toast.error('Não foi possível alterar a ficha permanentemente.')
      return
    }
    toast.success('Exercício principal atualizado na ficha.')
    onSelectToday(null)
    onOpenChange(false)
    router.refresh()
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Trocar exercício" description={`Alternativas de ${workoutExercise.exercise.muscle_group} já validadas para esta ficha`}>
      <div className="space-y-2">
        {options.map(({ exercise }) => {
          const active = selected.exercise.id === exercise.id
          return (
            <button key={exercise.id} type="button" onClick={() => setSelectedId(exercise.id)} className={cn('flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left', active ? 'border-primary/45 bg-primary/5' : 'border-border bg-secondary/35')}>
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-full border', active ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-transparent')}><Check className="size-4" /></span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold">{exercise.name_pt}</span><span className="mt-0.5 block text-[11px] text-muted-foreground">{exercise.equipment ?? 'Equipamento não informado'} · {exercise.muscle_group}</span></span>
            </button>
          )
        })}
      </div>

      <div className="mt-5 space-y-2 border-t border-sidebar-border pt-4">
        <button type="button" onClick={onlyToday} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground"><Repeat2 className="size-4" />Só neste treino</button>
        <button type="button" onClick={permanent} disabled={saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-input text-sm font-semibold text-[var(--body-soft)] disabled:opacity-50">{saving && <Loader2 className="size-4 animate-spin" />}Tornar permanente na ficha</button>
        <p className="px-2 text-center text-[10.5px] leading-relaxed text-muted-foreground">A troca de hoje mantém a ficha original. A permanente passa a usar a alternativa nas próximas sessões.</p>
      </div>
    </BottomSheet>
  )
}
