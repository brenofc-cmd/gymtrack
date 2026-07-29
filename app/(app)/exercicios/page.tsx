import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getExerciseImage } from '@/lib/exercise-media'
import type { Exercise } from '@/types/database'

export default async function ExerciciosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name_pt, muscle_group, equipment, gif_url')
    .order('muscle_group')
    .order('name_pt')

  const groups = new Map<string, Pick<Exercise, 'id' | 'name_pt' | 'muscle_group' | 'equipment' | 'gif_url'>[]>()
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
                className="flex items-center gap-3 rounded-xl bg-card border border-border p-2.5 text-sm hover:bg-card/80 active:scale-[0.98] transition-all"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-zinc-900">
                  <Image
                    src={getExerciseImage(ex.gif_url)}
                    alt={`Demonstração de ${ex.name_pt}`}
                    fill
                    className="object-cover"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{ex.name_pt}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{ex.equipment}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
