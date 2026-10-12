import { ChartColumn, House, Layers, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const NAV_ITEMS: readonly NavItem[] = [
  { to: '/', label: 'Beranda', icon: House, end: true },
  { to: '/decks', label: 'Deck', icon: Layers },
  { to: '/stats', label: 'Statistik', icon: ChartColumn },
  { to: '/settings', label: 'Pengaturan', icon: Settings },
]
