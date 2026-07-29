import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sem conexão — GymTrack',
}

/**
 * Fallback do service worker quando não há rede nem cache para a rota
 * pedida. Sessões já abertas continuam funcionando: a fila offline guarda as
 * séries e sincroniza quando a conexão voltar.
 */
export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col items-center justify-center gap-4 px-6 py-10 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        <WifiOff className="size-6" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-xl font-extrabold tracking-tight">Você está offline</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sem conexão no momento. Se você estava com uma sessão aberta, os
          registros ficam guardados no aparelho e sincronizam sozinhos quando a
          internet voltar.
        </p>
      </div>
      <div className="flex w-full flex-col gap-2">
        <Link
          href="/"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground"
        >
          Tentar de novo
        </Link>
        <Link
          href="/treinos"
          className="flex h-12 w-full items-center justify-center rounded-xl border border-border text-sm font-semibold text-muted-foreground"
        >
          Ver treinos (cache)
        </Link>
      </div>
    </div>
  )
}
