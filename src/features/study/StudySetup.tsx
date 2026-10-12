import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CardSide } from '@/types'
import { SIDE_LABELS } from './sides'

interface StudySetupProps {
  sides: CardSide[]
  onStart: (question: CardSide, answer: CardSide) => void
}

function SidePicker({ legend, options, value, onChange }: { legend: string; options: CardSide[]; value: CardSide; onChange: (s: CardSide) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={value === s}
            onClick={() => onChange(s)}
            className={cn(
              'min-h-touch min-w-24 rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              value === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
            )}
          >
            {SIDE_LABELS[s]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Pilih sisi yang ditanyakan dan sisi jawaban sebelum sesi dimulai. */
export function StudySetup({ sides, onStart }: StudySetupProps) {
  const [question, setQuestion] = useState<CardSide>('front')
  const [answer, setAnswer] = useState<CardSide>('back')

  function changeQuestion(s: CardSide) {
    setQuestion(s)
    if (s === answer) setAnswer(sides.find((x) => x !== s) ?? 'back')
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">Mode Flip</h2>
        <p className="text-sm text-muted-foreground">Pilih sisi yang ditanyakan dan sisi jawabannya.</p>
      </div>
      <SidePicker legend="Sisi pertanyaan" options={sides} value={question} onChange={changeQuestion} />
      <SidePicker legend="Sisi jawaban" options={sides.filter((s) => s !== question)} value={answer} onChange={setAnswer} />
      <Button size="lg" className="w-full" onClick={() => onStart(question, answer)} autoFocus>
        Mulai
      </Button>
      <p className="hidden text-xs text-muted-foreground lg:block">
        Shortcut: Spasi = balik · 1–4 = nilai · Esc = keluar
      </p>
    </div>
  )
}
