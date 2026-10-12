import { useCallback, useEffect, useMemo, useState } from 'react'
import { CardSide } from '@/components/CardSide'
import { cn } from '@/lib/utils'
import type { Card } from '@/types'
import { ChoiceResult } from './ChoiceResult'
import type { SessionViewProps } from './FlipSession'
import { buildMcq } from './mcq'
import { SessionBody, SessionGate } from './SessionLayout'
import { isTextInputTarget, resolveChoiceKey } from './shortcuts'
import { answerLabel, hasSideContent, questionView } from './sides'
import { useStudyQueue } from './useStudyQueue'

interface McqSessionProps extends SessionViewProps {
  /** Terbalik: sisi jawaban ditampilkan, pengguna memilih term (sisi pertanyaan). */
  reverse?: boolean
}

export function McqSessionView({ deck, cards, question, answer, reverse, onExit, onRemainingChange }: McqSessionProps) {
  const prompt = reverse ? answer : question
  const target = reverse ? question : answer
  const label = useCallback((c: Card) => answerLabel(c, prompt, target), [prompt, target])
  const filter = useCallback((c: Card) => hasSideContent(c, prompt) && label(c) !== '', [prompt, label])
  const session = useStudyQueue(deck, reverse ? 'mcq-reverse' : 'mcq', filter)
  const { current, status, rate, remaining, studied, shownAt } = session
  const [chosen, setChosen] = useState<{ index: number; at: number } | null>(null)

  useEffect(() => onRemainingChange(remaining), [remaining, onRemainingChange])

  const pool = useMemo(() => cards.map(label), [cards, label])
  // Opsi dibuat ulang untuk setiap kartu yang tampil (termasuk kartu yang diulang).
  const mcq = useMemo(
    () => (current ? buildMcq(label(current), pool) : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [current?.id, studied, pool, label],
  )

  const choose = useCallback(
    (index: number) => {
      if (!chosen && mcq && index < mcq.options.length) setChosen({ index, at: Date.now() })
    },
    [chosen, mcq],
  )
  const next = useCallback(async () => {
    if (!chosen || !mcq) return
    await rate(chosen.index === mcq.correctIndex ? 3 : 1, chosen.at - shownAt)
    setChosen(null)
  }, [chosen, mcq, rate, shownAt])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (status !== 'studying' && e.key !== 'Escape') return
      const action = resolveChoiceKey(e, {
        answered: chosen !== null,
        optionCount: mcq?.options.length ?? 0,
        inTextInput: isTextInputTarget(e.target),
      })
      if (!action) return
      e.preventDefault()
      if (action.type === 'choose') choose(action.index)
      else if (action.type === 'next') void next()
      else onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [status, chosen, mcq, choose, next, onExit])

  return (
    <SessionGate session={session} onExit={onExit}>
      {current && mcq && (
        <SessionBody
          footer={
            chosen ? (
              <ChoiceResult correct={chosen.index === mcq.correctIndex} answer={mcq.options[mcq.correctIndex]} onNext={() => void next()} />
            ) : (
              <p className="py-3 text-center text-sm text-muted-foreground">Pilih jawaban yang benar</p>
            )
          }
        >
          <div className="space-y-4">
            <div className="flex min-h-[25dvh] items-center justify-center rounded-xl border bg-card p-5 shadow-sm">
              <CardSide {...questionView(current, prompt)} />
            </div>
            <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Pilihan jawaban">
              {mcq.options.map((opt, i) => {
                const isCorrect = i === mcq.correctIndex
                const state = chosen ? (isCorrect ? 'correct' : chosen.index === i ? 'wrong' : 'idle') : 'idle'
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={chosen !== null}
                    onClick={() => choose(i)}
                    className={cn(
                      'flex min-h-14 items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
                      state === 'idle' && 'hover:bg-accent',
                      state === 'correct' && 'border-emerald-600 bg-emerald-600/10',
                      state === 'wrong' && 'border-red-600 bg-red-600/10',
                    )}
                  >
                    <kbd className="flex h-7 w-7 shrink-0 items-center justify-center rounded border text-xs text-muted-foreground">{i + 1}</kbd>
                    <span className="min-w-0 break-words">{opt}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </SessionBody>
      )}
    </SessionGate>
  )
}
