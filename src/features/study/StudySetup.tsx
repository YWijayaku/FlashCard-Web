import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CardSide, StudyMode } from '@/types'
import { MODE_DESCRIPTIONS, MODE_LABELS, STUDY_MODES, modeUnavailableReason } from './modes'
import { SIDE_LABELS } from './sides'

export interface StudyChoice {
  mode: StudyMode
  question: CardSide
  answer: CardSide
}

interface StudySetupProps {
  sides: CardSide[]
  cardCount: number
  initial?: Partial<StudyChoice>
  onStart: (choice: StudyChoice) => void
}

const chip = (active: boolean) =>
  cn(
    'min-h-touch rounded-md border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    active ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-accent',
  )

function SidePicker({ legend, options, value, onChange }: { legend: string; options: CardSide[]; value: CardSide; onChange: (s: CardSide) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((s) => (
          <button key={s} type="button" aria-pressed={value === s} onClick={() => onChange(s)} className={cn(chip(value === s), 'min-w-24')}>
            {SIDE_LABELS[s]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

/** Pilih mode, sisi pertanyaan, dan sisi jawaban sebelum sesi dimulai. */
export function StudySetup({ sides, cardCount, initial, onStart }: StudySetupProps) {
  const valid = (s: CardSide | undefined): s is CardSide => s !== undefined && sides.includes(s)
  const firstMode = STUDY_MODES.find((m) => !modeUnavailableReason(m, cardCount)) ?? 'flip'
  const [mode, setMode] = useState<StudyMode>(
    initial?.mode && !modeUnavailableReason(initial.mode, cardCount) ? initial.mode : firstMode,
  )
  const [question, setQuestion] = useState<CardSide>(valid(initial?.question) ? initial.question : 'front')
  const [answer, setAnswer] = useState<CardSide>(
    valid(initial?.answer) && initial.answer !== question ? initial.answer : (sides.find((s) => s !== question) ?? 'back'),
  )
  const reason = modeUnavailableReason(mode, cardCount)

  function changeQuestion(s: CardSide) {
    setQuestion(s)
    if (s === answer) setAnswer(sides.find((x) => x !== s) ?? 'back')
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-xl border bg-card p-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Mode belajar</legend>
        <div className="grid gap-2">
          {STUDY_MODES.map((m) => {
            const why = modeUnavailableReason(m, cardCount)
            return (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                disabled={why !== null}
                onClick={() => setMode(m)}
                className={cn(chip(mode === m), 'flex flex-col items-start py-2 text-left disabled:cursor-not-allowed disabled:opacity-60')}
              >
                <span>{MODE_LABELS[m]}</span>
                <span className={cn('text-xs font-normal', mode === m ? 'opacity-90' : 'text-muted-foreground')}>
                  {why ?? MODE_DESCRIPTIONS[m]}
                </span>
              </button>
            )
          })}
        </div>
      </fieldset>
      <SidePicker legend="Sisi pertanyaan" options={sides} value={question} onChange={changeQuestion} />
      <SidePicker legend="Sisi jawaban" options={sides.filter((s) => s !== question)} value={answer} onChange={setAnswer} />
      <Button size="lg" className="w-full" disabled={reason !== null} onClick={() => onStart({ mode, question, answer })} autoFocus>
        Mulai
      </Button>
      <p className="hidden text-xs text-muted-foreground lg:block">
        Shortcut: Spasi = balik · 1–4 = nilai / pilih opsi · Enter = kirim jawaban · Esc = keluar
      </p>
    </div>
  )
}
