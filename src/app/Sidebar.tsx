import { NavLink } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { cn } from '@/lib/utils'
import { NAV_ITEMS, SECONDARY_NAV } from './nav'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex min-h-touch items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
  )

export function Sidebar() {
  const decks = useLiveQuery(() => db.decks.orderBy('createdAt').toArray(), [])

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r bg-card lg:flex">
      <div className="px-5 py-4 text-lg font-bold">Flashcard</div>
      <nav aria-label="Navigasi utama" className="px-2">
        <ul className="space-y-1">
          {[...NAV_ITEMS, ...SECONDARY_NAV].map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={linkClass}>
                <Icon className="h-4 w-4" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-6 px-5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deck</div>
      <nav aria-label="Daftar deck" className="mt-2 flex-1 overflow-y-auto px-2 pb-4">
        <ul className="space-y-1">
          {decks?.map((deck) => (
            <li key={deck.id}>
              <NavLink to={`/decks/${deck.id}`} className={linkClass}>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-sm"
                  style={{ backgroundColor: `${deck.color}22` }}
                  aria-hidden
                >
                  {deck.icon || '📘'}
                </span>
                <span className="truncate">{deck.name}</span>
              </NavLink>
            </li>
          ))}
          {decks?.length === 0 && <li className="px-3 text-sm text-muted-foreground">Belum ada deck</li>}
        </ul>
      </nav>
    </aside>
  )
}
