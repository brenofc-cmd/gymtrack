'use client'

import { useState } from 'react'
import { Activity, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { localDateISO } from '@/lib/utils/local-date'
import { assessReadiness, type JointPain, type ReadinessRecommendation } from '@/lib/training/readiness'

function Scale({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold">{label}</p>
      <div className="grid grid-cols-5 gap-1.5">
        {[1, 2, 3, 4, 5].map((option) => (
          <button key={option} type="button" title={`${label}: ${option} de 5`} aria-label={`${label}: ${option} de 5`} aria-pressed={value === option} onClick={() => onChange(option)}
            className={cn('h-9 rounded-lg border text-xs font-bold', value === option ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-secondary text-muted-foreground')}>
            {option}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ReadinessCheckin({ userId }: { userId: string }) {
  const [sleepQuality, setSleepQuality] = useState(3)
  const [energy, setEnergy] = useState(3)
  const [muscleSoreness, setMuscleSoreness] = useState(3)
  const [jointPain, setJointPain] = useState<JointPain>('none')
  const [stress, setStress] = useState(3)
  const [motivation, setMotivation] = useState(3)
  const [recoveryFeeling, setRecoveryFeeling] = useState(3)
  const [result, setResult] = useState<ReadinessRecommendation | null>(null)
  const [saving, setSaving] = useState(false)

  async function save() {
    const recommendation = assessReadiness({ sleepQuality, energy, muscleSoreness, jointPain, stress, motivation, recoveryFeeling })
    setResult(recommendation)
    setSaving(true)
    const today = localDateISO()
    const { error } = await createClient().from('daily_readiness').upsert({
      user_id: userId, readiness_date: today, sleep_quality: sleepQuality, energy,
      muscle_soreness: muscleSoreness, joint_pain: jointPain, stress, motivation,
      recovery_feeling: recoveryFeeling, recommendation: recommendation.status,
      recommendation_reason: recommendation.reason, updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,readiness_date' })
    setSaving(false)
    if (error) toast.error('Não foi possível salvar o check-in.')
    else toast.success('Prontidão registrada.')
  }

  return (
    <section className="rounded-2xl border border-primary/20 bg-card p-4 space-y-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Activity className="size-4" /></span>
        <div><h2 className="font-semibold">Prontidão de hoje</h2><p className="text-xs text-muted-foreground">Recomendação, não diagnóstico. Responda antes do treino.</p></div>
      </div>
      <Scale label="Qualidade do sono" value={sleepQuality} onChange={setSleepQuality} />
      <Scale label="Energia" value={energy} onChange={setEnergy} />
      <Scale label="Dor muscular (1 baixa, 5 alta)" value={muscleSoreness} onChange={setMuscleSoreness} />
      <Scale label="Estresse (1 baixo, 5 alto)" value={stress} onChange={setStress} />
      <Scale label="Motivação" value={motivation} onChange={setMotivation} />
      <Scale label="Sensação de recuperação" value={recoveryFeeling} onChange={setRecoveryFeeling} />
      <div>
        <p className="mb-1.5 text-xs font-semibold">Dor articular</p>
        <div className="grid grid-cols-2 gap-1.5">
          {([['none', 'Nenhuma'], ['mild', 'Leve'], ['moderate', 'Moderada'], ['severe', 'Forte']] as const).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setJointPain(value)}
              className={cn('h-9 rounded-lg border text-xs font-semibold', jointPain === value ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-secondary text-muted-foreground')}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <Button className="w-full" onClick={save} disabled={saving}>{saving ? 'Salvando...' : 'Gerar recomendação'}</Button>
      {result && (
        <div className={cn('rounded-xl border p-3 text-sm', result.status === 'ready' ? 'border-emerald-500/30 bg-emerald-500/10' : result.status === 'stop_for_pain' ? 'border-destructive/40 bg-destructive/10' : 'border-amber-500/30 bg-amber-500/10')}>
          <div className="flex items-center gap-2 font-bold">{result.status === 'ready' ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}{result.title}</div>
          <p className="mt-1 text-xs text-muted-foreground">{result.reason}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs">{result.actions.map((action) => <li key={action}>{action}</li>)}</ul>
        </div>
      )}
    </section>
  )
}
