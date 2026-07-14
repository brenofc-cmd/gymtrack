'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ReadinessCheckin } from '@/components/wellness/ReadinessCheckin'

const DISCLAIMER = 'Este aplicativo apresenta orientações gerais de organização e acompanhamento. Ele não substitui avaliação de médico, nutricionista ou profissional de educação física. Interrompa exercícios que causem dor forte ou progressiva.'

export function WellnessForms({ userId }: { userId: string }) {
  const [message, setMessage] = useState('')
  const [weight, setWeight] = useState('')
  const [protein, setProtein] = useState('120')
  const [calories, setCalories] = useState('')
  const [sleep, setSleep] = useState('')
  const [quality, setQuality] = useState('3')
  const [fatigue, setFatigue] = useState('3')
  const [motivation, setMotivation] = useState('3')
  const [stress, setStress] = useState('3')

  async function saveWeight() {
    const value = Number(weight)
    if (!Number.isFinite(value) || value <= 0) return setMessage('Informe um peso válido.')
    const { error } = await createClient().from('body_weight_logs').insert({ user_id: userId, weight_kg: value })
    setMessage(error ? 'Não foi possível salvar o peso.' : 'Peso registrado. Use a média de 7 dias para ajustar a meta.')
  }

  async function saveNutrition() {
    const { error } = await createClient().from('nutrition_goals').upsert({
      user_id: userId,
      protein_g: Number(protein) || 120,
      calories_kcal: Number(calories) || null,
      weekly_weight_goal_kg: 0.2,
      is_auto: false,
    }, { onConflict: 'user_id' })
    setMessage(error ? 'Não foi possível salvar a meta.' : 'Meta salva. Alterações futuras exigem sua confirmação.')
  }

  async function saveRecovery() {
    const client = createClient()
    const today = new Date().toISOString().slice(0, 10)
    const [sleepResult, recoveryResult] = await Promise.all([
      client.from('sleep_logs').insert({ user_id: userId, night_of: today, duration_minutes: Number(sleep) || null, quality: Number(quality) || null }),
      client.from('recovery_logs').insert({ user_id: userId, logged_on: today, fatigue: Number(fatigue) || null, motivation: Number(motivation) || null, stress: Number(stress) || null }),
    ])
    setMessage(sleepResult.error || recoveryResult.error ? 'Não foi possível salvar a recuperação.' : 'Sono e recuperação registrados.')
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground border border-border rounded-lg p-3">{DISCLAIMER}</p>
      <ReadinessCheckin userId={userId} />
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Peso e tendência</h2>
        <p className="text-xs text-muted-foreground">Pese-se pela manhã, após o banheiro e antes de comer. Não ajuste por um único dia.</p>
        <div className="flex gap-2"><Input type="number" step="0.1" placeholder="Peso em kg" value={weight} onChange={(e) => setWeight(e.target.value)} /><Button onClick={saveWeight}>Registrar</Button></div>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <h2 className="font-semibold">Suplementos</h2>
        <p className="text-sm">Creatina monohidratada: 3–5 g diariamente; horário não é essencial e não precisa ciclar.</p>
        <p className="text-sm">Whey é apenas uma forma prática de completar proteína; não é obrigatório nem precisa ser tomado imediatamente após o treino.</p>
        <p className="text-xs text-muted-foreground">BCAA, “testosterone boosters”, termogênicos e produtos sem composição clara não são prioridade. Não há recomendação de hormônios ou anabolizantes.</p>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Alimentação para ganho gradual</h2>
        <p className="text-xs text-muted-foreground">Referência inicial: 115–125 g de proteína/dia, superávit estimado de 200–300 kcal e ganho de 0,15–0,30 kg/semana.</p>
        <div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="Proteína (g)" value={protein} onChange={(e) => setProtein(e.target.value)} /><Input type="number" placeholder="Calorias estimadas" value={calories} onChange={(e) => setCalories(e.target.value)} /></div>
        <Button onClick={saveNutrition}>Salvar meta</Button>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="font-semibold">Sono e recuperação</h2>
        <p className="text-xs text-muted-foreground">Meta inicial de 8–10 horas. Avalie também estresse, motivação, fadiga e dor muscular; isto não diagnostica overtraining.</p>
        <div className="grid grid-cols-2 gap-2"><Input type="number" placeholder="Sono (min)" value={sleep} onChange={(e) => setSleep(e.target.value)} /><Input type="number" min="1" max="5" placeholder="Qualidade 1–5" value={quality} onChange={(e) => setQuality(e.target.value)} /><Input type="number" min="1" max="5" placeholder="Fadiga 1–5" value={fatigue} onChange={(e) => setFatigue(e.target.value)} /><Input type="number" min="1" max="5" placeholder="Motivação 1–5" value={motivation} onChange={(e) => setMotivation(e.target.value)} /><Input type="number" min="1" max="5" placeholder="Estresse 1–5" value={stress} onChange={(e) => setStress(e.target.value)} /></div>
        <Button onClick={saveRecovery}>Registrar recuperação</Button>
      </section>
      {message && <p className="text-sm text-primary" role="status">{message}</p>}
    </div>
  )
}
