'use client'

import { useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

interface PreferencesFormProps {
  userId: string
  initial: Tables<'user_preferences'> | null
}

export function PreferencesForm({ userId, initial }: PreferencesFormProps) {
  const [saving, setSaving] = useState(false)
  const [sound, setSound] = useState(initial?.rest_timer_sound ?? true)
  const [vibrate, setVibrate] = useState(initial?.rest_timer_vibrate ?? true)
  const [notifications, setNotifications] = useState(initial?.notifications_enabled ?? true)
  const [keepAwake, setKeepAwake] = useState(initial?.keep_screen_awake ?? true)
  const [weightUnit, setWeightUnit] = useState(initial?.weight_unit ?? 'kg')
  const [water, setWater] = useState(String(initial?.water_goal_ml ?? 3000))
  const [sleep, setSleep] = useState(String(initial?.sleep_goal_minutes ?? 480))

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.from('user_preferences').upsert({
      id: userId,
      rest_timer_sound: sound,
      rest_timer_vibrate: vibrate,
      notifications_enabled: notifications,
      keep_screen_awake: keepAwake,
      weight_unit: weightUnit,
      water_goal_ml: Number(water) || 3000,
      sleep_goal_minutes: Number(sleep) || 480,
      onboarding_done: initial?.onboarding_done ?? true,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) toast.error('Erro ao salvar as configurações.')
    else toast.success('Configurações atualizadas.')
  }

  return (
    <div className="space-y-3">
      <section className="surface-card divide-y divide-sidebar-border px-4">
        <PreferenceSwitch label="Som do cronômetro" description="Aviso ao terminar o descanso" checked={sound} onChange={setSound} />
        <PreferenceSwitch label="Vibração" description="Feedback tátil no celular" checked={vibrate} onChange={setVibrate} />
        <PreferenceSwitch label="Notificação ao terminar descanso" description="Aviso do sistema quando o cronômetro zerar" checked={notifications} onChange={setNotifications} />
        <PreferenceSwitch label="Manter tela ligada" description="Durante as sessões de treino e abdômen (quando o aparelho suportar)" checked={keepAwake} onChange={setKeepAwake} />
      </section>

      <section className="surface-card space-y-4 p-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold">Unidade de peso</span>
          <select value={weightUnit} onChange={(event) => setWeightUnit(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-secondary px-3 text-sm outline-none focus:border-primary">
            <option value="kg">Quilogramas (kg)</option>
            <option value="lb">Libras (lb)</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="space-y-1.5">
            <span className="text-xs font-semibold">Meta de água (ml)</span>
            <input type="number" value={water} onChange={(event) => setWater(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-secondary px-3 font-mono text-sm outline-none focus:border-primary" />
          </label>
          <label className="space-y-1.5">
            <span className="text-xs font-semibold">Meta de sono (min)</span>
            <input type="number" value={sleep} onChange={(event) => setSleep(event.target.value)} className="h-11 w-full rounded-xl border border-input bg-secondary px-3 font-mono text-sm outline-none focus:border-primary" />
          </label>
        </div>
      </section>

      <button type="button" onClick={save} disabled={saving} className="flex h-12 w-full items-center justify-center gap-2 rounded-[13px] bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Salvar configurações
      </button>
    </div>
  )
}

function PreferenceSwitch({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 py-4">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-0.5 block text-[11px] text-muted-foreground">{description}</span>
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span className="relative h-7 w-12 rounded-full bg-secondary transition-colors peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-foreground after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-primary-foreground" />
    </label>
  )
}
