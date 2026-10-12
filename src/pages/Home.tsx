import { Link } from 'react-router-dom'
import { Play, Plus } from 'lucide-react'
import { DeckBadge } from '@/components/DeckBadge'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useDeckSummaries } from '@/hooks/useDeckSummaries'

export default function HomePage() {
  const summaries = useDeckSummaries()
  const totalDue = summaries?.reduce((n, s) => n + s.due, 0) ?? 0
  const totalNew = summaries?.reduce((n, s) => n + s.fresh, 0) ?? 0

  return (
    <>
      <PageHeader title="Beranda" description="Kartu yang perlu dipelajari hari ini." />

      <section aria-label="Ringkasan hari ini" className="mb-6 grid grid-cols-2 gap-3">
        <div className="rounded-lg border bg-card p-4">
          <div className="text-3xl font-bold text-primary">{totalDue}</div>
          <div className="text-sm text-muted-foreground">Kartu due</div>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="text-3xl font-bold">{totalNew}</div>
          <div className="text-sm text-muted-foreground">Kartu baru</div>
        </div>
      </section>

      {summaries?.length === 0 && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">Belum ada deck.</p>
          <Button asChild className="mt-4">
            <Link to="/decks">
              <Plus aria-hidden />
              Buat deck
            </Link>
          </Button>
        </div>
      )}

      <ul className="space-y-3">
        {summaries?.map(({ deck, due, fresh }) => {
          const count = due + fresh
          return (
            <li key={deck.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 sm:p-4">
              <DeckBadge deck={deck} />
              <Link to={`/decks/${deck.id}`} className="min-w-0 flex-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="truncate font-semibold">{deck.name}</div>
                <div className="text-sm">
                  <span className="font-medium text-primary">{due} due</span>
                  <span className="text-muted-foreground"> · {fresh} baru</span>
                </div>
              </Link>
              {count > 0 ? (
                <Button asChild>
                  <Link to={`/decks/${deck.id}/study`} aria-label={`Mulai belajar ${deck.name}`}>
                    <Play aria-hidden />
                    <span className="hidden sm:inline">Mulai belajar</span>
                    <span className="sm:hidden">Belajar</span>
                  </Link>
                </Button>
              ) : (
                <span className="px-2 text-sm text-muted-foreground">Selesai ✓</span>
              )}
            </li>
          )
        })}
      </ul>
    </>
  )
}
