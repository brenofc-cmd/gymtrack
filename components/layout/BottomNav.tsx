'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { navItemIsActive, PRIMARY_NAV_ITEMS } from './nav-items'

export function BottomNav() {
  const pathname = usePathname()

  if (pathname.startsWith('/sessao/') || pathname.startsWith('/abdomen/sessao') || pathname.startsWith('/onboarding')) return null

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar/98 backdrop-blur-xl lg:hidden"
    >
      <div className="mx-auto flex max-w-lg px-1 pb-[env(safe-area-inset-bottom)]">
        {PRIMARY_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = navItemIsActive(pathname, href)
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex min-h-16 flex-1 flex-col items-center justify-center gap-1 text-[10px] font-semibold transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="size-5" strokeWidth={1.9} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
