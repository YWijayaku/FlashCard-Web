import { RATING_LABELS, RATINGS } from '@/lib/srs'
import { cn } from '@/lib/utils'
import type { RatingValue } from '@/types'

const COLORS: Record<RatingValue, string> = {
  1: 'bg-red-600 hover:bg-red-700',
  2: 'bg-amber-600 hover:bg-amber-700',
  3: 'bg-emerald-600 hover:bg-emerald-700',
  4: 'bg-sky-600 hover:bg-sky-700',
}

interface RatingButtonsProps {
  intervals: Record<RatingValue, string>
  disabled?: boolean
  onRate: (rating: RatingValue) => void
}

export function RatingButtons({ intervals, disabled, onRate }: RatingButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2" role="group" aria-label="Penilaian">
      {RATINGS.map((r) => (
        <button
          key={r}
          type="button"
          disabled={disabled}
          onClick={() => onRate(r)}
          aria-label={`${RATING_LABELS[r]}, berikutnya ${intervals[r]} (tombol ${r})`}
          className={cn(
            'flex min-h-16 flex-col items-center justify-center rounded-lg px-1 py-2 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50',
            COLORS[r],
          )}
        >
          <span className="text-sm font-semibold leading-tight">{RATING_LABELS[r]}</span>
          <span className="text-xs opacity-90">{intervals[r]}</span>
          <kbd className="mt-0.5 hidden text-[10px] opacity-75 lg:block">{r}</kbd>
        </button>
      ))}
    </div>
  )
}
