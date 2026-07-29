'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="max-w-lg mx-auto px-4 pt-16 pb-24 flex flex-col items-center gap-4 text-center">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-destructive/10 border border-destructive/20">
        <AlertTriangle className="w-7 h-7 text-destructive" />
      </div>
      <div>
        <h2 className="text-lg font-bold">Algo deu errado</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Ocorreu um erro inesperado. Tente novamente.
        </p>
      </div>
      <Button onClick={reset} variant="outline">
        Tentar novamente
      </Button>
    </div>
  )
}
