import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { previewIntervals } from '@/lib/srs'
import type { Card, CardSide, Deck, RatingValue } from '@/types'
import { FlipCard } from './FlipCard'
import { RatingButtons } from './RatingButtons'
import { SessionBody, SessionGate } from './SessionLayout'
import { isTextInputTarget, resolveFlipKey } from './shortcuts'
import { answerViews, hasSideContent, questionView } from './sides'
import { useStudyQueue } from './useStudyQueue'

export interface SessionViewProps {
  deck: Deck
  /** Semua kartu deck (untuk distraktor / pasangan). */
  cards: Card[]
  question: CardSide
  answer: CardSide
  onExit: () => void
  onRemainingChange: (remaining: number) => void
}

export function FlipSessionView({ deck, question, answer, onExit, onRemainingChange }: SessionViewProps) {
  const filter = useCallback((c: Card) => hasSideContent(c, question), [question])
  const session = useStudyQueue(deck, 'flip', filter)
  const { status, current, currentState, rate, remaining } = session
  const [revealed, setRevealed] = useState(false)
  const flip = useCallback(() => setRevealed((r) => !r), [])
  const rateCard = useCallback(
    async (r: RatingValue) => {
      if (!revealed) return
      await rate(r)
      setRevealed(false)
    },
    [rate, revealed],
  )

  useEffect(() => onRemainingChange(remaining), [remaining, onRemainingChange])

  const intervals = useMemo(
    () => (currentState && revealed ? previewIntervals(currentState, Date.now()) : undefined),
    [currentState, revealed],
  )

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const action = resolveFlipKey(e, { revealed, inTextInput: isTextInputTarget(e.target) })
      if (!action) return
      e.preventDefault()
      if (action.type === 'flip' && status === 'studying') flip()
      else if (action.type === 'rate' && status === 'studying') void rateCard(action.rating)
      else if (action.type === 'exit') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, status, flip, rateCard, onExit])

  return (
    <SessionGate session={session} onExit={onExit}>
      {current && (
        <SessionBody
          footer={
            revealed && intervals ? (
              <RatingButtons intervals={intervals} onRate={(r) => void rateCard(r)} />
            ) : (
              <Button size="lg" className="min-h-16 w-full text-base" onClick={flip}>
                Tampilkan jawaban
                <kbd className="hidden text-xs opacity-75 lg:inline">Spasi</kbd>
              </Button>
            )
          }
        >
          <FlipCard
            key={current.id + session.studied}
            question={questionView(current, question)}
            answers={answerViews(current, question, answer)}
            revealed={revealed}
            onFlip={flip}
          />
        </SessionBody>
      )}
    </SessionGate>
  )
}
