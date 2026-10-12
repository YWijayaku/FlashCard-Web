import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { maskCloze } from '@/lib/cloze'
import { db, newId } from '@/lib/db'
import { cn } from '@/lib/utils'
import type { Card } from '@/types'
import type { SessionViewProps } from './FlipSession'
import { formatElapsed, initialMatchState, isMatchComplete, makeTiles, pickPairs, tapTile, type MatchPair } from './match'
import { answerLabel, sideText } from './sides'

function toPair(card: Card, question: SessionViewProps['question'], answer: SessionViewProps['answer']): MatchPair {
  const left = card.type === 'cloze' && question === 'front' ? maskCloze(card.front).trim() : sideText(card, question)
  return { id: card.id, left, right: answerLabel(card, question, answer) }
}

/** Mode Match: tidak memperbarui SRS. Maks 6 pasang, tap untuk menjodohkan. */
export function MatchSessionView({ deck, cards, question, answer, onExit, onRemainingChange }: SessionViewProps) {
  const allPairs = useMemo(
    () => cards.map((c) => toPair(c, question, answer)).filter((p) => p.left && p.right && p.left !== p.right),
    [cards, question, answer],
  )
  const [round, setRound] = useState(0)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pairs = useMemo(() => pickPairs(allPairs), [allPairs, round])
  const tiles = useMemo(() => makeTiles(pairs), [pairs])
  const [state, setState] = useState(initialMatchState)
  const [startedAt, setStartedAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())
  const [finishedAt, setFinishedAt] = useState<number>()

  const done = isMatchComplete(state, pairs.length)

  useEffect(() => onRemainingChange(pairs.length - state.matched.size), [pairs.length, state.matched.size, onRemainingChange])

  useEffect(() => {
    if (done) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [done])

  useEffect(() => {
    if (!done || finishedAt) return
    const end = Date.now()
    setFinishedAt(end)
    void db.sessions.add({ id: newId(), deckId: deck.id, mode: 'match', startedAt, endedAt: end, cardsStudied: pairs.length, correct: pairs.length })
  }, [done, finishedAt, deck.id, startedAt, pairs.length])

  useEffect(() => {
    if (!state.wrong) return
    const id = window.setTimeout(() => setState((s) => ({ ...s, wrong: null })), 600)
    return () => window.clearTimeout(id)
  }, [state.wrong])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onExit()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  const restart = useCallback(() => {
    setRound((r) => r + 1)
    setState(initialMatchState)
    setStartedAt(Date.now())
    setNow(Date.now())
    setFinishedAt(undefined)
  }, [])

  if (pairs.length === 0) {
    return (
      <div className="m-auto max-w-sm px-4 text-center">
        <p className="text-lg font-semibold">Tidak ada pasangan kartu yang bisa dipakai.</p>
        <Button className="mt-6" onClick={onExit}>Kembali</Button>
      </div>
    )
  }

  if (done && finishedAt) {
    return (
      <div className="m-auto w-full max-w-sm px-4 text-center">
        <p className="text-4xl" aria-hidden>⏱️</p>
        <h2 className="mt-2 text-xl font-bold">Semua cocok!</h2>
        <p className="mt-4 text-4xl font-bold tabular-nums">{formatElapsed(finishedAt - startedAt)}</p>
        <p className="text-sm text-muted-foreground">{pairs.length} pasang</p>
        <div className="mt-6 grid gap-2">
          <Button size="lg" onClick={restart}>Main lagi</Button>
          <Button size="lg" variant="outline" onClick={onExit} autoFocus>Selesai</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-y-auto px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
      <p className="mb-3 text-center text-2xl font-bold tabular-nums" aria-label="Waktu">
        {formatElapsed(now - startedAt)}
      </p>
      <div className="mx-auto grid w-full max-w-3xl flex-1 grid-cols-3 gap-2 sm:grid-cols-4" role="group" aria-label="Kartu match">
        {tiles.map((t) => {
          const matched = state.matched.has(t.pairId)
          const selected = state.selected === t.key
          const wrong = state.wrong?.includes(t.key)
          return (
            <button
              key={t.key}
              type="button"
              disabled={matched}
              aria-pressed={selected}
              onClick={() => setState((s) => tapTile(s, t.key))}
              className={cn(
                'flex min-h-20 items-center justify-center break-words rounded-lg border bg-card p-2 text-center text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-base',
                selected && 'border-primary bg-primary/10',
                wrong && 'border-red-600 bg-red-600/10',
                matched && 'invisible',
              )}
            >
              {t.text}
            </button>
          )
        })}
      </div>
    </div>
  )
}
