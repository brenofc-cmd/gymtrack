'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Play, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface StartWorkoutButtonProps {
  workoutId: string
  workoutLetter: string
}

export function StartWorkoutButton({
  workoutId,
  workoutLetter,
}: StartWorkoutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStart() {
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

    const { data: session, error } = await supabase
      .from('workout_sessions')
      .insert({ user_id: user.id, workout_id: workoutId })
      .select()
      .single()

    if (error || !session) {
      toast.error('Erro ao iniciar o treino.')
      setLoading(false)
      return
    }

    router.push(`/sessao/${session.id}`)
  }

  return (
    <div className="fixed bottom-16 left-0 right-0 p-4">
      <div className="max-w-lg mx-auto">
        <Button
          onClick={handleStart}
          disabled={loading}
          className="w-full h-14 text-lg font-bold gap-2"
          size="lg"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Play className="w-5 h-5" fill="currentColor" />
          )}
          Começar Treino {workoutLetter}
        </Button>
      </div>
    </div>
  )
}
