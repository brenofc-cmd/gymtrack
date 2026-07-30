'use client'

import { SkipForward } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

type SkipWorkoutButtonProps = {
  userId: string
  workoutId: string
  workoutLetter: string
}

export function SkipWorkoutButton({ userId, workoutId, workoutLetter }: SkipWorkoutButtonProps) {
  const router = useRouter()

  async function skipWorkout() {
    if (!window.confirm(`Pular o treino ${workoutLetter}? O próximo treino da sequência será mostrado. Isso não apaga nenhum histórico.`)) return

    const { error } = await createClient().from('training_sequence_events').insert({
      user_id: userId,
      workout_id: workoutId,
      event_type: 'skipped',
    })

    if (error) {
      toast.error('Não foi possível registrar o pulo do treino.')
      return
    }

    toast.success(`Treino ${workoutLetter} pulado. A sequência foi atualizada.`)
    router.refresh()
  }

  return (
    <button
      type="button"
      onClick={() => void skipWorkout()}
      className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary"
    >
      <SkipForward className="size-4" />
      Pular treino {workoutLetter}
    </button>
  )
}
