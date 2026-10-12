import { CardSide } from '@/components/CardSide'
import { cn } from '@/lib/utils'
import type { SideView } from './sides'

interface FlipCardProps {
  question: SideView
  answers: SideView[]
  revealed: boolean
  onFlip: () => void
}

const face =
  'backface-hidden flex min-h-[45dvh] flex-col items-center justify-center gap-4 rounded-xl border bg-card p-5 shadow-sm [grid-area:1/1] sm:p-8'

/** Kartu dengan animasi flip 3D; tap/klik untuk membalik. */
export function FlipCard({ question, answers, revealed, onFlip }: FlipCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={revealed ? 'Kartu terbuka. Ketuk untuk melihat pertanyaan' : 'Ketuk untuk membalik kartu'}
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onFlip()
      }}
      className="perspective w-full cursor-pointer select-none rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div
        className={cn('preserve-3d grid transition-transform duration-500 ease-out', revealed && 'rotate-y-180')}
      >
        <div className={face} aria-hidden={revealed}>
          <CardSide {...question} />
        </div>
        <div className={cn(face, 'rotate-y-180')} aria-hidden={!revealed}>
          {answers.map((view, i) => (
            <CardSide key={i} {...view} className={i > 0 ? 'border-t pt-4 text-muted-foreground' : undefined} />
          ))}
        </div>
      </div>
    </div>
  )
}
