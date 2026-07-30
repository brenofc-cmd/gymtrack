'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

type GoalKey = 'calories_kcal' | 'protein_g' | 'carbs_g' | 'fat_g' | 'fiber_g' | 'water_ml'
const fields: Array<[GoalKey, string, string]> = [['calories_kcal', 'Calorias', 'kcal'], ['protein_g', 'Proteína', 'g'], ['carbs_g', 'Carboidratos', 'g'], ['fat_g', 'Gorduras', 'g'], ['fiber_g', 'Fibras', 'g'], ['water_ml', 'Água', 'ml']]

export function NutritionGoalsForm({ userId, goal }: { userId: string; goal: Tables<'nutrition_goals'> | null }) {
  const [values, setValues] = useState<Record<GoalKey, string>>(() => Object.fromEntries(fields.map(([key]) => [key, goal?.[key]?.toString() ?? ''])) as Record<GoalKey, string>)
  const [saving, setSaving] = useState(false)
  async function save() {
    const parsed = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value === '' ? null : Number(value)]))
    if (Object.values(parsed).some((value) => value !== null && (!Number.isFinite(value) || value < 0))) return toast.error('Use somente valores iguais ou maiores que zero.')
    setSaving(true)
    const { error } = await createClient().from('nutrition_goals').upsert({ ...(goal ? { id: goal.id } : {}), user_id: userId, is_auto: false, ...parsed }, { onConflict: 'user_id' })
    setSaving(false)
    if (error) toast.error('Não foi possível salvar as metas.')
    else toast.success('Metas atualizadas.')
  }
  return <section className="surface-card mt-3 p-4"><h2 className="text-sm font-bold">Metas diárias</h2><div className="mt-3 grid grid-cols-2 gap-2">{fields.map(([key, label, unit]) => <label key={key} className="text-xs font-medium">{label}<div className="mt-1 flex items-center rounded-lg border border-input bg-secondary"><input aria-label={label} value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} min="0" inputMode="decimal" type="number" className="h-10 min-w-0 flex-1 bg-transparent px-2 outline-none"/><span className="pr-2 text-muted-foreground">{unit}</span></div></label>)}</div><button type="button" onClick={save} disabled={saving} className="mt-3 h-10 w-full rounded-lg bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">{saving ? 'Salvando…' : 'Salvar metas'}</button></section>
}
