import { useCallback, useEffect, useRef, useState } from 'react'
import { loadDeckQueue, recordReview, startSession, updateSession } from '@/lib/store'
import { queueOrder, shouldRequeue } from '@/lib/queue'
import { createInitialState } from '@/lib/srs'
import type { Card, CardState, Deck, RatingValue, StudyMode } from '@/types'

export type StudyStatus = 'loading' | 'empty' | 'studying' | 'done'

export interface StudyQueue {
  status: StudyStatus
  current: Card | undefined
  currentState: CardState | undefined
  remaining: number
  studied: number
  correct: number
  /** Waktu kartu saat ini mulai ditampilkan. */
  shownAt: number
  /** Simpan penilaian kartu saat ini lalu lanjut ke kartu berikutnya. */
  rate: (rating: RatingValue, durationMs?: number) => Promise<void>
}

/**
 * Antrian sesi belajar yang memperbarui SRS (Flip, Pilihan Ganda, Typing).
 * `filter` menyaring kartu yang bisa dipakai pada mode tersebut.
 */
export function useStudyQueue(deck: Deck, mode: StudyMode, filter: (card: Card) => boolean): StudyQueue {
  const [status, setStatus] = useState<StudyStatus>('loading')
  const [queue, setQueue] = useState<Card[]>([])
  const [states, setStates] = useState<Map<string, CardState>>(new Map())
  const [studied, setStudied] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [shownAt, setShownAt] = useState(() => Date.now())
  const sessionId = useRef<string>()
  const busy = useRef(false)
  const progress = useRef({ studied: 0, correct: 0, ended: false })
  const filterRef = useRef(filter)

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
      const cards = queueOrder(q).filter(filterRef.current)
      setQueue(cards)
      setStates(q.states)
      setStatus(cards.length > 0 ? 'studying' : 'empty')
      setShownAt(Date.now())
    })
    return () => {
      cancelled = true
    }
  }, [deck])

  const current = queue[0]

  const rate = useCallback(
    async (rating: RatingValue, durationMs?: number) => {
      if (!current || busy.current) return
      busy.current = true
      try {
        const now = Date.now()
        const prev = states.get(current.id) ?? createInitialState(current.id, now)
        const next = await recordReview({ card: current, state: prev, rating, mode, durationMs: durationMs ?? now - shownAt, now })
        if (!sessionId.current) sessionId.current = (await startSession(deck.id, mode)).id
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
        if (done) setStatus('done')
        setShownAt(Date.now())
      } finally {
        busy.current = false
      }
    },
    [current, states, mode, shownAt, deck.id, studied, correct, queue],
  )

  return {
    status,
    current,
    currentState: current ? states.get(current.id) : undefined,
    remaining: queue.length,
    studied,
    correct,
    shownAt,
    rate,
  }
}
