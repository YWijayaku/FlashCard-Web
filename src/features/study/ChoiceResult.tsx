import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChoiceResultProps {
  correct: boolean
  answer: string
  onNext: () => void
}

/** Umpan balik benar/salah + tombol lanjut (Spasi/Enter). */
export function ChoiceResult({ correct, answer, onNext }: ChoiceResultProps) {
  return (
    <div className="space-y-2">
      <p role="status" className={correct ? 'flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400' : 'flex items-center gap-2 font-semibold text-red-600 dark:text-red-400'}>
        {correct ? <Check className="h-5 w-5" aria-hidden /> : <X className="h-5 w-5" aria-hidden />}
        {correct ? 'Benar!' : <span className="min-w-0 break-words">Salah. Jawaban: {answer}</span>}
      </p>
      <Button size="lg" className="min-h-14 w-full text-base" onClick={onNext} autoFocus>
        Lanjut
        <kbd className="hidden text-xs opacity-75 lg:inline">Enter</kbd>
      </Button>
    </div>
  )
}
