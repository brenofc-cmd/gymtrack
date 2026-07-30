'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { deriveTrainingMax, estimateOneRepMax } from '@/lib/training/dup-progression'

interface OnboardingFlowProps {
  userId: string
  initial: { goal: string | null; weightKg: number | null; heightCm: number | null; weeklyGoal: number }
}

const GOALS = [
  { value: 'hipertrofia', label: 'Ganhar massa', description: 'Força como ferramenta para sustentar hipertrofia' },
  { value: 'recomposicao', label: 'Recomposição', description: 'Evoluir força e composição corporal' },
  { value: 'saude', label: 'Saúde e rotina', description: 'Consistência, recuperação e técnica' },
] as const
const LIFTS = [
  { slug: 'back-squat', label: 'Agachamento' },
  { slug: 'barbell-bench-press', label: 'Supino reto' },
  { slug: 'conventional-deadlift', label: 'Levantamento terra' },
  { slug: 'barbell-overhead-press', label: 'Desenvolvimento' },
] as const
type LiftSlug = typeof LIFTS[number]['slug']
type ReferenceDraft = { oneRm: string; setWeight: string; setReps: string }

export function OnboardingFlow({ userId, initial }: OnboardingFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [goal, setGoal] = useState(initial.goal ?? '')
  const [name, setName] = useState('')
  const [experience, setExperience] = useState('iniciante')
  const [weeklyGoal, setWeeklyGoal] = useState(initial.weeklyGoal || 6)
  const [weight, setWeight] = useState(initial.weightKg?.toString() ?? '')
  const [height, setHeight] = useState(initial.heightCm?.toString() ?? '')
  const [unit, setUnit] = useState('kg')
  const [barbellIncrement, setBarbellIncrement] = useState('2.5')
  const [dumbbellIncrement, setDumbbellIncrement] = useState('1')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [painHistory, setPainHistory] = useState('')
  const [riskAcknowledged, setRiskAcknowledged] = useState(false)
  const [references, setReferences] = useState<Record<LiftSlug, ReferenceDraft>>(
    Object.fromEntries(LIFTS.map((lift) => [lift.slug, { oneRm: '', setWeight: '', setReps: '' }])) as Record<LiftSlug, ReferenceDraft>
  )

  function updateReference(slug: LiftSlug, field: keyof ReferenceDraft, value: string) {
    setReferences((current) => ({ ...current, [slug]: { ...current[slug], [field]: value } }))
  }

  async function finish() {
    if (!goal || !name.trim() || !riskAcknowledged) {
      toast.error('Preencha nome, objetivo e confirmação de segurança.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    try {
      const profileResult = await supabase.from('user_profiles').upsert({
        id: userId,
        display_name: name.trim(),
        goal,
        training_experience: experience,
        available_days: Array.from({ length: weeklyGoal }, (_, index) => index + 1),
        weekly_goal: weeklyGoal,
        weight_kg: weight ? Number(weight) : null,
        height_cm: height ? Number(height) : null,
        relevant_pain_history: painHistory.trim() || null,
        updated_at: new Date().toISOString(),
      })
      if (profileResult.error) throw profileResult.error

      const preferenceResult = await supabase.from('user_preferences').upsert({
        id: userId,
        onboarding_done: false,
        weight_unit: unit,
        barbell_increment_kg: Number(barbellIncrement) || 2.5,
        dumbbell_increment_kg: Number(dumbbellIncrement) || 1,
        rest_timer_sound: true,
        rest_timer_vibrate: true,
        notifications_enabled: notificationsEnabled,
        heavy_attempt_risk_acknowledged: true,
        updated_at: new Date().toISOString(),
      })
      if (preferenceResult.error) throw preferenceResult.error

      const provision = await supabase.rpc('ensure_active_powerbuilding_dup_adapted_v6')
      if (provision.error) throw provision.error

      const { data: catalog, error: catalogError } = await supabase
        .from('exercises')
        .select('id,slug')
        .in('slug', LIFTS.map((lift) => lift.slug))
      if (catalogError) throw catalogError
      const now = new Date().toISOString()
      const maxRows = (catalog ?? []).flatMap((item) => {
        const draft = references[item.slug as LiftSlug]
        if (!draft) return []
        const tested = Number(draft.oneRm) > 0 ? Number(draft.oneRm) : null
        const estimated = tested == null
          ? estimateOneRepMax(Number(draft.setWeight), Number(draft.setReps))
          : null
        if (tested == null && estimated == null) return []
        return [{
          user_id: userId,
          exercise_id: item.id,
          tested_1rm: tested,
          estimated_1rm: estimated,
          training_max: deriveTrainingMax(tested, estimated),
          source: tested != null ? 'manual_test' as const : 'estimated_from_set' as const,
          tested_at: tested != null ? now : null,
          updated_at: now,
        }]
      })
      if (maxRows.length) {
        const maxResult = await supabase.from('exercise_reference_maxes').upsert(maxRows, { onConflict: 'user_id,exercise_id' })
        if (maxResult.error) throw maxResult.error
      }

      const done = await supabase.from('user_preferences').update({
        onboarding_done: true,
        routine_provisioned_version: 5,
        updated_at: now,
      }).eq('id', userId)
      if (done.error) throw done.error
      toast.success('Perfil, rotina e bloco DUP preparados!')
      router.push('/')
      router.refresh()
    } catch (error) {
      if (process.env.NODE_ENV === 'development') console.error('Onboarding failed', error)
      toast.error('Não foi possível concluir o onboarding. Seus dados anteriores foram preservados.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-4 py-6">
      <div className="mb-8 flex items-center gap-2" aria-label={`Passo ${step + 1} de 4`}>
        {[0, 1, 2, 3].map((index) => <div key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-secondary'}`} />)}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <section>
            <p className="metric-label text-primary">Passo 1 de 4</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Seu ponto de partida</h1>
            <label className="mt-6 block space-y-1.5"><span className="text-xs font-semibold">Nome</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" className="h-12 w-full rounded-xl border border-input bg-card px-3 outline-none focus:border-primary" /></label>
            <div className="mt-4 space-y-2.5">
              {GOALS.map((item) => (
                <button key={item.value} type="button" onClick={() => setGoal(item.value)} className={cn('flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left', goal === item.value ? 'border-primary/50' : 'border-border')}>
                  <span className={cn('grid size-9 place-items-center rounded-full border', goal === item.value ? 'border-primary bg-primary text-primary-foreground' : 'border-input text-transparent')}><Check className="size-4" /></span>
                  <span><span className="block text-sm font-bold">{item.label}</span><span className="mt-1 block text-xs text-muted-foreground">{item.description}</span></span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 1 && (
          <section>
            <p className="metric-label text-primary">Passo 2 de 4</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Experiência e agenda</h1>
            <label className="mt-6 block space-y-1.5"><span className="text-xs font-semibold">Experiência</span><select value={experience} onChange={(event) => setExperience(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3"><option value="iniciante">Até 1 ano</option><option value="intermediario">1–3 anos</option><option value="avancado">Mais de 3 anos</option></select></label>
            <p className="mt-5 text-sm text-muted-foreground">A ordem é A–F, de segunda a sábado. Se perder um dia, o app continua a sequência sem apagar o calendário.</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {[3, 4, 5, 6].map((value) => <button key={value} type="button" onClick={() => setWeeklyGoal(value)} className={cn('h-20 rounded-2xl border font-mono text-xl font-bold', weeklyGoal === value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground')}>{value}×<span className="mt-1 block font-sans text-[10px] uppercase">semana</span></button>)}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="metric-label text-primary">Passo 3 de 4</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Medidas e equipamento</h1>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <label className="space-y-1.5"><span className="text-xs font-semibold">Peso</span><input type="number" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 font-mono" /></label>
              <label className="space-y-1.5"><span className="text-xs font-semibold">Altura (cm)</span><input type="number" inputMode="decimal" value={height} onChange={(event) => setHeight(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 font-mono" /></label>
              <label className="space-y-1.5"><span className="text-xs font-semibold">Unidade</span><select value={unit} onChange={(event) => setUnit(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3"><option value="kg">kg</option><option value="lb">lb</option></select></label>
              <label className="space-y-1.5"><span className="text-xs font-semibold">Incremento barra (kg)</span><input type="number" step="0.5" value={barbellIncrement} onChange={(event) => setBarbellIncrement(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 font-mono" /></label>
              <label className="space-y-1.5"><span className="text-xs font-semibold">Incremento halter (kg)</span><input type="number" step="0.5" value={dumbbellIncrement} onChange={(event) => setDumbbellIncrement(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 font-mono" /></label>
            </div>
            <label className="mt-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-sm">
              <input type="checkbox" checked={notificationsEnabled} onChange={(event) => setNotificationsEnabled(event.target.checked)} className="size-4" />
              Receber lembretes de treino e descanso
            </label>
          </section>
        )}

        {step === 3 && (
          <section>
            <p className="metric-label text-primary">Passo 4 de 4</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Referências e segurança</h1>
            <p className="mt-2 text-sm text-muted-foreground">Opcional: informe 1RM conhecido ou uma série recente. Sem dados, o GymTrack não inventa carga.</p>
            <div className="mt-5 space-y-3">
              {LIFTS.map((lift) => (
                <fieldset key={lift.slug} className="rounded-xl border border-border bg-card p-3">
                  <legend className="px-1 text-xs font-bold">{lift.label}</legend>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="space-y-1"><span className="text-[10px] text-muted-foreground">1RM</span><input aria-label={`${lift.label} 1RM`} type="number" inputMode="decimal" value={references[lift.slug].oneRm} onChange={(event) => updateReference(lift.slug, 'oneRm', event.target.value)} className="h-11 w-full rounded-lg border border-input bg-secondary px-2 font-mono" /></label>
                    <label className="space-y-1"><span className="text-[10px] text-muted-foreground">Série kg</span><input aria-label={`${lift.label} carga recente`} type="number" inputMode="decimal" value={references[lift.slug].setWeight} onChange={(event) => updateReference(lift.slug, 'setWeight', event.target.value)} className="h-11 w-full rounded-lg border border-input bg-secondary px-2 font-mono" /></label>
                    <label className="space-y-1"><span className="text-[10px] text-muted-foreground">Reps</span><input aria-label={`${lift.label} repetições recentes`} type="number" inputMode="numeric" value={references[lift.slug].setReps} onChange={(event) => updateReference(lift.slug, 'setReps', event.target.value)} className="h-11 w-full rounded-lg border border-input bg-secondary px-2 font-mono" /></label>
                  </div>
                </fieldset>
              ))}
            </div>
            <label className="mt-4 block space-y-1.5"><span className="text-xs font-semibold">Histórico de dor relevante (opcional)</span><textarea value={painHistory} onChange={(event) => setPainHistory(event.target.value)} className="min-h-20 w-full rounded-xl border border-input bg-card p-3" /></label>
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#ffb547]/30 bg-[#ffb547]/10 p-3 text-xs leading-relaxed"><input type="checkbox" checked={riskAcknowledged} onChange={(event) => setRiskAcknowledged(event.target.checked)} className="mt-0.5 size-4" /><span>Entendo que esforços pesados exigem técnica, travas e auxílio apropriado. Posso pular qualquer tentativa e interromper por dor.</span></label>
          </section>
        )}
      </div>

      <div className="mt-8 flex gap-2 pb-[env(safe-area-inset-bottom)]">
        {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} className="grid size-14 place-items-center rounded-[14px] border border-input text-muted-foreground" aria-label="Voltar"><ArrowLeft className="size-5" /></button>}
        <button type="button" onClick={() => step < 3 ? setStep((value) => value + 1) : void finish()} disabled={saving || (step === 0 && (!goal || !name.trim())) || (step === 3 && !riskAcknowledged)} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primary text-base font-bold text-primary-foreground disabled:opacity-40">
          {saving ? <Loader2 className="size-5 animate-spin" /> : step === 3 ? <Check className="size-5" /> : <ArrowRight className="size-5" />}
          {step === 3 ? 'Criar rotina e bloco' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
