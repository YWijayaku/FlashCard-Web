import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search } from 'lucide-react'
import { CardForm } from '@/components/CardForm'
import { CardListItem } from '@/components/CardListItem'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { PageHeader } from '@/components/PageHeader'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { db } from '@/lib/db'
import { searchCards } from '@/lib/search'
import { deleteCard } from '@/lib/store'
import type { Card } from '@/types'

const PAGE = 100

export default function BrowserPage() {
  const [params, setParams] = useSearchParams()
  const decks = useLiveQuery(() => db.decks.orderBy('name').toArray(), [])
  const deckId = params.get('deck') ?? decks?.[0]?.id ?? ''
  const cards = useLiveQuery(() => (deckId ? db.cards.where('deckId').equals(deckId).sortBy('createdAt') : []), [deckId])
  const [query, setQuery] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<Card>()
  const [deleting, setDeleting] = useState<Card>()

  const results = useMemo(() => searchCards(cards ?? [], query), [cards, query])

  return (
    <>
      <PageHeader title="Card Browser" description="Cari, edit, dan hapus kartu per deck." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
        <div className="space-y-2">
          <Label htmlFor="browser-deck">Deck</Label>
          <select
            id="browser-deck"
            value={deckId}
            onChange={(e) => {
              setParams({ deck: e.target.value }, { replace: true })
              setLimit(PAGE)
            }}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
          >
            {decks?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="browser-search">Cari</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="browser-search"
              type="search"
              className="pl-9"
              placeholder="Teks di sisi mana pun…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setLimit(PAGE)
              }}
            />
          </div>
        </div>
      </div>

      {decks?.length === 0 && <p className="text-muted-foreground">Belum ada deck.</p>}
      {cards && (
        <p className="mb-2 text-sm text-muted-foreground" aria-live="polite">
          {results.length} dari {cards.length} kartu
        </p>
      )}
      <ul className="space-y-2">
        {results.slice(0, limit).map((card) => (
          <CardListItem key={card.id} card={card} onEdit={() => setEditing(card)} onDelete={() => setDeleting(card)} />
        ))}
      </ul>
      {results.length > limit && (
        <button type="button" className="mt-3 min-h-touch w-full rounded-md border text-sm hover:bg-accent" onClick={() => setLimit((l) => l + PAGE)}>
          Tampilkan lebih banyak ({results.length - limit} lagi)
        </button>
      )}

      {deckId && <CardForm deckId={deckId} card={editing} open={editing !== undefined} onOpenChange={(o) => !o && setEditing(undefined)} />}
      <ConfirmDialog
        open={deleting !== undefined}
        onOpenChange={(o) => !o && setDeleting(undefined)}
        title="Hapus kartu?"
        description="Kartu ini beserta riwayat belajarnya akan dihapus permanen."
        onConfirm={() => (deleting ? deleteCard(deleting.id) : undefined)}
      />
    </>
  )
}
