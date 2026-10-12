import type { Deck } from '@/types'
import { cn } from '@/lib/utils'

export function DeckBadge({ deck, className }: { deck: Pick<Deck, 'icon' | 'color'>; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl', className)}
      style={{ backgroundColor: `${deck.color}22`, boxShadow: `inset 0 0 0 2px ${deck.color}55` }}
    >
      {deck.icon || '📘'}
    </span>
  )
}
