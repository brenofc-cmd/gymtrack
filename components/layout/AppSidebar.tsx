'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTINE_NAME } from '@/lib/routine/powerbuilding-dup-adaptado-v6'
import {
  ChevronRight,
  HeartPulse,
  Activity,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { navItemIsActive, PRIMARY_NAV_ITEMS } from './nav-items'

const SECONDARY_ITEMS = [
  { href: '/abdomen', label: 'Abdômen Diário', icon: Activity },
  { href: '/acompanhamento', label: 'Recuperação', icon: HeartPulse },
  { href: '/suplementos', label: 'Suplementos', icon: Sparkles },
  { href: '/perfil', label: 'Perfil', icon: UserRound },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
] as const

export function AppSidebar() {
  const pathname = usePathname()

  if (pathname.startsWith('/sessao/') || pathname.startsWith('/abdomen/sessao') || pathname.startsWith('/onboarding')) return null

  return (
    <aside className="sticky top-0 hidden h-dvh w-[228px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-5 lg:flex">
      <Link href="/" className="mb-4 flex items-center gap-2.5 px-2">
        <span className="grid size-7 place-items-center rounded-lg bg-primary text-sm font-black text-primary-foreground">
          G
        </span>
        <span className="text-[15px] font-bold tracking-tight">GymTrack</span>
      </Link>

      <nav className="space-y-1" aria-label="Navegação principal">
        {PRIMARY_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = navItemIsActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-semibold transition-colors',
                active
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground'
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.8} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="my-3 h-px bg-sidebar-border" />

      <nav className="space-y-0.5" aria-label="Conta e acompanhamento">
        {SECONDARY_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'group flex h-9 items-center gap-2.5 rounded-xl px-2.5 text-[13px] font-medium transition-colors',
                active
                  ? 'bg-sidebar-accent text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-4" strokeWidth={1.8} />
              <span className="flex-1">{label}</span>
              <ChevronRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
        <p className="text-xs font-semibold">{ROUTINE_NAME}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">6 dias · progressão por RIR</p>
      </div>
    </aside>
  )
}
