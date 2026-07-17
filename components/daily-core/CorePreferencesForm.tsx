'use client'

import { useState } from 'react'
import { Bell, Check, Loader2, Save, ShieldCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { DailyCorePreferenceRow, DailyCoreReminderRow } from '@/types/database'

interface CorePreferencesFormProps {
  userId: string
  initialPreferences: DailyCorePreferenceRow | null
  initialReminder: DailyCoreReminderRow | null
  onboarding?: boolean
}

export function CorePreferencesForm({
  userId,
  initialPreferences,
  initialReminder,
  onboarding = false,
}: CorePreferencesFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [hasWheel, setHasWheel] = useState(initialPreferences?.has_ab_wheel ?? false)
  const [hasBand, setHasBand] = useState(initialPreferences?.has_resistance_band ?? false)
  const [hasBackpack, setHasBackpack] = useState(initialPreferences?.has_weighted_backpack ?? true)
  const [manualReps, setManualReps] = useState(initialPreferences?.manual_rep_count ?? true)
  const [routineTime, setRoutineTime] = useState((initialPreferences?.routine_time ?? '07:00').slice(0, 5))
  const [reminders, setReminders] = useState(initialReminder?.enabled ?? false)
  const [sound, setSound] = useState(initialReminder?.sound_enabled ?? true)
  const [vibration, setVibration] = useState(initialReminder?.vibration_enabled ?? true)
  const [weekdays, setWeekdays] = useState(initialReminder?.weekdays ?? [1, 2, 3, 4, 5, 6])
  const [skipAdaptation, setSkipAdaptation] = useState(initialPreferences?.skip_adaptation ?? false)

  async function save() {
    if (skipAdaptation && !initialPreferences?.skip_adaptation) {
      const confirmed = window.confirm('Pular as duas semanas de adaptação? Faça isso somente se já domina os movimentos e não apresenta dor.')
      if (!confirmed) return
    }
    setSaving(true)
    const supabase = createClient()
    if (reminders && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission()
    }
    const now = new Date().toISOString()
    const [{ error: preferenceError }, { error: reminderError }] = await Promise.all([
      supabase.from('daily_core_preferences').upsert({
        user_id: userId,
        has_ab_wheel: hasWheel,
        has_resistance_band: hasBand,
        has_weighted_backpack: hasBackpack,
        manual_rep_count: manualReps,
        routine_time: routineTime,
        adaptation_started_on: initialPreferences?.adaptation_started_on ?? now.slice(0, 10),
        skip_adaptation: skipAdaptation,
        onboarding_completed_at: initialPreferences?.onboarding_completed_at ?? now,
      }),
      supabase.from('daily_core_reminders').upsert({
        user_id: userId,
        enabled: reminders,
        reminder_time: routineTime,
        weekdays,
        sound_enabled: sound,
        vibration_enabled: vibration,
      }),
    ])
    setSaving(false)
    if (preferenceError || reminderError) {
      toast.error('Não foi possível salvar. Confirme se a migration 0010 foi aplicada.')
      return
    }
    toast.success(onboarding ? 'Abdômen Diário configurado.' : 'Preferências atualizadas.')
    router.push('/abdomen')
    router.refresh()
  }

  async function postpone(kind: 'today' | '24h') {
    const supabase = createClient()
    const now = new Date()
    const payload = kind === 'today'
      ? { last_notified_on: now.toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' }) }
      : { disabled_until: new Date(now.getTime() + 86_400_000).toISOString() }
    const { error } = await supabase.from('daily_core_reminders').update(payload).eq('user_id', userId)
    if (error) toast.error('Não foi possível atualizar o lembrete.')
    else toast.success(kind === 'today' ? 'Lembrete de hoje marcado como feito.' : 'Lembretes pausados por 24 horas.')
  }

  return (
    <div className="space-y-4">
      {onboarding && (
        <section className="rounded-2xl border border-primary/25 bg-primary/8 p-4">
          <div className="flex items-center gap-2 text-primary">
            <ShieldCheck className="size-5" />
            <h2 className="font-bold">Configuração rápida</h2>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Suas respostas escolhem automaticamente as alternativas seguras para casa. Você pode alterá-las depois.
          </p>
        </section>
      )}

      <section className="surface-card divide-y divide-sidebar-border px-4">
        <Toggle label="Tenho roda abdominal" description="Sem roda, sexta usa prancha longa" checked={hasWheel} onChange={setHasWheel} />
        <Toggle label="Tenho elástico" description="Sem elástico, quinta usa uma alternativa" checked={hasBand} onChange={setHasBand} />
        <Toggle label="Tenho mochila para peso" description="Permite progressão de carga no crunch" checked={hasBackpack} onChange={setHasBackpack} />
        <Toggle label="Contar repetições manualmente" description="Registre as repetições ao concluir a série" checked={manualReps} onChange={setManualReps} />
      </section>

      <section className="surface-card space-y-4 p-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold">Horário habitual</span>
          <input type="time" value={routineTime} onChange={(event) => setRoutineTime(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-secondary px-3 font-mono text-base outline-none focus:border-primary" />
        </label>
        <Toggle label="Ativar lembrete matinal" description="Notificação quando o navegador permitir" checked={reminders} onChange={setReminders} icon={<Bell className="size-4" />} />
        {reminders && (
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-1">
              {['S', 'T', 'Q', 'Q', 'S', 'S', 'D'].map((label, index) => {
                const day = index + 1
                const selected = weekdays.includes(day)
                return <button key={`${label}-${day}`} type="button" onClick={() => setWeekdays((current) => selected ? current.filter((item) => item !== day) : [...current, day].sort())} aria-pressed={selected} className={`grid aspect-square place-items-center rounded-lg border text-[11px] font-bold ${selected ? 'border-primary/30 bg-primary/10 text-primary' : 'border-input bg-secondary text-muted-foreground'}`}>{label}</button>
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Toggle label="Som" checked={sound} onChange={setSound} compact />
              <Toggle label="Vibração" checked={vibration} onChange={setVibration} compact />
            </div>
            {!onboarding && <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => void postpone('today')} className="h-10 rounded-xl border border-input bg-secondary text-[11px] font-semibold">Marcar hoje como feito</button><button type="button" onClick={() => void postpone('24h')} className="h-10 rounded-xl border border-input bg-secondary text-[11px] font-semibold">Pausar por 24 h</button></div>}
          </div>
        )}
      </section>

      <section className="surface-card px-4">
        <Toggle label="Pular adaptação" description="Confirmação obrigatória; recomendado apenas para quem já domina os exercícios" checked={skipAdaptation} onChange={setSkipAdaptation} />
      </section>

      <button type="button" onClick={save} disabled={saving} className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
        {saving ? <Loader2 className="size-4 animate-spin" /> : onboarding ? <Check className="size-4" /> : <Save className="size-4" />}
        {onboarding ? 'Salvar e ver a rotina' : 'Salvar preferências'}
      </button>
    </div>
  )
}

interface ToggleProps {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
  icon?: React.ReactNode
  compact?: boolean
}

function Toggle({ label, description, checked, onChange, icon, compact = false }: ToggleProps) {
  return (
    <label className={`flex cursor-pointer items-center gap-3 ${compact ? 'rounded-xl bg-secondary/60 p-3' : 'py-4'}`}>
      {icon}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{description}</span>}
      </span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="peer sr-only" />
      <span className="relative h-7 w-12 shrink-0 rounded-full bg-secondary ring-1 ring-input transition-colors peer-checked:bg-primary after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-foreground after:transition-transform peer-checked:after:translate-x-5 peer-checked:after:bg-primary-foreground" />
    </label>
  )
}
