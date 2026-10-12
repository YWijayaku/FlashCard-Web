import { ChartColumn, FileUp, House, Layers, Search, Settings, type LucideIcon } from 'lucide-react'

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

/** Tautan tambahan di sidebar desktop (di HP tersedia dari halaman Deck). */
export const SECONDARY_NAV: readonly NavItem[] = [
  { to: '/browser', label: 'Card Browser', icon: Search },
  { to: '/import', label: 'Import', icon: FileUp },
]
