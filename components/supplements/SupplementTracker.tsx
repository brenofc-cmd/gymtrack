'use client'

import { useState } from 'react'
import { Check, Loader2, Plus, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

interface SupplementTrackerProps {
  userId: string
  initialSupplements: Tables<'supplements'>[]
  initialLogs: Tables<'supplement_logs'>[]
  today: string
}

export function SupplementTracker({ userId, initialSupplements, initialLogs, today }: SupplementTrackerProps) {
  const [supplements, setSupplements] = useState(initialSupplements)
  const [logs, setLogs] = useState(initialLogs)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', dose: '', unit: 'g' })

  async function toggle(supplement: Tables<'supplements'>) {
    const existing = logs.find((log) => log.supplement_id === supplement.id)
    const supabase = createClient()
    setSavingId(supplement.id)

    if (existing) {
      const { error } = await supabase.from('supplement_logs').delete().eq('id', existing.id)
      if (error) toast.error('Não foi possível desfazer o registro.')
      else setLogs((current) => current.filter((log) => log.id !== existing.id))
    } else {
      const { data, error } = await supabase
        .from('supplement_logs')
        .insert({
          user_id: userId,
          supplement_id: supplement.id,
          taken_on: today,
          taken_at: new Date().toISOString(),
          dose: supplement.default_dose,
          dose_unit: supplement.dose_unit,
        })
        .select()
        .single()
      if (error) toast.error('Erro ao salvar. Confira sua conexão e tente novamente.')
      else setLogs((current) => [...current, data])
    }
    setSavingId(null)
  }

  async function createCustom() {
    if (!form.name.trim()) {
      toast.error('Informe o nome do suplemento.')
      return
    }
    setCreating(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('supplements')
      .insert({
        user_id: userId,
        name: form.name.trim(),
        default_dose: form.dose ? Number(form.dose) : null,
        dose_unit: form.unit || null,
        category: 'personalizado',
        info: 'Suplemento adicionado pelo usuário.',
      })
      .select()
      .single()
    setCreating(false)
    if (error) {
      toast.error('Não foi possível criar o suplemento.')
      return
    }
    setSupplements((current) => [...current, data])
    setForm({ name: '', dose: '', unit: 'g' })
    setShowForm(false)
    toast.success('Suplemento adicionado.')
  }

  return (
    <div className="space-y-3">
      <section className="space-y-2">
        {supplements.length === 0 ? (
          <div className="surface-card px-5 py-10 text-center">
            <Sparkles className="mx-auto size-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-semibold">Nenhum suplemento configurado</p>
            <p className="mt-1 text-xs text-muted-foreground">Adicione apenas o que já faz parte da sua orientação profissional.</p>
          </div>
        ) : (
          supplements.map((supplement) => {
            const taken = logs.some((log) => log.supplement_id === supplement.id)
            const saving = savingId === supplement.id
            return (
              <button
                key={supplement.id}
                type="button"
                onClick={() => toggle(supplement)}
                disabled={saving}
                className={`flex w-full items-center gap-3 rounded-2xl border bg-card p-3.5 text-left transition-colors ${taken ? 'border-primary/35' : 'border-border'}`}
              >
                <span className={`grid size-11 shrink-0 place-items-center rounded-xl border ${taken ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-secondary text-muted-foreground'}`}>
                  {saving ? <Loader2 className="size-4 animate-spin" /> : taken ? <Check className="size-5" strokeWidth={2.7} /> : <Sparkles className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{supplement.name}</span>
                  <span className="mt-0.5 block text-[11px] text-muted-foreground">
                    {supplement.default_dose != null ? `${supplement.default_dose} ${supplement.dose_unit ?? ''}` : 'Dose não informada'}
                    {supplement.category ? ` · ${supplement.category}` : ''}
                  </span>
                </span>
                <span className={`text-xs font-semibold ${taken ? 'text-primary' : 'text-muted-foreground'}`}>{taken ? 'Tomado' : 'Registrar'}</span>
              </button>
            )
          })
        )}
      </section>

      {showForm ? (
        <section className="surface-card p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Suplemento personalizado</h2>
            <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground"><X className="size-4" /></button>
          </div>
          <div className="mt-3 grid grid-cols-[1fr_88px_70px] gap-2">
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nome" className="h-11 min-w-0 rounded-xl border border-input bg-secondary px-3 text-sm outline-none focus:border-primary" />
            <input value={form.dose} onChange={(event) => setForm((current) => ({ ...current, dose: event.target.value }))} placeholder="Dose" type="number" inputMode="decimal" className="h-11 min-w-0 rounded-xl border border-input bg-secondary px-3 font-mono text-sm outline-none focus:border-primary" />
            <input value={form.unit} onChange={(event) => setForm((current) => ({ ...current, unit: event.target.value }))} placeholder="Unid." className="h-11 min-w-0 rounded-xl border border-input bg-secondary px-3 text-sm outline-none focus:border-primary" />
          </div>
          <button type="button" onClick={createCustom} disabled={creating} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
            {creating && <Loader2 className="size-4 animate-spin" />} Salvar suplemento
          </button>
        </section>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} className="flex h-12 w-full items-center justify-center gap-2 rounded-[13px] border border-input text-sm font-semibold text-[var(--body-soft)]">
          <Plus className="size-4" /> Adicionar suplemento
        </button>
      )}
    </div>
  )
}
