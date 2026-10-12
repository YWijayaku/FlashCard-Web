import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { DeckBadge } from '@/components/DeckBadge'
import { DeckForm } from '@/components/DeckForm'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useDeckSummaries } from '@/hooks/useDeckSummaries'

export default function DecksPage() {
  const summaries = useDeckSummaries()
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <PageHeader
        title="Deck"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden />
            Deck baru
          </Button>
        }
      />
      {summaries?.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Belum ada deck. Buat deck pertama Anda.
        </p>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {summaries?.map(({ deck, total, due, fresh }) => (
          <li key={deck.id}>
            <Link
              to={`/decks/${deck.id}`}
              className="flex items-center gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <DeckBadge deck={deck} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{deck.name}</div>
                <div className="text-sm text-muted-foreground">
                  {total} kartu · {due} due · {fresh} baru
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <DeckForm open={creating} onOpenChange={setCreating} onSaved={(id) => navigate(`/decks/${id}`)} />
    </>
  )
}
