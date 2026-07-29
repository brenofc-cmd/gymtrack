'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface OnboardingFlowProps {
  userId: string
  initial: {
    goal: string | null
    weightKg: number | null
    heightCm: number | null
    weeklyGoal: number
  }
}

const GOALS = [
  { value: 'hipertrofia', label: 'Ganhar massa', description: 'Priorizar hipertrofia e progressão de carga' },
  { value: 'recomposicao', label: 'Recomposição', description: 'Ganhar força enquanto reduz gordura' },
  { value: 'saude', label: 'Saúde e rotina', description: 'Consistência, disposição e qualidade de vida' },
] as const

export function OnboardingFlow({ userId, initial }: OnboardingFlowProps) {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [goal, setGoal] = useState(initial.goal ?? '')
  const [weeklyGoal, setWeeklyGoal] = useState(initial.weeklyGoal || 6)
  const [weight, setWeight] = useState(initial.weightKg?.toString() ?? '')
  const [height, setHeight] = useState(initial.heightCm?.toString() ?? '')

  async function finish() {
    if (!goal) {
      setStep(0)
      toast.error('Escolha seu objetivo principal.')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const [profileResult, preferenceResult] = await Promise.all([
      supabase.from('user_profiles').upsert({
        id: userId,
        goal,
        weekly_goal: weeklyGoal,
        weight_kg: weight ? Number(weight) : null,
        height_cm: height ? Number(height) : null,
        updated_at: new Date().toISOString(),
      }),
      supabase.from('user_preferences').upsert({
        id: userId,
        onboarding_done: true,
        weight_unit: 'kg',
        rest_timer_sound: true,
        rest_timer_vibrate: true,
        updated_at: new Date().toISOString(),
      }),
    ])
    setSaving(false)
    if (profileResult.error || preferenceResult.error) {
      toast.error('Não foi possível concluir o onboarding.')
      return
    }
    toast.success('Perfil preparado. Bem-vindo ao GymTrack!')
    router.push('/')
    router.refresh()
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[520px] flex-col px-4 py-6">
      <div className="mb-8 flex items-center gap-2">
        {[0, 1, 2].map((index) => (
          <div key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-secondary'}`} />
        ))}
      </div>

      <div className="flex-1">
        {step === 0 && (
          <section>
            <p className="metric-label text-primary">Passo 1 de 3</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Qual é seu objetivo?</h1>
            <p className="mt-2 text-sm text-muted-foreground">Isso personaliza a forma como o progresso é apresentado.</p>
            <div className="mt-6 space-y-2.5">
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
            <p className="metric-label text-primary">Passo 2 de 3</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Sua frequência</h1>
            <p className="mt-2 text-sm text-muted-foreground">A rotina PPL foi preparada para até seis dias, com domingo de descanso.</p>
            <div className="mt-8 grid grid-cols-3 gap-2">
              {[3, 4, 5, 6].map((value) => (
                <button key={value} type="button" onClick={() => setWeeklyGoal(value)} className={cn('h-20 rounded-2xl border font-mono text-xl font-bold', weeklyGoal === value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground')}>
                  {value}×<span className="mt-1 block font-sans text-[10px] font-medium uppercase tracking-wider">semana</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <p className="metric-label text-primary">Passo 3 de 3</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Ponto de partida</h1>
            <p className="mt-2 text-sm text-muted-foreground">Esses campos são opcionais e podem ser alterados no perfil.</p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <label className="space-y-1.5"><span className="text-xs font-semibold">Peso (kg)</span><input type="number" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 font-mono outline-none focus:border-primary" /></label>
              <label className="space-y-1.5"><span className="text-xs font-semibold">Altura (cm)</span><input type="number" inputMode="decimal" value={height} onChange={(event) => setHeight(event.target.value)} className="h-12 w-full rounded-xl border border-input bg-card px-3 font-mono outline-none focus:border-primary" /></label>
            </div>
          </section>
        )}
      </div>

      <div className="mt-8 flex gap-2 pb-[env(safe-area-inset-bottom)]">
        {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} className="grid size-14 place-items-center rounded-[14px] border border-input text-muted-foreground"><ArrowLeft className="size-5" /></button>}
        <button type="button" onClick={() => step < 2 ? setStep((value) => value + 1) : void finish()} disabled={saving || (step === 0 && !goal)} className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[14px] bg-primary text-base font-bold text-primary-foreground disabled:opacity-40">
          {saving ? <Loader2 className="size-5 animate-spin" /> : step === 2 ? <Check className="size-5" /> : <ArrowRight className="size-5" />}
          {step === 2 ? 'Concluir' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
