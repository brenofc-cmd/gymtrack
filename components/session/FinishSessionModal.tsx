'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useSessionStore } from '@/lib/store/sessionStore'
import { calcVolume, formatVolume } from '@/lib/utils/volume'
import { formatDurationLong } from '@/lib/utils/time'
import type { WorkoutExerciseWithExercise } from '@/types/database'

interface FinishSessionModalProps {
  open: boolean
  onClose: () => void
  sessionId: string
  startedAt: string
  workoutExercises: WorkoutExerciseWithExercise[]
}

export function FinishSessionModal({
  open,
  onClose,
  sessionId,
  startedAt,
  workoutExercises,
}: FinishSessionModalProps) {
  const router = useRouter()
  const { sets, resetSession } = useSessionStore()
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [notes, setNotes] = useState('')

  const allSets = Object.values(sets).flat()
  const totalSets = allSets.length
  const totalVolume = calcVolume(allSets)
  const durationSeconds = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 1000
  )
  const completedExercises = workoutExercises.filter(
    (we) => (sets[we.id]?.length ?? 0) > 0
  ).length

  async function handleCancel() {
    setCancelling(true)
    const supabase = createClient()
    await supabase.from('workout_sessions').delete().eq('id', sessionId)
    resetSession()
    router.push('/')
    router.refresh()
  }

  async function handleFinish() {
    setLoading(true)
    const supabase = createClient()

    // Séries já foram salvas automaticamente durante a sessão.
    // Apenas registrar o fim da sessão.
    const { error: sessionError } = await supabase
      .from('workout_sessions')
      .update({
        finished_at: new Date().toISOString(),
        duration_seconds: durationSeconds,
        notes: notes.trim() || null,
      })
      .eq('id', sessionId)

    if (sessionError) {
      toast.error('Erro ao finalizar sessão.')
      setLoading(false)
      return
    }

    resetSession()
    toast.success('Treino finalizado! 💪', {
      description: `${totalSets} séries · ${formatVolume(totalVolume)} de volume`,
    })
    router.push('/')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm mx-4">
        <DialogHeader>
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mx-auto mb-2">
            <Trophy className="w-7 h-7 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Finalizar treino?
          </DialogTitle>
          <DialogDescription className="text-center">
            Resumo da sessão
          </DialogDescription>
        </DialogHeader>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 my-2">
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="text-2xl font-black">{completedExercises}</p>
            <p className="text-xs text-muted-foreground mt-0.5">exercícios</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="text-2xl font-black">{totalSets}</p>
            <p className="text-xs text-muted-foreground mt-0.5">séries</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="text-2xl font-black">{formatVolume(totalVolume)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">volume total</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3 text-center">
            <p className="text-2xl font-black">
              {formatDurationLong(durationSeconds)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">duração</p>
          </div>
        </div>

        {/* Nota da sessão */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotação sobre o treino (opcional)..."
          rows={2}
          maxLength={500}
          disabled={loading || cancelling}
          className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none disabled:opacity-50"
        />

        {notes.length > 0 && (
          <div className="flex justify-end -mt-2">
            <span
              className={cn(
                'text-xs tabular-nums',
                notes.length >= 450
                  ? notes.length >= 500
                    ? 'text-destructive font-medium'
                    : 'text-amber-500'
                  : 'text-muted-foreground'
              )}
            >
              {notes.length}/500
            </span>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={loading || cancelling}
          >
            Continuar
          </Button>
          <Button
            onClick={handleFinish}
            className="flex-1 font-semibold"
            disabled={loading || cancelling}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Salvar'
            )}
          </Button>
        </div>

        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={loading || cancelling}
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
        >
          {cancelling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Cancelar treino
        </Button>
      </DialogContent>
    </Dialog>
  )
}
