import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Exercise } from '@/types/database'

export default async function ExerciciosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: exercises } = await createAdminClient()
    .from('exercises')
    .select('id, name_pt, muscle_group, equipment')
    .order('muscle_group')
    .order('name_pt')

  const groups = new Map<string, Pick<Exercise, 'id' | 'name_pt' | 'muscle_group' | 'equipment'>[]>()
  for (const ex of exercises ?? []) {
    if (!groups.has(ex.muscle_group)) groups.set(ex.muscle_group, [])
    groups.get(ex.muscle_group)!.push(ex)
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6 pb-4 space-y-4">
      <h1 className="text-2xl font-bold">Exercícios</h1>

      {Array.from(groups.entries()).map(([group, exs]) => (
        <div key={group}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize">
            {group}
          </h2>
          <div className="space-y-1.5">
            {exs.map((ex) => (
              <Link
                key={ex.id}
                href={`/exercicios/${ex.id}`}
                className="flex items-center justify-between rounded-xl bg-card border border-border px-4 py-3 text-sm hover:bg-card/80 active:scale-[0.98] transition-all"
              >
                <span className="font-medium">{ex.name_pt}</span>
                <span className="text-xs text-muted-foreground">{ex.equipment}</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
