import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { maskCloze } from '@/lib/cloze'
import type { Card } from '@/types'

interface CardListItemProps {
  card: Card
  onEdit: () => void
  onDelete: () => void
}

export function CardListItem({ card, onEdit, onDelete }: CardListItemProps) {
  const images = [card.frontImage, card.backImage, card.thirdImage].filter(Boolean).length
  return (
    <li className="flex items-center gap-2 rounded-lg border bg-card p-3">
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{maskCloze(card.front) || '(gambar)'}</div>
        <div className="truncate text-sm text-muted-foreground">
          {card.back || (card.type === 'cloze' ? card.front.replace(/\{\{|\}\}/g, '') : '(gambar)')}
          {card.third ? ` · ${card.third}` : ''}
        </div>
        <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
          {card.type === 'cloze' && <span className="rounded bg-muted px-1.5">cloze</span>}
          {images > 0 && <span className="rounded bg-muted px-1.5">{images} gambar</span>}
        </div>
      </div>
      <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit kartu">
        <Pencil aria-hidden />
      </Button>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Hapus kartu">
        <Trash2 aria-hidden />
      </Button>
    </li>
  )
}
