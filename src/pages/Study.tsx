import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FlipSessionView } from '@/features/study/FlipSession'
import { MatchSessionView } from '@/features/study/MatchSession'
import { McqSessionView } from '@/features/study/McqSession'
import { MODE_LABELS } from '@/features/study/modes'
import { StudySetup, type StudyChoice } from '@/features/study/StudySetup'
import { TypingSessionView } from '@/features/study/TypingSession'
import { availableSides } from '@/features/study/sides'
import { db } from '@/lib/db'
import { deckThemeStyle } from '@/lib/themes'
import type { Card, Deck } from '@/types'

interface Started extends StudyChoice {
  deck: Deck
  cards: Card[]
}

const PREF_KEY = 'study-choice:'

function loadChoice(deckId: string): Partial<StudyChoice> | undefined {
  try {
    const raw = localStorage.getItem(PREF_KEY + deckId)
    return raw ? (JSON.parse(raw) as Partial<StudyChoice>) : undefined
  } catch {
    return undefined
  }
}

function saveChoice(deckId: string, choice: StudyChoice): void {
  try {
    localStorage.setItem(PREF_KEY + deckId, JSON.stringify(choice))
  } catch {
    // penyimpanan tidak tersedia; abaikan
  }
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

  const props = started && {
    deck: started.deck,
    cards: started.cards,
    question: started.question,
    answer: started.answer,
    onExit: exit,
    onRemainingChange: setRemaining,
  }

  return (
    <div className="flex h-dvh flex-col bg-background pt-safe" style={deckThemeStyle(deck.theme)}>
      <header className="flex items-center gap-2 border-b px-2 py-1">
        <Button variant="ghost" size="icon" aria-label="Keluar sesi (Esc)" onClick={exit}>
          <X aria-hidden />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-semibold leading-tight">{deck.name}</h1>
          {started && <p className="text-xs text-muted-foreground">{MODE_LABELS[started.mode]}</p>}
        </div>
        {started && remaining !== undefined && (
          <span className="px-3 text-sm text-muted-foreground" aria-live="polite">
            {remaining} {started.mode === 'match' ? 'pasang' : 'tersisa'}
          </span>
        )}
      </header>
      {props && started.mode === 'flip' && <FlipSessionView {...props} />}
      {props && started.mode === 'mcq' && <McqSessionView {...props} />}
      {props && started.mode === 'mcq-reverse' && <McqSessionView {...props} reverse />}
      {props && started.mode === 'typing' && <TypingSessionView {...props} />}
      {props && started.mode === 'match' && <MatchSessionView {...props} />}
      {!started && (
        <div className="flex flex-1 items-start overflow-y-auto p-4 sm:items-center">
          <StudySetup
            sides={availableSides(cards)}
            cardCount={cards.length}
            initial={loadChoice(deck.id)}
            onStart={(choice) => {
              saveChoice(deck.id, choice)
              setStarted({ ...choice, deck, cards })
            }}
          />
        </div>
      )}
    </div>
  )
}
