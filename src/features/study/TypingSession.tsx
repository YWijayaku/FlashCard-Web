import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { CardSide } from '@/components/CardSide'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { checkTyping } from '@/lib/typing'
import type { Card } from '@/types'
import { ChoiceResult } from './ChoiceResult'
import type { SessionViewProps } from './FlipSession'
import { SessionBody, SessionGate } from './SessionLayout'
import { isTextInputTarget } from './shortcuts'
import { expectedAnswers, hasSideContent, questionView } from './sides'
import { useStudyQueue } from './useStudyQueue'

export function TypingSessionView({ deck, question, answer, onExit, onRemainingChange }: SessionViewProps) {
  const filter = useCallback(
    (c: Card) => hasSideContent(c, question) && expectedAnswers(c, question, answer).length > 0,
    [question, answer],
  )
  const session = useStudyQueue(deck, 'typing', filter)
  const { current, rate, remaining, shownAt } = session
  const [input, setInput] = useState('')
  const [result, setResult] = useState<{ correct: boolean; at: number } | null>(null)

  useEffect(() => onRemainingChange(remaining), [remaining, onRemainingChange])

  // Esc keluar (tidak aktif saat fokus di kolom jawaban).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isTextInputTarget(e.target)) onExit()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onExit])

  const expected = current ? expectedAnswers(current, question, answer) : []

  function submit(e: FormEvent) {
    e.preventDefault()
    if (result || !input.trim()) return
    setResult({ correct: checkTyping(input, expected), at: Date.now() })
  }

  async function next() {
    if (!result) return
    await rate(result.correct ? 3 : 1, result.at - shownAt)
    setResult(null)
    setInput('')
  }

  return (
    <SessionGate session={session} onExit={onExit}>
      {current && (
        <SessionBody
          footer={
            result ? (
              <ChoiceResult correct={result.correct} answer={expected.join(', ')} onNext={() => void next()} />
            ) : (
              <form onSubmit={submit} className="flex gap-2">
                <Input
                  key={current.id + session.studied}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ketik jawaban…"
                  aria-label="Jawaban"
                  autoFocus
                  autoComplete="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="h-14 text-lg"
                />
                <Button type="submit" size="lg" className="h-14" disabled={!input.trim()}>
                  Kirim
                </Button>
              </form>
            )
          }
        >
          <div className="flex min-h-[35dvh] items-center justify-center rounded-xl border bg-card p-5 shadow-sm">
            <CardSide {...questionView(current, question)} />
          </div>
          {result && !result.correct && (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Jawaban Anda: <span className="line-through">{input}</span>
            </p>
          )}
          {expected.length > 1 && !result && (
            <p className="mt-3 text-center text-xs text-muted-foreground">Pisahkan {expected.length} jawaban dengan koma.</p>
          )}
        </SessionBody>
      )}
    </SessionGate>
  )
}
