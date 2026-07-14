'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, History, Dumbbell, UserCircle, BarChart2, HeartPulse } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/historico', label: 'Histórico', icon: History },
  { href: '/analises', label: 'Análises', icon: BarChart2 },
  { href: '/exercicios', label: 'Exercícios', icon: Dumbbell },
  { href: '/perfil', label: 'Perfil', icon: UserCircle },
  { href: '/acompanhamento', label: 'Saúde', icon: HeartPulse },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border safe-area-bottom">
      <div className="flex items-stretch max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === '/' ? pathname === '/' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 gap-1 py-3 text-xs font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
