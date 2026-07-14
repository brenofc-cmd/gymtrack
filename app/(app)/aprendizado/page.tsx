import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowUpRight, BookOpenText } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const topics = [
  ['Powerbuilding', 'Combina prática de força nos movimentos principais com trabalho de hipertrofia nos acessórios.'],
  ['Progressive overload', 'Progredir é melhorar carga, repetições, controle ou volume sustentável — sem sacrificar técnica.'],
  ['DUP / micro-DUP', 'A semana alterna ênfase de força técnica e hipertrofia, sem máximas reais para iniciantes.'],
  ['RIR e falha', 'RIR estima repetições em reserva. Falha não é obrigatória e fica bloqueada em compostos de maior risco.'],
  ['Top set / back-off', 'Uma série principal controlada seguida por séries 5–15% mais leves; no máximo um composto por sessão.'],
  ['e1RM', 'A fórmula de Epley estima força com séries de 3–10 reps válidas. Não é convite para testar uma repetição máxima.'],
  ['Volume semanal', 'Séries diretas são exibidas separadamente da contribuição secundária dos compostos.'],
  ['Recuperação', 'Sono, energia, dor, estresse e recuperação ajustam a sessão sem diagnosticar lesões ou overtraining.'],
  ['Construção do V-taper', 'Dorsais, deltoides e proporções próprias são desenvolvidos com consistência, não por comparação corporal.'],
  ['Expectativas realistas', 'Referências estéticas são inspiração. Genética, estrutura, tempo, alimentação e consistência tornam cada resultado individual.'],
] as const

const provenanceLabels: Record<string, string> = {
  direct_primary_source: 'Fonte primária direta',
  official_secondary_source: 'Fonte oficial secundária',
  scientific_evidence: 'Evidência científica',
  implementation_inference: 'Adaptação do produto',
}

export default async function AprendizadoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: sources } = await admin
    .from('content_sources')
    .select('id, title, category, provenance, url, summary, accessed_on')
    .order('provenance')
    .order('title')

  return (
    <div className="mx-auto flex w-full max-w-[520px] flex-col gap-3 px-4 py-5 lg:py-7">
      <header>
        <div className="flex items-center gap-2 text-primary">
          <BookOpenText className="size-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Centro de aprendizado</span>
        </div>
        <h1 className="mt-2 text-[22px] font-extrabold tracking-tight">Por que o programa funciona?</h1>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Powerbuilding estético adaptado para iniciante. Não é um programa oficial de atleta nem uma prescrição médica.
        </p>
      </header>

      <section className="grid gap-2 sm:grid-cols-2">
        {topics.map(([title, description]) => (
          <article key={title} className="surface-card p-4">
            <h2 className="text-sm font-bold">{title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </article>
        ))}
      </section>

      <section className="surface-card p-4">
        <h2 className="text-sm font-bold">Fases do programa</h2>
        <div className="mt-3 space-y-3 text-xs leading-relaxed">
          <p><strong>1. Fundamentos (padrão):</strong> técnica, consistência, RIR 2–3 em compostos e progressão dupla.</p>
          <p><strong>2. Powerbuilding introdutório:</strong> só após histórico consistente, boa técnica, recuperação aceitável, ausência de dor relevante e confirmação do usuário.</p>
          <p><strong>3. Avançado:</strong> recurso futuro; não é ativado automaticamente e pode depender de avaliação profissional.</p>
        </div>
      </section>

      <section className="surface-card p-4">
        <h2 className="text-sm font-bold">Fontes e proveniência</h2>
        <p className="mt-1 text-[11px] text-muted-foreground">Inferências de implementação nunca são apresentadas como fala de uma pessoa real.</p>
        <div className="mt-3 space-y-3">
          {(sources ?? []).map((source) => (
            <article key={source.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold">{source.title}</p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {provenanceLabels[source.provenance] ?? source.provenance} · {source.category}
                  </p>
                </div>
                {source.url && (
                  <Link href={source.url} target="_blank" rel="noreferrer" aria-label={`Abrir fonte: ${source.title}`}>
                    <ArrowUpRight className="size-4 text-primary" />
                  </Link>
                )}
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{source.summary}</p>
              <p className="mt-1 text-[9px] text-muted-foreground">Acesso: {source.accessed_on}</p>
            </article>
          ))}
          {!sources?.length && <p className="text-xs text-muted-foreground">As fontes aparecerão após a migration v4.</p>}
        </div>
      </section>
    </div>
  )
}
