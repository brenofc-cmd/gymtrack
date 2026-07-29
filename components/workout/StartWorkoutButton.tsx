'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Loader2, ArrowRight, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cancelSessionLogically, startOrResumeSession } from '@/lib/queries/sessions'

interface ActiveSessionInfo {
  id: string
  workoutId: string
  workoutName: string
  startedAt: string
}

interface StartWorkoutButtonProps {
  workoutId: string
  workoutLetter: string
  /** Sessão ativa do usuário (se houver), carregada pelo server component */
  activeSession: ActiveSessionInfo | null
}

/**
 * Único ponto de início de treino. Nunca cria segunda sessão ativa:
 * - sessão ativa deste treino → "Continuar treino";
 * - sessão ativa de OUTRO treino → diálogo explícito (continuar a existente
 *   ou cancelá-la logicamente e começar esta);
 * - corrida de inserção → o repositório reabre a sessão vencedora (23505).
 */
export function StartWorkoutButton({
  workoutId,
  workoutLetter,
  activeSession,
}: StartWorkoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [conflictOpen, setConflictOpen] = useState(false)

  const sameWorkoutActive = activeSession?.workoutId === workoutId

  async function startFresh() {
    setLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Você precisa estar logado.')
      setLoading(false)
      return
    }
    try {
      const result = await startOrResumeSession(supabase, user.id, workoutId)
      if (result.kind === 'resumed' && !result.sameWorkout) {
        // Outra aba criou uma sessão de outro treino nesse meio-tempo.
        toast.info('Você já tem um treino em andamento.')
        router.refresh()
        setLoading(false)
        return
      }
      router.push(`/sessao/${result.sessionId}`)
    } catch {
      toast.error('Erro ao iniciar o treino.')
      setLoading(false)
    }
  }

  async function handleClick() {
    if (!activeSession) {
      await startFresh()
      return
    }
    if (sameWorkoutActive) {
      router.push(`/sessao/${activeSession.id}`)
      return
    }
    setConflictOpen(true)
  }

  async function cancelActiveAndStart() {
    if (!activeSession) return
    setLoading(true)
    try {
      await cancelSessionLogically(
        createClient(),
        { id: activeSession.id, started_at: activeSession.startedAt },
        `Substituída pelo treino ${workoutLetter} a pedido do usuário`
      )
      setConflictOpen(false)
      await startFresh()
    } catch {
      toast.error('Não foi possível cancelar a sessão anterior.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 p-4">
      <div className="max-w-lg mx-auto space-y-2">
        {conflictOpen && activeSession && (
          <div
            role="alertdialog"
            aria-label="Treino em andamento"
            className="rounded-2xl border border-amber-500/30 bg-card p-4 shadow-xl"
          >
            <p className="text-sm font-semibold">
              Você já tem “{activeSession.workoutName}” em andamento.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Só existe uma sessão ativa por vez. As séries já registradas na
              sessão atual são preservadas mesmo se você cancelá-la.
            </p>
            <div className="mt-3 flex flex-col gap-2">
              <Button
                onClick={() => router.push(`/sessao/${activeSession.id}`)}
                className="h-12 w-full gap-2 font-bold"
              >
                <ArrowRight className="size-4" />
                Continuar sessão existente
              </Button>
              <Button
                onClick={cancelActiveAndStart}
                disabled={loading}
                variant="outline"
                className="h-12 w-full gap-2 border-amber-500/40 font-bold text-amber-500"
              >
                {loading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <XCircle className="size-4" />
                )}
                Cancelar e começar Treino {workoutLetter}
              </Button>
              <button
                type="button"
                onClick={() => setConflictOpen(false)}
                className="min-h-11 text-xs font-semibold text-muted-foreground"
              >
                Voltar
              </button>
            </div>
          </div>
        )}
        {!conflictOpen && (
          <Button
            onClick={handleClick}
            disabled={loading}
            className="w-full h-14 text-lg font-bold gap-2"
            size="lg"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Play className="w-5 h-5" fill="currentColor" />
            )}
            {sameWorkoutActive
              ? `Continuar Treino ${workoutLetter}`
              : activeSession
                ? 'Treino em andamento…'
                : `Começar Treino ${workoutLetter}`}
          </Button>
        )}
      </div>
    </div>
  )
}
