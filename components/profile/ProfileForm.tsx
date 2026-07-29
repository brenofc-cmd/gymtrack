'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { upsertUserProfile } from '@/lib/queries/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  userId: string
  initialGoal: string | null
  initialHeightCm: number | null
  initialWeightKg: number | null
  initialWeeklyGoal: number
}

export function ProfileForm({
  userId,
  initialGoal,
  initialHeightCm,
  initialWeightKg,
  initialWeeklyGoal,
}: ProfileFormProps) {
  const [goal, setGoal] = useState(initialGoal ?? 'hipertrofia')
  const [heightCm, setHeightCm] = useState(initialHeightCm?.toString() ?? '')
  const [weightKg, setWeightKg] = useState(initialWeightKg?.toString() ?? '')
  const [weeklyGoal, setWeeklyGoal] = useState(initialWeeklyGoal.toString())
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const h = heightCm ? parseFloat(heightCm) : null
      const w = weightKg ? parseFloat(weightKg) : null
      const g = Math.min(7, Math.max(1, parseInt(weeklyGoal, 10) || 3))

      await upsertUserProfile(supabase, userId, {
        goal,
        height_cm: h && h > 0 ? h : null,
        weight_kg: w && w > 0 ? w : null,
        weekly_goal: g,
      })

      toast.success('Perfil atualizado!')
    } catch {
      toast.error('Não foi possível salvar o perfil. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Dados pessoais</h2>
        <p className="mt-1 text-xs text-muted-foreground">Usados somente para personalizar suas metas e evolução.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal" className="text-xs text-muted-foreground">
          Objetivo principal
        </Label>
        <select
          id="goal"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-secondary px-3 text-sm outline-none focus:border-primary"
        >
          <option value="hipertrofia">Ganhar massa</option>
          <option value="recomposicao">Recomposição corporal</option>
          <option value="saude">Saúde e rotina</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label htmlFor="weight" className="text-xs text-muted-foreground">Peso (kg)</Label>
          <Input id="weight" type="number" inputMode="decimal" placeholder="80,5" value={weightKg} onChange={(event) => setWeightKg(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="height" className="text-xs text-muted-foreground">Altura (cm)</Label>
          <Input id="height" type="number" inputMode="decimal" placeholder="175" value={heightCm} onChange={(event) => setHeightCm(event.target.value)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="goal" className="text-xs text-muted-foreground">
          Meta semanal de treinos
        </Label>
        <div className="flex gap-2">
          {[2, 3, 4, 5, 6].map((n) => {
            const selected = parseInt(weeklyGoal, 10) === n
            return (
              <button
                key={n}
                onClick={() => setWeeklyGoal(n.toString())}
                className={`flex-1 h-10 rounded-lg border text-sm font-semibold transition-colors ${
                  selected
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                }`}
              >
                {n}×
              </button>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">treinos por semana</p>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salvar
      </Button>
    </div>
  )
}
