import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Plus, Utensils } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

function todayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export default async function AlimentacaoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [goalResult, mealsResult] = await Promise.all([
    supabase
      .from('nutrition_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('meals')
      .select('*, meal_entries(*)')
      .eq('user_id', user.id)
      .eq('meal_date', todayISO())
      .order('eaten_at'),
  ])
  const goal = goalResult.data
  const meals = mealsResult.data ?? []
  const totals = meals.flatMap((meal) => meal.meal_entries).reduce(
    (sum, entry) => ({
      kcal: sum.kcal + (entry.kcal ?? 0),
      protein: sum.protein + (entry.protein_g ?? 0),
      carbs: sum.carbs + (entry.carbs_g ?? 0),
      fat: sum.fat + (entry.fat_g ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  )

  const metrics = [
    { label: 'Calorias', value: totals.kcal, goal: goal?.calories_kcal, unit: 'kcal' },
    { label: 'Proteína', value: totals.protein, goal: goal?.protein_g, unit: 'g' },
    { label: 'Carboidratos', value: totals.carbs, goal: goal?.carbs_g, unit: 'g' },
    { label: 'Gorduras', value: totals.fat, goal: goal?.fat_g, unit: 'g' },
  ]

  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">Alimentação</h1>
          <p className="mt-1 text-xs text-muted-foreground">Metas e refeições de hoje</p>
        </div>
        <Link href="/acompanhamento" className="rounded-full border border-[#5ba8ff]/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5ba8ff]">
          Ajustar metas
        </Link>
      </header>

      <section className="surface-card p-4">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => {
            const percentage = metric.goal ? Math.min(100, Math.round((metric.value / metric.goal) * 100)) : 0
            return (
              <div key={metric.label}>
                <div className="flex items-baseline justify-between gap-2">
                  <p className="metric-label">{metric.label}</p>
                  <p className="font-mono text-xs font-semibold">
                    {Math.round(metric.value)} <span className="text-[10px] font-normal text-muted-foreground">/ {metric.goal ?? '—'} {metric.unit}</span>
                  </p>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="surface-card mt-3 overflow-hidden px-4">
        {meals.length === 0 ? (
          <div className="py-10 text-center">
            <Utensils className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Nenhuma refeição registrada hoje</p>
            <p className="mt-1 text-xs text-muted-foreground">O estado vazio faz parte do novo fluxo e não esconde a falta de dados.</p>
          </div>
        ) : (
          meals.map((meal) => {
            const totalKcal = meal.meal_entries.reduce((sum, entry) => sum + (entry.kcal ?? 0), 0)
            const totalProtein = meal.meal_entries.reduce((sum, entry) => sum + (entry.protein_g ?? 0), 0)
            return (
              <div key={meal.id} className="flex items-center gap-3 border-b border-sidebar-border py-3 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold">{meal.name ?? meal.meal_type ?? 'Refeição'}</p>
                  <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                    {meal.meal_entries.map((entry) => entry.custom_name).filter(Boolean).join(', ') || 'Itens registrados'}
                  </p>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                  {Math.round(totalKcal)} kcal · <span className="text-primary">{Math.round(totalProtein)} g</span>
                </p>
              </div>
            )
          })
        )}
      </section>

      <Link href="/acompanhamento" className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-primary text-sm font-bold text-primary-foreground">
        <Plus className="size-4" />
        Registrar alimentação e metas
      </Link>
    </div>
  )
}
