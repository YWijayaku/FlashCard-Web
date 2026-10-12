import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FlipSessionView } from '@/features/study/FlipSession'
import { StudySetup } from '@/features/study/StudySetup'
import { availableSides } from '@/features/study/sides'
import { db } from '@/lib/db'
import { deckThemeStyle } from '@/lib/themes'
import type { CardSide, Deck } from '@/types'

interface Started {
  deck: Deck
  question: CardSide
  answer: CardSide
}

export default function StudyPage() {
  const { deckId = '' } = useParams()
  const navigate = useNavigate()
  const deck = useLiveQuery(() => db.decks.get(deckId), [deckId], null)
  const cards = useLiveQuery(() => db.cards.where('deckId').equals(deckId).toArray(), [deckId])
  const [started, setStarted] = useState<Started>()
  const [remaining, setRemaining] = useState<number>()

  const exit = useCallback(() => navigate(`/decks/${deckId}`), [navigate, deckId])

  // Esc sebelum sesi dimulai juga keluar.
  useEffect(() => {
    if (started) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') exit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [started, exit])

  if (deck === null || cards === undefined) return null
  if (!deck) {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Deck tidak ditemukan.</p>
        <Button asChild className="mt-4">
          <Link to="/decks">Kembali</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-safe" style={deckThemeStyle(deck.theme)}>
      <header className="flex items-center gap-2 border-b px-2 py-1">
        <Button variant="ghost" size="icon" aria-label="Keluar sesi (Esc)" onClick={exit}>
          <X aria-hidden />
        </Button>
        <h1 className="min-w-0 flex-1 truncate font-semibold">{deck.name}</h1>
        {started && remaining !== undefined && (
          <span className="px-3 text-sm text-muted-foreground" aria-live="polite">
            {remaining} tersisa
          </span>
        )}
      </header>
      {started ? (
        <FlipSessionView
          deck={started.deck}
          question={started.question}
          answer={started.answer}
          onExit={exit}
          onRemainingChange={setRemaining}
        />
      ) : (
        <div className="flex flex-1 items-center overflow-y-auto p-4">
          <StudySetup sides={availableSides(cards)} onStart={(question, answer) => setStarted({ deck, question, answer })} />
        </div>
      )}
    </div>
  )
}
