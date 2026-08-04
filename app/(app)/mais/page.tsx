import Link from 'next/link'
import {
  ChevronRight,
  ClipboardList,
  Dumbbell,
  HeartPulse,
  Activity,
  History,
  Settings,
  Sparkles,
  UserRound,
  BookOpenText,
} from 'lucide-react'
import { SOURCE_DISCLAIMER as AVISO_GERAL } from '@/lib/routine/david-laid-gymshark-exact-v7'

const items = [
  { href: '/abdomen', label: 'Abdômen Diário', description: 'Rotina matinal independente', icon: Activity },
  { href: '/acompanhamento', label: 'Recuperação e saúde', description: 'Check-in diário', icon: HeartPulse },
  { href: '/suplementos', label: 'Suplementos', description: 'Rotina e registros', icon: Sparkles },
  { href: '/historico', label: 'Histórico', description: 'Treinos concluídos', icon: History },
  { href: '/exercicios', label: 'Exercícios', description: 'Catálogo e execução', icon: Dumbbell },
  { href: '/aprendizado', label: 'Centro de aprendizado', description: 'Método, segurança e fontes', icon: BookOpenText },
  { href: '/perfil', label: 'Perfil', description: 'Dados e metas', icon: UserRound },
  { href: '/configuracoes', label: 'Configurações', description: 'Timer, unidade e preferências', icon: Settings },
  { href: '/onboarding', label: 'Revisar onboarding', description: 'Objetivo e experiência', icon: ClipboardList },
] as const

export default function MaisPage() {
  return (
    <div className="mx-auto w-full max-w-[520px] px-4 py-5 lg:py-7">
      <h1 className="text-[22px] font-extrabold tracking-tight">Mais</h1>
      <section className="mt-4 overflow-hidden rounded-[18px] bg-card gt-shadow">
        {items.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="flex items-center gap-2.5 border-b border-secondary px-3.5 py-3.5 last:border-0">
            <Icon className="size-[18px] shrink-0 text-muted-foreground" strokeWidth={1.8} />
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold">{label}</span>
              <span className="mt-px block text-[11px] text-muted-foreground">{description}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-[var(--chevron)]" />
          </Link>
        ))}
      </section>
      <p className="px-2 pt-5 text-center text-[10.5px] leading-relaxed text-muted-foreground">{AVISO_GERAL}</p>
    </div>
  )
}
