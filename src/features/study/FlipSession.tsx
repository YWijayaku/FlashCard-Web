import { useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { previewIntervals } from '@/lib/srs'
import type { CardSide, Deck } from '@/types'
import { FlipCard } from './FlipCard'
import { RatingButtons } from './RatingButtons'
import { isTextInputTarget, resolveFlipKey } from './shortcuts'
import { answerViews, questionView } from './sides'
import { SessionSummary } from './SessionSummary'
import { useFlipSession } from './useFlipSession'

interface FlipSessionProps {
  deck: Deck
  question: CardSide
  answer: CardSide
  onExit: () => void
  onRemainingChange: (remaining: number) => void
}

export function FlipSessionView({ deck, question, answer, onExit, onRemainingChange }: FlipSessionProps) {
  const session = useFlipSession(deck, question)
  const { status, current, currentState, revealed, flip, rate, remaining } = session

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
      else if (action.type === 'rate' && status === 'studying') void rate(action.rating)
      else if (action.type === 'exit') onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, status, flip, rate, onExit])

  if (status === 'loading') return null
  if (status === 'empty') {
    return (
      <div className="m-auto max-w-sm text-center">
        <p className="text-lg font-semibold">Tidak ada kartu untuk dipelajari saat ini.</p>
        <p className="mt-1 text-sm text-muted-foreground">Semua kartu due sudah selesai atau kuota kartu baru habis.</p>
        <Button className="mt-6" onClick={onExit}>
          Kembali
        </Button>
      </div>
    )
  }
  if (status === 'done' || !current) {
    return <SessionSummary studied={session.studied} correct={session.correct} onExit={onExit} />
  }

  return (
    <>
      <div className="flex flex-1 items-center overflow-y-auto px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <FlipCard
            key={current.id + session.studied}
            question={questionView(current, question)}
            answers={answerViews(current, question, answer)}
            revealed={revealed}
            onFlip={flip}
          />
        </div>
      </div>
      <div className="border-t bg-background px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-2xl">
          {revealed && intervals ? (
            <RatingButtons intervals={intervals} onRate={(r) => void rate(r)} />
          ) : (
            <Button size="lg" className="min-h-16 w-full text-base" onClick={flip}>
              Tampilkan jawaban
              <kbd className="hidden text-xs opacity-75 lg:inline">Spasi</kbd>
            </Button>
          )}
        </div>
      </div>
    </>
  )
}
