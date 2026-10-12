import { useCallback, useEffect, useRef, useState } from 'react'
import { loadDeckQueue, recordReview, startSession, updateSession } from '@/lib/store'
import { queueOrder, shouldRequeue } from '@/lib/queue'
import { createInitialState } from '@/lib/srs'
import type { Card, CardSide, CardState, Deck, RatingValue } from '@/types'
import { hasSideContent } from './sides'

export type FlipStatus = 'loading' | 'empty' | 'studying' | 'done'

export interface FlipSession {
  status: FlipStatus
  current: Card | undefined
  currentState: CardState | undefined
  remaining: number
  revealed: boolean
  studied: number
  correct: number
  flip: () => void
  rate: (rating: RatingValue) => Promise<void>
}

export function useFlipSession(deck: Deck, question: CardSide): FlipSession {
  const [status, setStatus] = useState<FlipStatus>('loading')
  const [queue, setQueue] = useState<Card[]>([])
  const [states, setStates] = useState<Map<string, CardState>>(new Map())
  const [revealed, setRevealed] = useState(false)
  const [studied, setStudied] = useState(0)
  const [correct, setCorrect] = useState(0)
  const shownAt = useRef(Date.now())
  const sessionId = useRef<string>()
  const busy = useRef(false)
  const progress = useRef({ studied: 0, correct: 0, ended: false })

  // Tutup sesi (endedAt) saat keluar di tengah jalan.
  useEffect(
    () => () => {
      const p = progress.current
      if (sessionId.current && !p.ended) {
        void updateSession(sessionId.current, { cardsStudied: p.studied, correct: p.correct, endedAt: Date.now() })
      }
    },
    [],
  )

  useEffect(() => {
    let cancelled = false
    void loadDeckQueue(deck, Date.now()).then((q) => {
      if (cancelled) return
      const cards = queueOrder(q).filter((c) => hasSideContent(c, question))
      setQueue(cards)
      setStates(q.states)
      setStatus(cards.length > 0 ? 'studying' : 'empty')
      shownAt.current = Date.now()
    })
    return () => {
      cancelled = true
    }
  }, [deck, question])

  const current = queue[0]

  const flip = useCallback(() => setRevealed((r) => !r), [])

  const rate = useCallback(
    async (rating: RatingValue) => {
      if (!current || !revealed || busy.current) return
      busy.current = true
      try {
        const now = Date.now()
        const prev = states.get(current.id) ?? createInitialState(current.id, now)
        const next = await recordReview({ card: current, state: prev, rating, mode: 'flip', durationMs: now - shownAt.current, now })
        if (!sessionId.current) sessionId.current = (await startSession(deck.id, 'flip')).id
        const nextStudied = studied + 1
        const nextCorrect = correct + (rating >= 3 ? 1 : 0)
        const rest = queue.slice(1)
        const nextQueue = shouldRequeue(next, now) ? [...rest, current] : rest
        const done = nextQueue.length === 0
        progress.current = { studied: nextStudied, correct: nextCorrect, ended: done }
        await updateSession(sessionId.current, {
          cardsStudied: nextStudied,
          correct: nextCorrect,
          ...(done ? { endedAt: Date.now() } : {}),
        })
        setStates((m) => new Map(m).set(current.id, next))
        setQueue(nextQueue)
        setStudied(nextStudied)
        setCorrect(nextCorrect)
        setRevealed(false)
        if (done) setStatus('done')
        shownAt.current = Date.now()
      } finally {
        busy.current = false
      }
    },
    [current, revealed, states, deck.id, studied, correct, queue],
  )

  return {
    status,
    current,
    currentState: current ? states.get(current.id) : undefined,
    remaining: queue.length,
    revealed,
    studied,
    correct,
    flip,
    rate,
  }
}
