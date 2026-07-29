import {
  ChartNoAxesCombined,
  Dumbbell,
  Ellipsis,
  Home,
  Utensils,
} from 'lucide-react'

export const PRIMARY_NAV_ITEMS = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/treinos', label: 'Treino', icon: Dumbbell },
  { href: '/progresso', label: 'Progresso', icon: ChartNoAxesCombined },
  { href: '/alimentacao', label: 'Alimentação', icon: Utensils },
  { href: '/mais', label: 'Mais', icon: Ellipsis },
] as const

export function navItemIsActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/'
  if (href === '/treinos') {
    return pathname.startsWith('/treinos') || pathname.startsWith('/treino/')
  }
  if (href === '/progresso') {
    return pathname.startsWith('/progresso') || pathname.startsWith('/analises')
  }
  return pathname.startsWith(href)
}
