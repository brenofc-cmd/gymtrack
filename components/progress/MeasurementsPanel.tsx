'use client'

import { useState } from 'react'
import { Loader2, Plus, Ruler } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { Tables } from '@/types/database'

interface MeasurementsPanelProps {
  userId: string
  initialMeasurements: Tables<'body_measurements'>[]
}

const FIELDS = [
  { key: 'waist_cm', label: 'Cintura' },
  { key: 'chest_cm', label: 'Peito' },
  { key: 'arm_right_cm', label: 'Braço' },
  { key: 'thigh_right_cm', label: 'Coxa' },
] as const

export function MeasurementsPanel({ userId, initialMeasurements }: MeasurementsPanelProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [measurements, setMeasurements] = useState(initialMeasurements)
  const [values, setValues] = useState<Record<(typeof FIELDS)[number]['key'], string>>({
    waist_cm: '', chest_cm: '', arm_right_cm: '', thigh_right_cm: '',
  })
  const latest = measurements[0]

  async function save() {
    const payload = Object.fromEntries(
      FIELDS.map((field) => [field.key, values[field.key] ? Number(values[field.key]) : null])
    )
    if (Object.values(payload).every((value) => value == null || Number.isNaN(value))) {
      toast.error('Informe ao menos uma medida.')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const logged_on = new Intl.DateTimeFormat('en-CA').format(new Date())
    const { data, error } = await supabase
      .from('body_measurements')
      .upsert({ user_id: userId, logged_on, ...payload }, { onConflict: 'user_id,logged_on' })
      .select()
      .single()
    setSaving(false)

    if (error) {
      toast.error('Erro ao salvar as medidas. Tente novamente.')
      return
    }
    setMeasurements((current) => [data, ...current.filter((item) => item.id !== data.id)])
    setValues({ waist_cm: '', chest_cm: '', arm_right_cm: '', thigh_right_cm: '' })
    setOpen(false)
    toast.success('Medidas atualizadas.')
  }

  return (
    <section className="surface-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold">Medidas corporais</h2>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Acompanhe mudanças sem depender só da balança</p>
        </div>
        <button type="button" onClick={() => setOpen((value) => !value)} className="grid size-9 place-items-center rounded-xl border border-input text-primary">
          <Plus className="size-4" />
          <span className="sr-only">Adicionar medidas</span>
        </button>
      </div>

      {latest ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {FIELDS.map((field) => (
            <div key={field.key} className="rounded-xl bg-secondary/60 p-3">
              <p className="metric-label">{field.label}</p>
              <p className="mt-1 font-mono text-lg font-bold">
                {latest[field.key] ?? '—'}<span className="text-[10px] font-normal text-muted-foreground"> cm</span>
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-input px-4 py-6 text-center">
          <Ruler className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-xs text-muted-foreground">Nenhuma medida registrada.</p>
        </div>
      )}

      {open && (
        <div className="mt-4 space-y-3 border-t border-sidebar-border pt-4">
          <div className="grid grid-cols-2 gap-2">
            {FIELDS.map((field) => (
              <label key={field.key} className="space-y-1">
                <span className="text-[11px] text-muted-foreground">{field.label} (cm)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={values[field.key]}
                  onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="h-11 w-full rounded-xl border border-input bg-secondary px-3 font-mono text-sm outline-none focus:border-primary"
                />
              </label>
            ))}
          </div>
          <button type="button" onClick={save} disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground disabled:opacity-60">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Salvar medidas
          </button>
        </div>
      )}
    </section>
  )
}
