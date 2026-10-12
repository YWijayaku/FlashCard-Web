import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { CardForm } from '@/components/CardForm'
import { CardListItem } from '@/components/CardListItem'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { DeckBadge } from '@/components/DeckBadge'
import { DeckForm } from '@/components/DeckForm'
import { Button } from '@/components/ui/button'
import { db } from '@/lib/db'
import { deleteCard, deleteDeck, loadDeckQueue } from '@/lib/store'
import { deckThemeStyle } from '@/lib/themes'
import type { Card } from '@/types'

export default function DeckDetailPage() {
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId], null)
  const cards = useLiveQuery(() => db.cards.where('deckId').equals(deckId).sortBy('createdAt'), [deckId])
  const queue = useLiveQuery(async () => {
    const d = await db.decks.get(deckId)
    return d ? loadDeckQueue(d, Date.now()) : undefined
  }, [deckId])

  const [editingDeck, setEditingDeck] = useState(false)
  const [confirmDeck, setConfirmDeck] = useState(false)
  const [cardForm, setCardForm] = useState<{ open: boolean; card?: Card }>({ open: false })
  const [deletingCard, setDeletingCard] = useState<Card>()

  if (deck === null) return null
  if (!deck) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground">Deck tidak ditemukan.</p>
        <Button asChild className="mt-4">
          <Link to="/decks">Kembali ke daftar deck</Link>
        </Button>
      </div>
    )
  }

  const studyCount = queue ? queue.due.length + queue.fresh.length : 0

  return (
    <div style={deckThemeStyle(deck.theme)}>
      <header className="mb-5 flex items-start gap-3">
        <DeckBadge deck={deck} className="h-14 w-14 text-2xl" />
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-2xl font-bold tracking-tight">{deck.name}</h1>
          {deck.description && <p className="mt-1 text-sm text-muted-foreground">{deck.description}</p>}
          <p className="mt-1 text-sm text-muted-foreground">
            {cards?.length ?? 0} kartu · {queue?.due.length ?? 0} due · {queue?.fresh.length ?? 0} baru hari ini
          </p>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button asChild={studyCount > 0} disabled={studyCount === 0} size="lg" className="flex-1 sm:flex-none">
          {studyCount > 0 ? (
            <Link to={`/decks/${deck.id}/study`}>
              <Play aria-hidden />
              Mulai belajar ({studyCount})
            </Link>
          ) : (
            <span>Tidak ada kartu untuk hari ini</span>
          )}
        </Button>
        <Button variant="outline" onClick={() => setEditingDeck(true)}>
          <Pencil aria-hidden />
          Edit deck
        </Button>
        <Button variant="outline" onClick={() => setConfirmDeck(true)}>
          <Trash2 aria-hidden />
          Hapus deck
        </Button>
      </div>

      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">Kartu</h2>
        <Button onClick={() => setCardForm({ open: true })}>
          <Plus aria-hidden />
          Tambah kartu
        </Button>
      </div>
      {cards?.length === 0 && (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">Deck ini belum memiliki kartu.</p>
      )}
      <ul className="space-y-2">
        {cards?.map((card) => (
          <CardListItem
            key={card.id}
            card={card}
            onEdit={() => setCardForm({ open: true, card })}
            onDelete={() => setDeletingCard(card)}
          />
        ))}
      </ul>

      <DeckForm deck={deck} open={editingDeck} onOpenChange={setEditingDeck} />
      <CardForm
        deckId={deck.id}
        card={cardForm.card}
        open={cardForm.open}
        onOpenChange={(open) => setCardForm((s) => ({ ...s, open }))}
      />
      <ConfirmDialog
        open={confirmDeck}
        onOpenChange={setConfirmDeck}
        title="Hapus deck?"
        description={`Deck "${deck.name}" beserta semua kartu dan riwayat belajarnya akan dihapus permanen.`}
        onConfirm={async () => {
          await deleteDeck(deck.id)
          navigate('/decks')
        }}
      />
      <ConfirmDialog
        open={deletingCard !== undefined}
        onOpenChange={(open) => !open && setDeletingCard(undefined)}
        title="Hapus kartu?"
        description="Kartu ini beserta riwayat belajarnya akan dihapus permanen."
        onConfirm={() => (deletingCard ? deleteCard(deletingCard.id) : undefined)}
      />
    </div>
  )
}
