import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { hasCloze } from '@/lib/cloze'
import { createCard, updateCard, type CardInput } from '@/lib/store'
import type { Card } from '@/types'
import { SideField } from './SideField'

interface CardFormProps {
  deckId: string
  card?: Card
  open: boolean
  onOpenChange: (open: boolean) => void
}

const EMPTY: CardInput = { front: '', back: '', third: '' }

function toInput(card?: Card): CardInput {
  if (!card) return EMPTY
  const { front, back, third = '', frontImage, backImage, thirdImage } = card
  return { front, back, third, frontImage, backImage, thirdImage }
}

export function CardForm({ deckId, card, open, onOpenChange }: CardFormProps) {
  const [value, setValue] = useState<CardInput>(() => toInput(card))
  const [error, setError] = useState<string>()

  useEffect(() => {
    if (open) {
      setValue(toInput(card))
      setError(undefined)
    }
  }, [open, card])

  const set = <K extends keyof CardInput>(key: K, v: CardInput[K]) => setValue((prev) => ({ ...prev, [key]: v }))

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const frontOk = value.front.trim() || value.frontImage
    const backOk = value.back.trim() || value.backImage || hasCloze(value.front)
    if (!frontOk || !backOk) {
      setError('Sisi depan dan belakang wajib diisi (teks atau gambar).')
      return
    }
    if (card) await updateCard(card.id, value)
    else await createCard(deckId, value)
    if (card) onOpenChange(false)
    else setValue(EMPTY) // tetap terbuka untuk menambah kartu berikutnya
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{card ? 'Edit kartu' : 'Kartu baru'}</DialogTitle>
          <DialogDescription>
            Gunakan {'{{jawaban}}'} di sisi depan untuk membuat cloze.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <SideField
            label="Depan"
            required
            text={value.front}
            image={value.frontImage}
            hint={hasCloze(value.front) ? 'Kartu ini akan menjadi kartu cloze.' : undefined}
            onTextChange={(t) => set('front', t)}
            onImageChange={(b) => set('frontImage', b)}
          />
          <SideField
            label="Belakang"
            required={!hasCloze(value.front)}
            text={value.back}
            image={value.backImage}
            onTextChange={(t) => set('back', t)}
            onImageChange={(b) => set('backImage', b)}
          />
          <SideField
            label="Sisi ketiga (opsional)"
            text={value.third ?? ''}
            image={value.thirdImage}
            onTextChange={(t) => set('third', t)}
            onImageChange={(b) => set('thirdImage', b)}
          />
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {card ? 'Batal' : 'Selesai'}
            </Button>
            <Button type="submit">{card ? 'Simpan' : 'Tambah kartu'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
