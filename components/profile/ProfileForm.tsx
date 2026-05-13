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
  initialWeightKg: number | null
  initialWeeklyGoal: number
}

export function ProfileForm({ userId, initialWeightKg, initialWeeklyGoal }: ProfileFormProps) {
  const [weightKg, setWeightKg] = useState(initialWeightKg?.toString() ?? '')
  const [weeklyGoal, setWeeklyGoal] = useState(initialWeeklyGoal.toString())
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()
    const w = weightKg ? parseFloat(weightKg) : null
    const g = Math.min(7, Math.max(1, parseInt(weeklyGoal, 10) || 3))

    await upsertUserProfile(supabase, userId, {
      weight_kg: w && w > 0 ? w : null,
      weekly_goal: g,
    })

    toast.success('Perfil atualizado!')
    setSaving(false)
  }

  return (
    <div className="rounded-2xl bg-card border border-border p-4 space-y-4">
      <h2 className="text-sm font-semibold">Configurações</h2>

      <div className="space-y-1.5">
        <Label htmlFor="weight" className="text-xs text-muted-foreground">
          Peso corporal (kg)
        </Label>
        <div className="relative">
          <Input
            id="weight"
            type="number"
            inputMode="decimal"
            placeholder="ex: 80.5"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            className="pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
            kg
          </span>
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
