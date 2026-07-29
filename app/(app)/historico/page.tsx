import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronRight, Dumbbell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getSessionsHistory } from '@/lib/queries/sessions'
import { formatDurationLong } from '@/lib/utils/time'

const PAGE_SIZE = 20

export default async function HistoricoPage(props: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await props.searchParams
  const page = Math.max(0, parseInt(pageParam ?? '0', 10) || 0)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Busca uma sessão a mais para saber se existe próxima página
  const sessions = await getSessionsHistory(supabase, user.id, (page + 1) * PAGE_SIZE + 1)
  const paginated = sessions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const hasMore = sessions.length > (page + 1) * PAGE_SIZE

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-24">
      <h1 className="text-2xl font-bold mb-4">Histórico</h1>

      {sessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
          <Dumbbell className="w-12 h-12 text-muted-foreground" />
          <p className="font-semibold text-muted-foreground">Nenhum treino ainda</p>
          <p className="text-sm text-muted-foreground">
            Comece um treino no dashboard para ver seu histórico aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginated.map((session) => {
            const workout = session.workout as { name: string; letter: string } | null
            return (
              <Link
                key={session.id}
                href={`/historico/${session.id}`}
                className="flex items-center gap-3 rounded-xl bg-card border border-border p-4 hover:bg-card/80 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                  <span className="text-sm font-bold text-primary">
                    {workout?.letter ?? '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">
                    {workout?.name ?? 'Treino'}
                    {session.cancelled_at != null && (
                      <span className="ml-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                        Cancelado
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(session.started_at), "d 'de' MMM, HH'h'mm", {
                      locale: ptBR,
                    })}
                    {session.duration_seconds != null &&
                      ` · ${formatDurationLong(session.duration_seconds)}`}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </Link>
            )
          })}

          {/* Navegação entre páginas */}
          <div className="flex items-center justify-between pt-2">
            {page > 0 ? (
              <Link
                href={`/historico?page=${page - 1}`}
                className="text-sm text-primary font-medium px-4 py-2 rounded-lg border border-primary/20 bg-primary/5"
              >
                ← Mais recentes
              </Link>
            ) : (
              <span />
            )}
            {hasMore && (
              <Link
                href={`/historico?page=${page + 1}`}
                className="text-sm text-primary font-medium px-4 py-2 rounded-lg border border-primary/20 bg-primary/5"
              >
                Mais antigos →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
